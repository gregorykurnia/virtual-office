import {
  AGENT_IDS,
  OfficeServiceError,
  type Agent,
  type AgentId,
  type AppPreferences,
  type OfficeResult,
  type OfficeService,
  type Report,
  type ReportFilters,
  type Run,
  type Task
} from "@investment-office/shared";
import { getAuth } from "firebase/auth";
import { firebaseApp } from "../lib/firebase";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

type Envelope<T> = { data: T; dataMode: "live"; observedAt: string };
type ApiAgent = {
  id: AgentId; roleKey: AgentId; displayName: string; title: string; responsibility: string;
  avatarKey: string; deskKey: string; enabled: boolean; createdAt: string; updatedAt: string;
  availability: { status: "working" | "waiting" | "unknown"; statusLabel: string; activeRunId: string | null; lastObservedAt: string | null };
};
type ApiTask = {
  id: string; agentId: AgentId; definitionKey: string; name: string; purpose: string; inputs: string[];
  missingInputs: string[]; externalJobId: string | null; enabled: boolean;
  schedule: { expression: string; timezone: string; label: string }; observedNextRunAt: string | null;
};
type ApiRun = {
  id: string; taskId: string; agentId: AgentId; requestOrigin: string; executionStatus: Run["executionStatus"];
  deliveryStatus: Run["deliveryStatus"]; processingStatus: Run["reportProcessingStatus"];
  queuedAt: string; startedAt: string | null; endedAt: string | null; observedAt: string;
  reportId: string | null; errorSummary: string | null; errorCode: string | null;
};
type ApiReport = {
  id: string; agentId: AgentId; taskId: string; runId: string; title: string; summary: string;
  bodyMarkdown: string; generatedAt: string; dataAsOf: string | null; mode: "live" | "demo";
  readAt: string | null; processingStatus: Report["processingStatus"];
};
type ApiSource = { id: string; label: string; url: string | null; publishedAt: string | null; retrievedAt: string | null; illustrative: boolean };

function reportFromApi(value: ApiReport, sources: ApiSource[] = []): Report {
  return {
    id: value.id,
    agentId: value.agentId,
    taskId: value.taskId,
    runId: value.runId,
    title: value.title,
    generatedAt: value.generatedAt,
    dataAsOf: value.dataAsOf,
    summary: value.summary,
    findings: [],
    bodyMarkdown: value.bodyMarkdown,
    interpretation: "",
    uncertainties: [],
    missingInputs: [],
    sources: sources.map((source) => ({ ...source, retrievedAt: source.retrievedAt, illustrative: source.illustrative })),
    metadata: { timezone: "Asia/Jakarta", elapsedSeconds: null, sampleSymbols: [] },
    readAt: value.readAt,
    processingStatus: value.processingStatus,
    mode: value.mode
  };
}

function runFromApi(value: ApiRun): Run {
  return {
    id: value.id,
    taskId: value.taskId,
    agentId: value.agentId,
    idempotencyKey: null,
    executionStatus: value.executionStatus,
    deliveryStatus: value.deliveryStatus,
    reportProcessingStatus: value.processingStatus,
    queuedAt: value.queuedAt,
    startedAt: value.startedAt,
    finishedAt: value.endedAt,
    reportId: value.reportId,
    reason: null,
    errorSummary: value.errorSummary,
    mode: "live"
  };
}

function agentFromApi(value: ApiAgent, tasks: Task[] = []): Agent {
  const status = value.availability.status;
  return {
    id: value.id,
    role: value.roleKey,
    // Keep the visible identity aligned with approved cosmetic replacements if a saved live record still has its former name.
    displayName: value.roleKey === "portfolio" ? "Paz" : value.roleKey === "risk" ? "Wolffe" : value.displayName,
    title: value.roleKey === "risk" ? "AI & Technology Analyst" : value.title,
    responsibility: value.responsibility,
    avatarKey: value.avatarKey,
    deskKey: value.deskKey,
    status,
    statusLabel: value.availability.statusLabel,
    currentTaskId: tasks.find((task) => task.enabled)?.id ?? null,
    observedAt: value.availability.lastObservedAt
  };
}

function taskFromApi(value: ApiTask): Task {
  return {
    id: value.id,
    agentId: value.agentId,
    name: value.name,
    purpose: value.purpose,
    inputs: value.inputs,
    missingInputs: value.missingInputs,
    enabled: value.enabled,
    scheduleLabel: value.schedule.label,
    timezone: value.schedule.timezone,
    nextRunAt: value.observedNextRunAt
  };
}

function mapError(status: number, code: string, message: string): OfficeServiceError {
  const mapped = status === 404 ? "not-found" : status === 409 || status === 503 ? "conflict" : "invalid-argument";
  return new OfficeServiceError(mapped, message || code || "The live office request failed.");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<Envelope<T>> {
  const user = firebaseApp ? getAuth(firebaseApp).currentUser : null;
  if (!user) throw new OfficeServiceError("conflict", "Sign in again to access live office data.");
  const token = await user.getIdToken();
  const base = `${apiBaseUrl.replace(/\/$/, "")}/`;
  const url = new URL(path.replace(/^\//, ""), new URL(base, window.location.origin));
  if (url.origin !== window.location.origin) throw new OfficeServiceError("invalid-argument", "The live API must use the application origin.");
  const response = await fetch(url.pathname + url.search, {
    ...init,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    credentials: "omit",
    cache: "no-store"
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = typeof payload === "object" && payload !== null && "error" in payload ? payload.error : null;
    const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "request_failed";
    const message = typeof error === "object" && error !== null && "message" in error && typeof error.message === "string" ? error.message : "The live office request could not be completed.";
    throw mapError(response.status, code, message);
  }
  if (typeof payload !== "object" || payload === null || !("data" in payload) || !("observedAt" in payload)) {
    throw new OfficeServiceError("conflict", "The live API returned an invalid response.");
  }
  return payload as Envelope<T>;
}

async function profile(agentId: AgentId) {
  return request<{ agent: ApiAgent; tasks: ApiTask[]; latestReports: ApiReport[]; missingInputs: string[] }>(`agents/${agentId}`);
}

async function listAllTasks(agentId?: AgentId): Promise<Envelope<Task[]>> {
  const ids = agentId ? [agentId] : AGENT_IDS;
  const results = await Promise.all(ids.map(profile));
  return { dataMode: "live", observedAt: results.reduce((latest, result) => result.observedAt > latest ? result.observedAt : latest, ""), data: results.flatMap((result) => result.data.tasks.map(taskFromApi)) };
}

export const httpOfficeService: OfficeService & { getConnection(): Promise<Envelope<{ status: string; available: boolean; stale: boolean; lastSuccessfulCheckAt: string | null; capabilities: string[] }>> } = {
  async listAgents() {
    const response = await request<ApiAgent[]>("agents");
    return { ...response, data: response.data.map((agent) => agentFromApi(agent)) };
  },
  async getAgent(id) {
    const response = await profile(id);
    return { ...response, data: response.data ? agentFromApi(response.data.agent, response.data.tasks.map(taskFromApi)) : null };
  },
  listTasks: listAllTasks,
  async listRuns(agentId) {
    const response = await request<{ items: ApiRun[]; nextCursor: string | null; hasMore: boolean }>(`runs?pageSize=50${agentId ? `&agentId=${agentId}` : ""}`);
    return { ...response, data: response.data.items.map(runFromApi) };
  },
  async listReports(filters: ReportFilters = {}, cursor: string | null = null) {
    const params = new URLSearchParams({ pageSize: String(filters.pageSize ?? 20) });
    if (filters.agentId) params.set("agentId", filters.agentId);
    if (filters.unreadOnly !== undefined) params.set("unreadOnly", String(filters.unreadOnly));
    if (filters.query) params.set("query", filters.query);
    if (filters.generatedFrom) params.set("generatedFrom", filters.generatedFrom);
    if (filters.generatedTo) params.set("generatedTo", filters.generatedTo);
    if (cursor) params.set("cursor", cursor);
    const response = await request<{ items: ApiReport[]; nextCursor: string | null; hasMore: boolean }>(`reports?${params}`);
    return { ...response, data: { ...response.data, items: response.data.items.map((report) => reportFromApi(report)) } };
  },
  async getReport(id) {
    const response = await request<{ report: ApiReport; sources: ApiSource[]; run: ApiRun | null }>(`reports/${encodeURIComponent(id)}`);
    return { ...response, data: response.data ? reportFromApi(response.data.report, response.data.sources) : null };
  },
  async markReportRead(id) {
    await request<ApiReport>(`reports/${encodeURIComponent(id)}/read`, { method: "PATCH" });
    return this.getReport(id);
  },
  async requestRun(taskId, idempotencyKey) {
    const response = await request<{ run: ApiRun; reused: boolean }>(`tasks/${encodeURIComponent(taskId)}/runs`, {
      method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body: JSON.stringify({})
    });
    return { ...response, data: { run: runFromApi(response.data.run), reused: response.data.reused } };
  },
  async getRun(id) {
    const response = await request<ApiRun>(`runs/${encodeURIComponent(id)}`);
    return { ...response, data: response.data ? runFromApi(response.data) : null };
  },
  async getPreferences(): Promise<OfficeResult<AppPreferences>> {
    throw new OfficeServiceError("conflict", "Preferences are not available in live mode yet.");
  },
  async updatePreferences(): Promise<OfficeResult<AppPreferences>> {
    throw new OfficeServiceError("conflict", "Preferences are not available in live mode yet.");
  },
  getConnection() {
    return request("connection");
  }
};
