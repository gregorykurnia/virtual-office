import type { ExecutionStatus } from "@investment-office/shared";

export const PINNED_OPENCLAW_VERSION = "2026.9.8";

export type RuntimeMode = "openclaw-cli" | "mock";

export type RuntimeCapabilities = {
  mode: RuntimeMode;
  runtimeVersion: string | null;
  expectedVersion: string | null;
  available: boolean;
  features: {
    agentListing: boolean;
    taskRead: boolean;
    taskCreate: boolean;
    taskUpdate: boolean;
    manualRun: boolean;
    runHistory: boolean;
    scheduleActivation: boolean;
    inputSnapshotBinding: boolean;
    cancellation: boolean;
    eventStreaming: boolean;
  };
  errorCode: string | null;
};

export type RuntimeHealth = {
  mode: RuntimeMode;
  status: "available" | "unavailable" | "simulated";
  available: boolean;
  runtimeVersion: string | null;
  gatewayVersion: string | null;
  observedAt: string;
  errorCode: string | null;
};

export type ExternalAgent = {
  externalAgentId: string;
  displayName: string;
  isDefault: boolean;
  rawStatus: string | null;
};

export type AllowedTaskSchedule = {
  kind: "cron";
  expression: string;
  timezone: string;
};

/**
 * New runtime tasks are always isolated and created disabled. Enabling a
 * recurring task is intentionally left to the reviewed provisioning flow.
 */
export type AllowedTaskDefinition = {
  name: string;
  agentId: string;
  message: string;
  schedule: AllowedTaskSchedule;
  timeoutSeconds?: number;
};

/** A patch may disable a schedule but cannot enable it. */
export type AllowedTaskPatch = {
  name?: string;
  agentId?: string;
  message?: string;
  schedule?: AllowedTaskSchedule;
  timeoutSeconds?: number;
  enabled?: false;
};

export type ObservedTask = {
  source: RuntimeMode;
  externalJobId: string;
  name: string;
  agentId: string | null;
  enabled: boolean;
  schedule: {
    kind: string | null;
    expression: string | null;
    timezone: string | null;
  };
  sessionTarget: string | null;
  payloadKind: string | null;
  rawStatus: string | null;
  lastRunStatus: string | null;
  runningAt: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  observedAt: string;
};

export type AcceptedExternalRun = {
  externalJobId: string;
  externalRunId: string;
  accepted: true;
  acceptedAt: string;
  processInstanceId: string | null;
};

export type ObservedRun = {
  source: RuntimeMode;
  externalJobId: string;
  externalRunId: string;
  executionStatus: ExecutionStatus;
  rawStatus: string | null;
  rawCompletionStatus: string | null;
  rawDeliveryStatus: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  summary: string | null;
  observedAt: string;
};

export type ObservedRunPage = {
  items: ObservedRun[];
  nextCursor: string | null;
  observedAt: string;
};

export interface ResearchRuntimeAdapter {
  getCapabilities(): Promise<RuntimeCapabilities>;
  checkHealth(): Promise<RuntimeHealth>;
  listAgents(): Promise<ExternalAgent[]>;
  getTask(externalJobId: string): Promise<ObservedTask>;
  createTask(definition: AllowedTaskDefinition): Promise<ObservedTask>;
  updateTask(externalJobId: string, patch: AllowedTaskPatch): Promise<ObservedTask>;
  requestRun(externalJobId: string): Promise<AcceptedExternalRun>;
  getRun(externalJobId: string, externalRunId: string): Promise<ObservedRun>;
  listRuns(externalJobId: string, cursor?: string): Promise<ObservedRunPage>;
}
