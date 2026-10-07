import { createHash } from "node:crypto";
import type { Transaction, Firestore } from "firebase-admin/firestore";
import type { OwnerPathContext } from "../auth/ownerAuth.js";
import { ownerCollection, ownerRecord } from "./paths.js";

function activeTaskClaimId(taskId: string): string {
  return createHash("sha256").update("activeTaskRun:" + taskId, "utf8").digest("hex");
}

export function activeTaskRunClaim(db: Firestore, owner: OwnerPathContext, taskId: string) {
  return ownerCollection(db, owner, "_unique").doc(activeTaskClaimId(taskId));
}

/** Release only the lock held by this run. Call inside the terminal-state transaction. */
export async function releaseActiveTaskRunClaim(
  transaction: Transaction,
  db: Firestore,
  owner: OwnerPathContext,
  taskId: string,
  runId: string
): Promise<void> {
  const claimRef = activeTaskRunClaim(db, owner, taskId);
  const claimSnapshot = await transaction.get(claimRef);
  const expectedRunPath = ownerRecord(db, owner, "runs", runId).path;
  if (claimSnapshot.exists && claimSnapshot.get("targetRunId") === runId
    && claimSnapshot.get("targetPath") === expectedRunPath) {
    transaction.delete(claimRef);
  }
}
