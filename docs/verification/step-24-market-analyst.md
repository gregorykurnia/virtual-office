# Step 24 — First analyst and operating instructions

Date: 8 October 2026

Status: **In progress — versioned source templates are prepared; no live analyst is provisioned.**

## Scope and identity

The first analyst is Rex, the Global Markets Analyst. The application role remains `market`, with the existing `market-bot` / `market-terminal` artwork keys. The OpenClaw external ID is a separate value and must be captured from the installed CLI's create/readback; it has not been assigned or guessed.

The authoritative role and research requirements are in [`FOUR_AGENT_WORKFLOW_SPEC.md`](../FOUR_AGENT_WORKFLOW_SPEC.md). The installed runtime is recorded as OpenClaw `2026.9.8` in the [Step 22 integration contract](../OPENCLAW_INTEGRATION.md). That record shows the bootstrap `main` agent and no Investment Office identity/job mapping. Do not treat `main` as Rex or create another analyst identity to change a display name.

## Prepared source files

- [`openclaw/templates/common/AGENTS.md`](../../openclaw/templates/common/AGENTS.md): shared research, evidence, privacy, scope, and report policy.
- [`openclaw/templates/market/IDENTITY.md`](../../openclaw/templates/market/IDENTITY.md): Rex identity and stable role/artwork references.
- [`openclaw/templates/market/SOUL.md`](../../openclaw/templates/market/SOUL.md): concise communication guidance.
- [`openclaw/templates/market/research/market-brief.md`](../../openclaw/templates/market/research/market-brief.md): global-market research and report instructions.
- [`openclaw/templates/common/report-contract.md`](../../openclaw/templates/common/report-contract.md) and [`report-contract.v2.schema.json`](../../openclaw/templates/common/report-contract.v2.schema.json): the v2 analyst payload shape; trusted owner, app-agent, task, run, and ingestion metadata remain application-owned.
- [`openclaw/templates/README.md`](../../openclaw/templates/README.md): deployment boundary and expected workspace file names.

The report schema JSON parse check passed. An inline representative payload passed the installed Ajv 6 validator; it was synthetic shape-check data, not a report or market observation. The schema is an output contract only; it has not yet been integrated with the backend validator or persistence path from Step 26.

## Live acceptance still required

The Step 21 and Step 22 records verify the host, Gateway, pinned runtime, and observed integration contract. The current workstation has no SSH host alias, target, or task-specific secure connection profile, so no remote inventory or mutation was attempted in this pass. The current official CLI documentation is not a substitute for checking the installed CLI.

Before marking Step 24 complete:

1. Connect to the verified host and inspect `agents add --help`, the current roster, and the actual workspace path as the `openclaw` service account.
2. Confirm no existing market agent or conflicting identity exists. Create one isolated `market` workspace only if the read-only inventory confirms it is missing.
3. Deploy the reviewed files, read them back, and record the normalized external agent ID against application role `market` without exposing credentials.
4. Confirm effective agent tool restrictions and verify forbidden operations are unavailable. Step 25 owns configuring the real tool allow/deny policy; the prose in `AGENTS.md` is not enforcement.
5. Produce a bounded, source-backed report with the v2 shape and record the sanitized runtime receipt. Step 26 owns application validation and persistence; no first persisted report is claimed here.

No agent, task, schedule, Gateway setting, Firebase record, or research run was changed. The scheduler remains as recorded in Step 22; its existing disabled state was not rechecked in this pass. Step 24 remains in progress pending live identity/workspace acceptance and the effective permission boundary.
