import type {
  AcceptedExternalRun,
  AllowedTaskDefinition,
  AllowedTaskPatch,
  ExternalAgent,
  ObservedRun,
  ObservedRunPage,
  ObservedTask,
  ResearchRuntimeAdapter,
  RuntimeCapabilities,
  RuntimeHealth
} from "./types.js";
import { ResearchRuntimeAdapterError } from "./cliAdapter.js";

type StoredTask = { observed: ObservedTask; message: string; timeoutSeconds: number | null };

export type MockResearchRuntimeAdapterOptions = {
  agents?: ExternalAgent[];
  tasks?: Array<{
    observed: ObservedTask;
    message?: string;
    timeoutSeconds?: number | null;
  }>;
  now?: () => Date;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function parseCursor(cursor: string | undefined): number {
  if (cursor === undefined) return 0;
  if (!/^(0|[1-9][0-9]*)$/.test(cursor)) throw new ResearchRuntimeAdapterError("invalid_cursor", "The run-history cursor is invalid.");
  const offset = Number(cursor);
  if (!Number.isSafeInteger(offset) || offset > 10_000_000) throw new ResearchRuntimeAdapterError("invalid_cursor", "The run-history cursor is out of range.");
  return offset;
}

function validJobId(value: string): string {
  if (!/^[A-Za-z0-9_.:-]{1,256}$/.test(value)) throw new ResearchRuntimeAdapterError("invalid_external_id", "The external task ID is invalid.");
  return value;
}

function validAgentId(value: string): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(value) || value === "main") {
    throw new ResearchRuntimeAdapterError("external_agent_not_allowed", "The bootstrap agent is not an Investment Office analyst.");
  }
  return value;
}

export class MockResearchRuntimeAdapter implements ResearchRuntimeAdapter {
  private readonly agents: ExternalAgent[];
  private readonly tasks = new Map<string, StoredTask>();
  private readonly runs = new Map<string, ObservedRun>();
  private readonly now: () => Date;
  private taskSequence = 0;
  private runSequence = 0;

  constructor(options: MockResearchRuntimeAdapterOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.agents = clone(options.agents ?? []);
    for (const task of options.tasks ?? []) {
      this.tasks.set(task.observed.externalJobId, {
        observed: clone({ ...task.observed, source: "mock" }),
        message: task.message ?? "",
        timeoutSeconds: task.timeoutSeconds ?? null
      });
    }
  }

  async getCapabilities(): Promise<RuntimeCapabilities> {
    return {
      mode: "mock",
      runtimeVersion: null,
      expectedVersion: null,
      available: true,
      features: {
        agentListing: true,
        taskRead: true,
        taskCreate: true,
        taskUpdate: true,
        manualRun: true,
        runHistory: true,
        scheduleActivation: false,
        inputSnapshotBinding: false,
        cancellation: false,
        eventStreaming: false
      },
      errorCode: null
    };
  }

  async checkHealth(): Promise<RuntimeHealth> {
    return {
      mode: "mock",
      status: "simulated",
      available: true,
      runtimeVersion: null,
      gatewayVersion: null,
      observedAt: this.now().toISOString(),
      errorCode: null
    };
  }

  async listAgents(): Promise<ExternalAgent[]> {
    return clone(this.agents);
  }

  async getTask(externalJobId: string): Promise<ObservedTask> {
    const task = this.tasks.get(validJobId(externalJobId));
    if (!task) throw new ResearchRuntimeAdapterError("external_task_not_found", "The simulated task was not found.");
    return clone({ ...task.observed, observedAt: this.now().toISOString() });
  }

  async createTask(definition: AllowedTaskDefinition): Promise<ObservedTask> {
    const agentId = validAgentId(definition.agentId);
    this.taskSequence += 1;
    const externalJobId = `mock-job-${this.taskSequence}`;
    const now = this.now().toISOString();
    const task: StoredTask = {
      message: definition.message,
      timeoutSeconds: definition.timeoutSeconds ?? null,
      observed: {
        source: "mock",
        externalJobId,
        name: definition.name,
        agentId,
        enabled: false,
        schedule: {
          kind: definition.schedule.kind,
          expression: definition.schedule.expression,
          timezone: definition.schedule.timezone
        },
        sessionTarget: "isolated",
        payloadKind: "agentTurn",
        rawStatus: "disabled",
        lastRunStatus: null,
        runningAt: null,
        nextRunAt: null,
        lastRunAt: null,
        observedAt: now
      }
    };
    this.tasks.set(externalJobId, task);
    return clone(task.observed);
  }

  async updateTask(externalJobId: string, patch: AllowedTaskPatch): Promise<ObservedTask> {
    const id = validJobId(externalJobId);
    const task = this.tasks.get(id);
    if (!task) throw new ResearchRuntimeAdapterError("external_task_not_found", "The simulated task was not found.");
    if (patch.agentId !== undefined) task.observed.agentId = validAgentId(patch.agentId);
    if (patch.name !== undefined) task.observed.name = patch.name;
    if (patch.schedule !== undefined) {
      task.observed.schedule = {
        kind: patch.schedule.kind,
        expression: patch.schedule.expression,
        timezone: patch.schedule.timezone
      };
    }
    if (patch.message !== undefined) task.message = patch.message;
    if (patch.timeoutSeconds !== undefined) task.timeoutSeconds = patch.timeoutSeconds;
    if (patch.enabled === false) {
      task.observed.enabled = false;
      task.observed.rawStatus = "disabled";
      task.observed.nextRunAt = null;
    }
    task.observed.observedAt = this.now().toISOString();
    return clone(task.observed);
  }

  async requestRun(externalJobId: string): Promise<AcceptedExternalRun> {
    const task = await this.getTask(externalJobId);
    if (!task.agentId || task.agentId === "main" || task.payloadKind !== "agentTurn") {
      throw new ResearchRuntimeAdapterError("external_task_not_allowed", "The simulated task is not a dedicated analyst job.");
    }
    this.runSequence += 1;
    const externalRunId = `mock-run-${this.runSequence}`;
    const acceptedAt = this.now().toISOString();
    this.runs.set(`${task.externalJobId}:${externalRunId}`, {
      source: "mock",
      externalJobId: task.externalJobId,
      externalRunId,
      executionStatus: "queued",
      rawStatus: "accepted",
      rawCompletionStatus: null,
      rawDeliveryStatus: "not-requested",
      startedAt: null,
      finishedAt: null,
      durationMs: null,
      summary: null,
      observedAt: acceptedAt
    });
    return {
      externalJobId: task.externalJobId,
      externalRunId,
      accepted: true,
      acceptedAt,
      processInstanceId: null
    };
  }

  async getRun(externalJobId: string, externalRunId: string): Promise<ObservedRun> {
    const run = this.runs.get(`${validJobId(externalJobId)}:${validJobId(externalRunId)}`);
    if (!run) throw new ResearchRuntimeAdapterError("external_run_not_found", "The simulated run was not found.");
    return clone({ ...run, observedAt: this.now().toISOString() });
  }

  async listRuns(externalJobId: string, cursor?: string): Promise<ObservedRunPage> {
    const jobId = validJobId(externalJobId);
    const offset = parseCursor(cursor);
    const all = [...this.runs.values()]
      .filter((run) => run.externalJobId === jobId)
      .sort((left, right) => right.externalRunId.localeCompare(left.externalRunId));
    const items = all.slice(offset, offset + 50).map(clone);
    const nextOffset = offset + items.length;
    return {
      items,
      nextCursor: nextOffset < all.length ? String(nextOffset) : null,
      observedAt: this.now().toISOString()
    };
  }
}
