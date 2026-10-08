# OpenClaw integration contract

Assessment date: 8 October 2026

Status: **Step 22 contract discovery and Step 23 adapter implementation complete for OpenClaw `2026.9.8`.** The installed release, agent roster, automation inventory, command surface, manual enqueue receipt, active-state observation, successful/failed terminal receipts, and sanitized success/failure webhook envelopes were captured on 8 October 2026. The backend now has a version-pinned CLI adapter and mock implementation with sanitized fixture tests. Both webhook requests had no authentication headers, and the CLI exposes no outbound webhook-auth option. The app receiver, production callback authentication, run-input binding, worker wiring, and persisted report path remain unimplemented, so end-to-end app integration is not tested.

## Evidence boundary

Use the installed OpenClaw `2026.9.8` instance as the contract authority. The official online CLI and Gateway references are useful discovery aids, but can change independently of the installed release and do not substitute for its command output or runtime envelopes. The server's sanitized installation and controlled-turn record is [Step 21 acceptance evidence](./verification/step-21-openclaw-installation.md).

The OpenClaw service is an isolated bootstrap installation. Its `main` agent is not one of the four Investment Office analysts. Preserve the app identities `portfolio` (Paz), `market` (Rex), `research` (Cody), and `risk` (Wolffe); no external identity mapping is currently verified. No Investment Office research automation is configured. Recurring automation remains disabled.

## Verified installation facts

| Item | Verified value | Evidence |
| --- | --- | --- |
| OpenClaw | `2026.9.8`, commit `fc23bc864e4553c2d215e479eeec47b67a0bf943` | Step 21 host/package verification |
| Node / npm / SQLite | Node `v26.10.0`; npm `11.19.1`; SQLite `3.53.4` | Step 21 runtime verification |
| Installation | Official installer, npm method, exact version pin, nonroot `openclaw` account | Step 21 installation record |
| CLI executable | `/var/lib/openclaw/.local/bin/openclaw` | Step 21 executable verification |
| Config and state | `/var/lib/openclaw/.openclaw/openclaw.json`; state under `/var/lib/openclaw/.openclaw` | Step 21 service/config verification |
| Workspace | `/var/lib/openclaw/.openclaw/workspace` | Step 21 workspace verification |
| Gateway | Supported systemd user service; loopback listener; token authentication | Step 21 service verification |
| Gateway credential | VM-native secret store; value is intentionally not recorded here | Step 21 auth verification |
| Existing app agent IDs | None | No app-to-OpenClaw mapping has been provisioned |
| Existing research jobs | None | Server inventory contains only OpenClaw maintenance rows; no Investment Office jobs |

## Pinned-instance contract observations

Capture command output and receipts with secrets, provider-auth details, private host addresses, user content, and unrelated maintenance payloads redacted. Preserve stable external agent/job/run IDs only when observed and needed for app mapping. During initial read-only discovery, do not edit config or change scheduler enablement. Once interfaces and existing jobs are verified, use only explicitly bounded probes with a disabled future schedule, no delivery, exact readback, and cleanup.

| Contract item | Current evidence | Required pinned-instance observation |
| --- | --- | --- |
| Agent management | **Captured** | The only configured ID is `main`; normalized roster and paths below. CLI exposes `add`, `bind`, `bindings`, `delete`, `list`, `set-identity`, `team`, and `unbind`. No Investment Office mapping exists. |
| Task management | **Captured** | CLI command surface and flags below. `automations` and `cron` are aliases. The pinned local operator connection successfully added, read, ran, and removed five disabled one-shot probes: three no-delivery lifecycle probes and two webhook-delivery probes. |
| Manual acceptance | **Captured** | `run --json` returned `{ok:true,enqueued:true,runId,processInstanceId}` before the command payload started. Exact receipts below. |
| Start and terminal observation | **Partially captured** | Immediate `get` exposed `state.runningAtMs`; `runs --run-id` returned terminal `action`, `status`, `completionStatus`, `runAtMs`, `ts`, `durationMs`, and delivery fields. No separate event stream or durable start event was tested. |
| Completion delivery | **Captured** | Success and failure webhook envelopes were posted to a temporary loopback receiver; both returned HTTP 204 and recorded `deliveryStatus: "delivered"`. Sanitized bodies and terminal records are below. |
| Authentication | **Captured gap** | The service-account CLI connected to its local token-authenticated Gateway using server-held configuration; the token was not read or recorded. Help exposes `--token`, `--password`, `--url`, and `--port`. Neither callback had an auth-related header, and add/edit help exposes no outbound webhook-auth option. |
| Sessions | **Partially captured** | Agent CLI accepts `--agent`, `--session-id`, and `--session-key`; automation add accepts `--session` (`main`, `isolated`, `current`, or `session:<id>`) and `--session-key`. Only isolated command-job probes were run; analyst session persistence/expiry is unknown. |
| Reliability | **Partially captured; docs cover more** | A `runId` can be read back in run history; successful and failed command receipts were observed. Version-pinned docs specify no automatic retries for manual runs, ambiguous webhook sends, or partial/ambiguous channel sends. Disconnect recovery was not tested. Documented history/session retention is below. |
| Cancellation | **Not exposed by discovered CLI** | The pinned automation command list and `sessions --help` show no run-cancel command. A separate Gateway RPC cancellation interface was not tested. |

## Captured server state and CLI surface

The pinned binary reported `OpenClaw 2026.9.8 (fc23bc8)` and Node `v26.10.0`, matching Step 21. `agents list --json` returned one configured agent:

| External ID | Name | Workspace | Agent directory | Default |
| --- | --- | --- | --- | --- |
| `main` | `main` | `/var/lib/openclaw/.openclaw/workspace` | `/var/lib/openclaw/.openclaw/agents/main/agent` | Yes |

This bootstrap agent is not an Investment Office analyst. Do not map it to Paz, Rex, Cody, or Wolffe.

The automation CLI reports `Usage: openclaw cron|automations`. Its commands are `add`, `disable`, `edit`, `enable`, `get`, `list`, `rm`, `run`, `runs`, `scratch`, `show`, and `status`. Relevant observed options include:

- Add/edit: `--at`, `--every`, `--cron`, `--tz`, `--agent`, `--session`, `--session-key`, `--message`, `--command-argv`, `--disabled`, `--no-deliver`, `--webhook`, and `--timeout-seconds`.
- Run: `--due`, `--wait`, `--wait-timeout`, `--poll-interval`, and `--json`.
- Run history: exact `--run-id`, status/delivery filters, sort, offset, limit, and JSON output.
- Local/remote Gateway options: `--port`, `--url`, `--token`, `--password`, and `--timeout`.

The version-pinned CLI reference says automation mutations (`add/create`, `edit`, `remove`, and `run`) require the `operator.admin` scope. The local service-account CLI successfully performed the bounded probe mutations under the existing token configuration. No token or auth profile was read. The server config and job definitions were not changed outside the temporary probes.

`automations status --json` returned `enabled: false`, `triggersEnabled: true`, `jobs: 3`, and `nextWakeAtMs: null`. This status was not changed. The three inventory rows were:

| Existing job ID | Name | Row enabled | Payload | Session target |
| --- | --- | --- | --- | --- |
| `0a4c5b07-1035-431f-a0c1-906dec49711b` | Memory Dreaming Promotion | Yes | `agentTurn` | `isolated` |
| `ddd3de4c-6bb2-4aa4-a978-c131feadfd5a` | `skill-collection-review-main` | No | `agentTurn` | `isolated` |
| `f53007d5-9f50-4681-be69-6821a59e239f` | `heartbeat-main` | No | `heartbeat` | `main` |

No Investment Office task or job was present. The Memory Dreaming row is a pre-existing system-maintenance declaration with its row enabled while the global scheduler is disabled. It was not edited, run, or removed. The two disabled rows were also left unchanged. Do not infer that `triggersEnabled: true` means recurring schedule execution is enabled; the explicit scheduler status was `enabled: false`.

The versioned v2026.9.8 guide documents isolated session retention of 24 hours by default, terminal run history retention of 7 days, `lost` row retention of 24 hours, and a 2,000-row ceiling per job and history class. These are documented defaults; this pass did not inspect effective retention configuration or wait for expiry.

## Manual acceptance and lifecycle receipts

After verifying the installed CLI and inventory, three temporary disabled one-shot command jobs were used to check the pinned run contract. Each had a far-future `at` schedule, `enabled: false`, `delivery.mode: "none"`, and a deterministic local command (`/bin/true`, `/bin/false`, or `/bin/sleep 5`). The global scheduler stayed disabled. No model turn, external delivery, or recurring schedule ran. Every probe was removed, and `get <job-id>` returned not found afterward.

The `/bin/true` and `/bin/sleep 5` probes each returned the exact same acceptance shape; IDs are retained here as verification evidence:

```json
{
  "ok": true,
  "enqueued": true,
  "runId": "manual:7025fc73-51d9-41d4-a533-eb2b94950b65:1791440410759:3",
  "processInstanceId": "243072a2-b55e-4907-ad9d-d434006062db"
}
```

The `runId` is the per-run lookup key. `processInstanceId` was returned with the receipt, but this probe did not establish its lifecycle semantics. The response means the Gateway accepted/enqueued the manual run; it did not mean the command had started or completed.

For the `/bin/sleep 5` job, an immediate `get` readback returned `state.runningAtMs: 1791440410777` while `lastRunStatus` and `lastRunAtMs` were still null. Exact-run history then returned `action: "finished"`, `status: "ok"`, `completionStatus: "succeeded"`, `runAtMs: 1791440410777`, `durationMs: 5019`, and `deliveryStatus: "not-requested"`. This is the observed start/terminal pattern for a command payload only.

The `/bin/false` job returned this terminal history record (the payload was a deterministic command failure and delivery was disabled):

```json
{
  "action": "finished",
  "status": "error",
  "completionStatus": "failed",
  "error": "command exited with code 1",
  "runId": "manual:9f2f92fd-4764-4195-b4bb-3405d9dcb570:1791440363525:2",
  "runAtMs": 1791440363546,
  "durationMs": 24,
  "deliveryStatus": "not-requested",
  "tsIso": "2026-10-08T06:19:23.570+00:00",
  "runAtIso": "2026-10-08T06:19:23.546+00:00"
}
```

The exact run was read by `automations runs <job-id> --run-id <runId> --json`; no retry was issued. These three command probes confirm success/error terminal fields and ID-based history lookup. They do not establish provider/model failures or disconnect reconciliation. Retry and retention behavior below comes from release documentation, not observed execution.

### Observed completion webhook captures

Two additional disabled, far-future, delete-after-run command jobs exercised the pinned webhook transport against a temporary HTTP receiver bound only to loopback. The successful `/bin/echo STEP22_WEBHOOK_SUCCESS` run and failed `/bin/false` run each produced one callback. The receiver returned HTTP 204 to both POSTs, and exact run-history lookups reported `deliveryStatus: "delivered"`. Both disposable jobs were removed and verified absent. The global scheduler remained disabled; existing maintenance rows were not changed.

Captured callback request headers were `accept`, `accept-encoding`, `accept-language`, `connection`, `content-length`, `content-type`, `host`, `sec-fetch-mode`, and `user-agent`. There was no `Authorization`, `X-OpenClaw-*`, token, or other authentication header. The pinned CLI exposes no outbound webhook-auth option. The callback therefore carries no verified sender authentication. Do not trust a webhook based only on its JSON body or job ID; design a separately authenticated private receiver/bridge before accepting production callbacks.

The following sanitized fields are from the received JSON bodies. The temporary loopback URL and ephemeral receipt ID are redacted; command output and other payload content are retained only where useful to explain the event.

Successful callback: job `19be6bdd-5572-469b-a8db-462b4167ba1d`, run `manual:19be6bdd-5572-469b-a8db-462b4167ba1d:1791441620193:6`, HTTP 204:

```json
{
  "jobId": "19be6bdd-5572-469b-a8db-462b4167ba1d",
  "action": "finished",
  "job": {
    "id": "19be6bdd-5572-469b-a8db-462b4167ba1d",
    "name": "investment-office-step22-webhook-success-capture-20261008b",
    "enabled": false,
    "deleteAfterRun": true,
    "schedule": { "kind": "at", "at": "2036-01-01T00:00:00.000Z" },
    "sessionTarget": "isolated",
    "payload": {
      "kind": "command",
      "argv": ["/bin/echo", "STEP22_WEBHOOK_SUCCESS"],
      "timeoutSeconds": 10,
      "outputMaxBytes": 2048
    },
    "delivery": { "mode": "webhook", "to": "<redacted-loopback-webhook-url>" },
    "state": {
      "runningAtMs": 1791441620211,
      "runningReceiptId": "<redacted-ephemeral-receipt>",
      "nextRunAtMs": 1791441620193
    }
  },
  "runAtMs": 1791441620211,
  "durationMs": 20,
  "status": "ok",
  "summary": "STEP22_WEBHOOK_SUCCESS",
  "diagnostics": {
    "summary": "STEP22_WEBHOOK_SUCCESS",
    "entries": [{
      "source": "exec",
      "severity": "info",
      "message": "command ok: \"/bin/echo\" \"STEP22_WEBHOOK_SUCCESS\"",
      "exitCode": 0,
      "truncated": false
    }]
  },
  "delivered": true,
  "deliveryStatus": "delivered",
  "delivery": {
    "intended": { "to": "<redacted-loopback-webhook-url>", "source": "explicit" },
    "delivered": true,
    "resolved": {
      "to": "<redacted-loopback-webhook-url>",
      "source": "explicit",
      "ok": true
    }
  }
}
```

Failed callback: job `1bd4bc19-de2b-4832-9929-70e189320db9`, run `manual:1bd4bc19-de2b-4832-9929-70e189320db9:1791441628436:7`, HTTP 204:

```json
{
  "jobId": "1bd4bc19-de2b-4832-9929-70e189320db9",
  "action": "finished",
  "job": {
    "id": "1bd4bc19-de2b-4832-9929-70e189320db9",
    "name": "investment-office-step22-webhook-failure-capture-20261008b",
    "enabled": false,
    "deleteAfterRun": true,
    "schedule": { "kind": "at", "at": "2036-01-01T00:00:00.000Z" },
    "sessionTarget": "isolated",
    "payload": {
      "kind": "command",
      "argv": ["/bin/false"],
      "timeoutSeconds": 10,
      "outputMaxBytes": 2048
    },
    "delivery": { "mode": "webhook", "to": "<redacted-loopback-webhook-url>" },
    "state": {
      "runningAtMs": 1791441628456,
      "runningReceiptId": "<redacted-ephemeral-receipt>",
      "nextRunAtMs": 1791441628436
    }
  },
  "runAtMs": 1791441628456,
  "durationMs": 15,
  "status": "error",
  "error": "command exited with code 1",
  "delivered": true,
  "deliveryStatus": "delivered",
  "delivery": {
    "intended": { "to": "<redacted-loopback-webhook-url>", "source": "explicit" },
    "delivered": true,
    "resolved": {
      "to": "<redacted-loopback-webhook-url>",
      "source": "explicit",
      "ok": true
    }
  }
}
```

The corresponding terminal records were `status: "ok"`, `completionStatus: "succeeded"`, `durationMs: 26`, and `deliveryStatus: "delivered"` for success; and `status: "error"`, `completionStatus: "failed"`, `error: "command exited with code 1"`, `durationMs: 18`, and `deliveryStatus: "delivered"` for failure. Thus execution failure and webhook delivery success are independent outcomes. The body embeds the full job definition and webhook destination, so sanitize and validate it before logging or persisting.

### Version-pinned documented delivery and retry behavior

The official [v2026.9.8 automation CLI reference](https://raw.githubusercontent.com/openclaw/openclaw/v2026.9.8/docs/cli/cron.md) says a manual `run` force-runs by default, returns after durable reservation/enqueue, and does not enable a disabled job or create automatic retries. With `--wait`, the CLI polls the durable `cron.runs` row for that exact `runId`; payload execution `status` and whole-run `completionStatus` are separate. The CLI run history is the readback path after a timeout or disconnect; never retry an ambiguous request until the original `runId`/job state has been reconciled.

The official [v2026.9.8 delivery reference](https://raw.githubusercontent.com/openclaw/openclaw/v2026.9.8/docs/automation/cron-jobs/delivery.md) documents:

- A webhook POST is considered delivered after an HTTP 2xx. HTTP rejection is not delivered. If the request may have arrived but its response is lost or times out, delivery is `unknown` and the webhook transport does not retry that ambiguous send.
- A successful webhook run with no nonblank summary suppresses the POST as `empty`; execution errors still send an error event without a summary. Failure webhook records retain structured raw errors, so treat them as untrusted diagnostic data and redact before persistence/display.
- Execution and delivery can diverge: a run may have `status: "ok"` and `completionStatus: "failed"` when required completion delivery fails.
- Every outbound automation webhook has a strict SSRF guard. Loopback, private/internal, link-local, and other special-use destinations are refused by default. An exact `allowedHostnames` exception is available; globally enabling private-network access is explicitly dangerous.
- Transient channel announcements retry only when no payload may have reached the recipient; partial or ambiguous sends are not replayed. Recurring jobs use documented exponential execution-error backoff of 30 seconds, 1 minute, 5 minutes, 15 minutes, then 60 minutes.

The webhook outcomes above are observed against a temporary loopback receiver, not the app's future report route. To permit this bounded probe, the Gateway temporarily allowed only `127.0.0.1` under its exact-host SSRF exception; that exception was removed afterward and the original unset policy was restored. General private-network access was not enabled. The app receiver has not been implemented or deployed, and outbound authentication remains unresolved.

The same pinned docs define automation session targets `main`, `isolated`, `current`, and `session:<id>`. `isolated` creates a fresh transcript/session per run. The probe's `sessionTarget: "isolated"` was observed, but analyst session persistence and cleanup were not runtime-tested. The CLI's `sessions --help` has no cancel command; agent-run abort/RPC behavior remains unknown.

### Safe discovery sequence

The Step 22 help commands, roster, status, and inventory have been captured as the `openclaw` service account against the installed executable. Any future scheduler mutation must reconcile stable job IDs and read back the resulting definition. The system-owned maintenance rows are not Investment Office tasks.

The five lifecycle and webhook probes above were deleted after exact history was read back; all five job IDs returned not found afterward. The temporary exact-host SSRF exception was unset, scheduler status returned to `enabled: false`, and the original three system rows remained. `docs/API.md` describes a future private `POST /integrations/openclaw/report` receiver, but no implementation or deployed endpoint exists. The webhook envelope and delivery fields are now pinned for this installed release; the app-side receiver, sender authentication/bridge, and persisted report path remain future work. Never accept the unauthenticated webhook on a public route.

## Step 23 backend adapter — 8 October 2026

Implemented the app-owned `ResearchRuntimeAdapter` contract in `backend/src/integrations/openclaw/`. `OpenClawCliRuntimeAdapter` is pinned to `2026.9.8` and covers capability/version checks, Gateway health, agent listing, task read/create/update, one-shot run acceptance, exact run lookup, and paged history. It uses an absolute executable and `execFile` argument arrays with `shell: false`, bounded output, operation-specific timeouts, and an allowlisted child environment. Credentials are never placed in arguments. The CLI's supported `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_URL`, `OPENCLAW_GATEWAY_TOKEN`, and `OPENCLAW_GATEWAY_PASSWORD` settings are forwarded only when explicitly supplied; `OPENCLAW_CONFIG_READONLY=1` protects the configuration file from CLI writes. See the pinned [environment reference](https://raw.githubusercontent.com/openclaw/openclaw/v2026.9.8/docs/help/environment.md).

Task creation always uses an isolated agent-turn job with scheduling disabled. Updates may disable tasks, but cannot enable a recurring schedule. Mutations and run/history operations require explicit owner-scoped agent mappings and verified job-to-agent pairs; these mappings are currently empty. The adapter checks a task's observed external agent ID against its saved pair, so a mapped job cannot silently run under a different analyst. Create/update results are read back and compared; any uncertain mutation or run acceptance is returned as a reconciliation-required error, never retried by the adapter. `main` and command-payload jobs are not accepted as analyst runs. Capabilities report schedule activation, run-input binding, cancellation, and event streaming as unsupported. `--no-deliver` disables the runner's fallback delivery only; it does not replace Step 25's agent tool restrictions, as described in the pinned [automation CLI reference](https://raw.githubusercontent.com/openclaw/openclaw/v2026.9.8/docs/cli/cron.md).

Added `MockResearchRuntimeAdapter` plus sanitized fixtures and tests. The agent/task fixtures are redacted from Step 22 observations; the isolated agent-turn task and terminal run IDs are explicitly synthetic contract examples. No live adapter command was run, no task or schedule was created, and no external run was submitted. The adapter is exported for backend use but is not yet connected to the durable dispatch worker; that wiring belongs to Step 29, after run-specific input binding is available. Acceptance evidence and limits are recorded in [Step 23 verification](./verification/step-23-openclaw-adapter.md).

## Existing controlled-turn receipt

Step 21 records a bounded, no-tools `openclaw agent` acceptance on `main`: run ID `0cfd982a-665f-404d-8ac6-c1e195863e21`, terminal `ok` / `completed`, effective model `gpt-6-sol`, native `codex` harness, OAuth auth-profile source, and no fallback. This verifies that the installed Gateway can complete a controlled agent turn. It is not an automation enqueue receipt, not a specialist identity mapping, and not evidence of a persisted Investment Office research report.

## Official discovery references

These references are for navigation only; observations above must be pinned to `2026.9.8` command output:

- [Agents CLI](https://docs.openclaw.ai/cli/agents)
- [Agent CLI](https://docs.openclaw.ai/cli/agent)
- [Automations CLI](https://docs.openclaw.ai/cli/cron)
- [Automations CLI, pinned `v2026.9.8`](https://raw.githubusercontent.com/openclaw/openclaw/v2026.9.8/docs/cli/cron.md)
- [Automation delivery, pinned `v2026.9.8`](https://raw.githubusercontent.com/openclaw/openclaw/v2026.9.8/docs/automation/cron-jobs/delivery.md)
- [Agents CLI, pinned `v2026.9.8`](https://raw.githubusercontent.com/openclaw/openclaw/v2026.9.8/docs/cli/agents.md)
- [Gateway protocol](https://docs.openclaw.ai/gateway/protocol)
- [Gateway session control](https://docs.openclaw.ai/gateway/protocol/rpc-session-control)
- [Gateway agent and workspace methods](https://docs.openclaw.ai/gateway/protocol/rpc-talk-config-and-agents)
