import assert from "node:assert/strict";
import test from "node:test";
import { MockResearchRuntimeAdapter } from "./mockAdapter.js";

test("mock runtime remains explicitly simulated and supports disabled tasks and queued receipts", async () => {
  const adapter = new MockResearchRuntimeAdapter({ now: () => new Date("2026-10-08T07:00:00.000+07:00") });
  const health = await adapter.checkHealth();
  const capabilities = await adapter.getCapabilities();
  const task = await adapter.createTask({
    name: "Fixture-only opportunity scan",
    agentId: "fixture-research",
    message: "Fixture instructions only.",
    schedule: { kind: "cron", expression: "0 6 * * 2-6", timezone: "Asia/Jakarta" }
  });
  const accepted = await adapter.requestRun(task.externalJobId);
  const observed = await adapter.getRun(task.externalJobId, accepted.externalRunId);

  assert.equal(health.status, "simulated");
  assert.equal(health.available, true);
  assert.equal(capabilities.mode, "mock");
  assert.equal(task.source, "mock");
  assert.equal(task.enabled, false);
  assert.equal(accepted.accepted, true);
  assert.equal(observed.executionStatus, "queued");
  assert.equal(observed.source, "mock");
});

test("mock runtime refuses the bootstrap identity", async () => {
  const adapter = new MockResearchRuntimeAdapter();
  await assert.rejects(() => adapter.createTask({
    name: "Fixture-only task",
    agentId: "main",
    message: "Fixture instructions only.",
    schedule: { kind: "cron", expression: "0 6 * * 2-6", timezone: "Asia/Jakarta" }
  }), /bootstrap agent/);
});
