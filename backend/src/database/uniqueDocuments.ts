import { createHash } from "node:crypto";
import { Timestamp, type DocumentData, type Firestore } from "firebase-admin/firestore";
import { ownerDocument, ownerRecord, type OwnerCollection } from "./paths.js";

export class UniqueConstraintError extends Error {
  constructor(readonly constraint: string) {
    super(`A record already exists for ${constraint}.`);
    this.name = "UniqueConstraintError";
  }
}

function hash(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/**
 * Atomically creates an owner-scoped record and its deterministic uniqueness claims.
 * Callers pass the authenticated UID; document paths are always built below that UID.
 */
export async function createOwnerDocumentWithUniqueClaims<T extends DocumentData>(args: {
  db: Firestore;
  ownerUid: string;
  collection: OwnerCollection;
  documentId: string;
  data: T;
  uniqueKeys: Array<{ name: string; value: string }>;
  globalUniqueKeys?: Array<{ name: string; value: string }>;
}): Promise<void> {
  const target = ownerRecord(args.db, args.ownerUid, args.collection, args.documentId);
  const owner = ownerDocument(args.db, args.ownerUid);
  const normalized = args.uniqueKeys.map(({ name, value }) => {
    if (!/^[a-z][a-zA-Z0-9_-]{0,63}$/.test(name) || !value.trim()) throw new Error("Invalid uniqueness key.");
    const constraint = `${name}:${value.trim()}`;
    return { constraint: name, ref: owner.collection("_unique").doc(hash(constraint)) };
  });
  const global = (args.globalUniqueKeys ?? []).map(({ name, value }) => {
    if (!/^[a-z][a-zA-Z0-9_-]{0,63}$/.test(name) || !value.trim()) throw new Error("Invalid global uniqueness key.");
    const constraint = `${name}:${value.trim()}`;
    return { constraint: name, ref: args.db.collection("externalRunKeys").doc(hash(constraint)) };
  });
  const allClaims = [...normalized, ...global];
  if (new Set(allClaims.map(({ ref }) => ref.path)).size !== allClaims.length) {
    throw new Error("Duplicate uniqueness keys were supplied.");
  }

  await args.db.runTransaction(async (transaction) => {
    const snapshots = await Promise.all([transaction.get(target), ...allClaims.map(({ ref }) => transaction.get(ref))]);
    if (snapshots[0]?.exists) throw new UniqueConstraintError("document ID");
    const existingClaim = allClaims.find((_, index) => snapshots[index + 1]?.exists);
    if (existingClaim) throw new UniqueConstraintError(existingClaim.constraint);

    for (const { constraint, ref } of allClaims) {
      transaction.create(ref, { targetPath: target.path, constraint, createdAt: Timestamp.now() });
    }
    transaction.create(target, args.data);
  });
}
