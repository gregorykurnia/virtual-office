# Step 25 — Market research access and permission ceiling

Date: 8 October 2026

Status: **Complete for Rex’s research-tool access, policy, data-quality rules, and isolated scheduled-runner acceptance.** This is not a market briefing or an application-persisted report. The first source-backed market run remains gated until a monthly research budget is approved and recorded.

## Applied server configuration

The live Gateway is OpenClaw `2026.9.8` (`fc23bc8`). The active policy source is [`openclaw/config/market-step25-policy.json`](../../openclaw/config/market-step25-policy.json), SHA-256 `6b931ebbe89fe9f46ad04304dc2b02940d79f301e4470976cb7571547cc1042a`. OpenClaw's own config validator passed after application, and a fresh Gateway health check reported a healthy event loop.

The search route is explicitly `codex` (Codex Hosted Search), enabled in live mode, capped at three results with a 30-second search timeout. `web_fetch` is enabled. This uses the existing server-owned OpenAI auth profile; no search key or credential value is stored in the repository or analyst workspace. The official [OpenClaw web research documentation](https://docs.openclaw.ai/tools/web) describes this provider route and its authentication requirements.

The verified model route is `openai/gpt-6.1-sol`, thinking level `low`, with an empty fallback list. Baseline run controls now set one concurrent Gateway agent run and a 600-second default turn deadline. These ceilings are Gateway-wide, not per analyst. The search provider has no configured monthly USD cap in OpenClaw, and no owner-approved amount was available in the run inputs; the policy therefore instructs Rex to return a limited report and not search market data until a budget policy is recorded. No market research was started.

## Tool boundary and inputs

Fresh interactive and scheduled-runner contexts each compiled exactly these three tools: `read`, `web_search`, and `web_fetch`. `fs.workspaceOnly=true` restricts reads to Rex's selected workspace. Shell/process execution, file writes/edits, browser automation, Gateway/configuration and automation controls, messaging, cross-session tools, and Codex session tools are explicitly denied. Code Mode, swarm, and elevated execution are disabled. The installed [OpenClaw permission guide](https://docs.openclaw.ai/gateway/security/tool-permissions) documents the policy layers used for this restriction.

The workspace contains reviewed instructions only; no dated holdings or market-input snapshot and no database credentials were supplied. Step 25's restricted `read` capability is the only input tool available, but immutable per-run artifact delivery and binding remain part of the C2/Step 30 work. Watchlists remain context, never evidence of ownership. Step 24's [limited report acceptance](./step-24-market-analyst.md) remains the evidence that missing market inputs produce an honest limited report.

## Acceptance evidence

### Interactive source access

- Run `bcb517f5-fe04-41ed-9c0c-a36c16b297fb`, session `5fbe23f4-3ff9-4e41-8c25-97292c88d2c1`.
- The compiled tool context contained three tools. The trajectory recorded `web_search ok`, then `web_fetch ok` for the official OpenClaw tool-permissions page; the fetch returned HTTP 200 and page title “Tool and agent permissions.”
- The terminal receipt recorded `gpt-6.1-sol`, `codeModeEngaged=false`, `rerouted=false`, `fallbackUsed=false`, and only `web_search`/`web_fetch` in the successful tool summary. The technical response was not persisted as an application report.

### Scheduled execution environment

- Created one temporary, disabled, isolated, no-delivery `agentTurn` job with `read`, `web_search`, and `web_fetch`, pinned to GPT-6.1 Sol low. The job was invoked once through the installed scheduler's manual `cron run` interface; it was not enabled for clock-triggered execution.
- Run `manual:01a33f46-c963-4846-b601-ac5650d71a5b:1791459631854:8` completed successfully. Its session trajectory independently recorded a three-tool context, successful `web_search` and `web_fetch`, and model completion. Fetching the official OpenClaw web-research page returned HTTP 200. Delivery was `not-requested`; the run used no fallback.
- Removed temporary job `01a33f46-c963-4846-b601-ac5650d71a5b`. The Gateway scheduler remained disabled before, during, and after the check. The five pre-existing automation records and IDs were unchanged; no recurring Investment Office job was created. Automatic clock-trigger behavior remains unverified by design.

## Data-quality and calculation contract

Updated [`market-brief.md`](../../openclaw/templates/market/research/market-brief.md) to version `investment-office-market-brief@1.1.0` and deployed it to Rex's existing workspace. The server copy has mode `0600` and matches SHA-256 `0a1b4742de5cd49d87fcdbffc3d1675836f49c9189b9e38f5fcaa3524baec91c`.

The brief now names official source publishers, requires publisher/URL/observation-period/publication/retrieval metadata, preserves unknown dates, distinguishes preliminary/revised/forecast data, and forbids using search snippets as verified evidence. Its starting stale rules are: daily observations more than one expected session behind; BI JISDOR more than two Jakarta business days old; scheduled macro releases more than one business day overdue; quarterly issuer data older than 120 days; and ETF holdings older than 45 days. It requires explicit units and currency, labels USD/IDR as IDR per USD, distinguishes price return from total return and adjusted-price corporate actions, records ETF look-through coverage only from issuer holdings, and reserves derived calculations for reviewed deterministic code with dated inputs/formulas. Missing inputs block ownership, allocation, DCA, dividend, and overlap calculations.

## Limits and remaining gates

- No provider-side monthly spend limit or alert was configured or verified for the existing auth profile. A monthly USD amount is not recorded. The agent brief prevents market searches until an approved budget policy is present; the source-access checks above were limited to official OpenClaw documentation.
- The Gateway-wide one-run/600-second limits apply immediately. The automatic scheduler is disabled, and the application OpenClaw dispatch adapter/owner mapping is not configured, so the application cannot dispatch market runs. Application queue admission and immutable input-snapshot delivery remain later integration work.
- The forced scheduler-runner check proves the isolated job execution path and tool policy, not automatic timer firing. No live market feed, financial dataset, holdings, or app receiver was tested.
