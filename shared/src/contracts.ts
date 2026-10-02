import { z } from "zod";
import { AgentIdSchema, type AgentId } from "./agent";

export const DataModeSchema = z.enum(["demo", "live"]);
export type DataMode = z.infer<typeof DataModeSchema>;

export const AgentRoleSchema = z.enum(["market", "portfolio", "research", "risk"]);
export type AgentRole = z.infer<typeof AgentRoleSchema>;

export const AgentStatusSchema = z.enum(["idle", "working", "waiting", "offline", "unknown"]);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export const ExecutionStatusSchema = z.enum([
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled",
  "interrupted",
  "skipped",
  "unknown"
]);
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

export const DeliveryStatusSchema = z.enum(["pending", "delivered", "failed", "unknown"]);
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

export const ReportProcessingStatusSchema = z.enum(["pending", "processed", "failed"]);
export type ReportProcessingStatus = z.infer<typeof ReportProcessingStatusSchema>;

export const TimestampSchema = z.string().datetime({ offset: true });

export const AgentSchema = z.object({
  id: AgentIdSchema,
  role: AgentRoleSchema,
  displayName: z.string().min(1),
  title: z.string().min(1),
  responsibility: z.string().min(1),
  avatarKey: z.string().min(1),
  deskKey: z.string().min(1),
  status: AgentStatusSchema,
  statusLabel: z.string().min(1),
  currentTaskId: z.string().min(1).nullable(),
  observedAt: TimestampSchema.nullable()
});
export type Agent = z.infer<typeof AgentSchema>;

export const TaskSchema = z.object({
  id: z.string().min(1),
  agentId: AgentIdSchema,
  name: z.string().min(1),
  purpose: z.string().min(1),
  inputs: z.array(z.string().min(1)).min(1),
  missingInputs: z.array(z.string().min(1)),
  enabled: z.boolean(),
  scheduleLabel: z.string().min(1),
  timezone: z.string().min(1),
  nextRunAt: TimestampSchema.nullable()
});
export type Task = z.infer<typeof TaskSchema>;

export const ReportSourceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  url: z.string().url().nullable(),
  publishedAt: TimestampSchema.nullable(),
  retrievedAt: TimestampSchema.nullable(),
  illustrative: z.boolean()
});
export type ReportSource = z.infer<typeof ReportSourceSchema>;

export const SampleSymbolSchema = z.object({
  symbol: z.string().min(1),
  label: z.string().min(1),
  illustrative: z.literal(true)
});
export type SampleSymbol = z.infer<typeof SampleSymbolSchema>;

export const ReportMetadataSchema = z.object({
  timezone: z.string().min(1),
  elapsedSeconds: z.number().nonnegative(),
  sampleSymbols: z.array(SampleSymbolSchema)
});
export type ReportMetadata = z.infer<typeof ReportMetadataSchema>;

export const ReportSchema = z.object({
  id: z.string().min(1),
  agentId: AgentIdSchema,
  taskId: z.string().min(1),
  runId: z.string().min(1),
  title: z.string().min(1),
  generatedAt: TimestampSchema,
  dataAsOf: TimestampSchema.nullable(),
  summary: z.string().min(1),
  findings: z.array(z.string().min(1)).min(1),
  interpretation: z.string().min(1),
  uncertainties: z.array(z.string().min(1)).min(1),
  missingInputs: z.array(z.string().min(1)).min(1),
  sources: z.array(ReportSourceSchema).min(1),
  metadata: ReportMetadataSchema,
  readAt: TimestampSchema.nullable(),
  processingStatus: ReportProcessingStatusSchema,
  mode: DataModeSchema
});
export type Report = z.infer<typeof ReportSchema>;

export const RunSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  agentId: AgentIdSchema,
  idempotencyKey: z.string().min(1).nullable(),
  executionStatus: ExecutionStatusSchema,
  deliveryStatus: DeliveryStatusSchema,
  reportProcessingStatus: ReportProcessingStatusSchema,
  queuedAt: TimestampSchema,
  startedAt: TimestampSchema.nullable(),
  finishedAt: TimestampSchema.nullable(),
  reportId: z.string().min(1).nullable(),
  reason: z.string().nullable(),
  errorSummary: z.string().nullable(),
  mode: DataModeSchema
}).superRefine((run, context) => {
  if (run.executionStatus === "skipped" && !run.reason?.trim()) {
    context.addIssue({
      code: "custom",
      path: ["reason"],
      message: "A skipped run must preserve the scheduler's reason."
    });
  }
});
export type Run = z.infer<typeof RunSchema>;

export const ReportFiltersSchema = z.object({
  agentId: AgentIdSchema.optional(),
  unreadOnly: z.boolean().optional(),
  query: z.string().optional(),
  generatedFrom: TimestampSchema.optional(),
  generatedTo: TimestampSchema.optional(),
  pageSize: z.number().int().min(1).max(50).optional()
});
export type ReportFilters = z.infer<typeof ReportFiltersSchema>;

export const AppPreferencesSchema = z.object({
  timezone: z.string().min(1),
  reducedMotion: z.boolean(),
  theme: z.enum(["system", "light", "dark"])
});
export type AppPreferences = z.infer<typeof AppPreferencesSchema>;
export type AppPreferencesPatch = Partial<AppPreferences>;

export const ServicePageSchema = <T extends z.ZodType>(itemSchema: T) => z.object({
  items: z.array(itemSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean()
});
export type ServicePage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type OfficeResult<T> = {
  data: T;
  dataMode: DataMode;
  observedAt: string;
};

export type RunRequestResult = {
  run: Run;
  reused: boolean;
};

export interface OfficeService {
  listAgents(): Promise<OfficeResult<Agent[]>>;
  getAgent(id: AgentId): Promise<OfficeResult<Agent | null>>;
  listTasks(agentId?: AgentRole): Promise<OfficeResult<Task[]>>;
  listRuns(agentId?: AgentId): Promise<OfficeResult<Run[]>>;
  listReports(filters?: ReportFilters, cursor?: string | null): Promise<OfficeResult<ServicePage<Report>>>;
  getReport(id: string): Promise<OfficeResult<Report | null>>;
  markReportRead(id: string): Promise<OfficeResult<Report | null>>;
  requestRun(taskId: string, idempotencyKey: string): Promise<OfficeResult<RunRequestResult>>;
  getRun(id: string): Promise<OfficeResult<Run | null>>;
  getPreferences(): Promise<OfficeResult<AppPreferences>>;
  updatePreferences(patch: AppPreferencesPatch): Promise<OfficeResult<AppPreferences>>;
}

export class OfficeServiceError extends Error {
  constructor(
    readonly code: "invalid-argument" | "not-found" | "conflict",
    message: string
  ) {
    super(message);
    this.name = "OfficeServiceError";
  }
}
