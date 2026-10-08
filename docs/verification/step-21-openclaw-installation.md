# Step 21 — OpenClaw installation and supervision

Assessment date: 8 October 2026

Status: **Complete — OpenClaw `2026.9.8` is installed and supervised, server-owned ChatGPT subscription authentication is configured, GPT-6.1 Sol low completed a bounded turn, and Gateway health passed from a fresh SSH session. Logout and reboot persistence were verified.**

The preparation and initial preflight sections below are historical. The installation/service evidence at the end supersedes their uninstalled state. The owner supplied the public SSH target privately and reports updating OCI TCP/22 ingress to the current administrative `/32`; a fresh connection succeeds, but the saved console value is owner-reported. Direct root SSH remains disabled. See [Step 20 host readiness](./step-20-host-readiness.md).

SSH follow-up: fresh authentication succeeds as `ubuntu`, passwordless sudo works, and effective `PermitRootLogin` is `no`; Ubuntu 24.04.5 LTS/ARM64, 2 CPUs, 11 GiB RAM, 45.6 GB root filesystem, synchronized UTC, systemd lingering, separate service accounts, persistent paths, and Node `v26.10.0`/SQLite `3.53.4` were verified. No boot-volume backup has been created or restored. No OpenClaw package, onboarding, provider credential, service, or agent turn has been run.

## Known prerequisites

- The owner reports an Oracle Cloud VM in Batam (`ap-batam-1`) using `Canonical-Ubuntu-24.04-Minimal-aarch64-2026.09.18-0`; direct host inspection confirms Ubuntu 24.04.5 LTS/ARM64 and SSH as `ubuntu`. See [Step 20 host readiness](./step-20-host-readiness.md).
- The host may already contain an OpenClaw installation or service. Inspect it before installing, updating, onboarding, or repairing anything.
- The repository pins Node `26.10.0`. Confirm that version and its linked SQLite are supported on the verified host. Record any OpenClaw-managed private runtime separately from the app runtime.
- No provider credential or renewal method has been verified on the server. Do not copy laptop credentials or place secrets in the repository, shell history, process arguments, or browser build.
- Onboarding verifies the selected provider with a real model completion. Treat that as a live provider call and record its outcome without recording its credential.

## Execution sequence after host verification

1. **Read-only inventory.** Connect through the verified SSH target as an authorized administrator. Record OS/release, architecture, CPU and memory, active users, Node/npm paths and versions, OpenClaw executable/version/state directory, existing Gateway processes and service definitions, and available persistent storage. Inspect service status and ownership before considering any changes. Do not print or copy secrets. If an existing state or service is present, stop and document its owner, backup/recovery path, and migration plan before changing it.
2. **Pin the runtime and release.** The verified host is ARM64 with Node `26.10.0` and SQLite `3.53.4`. Recheck current compatibility when installation begins, then select an exact stable OpenClaw package release from the official release source, verify its published artifact/package identity, and record the version. Do not use a moving `latest` tag for the installed version. The OpenClaw release pin remains deferred until Step 21 begins so the installed version is current at execution time.
3. **Install only if the inventory shows no conflicting installation.** Use the official installer as the dedicated nonroot `openclaw` service account, with the verified exact version, and skip onboarding in this pass. The installer supports a pinned npm release and a verification flag:

   ```bash
   export OPENCLAW_VERSION='EXACT_VERIFIED_RELEASE'
   curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh \
     | bash -s -- --install-method npm --version "$OPENCLAW_VERSION" --no-onboard --verify
   ```

   If OpenClaw is already installed, do not run this install command as an implicit upgrade. Review the existing state and use the supported migration/update procedure only after its backup and recovery plan are clear.
4. **Onboard with server-owned credentials.** Run `openclaw onboard` as the service account after selecting the provider/authentication method and confirming credentials can be renewed without the owner's laptop. Record provider/model identifiers and renewal instructions, never credential values. Expect onboarding to make a real verification completion.
5. **Install and inspect supervision.** Run `openclaw gateway install` as the service account. On this single-user host, the supported default is a systemd user unit; confirm its generated command, account, state/config paths, environment, restart policy, and loopback binding. Verify lingering is enabled for that account so the user service remains alive after logout. Do not create a competing system unit or hand-written supervisor for the same Gateway.
6. **Verify privately.** Confirm `gateway.bind` remains loopback and Gateway authentication is enabled. Use the verified SSH tunnel/private admin path for Control UI access. Check service and Gateway health, run `openclaw doctor --lint` and `openclaw security audit`, and inspect relevant service logs without exposing secrets. Verify Node/OpenClaw executable paths and versions as seen by both the shell and the service.
7. **Prove unattended operation.** Confirm health from a second SSH session after logging out of the install session. Verify user-unit lingering and startup configuration; test reboot persistence only after recording the VM recovery/access path and confirming reboot is acceptable for the host. Run one controlled agent turn and capture its sanitized success/failure and model identity. No recurring automation or app job is configured in Step 21.

Useful checks, after the account and service exist:

```bash
openclaw --version
node --version
openclaw gateway status --deep
openclaw health
openclaw doctor --lint
openclaw security audit
systemctl --user cat openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
loginctl show-user "$USER" -p Linger
```

Use the service's actual unit name if a named profile is deliberately selected. Do not run `openclaw doctor --fix` as a diagnostic; review any proposed repair before applying it.

## Acceptance evidence to save

Record the VM identifier/region, OS and architecture, verification date, authorized connection method (redacted), Node/npm/OpenClaw versions, exact binary/runtime/service paths, state/workspace paths, installation method, relevant service definition and status, loopback/auth posture, lingering state, health/audit outcomes, controlled-turn result, and the provider credential renewal procedure. Redact IPs or identifiers that should not be committed, all secret material, auth profile contents, and raw environment values. Capture enough sanitized evidence to reproduce the setup without publishing credentials.

Step 21 is complete only after a controlled agent turn succeeds with server-owned credentials and the Gateway remains healthy after logout, with reboot persistence verified for the selected service setup. Until then, do not configure schedules or claim live research.

## Official references checked

- [OpenClaw Node.js requirements](https://docs.openclaw.ai/install/node) — supported Node lines and SQLite constraints.
- [OpenClaw installer internals](https://docs.openclaw.ai/install/installer) — supported installation methods, version pinning, and `--no-onboard`/`--verify` flags.
- [OpenClaw onboarding](https://docs.openclaw.ai/start/wizard) — onboarding verifies the selected provider connection with a real completion.
- [OpenClaw Linux server guide](https://docs.openclaw.ai/vps) and [Gateway service runbook](https://docs.openclaw.ai/gateway) — loopback access, systemd user service, lingering, and service inspection.
- [OpenClaw security guidance](https://docs.openclaw.ai/gateway/security) — secure defaults and audit command.

## Execution preflight — 8 October 2026

Checked the official release list and current installation/runtime documentation before resuming Step 21. `2026.9.8` is the latest stable release shown; `2026.10.1-beta.1` is marked prerelease, so the stable release is the provisional pin. Recheck the stable release immediately before installation. The current Node policy is `>=24.16.0 <25` or `>=26.1.0`, with a WAL-safe linked SQLite library. Step 20 records Node `26.10.0` and SQLite `3.53.4` on the host, which meet those published floors; no OpenClaw binary has been installed or exercised against them yet.

Connection discovery in this workspace found `ssh` but no `oci` or `openclaw` executable, no SSH host entry in the local SSH config, and no VM address in the local Step 20 environment file (it only defines SSH key paths). The private VM hostname is already documented as unresolvable from this workstation. No SSH connection or remote inventory command ran in this pass, and no host state changed. The VM address remains intentionally absent from committed files.

To resume the required read-only inventory, supply the VM's current public IP/FQDN or a usable SSH host alias and confirm the authorized account/key path. Before onboarding, provide or install the selected model provider's server-owned credential through a supported secure flow and its renewal procedure. Complete the documented boot-volume recovery/access preparation before reboot acceptance. Do not copy laptop credentials or record any secret in this repository. Firebase server authorization remains a later app integration prerequisite; it is not required for the OpenClaw installation inventory or an isolated first model turn.

## Installation and service evidence — 8 October 2026

The owner supplied the VM's public SSH target, selected ChatGPT subscription authentication, reported an **Available** boot-volume backup, and updated the SSH source rule. Backup availability is owner-reported; its identifier, home-region/free-tier eligibility and a volume restore were not independently verified. SSH authenticated as `ubuntu` after the rule update. Inventory confirmed no existing OpenClaw executable, config file, Gateway unit or listener, so this was a fresh installation rather than an upgrade. The initial service-account inventory emitted a harmless working-directory warning for `/home/ubuntu`; subsequent commands explicitly used `/var/lib/openclaw`.

| Area | Verified result |
| --- | --- |
| Runtime | ARM64; Node `v26.10.0`, npm `11.19.1`, loaded SQLite `3.53.4`; service uses `/opt/node-v26.10.0-linux-arm64/bin/node`. |
| Release identity | Stable `2026.9.8`, commit `fc23bc864e4553c2d215e479eeec47b67a0bf943`. npm registry version, engine range, tarball URL and SHA-512 integrity matched the [official release record](https://github.com/openclaw/openclaw/releases/tag/v2026.9.8). |
| Installation | Official `install.sh`, npm method, exact `--version 2026.9.8`, `--no-onboard --verify --no-prompt`, nonroot `openclaw` account. Installer verification succeeded. |
| Executable/package | `/var/lib/openclaw/.local/bin/openclaw` resolves to `/var/lib/openclaw/.local/lib/node_modules/openclaw/openclaw.mjs`; CLI reports `OpenClaw 2026.9.8 (fc23bc8)`. |
| Config/state/workspace | `/var/lib/openclaw/.openclaw/openclaw.json`, state below `/var/lib/openclaw/.openclaw`, workspace `/var/lib/openclaw/.openclaw/workspace`. Config is owned by `openclaw`, mode `0600`. |
| Supervision | Supported `openclaw gateway install` generated `/var/lib/openclaw/.config/systemd/user/openclaw-gateway.service`; enabled, active/running, `Restart=always`, account lingering `yes`, working directory `/var/lib/openclaw`. |
| Service command | Pinned Node executable with `--max-old-space-size=5963`, package `dist/index.js gateway --port 18789`. CLI and service use the same config/state and version. |
| Private access/auth | `gateway.bind=loopback`, token auth enabled; listeners only on `127.0.0.1:18789` and `[::1]:18789`. A temporary SSH tunnel returned HTTP `200` for the Control UI; the tunnel was closed afterward. This proves page access, not owner/operator pairing or authenticated research. |
| Gateway token | Generated only on the VM, moved through stdin into the native secret store; config uses `{ source: "store", provider: "default", id: "OPENCLAW_GATEWAY_TOKEN" }`. Matching config backups were sanitized. No token value was printed or copied to the repository/laptop. |
| Diagnostics | Config validation passed. Secrets audit: clean, `plaintext=0`, `unresolved=0`, `shadowed=0`, `storeResidue=0`, `legacy=0`. Security audit: `0 critical`, one trusted-proxy warning; no reverse proxy is configured. Doctor lint's only remaining finding is the intentional loopback-only node-onboarding warning. No diagnostic repair was applied. |
| Acceptance-test controls | Heartbeat `0m`, `cron.enabled=false`, autonomous Workshop mode `off`, tool profile `minimal`, elevated tools and browser control disabled; hooks/channels/search setup skipped. |
| Maintenance-job reconciliation | Fresh startup declared memory-dreaming and skill-review maintenance jobs. Memory was disabled through the observed scheduler interface but its plugin later restored its declaration; skill-review rejected direct edits as system-owned. Its documented owner setting was set to `off`, and the scheduler is globally disabled. A memory declaration remains visible in job inventory, but no recurring execution is enabled globally. No Investment Office research jobs exist. |
| Logout/reboot | Gateway health succeeded from fresh SSH sessions after install-session logout. One approved reboot completed; boot identity changed and boot time became `2026-10-08 04:25:52 UTC` (`11:25:52 WIB`). The enabled user service started automatically. Initial probe observed startup warm-up; a settled follow-up reported CLI/Gateway `2026.9.8`, connectivity `ok`, healthy event loop and clean secret resolution. |
| Model/auth | Owner completed `openclaw models auth login --provider openai --device-code --set-default` on the VM. The native Codex plugin uses the server-resident OpenAI OAuth profile. Bounded no-tools turns completed on GPT-6 Astra low and GPT-6 Sol low, with terminal success receipts and no fallback. No credential contents or device code are retained in this document. |

The runtime's bootstrap `main` agent is used only for isolated service acceptance; it is not a fifth analyst or an app identity mapping. Paz/`portfolio`, Rex/`market`, Maul/`research` and Theo/`risk` in the application remain unchanged. Provisioning and verified external mappings belong to the later identity/integration steps.

## Model selection and compatibility follow-up — 8 October 2026

The successful GPT-6 Sol low turn returned `STEP21_SOL_OK`, run `0cfd982a-665f-404d-8ac6-c1e195863e21`, status `ok`/`completed`, effective model `gpt-6-sol`, native `codex` harness, OAuth auth-profile source, no tools, and no fallback. The last verified configured default is `openai/gpt-6-sol` with `agents.defaults.thinkingDefault=low`.

The owner requested GPT-6.1 Sol low, then proposed GPT-5.6 Luna max. The initial GPT-6.1 request was rejected as unsupported through the installed ChatGPT-account runtime. Two bounded Luna max requests, the second using a fresh session in response to explicit recovery guidance, returned the same 403 model-owner verification error without a completion. Neither failure establishes general model unavailability or lack of account entitlement. The CLI model list alone can include native cached/bundled or offline hints and does not establish authenticated access.

Further inspection identified official `@openclaw/codex@2026.9.8` with managed `@openai/codex@0.158.0`. GPT-6.1 Sol was added in Codex `0.159.1`, after this managed client. [Official OpenAI model documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol) confirms `low` is supported; the [Codex changelog](https://learn.chatgpt.com/docs/changelog) records GPT-6.1 availability and client releases. This version gap is a compatibility hypothesis to verify, not proof that upgrading grants the selected account access. OpenClaw remains on the registry's exact latest stable `2026.9.8`; no beta update or runtime override has been applied. The [supported app-server executable override](https://docs.openclaw.ai/plugins/codex-harness-reference/app-server-transport) provides a possible isolated newer-client path; inspect the installed schema and verify compatibility before applying it.

OpenClaw documents automatic Codex OAuth profile refresh. If refresh fails or the grant is revoked, reauthorize under the dedicated server account using the installed `openclaw models auth login --provider openai --device-code` flow, preserving the explicit model selection. Use `models status` to inspect health/expiry without publishing profile contents. [Authentication and refresh](https://docs.openclaw.ai/providers/openai/authentication)

SSH later timed out after the workstation's public source address changed. The owner was asked to update the existing TCP/22 source CIDR to the current administrative `/32`; public addresses remain absent from this committed record. A read-only check before the timeout confirmed the interrupted recovery command had restored GPT-6 Sol low.

Remaining Step 21 acceptance: restore authorized SSH reachability, inspect and apply a supported newer Codex runtime for the requested GPT-6.1 Sol low model, verify a bounded turn with its effective model/effort, and recheck Gateway health after authentication/configuration work. Research access, four-role provisioning, app integration, and approved recurring workflows are later milestones.

## Final Step 21 acceptance — 8 October 2026

SSH access recovered after the owner confirmed both administrative source `/32` rules. The installed plugin documentation explicitly supports `plugins.entries.codex.config.appServer.command`. Installed official `@openai/codex@0.161.0` into the isolated service-owned `/var/lib/openclaw/runtimes/codex-0.161.0` prefix; registry version/integrity were recorded and the executable reported `codex-cli 0.161.0`. Configured the supported command override to `/var/lib/openclaw/runtimes/codex-0.161.0/node_modules/.bin/codex`, validated configuration, and restarted the supported Gateway user service. OpenClaw and its plugin remain pinned to stable `2026.9.8`. Process inspection confirmed the active app-server uses the isolated Codex `0.161.0` native executable.

The new bounded turn returned `STEP21_SOL61_OK`, run `efdf4a37-4ba9-4266-b974-7c3f6b41bcc4`, status `ok`/`completed`. The terminal receipt reports requested/effective/response model `gpt-6.1-sol`, native `codex` harness, OAuth profile authentication, `thinking=low`, no successful tools, no reroute, and no fallback. Usage was 7,474 input and 9 output tokens. The configured default is now `openai/gpt-6.1-sol` with `agents.defaults.thinkingDefault=low`. This successful turn supersedes the earlier compatibility hypothesis and demonstrates access for the selected account on the updated runtime. The finite refreshed picker still omitted GPT-6.1; the explicit selection and completion receipt provide the tested evidence.

A fresh SSH session after the model turn reported Gateway Health `OK`, the intended model/effort, and `cron.enabled=false`. The final secrets audit reports zero plaintext, unresolved, shadowed or store-residue findings; one legacy-residue finding identifies the intended server-owned OAuth profile, explicitly outside static SecretRef migration scope. Its identifier and credential contents are omitted here. Earlier zero-legacy audit evidence predates OAuth onboarding.

Step 21 acceptance is complete. Existing logout/reboot evidence remains valid for the same enabled Gateway service; the final restart and fresh-session health check verify the updated runtime path. To undo the client override, unset `plugins.entries.codex.config.appServer.command`, select the previously verified GPT-6 Sol low default, and restart the Gateway; the original managed client remains installed. No research report, four-role provisioning, application integration or recurring research workflow is claimed. Step 22 integration-contract discovery is the next milestone.
