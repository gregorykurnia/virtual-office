import { z } from "zod";
import {
  AgentDocumentSchema,
  AgentRoleSchema,
  DataModeSchema,
  IntegrationInstanceDocumentSchema,
  ReportDocumentSchema,
  ReportProcessingStatusSchema,
  ReportSourceDocumentSchema,
  RunDocumentSchema,
  TaskDocumentSchema,
  TimestampSchema
} from "@investment-office/shared";

const ApiIdSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);

export const ApiSuccessSchema = <T extends z.ZodType>(data: T) => z.object({
  dataMode: DataModeSchema,
  observedAt: TimestampSchema,
  data
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    requestId: z.string().min(1)
  })
});

export const AgentAvailabilitySchema = z.object({
  status: z.enum(["working", "waiting", "unknown"]),
  statusLabel: z.string().min(1),
  activeRunId: ApiIdSchema.nullable(),
  lastObservedAt: TimestampSchema.nullable()
});

export const AgentApiSchema = AgentDocumentSchema.extend({
  id: AgentRoleSchema,
  availability: AgentAvailabilitySchema
});

export const TaskApiSchema = TaskDocumentSchema.extend({
  id: ApiIdSchema,
  name: z.string().min(1),
  purpose: z.string().min(1),
  inputs: z.array(z.string()),
  missingInputs: z.array(z.string())
});

export const ReportApiSchema = ReportDocumentSchema.extend({
  id: ApiIdSchema,
  readAt: TimestampSchema.nullable(),
  processingStatus: ReportProcessingStatusSchema
});

export const ReportSourceApiSchema = ReportSourceDocumentSchema.extend({ id: ApiIdSchema });

export const RunApiSchema = RunDocumentSchema.extend({ id: ApiIdSchema });

export const AgentProfileApiSchema = z.object({
  agent: AgentApiSchema,
  tasks: z.array(TaskApiSchema),
  latestReports: z.array(ReportApiSchema),
  missingInputs: z.array(z.string())
});

export const ReportPageApiSchema = z.object({
  items: z.array(ReportApiSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean()
});

export const ReportDetailApiSchema = z.object({
  report: ReportApiSchema,
  sources: z.array(ReportSourceApiSchema),
  run: RunApiSchema.nullable(),
  inputSnapshot: z.object({
    id: ApiIdSchema,
    inputVersion: z.number().int().positive(),
    createdAt: TimestampSchema,
    asOf: TimestampSchema,
    contentHash: z.string().regex(/^[a-f0-9]{64}$/)
  }).nullable()
});

export const RunPageApiSchema = z.object({
  items: z.array(RunApiSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean()
});

export const ConnectionApiSchema = z.object({
  status: z.enum(["unknown", "unavailable"]),
  available: z.boolean(),
  stale: z.boolean(),
  lastSuccessfulCheckAt: TimestampSchema.nullable(),
  capabilities: z.array(z.string()),
  integration: IntegrationInstanceDocumentSchema.extend({ id: ApiIdSchema }).nullable()
});

export type AgentApi = z.infer<typeof AgentApiSchema>;
export type TaskApi = z.infer<typeof TaskApiSchema>;
export type ReportApi = z.infer<typeof ReportApiSchema>;
export type ReportSourceApi = z.infer<typeof ReportSourceApiSchema>;
export type RunApi = z.infer<typeof RunApiSchema>;
export type AgentProfileApi = z.infer<typeof AgentProfileApiSchema>;
export type ReportPageApi = z.infer<typeof ReportPageApiSchema>;
export type ReportDetailApi = z.infer<typeof ReportDetailApiSchema>;
export type RunPageApi = z.infer<typeof RunPageApiSchema>;
export type ConnectionApi = z.infer<typeof ConnectionApiSchema>;

export const ReportQuerySchema = z.object({
  agentId: AgentRoleSchema.optional(),
  unreadOnly: z.enum(["true", "false"]).optional().transform((value) => value === undefined ? undefined : value === "true"),
  query: z.string().trim().max(160).optional(),
  generatedFrom: TimestampSchema.optional(),
  generatedTo: TimestampSchema.optional(),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(1024).optional()
}).superRefine((value, context) => {
  if (value.generatedFrom && value.generatedTo && Date.parse(value.generatedFrom) > Date.parse(value.generatedTo)) {
    context.addIssue({ code: "custom", path: ["generatedTo"], message: "generatedTo must not precede generatedFrom." });
  }
});

export const RunQuerySchema = z.object({
  agentId: AgentRoleSchema.optional(),
  taskId: ApiIdSchema.optional(),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(1024).optional()
});

export const AgentIdParamSchema = z.object({ id: AgentRoleSchema });
export const RecordIdParamSchema = z.object({ id: ApiIdSchema });
