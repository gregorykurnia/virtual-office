# Step 21 — OpenClaw installation and supervision

Assessment date: 8 October 2026

Status: **Preparation recorded; the current stable release is provisionally pinned to `2026.9.8` and the recorded host runtime meets the documented version floor. Remote inventory is still pending because this workspace has no SSH target; backup/recovery, provider credentials, OpenClaw installation, and live acceptance remain pending.**

This record is a run plan, not evidence that OpenClaw is installed or connected. The configured Oracle private hostname does not resolve from this workstation; public-key SSH works and an SSH loopback tunnel was verified. The owner reports narrowing OCI TCP/22 ingress to the current administrative `/32`; a fresh connection succeeds from that address, but the saved console value is owner-reported. Direct root SSH is disabled; `ubuntu` login and sudo were reverified after the sshd reload. See [Step 20 host readiness](./step-20-host-readiness.md).

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
