import { z } from "zod";
import {
  AgentRoleSchema,
  DataModeSchema,
  DeliveryStatusSchema,
  ExecutionStatusSchema,
  ReportProcessingStatusSchema,
  TimestampSchema
} from "./contracts.js";

const DocumentIdSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
const DecimalStringSchema = z.string().max(80).regex(/^-?\d+(?:\.\d+)?$/);
const JsonObjectSchema = z.record(z.string(), z.unknown()).superRefine((value, context) => {
  try {
    const serialized = JSON.stringify(value);
    if (!serialized || serialized.length > 150_000) {
      context.addIssue({ code: "custom", message: "JSON document content exceeds the supported size." });
    }
  } catch {
    context.addIssue({ code: "custom", message: "JSON document content must be serializable." });
  }
});
const HttpUrlSchema = z.string().url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "Only HTTP and HTTPS source URLs are supported.");
const StoredTimestampSchema = z.union([
  TimestampSchema,
  z.object({
    seconds: z.number().int(),
    nanoseconds: z.number().int().min(0).max(999_999_999)
  })
]);
const OptionalTimestampSchema = StoredTimestampSchema.nullable();

export const DatabaseSchemaVersion = 1;

export const OwnerProfileDocumentSchema = z.object({
  displayName: z.string().trim().min(1).max(120).nullable(),
  enabled: z.boolean(),
  schemaVersion: z.number().int().positive(),
  createdAt: StoredTimestampSchema,
  updatedAt: StoredTimestampSchema
});

export const AgentDocumentSchema = z.object({
  roleKey: AgentRoleSchema,
  externalAgentId: z.string().min(1).max(256).nullable(),
  displayName: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(160),
  responsibility: z.string().trim().min(1).max(2000),
  avatarKey: z.string().min(1).max(128),
  deskKey: z.string().min(1).max(128),
  enabled: z.boolean(),
  createdAt: StoredTimestampSchema,
  updatedAt: StoredTimestampSchema
});

export const TaskDocumentSchema = z.object({
  agentId: DocumentIdSchema,
  definitionKey: z.string().min(1).max(160),
  name: z.string().trim().min(1).max(160).optional(),
  purpose: z.string().trim().min(1).max(2000).optional(),
  inputs: z.array(z.string().trim().min(1).max(500)).max(40).optional(),
  missingInputs: z.array(z.string().trim().min(1).max(1000)).max(40).optional(),
  externalJobId: z.string().min(1).max(256).nullable(),
  promptVersion: z.string().min(1).max(160),
  enabled: z.boolean(),
  schedule: z.object({
    expression: z.string().min(1).max(160),
    timezone: z.string().min(1).max(80),
    label: z.string().min(1).max(240)
  }),
  observedNextRunAt: OptionalTimestampSchema,
  configVersion: z.number().int().positive(),
  updatedAt: StoredTimestampSchema
});

export const RunDocumentSchema = z.object({
  taskId: DocumentIdSchema,
  agentId: DocumentIdSchema,
  integrationId: DocumentIdSchema.nullable(),
  externalRunId: z.string().min(1).max(256).nullable(),
  requestOrigin: z.enum(["manual", "scheduled", "reconciliation"]),
  executionStatus: ExecutionStatusSchema,
  deliveryStatus: DeliveryStatusSchema,
  processingStatus: ReportProcessingStatusSchema,
  queuedAt: StoredTimestampSchema,
  startedAt: OptionalTimestampSchema,
  endedAt: OptionalTimestampSchema,
  observedAt: StoredTimestampSchema,
  errorCode: z.string().max(128).nullable(),
  errorSummary: z.string().max(2000).nullable(),
  rawExternalStatus: z.string().max(512).nullable(),
  reportId: DocumentIdSchema.nullable()
});

export const ReportDocumentSchema = z.object({
  agentId: DocumentIdSchema,
  taskId: DocumentIdSchema,
  runId: DocumentIdSchema,
  title: z.string().trim().min(1).max(300),
  summary: z.string().trim().min(1).max(8000),
  bodyMarkdown: z.string().max(180_000),
  generatedAt: StoredTimestampSchema,
  dataAsOf: OptionalTimestampSchema,
  mode: DataModeSchema,
  schemaVersion: z.number().int().positive(),
  promptVersion: z.string().min(1).max(160),
  revision: z.number().int().nonnegative()
});

export const ReportSourceDocumentSchema = z.object({
  reportId: DocumentIdSchema,
  sourceKey: z.string().min(1).max(256),
  label: z.string().trim().min(1).max(300),
  url: HttpUrlSchema.nullable(),
  publishedAt: OptionalTimestampSchema,
  retrievedAt: OptionalTimestampSchema,
  asOf: OptionalTimestampSchema,
  illustrative: z.boolean()
});

export const ReportReadDocumentSchema = z.object({
  reportId: DocumentIdSchema,
  readAt: StoredTimestampSchema
});

export const HoldingDocumentSchema = z.object({
  instrumentId: z.string().trim().min(1).max(128),
  assetType: z.enum(["equity", "etf", "fund", "cash", "other"]),
  quantity: DecimalStringSchema.nullable(),
  weight: DecimalStringSchema.nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  asOf: StoredTimestampSchema
}).superRefine((holding, context) => {
  if (holding.quantity === null && holding.weight === null) {
    context.addIssue({ code: "custom", path: ["quantity"], message: "Provide quantity, weight, or both." });
  }
});

export const WatchlistDocumentSchema = z.object({
  instrumentId: z.string().trim().min(1).max(128),
  notes: z.string().max(4000),
  createdAt: StoredTimestampSchema,
  updatedAt: StoredTimestampSchema
});

export const InputSnapshotDocumentSchema = z.object({
  validatedInput: JsonObjectSchema,
  portfolioSettingsVersion: z.number().int().nonnegative(),
  researchSettingsVersion: z.number().int().nonnegative(),
  createdAt: StoredTimestampSchema,
  asOf: StoredTimestampSchema,
  contentHash: z.string().regex(/^[a-f0-9]{64}$/)
});

export const RunInputDocumentSchema = z.object({
  runId: DocumentIdSchema,
  snapshotId: DocumentIdSchema,
  inputVersion: z.number().int().positive(),
  primary: z.literal(true),
  attachedAt: StoredTimestampSchema
});

export const ConversationDocumentSchema = z.object({
  agentId: DocumentIdSchema,
  reportId: DocumentIdSchema.nullable(),
  externalSessionKey: z.string().min(1).max(512),
  latestResponseId: z.string().max(512).nullable(),
  contextVersion: z.number().int().positive(),
  createdAt: StoredTimestampSchema,
  updatedAt: StoredTimestampSchema
});

export const MessageDocumentSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(100_000),
  generationState: z.enum(["pending", "streaming", "complete", "failed"]),
  requestKey: z.string().max(256).nullable(),
  createdAt: StoredTimestampSchema,
  updatedAt: StoredTimestampSchema
});

export const IntegrationEventDocumentSchema = z.object({
  integrationId: DocumentIdSchema,
  externalKeyDigest: z.string().regex(/^[a-f0-9]{64}$/),
  rawPayloadJson: z.string().max(180_000),
  receivedAt: StoredTimestampSchema,
  processedAt: OptionalTimestampSchema,
  processingState: z.enum(["pending", "processing", "processed", "failed"]),
  processingError: z.string().max(2000).nullable()
});

export const IntegrationInstanceDocumentSchema = z.object({
  kind: z.enum(["openclaw"]),
  label: z.string().trim().min(1).max(160),
  enabled: z.boolean(),
  capabilities: z.array(z.string().min(1).max(128)).max(100),
  createdAt: StoredTimestampSchema,
  updatedAt: StoredTimestampSchema
});

export const WorkItemDocumentSchema = z.object({
  ownerUid: DocumentIdSchema,
  workKind: z.string().min(1).max(128),
  reference: z.object({ collection: z.string().min(1).max(128), id: DocumentIdSchema }).nullable(),
  payload: JsonObjectSchema,
  attemptCount: z.number().int().nonnegative(),
  availableAt: StoredTimestampSchema,
  leaseOwner: z.string().max(256).nullable(),
  leaseExpiresAt: OptionalTimestampSchema,
  state: z.enum(["queued", "leased", "succeeded", "failed"]),
  terminalResult: JsonObjectSchema.nullable(),
  lastError: z.string().max(2000).nullable(),
  createdAt: StoredTimestampSchema,
  updatedAt: StoredTimestampSchema
});

export const RunRequestDocumentSchema = z.object({
  taskId: DocumentIdSchema,
  idempotencyKey: z.string().min(1).max(256),
  requestHash: z.string().regex(/^[a-f0-9]{64}$/),
  localRunId: DocumentIdSchema,
  dispatchState: z.enum(["queued", "dispatching", "accepted", "unknown", "failed"]),
  createdAt: StoredTimestampSchema,
  updatedAt: StoredTimestampSchema
});

export const TaskMutationDocumentSchema = z.object({
  taskId: DocumentIdSchema,
  desiredPatch: JsonObjectSchema,
  expectedConfigVersion: z.number().int().positive(),
  externalResult: JsonObjectSchema.nullable(),
  readback: JsonObjectSchema.nullable(),
  reconciliationState: z.enum(["pending", "applied", "conflict", "failed"]),
  createdAt: StoredTimestampSchema,
  updatedAt: StoredTimestampSchema
});

export const NotificationOutboxDocumentSchema = z.object({
  reference: z.object({ kind: z.enum(["report", "run"]), id: DocumentIdSchema }),
  destination: z.string().min(1).max(512),
  deduplicationKey: z.string().min(1).max(256),
  attemptCount: z.number().int().nonnegative(),
  availableAt: StoredTimestampSchema,
  state: z.enum(["queued", "sending", "sent", "failed"]),
  lastError: z.string().max(2000).nullable(),
  createdAt: StoredTimestampSchema,
  updatedAt: StoredTimestampSchema
});

export const PreferencesDocumentSchema = z.object({
  timezone: z.string().min(1).max(80),
  theme: z.enum(["system", "light", "dark"]),
  reducedMotion: z.boolean(),
  notificationPreferences: JsonObjectSchema,
  updatedAt: StoredTimestampSchema
});

export const AuditEventDocumentSchema = z.object({
  action: z.string().min(1).max(128),
  target: z.string().max(512).nullable(),
  occurredAt: StoredTimestampSchema,
  requestId: z.string().min(1).max(128),
  safeMetadata: JsonObjectSchema
});

export type OwnerProfileDocument = z.infer<typeof OwnerProfileDocumentSchema>;
export type AgentDocument = z.infer<typeof AgentDocumentSchema>;
export type TaskDocument = z.infer<typeof TaskDocumentSchema>;
export type RunDocument = z.infer<typeof RunDocumentSchema>;
export type ReportDocument = z.infer<typeof ReportDocumentSchema>;
export type ReportSourceDocument = z.infer<typeof ReportSourceDocumentSchema>;
export type ReportReadDocument = z.infer<typeof ReportReadDocumentSchema>;
export type HoldingDocument = z.infer<typeof HoldingDocumentSchema>;
export type WatchlistDocument = z.infer<typeof WatchlistDocumentSchema>;
export type InputSnapshotDocument = z.infer<typeof InputSnapshotDocumentSchema>;
export type RunInputDocument = z.infer<typeof RunInputDocumentSchema>;
export type ConversationDocument = z.infer<typeof ConversationDocumentSchema>;
export type MessageDocument = z.infer<typeof MessageDocumentSchema>;
export type IntegrationEventDocument = z.infer<typeof IntegrationEventDocumentSchema>;
export type IntegrationInstanceDocument = z.infer<typeof IntegrationInstanceDocumentSchema>;
export type WorkItemDocument = z.infer<typeof WorkItemDocumentSchema>;
export type RunRequestDocument = z.infer<typeof RunRequestDocumentSchema>;
export type TaskMutationDocument = z.infer<typeof TaskMutationDocumentSchema>;
export type NotificationOutboxDocument = z.infer<typeof NotificationOutboxDocumentSchema>;
export type PreferencesDocument = z.infer<typeof PreferencesDocumentSchema>;
export type AuditEventDocument = z.infer<typeof AuditEventDocumentSchema>;
