# OpenClaw instruction templates

These files are reviewed source for deliberately deployed OpenClaw workspaces. They do not change a running agent when edited. Keep active workspaces and runtime state on the server, separate from this application repository.

The first analyst template is Rex (`market`), the Global Markets Analyst. The app ID and artwork keys are stable; the OpenClaw external ID must come from the installed CLI's successful create/readback and must be saved in the owner-scoped app configuration. Never guess or reuse the bootstrap `main` ID.

## Market workspace contents

Copy the following files into the workspace selected for the existing OpenClaw installation, preserving these destination names:

```text
AGENTS.md                         <- common/AGENTS.md
IDENTITY.md                       <- market/IDENTITY.md
SOUL.md                           <- market/SOUL.md
USER.md                           <- market/USER.md
research/market-brief.md          <- market/research/market-brief.md
research/report-contract.md       <- common/report-contract.md
research/report-contract.v2.schema.json <- common/report-contract.v2.schema.json
```

The absolute workspace path and file-loading behavior must be confirmed against the installed OpenClaw `2026.9.8` interface before deployment. A workspace directory and these instructions do not create a filesystem sandbox or enforce tool restrictions. Step 25 owns the actual per-agent tool policy and search-provider check; Step 26 owns application-side report validation and persistence.

Shared instruction version: `investment-office-market-instructions@1.0.0`

Market brief version: `investment-office-market-brief@1.1.0`

Report contract: `investment-office-report@2.0.0`

The current Rex policy is recorded in [`../config/market-step25-policy.json`](../config/market-step25-policy.json), with the accepted live configuration and source-fetch evidence in [`../../docs/verification/step-25-market-research-access.md`](../../docs/verification/step-25-market-research-access.md). Its finite allowlist exposes only `read`, `web_search`, and `web_fetch`, with `fs.workspaceOnly=true`; explicit denials remove shell, writes, administration, delegation, messaging, browser automation, and Codex session controls. The search provider is explicitly Codex Hosted Search through the server-owned auth profile. The installed Codex harness treats a finite allowlist as a restriction on its native tool surface. Keep Code Mode, swarm, and elevated execution disabled. Do not set the runtime execution-host policy to `deny`: that also prevents the Codex app-server from starting.
