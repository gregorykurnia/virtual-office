import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, before, describe, it } from "node:test";
import type { Auth } from "firebase-admin/auth";
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { DatabaseSchemaVersion } from "@investment-office/shared";
import { z } from "zod";
import { createSystemOwnerContext, type OwnerPathContext } from "./auth/ownerAuth.js";
import type { BackendConfig } from "./config.js";
import { createFirebaseServices } from "./firebase.js";
import { applyDatabaseMigrations } from "./database/migrations.js";
import { createOwnerDocumentWithUniqueClaims, OwnerParentNotFoundError, UniqueConstraintError } from "./database/uniqueDocuments.js";

// Runs only against the local Auth and Firestore emulators. Like the owner-isolation test,
// it refuses to start without both emulator hosts, so it cannot reach a real Firebase project.
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST;
const PROJECT_ID = process.env.EMULATOR_PROJECT_ID ?? "virtual-office-local";
const DOCUMENTS_URL = `http://${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const MIGRATION_DOCUMENT = "schemaVersions/0001";
// Test-only: the Firestore emulator treats this bearer token as an admin and skips Rules.
const EMULATOR_ADMIN_TOKEN = "owner";

const TestRecordSchema = z.object({ label: z.string().min(1) });

type ClaimOptions = {
  uniqueKeys?: Array<{ name: string; value: string }>;
  globalUniqueKeys?: Array<{ name: string; value: string }>;
  parentRecords?: Array<{ collection: "agents"; id: string }>;
};

function randomSuffix() {
  return randomBytes(6).toString("hex");
}

function makeConfig(): BackendConfig {
  return {
    nodeEnv: "test",
    host: "127.0.0.1",
    port: 3001,
    firebaseProjectId: PROJECT_ID,
    ownerUid: "placeholder",
    corsOrigins: [],
    trustProxyCidrs: [],
    logLevel: "silent",
    rateLimitMax: 10_000,
    firestoreProbeDocument: "system/health"
  };
}

function timeKey(snapshotTime: { seconds: number; nanoseconds: number } | undefined) {
  return snapshotTime ? `${snapshotTime.seconds}:${snapshotTime.nanoseconds}` : "missing";
}

describe("database migrations and uniqueness against the Firestore emulator", () => {
  let services: ReturnType<typeof createFirebaseServices>;
  let auth: Auth;
  let db: Firestore;
  const ownerUids: string[] = [];
  const globalClaimTargets: string[] = [];

  const newOwnerUid = (label: string) => {
    const uid = `db-${label}-${randomSuffix()}`;
    ownerUids.push(uid);
    return uid;
  };

  // Migrates a fresh owner so that its profile exists and the owner is enabled.
  const freshOwner = async (label: string): Promise<OwnerPathContext> => {
    const owner = createSystemOwnerContext(newOwnerUid(label));
    await applyDatabaseMigrations(db, owner.uid);
    return owner;
  };

  const createRecord = (owner: OwnerPathContext, documentId: string, options: ClaimOptions = {}) =>
    createOwnerDocumentWithUniqueClaims({
      db,
      owner,
      collection: "agents",
      documentId,
      data: { label: documentId },
      schema: TestRecordSchema,
      uniqueKeys: options.uniqueKeys ?? [],
      globalUniqueKeys: options.globalUniqueKeys ?? [],
      parentRecords: options.parentRecords ?? []
    });

  const recordExists = async (uid: string, documentId: string) =>
    (await db.doc(`owners/${uid}/agents/${documentId}`).get()).exists;

  const claimCount = async (uid: string) =>
    (await db.collection(`owners/${uid}/_unique`).get()).size;

  const timesOf = async (paths: string[]) => {
    const snapshots = await Promise.all(paths.map((path) => db.doc(path).get()));
    return snapshots.map((snapshot) => `${timeKey(snapshot.createTime)}|${timeKey(snapshot.updateTime)}`);
  };

  const constraintError = (constraint: string) => (error: unknown) =>
    error instanceof UniqueConstraintError && error.constraint === constraint;

  // Minimal REST client for Rules checks. Requests carry no admin bypass unless a test asks for one.
  const rest = async (method: "GET" | "POST" | "PATCH", url: string, options: { body?: unknown; token?: string } = {}) => {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (options.token) headers.authorization = `Bearer ${options.token}`;
    const response = await fetch(url, {
      method,
      headers,
      body: options.body === undefined ? null : JSON.stringify(options.body)
    });
    const body = (await response.json()) as { error?: { status?: string } };
    return { status: response.status, errorStatus: body.error?.status };
  };

  const signInAsBrowserUser = async () => {
    const email = `browser-${randomSuffix()}@example.test`;
    // Generated per run and never written to the repository.
    const password = randomBytes(24).toString("base64url");
    await auth.createUser({ email, password, emailVerified: true });
    const response = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-local`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const body = (await response.json()) as { idToken?: string };
    assert.ok(response.ok && body.idToken, "Auth emulator did not issue an ID token.");
    return body.idToken;
  };

  before(() => {
    if (!AUTH_HOST || !FIRESTORE_HOST) {
      throw new Error("Set FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST before running the database emulator tests.");
    }
    services = createFirebaseServices(makeConfig());
    auth = services.auth;
    db = services.firestore;
  });

  after(async () => {
    if (!services) return;
    await Promise.all(globalClaimTargets.map(async (targetPath) => {
      const claims = await db.collection("externalRunKeys").where("targetPath", "==", targetPath).get();
      await Promise.all(claims.docs.map((claim) => claim.ref.delete()));
    }));
    await Promise.all(ownerUids.map((uid) => db.recursiveDelete(db.doc(`owners/${uid}`))));
  });

  describe("migrations", () => {
    it("creates the schema marker, migration record, and owner profile", async () => {
      const uid = newOwnerUid("first-run");
      const result = await applyDatabaseMigrations(db, uid);
      assert.equal(result.schemaVersion, DatabaseSchemaVersion);

      const schema = await db.doc("system/schema").get();
      assert.equal(schema.get("version"), DatabaseSchemaVersion);

      const migration = await db.doc(MIGRATION_DOCUMENT).get();
      assert.equal(migration.get("version"), DatabaseSchemaVersion);
      assert.equal(migration.get("name"), "initialize-owner-scoped-workspace");

      const profile = await db.doc(`owners/${uid}`).get();
      assert.equal(profile.get("enabled"), true);
      assert.equal(profile.get("schemaVersion"), DatabaseSchemaVersion);
      assert.equal(profile.get("displayName"), null);
    });

    it("writes nothing when repeated, so existing records keep their timestamps", async () => {
      const uid = newOwnerUid("repeat");
      await applyDatabaseMigrations(db, uid);
      const paths = [MIGRATION_DOCUMENT, `owners/${uid}`];
      const before = await timesOf(paths);

      const result = await applyDatabaseMigrations(db, uid);
      assert.equal(result.schemaVersion, DatabaseSchemaVersion);
      assert.deepEqual(await timesOf(paths), before, "a repeated migration rewrote an existing record");
    });

    it("applies once when several runs start at the same time", async () => {
      const uid = newOwnerUid("concurrent");
      const results = await Promise.all([1, 2, 3].map(() => applyDatabaseMigrations(db, uid)));
      assert.deepEqual(results.map((result) => result.schemaVersion), [DatabaseSchemaVersion, DatabaseSchemaVersion, DatabaseSchemaVersion]);

      const profile = await db.doc(`owners/${uid}`).get();
      assert.equal(profile.get("enabled"), true);
      assert.equal(profile.get("schemaVersion"), DatabaseSchemaVersion);
    });

    it("fails closed and writes nothing when the owner profile is newer than this backend", async () => {
      const uid = newOwnerUid("newer-profile");
      const now = Timestamp.now();
      await db.doc(`owners/${uid}`).set({ displayName: null, enabled: true, schemaVersion: DatabaseSchemaVersion + 1, createdAt: now, updatedAt: now });
      const paths = ["system/schema", `owners/${uid}`];
      const before = await timesOf(paths);

      await assert.rejects(applyDatabaseMigrations(db, uid), /is newer than this backend supports/);
      assert.deepEqual(await timesOf(paths), before, "a rejected migration left a partial write behind");
    });
  });

  describe("unique records", () => {
    it("creates the record and one claim per unique key", async () => {
      const owner = await freshOwner("create");
      await createRecord(owner, "rec-1", { uniqueKeys: [{ name: "symbolKey", value: "MSFT" }] });

      assert.equal(await recordExists(owner.uid, "rec-1"), true);
      assert.equal(await claimCount(owner.uid), 1);
    });

    it("rejects a second record with the same unique key, even with extra whitespace, and writes nothing", async () => {
      const owner = await freshOwner("duplicate-key");
      await createRecord(owner, "rec-1", { uniqueKeys: [{ name: "symbolKey", value: "MSFT" }] });

      await assert.rejects(
        createRecord(owner, "rec-2", { uniqueKeys: [{ name: "symbolKey", value: "  MSFT " }] }),
        constraintError("symbolKey")
      );
      assert.equal(await recordExists(owner.uid, "rec-2"), false);
      assert.equal(await claimCount(owner.uid), 1);
    });

    it("rejects a reused document ID without leaving a partial claim behind", async () => {
      const owner = await freshOwner("duplicate-id");
      await createRecord(owner, "rec-1", { uniqueKeys: [{ name: "symbolKey", value: "MSFT" }] });

      await assert.rejects(
        createRecord(owner, "rec-1", { uniqueKeys: [{ name: "symbolKey", value: "AAPL" }] }),
        constraintError("document ID")
      );
      assert.equal(await claimCount(owner.uid), 1, "the rejected request left a claim for AAPL");

      // AAPL is still free, so a new record can claim it. This proves the rejected request claimed nothing.
      await createRecord(owner, "rec-2", { uniqueKeys: [{ name: "symbolKey", value: "AAPL" }] });
      assert.equal(await claimCount(owner.uid), 2);
    });

    it("rejects a unique key already claimed in the global namespace by another owner", async () => {
      const first = await freshOwner("global-first");
      const second = await freshOwner("global-second");
      const externalKey = `run-${randomSuffix()}`;
      await createRecord(first, "agents-first", { globalUniqueKeys: [{ name: "externalRunKey", value: externalKey }] });
      globalClaimTargets.push(`owners/${first.uid}/agents/agents-first`);

      await assert.rejects(
        createRecord(second, "agents-second", { globalUniqueKeys: [{ name: "externalRunKey", value: externalKey }] }),
        constraintError("externalRunKey")
      );
      assert.equal(await recordExists(second.uid, "agents-second"), false);
      assert.equal(await claimCount(second.uid), 0);
    });

    it("rejects duplicate unique keys supplied in one request", async () => {
      const owner = await freshOwner("same-request");
      await assert.rejects(
        createRecord(owner, "rec-1", { uniqueKeys: [{ name: "symbolKey", value: "NVDA" }, { name: "symbolKey", value: "NVDA" }] }),
        /Duplicate uniqueness keys were supplied/
      );
      assert.equal(await recordExists(owner.uid, "rec-1"), false);
      assert.equal(await claimCount(owner.uid), 0);
    });

    it("accepts a parent under the same owner and rejects a parent that only exists under another owner", async () => {
      const parentOwner = await freshOwner("parent-owner");
      const childOwner = await freshOwner("child-owner");
      await createRecord(parentOwner, "shared-parent");
      await createRecord(childOwner, "own-parent");

      await createRecord(childOwner, "child-ok", { parentRecords: [{ collection: "agents", id: "own-parent" }] });
      assert.equal(await recordExists(childOwner.uid, "child-ok"), true);

      await assert.rejects(
        createRecord(childOwner, "child-cross", { parentRecords: [{ collection: "agents", id: "shared-parent" }] }),
        OwnerParentNotFoundError
      );
      assert.equal(await recordExists(childOwner.uid, "child-cross"), false);
    });

    it("rejects writes for a disabled owner and for an owner with no profile", async () => {
      const disabled = await freshOwner("disabled");
      await db.doc(`owners/${disabled.uid}`).update({ enabled: false });
      await assert.rejects(createRecord(disabled, "rec-1"), OwnerParentNotFoundError);
      assert.equal(await recordExists(disabled.uid, "rec-1"), false);

      const missing = createSystemOwnerContext(newOwnerUid("no-profile"));
      await assert.rejects(createRecord(missing, "rec-1"), OwnerParentNotFoundError);
      assert.equal((await db.doc(`owners/${missing.uid}`).get()).exists, false, "a missing owner was created implicitly");
    });
  });

  describe("Firestore Rules", () => {
    it("denies unauthenticated reads, lists, queries, and writes, even for records that exist", async () => {
      const owner = await freshOwner("rules-anonymous");
      await createRecord(owner, "rec-1");
      const recordUrl = `${DOCUMENTS_URL}/owners/${owner.uid}/agents/rec-1`;

      // Control: the emulator's admin token reads the same record, so the denials below come from Rules.
      const control = await rest("GET", recordUrl, { token: EMULATOR_ADMIN_TOKEN });
      assert.equal(control.status, 200);

      const denied = [
        await rest("GET", recordUrl),
        await rest("GET", `${DOCUMENTS_URL}/owners/${owner.uid}/agents`),
        await rest("GET", `${DOCUMENTS_URL}/system/schema`),
        await rest("POST", `${DOCUMENTS_URL}/owners/${owner.uid}/agents?documentId=rec-browser`, { body: { fields: {} } }),
        await rest("PATCH", `${DOCUMENTS_URL}/owners/${owner.uid}`, { body: { fields: { enabled: { booleanValue: false } } } }),
        await rest("POST", `${DOCUMENTS_URL}:runQuery`, {
          body: { structuredQuery: { from: [{ collectionId: "agents", allDescendants: true }] } }
        })
      ];
      for (const response of denied) {
        assert.equal(response.status, 403);
        assert.equal(response.errorStatus, "PERMISSION_DENIED");
      }
    });

    it("denies a signed-in browser account, including on its own owner path", async () => {
      const owner = await freshOwner("rules-signed-in");
      await createRecord(owner, "rec-1");
      const token = await signInAsBrowserUser();

      const read = await rest("GET", `${DOCUMENTS_URL}/owners/${owner.uid}/agents/rec-1`, { token });
      assert.equal(read.status, 403);
      assert.equal(read.errorStatus, "PERMISSION_DENIED");

      const write = await rest("PATCH", `${DOCUMENTS_URL}/owners/${owner.uid}/agents/rec-1`, {
        token,
        body: { fields: { label: { stringValue: "changed" } } }
      });
      assert.equal(write.status, 403);
      assert.equal(write.errorStatus, "PERMISSION_DENIED");
    });
  });
});
