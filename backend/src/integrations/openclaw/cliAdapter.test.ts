import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { OpenClawCliRuntimeAdapter, ResearchRuntimeAdapterError } from "./cliAdapter.js";
import type { OpenClawCommandOptions, OpenClawCommandRunner } from "./cliAdapter.js";

const fixture = (name: string): unknown => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8")) as unknown;

const agentTurnFixture = fixture("task-disabled-agent-turn.json") as Record<string, unknown>;
const commandTaskFixture = fixture("task-disabled-command.json") as Record<string, unknown>;
const acceptanceFixture = fixture("run-accepted.json") as Record<string, unknown>;
const runSuccessFixture = fixture("run-success.json") as Record<string, unknown>;
const runFailureFixture = fixture("run-failure.json") as Record<string, unknown>;
const runHistoryFixture = {
  entries: [runSuccessFixture, runFailureFixture],
  offset: 0,
  limit: 50,
  totalCount: 2
};

function object(value: unknown): Record<string, unknown> {
  assert.equal(typeof value, "object");
  assert.ok(value !== null);
  return value as Record<string, unknown>;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

class FixtureCommandRunner implements OpenClawCommandRunner {
  readonly calls: Array<{ args: string[]; options: OpenClawCommandOptions }> = [];
  readonly jobs = new Map<string, Record<string, unknown>>();
  version = "OpenClaw 2026.9.8 (fixture)";
  private sequence = 0;

  constructor() {
    this.jobs.set(String(agentTurnFixture.id), clone(agentTurnFixture));
    this.jobs.set(String(commandTaskFixture.id), clone(commandTaskFixture));
    this.jobs.set("main-job", {
      id: "main-job",
      name: "Bootstrap fixture",
      agentId: "main",
      enabled: false,
      schedule: { kind: "cron", expr: "0 6 * * 2-6", tz: "Asia/Jakarta" },
      sessionTarget: "isolated",
      payload: { kind: "agentTurn", message: "Fixture only." },
      state: {}
    });
  }

  async run(_executablePath: string, args: readonly string[], options: OpenClawCommandOptions): Promise<string> {
    this.calls.push({ args: [...args], options });
    if (args[0] === "--version") return this.version;
    if (args[0] === "agents" && args[1] === "list") return JSON.stringify(fixture("agents-list.json"));
    if (args[0] === "gateway" && args[1] === "status") return JSON.stringify({ gateway: { version: "2026.9.8" }, rpc: { ok: true } });
    if (args[0] === "automations" && args[1] === "get") {
      const job = this.jobs.get(args[2]!);
      if (!job) throw new Error("fixture job not found");
      return JSON.stringify(job);
    }
    if (args[0] === "automations" && args[1] === "add") {
      this.sequence += 1;
      const id = `fixture-created-${this.sequence}`;
      const value = (flag: string): string => {
        const index = args.indexOf(flag);
        assert.notEqual(index, -1, `expected ${flag} in argument array`);
        return args[index + 1]!;
      };
      const job = {
        fixtureOnly: true,
        id,
        name: value("--name"),
        agentId: value("--agent"),
        enabled: false,
        schedule: { kind: "cron", expr: value("--cron"), tz: value("--tz") },
        sessionTarget: value("--session"),
        payload: {
          kind: "agentTurn",
          message: value("--message"),
          ...(args.includes("--timeout-seconds") ? { timeoutSeconds: Number(value("--timeout-seconds")) } : {})
        },
        state: {}
      };
      this.jobs.set(id, job);
      return JSON.stringify({ ok: true, job: { id } });
    }
    if (args[0] === "automations" && args[1] === "edit") {
      const job = this.jobs.get(args[2]!);
      if (!job) throw new Error("fixture job not found");
      const payload = object(job.payload);
      const schedule = object(job.schedule);
      const value = (flag: string): string | undefined => {
        const index = args.indexOf(flag);
        return index < 0 ? undefined : args[index + 1];
      };
      if (value("--name") !== undefined) job.name = value("--name");
      if (value("--agent") !== undefined) job.agentId = value("--agent");
      if (value("--message") !== undefined) payload.message = value("--message");
      if (value("--cron") !== undefined) schedule.expr = value("--cron");
      if (value("--tz") !== undefined) schedule.tz = value("--tz");
      if (value("--timeout-seconds") !== undefined) payload.timeoutSeconds = Number(value("--timeout-seconds"));
      if (args.includes("--disabled")) job.enabled = false;
      return JSON.stringify({ ok: true });
    }
    if (args[0] === "automations" && args[1] === "run") return JSON.stringify(acceptanceFixture);
    if (args[0] === "automations" && args[1] === "runs") {
      const runIdIndex = args.indexOf("--run-id");
      if (runIdIndex >= 0) {
        const runId = args[runIdIndex + 1]!;
        const page = object(clone(runHistoryFixture));
        const entries = page.entries as Array<Record<string, unknown>>;
        const match = entries.find((entry) => entry.runId === runId) ?? entries[0]!;
        return JSON.stringify({ entries: [{ ...match, runId }] });
      }
      return JSON.stringify(runHistoryFixture);
    }
    throw new Error("unexpected fixture command");
  }
}

function createAdapter(runner: FixtureCommandRunner, version?: string): OpenClawCliRuntimeAdapter {
  if (version) runner.version = version;
  return new OpenClawCliRuntimeAdapter({
    executablePath: "/srv/openclaw/.local/bin/openclaw",
    connectionConfigPath: "/srv/investment-office/openclaw-connection.json",
    stateDirectory: "/srv/investment-office/openclaw-state",
    workingDirectory: "/srv/investment-office/openclaw-work",
    connectionEnvironment: {
      OPENCLAW_GATEWAY_URL: "ws://127.0.0.1:18789",
      OPENCLAW_GATEWAY_TOKEN: "fixture-token-do-not-log"
    },
    verifiedExternalAgentIds: ["fixture-market"],
    verifiedTaskMappings: [
      { externalJobId: String(agentTurnFixture.id), externalAgentId: "fixture-market" },
      { externalJobId: String(commandTaskFixture.id), externalAgentId: "fixture-market" },
      { externalJobId: "main-job", externalAgentId: "fixture-market" }
    ],
    commandRunner: runner,
    now: () => new Date("2026-10-08T07:00:00.000+07:00")
  });
}

test("pins CLI/Gateway versions and reports explicit read capabilities", async () => {
  const runner = new FixtureCommandRunner();
  const adapter = createAdapter(runner);
  const capabilities = await adapter.getCapabilities();
  const health = await adapter.checkHealth();

  assert.equal(capabilities.available, true);
  assert.equal(capabilities.runtimeVersion, "2026.9.8");
  assert.equal(capabilities.features.cancellation, false);
  assert.equal(capabilities.features.eventStreaming, false);
  assert.equal(capabilities.features.inputSnapshotBinding, false);
  assert.equal(health.available, true);
  assert.equal(health.gatewayVersion, "2026.9.8");
  assert.equal(runner.calls.some((call) => call.args.includes("--require-rpc")), true);
});

test("maps observed agents and tasks without exposing private workspace or prompt fields", async () => {
  const runner = new FixtureCommandRunner();
  const adapter = createAdapter(runner);
  const agents = await adapter.listAgents();
  const task = await adapter.getTask(String(commandTaskFixture.id));

  assert.deepEqual(agents.map((agent) => agent.externalAgentId), ["main"]);
  assert.equal("workspace" in agents[0]!, false);
  assert.equal(task.payloadKind, "command");
  assert.equal(task.enabled, false);
  assert.equal("argv" in task, false);
  await assert.rejects(() => adapter.requestRun(task.externalJobId), (error: unknown) => {
    assert.ok(error instanceof ResearchRuntimeAdapterError);
    assert.equal(error.code, "external_task_not_allowed");
    return true;
  });
});

test("creates disabled isolated agent jobs with argv and reads the saved definition back", async () => {
  const runner = new FixtureCommandRunner();
  const adapter = createAdapter(runner);
  const definition = {
    name: "Fixture market task",
    agentId: "fixture-market",
    message: "Fixture instructions only.",
    schedule: { kind: "cron" as const, expression: "0 6 * * 2-6", timezone: "Asia/Jakarta" },
    timeoutSeconds: 600
  };
  const task = await adapter.createTask(definition);
  const addCall = runner.calls.find((call) => call.args[0] === "automations" && call.args[1] === "add");

  assert.equal(task.source, "openclaw-cli");
  assert.equal(task.enabled, false);
  assert.equal(task.sessionTarget, "isolated");
  assert.equal(task.payloadKind, "agentTurn");
  assert.ok(addCall);
  assert.equal(addCall.options.shell, false);
  assert.equal(addCall.args.includes("--disabled"), true);
  assert.equal(addCall.args.includes("--no-deliver"), true);
  assert.equal(addCall.args[addCall.args.indexOf("--message") + 1], definition.message);
  assert.equal(addCall.args.includes("fixture-token-do-not-log"), false);
  assert.equal(addCall.options.env.OPENCLAW_GATEWAY_TOKEN, "fixture-token-do-not-log");
  assert.equal(addCall.options.env.DATABASE_URL, undefined);
  assert.equal(runner.calls.some((call) => call.args[0] === "automations" && call.args[1] === "get" && call.args[2] === task.externalJobId), true);
});

test("updates only allowed fields, disables by readback, and never enables a task", async () => {
  const runner = new FixtureCommandRunner();
  const adapter = createAdapter(runner);
  const taskId = String(agentTurnFixture.id);
  const updated = await adapter.updateTask(taskId, { name: "Renamed fixture market task", enabled: false });
  const editCall = runner.calls.find((call) => call.args[0] === "automations" && call.args[1] === "edit");

  assert.equal(updated.name, "Renamed fixture market task");
  assert.equal(updated.enabled, false);
  assert.ok(editCall);
  assert.equal(editCall.args.includes("--disabled"), true);
  assert.equal(editCall.args.includes("--enabled"), false);
  await assert.rejects(() => adapter.updateTask(taskId, { enabled: true } as never), /allowed OpenClaw contract/);
});

test("submits exactly once and maps accepted, successful, and failed run receipts", async () => {
  const runner = new FixtureCommandRunner();
  const adapter = createAdapter(runner);
  const accepted = await adapter.requestRun(String(agentTurnFixture.id));
  const run = await adapter.getRun(String(agentTurnFixture.id), "manual:fixture:success");
  const page = await adapter.listRuns(String(agentTurnFixture.id));
  const submitCalls = runner.calls.filter((call) => call.args[0] === "automations" && call.args[1] === "run");

  assert.equal(accepted.accepted, true);
  assert.equal(accepted.externalRunId, acceptanceFixture.runId);
  assert.equal(submitCalls.length, 1);
  assert.equal(run.executionStatus, "succeeded");
  assert.equal(run.rawStatus, "ok");
  assert.equal(run.rawCompletionStatus, "succeeded");
  assert.equal(page.items.length, 2);
  assert.deepEqual(page.items.map((item) => item.executionStatus), ["succeeded", "failed"]);
  assert.equal(page.items[1]?.rawStatus, "error");
  assert.equal(page.nextCursor, null);
});

test("does not mutate when the installed CLI version is outside the reviewed contract", async () => {
  const runner = new FixtureCommandRunner();
  runner.version = "OpenClaw 2026.9.7 (fixture)";
  const adapter = createAdapter(runner);
  const capabilities = await adapter.getCapabilities();

  assert.equal(capabilities.available, false);
  assert.equal(capabilities.errorCode, "runtime_version_mismatch");
  await assert.rejects(() => adapter.createTask({
    name: "Fixture task",
    agentId: "fixture-market",
    message: "Fixture only.",
    schedule: { kind: "cron", expression: "0 6 * * 2-6", timezone: "Asia/Jakarta" }
  }), /reviewed adapter contract/);
  assert.equal(runner.calls.some((call) => call.args[0] === "automations" && call.args[1] === "add"), false);
});

test("keeps task mutations and run history unavailable until owner mappings are verified", async () => {
  const runner = new FixtureCommandRunner();
  const adapter = new OpenClawCliRuntimeAdapter({
    executablePath: "/srv/openclaw/.local/bin/openclaw",
    connectionConfigPath: "/srv/investment-office/openclaw-connection.json",
    stateDirectory: "/srv/investment-office/openclaw-state",
    workingDirectory: "/srv/investment-office/openclaw-work",
    commandRunner: runner
  });
  const capabilities = await adapter.getCapabilities();

  assert.equal(capabilities.available, true);
  assert.equal(capabilities.features.taskCreate, false);
  assert.equal(capabilities.features.taskUpdate, false);
  assert.equal(capabilities.features.manualRun, false);
  assert.equal(capabilities.features.runHistory, false);
  await assert.rejects(() => adapter.createTask({
    name: "Fixture market task",
    agentId: "fixture-market",
    message: "Fixture only.",
    schedule: { kind: "cron", expression: "0 6 * * 2-6", timezone: "Asia/Jakarta" }
  }), /verified Investment Office mapping/);
  await assert.rejects(() => adapter.requestRun(String(agentTurnFixture.id)), /verified owner-scoped application mapping/);
  await assert.rejects(() => adapter.listRuns(String(agentTurnFixture.id)), /verified owner-scoped application mapping/);
  assert.equal(runner.calls.some((call) => call.args[0] === "automations" && ["add", "run", "runs"].includes(call.args[1]!)), false);
});

test("refuses to run a mapped job when its observed analyst ID conflicts with the saved mapping", async () => {
  const runner = new FixtureCommandRunner();
  const adapter = new OpenClawCliRuntimeAdapter({
    executablePath: "/srv/openclaw/.local/bin/openclaw",
    connectionConfigPath: "/srv/investment-office/openclaw-connection.json",
    stateDirectory: "/srv/investment-office/openclaw-state",
    workingDirectory: "/srv/investment-office/openclaw-work",
    verifiedExternalAgentIds: ["fixture-market", "fixture-research"],
    verifiedTaskMappings: [{ externalJobId: String(agentTurnFixture.id), externalAgentId: "fixture-research" }],
    commandRunner: runner
  });

  await assert.rejects(() => adapter.requestRun(String(agentTurnFixture.id)), /not mapped to a dedicated/);
  assert.equal(runner.calls.some((call) => call.args[0] === "automations" && call.args[1] === "run"), false);
});

test("rejects unsafe cursor and task inputs before invoking OpenClaw", async () => {
  const runner = new FixtureCommandRunner();
  const adapter = createAdapter(runner);

  await assert.rejects(() => adapter.listRuns(String(agentTurnFixture.id), "1 --all"), /cursor is invalid/);
  await assert.rejects(() => adapter.createTask({
    name: "Fixture task",
    agentId: "main",
    message: "Fixture only.",
    schedule: { kind: "cron", expression: "0 6 * * 2-6", timezone: "Asia/Jakarta" }
  }), /allowed OpenClaw contract/);
  assert.equal(runner.calls.length, 0);
});
