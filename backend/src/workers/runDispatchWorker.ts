import { createHash, randomUUID } from "node:crypto";
import { FieldPath, Timestamp, type Firestore, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { z } from "zod";
import {
  AgentDocumentSchema,
  InputSnapshotDocumentSchema,
  IntegrationInstanceDocumentSchema,
  RunDocumentSchema,
  RunInputDocumentSchema,
  RunRequestDocumentSchema,
  TaskDocumentSchema,
  WorkItemDocumentSchema,
  type InputSnapshotDocument,
  type WorkItemDocument
} from "@investment-office/shared";
import type { SystemOwnerContext } from "../auth/ownerAuth.js";
import { releaseActiveTaskRunClaim } from "../database/taskRunLocks.js";
import { ownerRecord } from "../database/paths.js";

const POLL_INTERVAL_MS = 2_000;
const LEASE_DURATION_MS = 90_000;
const SUBMISSION_TIMEOUT_MS = 60_000;
const MAX_SAFE_ATTEMPTS = 3;
const DISPATCH_BATCH_SIZE = 10;

const WorkPayloadSchema = z.object({
  requestId: z.string().regex(/^[a-f0-9]{64}$/),
  runId: z.string().min(1).max(128),
  taskId: z.string().min(1).max(128)
});

const ManualRunSnapshotSchema = z.object({
  task: z.object({
    id: z.string(),
    agentId: z.string(),
    definitionKey: z.string(),
    promptVersion: z.string(),
    configVersion: z.number().int().positive(),
    externalJobId: z.string()
  }),
  agent: z.object({ id: z.string(), externalAgentId: z.string() }),
  holdings: z.array(z.record(z.string(), z.unknown())),
  watchlist: z.array(z.record(z.string(), z.unknown())),
  inputOverrides: z.record(z.string(), z.unknown())
});

export type RunDispatchRequest = {
  localRequestId: string;
  localRunId: string;
  taskId: string;
  externalJobId: string;
  externalAgentId: string;
  snapshotId: string;
  inputSnapshot: InputSnapshotDocument;
};

export interface RunDispatchAdapter {
  /** Stable integrationInstances document ID for this adapter. */
  integrationId: string;
  /** Optional safe preflight. This must not submit a research run. */
  checkConnection?: () => Promise<void>;
  /** Submit exactly one external job. Do not retry inside this method without a verified provider idempotency contract. */
  submit(request: RunDispatchRequest): Promise<{ externalRunId: string }>;
}

export class DefiniteDispatchError extends Error {
  constructor(readonly code = "dispatch_rejected") {
    super("The external service confirmed that it did not accept the run.");
    this.name = "DefiniteDispatchError";
  }
}

type WorkPayload = z.infer<typeof WorkPayloadSchema>;
type ClaimedDispatch = { payload: WorkPayload; localRequestId: string; localRunId: string; taskId: string };

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function safeErrorCode(error: unknown): string {
  if (error instanceof DefiniteDispatchError && /^[a-z][a-z0-9_-]{0,127}$/i.test(error.code)) return error.code;
  return "dispatch_unavailable";
}

function timestampMillis(value: unknown): number | null {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) return Date.parse(value);
  if (typeof value === "object" && value !== null && "seconds" in value && typeof value.seconds === "number") {
    return value.seconds * 1000;
  }
  return null;
}

function withTimeout<T>(operation: Promise<T>): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  return Promise.race([
    operation,
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error("External dispatch timed out.")), SUBMISSION_TIMEOUT_MS);
      timeout.unref();
    })
  ]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

function parseWorkItem(snapshot: QueryDocumentSnapshot): WorkItemDocument | null {
  const parsed = WorkItemDocumentSchema.safeParse(snapshot.data());
  if (!parsed.success) return null;
  return parsed.data;
}

export class DurableRunDispatchWorker {
  private timer: NodeJS.Timeout | undefined;
  private activePoll: Promise<void> | undefined;
  private readonly workerId = randomUUID();

  constructor(
    private readonly db: Firestore,
    private readonly owner: SystemOwnerContext,
    private readonly adapter: RunDispatchAdapter,
    private readonly onError: (error: unknown) => void = () => undefined
  ) {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(adapter.integrationId)) throw new Error("Invalid dispatch integration ID.");
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => { void this.poll(); }, POLL_INTERVAL_MS);
    this.timer.unref();
    void this.poll();
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    await this.activePoll;
  }

  private async poll(): Promise<void> {
    if (this.activePoll) return this.activePoll;
    this.activePoll = this.processAvailable()
      .catch((error: unknown) => { this.onError(error); })
      .finally(() => { this.activePoll = undefined; });
    return this.activePoll;
  }

  private async processAvailable(): Promise<void> {
    await this.reconcileExpiredLeases();
    const now = Timestamp.now();
    const candidates = await this.db.collection("workItems")
      .where("ownerUid", "==", this.owner.uid)
      .where("workKind", "==", "dispatch_run")
      .where("state", "==", "queued")
      .where("availableAt", "<=", now)
      .orderBy("availableAt", "asc")
      .orderBy(FieldPath.documentId(), "asc")
      .limit(DISPATCH_BATCH_SIZE)
      .get();

    for (const candidate of candidates.docs) {
      const work = parseWorkItem(candidate);
      if (!work || work.ownerUid !== this.owner.uid || work.workKind !== "dispatch_run") {
        this.onError(new Error("A dispatch work item failed schema validation."));
        continue;
      }
      const payload = WorkPayloadSchema.safeParse(work.payload);
      if (!payload.success) {
        this.onError(new Error("A dispatch work item has an invalid reference."));
        continue;
      }
      const claimed = await this.claim(candidate.id, payload.data);
      if (claimed) await this.dispatch(claimed);
    }
  }

  private async claim(workItemId: string, payload: WorkPayload): Promise<ClaimedDispatch | null> {
    const workRef = this.db.collection("workItems").doc(workItemId);
    const requestRef = ownerRecord(this.db, this.owner, "runRequests", payload.requestId);
    const runRef = ownerRecord(this.db, this.owner, "runs", payload.runId);
    const now = Timestamp.now();
    return this.db.runTransaction(async (transaction) => {
      const [workSnapshot, requestSnapshot, runSnapshot] = await Promise.all([
        transaction.get(workRef),
        transaction.get(requestRef),
        transaction.get(runRef)
      ]);
      const work = WorkItemDocumentSchema.safeParse(workSnapshot.data());
      const request = RunRequestDocumentSchema.safeParse(requestSnapshot.data());
      const run = RunDocumentSchema.safeParse(runSnapshot.data());
      if (!workSnapshot.exists || !requestSnapshot.exists || !runSnapshot.exists
        || !work.success || !request.success || !run.success) {
        throw new Error("A queued dispatch is missing a required record.");
      }
      if (work.data.ownerUid !== this.owner.uid || work.data.workKind !== "dispatch_run"
        || work.data.reference?.collection !== "runs" || work.data.reference.id !== payload.runId
        || workItemId !== "dispatch-" + payload.runId
        || request.data.localRunId !== payload.runId || request.data.taskId !== payload.taskId
        || sha256(request.data.idempotencyKey) !== payload.requestId
        || run.data.taskId !== payload.taskId) {
        throw new Error("A queued dispatch has mismatched owner or record references.");
      }
      const availableAt = timestampMillis(work.data.availableAt);
      if (work.data.state !== "queued" || availableAt === null || availableAt > now.toMillis()) return null;
      if (request.data.dispatchState !== "queued") {
        if (request.data.dispatchState === "accepted") {
          transaction.update(workRef, {
            state: "succeeded",
            leaseOwner: null,
            leaseExpiresAt: null,
            terminalResult: { outcome: "accepted" },
            lastError: null,
            updatedAt: now
          });
        } else if (request.data.dispatchState === "failed") {
          transaction.update(workRef, {
            state: "failed",
            leaseOwner: null,
            leaseExpiresAt: null,
            terminalResult: { outcome: "failed" },
            updatedAt: now
          });
        } else {
          transaction.update(requestRef, { dispatchState: "unknown", updatedAt: now });
          transaction.update(runRef, {
            executionStatus: "unknown",
            deliveryStatus: "unknown",
            observedAt: now,
            errorCode: "dispatch_unknown",
            errorSummary: "The dispatch state could not be confirmed. Reconcile before any resend."
          });
          transaction.update(workRef, {
            state: "failed",
            leaseOwner: null,
            leaseExpiresAt: null,
            terminalResult: { outcome: "unknown" },
            lastError: "The dispatch state could not be confirmed.",
            updatedAt: now
          });
        }
        return null;
      }
      const leaseExpiresAt = Timestamp.fromMillis(now.toMillis() + LEASE_DURATION_MS);
      transaction.update(workRef, {
        state: "leased",
        leaseOwner: this.workerId,
        leaseExpiresAt,
        attemptCount: work.data.attemptCount + 1,
        updatedAt: now
      });
      transaction.update(requestRef, { dispatchState: "dispatching", updatedAt: now });
      return { payload, localRequestId: payload.requestId, localRunId: payload.runId, taskId: payload.taskId };
    });
  }

  private async dispatch(context: ClaimedDispatch): Promise<void> {
    let loaded: RunDispatchRequest;
    try {
      loaded = await this.loadDispatchContext(context);
      const integrationSnapshot = await this.db.collection("integrationInstances").doc(this.adapter.integrationId).get();
      const integration = IntegrationInstanceDocumentSchema.safeParse(integrationSnapshot.data());
      if (!integrationSnapshot.exists || !integration.success || !integration.data.enabled || integration.data.kind !== "openclaw") {
        await this.retrySafeFailure(context, "The live integration is temporarily unavailable.");
        return;
      }
      await this.adapter.checkConnection?.();
    } catch (error) {
      await this.retrySafeFailure(context, "The dispatch connection check failed before submission.");
      this.onError(error);
      return;
    }

    try {
      const result = await withTimeout(this.adapter.submit(loaded));
      if (!result || typeof result.externalRunId !== "string" || !result.externalRunId.trim() || result.externalRunId.length > 256) {
        throw new Error("The adapter returned an invalid external run identifier.");
      }
      await this.persistAccepted(context, result.externalRunId.trim());
    } catch (error) {
      if (error instanceof DefiniteDispatchError) {
        await this.persistFailure(context, safeErrorCode(error));
        return;
      }
      await this.persistUnknown(context);
      this.onError(error);
    }
  }

  private async loadDispatchContext(context: ClaimedDispatch): Promise<RunDispatchRequest> {
    const runInputRef = ownerRecord(this.db, this.owner, "runInputs", context.localRunId);
    const taskRef = ownerRecord(this.db, this.owner, "tasks", context.taskId);
    const [runInputSnapshot, taskSnapshot] = await Promise.all([runInputRef.get(), taskRef.get()]);
    const runInput = RunInputDocumentSchema.safeParse(runInputSnapshot.data());
    const task = TaskDocumentSchema.safeParse(taskSnapshot.data());
    if (!runInputSnapshot.exists || !taskSnapshot.exists || !runInput.success || !task.success
      || runInput.data.runId !== context.localRunId || task.data.agentId.length === 0) {
      throw new Error("The saved run input or task is unavailable.");
    }
    const snapshotRef = ownerRecord(this.db, this.owner, "inputSnapshots", runInput.data.snapshotId);
    const agentRef = ownerRecord(this.db, this.owner, "agents", task.data.agentId);
    const [snapshotDocument, agentDocument] = await Promise.all([snapshotRef.get(), agentRef.get()]);
    const snapshot = InputSnapshotDocumentSchema.safeParse(snapshotDocument.data());
    const agent = AgentDocumentSchema.safeParse(agentDocument.data());
    if (!snapshotDocument.exists || !agentDocument.exists || !snapshot.success || !agent.success) {
      throw new Error("The saved run inputs or analyst mapping are invalid.");
    }
    const input = ManualRunSnapshotSchema.safeParse(snapshot.data.validatedInput);
    if (!input.success || input.data.task.id !== context.taskId || input.data.agent.id !== task.data.agentId
      || input.data.task.configVersion !== task.data.configVersion
      || input.data.task.promptVersion !== task.data.promptVersion
      || input.data.task.externalJobId !== task.data.externalJobId
      || input.data.agent.externalAgentId !== agent.data.externalAgentId
      || agent.data.roleKey !== task.data.agentId || !task.data.enabled || !agent.data.enabled) {
      throw new Error("The task configuration changed after this run was queued.");
    }
    return {
      localRequestId: context.localRequestId,
      localRunId: context.localRunId,
      taskId: context.taskId,
      externalJobId: input.data.task.externalJobId,
      externalAgentId: input.data.agent.externalAgentId,
      snapshotId: runInput.data.snapshotId,
      inputSnapshot: snapshot.data
    };
  }

  private async retrySafeFailure(context: ClaimedDispatch, message: string): Promise<void> {
    const workRef = this.db.collection("workItems").doc("dispatch-" + context.localRunId);
    const requestRef = ownerRecord(this.db, this.owner, "runRequests", context.localRequestId);
    const runRef = ownerRecord(this.db, this.owner, "runs", context.localRunId);
    const now = Timestamp.now();
    await this.db.runTransaction(async (transaction) => {
      const [workSnapshot, requestSnapshot, runSnapshot] = await Promise.all([
        transaction.get(workRef), transaction.get(requestRef), transaction.get(runRef)
      ]);
      const work = WorkItemDocumentSchema.safeParse(workSnapshot.data());
      const request = RunRequestDocumentSchema.safeParse(requestSnapshot.data());
      const run = RunDocumentSchema.safeParse(runSnapshot.data());
      if (!workSnapshot.exists || !requestSnapshot.exists || !runSnapshot.exists
        || !work.success || !request.success || !run.success) throw new Error("The dispatch lease records are unavailable.");
      if (request.data.dispatchState === "accepted" || work.data.state === "succeeded") return;
      if (work.data.attemptCount < MAX_SAFE_ATTEMPTS) {
        const delayMs = 2_000 * (2 ** Math.max(0, work.data.attemptCount - 1));
        transaction.update(requestRef, { dispatchState: "queued", updatedAt: now });
        transaction.update(workRef, {
          state: "queued",
          availableAt: Timestamp.fromMillis(now.toMillis() + delayMs),
          leaseOwner: null,
          leaseExpiresAt: null,
          lastError: message,
          updatedAt: now
        });
        return;
      }
      await releaseActiveTaskRunClaim(transaction, this.db, this.owner, request.data.taskId, request.data.localRunId);
      transaction.update(requestRef, { dispatchState: "failed", updatedAt: now });
      transaction.update(runRef, {
        executionStatus: "failed",
        endedAt: now,
        observedAt: now,
        errorCode: "dispatch_unavailable",
        errorSummary: message
      });
      transaction.update(workRef, {
        state: "failed",
        leaseOwner: null,
        leaseExpiresAt: null,
        terminalResult: { outcome: "failed", code: "dispatch_unavailable" },
        lastError: message,
        updatedAt: now
      });
    });
  }

  private async persistFailure(context: ClaimedDispatch, errorCode: string): Promise<void> {
    const workRef = this.db.collection("workItems").doc("dispatch-" + context.localRunId);
    const requestRef = ownerRecord(this.db, this.owner, "runRequests", context.localRequestId);
    const runRef = ownerRecord(this.db, this.owner, "runs", context.localRunId);
    const now = Timestamp.now();
    await this.db.runTransaction(async (transaction) => {
      const [workSnapshot, requestSnapshot, runSnapshot] = await Promise.all([
        transaction.get(workRef), transaction.get(requestRef), transaction.get(runRef)
      ]);
      const work = WorkItemDocumentSchema.safeParse(workSnapshot.data());
      const request = RunRequestDocumentSchema.safeParse(requestSnapshot.data());
      const run = RunDocumentSchema.safeParse(runSnapshot.data());
      if (!workSnapshot.exists || !requestSnapshot.exists || !runSnapshot.exists
        || !work.success || !request.success || !run.success) throw new Error("The dispatch records are unavailable.");
      if (request.data.dispatchState === "accepted" || work.data.state === "succeeded") return;
      await releaseActiveTaskRunClaim(transaction, this.db, this.owner, request.data.taskId, request.data.localRunId);
      transaction.update(requestRef, { dispatchState: "failed", updatedAt: now });
      transaction.update(runRef, {
        executionStatus: "failed",
        endedAt: now,
        observedAt: now,
        errorCode,
        errorSummary: "The external service rejected the run before accepting it."
      });
      transaction.update(workRef, {
        state: "failed",
        leaseOwner: null,
        leaseExpiresAt: null,
        terminalResult: { outcome: "rejected", code: errorCode },
        lastError: "The external service rejected the run before accepting it.",
        updatedAt: now
      });
    });
  }

  private async persistUnknown(context: ClaimedDispatch): Promise<void> {
    const workRef = this.db.collection("workItems").doc("dispatch-" + context.localRunId);
    const requestRef = ownerRecord(this.db, this.owner, "runRequests", context.localRequestId);
    const runRef = ownerRecord(this.db, this.owner, "runs", context.localRunId);
    const now = Timestamp.now();
    await this.db.runTransaction(async (transaction) => {
      const [workSnapshot, requestSnapshot, runSnapshot] = await Promise.all([
        transaction.get(workRef), transaction.get(requestRef), transaction.get(runRef)
      ]);
      const work = WorkItemDocumentSchema.safeParse(workSnapshot.data());
      const request = RunRequestDocumentSchema.safeParse(requestSnapshot.data());
      const run = RunDocumentSchema.safeParse(runSnapshot.data());
      if (!workSnapshot.exists || !requestSnapshot.exists || !runSnapshot.exists
        || !work.success || !request.success || !run.success) throw new Error("The dispatch records are unavailable.");
      if (request.data.dispatchState === "accepted" || work.data.state === "succeeded") return;
      transaction.update(requestRef, { dispatchState: "unknown", updatedAt: now });
      transaction.update(runRef, {
        executionStatus: "unknown",
        deliveryStatus: "unknown",
        observedAt: now,
        errorCode: "dispatch_unknown",
        errorSummary: "The external submission outcome could not be confirmed. Reconcile before any resend."
      });
      transaction.update(workRef, {
        state: "failed",
        leaseOwner: null,
        leaseExpiresAt: null,
        terminalResult: { outcome: "unknown" },
        lastError: "The external submission outcome could not be confirmed.",
        updatedAt: now
      });
    });
  }

  private async persistAccepted(context: ClaimedDispatch, externalRunId: string): Promise<void> {
    const workRef = this.db.collection("workItems").doc("dispatch-" + context.localRunId);
    const requestRef = ownerRecord(this.db, this.owner, "runRequests", context.localRequestId);
    const runRef = ownerRecord(this.db, this.owner, "runs", context.localRunId);
    const externalClaimRef = this.db.collection("externalRunKeys").doc(sha256(this.adapter.integrationId + ":" + externalRunId));
    const now = Timestamp.now();
    await this.db.runTransaction(async (transaction) => {
      const [workSnapshot, requestSnapshot, runSnapshot, externalClaimSnapshot] = await Promise.all([
        transaction.get(workRef), transaction.get(requestRef), transaction.get(runRef), transaction.get(externalClaimRef)
      ]);
      const work = WorkItemDocumentSchema.safeParse(workSnapshot.data());
      const request = RunRequestDocumentSchema.safeParse(requestSnapshot.data());
      const run = RunDocumentSchema.safeParse(runSnapshot.data());
      if (!workSnapshot.exists || !requestSnapshot.exists || !runSnapshot.exists
        || !work.success || !request.success || !run.success) throw new Error("The dispatch records are unavailable.");
      if (request.data.dispatchState === "accepted" && run.data.externalRunId === externalRunId) return;
      if (request.data.dispatchState === "failed") throw new Error("A rejected dispatch cannot later be accepted.");
      if (externalClaimSnapshot.exists && externalClaimSnapshot.get("targetPath") !== runRef.path) {
        throw new Error("The external run identifier is already attached to another local run.");
      }
      if (!externalClaimSnapshot.exists) {
        transaction.create(externalClaimRef, {
          targetPath: runRef.path,
          integrationId: this.adapter.integrationId,
          externalRunId,
          createdAt: now
        });
      }
      transaction.update(requestRef, { dispatchState: "accepted", updatedAt: now });
      transaction.update(runRef, {
        integrationId: this.adapter.integrationId,
        externalRunId,
        executionStatus: "queued",
        deliveryStatus: "pending",
        observedAt: now,
        errorCode: null,
        errorSummary: null
      });
      transaction.update(workRef, {
        state: "succeeded",
        leaseOwner: null,
        leaseExpiresAt: null,
        terminalResult: { outcome: "accepted", integrationId: this.adapter.integrationId, externalRunId },
        lastError: null,
        updatedAt: now
      });
    });
  }

  private async reconcileExpiredLeases(): Promise<void> {
    const now = Timestamp.now();
    const expired = await this.db.collection("workItems")
      .where("ownerUid", "==", this.owner.uid)
      .where("workKind", "==", "dispatch_run")
      .where("state", "==", "leased")
      .where("leaseExpiresAt", "<=", now)
      .orderBy("leaseExpiresAt", "asc")
      .orderBy(FieldPath.documentId(), "asc")
      .limit(DISPATCH_BATCH_SIZE)
      .get();
    for (const candidate of expired.docs) {
      const work = parseWorkItem(candidate);
      const payload = work ? WorkPayloadSchema.safeParse(work.payload) : null;
      if (!work || !payload?.success) {
        this.onError(new Error("An expired dispatch lease has invalid data."));
        continue;
      }
      await this.reconcileExpired(candidate.id, payload.data);
    }
  }

  private async reconcileExpired(workItemId: string, payload: WorkPayload): Promise<void> {
    const workRef = this.db.collection("workItems").doc(workItemId);
    const requestRef = ownerRecord(this.db, this.owner, "runRequests", payload.requestId);
    const runRef = ownerRecord(this.db, this.owner, "runs", payload.runId);
    const now = Timestamp.now();
    await this.db.runTransaction(async (transaction) => {
      const [workSnapshot, requestSnapshot, runSnapshot] = await Promise.all([
        transaction.get(workRef), transaction.get(requestRef), transaction.get(runRef)
      ]);
      const work = WorkItemDocumentSchema.safeParse(workSnapshot.data());
      const request = RunRequestDocumentSchema.safeParse(requestSnapshot.data());
      const run = RunDocumentSchema.safeParse(runSnapshot.data());
      if (!workSnapshot.exists || !requestSnapshot.exists || !runSnapshot.exists
        || !work.success || !request.success || !run.success) throw new Error("The expired dispatch records are unavailable.");
      const leaseExpiresAt = timestampMillis(work.data.leaseExpiresAt);
      if (work.data.state !== "leased" || leaseExpiresAt === null || leaseExpiresAt > now.toMillis()) return;
      if (request.data.dispatchState === "accepted") {
        transaction.update(workRef, {
          state: "succeeded",
          leaseOwner: null,
          leaseExpiresAt: null,
          terminalResult: { outcome: "accepted", integrationId: run.data.integrationId, externalRunId: run.data.externalRunId },
          lastError: null,
          updatedAt: now
        });
        return;
      }
      if (request.data.dispatchState === "failed") {
        transaction.update(workRef, { state: "failed", leaseOwner: null, leaseExpiresAt: null, updatedAt: now });
        return;
      }
      transaction.update(requestRef, { dispatchState: "unknown", updatedAt: now });
      transaction.update(runRef, {
        executionStatus: "unknown",
        deliveryStatus: "unknown",
        observedAt: now,
        errorCode: "dispatch_unknown",
        errorSummary: "A worker lease expired during external submission. Reconcile before any resend."
      });
      transaction.update(workRef, {
        state: "failed",
        leaseOwner: null,
        leaseExpiresAt: null,
        terminalResult: { outcome: "unknown" },
        lastError: "A worker lease expired during external submission.",
        updatedAt: now
      });
    });
  }
}
