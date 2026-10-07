import type { Firestore } from "firebase-admin/firestore";

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

export function ownerDocument(db: Firestore, ownerUid: string) {
  return db.collection("owners").doc(assertPathSegment(ownerUid, "owner UID"));
}

export function ownerCollection(db: Firestore, ownerUid: string, collection: OwnerCollection) {
  return ownerDocument(db, ownerUid).collection(collection);
}

export function ownerRecord(db: Firestore, ownerUid: string, collection: OwnerCollection, recordId: string) {
  return ownerCollection(db, ownerUid, collection).doc(assertPathSegment(recordId, "document ID"));
}

export function assertOwnerPath(ownerUid: string, documentPath: string): void {
  const prefix = `owners/${assertPathSegment(ownerUid, "owner UID")}/`;
  if (!documentPath.startsWith(prefix)) throw new Error("Cross-owner document reference rejected.");
}
