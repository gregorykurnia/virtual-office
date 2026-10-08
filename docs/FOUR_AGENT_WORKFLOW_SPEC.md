# Four-agent research workflow specification

Approved requirements: 7 October 2026. Status: documented requirements; implementation and live acceptance pending. This specification supersedes conflicting historical role, schedule, input, and reporting defaults in the original plans. Historical verification records describe their original implementation only.

## Context and stable identities

The owner earns/spends IDR, invests in US-listed stocks and ETFs, seeks wealth accumulation over 10–20+ years, and also investigates emerging sectors and future compounders. AI research supports coding, agents, DEUS Human Capital Services, and solo software opportunities. Use Asia/Jakarta and display WIB.

| Stable ID | Display name | Primary role | Stable artwork |
| --- | --- | --- | --- |
| portfolio | Paz | Portfolio Analyst; combined digest assembler | portfolio-bot / portfolio-ledger |
| market | Rex | Global Markets Analyst | market-bot / market-terminal |
| research | Cody | Opportunity Scout | research-bot / research-library |
| risk | Wolffe | AI & Technology Analyst | risk-bot / risk-console |

Keep four agents only. Legacy IDs and avatar keys are identity references, not new role descriptions. Preserve external IDs where verified. Update instructions and display labels without recreating identities. Risk analysis remains a responsibility across the four roles.

Initial editable stock watchlist: MSFT, V, GOOG, AMZN, SPGI, META, NVDA, TSM, AVGO, ISRG, INTU, WM, NOW. Editable ETF watchlist: VOO, VXUS, AVUV, SGOV. A watchlist entry is not evidence of ownership. Read the latest dated portfolio records before every calculation. Never infer quantities, cost bases, balances, contribution amounts, or targets. Target allocation must be explicitly approved and versioned; do not automatically trade, rebalance, or change it.

## Agent instructions and outputs

### Paz: Portfolio Analyst

Monitor stock earnings, guidance, revenue growth, margins, free cash flow per share, dilution, capital allocation, competition, and material risks. Persist each stock thesis: owned/watchlisted reason, dated supporting evidence, milestones, weakening conditions, and invalidation criteria. Track all saved ETFs including AVUV: distributions, fees, methodology and material exposure changes. Concentration and stock/ETF overlap require adequate dated holdings and look-through data; state coverage gaps. Track declared dividends, ex-dates, issuer payment dates, estimated amounts, and separately confirmed brokerage receipts. Monthly allocation, DCA, and dividend-reinvestment proposals require current holdings, approved targets, contribution amount/date, available cash and relevant FX assumptions. Ask for specific missing fields and block unsupported calculations. Explain price changes as business change, valuation change, or uncertain cause with evidence.

Outputs: weekly portfolio health; material earnings/thesis-change reports; monthly allocation/DCA/dividend review; combined digest assembled from completed specialist reports.

### Rex: Global Markets Analyst

Monitor US inflation, employment, growth, Federal Reserve decisions/liquidity; nominal/real Treasury yields, curve and credit spreads; US/developed/emerging equities; oil, natural gas, gold, copper and relevant commodities; USD/IDR and Bank Indonesia; material geopolitics, regulation and trade. Relate developments to saved US stocks, VXUS, SGOV and the IDR cost of future contributions. Separate confirmed data, expectations and interpretation. Provide alternative scenarios and uncertainty, avoiding confident market timing.

Outputs: short weekday briefing; weekly macro outlook with upcoming events/scenarios; exceptional material-event alerts.

### Cody: Opportunity Scout

Research independently of existing holdings. Investigate sectors, subsectors, bottlenecks and companies with 3–12 month catalysts and 3–10 year potential. Evaluate adoption, orders, backlog, capacity, utilization, pricing, margins, cash generation, moats, financial resilience, dilution and valuation. Distinguish an attractive industry from an attractive investment at today's price. Persist candidates, milestones, catalysts, risks, evidence changes and removal criteria; include ETF alternatives. Low nominal price or a large decline does not establish cheapness.

Every serious candidate answers: why this business/sector; why now; supporting evidence; what the market may underestimate; growth already priced into valuation; realistic bull/base/bear scenarios; thesis invalidation; next monitoring steps.

Outputs: weekly radar with at most three meaningful developments; one weekly deep investigation when justified; evidence-triggered watchlist updates. “No compelling new opportunity” is valid. Do not force recommendations or promise multibagger returns.

### Wolffe: AI & Technology Analyst

Track meaningful models, capabilities, pricing, APIs, limits and availability; coding agents, automation, OpenClaw and infrastructure; official documentation, credible independent evaluations and practical evidence. Explain benchmark limitations. Track infrastructure spending, inference costs, adoption and monetization. Identify concrete applications for DEUS, development and solo software businesses. Distinguish announcement from general availability. Share investment implications with Paz/Cody through the app data layer.

Classify findings as Use now, Watch, or Investment implication. Outputs: concise digest up to three times weekly; weekly worth-testing recommendation with use case, expected benefit, cost and limitations; exceptional alerts for substantial practical changes.

## Report and coordination contract

Every report includes title, agent, type, generation time, coverage period, data freshness, changes since previous report, personal relevance, linked sources with publication dates, facts distinct from interpretation, risks/uncertainty/contradictions, follow-up questions, related holdings/ETFs/sectors/topics and proposed next step (including no action needed). Unknown publication dates must remain unknown. Prefer filings, IR, ETF issuers, central banks, official statistics and product docs; supplement with credible reporting. Never fabricate research, citations or activity. Label demo, stale, unavailable and missing data distinctly.

Primary ownership: portfolio/ETFs → Paz; macro/rates/FX/commodities → Rex; new investment opportunities → Cody; AI tools/models/industry → Wolffe. Share persistent findings with event keys, primary owner and linked specialist reports through owner-scoped storage; native agent messaging is unverified. One event appears once in the 400–700 word combined digest with links to specialist analysis. Paz assembles it from completed reports; no fifth agent. Store previous findings and research deltas. Lightweight screening precedes deeper work; scan frequency, report length, research budgets and model selection are editable.

## Editable schedules and dependency handling

All cron expressions below are desired application defaults in Asia/Jakarta, not verified OpenClaw syntax or installed jobs.

| Workflow | Owner | Default local time | Desired cron |
| --- | --- | --- | --- |
| Morning collection/specialist screening | Relevant owners | Tue–Sat 06:00 WIB | 0 6 * * 2-6 |
| Morning prerequisite report completion | Relevant owners | Tue–Sat 06:40 WIB | 40 6 * * 2-6 |
| Combined preceding-US-session digest | Paz | Tue–Sat 07:00 WIB | 0 7 * * 2-6 |
| Weekly specialist reviews | All four | Sat 09:00 WIB | 0 9 * * 6 |
| Combined weekly review | Paz | Sat 10:00 WIB | 0 10 * * 6 |
| Monthly portfolio inputs/review generation | Paz | Day 1, 09:00 WIB | 0 9 1 * * |
| Monthly portfolio/DCA review | Paz | Day 1, 10:00 WIB | 0 10 1 * * |
| AI digest | Wolffe | Mon/Wed/Fri 09:00 WIB | 0 9 * * 1,3,5 |
| Opportunity deep dive, when justified | Cody | Fri 17:00 WIB | 0 17 * * 5 |

Prerequisite times are editable engineering defaults. Contribution-date edits must move dependent monthly generation with the review. Capture coverage windows explicitly; Tuesday covers the preceding Monday US session. Weekly radar and worth-testing recommendation feed the Saturday review. Material alerts are event-triggered, not routine notifications or promised real-time coverage.

Use dependencies and bounded completion deadlines, not timing alone. At assembly cutoff, include only successful reports matching the coverage window/input versions; list failed, missing or late sections. Older context must carry its original dates and stale label. Late reports link as updates, never silently rewrite the published digest as fresh.

Verify installed OpenClaw version, auth, run/history/completion interfaces and scheduling/readback before configuring. Reconcile by integration ID plus stable task definition key and external job ID; repeat configuration updates the existing job. Detect conflicting jobs and ambiguous outcomes before retry. OpenClaw is the intended sole research scheduler; the app dispatch worker is not a second recurring scheduler. Do not create jobs while unavailable. Show saved desired versus verified applied schedules, observed next runs, observation time and recent failures. Telegram remains disabled until an existing configured destination is verified; app feed works independently. Deduplicate event/report deliveries across OpenClaw announcements and app outbox.

## Office, feed and command requirements

Preserve the existing React/TypeScript/Vite, Fastify, Zod and owner-scoped Firestore architecture and visual system. Profiles show name/avatar/role/responsibilities/watchlist, current/last completed task, last success/next verified run, execution status, recent reports/history and report/question/watchlist/schedule controls. Idle, scheduled, researching, writing, completed and failed derive from execution evidence; unavailable telemetry remains unknown. Demo activity is explicitly simulated.

Feed: agent/type/topic or ticker/importance/date filters, search, source-rich details, related reports, bookmarks/read state and distinct digest/deep-dive/alert/portfolio-review types. Keep current bounded search limitations explicit until expanded.

Commands accept explicit agent selection or automatic routing. Persist owner, routing explanation, coordinated child tasks, progress and resulting report. Cross-role requests create one parent and consolidated answer, with failed/missing children visible. Route weekly 13-stock review and ETF changes to Paz; Treasury yields to Rex; emerging themes to Cody; AI worth-testing requests to Wolffe; DCA to Paz with missing-input gates; combined briefing to coordinated specialist tasks and Paz assembly. An explicit selection remains visible; requests beyond that role require transparent coordination. Never interpret a research command as trade authorization.

## Technical delivery sequence and acceptance checklist

All items below are pending unless separately recorded with implementation evidence in PROGRESS.md.

- [ ] Inspect current UI/source/tokens/assets, configs/storage and scheduling; retain identities and unrelated work.
- [ ] Version shared schemas and migrations for role descriptions, editable context/watchlists, approved allocation, stock theses, opportunities, evidence/event records, report metadata/relations/bookmarks, command parents/children, dependency schedules and budgets.
- [ ] Keep legacy role keys compatible; owner-check every reference; immutable run input snapshots include current portfolio, targets and previous findings with dates/hashes.
- [ ] Add four versioned instruction/config templates; save verified external mappings without secrets or invented IDs.
- [ ] Capture exact OpenClaw version and redacted interface examples; implement dispatch/completion/reconciliation and record actual research-access capabilities.
- [ ] Persist reports/sources/tasks/runs atomically and idempotently; make source links safe/accessibly rendered; reject invented freshness and unsupported DCA.
- [ ] Implement owner-authenticated editable input/thesis/watchlist/target APIs, command routing/coordinated completion, digest assembly, report filters/bookmarks and scheduler desired/applied/readback APIs.
- [ ] Configure dependencies/deadlines and duplicate-job reconciliation only against a verified live scheduler; display unknown/stale/failure status honestly when disconnected.
- [ ] Integrate existing office/profile/feed/command UI with keyboard, mobile, loading/empty/error/focus states; inspect 360/390/768/1440 px.
- [ ] Add optional disabled-by-default Telegram configuration reusing a verified existing destination; deduplicate material alerts and routine delivery.
- [ ] Verify each example command, explicit routing, coordinated consolidated result, persistence/detail/read/bookmark/filter behavior and accessible sources.
- [ ] Verify WIB/US-session coverage, contribution-date changes, prerequisite failure/staleness notices, repeated schedule configuration without duplicate jobs, restart/ambiguous-dispatch reconciliation and notification deduplication.
- [ ] Verify missing holdings/targets/contribution inputs prevent fabricated DCA/concentration/dividend estimates; watchlist entries never create holdings.
- [ ] Run applicable typecheck/lint/test/build checks, fix introduced issues, record evidence and live/demo boundaries; commit task files and push upstream.

## Current connection and remaining setup

Repository inspection on 7 October 2026 found stable IDs in shared/src/agent.ts, four demo identities, a live HTTP adapter, owner-scoped Firestore repositories/manual runs and an injected dispatch worker boundary. No real OpenClaw adapter is implemented; `command -v openclaw` found no executable on this shell's PATH. This does not prove no remote installation exists. No installed version, authenticated schedule interface, market feed, real portfolio, Telegram destination or live agent execution was verified in this documentation update.

Remaining setup: configure Firebase owner/ADC and complete emulator acceptance; provide the reachable OpenClaw host/connection and exact version; verify supported capabilities with redacted receipts; configure four existing external identities and research access; provide dated holdings, approved targets and contribution inputs; apply reviewed migrations and reconcile schedules; optionally verify an existing Telegram destination. Keep secrets in server-owned ignored configuration. Documentation is not evidence these steps have run.
