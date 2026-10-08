import {
  AGENT_IDS,
  AgentSchema,
  AppPreferencesSchema,
  OfficeServiceError,
  ReportFiltersSchema,
  ReportSchema,
  RunSchema,
  TaskSchema,
  canTransitionDeliveryStatus,
  canTransitionExecutionStatus,
  canTransitionReportProcessingStatus,
  type AppPreferencesPatch,
  type OfficeResult,
  type OfficeService,
  type Report,
  type ReportFilters,
  type Run,
  type Task
} from "@investment-office/shared";
import { z } from "zod";
import { DEMO_FIXTURE_VERSION, DEMO_STORAGE_KEY, createDemoFixture, type DemoSnapshot } from "./fixtures";
import { DEMO_SCENARIOS, getDemoScenarioInfo, isDemoScenario, type DemoScenario } from "./scenarios";

const DemoSnapshotSchema = z.object({
  scenario: z.string().refine(isDemoScenario),
  clockAt: z.string().datetime({ offset: true }),
  nextRunNumber: z.number().int().positive(),
  agents: z.array(AgentSchema),
  tasks: z.array(TaskSchema),
  reports: z.array(ReportSchema),
  runs: z.array(RunSchema),
  idempotencyKeys: z.record(z.string(), z.string()),
  preferences: AppPreferencesSchema
}).superRefine((snapshot, context) => {
  const agentIds = new Set(snapshot.agents.map((agent) => agent.id));
  const taskIds = new Set(snapshot.tasks.map((task) => task.id));
  const tasksByAgent = new Map<string, number>();
  const runById = new Map(snapshot.runs.map((run) => [run.id, run]));
  const reportById = new Map(snapshot.reports.map((report) => [report.id, report]));

  for (const agentId of AGENT_IDS) {
    if (!agentIds.has(agentId)) {
      context.addIssue({ code: "custom", path: ["agents"], message: `Missing demo analyst: ${agentId}.` });
    }
  }
  for (const task of snapshot.tasks) {
    tasksByAgent.set(task.agentId, (tasksByAgent.get(task.agentId) ?? 0) + 1);
  }
  for (const agentId of AGENT_IDS) {
    if (tasksByAgent.get(agentId) !== 1) {
      context.addIssue({ code: "custom", path: ["tasks"], message: `Expected one demo task for ${agentId}.` });
    }
  }
  for (const report of snapshot.reports) {
    const linkedRun = runById.get(report.runId);
    if (!agentIds.has(report.agentId) || !taskIds.has(report.taskId) || !linkedRun || linkedRun.reportId !== report.id) {
      context.addIssue({ code: "custom", path: ["reports"], message: `Report ${report.id} has incomplete fixture links.` });
    }
    if (report.mode !== "demo" || report.sources.some((source) => !source.illustrative)) {
      context.addIssue({ code: "custom", path: ["reports"], message: `Report ${report.id} must remain illustrative demo data.` });
    }
  }
  for (const run of snapshot.runs) {
    if (run.reportId && !reportById.has(run.reportId)) {
      context.addIssue({ code: "custom", path: ["runs"], message: `Run ${run.id} references a missing report.` });
    }
  }
  for (const [key, runId] of Object.entries(snapshot.idempotencyKeys)) {
    if (!key || !runById.has(runId)) {
      context.addIssue({ code: "custom", path: ["idempotencyKeys"], message: "A demo request key points to a missing run." });
    }
  }
});

type PersistedDemoState = {
  fixtureVersion: number;
  state: DemoSnapshot;
};

const RUN_START_DELAY_MS = 250;
const RUN_FINISH_DELAY_MS = 650;

export type DemoControlSnapshot = {
  scenario: DemoScenario;
  label: string;
  description: string;
  agentCount: number;
  taskCount: number;
  reportCount: number;
};

export type DemoControls = {
  getSnapshot(): DemoControlSnapshot;
  setScenario(scenario: DemoScenario): void;
  reset(): void;
  subscribe(listener: () => void): () => void;
};

export type DemoOfficeInstance = {
  service: OfficeService;
  controls: DemoControls;
};

function getBrowserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function loadState(storage: Storage | null): DemoSnapshot | null {
  if (!storage) return null;

  try {
    const raw = storage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;

    const persisted = JSON.parse(raw) as Partial<PersistedDemoState>;
    const previousFixtureVersion = DEMO_FIXTURE_VERSION - 1;
    if (persisted.fixtureVersion !== DEMO_FIXTURE_VERSION && persisted.fixtureVersion !== previousFixtureVersion) {
      storage.removeItem(DEMO_STORAGE_KEY);
      return null;
    }

    const result = DemoSnapshotSchema.safeParse(persisted.state);
    if (!result.success) {
      storage.removeItem(DEMO_STORAGE_KEY);
      return null;
    }

    const state = result.data as DemoSnapshot;
    const migratedFixtureVersion = persisted.fixtureVersion === previousFixtureVersion;
    let identityChanged = false;
    state.agents = state.agents.map((agent) => {
      if (agent.id === "market" && migratedFixtureVersion && agent.displayName !== "Rex") {
        identityChanged = true;
        return { ...agent, displayName: "Rex" };
      }
      if (agent.id === "portfolio" && agent.displayName !== "Paz") {
        identityChanged = true;
        return { ...agent, displayName: "Paz" };
      }
      if (agent.id === "risk" && (agent.displayName !== "Wolffe" || agent.title !== "AI & Technology Analyst")) {
        identityChanged = true;
        return { ...agent, displayName: "Wolffe", title: "AI & Technology Analyst" };
      }
      return agent;
    });
    if (migratedFixtureVersion || identityChanged) {
      try {
        storage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ fixtureVersion: DEMO_FIXTURE_VERSION, state } satisfies PersistedDemoState));
      } catch {
        // Keep the migrated session usable when storage is unavailable or quota-limited.
      }
    }

    return state;
  } catch {
    try {
      storage.removeItem(DEMO_STORAGE_KEY);
    } catch {
      // Storage may be disabled or quota-limited; the in-memory fixture remains usable.
    }
    return null;
  }
}

function toIso(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

function matchesFilters(report: Report, filters: ReportFilters): boolean {
  if (filters.agentId && report.agentId !== filters.agentId) return false;
  if (filters.unreadOnly && report.readAt !== null) return false;
  if (filters.generatedFrom && Date.parse(report.generatedAt) < Date.parse(filters.generatedFrom)) return false;
  if (filters.generatedTo && Date.parse(report.generatedAt) > Date.parse(filters.generatedTo)) return false;

  const query = filters.query?.trim().toLowerCase();
  if (query) {
    const searchableText = [report.title, report.summary, ...report.findings].join(" ").toLowerCase();
    if (!searchableText.includes(query)) return false;
  }

  return true;
}

function createRunReport(run: Run, task: Task, generatedAt: string): Report {
  const reportId = `demo-report-${run.id}`;
  const symbol = "DEMO-SAMPLE";

  return ReportSchema.parse({
    id: reportId,
    agentId: run.agentId,
    taskId: task.id,
    runId: run.id,
    title: `${task.name} · illustrative demo run`,
    generatedAt,
    dataAsOf: generatedAt,
    summary: "This bounded simulation created a fictional report to demonstrate the run lifecycle. No network, model, or market-data request was made.",
    findings: [
      "The report was generated entirely from the local demonstration adapter.",
      `${symbol} is a fictional sample symbol and does not identify a real security.`
    ],
    interpretation: "This output exists to exercise the application flow. It is not research, investment advice, or evidence about a real company or market.",
    uncertainties: ["No external source or live data was consulted."],
    missingInputs: ["Real holdings, current market inputs, and verified source material are not connected in demo mode."],
    sources: [{
      id: `${reportId}-source-1`,
      label: "Illustrative reference — local demo fixture; no external source substantiates this fictional output.",
      url: null,
      publishedAt: null,
      retrievedAt: generatedAt,
      illustrative: true
    }],
    metadata: {
      timezone: "Asia/Jakarta",
      elapsedSeconds: 2,
      sampleSymbols: [{ symbol, label: "Fictional sample symbol", illustrative: true }]
    },
    readAt: null,
    processingStatus: "processed",
    mode: "demo"
  });
}

export function createDemoOfficeService(storage: Storage | null = getBrowserStorage()): DemoOfficeInstance {
  let state = loadState(storage) ?? createDemoFixture("standard");
  const listeners = new Set<() => void>();
  const pendingTimers = new Map<string, ReturnType<typeof setTimeout>[]>();

  function persistAndNotify(): void {
    if (storage) {
      try {
        const persisted: PersistedDemoState = { fixtureVersion: DEMO_FIXTURE_VERSION, state };
        storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(persisted));
      } catch {
        // Keep the current browser session working when storage is unavailable.
      }
    }
    for (const listener of listeners) listener();
  }

  function advanceClock(seconds = 1): string {
    state.clockAt = toIso(Date.parse(state.clockAt) + seconds * 1000);
    return state.clockAt;
  }

  function currentResult<T>(data: T): OfficeResult<T> {
    return { data: clone(data), dataMode: "demo", observedAt: state.clockAt };
  }

  function clearRunTimers(): void {
    for (const timers of pendingTimers.values()) {
      for (const timer of timers) clearTimeout(timer);
    }
    pendingTimers.clear();
  }

  function updateRun(runId: string, updater: (run: Run) => Run, persist = true): Run | null {
    const index = state.runs.findIndex((candidate) => candidate.id === runId);
    if (index === -1) return null;
    const current = state.runs[index]!;
    const updated = RunSchema.parse(updater(current));
    if (!canTransitionExecutionStatus(current.executionStatus, updated.executionStatus)) {
      throw new OfficeServiceError("conflict", `Run cannot move from ${current.executionStatus} to ${updated.executionStatus}.`);
    }
    if (!canTransitionDeliveryStatus(current.deliveryStatus, updated.deliveryStatus)) {
      throw new OfficeServiceError("conflict", `Delivery cannot move from ${current.deliveryStatus} to ${updated.deliveryStatus}.`);
    }
    if (!canTransitionReportProcessingStatus(current.reportProcessingStatus, updated.reportProcessingStatus)) {
      throw new OfficeServiceError("conflict", `Report processing cannot move from ${current.reportProcessingStatus} to ${updated.reportProcessingStatus}.`);
    }
    state.runs[index] = updated;
    if (persist) persistAndNotify();
    return updated;
  }

  function scheduleRunProgress(runId: string): void {
    const firstTimer = setTimeout(() => {
      const queued = state.runs.find((run) => run.id === runId);
      if (!queued || queued.executionStatus !== "queued") {
        pendingTimers.delete(runId);
        return;
      }

      const running = updateRun(runId, (run) => ({
        ...run,
        executionStatus: "running",
        startedAt: advanceClock(1)
      }));
      if (!running) {
        pendingTimers.delete(runId);
        return;
      }

      const finishTimer = setTimeout(() => {
        const current = state.runs.find((run) => run.id === runId);
        const task = current && state.tasks.find((candidate) => candidate.id === current.taskId);
        if (!current || current.executionStatus !== "running" || !task) {
          pendingTimers.delete(runId);
          return;
        }

        if (state.scenario === "run-fails") {
          updateRun(runId, (run) => ({
            ...run,
            executionStatus: "failed",
            deliveryStatus: "unknown",
            reportProcessingStatus: "failed",
            finishedAt: advanceClock(2),
            errorSummary: "Illustrative simulated failure. No research request was sent."
          }));
        } else {
          const finishedAt = advanceClock(2);
          const report = createRunReport(current, task, finishedAt);
          const complete = updateRun(runId, (run) => ({
            ...run,
            executionStatus: "succeeded",
            deliveryStatus: "delivered",
            reportProcessingStatus: "processed",
            finishedAt,
            reportId: report.id,
            errorSummary: null
          }), false);
          if (complete) {
            if (!state.reports.some((candidate) => candidate.runId === runId)) state.reports.unshift(report);
            persistAndNotify();
          }
        }

        pendingTimers.delete(runId);
      }, RUN_FINISH_DELAY_MS);

      pendingTimers.set(runId, [finishTimer]);
    }, RUN_START_DELAY_MS);

    pendingTimers.set(runId, [firstTimer]);
  }

  const service: OfficeService = {
    async listAgents() {
      return currentResult(state.agents);
    },
    async getAgent(id) {
      return currentResult(state.agents.find((agent) => agent.id === id) ?? null);
    },
    async listTasks(agentId) {
      return currentResult(agentId ? state.tasks.filter((task) => task.agentId === agentId) : state.tasks);
    },
    async listRuns(agentId) {
      return currentResult(
        state.runs
          .filter((run) => !agentId || run.agentId === agentId)
          .sort((a, b) => Date.parse(b.queuedAt) - Date.parse(a.queuedAt))
      );
    },
    async listReports(filters = {}, cursor = null) {
      const parsedFilters = ReportFiltersSchema.safeParse(filters);
      if (!parsedFilters.success) throw new OfficeServiceError("invalid-argument", "Report filters are invalid.");
      const offset = cursor === null ? 0 : Number(cursor);
      if (!Number.isSafeInteger(offset) || offset < 0) {
        throw new OfficeServiceError("invalid-argument", "Report cursor must be a non-negative integer offset.");
      }

      const filtered = state.reports
        .filter((report) => matchesFilters(report, parsedFilters.data))
        .sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt));
      const pageSize = parsedFilters.data.pageSize ?? 10;
      const items = filtered.slice(offset, offset + pageSize);
      const nextOffset = offset + items.length;
      return currentResult({
        items,
        nextCursor: nextOffset < filtered.length ? String(nextOffset) : null,
        hasMore: nextOffset < filtered.length
      });
    },
    async getReport(id) {
      return currentResult(state.reports.find((report) => report.id === id) ?? null);
    },
    async markReportRead(id) {
      const index = state.reports.findIndex((report) => report.id === id);
      if (index === -1) return currentResult(null);
      const report = state.reports[index]!;
      if (report.readAt === null) {
        state.reports[index] = ReportSchema.parse({ ...report, readAt: advanceClock(1) });
        persistAndNotify();
      }
      return currentResult(state.reports[index]!);
    },
    async requestRun(taskId, idempotencyKey) {
      const key = idempotencyKey.trim();
      if (!key || key.length > 200) throw new OfficeServiceError("invalid-argument", "A valid idempotency key is required.");

      const priorRunId = state.idempotencyKeys[key];
      const priorRequest = state.runs.find((run) => run.id === priorRunId || run.idempotencyKey === key);
      if (priorRequest) return currentResult({ run: priorRequest, reused: true });

      const task = state.tasks.find((candidate) => candidate.id === taskId);
      if (!task) throw new OfficeServiceError("not-found", `Task ${taskId} was not found.`);
      if (!task.enabled) throw new OfficeServiceError("conflict", "This demo task is disabled.");

      const activeRun = state.runs.find((run) => run.taskId === taskId && ["queued", "running"].includes(run.executionStatus));
      if (activeRun) {
        state.idempotencyKeys[key] = activeRun.id;
        persistAndNotify();
        return currentResult({ run: activeRun, reused: true });
      }

      const run = RunSchema.parse({
        id: `demo-run-${String(state.nextRunNumber).padStart(3, "0")}`,
        taskId,
        agentId: task.agentId,
        idempotencyKey: key,
        executionStatus: "queued",
        deliveryStatus: "pending",
        reportProcessingStatus: "pending",
        queuedAt: advanceClock(1),
        startedAt: null,
        finishedAt: null,
        reportId: null,
        reason: null,
        errorSummary: null,
        mode: "demo"
      });
      state.nextRunNumber += 1;
      state.idempotencyKeys[key] = run.id;
      state.runs.unshift(run);
      persistAndNotify();
      scheduleRunProgress(run.id);
      return currentResult({ run, reused: false });
    },
    async getRun(id) {
      return currentResult(state.runs.find((run) => run.id === id) ?? null);
    },
    async getPreferences() {
      return currentResult(state.preferences);
    },
    async updatePreferences(patch: AppPreferencesPatch) {
      const parsed = AppPreferencesSchema.safeParse({ ...state.preferences, ...patch });
      if (!parsed.success) throw new OfficeServiceError("invalid-argument", "Preferences are invalid.");
      state.preferences = parsed.data;
      advanceClock(1);
      persistAndNotify();
      return currentResult(state.preferences);
    }
  };

  const controls: DemoControls = {
    getSnapshot() {
      const info = getDemoScenarioInfo(state.scenario);
      return {
        scenario: state.scenario,
        label: info.label,
        description: info.description,
        agentCount: state.agents.length,
        taskCount: state.tasks.length,
        reportCount: state.reports.length
      };
    },
    setScenario(scenario) {
      clearRunTimers();
      state = createDemoFixture(scenario);
      persistAndNotify();
    },
    reset() {
      clearRunTimers();
      state = createDemoFixture("standard");
      persistAndNotify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };

  // Validate the fixture on creation too; local persistence is never trusted as a type source.
  const initialState = DemoSnapshotSchema.safeParse(state);
  if (!initialState.success) {
    state = createDemoFixture("standard");
  } else {
    state = initialState.data as DemoSnapshot;
  }

  let recoveredActiveRun = false;
  state.runs = state.runs.map((run) => {
    if (run.executionStatus !== "queued" && run.executionStatus !== "running") return run;
    recoveredActiveRun = true;
    return RunSchema.parse({
      ...run,
      executionStatus: "interrupted",
      deliveryStatus: run.deliveryStatus === "pending" ? "unknown" : run.deliveryStatus,
      finishedAt: state.clockAt,
      errorSummary: "Demo run interrupted when the page was reopened."
    });
  });
  if (recoveredActiveRun) persistAndNotify();

  return { service, controls };
}

export { DEMO_SCENARIOS };
