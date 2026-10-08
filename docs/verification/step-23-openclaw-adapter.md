# Step 23 OpenClaw adapter verification

Date: 8 October 2026
Pinned runtime contract: OpenClaw `2026.9.8`
Status: adapter and fixture acceptance implemented; live app integration pending.

## Implementation

`backend/src/integrations/openclaw/` now provides:

- `ResearchRuntimeAdapter`, with app-owned capability, health, agent, task, accepted-run, and run-history types.
- `OpenClawCliRuntimeAdapter`, pinned to `2026.9.8` for the CLI and Gateway. It implements capability checks, Gateway health, agent listing, task read/create/update, manual run acceptance, exact run lookup, and paged run history.
- `MockResearchRuntimeAdapter`, an in-memory adapter whose results are marked `mock` or `simulated`.
- Sanitized fixtures and tests for the observed CLI contract and the normalized pagination shape.

The CLI adapter uses the configured absolute executable via `execFile`, passes an argument array with `shell: false`, caps output at 512 KiB, and applies operation-specific timeouts. Child processes receive an allowlisted environment only. Connection paths use OpenClaw's supported `OPENCLAW_CONFIG_PATH` and `OPENCLAW_STATE_DIR`; Gateway URL/token/password values are forwarded only when explicitly supplied through server configuration and never appear in arguments. `OPENCLAW_CONFIG_READONLY=1` prevents CLI writes to the OpenClaw config file.

New automation jobs are isolated agent-turn tasks created disabled. Updates can change the allowed fields or disable a task, but cannot enable a schedule. Mutations are followed by exact readback. A timeout, invalid mutation response, or mismatched readback returns a reconciliation-required error. Run requests are submitted once; uncertain acceptance must be reconciled before any retry. The adapter refuses the installed bootstrap `main` agent and command jobs as analyst runs. Raw status, completion, and delivery strings are preserved without persisting webhook bodies or raw errors.

Mutation, run, and history operations also require explicit owner-scoped agent mappings and job-to-agent pairs supplied by the server. Those mappings are empty for the current installation, so the current capability readback leaves task creation/update, manual run, and run-history access unavailable until verified mappings are saved. The adapter compares each observed task's external agent ID with its saved pair. Listing the bootstrap agent does not create an app mapping.

Capabilities mark schedule activation, input-snapshot binding, cancellation, and event streaming unsupported. `--no-deliver` disables OpenClaw's fallback delivery only; the agent's message tools require the separate Step 25 tool-policy work. See the pinned [automation CLI reference](https://raw.githubusercontent.com/openclaw/openclaw/v2026.9.8/docs/cli/cron.md) and [environment reference](https://raw.githubusercontent.com/openclaw/openclaw/v2026.9.8/docs/help/environment.md).

## Verification performed

- `npm run typecheck --workspace @investment-office/backend` — passed.
- `npm run lint --workspace @investment-office/backend` — passed.
- `npm run test --workspace @investment-office/backend` — passed: 15 tests, including CLI fixture and mock-adapter coverage.

The fixture set is explicitly bounded: Step 22 agent/task records are redacted; the disabled agent-turn task and terminal run IDs are synthetic contract fixtures. No fixture represents a configured Investment Office analyst or real research activity.

## Live boundary and remaining work

No live adapter command was run. No external task was created, edited, enabled, or run. The existing Gateway inventory, disabled scheduler, and system-maintenance rows were not changed. The real instance still has only the `main` bootstrap agent and no Investment Office agent/job mapping.

The adapter is exported to backend code but not connected to the durable dispatch worker or a public API. Step 29 owns worker dispatch and observation; the run-specific input binding path is still pending. The authenticated completion receiver, independent callback authentication, report validation/persistence, and first live report also remain pending. The adapter's presence does not claim live connectivity or live report production.
