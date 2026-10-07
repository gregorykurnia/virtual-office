import { createHash } from "node:crypto";
import { Timestamp, type DocumentData, type Firestore } from "firebase-admin/firestore";
import type { ZodType } from "zod";
import type { VerifiedOwnerContext } from "../auth/ownerAuth.js";
import { OwnerProfileDocumentSchema } from "@investment-office/shared";
import { ownerDocument, ownerRecord, type OwnerCollection } from "./paths.js";

export class UniqueConstraintError extends Error {
  constructor(readonly constraint: string) {
    super(`A record already exists for ${constraint}.`);
    this.name = "UniqueConstraintError";
  }
}

export class OwnerParentNotFoundError extends Error {
  constructor() {
    super("A required parent record is not available under the authenticated owner.");
    this.name = "OwnerParentNotFoundError";
  }
}

function hash(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/**
 * Atomically creates an owner-scoped record and its deterministic uniqueness claims.
 * Callers pass the verified request context; target paths are always built below it.
 */
export async function createOwnerDocumentWithUniqueClaims<T extends DocumentData>(args: {
  db: Firestore;
  owner: VerifiedOwnerContext;
  collection: OwnerCollection;
  documentId: string;
  data: T;
  schema: ZodType<T>;
  uniqueKeys: Array<{ name: string; value: string }>;
  globalUniqueKeys?: Array<{ name: string; value: string }>;
  parentRecords?: Array<{ collection: OwnerCollection; id: string }>;
}): Promise<void> {
  const validatedData = args.schema.parse(args.data);
  const target = ownerRecord(args.db, args.owner, args.collection, args.documentId);
  const owner = ownerDocument(args.db, args.owner);
  const parents = (args.parentRecords ?? []).map(({ collection, id }) => ownerRecord(args.db, args.owner, collection, id));
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

  const createdAt = Timestamp.now();
  await args.db.runTransaction(async (transaction) => {
    const snapshots = await Promise.all([
      transaction.get(target),
      transaction.get(owner),
      ...allClaims.map(({ ref }) => transaction.get(ref)),
      ...parents.map((ref) => transaction.get(ref))
    ]);
    const targetSnapshot = snapshots[0];
    const ownerSnapshot = snapshots[1];
    if (targetSnapshot?.exists) throw new UniqueConstraintError("document ID");
    if (!ownerSnapshot?.exists) throw new OwnerParentNotFoundError();
    const ownerData = OwnerProfileDocumentSchema.safeParse(ownerSnapshot.data());
    if (!ownerData.success || !ownerData.data.enabled) throw new OwnerParentNotFoundError();
    const claimOffset = 2;
    const existingClaim = allClaims.find((_, index) => snapshots[claimOffset + index]?.exists);
    if (existingClaim) throw new UniqueConstraintError(existingClaim.constraint);
    const parentOffset = claimOffset + allClaims.length;
    if (parents.some((_, index) => !snapshots[parentOffset + index]?.exists)) throw new OwnerParentNotFoundError();

    for (const { constraint, ref } of allClaims) {
      transaction.create(ref, { targetPath: target.path, constraint, createdAt });
    }
    transaction.create(target, validatedData);
  });
}
