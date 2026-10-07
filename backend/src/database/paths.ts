import type { Firestore } from "firebase-admin/firestore";
import type { VerifiedOwnerContext } from "../auth/ownerAuth.js";

export const OWNER_COLLECTIONS = [
  "agents",
  "tasks",
  "runs",
  "reports",
  "reportSources",
  "reportReads",
  "holdings",
  "watchlist",
  "inputSnapshots",
  "runInputs",
  "conversations",
  "preferences",
  "runRequests",
  "taskMutations",
  "notificationOutbox",
  "auditEvents"
] as const;

export type OwnerCollection = (typeof OWNER_COLLECTIONS)[number];

function assertPathSegment(value: string, label: string): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(value)) throw new Error(`Invalid ${label}.`);
  return value;
}

export function ownerDocument(db: Firestore, owner: VerifiedOwnerContext) {
  return db.collection("owners").doc(assertPathSegment(owner.uid, "owner UID"));
}

export function ownerCollection(db: Firestore, owner: VerifiedOwnerContext, collection: OwnerCollection) {
  return ownerDocument(db, owner).collection(collection);
}

export function ownerRecord(db: Firestore, owner: VerifiedOwnerContext, collection: OwnerCollection, recordId: string) {
  return ownerCollection(db, owner, collection).doc(assertPathSegment(recordId, "document ID"));
}

export function assertOwnerPath(owner: VerifiedOwnerContext, documentPath: string): void {
  const prefix = `owners/${assertPathSegment(owner.uid, "owner UID")}/`;
  if (!documentPath.startsWith(prefix)) throw new Error("Cross-owner document reference rejected.");
}
