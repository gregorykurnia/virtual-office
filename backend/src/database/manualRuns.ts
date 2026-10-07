import { createHash, randomUUID } from "node:crypto";
import {
  FieldPath,
  Timestamp,
  type Firestore,
  type QueryDocumentSnapshot
} from "firebase-admin/firestore";
import {
  AgentDocumentSchema,
  HoldingDocumentSchema,
  InputSnapshotDocumentSchema,
  IntegrationInstanceDocumentSchema,
  OwnerProfileDocumentSchema,
  RunDocumentSchema,
  RunInputDocumentSchema,
  RunRequestDocumentSchema,
  TaskDocumentSchema,
  WatchlistDocumentSchema,
  WorkItemDocumentSchema
} from "@investment-office/shared";
import type { VerifiedOwnerContext } from "../auth/ownerAuth.js";
import { ApiError, conflict, corruptRecord, dependencyUnavailable, invalidInput, notFound } from "../api/errors.js";
import { activeTaskRunClaim } from "./taskRunLocks.js";
import { ownerCollection, ownerDocument, ownerRecord } from "./paths.js";

const MAX_HOLDINGS_PER_SNAPSHOT = 200;
const MAX_WATCHLIST_PER_SNAPSHOT = 200;
const MAX_SNAPSHOT_JSON_LENGTH = 150_000;

type JsonObject = Record<string, unknown>;
type ManualRunInput = {
  task: {
    id: string;
    agentId: string;
    definitionKey: string;
    promptVersion: string;
    configVersion: number;
    externalJobId: string;
  };
  agent: { id: string; externalAgentId: string };
  holdings: Array<Record<string, unknown>>;
  watchlist: Array<Record<string, unknown>>;
  inputOverrides: JsonObject;
};

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function stableJson(value: unknown, depth = 0): string {
  if (depth > 40) throw invalidInput("Run inputs are nested too deeply.");
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map((item) => stableJson(item, depth + 1)).join(",") + "]";
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
    return "{" + entries.map(([key, item]) => JSON.stringify(key) + ":" + stableJson(item, depth + 1)).join(",") + "}";
  }
  throw invalidInput("Run inputs must contain JSON values only.");
}

function timestampIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  if (typeof value === "object" && value !== null && "seconds" in value && "nanoseconds" in value
    && typeof value.seconds === "number" && typeof value.nanoseconds === "number") {
    return new Timestamp(value.seconds, value.nanoseconds).toDate().toISOString();
  }
  throw corruptRecord();
}

function parseQueryDocument<T>(snapshot: QueryDocumentSnapshot, schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } }): T {
  const parsed = schema.safeParse(snapshot.data());
  if (!parsed.success) throw corruptRecord();
  return parsed.data;
}

export type ManualRunRequestResult = { runId: string; reused: boolean };

/**
 * Creates the manual request, run, immutable input reference, task lock, and dispatch item
 * atomically. This transaction performs no external calls and remains safe to retry.
 */
export async function createManualRunRequest(args: {
  db: Firestore;
  owner: VerifiedOwnerContext;
  taskId: string;
  idempotencyKey: string;
  inputOverrides: JsonObject;
  integrationId: string | null;
}): Promise<ManualRunRequestResult> {
  const { db, owner, taskId, idempotencyKey, inputOverrides, integrationId } = args;
  const canonicalBody = stableJson({ inputOverrides });
  const requestHash = sha256(stableJson({ taskId, body: { inputOverrides } }));
  const requestId = sha256(idempotencyKey);
  const runId = randomUUID();
  const snapshotId = randomUUID();
  const workItemId = "dispatch-" + runId;
  const now = Timestamp.now();

  if (canonicalBody.length > MAX_SNAPSHOT_JSON_LENGTH) {
    throw invalidInput("Run input overrides exceed the supported size.");
  }

  const ownerRef = ownerDocument(db, owner);
  const requestRef = ownerRecord(db, owner, "runRequests", requestId);
  const idempotencyClaimRef = ownerCollection(db, owner, "_unique").doc(sha256("idempotencyKey:" + idempotencyKey));
  const taskRef = ownerRecord(db, owner, "tasks", taskId);
  const integrationRef = integrationId ? db.collection("integrationInstances").doc(integrationId) : null;
  const holdingsQuery = ownerCollection(db, owner, "holdings")
    .orderBy(FieldPath.documentId(), "asc").limit(MAX_HOLDINGS_PER_SNAPSHOT + 1);
  const watchlistQuery = ownerCollection(db, owner, "watchlist")
    .orderBy(FieldPath.documentId(), "asc").limit(MAX_WATCHLIST_PER_SNAPSHOT + 1);
  const activeTaskClaimRef = activeTaskRunClaim(db, owner, taskId);
  const activeRunsQuery = ownerCollection(db, owner, "runs")
    .where("taskId", "==", taskId)
    .where("executionStatus", "in", ["queued", "running", "unknown"])
    .limit(1);

  return db.runTransaction(async (transaction) => {
    const [ownerSnapshot, priorRequestSnapshot, idempotencyClaimSnapshot] = await Promise.all([
      transaction.get(ownerRef),
      transaction.get(requestRef),
      transaction.get(idempotencyClaimRef)
    ]);
    if (!ownerSnapshot.exists) throw disabledOwnerError();
    const ownerProfile = OwnerProfileDocumentSchema.safeParse(ownerSnapshot.data());
    if (!ownerProfile.success || !ownerProfile.data.enabled) throw disabledOwnerError();

    if (priorRequestSnapshot.exists) {
      const priorRequest = RunRequestDocumentSchema.safeParse(priorRequestSnapshot.data());
      if (!priorRequest.success || priorRequest.data.idempotencyKey !== idempotencyKey) throw corruptRecord();
      const claim = idempotencyClaimSnapshot.data();
      if (!idempotencyClaimSnapshot.exists || !claim || claim.targetPath !== requestRef.path) throw corruptRecord();
      if (priorRequest.data.taskId !== taskId || priorRequest.data.requestHash !== requestHash) {
        throw conflict("idempotency_key_reused", "This Idempotency-Key was already used with a different request.");
      }
      const priorRunSnapshot = await transaction.get(ownerRecord(db, owner, "runs", priorRequest.data.localRunId));
      const priorRun = RunDocumentSchema.safeParse(priorRunSnapshot.data());
      if (!priorRunSnapshot.exists || !priorRun.success || priorRun.data.taskId !== taskId) throw corruptRecord();
      return { runId: priorRequest.data.localRunId, reused: true };
    }
    if (idempotencyClaimSnapshot.exists) throw corruptRecord();
    if (!integrationRef) {
      throw dependencyUnavailable("integration_unavailable", "Live run dispatch is not configured.");
    }

    const [taskSnapshot, holdingsSnapshot, watchlistSnapshot, integrationSnapshot, activeLockSnapshot, activeRunsSnapshot] = await Promise.all([
      transaction.get(taskRef),
      transaction.get(holdingsQuery),
      transaction.get(watchlistQuery),
      transaction.get(integrationRef),
      transaction.get(activeTaskClaimRef),
      transaction.get(activeRunsQuery)
    ]);
    if (!taskSnapshot.exists) throw notFound("The requested task was not found.");
    const task = TaskDocumentSchema.safeParse(taskSnapshot.data());
    if (!task.success) throw corruptRecord();
    if (!task.data.enabled) throw conflict("task_disabled", "This task is disabled and cannot be run.");

    const agentSnapshot = await transaction.get(ownerRecord(db, owner, "agents", task.data.agentId));
    if (!agentSnapshot.exists) throw corruptRecord();
    const agent = AgentDocumentSchema.safeParse(agentSnapshot.data());
    if (!agent.success || agent.data.roleKey !== task.data.agentId) throw corruptRecord();
    if (!agent.data.enabled) throw conflict("agent_disabled", "This analyst is disabled and cannot run tasks.");
    if (!task.data.externalJobId || !agent.data.externalAgentId) {
      throw conflict("task_not_configured", "This task is missing its external analyst or job mapping.");
    }

    const integration = IntegrationInstanceDocumentSchema.safeParse(integrationSnapshot.data());
    if (!integrationSnapshot.exists || !integration.success || integration.data.kind !== "openclaw" || !integration.data.enabled) {
      throw dependencyUnavailable("integration_unavailable", "The configured live integration is unavailable.");
    }

    if (holdingsSnapshot.docs.length > MAX_HOLDINGS_PER_SNAPSHOT || watchlistSnapshot.docs.length > MAX_WATCHLIST_PER_SNAPSHOT) {
      throw conflict("input_snapshot_too_large", "The saved holdings or watchlist exceed the supported run snapshot size.");
    }

    const holdings = holdingsSnapshot.docs.map((document) => {
      const holding = parseQueryDocument(document, HoldingDocumentSchema);
      return { id: document.id, ...holding, asOf: timestampIso(holding.asOf) };
    });
    const watchlist = watchlistSnapshot.docs.map((document) => {
      const item = parseQueryDocument(document, WatchlistDocumentSchema);
      return {
        id: document.id,
        ...item,
        createdAt: timestampIso(item.createdAt),
        updatedAt: timestampIso(item.updatedAt)
      };
    });

    let replaceStaleTaskClaim = false;
    if (activeLockSnapshot.exists) {
      const lock = activeLockSnapshot.data();
      if (!lock || typeof lock.targetRunId !== "string" || typeof lock.targetPath !== "string") throw corruptRecord();
      const lockedRunRef = ownerRecord(db, owner, "runs", lock.targetRunId);
      if (lock.targetPath !== lockedRunRef.path) throw corruptRecord();
      const lockedRunSnapshot = await transaction.get(lockedRunRef);
      const lockedRun = RunDocumentSchema.safeParse(lockedRunSnapshot.data());
      if (!lockedRunSnapshot.exists || !lockedRun.success || lockedRun.data.taskId !== taskId) throw corruptRecord();
      const terminal = ["succeeded", "failed", "cancelled", "interrupted", "skipped"].includes(lockedRun.data.executionStatus);
      if (!terminal) throw conflict("active_run_exists", "This task already has an active or unresolved run.");
      replaceStaleTaskClaim = true;
    }
    if (!activeRunsSnapshot.empty) {
      throw conflict("active_run_exists", "This task already has an active or unresolved run.");
    }

    const validatedInput: ManualRunInput = {
      task: {
        id: taskId,
        agentId: task.data.agentId,
        definitionKey: task.data.definitionKey,
        promptVersion: task.data.promptVersion,
        configVersion: task.data.configVersion,
        externalJobId: task.data.externalJobId
      },
      agent: { id: task.data.agentId, externalAgentId: agent.data.externalAgentId },
      holdings,
      watchlist,
      inputOverrides
    };
    const serializedInput = stableJson(validatedInput);
    if (serializedInput.length > MAX_SNAPSHOT_JSON_LENGTH) {
      throw conflict("input_snapshot_too_large", "The saved run inputs exceed the supported snapshot size.");
    }
    const validatedSnapshot = InputSnapshotDocumentSchema.safeParse({
      validatedInput,
      portfolioSettingsVersion: 0,
      researchSettingsVersion: 0,
      createdAt: now,
      asOf: now,
      contentHash: sha256(serializedInput)
    });
    if (!validatedSnapshot.success) throw corruptRecord();

    const runRef = ownerRecord(db, owner, "runs", runId);
    const snapshotRef = ownerRecord(db, owner, "inputSnapshots", snapshotId);
    const runInputRef = ownerRecord(db, owner, "runInputs", runId);
    const workItemRef = db.collection("workItems").doc(workItemId);
    const requestData = RunRequestDocumentSchema.parse({
      taskId,
      idempotencyKey,
      requestHash,
      localRunId: runId,
      dispatchState: "queued",
      createdAt: now,
      updatedAt: now
    });
    const runData = RunDocumentSchema.parse({
      taskId,
      agentId: task.data.agentId,
      integrationId: null,
      externalRunId: null,
      requestOrigin: "manual",
      executionStatus: "queued",
      deliveryStatus: "pending",
      processingStatus: "pending",
      queuedAt: now,
      startedAt: null,
      endedAt: null,
      observedAt: now,
      errorCode: null,
      errorSummary: null,
      rawExternalStatus: null,
      reportId: null
    });
    const runInput = RunInputDocumentSchema.parse({
      runId,
      snapshotId,
      inputVersion: 1,
      primary: true,
      attachedAt: now
    });
    const workItem = WorkItemDocumentSchema.parse({
      ownerUid: owner.uid,
      workKind: "dispatch_run",
      reference: { collection: "runs", id: runId },
      payload: { requestId, runId, taskId },
      attemptCount: 0,
      availableAt: now,
      leaseOwner: null,
      leaseExpiresAt: null,
      state: "queued",
      terminalResult: null,
      lastError: null,
      createdAt: now,
      updatedAt: now
    });
    const activeTaskLock = {
      targetPath: runRef.path,
      targetRunId: runId,
      constraint: "activeTaskRun",
      createdAt: now
    };
    const idempotencyClaim = {
      targetPath: requestRef.path,
      constraint: "idempotencyKey",
      createdAt: now
    };

    transaction.create(requestRef, requestData);
    transaction.create(idempotencyClaimRef, idempotencyClaim);
    transaction.create(runRef, runData);
    transaction.create(snapshotRef, validatedSnapshot.data);
    transaction.create(runInputRef, runInput);
    if (replaceStaleTaskClaim) transaction.set(activeTaskClaimRef, activeTaskLock);
    else transaction.create(activeTaskClaimRef, activeTaskLock);
    transaction.create(workItemRef, workItem);
    return { runId, reused: false };
  });
}

function disabledOwnerError(): ApiError {
  return new ApiError(403, "owner_workspace_disabled", "This owner workspace is not enabled.");
}
