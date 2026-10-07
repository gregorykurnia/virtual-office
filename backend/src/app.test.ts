import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import type { BackendConfig } from "./config.js";
import { buildApp } from "./app.js";

const config: BackendConfig = {
  nodeEnv: "test",
  host: "127.0.0.1",
  port: 3001,
  firebaseProjectId: "virtual-office-test",
  ownerUid: "owner-a",
  corsOrigins: [],
  trustProxyCidrs: [],
  logLevel: "silent",
  rateLimitMax: 100,
  firestoreProbeDocument: "system/health"
};

function makeAuth() {
  return {
    async verifyIdToken(token: string) {
      if (token === "expired-token") throw Object.assign(new Error("expired"), { code: "auth/id-token-expired" });
      if (token === "owner-token") return { uid: "owner-a", email: "owner@example.test", name: "Owner" };
      if (token === "other-token") return { uid: "owner-b", email: "other@example.test" };
      throw Object.assign(new Error("invalid"), { code: "auth/invalid-id-token" });
    }
  } as unknown as Auth;
}

function makeFirestore(records: Record<string, unknown> = {}) {
  const accessedPaths: string[] = [];
  type FakeSnapshot = { exists: boolean; data: () => unknown };
  type FakeDocument = {
    id: string;
    path: string;
    collection: (name: string) => FakeCollection;
    get: () => Promise<FakeSnapshot>;
  };
  type FakeCollection = { doc: (id: string) => FakeDocument };
  const collectionAt = (path: string): FakeCollection => ({
    doc(id: string) {
      const documentPath = `${path}/${id}`;
      return {
        id,
        path: documentPath,
        collection(name: string) {
          return collectionAt(`${documentPath}/${name}`);
        },
        async get() {
          accessedPaths.push(documentPath);
          const data = records[documentPath];
          return { exists: data !== undefined, data: () => data };
        }
      };
    }
  });
  return {
    firestore: { collection: (name: string) => collectionAt(name) } as unknown as Firestore,
    accessedPaths
  };
}

describe("private API owner boundary", () => {
  let app: Awaited<ReturnType<typeof buildApp>> | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("rejects missing and expired Firebase tokens", async () => {
    const { firestore } = makeFirestore();
    app = await buildApp({ config, auth: makeAuth(), firestore });

    const anonymous = await app.inject({ method: "GET", url: "/api/reports" });
    const expired = await app.inject({
      method: "GET",
      url: "/api/reports",
      headers: { authorization: "Bearer expired-token" }
    });

    assert.equal(anonymous.statusCode, 401);
    assert.equal(anonymous.json().error.code, "unauthenticated");
    assert.equal(expired.statusCode, 401);
    assert.equal(expired.json().error.code, "invalid_session");
  });

  it("rejects a valid token for a nonallowlisted Firebase UID", async () => {
    const { firestore } = makeFirestore();
    app = await buildApp({ config, auth: makeAuth(), firestore });

    const response = await app.inject({
      method: "GET",
      url: "/api/reports",
      headers: { authorization: "Bearer other-token" }
    });

    assert.equal(response.statusCode, 403);
    assert.equal(response.json().error.code, "owner_access_required");
  });

  it("accepts the allowlisted verified owner and exposes that token identity", async () => {
    const { firestore } = makeFirestore();
    app = await buildApp({ config, auth: makeAuth(), firestore });

    const response = await app.inject({
      method: "GET",
      url: "/api/auth/session",
      headers: { authorization: "Bearer owner-token" }
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().data.uid, "owner-a");
  });

  it("does not use a caller-supplied owner UID to resolve a report", async () => {
    const { firestore, accessedPaths } = makeFirestore({
      "owners/owner-b/reports/private-report": { title: "Must remain inaccessible" }
    });
    app = await buildApp({ config, auth: makeAuth(), firestore });

    const response = await app.inject({
      method: "GET",
      url: "/api/reports/private-report?ownerUid=owner-b",
      headers: { authorization: "Bearer owner-token" }
    });

    assert.equal(response.statusCode, 404);
    assert.deepEqual(accessedPaths, ["owners/owner-a/reports/private-report"]);
  });
});
