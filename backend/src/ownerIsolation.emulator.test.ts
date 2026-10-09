import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import { AgentDocumentSchema, ReportDocumentSchema, RunDocumentSchema, TaskDocumentSchema } from "@investment-office/shared";
import { buildApp } from "./app.js";
import type { BackendConfig } from "./config.js";
import { createFirebaseServices } from "./firebase.js";

// Runs only against the local Auth and Firestore emulators. The test refuses to start
// without both emulator hosts, so it cannot reach a real Firebase project. The Auth
// emulator's unscoped sign-in endpoint resolves the project the emulator was started
// with (`firebase emulators:start --project`), so PROJECT_ID must match that project.
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST;
const PROJECT_ID = process.env.EMULATOR_PROJECT_ID ?? "virtual-office-local";
const SENTINEL = "other-owner-sentinel";

type Services = ReturnType<typeof createFirebaseServices>;
type TestUser = { uid: string; email: string; password: string; idToken: string };

function randomSuffix() {
  return randomBytes(6).toString("hex");
}

function makeConfig(ownerUid: string): BackendConfig {
  return {
    nodeEnv: "test",
    host: "127.0.0.1",
    port: 3001,
    firebaseProjectId: PROJECT_ID,
    ownerUid,
    corsOrigins: [],
    trustProxyCidrs: [],
    logLevel: "silent",
    rateLimitMax: 10_000,
    firestoreProbeDocument: "system/health"
  };
}

async function createUser(auth: Auth, label: string): Promise<TestUser> {
  const email = `${label}-${randomSuffix()}@example.test`;
  // Generated per run and never written to the repository.
  const password = randomBytes(24).toString("base64url");
  const user = await auth.createUser({ email, password, emailVerified: true });
  const response = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-local`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const body = (await response.json()) as { idToken?: string };
  assert.ok(response.ok && body.idToken, "Auth emulator did not issue an ID token.");
  return { uid: user.uid, email, password, idToken: body.idToken };
}

// Stored timestamps must be Firestore Timestamp values, as the repository's cursor
// logic requires; ISO strings would be rejected as corrupt records.
async function seedOwnerRecords(db: Firestore, uid: string, marker: string) {
  const now = Timestamp.now();
  const reportId = `report-${marker}`;
  const runId = `run-${marker}`;
  const taskId = `task-${marker}`;
  const agent = {
    roleKey: "research",
    externalAgentId: null,
    displayName: `${marker}-analyst`,
    title: "Investment Research Analyst",
    responsibility: "Isolation fixture",
    avatarKey: "research-bot",
    deskKey: "research-library",
    enabled: true,
    createdAt: now,
    updatedAt: now
  };
  const task = {
    agentId: "research",
    definitionKey: "research-deep-dive",
    name: `${marker}-task`,
    purpose: "Isolation fixture",
    inputs: [],
    missingInputs: [],
    externalJobId: null,
    promptVersion: "isolation-test",
    enabled: true,
    schedule: { expression: "manual", timezone: "Asia/Jakarta", label: "Manual" },
    observedNextRunAt: null,
    configVersion: 1,
    updatedAt: now
  };
  const run = {
    taskId,
    agentId: "research",
    integrationId: null,
    externalRunId: null,
    requestOrigin: "manual",
    executionStatus: "succeeded",
    deliveryStatus: "delivered",
    processingStatus: "processed",
    queuedAt: now,
    startedAt: now,
    endedAt: now,
    observedAt: now,
    errorCode: null,
    errorSummary: null,
    rawExternalStatus: null,
    reportId
  };
  const report = {
    agentId: "research",
    taskId,
    runId,
    title: `${marker} report`,
    summary: `${marker} summary`,
    bodyMarkdown: `${marker} body`,
    generatedAt: now,
    dataAsOf: null,
    mode: "live",
    schemaVersion: 3,
    promptVersion: "isolation-test",
    revision: 0
  };
  // Validate against the shared contracts; the stored objects keep their Timestamp values.
  AgentDocumentSchema.parse(agent);
  TaskDocumentSchema.parse(task);
  RunDocumentSchema.parse(run);
  ReportDocumentSchema.parse(report);

  const base = `owners/${uid}`;
  const batch = db.batch();
  batch.set(db.doc(`${base}/agents/research`), agent);
  batch.set(db.doc(`${base}/tasks/${taskId}`), task);
  batch.set(db.doc(`${base}/runs/${runId}`), run);
  batch.set(db.doc(`${base}/reports/${reportId}`), report);
  await batch.commit();
  return { reportId, runId };
}

describe("owner isolation against the Firebase emulators", () => {
  let services: Services;
  let owner: TestUser;
  let other: TestUser;
  let ownerRecords: { reportId: string; runId: string };
  let otherRecords: { reportId: string; runId: string };
  let app: Awaited<ReturnType<typeof buildApp>> | undefined;

  before(async () => {
    if (!AUTH_HOST || !FIRESTORE_HOST) {
      throw new Error("Set FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST before running the emulator isolation test.");
    }
    services = createFirebaseServices(makeConfig("placeholder"));
    owner = await createUser(services.auth, "owner");
    other = await createUser(services.auth, "other");
    ownerRecords = await seedOwnerRecords(services.firestore, owner.uid, "owner");
    otherRecords = await seedOwnerRecords(services.firestore, other.uid, SENTINEL);
    // The "not present" assertions below are meaningful only if the other owner's data exists.
    const seededOther = await services.firestore.doc(`owners/${other.uid}/reports/${otherRecords.reportId}`).get();
    assert.ok(seededOther.exists, "Other owner's sentinel report was not seeded.");
    app =await buildApp({ config: makeConfig(owner.uid), auth: services.auth, firestore: services.firestore });
  });

  after(async () => {
    await app?.close();
    if (!services) return;
    await Promise.all([owner, other].filter(Boolean).map(async (user) => {
      await services.firestore.recursiveDelete(services.firestore.doc(`owners/${user.uid}`));
      await services.auth.deleteUser(user.uid).catch(() => undefined);
    }));
  });

  const get = (url: string, token?: string) => app!.inject({
    method: "GET",
    url,
    headers: token ? { authorization: `Bearer ${token}` } : {}
  });

  it("rejects anonymous and malformed sessions before reading any owner data", async () => {
    const anonymous = await get("/api/reports");
    assert.equal(anonymous.statusCode, 401);
    const malformed = await get("/api/reports", "not-a-firebase-token");
    assert.equal(malformed.statusCode, 401);
    assert.equal(malformed.json().error.code, "invalid_session");
  });

  it("denies a valid non-owner account on every private route", async () => {
    const routes = [
      "/api/auth/session",
      "/api/agents",
      "/api/reports",
      `/api/reports/${otherRecords.reportId}`,
      "/api/runs",
      `/api/runs/${otherRecords.runId}`
    ];
    for (const url of routes) {
      const response = await get(url, other.idToken);
      assert.equal(response.statusCode, 403, `${url} should deny a non-owner account`);
      assert.equal(response.json().error.code, "owner_access_required");
      assert.ok(!response.body.includes(SENTINEL), `${url} leaked owner data to a non-owner`);
    }
  });

  it("returns the allowlisted owner's session identity", async () => {
    const response = await get("/api/auth/session", owner.idToken);
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().data.uid, owner.uid);
  });

  it("lists only the owner's reports and never the other owner's reports", async () => {
    const response = await get("/api/reports", owner.idToken);
    assert.equal(response.statusCode, 200);
    assert.ok(response.body.includes(ownerRecords.reportId), "owner's own report should be listed");
    assert.ok(!response.body.includes(SENTINEL), "owner report list contains the other owner's data");
    assert.ok(!response.body.includes(otherRecords.reportId), "owner report list contains the other owner's report ID");
  });

  it("returns not found for the other owner's report, run, and agent identifiers", async () => {
    const report = await get(`/api/reports/${otherRecords.reportId}`, owner.idToken);
    assert.equal(report.statusCode, 404);
    assert.ok(!report.body.includes(SENTINEL));

    const run = await get(`/api/runs/${otherRecords.runId}`, owner.idToken);
    assert.equal(run.statusCode, 404);
    assert.ok(!run.body.includes(SENTINEL));

    const agents = await get("/api/agents", owner.idToken);
    assert.equal(agents.statusCode, 200);
    assert.ok(!agents.body.includes(SENTINEL), "owner agent list contains the other owner's data");
  });

  it("returns the owner's own report detail", async () => {
    const response = await get(`/api/reports/${ownerRecords.reportId}`, owner.idToken);
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().data.report.id, ownerRecords.reportId);
    assert.ok(!response.body.includes(SENTINEL));
  });

  it("rejects an ID token after the owner's refresh tokens are revoked", async () => {
    // Revocation compares whole-second issue times, so wait before revoking to avoid a same-second tie.
    await new Promise((resolve) => setTimeout(resolve, 1_100));
    await services.auth.revokeRefreshTokens(owner.uid);
    const response = await get("/api/auth/session", owner.idToken);
    assert.equal(response.statusCode, 401);
    assert.equal(response.json().error.code, "invalid_session");
  });
});
