# Step 24 — First analyst and operating instructions

Date: 8 October 2026

Status: **Complete for first-analyst provisioning and bounded instruction/permission acceptance. Research tools and application integration remain later steps.**

## Scope and identity

The first analyst is Rex, the Global Markets Analyst. The application role remains `market`, with the existing `market-bot` / `market-terminal` artwork keys. The installed CLI returned external ID `investment-market`; subsequent roster readback confirms identity name `Rex`, workspace `/var/lib/openclaw/.openclaw/workspace-market`, model `openai/gpt-6.1-sol`, no channel bindings, and nondefault status. The [deployment manifest](../../openclaw/deployments/market.json) records the verified mapping, versions, and deployed file hashes.

The authoritative role and research requirements are in [`FOUR_AGENT_WORKFLOW_SPEC.md`](../FOUR_AGENT_WORKFLOW_SPEC.md). Fresh SSH and CLI inventory confirmed OpenClaw `2026.9.8` and only bootstrap `main` before creation. The supported `agents add`, `set-identity`, `config patch`, and agent-turn interfaces were inspected on that installed release. `main` remains the bootstrap service identity; the application still has four stable analyst roles.

## Prepared source files

- [`openclaw/templates/common/AGENTS.md`](../../openclaw/templates/common/AGENTS.md): shared research, evidence, privacy, scope, and report policy.
- [`openclaw/templates/market/IDENTITY.md`](../../openclaw/templates/market/IDENTITY.md): Rex identity and stable role/artwork references.
- [`openclaw/templates/market/SOUL.md`](../../openclaw/templates/market/SOUL.md): concise communication guidance.
- [`openclaw/templates/market/USER.md`](../../openclaw/templates/market/USER.md): approved dated owner context with no inferred holdings or allocation inputs.
- [`openclaw/templates/market/research/market-brief.md`](../../openclaw/templates/market/research/market-brief.md): global-market research and report instructions.
- [`openclaw/templates/common/report-contract.md`](../../openclaw/templates/common/report-contract.md) and [`report-contract.v2.schema.json`](../../openclaw/templates/common/report-contract.v2.schema.json): the v2 analyst payload shape; trusted owner, app-agent, task, run, and ingestion metadata remain application-owned.
- [`openclaw/templates/README.md`](../../openclaw/templates/README.md): deployment boundary and expected workspace file names.

All seven deployed files matched the repository source SHA-256 hashes. The workspace directories are mode `0700`, and its instruction files are mode `0600`. The JSON schema and the actual acceptance report both passed Ajv 6 validation. The schema has not yet been integrated with the backend validation/persistence path from Step 26.

## Permission boundary and bounded report

The [applied per-agent policy](../../openclaw/config/market-step24-policy.json) permits only `read`, with `fs.workspaceOnly=true`. Shell, writes, administration, delegation, messaging, and browser tools are excluded. Native Code Mode, swarm, and elevated tools are disabled. The model is explicitly pinned to GPT-6.1 Sol low with no fallback. These are runtime controls; the workspace prose alone does not enforce permissions.

The installed Codex restriction documentation says a finite allowlist restricts the native tool surface and disables inherited/configured MCP servers. The inherited `minimal` profile alone does not activate that boundary. An initial `tools.exec.security=deny` setting prevented the Codex runtime itself from starting and terminated before a model turn. It was removed; shell remains denied by the finite tool policy. No host-wide execution approvals were changed. One corrected acceptance then completed.

Acceptance run `71beed02-9206-4046-bd14-96971411bc17` returned `ok` / `completed` on the native Codex harness, effective model `gpt-6.1-sol`, no reroute or fallback, and `codeModeEngaged=false`. Its tool catalogue contained only `read`. The receipt records four calls, three successful workspace reads and one failed read. The supported `sessions tail` trajectory confirms the fourth read failed and the session completed successfully. The operator supplied one harmless outside-workspace path, `/etc/hostname`, as the boundary probe; the report states that the runtime rejected it as escaping the workspace. No file contents were reproduced or bypass attempted.

The [acceptance report](step-24-market-analyst/acceptance-report.json) is explicitly `limited`, with unknown market dates, empty facts/sources, and visible missing inputs. No current market evidence was supplied. It proves instruction loading, output shape, missing-input handling, and the bounded runtime behavior. It is not a current market briefing or a persisted application report. The [sanitized receipt](step-24-market-analyst/acceptance-receipt.json) preserves the measured model/tool evidence without credentials.

Fresh-session Gateway health passed afterward. Scheduler status readback remains `enabled=false`, with no next wake. No analyst automation job, recurring schedule, callback receiver, or notification was created.

## SSH recovery and remaining boundaries

The earlier preparation pass incorrectly reported the target unavailable after missing the ignored local environment file and the earlier private helper. The existing key path was recovered from `.env.step20.local`, and the target from `/private/tmp/office-step20-ssh.py`. The target/account/alias are now also saved in the ignored environment file and in a private project SSH configuration. Both files have mode `0600`; neither is committed. See [private VM access](../SSH_ACCESS.md) for the stable connection command.

The manifest records the observed role-to-runtime mapping but does not enable the app adapter or create an owner-scoped Firestore mapping. No backend server environment or Firebase server authorization is configured in this workspace. Application mapping persistence, immutable run-input binding, completion authentication, report ingestion, and worker wiring remain later acceptance work. Step 25 must configure approved research/search tools and validate official-source access; this analyst currently reads only its supplied workspace files.
