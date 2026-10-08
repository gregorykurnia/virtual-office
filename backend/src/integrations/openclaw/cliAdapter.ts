import { execFile } from "node:child_process";
import { isAbsolute } from "node:path";
import { z } from "zod";
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
import { PINNED_OPENCLAW_VERSION } from "./types.js";

const MAX_OUTPUT_BYTES = 512 * 1024;
const RUN_PAGE_SIZE = 50;
const MAX_CURSOR_OFFSET = 10_000_000;
const JOB_ID_SCHEMA = z.string().trim().min(1).max(256).regex(/^[A-Za-z0-9_.:-]+$/);
const RUN_ID_SCHEMA = z.string().trim().min(1).max(256).regex(/^[A-Za-z0-9_.:-]+$/);
const AGENT_ID_SCHEMA = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/).refine((value) => value !== "main");
const CRON_PART = "[0-9*/,-]+";
const CRON_EXPRESSION_SCHEMA = z.string().trim().refine((value) => {
  const fields = value.split(/\s+/);
  return fields.length === 5 && fields.every((field) => new RegExp(`^${CRON_PART}$`).test(field));
}, "Only a five-field numeric cron expression is allowed.");

const AllowedTaskDefinitionSchema = z.object({
  name: z.string().trim().min(1).max(160),
  agentId: AGENT_ID_SCHEMA,
  message: z.string().trim().min(1).max(12_000),
  schedule: z.object({
    kind: z.literal("cron"),
    expression: CRON_EXPRESSION_SCHEMA,
    timezone: z.string().trim().min(1).max(80)
  }).strict(),
  timeoutSeconds: z.number().int().min(1).max(3600).optional()
}).strict();

const AllowedTaskPatchSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  agentId: AGENT_ID_SCHEMA.optional(),
  message: z.string().trim().min(1).max(12_000).optional(),
  schedule: z.object({
    kind: z.literal("cron"),
    expression: CRON_EXPRESSION_SCHEMA,
    timezone: z.string().trim().min(1).max(80)
  }).strict().optional(),
  timeoutSeconds: z.number().int().min(1).max(3600).optional(),
  enabled: z.literal(false).optional()
}).strict().refine((value) => Object.keys(value).length > 0);

const CONNECTION_ENV_KEYS = [
  "OPENCLAW_GATEWAY_URL",
  "OPENCLAW_GATEWAY_PORT",
  "OPENCLAW_GATEWAY_TOKEN",
  "OPENCLAW_GATEWAY_PASSWORD"
] as const;

const SAFE_BASE_ENV_KEYS = ["PATH", "HOME", "USER", "LOGNAME", "LANG", "LC_ALL", "TMPDIR", "TMP", "TEMP"] as const;

export type OpenClawCommandOptions = {
  cwd: string;
  env: NodeJS.ProcessEnv;
  timeoutMs: number;
  maxBufferBytes: number;
  shell: false;
};

export interface OpenClawCommandRunner {
  run(executablePath: string, args: readonly string[], options: OpenClawCommandOptions): Promise<string>;
}

export type OpenClawCliAdapterOptions = {
  executablePath: string;
  connectionConfigPath: string;
  stateDirectory: string;
  workingDirectory: string;
  /** Only the named OpenClaw connection variables are forwarded to the CLI. */
  connectionEnvironment?: Partial<Record<typeof CONNECTION_ENV_KEYS[number], string>>;
  /** IDs already verified and saved in owner-scoped application records. */
  verifiedExternalAgentIds?: readonly string[];
  /** External job-to-agent pairs already verified in owner-scoped application task records. */
  verifiedTaskMappings?: readonly { externalJobId: string; externalAgentId: string }[];
  commandRunner?: OpenClawCommandRunner;
  now?: () => Date;
};

type TaskReadbackExpectation = {
  name?: string | undefined;
  agentId?: string | undefined;
  message?: string | undefined;
  schedule?: AllowedTaskDefinition["schedule"] | undefined;
  timeoutSeconds?: number | undefined;
  enabled?: false | undefined;
};

export class ResearchRuntimeAdapterError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "ResearchRuntimeAdapterError";
  }
}

class OpenClawProcessError extends Error {
  constructor(readonly processCode: string) {
    super("The OpenClaw command did not complete successfully.");
    this.name = "OpenClawProcessError";
  }
}

function defaultCommandRunner(): OpenClawCommandRunner {
  return {
    run(executablePath, args, options) {
      return new Promise((resolve, reject) => {
        execFile(executablePath, [...args], {
          cwd: options.cwd,
          env: options.env,
          timeout: options.timeoutMs,
          maxBuffer: options.maxBufferBytes,
          encoding: "utf8",
          shell: options.shell,
          windowsHide: true
        }, (error, stdout) => {
          if (error) {
            const code = typeof error.code === "string" ? error.code : "process_failed";
            reject(new OpenClawProcessError(code));
            return;
          }
          resolve(stdout);
        });
      });
    }
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function readBoolean(record: Record<string, unknown>, key: string): boolean | null {
  return typeof record[key] === "boolean" ? record[key] as boolean : null;
}

function readFiniteNumber(record: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function asIsoTimestamp(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? null : date.toISOString();
  }
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? null : date.toISOString();
  }
  return null;
}

function parseJson(stdout: string): unknown {
  try {
    return JSON.parse(stdout) as unknown;
  } catch {
    throw new ResearchRuntimeAdapterError("invalid_runtime_output", "OpenClaw returned invalid JSON.");
  }
}

function parseRootRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new ResearchRuntimeAdapterError("invalid_runtime_output", "OpenClaw returned an unexpected JSON shape.");
  return value;
}

function parseRecords(value: unknown, collectionKeys: string[], recordLabel: string): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) throw new ResearchRuntimeAdapterError("invalid_runtime_output", `OpenClaw returned an unexpected ${recordLabel} response.`);
  for (const key of collectionKeys) {
    if (Array.isArray(value[key])) return (value[key] as unknown[]).filter(isRecord);
  }
  if (typeof value.runId === "string" || typeof value.id === "string") return [value];
  throw new ResearchRuntimeAdapterError("invalid_runtime_output", `OpenClaw returned an unexpected ${recordLabel} response.`);
}

function parseJobRecord(value: unknown): Record<string, unknown> {
  const root = parseRootRecord(value);
  if (isRecord(root.job)) return root.job;
  if (isRecord(root.data)) {
    if (isRecord(root.data.job)) return root.data.job;
    if (readString(root.data, "id", "jobId")) return root.data;
  }
  return root;
}

function readSchedule(job: Record<string, unknown>): ObservedTask["schedule"] {
  const schedule = isRecord(job.schedule) ? job.schedule : {};
  return {
    kind: readString(schedule, "kind"),
    expression: readString(schedule, "expr", "cron", "at", "every"),
    timezone: readString(schedule, "tz", "timezone")
  };
}

function normalizeTask(value: unknown, now: Date, source: ObservedTask["source"] = "openclaw-cli"): ObservedTask {
  const job = parseJobRecord(value);
  const externalJobId = readString(job, "id", "jobId");
  const name = readString(job, "name", "displayName");
  const enabled = readBoolean(job, "enabled");
  if (!externalJobId || !name || enabled === null) {
    throw new ResearchRuntimeAdapterError("invalid_runtime_output", "OpenClaw returned an incomplete task definition.");
  }

  const state = isRecord(job.state) ? job.state : {};
  const payload = isRecord(job.payload) ? job.payload : {};
  const status = readString(job, "status")
    ?? readString(state, "lastRunStatus", "status")
    ?? (typeof state.runningAtMs === "number" ? "running" : enabled ? null : "disabled");

  return {
    source,
    externalJobId,
    name,
    agentId: readString(job, "agentId", "effectiveAgentId"),
    enabled,
    schedule: readSchedule(job),
    sessionTarget: readString(job, "sessionTarget"),
    payloadKind: readString(payload, "kind"),
    rawStatus: status,
    lastRunStatus: readString(state, "lastRunStatus"),
    runningAt: asIsoTimestamp(state.runningAtMs ?? state.runningAt),
    nextRunAt: asIsoTimestamp(state.nextRunAtMs ?? state.nextRunAt),
    lastRunAt: asIsoTimestamp(state.lastRunAtMs ?? state.lastRunAt),
    observedAt: now.toISOString()
  };
}

function verifyTaskReadback(value: unknown, expected: TaskReadbackExpectation): void {
  const job = parseJobRecord(value);
  const observed = normalizeTask(value, new Date(0));
  const payload = isRecord(job.payload) ? job.payload : {};
  if (expected.name !== undefined && observed.name !== expected.name) throw new ResearchRuntimeAdapterError("mutation_readback_mismatch", "OpenClaw task readback did not match the requested name.");
  if (expected.agentId !== undefined && observed.agentId !== expected.agentId) throw new ResearchRuntimeAdapterError("mutation_readback_mismatch", "OpenClaw task readback did not match the requested analyst ID.");
  if (expected.message !== undefined && payload.message !== expected.message) throw new ResearchRuntimeAdapterError("mutation_readback_mismatch", "OpenClaw task readback did not match the requested message.");
  if (expected.schedule !== undefined && (observed.schedule.kind !== expected.schedule.kind
    || observed.schedule.expression !== expected.schedule.expression
    || observed.schedule.timezone !== expected.schedule.timezone)) {
    throw new ResearchRuntimeAdapterError("mutation_readback_mismatch", "OpenClaw task readback did not match the requested schedule.");
  }
  if (expected.timeoutSeconds !== undefined && payload.timeoutSeconds !== expected.timeoutSeconds) {
    throw new ResearchRuntimeAdapterError("mutation_readback_mismatch", "OpenClaw task readback did not match the requested timeout.");
  }
  if (expected.enabled === false && observed.enabled) throw new ResearchRuntimeAdapterError("mutation_readback_mismatch", "OpenClaw task remained enabled after the requested update.");
  if (expected.name !== undefined || expected.agentId !== undefined || expected.message !== undefined || expected.schedule !== undefined) {
    if (observed.sessionTarget !== "isolated" || observed.payloadKind !== "agentTurn") {
      throw new ResearchRuntimeAdapterError("mutation_readback_mismatch", "OpenClaw task readback did not match the isolated agent-task contract.");
    }
  }
}

function parseAgent(value: Record<string, unknown>): ExternalAgent | null {
  const externalAgentId = readString(value, "id", "agentId");
  if (!externalAgentId) return null;
  const identity = isRecord(value.identity) ? value.identity : {};
  const statusObject = isRecord(value.status) ? value.status : {};
  return {
    externalAgentId,
    displayName: readString(value, "name", "displayName") ?? readString(identity, "name") ?? externalAgentId,
    isDefault: readBoolean(value, "isDefault") ?? false,
    rawStatus: readString(value, "status", "health", "state") ?? readString(statusObject, "label", "status")
  };
}

function readRunRecords(value: unknown): Record<string, unknown>[] {
  return parseRecords(value, ["entries", "runs", "items", "rows"], "run-history");
}

function mapExecutionStatus(rawStatus: string | null, rawCompletionStatus: string | null): ObservedRun["executionStatus"] {
  const status = rawStatus?.toLowerCase() ?? "";
  const completion = rawCompletionStatus?.toLowerCase() ?? "";
  if (status === "running" || status === "started") return "running";
  if (status === "skipped" || completion === "skipped") return "skipped";
  if (status === "cancelled" || completion === "cancelled") return "cancelled";
  if (status === "interrupted" || completion === "interrupted") return "interrupted";
  if (status === "error" || status === "failed" || completion === "failed") return "failed";
  if (status === "ok" && (!completion || completion === "succeeded")) return "succeeded";
  if (completion === "succeeded") return "succeeded";
  return "unknown";
}

function normalizeRun(value: Record<string, unknown>, externalJobId: string, now: Date): ObservedRun {
  const externalRunId = readString(value, "runId", "id");
  if (!externalRunId) throw new ResearchRuntimeAdapterError("invalid_runtime_output", "OpenClaw returned a run without an ID.");
  const rawStatus = readString(value, "status", "action");
  const rawCompletionStatus = readString(value, "completionStatus");
  const startedAt = asIsoTimestamp(value.runAtMs ?? value.runAtIso ?? value.startedAt ?? value.runAt);
  const explicitFinishedAt = asIsoTimestamp(value.tsIso ?? value.finishedAt ?? value.completedAt);
  const durationMsValue = readFiniteNumber(value, "durationMs");
  const durationMs = durationMsValue !== null && durationMsValue >= 0 && durationMsValue <= 86_400_000
    ? durationMsValue
    : null;
  const finishedAt = explicitFinishedAt ?? (startedAt && durationMs !== null
    ? new Date(Date.parse(startedAt) + durationMs).toISOString()
    : null);
  const summary = readString(value, "summary");

  return {
    source: "openclaw-cli",
    externalJobId,
    externalRunId,
    executionStatus: mapExecutionStatus(rawStatus, rawCompletionStatus),
    rawStatus,
    rawCompletionStatus,
    rawDeliveryStatus: readString(value, "deliveryStatus"),
    startedAt,
    finishedAt,
    durationMs,
    summary: summary ? summary.slice(0, 8000) : null,
    observedAt: now.toISOString()
  };
}

function parseCursor(cursor: string | undefined): number {
  if (cursor === undefined) return 0;
  if (!/^(0|[1-9][0-9]*)$/.test(cursor)) throw new ResearchRuntimeAdapterError("invalid_cursor", "The run-history cursor is invalid.");
  const offset = Number(cursor);
  if (!Number.isSafeInteger(offset) || offset > MAX_CURSOR_OFFSET) throw new ResearchRuntimeAdapterError("invalid_cursor", "The run-history cursor is out of range.");
  return offset;
}

function nextOffset(value: unknown, offset: number, itemCount: number): number | null {
  if (!isRecord(value)) return itemCount === RUN_PAGE_SIZE ? offset + itemCount : null;
  const pagination = isRecord(value.pagination) ? value.pagination : {};
  const next = readFiniteNumber(value, "nextOffset", "nextPageOffset") ?? readFiniteNumber(pagination, "nextOffset", "nextPageOffset");
  if (next !== null && Number.isInteger(next) && next > offset && next <= MAX_CURSOR_OFFSET) return next;
  const hasMore = readBoolean(value, "hasMore") ?? readBoolean(value, "hasNextPage")
    ?? readBoolean(pagination, "hasMore") ?? readBoolean(pagination, "hasNextPage");
  if (hasMore === true) return offset + itemCount;
  const total = readFiniteNumber(value, "total", "totalCount") ?? readFiniteNumber(pagination, "total", "totalCount");
  if (total !== null && offset + itemCount < total) return offset + itemCount;
  return itemCount === RUN_PAGE_SIZE ? offset + itemCount : null;
}

function versionFromOutput(stdout: string): string | null {
  return stdout.match(/(?:OpenClaw\s+)?(\d+\.\d+\.\d+)/i)?.[1] ?? null;
}

function errorCode(error: unknown): string {
  if (error instanceof ResearchRuntimeAdapterError) return error.code;
  if (error instanceof OpenClawProcessError) {
    if (error.processCode === "ENOENT") return "cli_not_found";
    if (error.processCode === "ETIMEDOUT" || error.processCode === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") return "cli_timeout_or_output_limit";
  }
  return "runtime_unavailable";
}

function runtimeFeatures(enabled: boolean, mappedAgentCount: number, mappedJobCount: number): RuntimeCapabilities["features"] {
  return {
    agentListing: enabled,
    taskRead: enabled,
    taskCreate: enabled && mappedAgentCount > 0,
    taskUpdate: enabled && mappedAgentCount > 0 && mappedJobCount > 0,
    manualRun: enabled && mappedAgentCount > 0 && mappedJobCount > 0,
    runHistory: enabled && mappedJobCount > 0,
    scheduleActivation: false,
    inputSnapshotBinding: false,
    cancellation: false,
    eventStreaming: false
  };
}

export class OpenClawCliRuntimeAdapter implements ResearchRuntimeAdapter {
  private readonly runner: OpenClawCommandRunner;
  private readonly now: () => Date;
  private readonly childEnvironment: NodeJS.ProcessEnv;
  private readonly verifiedExternalAgentIds: ReadonlySet<string>;
  private readonly verifiedTaskMappings: ReadonlyMap<string, string>;

  constructor(private readonly options: OpenClawCliAdapterOptions) {
    for (const [label, value] of [
      ["executable", options.executablePath],
      ["connection config", options.connectionConfigPath],
      ["state directory", options.stateDirectory],
      ["working directory", options.workingDirectory]
    ] as const) {
      if (!isAbsolute(value)) throw new Error(`OpenClaw ${label} path must be absolute.`);
    }
    this.runner = options.commandRunner ?? defaultCommandRunner();
    this.now = options.now ?? (() => new Date());
    this.childEnvironment = this.buildChildEnvironment(options.connectionEnvironment ?? {});
    const verifiedAgents = new Set<string>();
    for (const externalAgentId of options.verifiedExternalAgentIds ?? []) {
      if (!AGENT_ID_SCHEMA.safeParse(externalAgentId).success) throw new Error("Verified OpenClaw agent mappings must use normalized non-bootstrap IDs.");
      verifiedAgents.add(externalAgentId);
    }
    this.verifiedExternalAgentIds = verifiedAgents;
    const verifiedTasks = new Map<string, string>();
    for (const mapping of options.verifiedTaskMappings ?? []) {
      if (!JOB_ID_SCHEMA.safeParse(mapping.externalJobId).success
        || !AGENT_ID_SCHEMA.safeParse(mapping.externalAgentId).success
        || !verifiedAgents.has(mapping.externalAgentId)) {
        throw new Error("Verified OpenClaw task mappings must link a valid job to a verified non-bootstrap agent.");
      }
      const existingAgentId = verifiedTasks.get(mapping.externalJobId);
      if (existingAgentId && existingAgentId !== mapping.externalAgentId) throw new Error("An OpenClaw job cannot map to multiple Investment Office agents.");
      verifiedTasks.set(mapping.externalJobId, mapping.externalAgentId);
    }
    this.verifiedTaskMappings = verifiedTasks;
  }

  private requireMappedAgent(externalAgentId: string): void {
    if (externalAgentId === "main" || !this.verifiedExternalAgentIds.has(externalAgentId)) {
      throw new ResearchRuntimeAdapterError("external_agent_unmapped", "The external agent ID has no verified Investment Office mapping.");
    }
  }

  private requireMappedJob(externalJobId: string): string {
    const externalAgentId = this.verifiedTaskMappings.get(externalJobId);
    if (!externalAgentId || !this.verifiedExternalAgentIds.has(externalAgentId)) {
      throw new ResearchRuntimeAdapterError("external_task_unmapped", "The external task ID has no verified owner-scoped application mapping.");
    }
    return externalAgentId;
  }

  private buildChildEnvironment(connectionEnvironment: OpenClawCliAdapterOptions["connectionEnvironment"]): NodeJS.ProcessEnv {
    const child: NodeJS.ProcessEnv = {};
    for (const key of SAFE_BASE_ENV_KEYS) {
      const value = process.env[key];
      if (value !== undefined) child[key] = value;
    }
    child.OPENCLAW_CONFIG_PATH = this.options.connectionConfigPath;
    child.OPENCLAW_STATE_DIR = this.options.stateDirectory;
    child.OPENCLAW_CONFIG_READONLY = "1";
    child.NO_COLOR = "1";
    for (const key of CONNECTION_ENV_KEYS) {
      const value = connectionEnvironment?.[key];
      if (value !== undefined && value.length > 0) child[key] = value;
    }
    return child;
  }

  private async runCli(args: readonly string[], timeoutMs: number): Promise<string> {
    try {
      return await this.runner.run(this.options.executablePath, args, {
        cwd: this.options.workingDirectory,
        env: { ...this.childEnvironment },
        timeoutMs,
        maxBufferBytes: MAX_OUTPUT_BYTES,
        shell: false
      });
    } catch (error) {
      if (error instanceof ResearchRuntimeAdapterError) throw error;
      if (error instanceof OpenClawProcessError) throw error;
      throw new ResearchRuntimeAdapterError("runtime_unavailable", "The OpenClaw command could not be completed.");
    }
  }

  private async readCliVersion(): Promise<string> {
    const stdout = await this.runCli(["--version"], 10_000);
    const version = versionFromOutput(stdout);
    if (!version) throw new ResearchRuntimeAdapterError("runtime_version_unverified", "The OpenClaw CLI version could not be verified.");
    return version;
  }

  private async ensureCompatible(): Promise<string> {
    const version = await this.readCliVersion();
    if (version !== PINNED_OPENCLAW_VERSION) {
      throw new ResearchRuntimeAdapterError("runtime_version_mismatch", "The OpenClaw CLI version does not match the reviewed adapter contract.");
    }
    return version;
  }

  private async getTaskRecord(externalJobId: string): Promise<Record<string, unknown>> {
    const parsedId = JOB_ID_SCHEMA.safeParse(externalJobId);
    if (!parsedId.success) throw new ResearchRuntimeAdapterError("invalid_external_id", "The external task ID is invalid.");
    const stdout = await this.runCli(["automations", "get", parsedId.data, "--json"], 20_000);
    const parsed = parseJson(stdout);
    const job = parseJobRecord(parsed);
    const returnedId = readString(job, "id", "jobId");
    if (returnedId !== parsedId.data) throw new ResearchRuntimeAdapterError("invalid_runtime_output", "OpenClaw returned a different task ID than requested.");
    return job;
  }

  async getCapabilities(): Promise<RuntimeCapabilities> {
    let version: string | null = null;
    let code: string | null = null;
    try {
      version = await this.readCliVersion();
      if (version !== PINNED_OPENCLAW_VERSION) code = "runtime_version_mismatch";
    } catch (error) {
      code = errorCode(error);
    }
    const compatible = version === PINNED_OPENCLAW_VERSION;
    return {
      mode: "openclaw-cli",
      runtimeVersion: version,
      expectedVersion: PINNED_OPENCLAW_VERSION,
      available: compatible,
      features: runtimeFeatures(compatible, this.verifiedExternalAgentIds.size, this.verifiedTaskMappings.size),
      errorCode: code
    };
  }

  async checkHealth(): Promise<RuntimeHealth> {
    const observedAt = this.now().toISOString();
    const capabilities = await this.getCapabilities();
    if (!capabilities.available) {
      return {
        mode: "openclaw-cli",
        status: "unavailable",
        available: false,
        runtimeVersion: capabilities.runtimeVersion,
        gatewayVersion: null,
        observedAt,
        errorCode: capabilities.errorCode ?? "runtime_unavailable"
      };
    }

    try {
      const status = parseRootRecord(parseJson(await this.runCli(["gateway", "status", "--json", "--require-rpc"], 20_000)));
      const gateway = isRecord(status.gateway) ? status.gateway : {};
      const runtime = isRecord(status.status) ? status.status : {};
      const gatewayVersion = readString(gateway, "version") ?? readString(runtime, "runtimeVersion") ?? readString(status, "runtimeVersion");
      if (!gatewayVersion) {
        return {
          mode: "openclaw-cli",
          status: "unavailable",
          available: false,
          runtimeVersion: capabilities.runtimeVersion,
          gatewayVersion: null,
          observedAt,
          errorCode: "gateway_version_unverified"
        };
      }
      if (gatewayVersion !== PINNED_OPENCLAW_VERSION) {
        return {
          mode: "openclaw-cli",
          status: "unavailable",
          available: false,
          runtimeVersion: capabilities.runtimeVersion,
          gatewayVersion,
          observedAt,
          errorCode: "gateway_version_mismatch"
        };
      }
      return {
        mode: "openclaw-cli",
        status: "available",
        available: true,
        runtimeVersion: capabilities.runtimeVersion,
        gatewayVersion,
        observedAt,
        errorCode: null
      };
    } catch (error) {
      return {
        mode: "openclaw-cli",
        status: "unavailable",
        available: false,
        runtimeVersion: capabilities.runtimeVersion,
        gatewayVersion: null,
        observedAt,
        errorCode: errorCode(error)
      };
    }
  }

  async listAgents(): Promise<ExternalAgent[]> {
    await this.ensureCompatible();
    const parsed = parseJson(await this.runCli(["agents", "list", "--json"], 20_000));
    const rows = parseRecords(parsed, ["agents", "items", "rows"], "agent-list");
    return rows.map(parseAgent).filter((agent): agent is ExternalAgent => agent !== null);
  }

  async getTask(externalJobId: string): Promise<ObservedTask> {
    const parsedId = JOB_ID_SCHEMA.safeParse(externalJobId);
    if (!parsedId.success) throw new ResearchRuntimeAdapterError("invalid_external_id", "The external task ID is invalid.");
    await this.ensureCompatible();
    return normalizeTask(await this.getTaskRecord(parsedId.data), this.now());
  }

  async createTask(definition: AllowedTaskDefinition): Promise<ObservedTask> {
    const parsed = AllowedTaskDefinitionSchema.safeParse(definition);
    if (!parsed.success) throw new ResearchRuntimeAdapterError("invalid_task_definition", "The task definition does not match the allowed OpenClaw contract.");
    this.requireMappedAgent(parsed.data.agentId);
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: parsed.data.schedule.timezone });
    } catch {
      throw new ResearchRuntimeAdapterError("invalid_task_definition", "The task timezone must be a valid IANA timezone.");
    }
    await this.ensureCompatible();
    const args = [
      "automations", "add",
      "--name", parsed.data.name,
      "--agent", parsed.data.agentId,
      "--cron", parsed.data.schedule.expression,
      "--tz", parsed.data.schedule.timezone,
      "--session", "isolated",
      "--message", parsed.data.message,
      "--no-deliver",
      "--disabled"
    ];
    if (parsed.data.timeoutSeconds !== undefined) args.push("--timeout-seconds", String(parsed.data.timeoutSeconds));
    args.push("--json");

    let created: Record<string, unknown>;
    try {
      created = parseRootRecord(parseJson(await this.runCli(args, 30_000)));
    } catch {
      throw new ResearchRuntimeAdapterError("mutation_outcome_unknown", "OpenClaw task creation could not be confirmed; reconcile before retrying.");
    }
    const nestedJob = isRecord(created.job) ? created.job : created;
    const createdId = readString(nestedJob, "id", "jobId") ?? readString(created, "id", "jobId");
    const success = created.ok === true || created.success === true
      || (created.ok !== false && created.success !== false && Boolean(createdId));
    if (!success || !createdId) throw new ResearchRuntimeAdapterError("mutation_outcome_unknown", "OpenClaw task creation could not be confirmed; reconcile before retrying.");

    try {
      const readback = await this.getTaskRecord(createdId);
      verifyTaskReadback(readback, { ...parsed.data, enabled: false });
      return normalizeTask(readback, this.now());
    } catch {
      throw new ResearchRuntimeAdapterError("mutation_readback_failed", "OpenClaw created a task but exact readback failed; reconcile before retrying.");
    }
  }

  async updateTask(externalJobId: string, patch: AllowedTaskPatch): Promise<ObservedTask> {
    const parsedId = JOB_ID_SCHEMA.safeParse(externalJobId);
    const parsedPatch = AllowedTaskPatchSchema.safeParse(patch);
    if (!parsedId.success || !parsedPatch.success) throw new ResearchRuntimeAdapterError("invalid_task_patch", "The task update does not match the allowed OpenClaw contract.");
    const mappedAgentId = this.requireMappedJob(parsedId.data);
    if (parsedPatch.data.agentId !== undefined) this.requireMappedAgent(parsedPatch.data.agentId);
    if (parsedPatch.data.agentId !== undefined && parsedPatch.data.agentId !== mappedAgentId) {
      throw new ResearchRuntimeAdapterError("task_agent_mapping_conflict", "Changing an external task's analyst mapping requires a separate reviewed provisioning change.");
    }
    if (parsedPatch.data.schedule) {
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: parsedPatch.data.schedule.timezone });
      } catch {
        throw new ResearchRuntimeAdapterError("invalid_task_patch", "The task timezone must be a valid IANA timezone.");
      }
    }
    await this.ensureCompatible();
    const existing = normalizeTask(await this.getTaskRecord(parsedId.data), this.now());
    if (!existing.agentId || existing.agentId !== mappedAgentId || existing.payloadKind !== "agentTurn") {
      throw new ResearchRuntimeAdapterError("external_task_not_allowed", "The external task is not mapped to a dedicated Investment Office analyst job.");
    }

    const args = ["automations", "edit", parsedId.data];
    if (parsedPatch.data.name !== undefined) args.push("--name", parsedPatch.data.name);
    if (parsedPatch.data.agentId !== undefined) args.push("--agent", parsedPatch.data.agentId);
    if (parsedPatch.data.schedule !== undefined) {
      args.push("--cron", parsedPatch.data.schedule.expression, "--tz", parsedPatch.data.schedule.timezone);
    }
    if (parsedPatch.data.message !== undefined) args.push("--message", parsedPatch.data.message);
    if (parsedPatch.data.timeoutSeconds !== undefined) args.push("--timeout-seconds", String(parsedPatch.data.timeoutSeconds));
    if (parsedPatch.data.enabled === false) args.push("--disabled");
    args.push("--json");

    try {
      await this.runCli(args, 30_000);
    } catch {
      throw new ResearchRuntimeAdapterError("mutation_outcome_unknown", "OpenClaw task update could not be confirmed; reconcile before retrying.");
    }
    try {
      const readback = await this.getTaskRecord(parsedId.data);
      verifyTaskReadback(readback, parsedPatch.data);
      return normalizeTask(readback, this.now());
    } catch {
      throw new ResearchRuntimeAdapterError("mutation_readback_failed", "OpenClaw task update completed without matching readback; reconcile before retrying.");
    }
  }

  async requestRun(externalJobId: string): Promise<AcceptedExternalRun> {
    const parsedId = JOB_ID_SCHEMA.safeParse(externalJobId);
    if (!parsedId.success) throw new ResearchRuntimeAdapterError("invalid_external_id", "The external task ID is invalid.");
    const mappedAgentId = this.requireMappedJob(parsedId.data);
    await this.ensureCompatible();
    const task = await this.getTaskRecord(parsedId.data);
    const observedTask = normalizeTask(task, this.now());
    if (!observedTask.agentId || observedTask.agentId !== mappedAgentId || observedTask.payloadKind !== "agentTurn") {
      throw new ResearchRuntimeAdapterError("external_task_not_allowed", "The external task is not mapped to a dedicated Investment Office analyst job.");
    }

    // Submit exactly once. A timeout or malformed response is ambiguous and must be reconciled by the caller.
    let parsedReceipt: Record<string, unknown>;
    try {
      parsedReceipt = parseRootRecord(parseJson(await this.runCli(["automations", "run", parsedId.data, "--json"], 30_000)));
    } catch {
      throw new ResearchRuntimeAdapterError("run_acceptance_unknown", "OpenClaw run acceptance is ambiguous; reconcile before retrying.");
    }
    const externalRunId = readString(parsedReceipt, "runId");
    const parsedRunId = externalRunId ? RUN_ID_SCHEMA.safeParse(externalRunId) : null;
    if (parsedReceipt.ok !== true || parsedReceipt.enqueued !== true || !parsedRunId?.success) {
      throw new ResearchRuntimeAdapterError("run_acceptance_unknown", "OpenClaw did not confirm durable run acceptance; reconcile before retrying.");
    }
    return {
      externalJobId: parsedId.data,
      externalRunId: parsedRunId.data,
      accepted: true,
      acceptedAt: this.now().toISOString(),
      processInstanceId: readString(parsedReceipt, "processInstanceId")
    };
  }

  async getRun(externalJobId: string, externalRunId: string): Promise<ObservedRun> {
    const parsedJobId = JOB_ID_SCHEMA.safeParse(externalJobId);
    const parsedRunId = RUN_ID_SCHEMA.safeParse(externalRunId);
    if (!parsedJobId.success || !parsedRunId.success) throw new ResearchRuntimeAdapterError("invalid_external_id", "The external run reference is invalid.");
    this.requireMappedJob(parsedJobId.data);
    await this.ensureCompatible();
    const parsed = parseJson(await this.runCli([
      "automations", "runs", parsedJobId.data,
      "--run-id", parsedRunId.data,
      "--limit", "1",
      "--json"
    ], 30_000));
    const match = readRunRecords(parsed).find((run) => readString(run, "runId", "id") === parsedRunId.data);
    if (!match) throw new ResearchRuntimeAdapterError("external_run_not_found", "OpenClaw has no retained record for the requested run.");
    return normalizeRun(match, parsedJobId.data, this.now());
  }

  async listRuns(externalJobId: string, cursor?: string): Promise<ObservedRunPage> {
    const parsedJobId = JOB_ID_SCHEMA.safeParse(externalJobId);
    if (!parsedJobId.success) throw new ResearchRuntimeAdapterError("invalid_external_id", "The external task ID is invalid.");
    this.requireMappedJob(parsedJobId.data);
    const offset = parseCursor(cursor);
    await this.ensureCompatible();
    const parsed = parseJson(await this.runCli([
      "automations", "runs", parsedJobId.data,
      "--sort", "desc",
      "--offset", String(offset),
      "--limit", String(RUN_PAGE_SIZE),
      "--json"
    ], 30_000));
    const records = readRunRecords(parsed);
    const items = records.map((run) => normalizeRun(run, parsedJobId.data, this.now()));
    const offsetAfterPage = nextOffset(parsed, offset, items.length);
    return {
      items,
      nextCursor: offsetAfterPage === null ? null : String(offsetAfterPage),
      observedAt: this.now().toISOString()
    };
  }
}
