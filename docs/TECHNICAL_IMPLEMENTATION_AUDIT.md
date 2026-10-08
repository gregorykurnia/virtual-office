# Investment Office technical implementation audit

Audit date: 8 October 2026

**Verdict: the architecture and broad phases are appropriate, but the guide needs corrections before it is safe to follow as a sequential implementation checklist.** The project is progressing toward its first live application report. It has not yet reached dependable four-analyst operation. The largest gaps are integration prerequisites, executable dependency handling, research-data validation, and consistent acceptance records. Most steps should stay; several should move earlier or be split, and optional polish should not block deployment.

This audit reviews the [technical guide](../Investment%20Office%20Technical%20Implementation%20Guide.md), [product plan](../Investment%20Office%20Implementation%20Plan.md), authoritative [four-agent specification](FOUR_AGENT_WORKFLOW_SPEC.md), [progress](PROGRESS.md), decisions, integration/verification records, package scripts, shared schemas, server startup, dispatch worker, CLI adapter, and deployed Rex templates. Official version-pinned OpenClaw and Firebase documentation was also checked. Existing uncommitted changes were included as observed workspace state, not attributed to this audit.

This is a documentation and source audit. Historical acceptance evidence was read; the VM, Firebase project, browser UI, and test suites were not revalidated during this audit. “Implemented” below describes source/evidence availability, not production acceptance. No calendar delivery target is recorded, so schedule performance cannot be judged.

## What is already sound

- The frontend demonstration precedes paid/live integration, and demo data stays distinct from real records.
- React/Vite, Fastify, Zod, owner-scoped Firestore, one server, and an adapter are proportionate to a private application. A database or framework replacement is unnecessary.
- Execution, delivery, ingestion, observation freshness, and decorative activity are separated.
- Durable requests, transactional claims, ambiguous-dispatch handling, event replay, and reconciliation address real failure modes.
- Stable analyst IDs/artwork, dated holdings, approved targets, missing-input gates, source dates, and WIB schedules are appropriate requirements.
- Reports remain usable without motion, the Gateway, or external notifications.
- Private service boundaries, permission ceilings, restoration rehearsal, and laptop-off proof are necessary acceptance work.

## Current progress against the guide

| Work | Evidence-based assessment | Remaining gate |
| --- | --- | --- |
| Steps 1–13 | Demo milestone has recorded acceptance. | Preserve it while adding live features; rerun affected checks when changed. |
| Steps 14–19 | Backend, schemas, repositories, manual-request queue, and live HTTP frontend exist. | Real owner/Firebase configuration, deployed migration/Rules/indexes, emulator acceptance, authenticated dashboard inspection, and operational worker wiring. |
| Step 20 | Host preparation is recorded, with outstanding infrastructure/dependency checks. | Close host-specific items; move later application acceptance out of this step. |
| Steps 21–22 | Installed OpenClaw and bounded contract discovery have dated evidence. | Validate each remaining capability when its implementation needs it. |
| Step 23 | Pinned adapter and fixture checks exist. | Production connection identity, mappings, delivery configuration, input binding, worker composition, and live acceptance. |
| Step 24 | Rex exists and passed bounded read-only instruction/permission acceptance. | Real official-source research and application ingestion. Its limited acceptance report has no market facts/sources. |
| Steps 25–29 | First live report path remains unfinished. | Research tools → current report contract → authenticated ingestion → persisted report → manual/status/recovery proof. |
| Steps 30–41 | Revised requirements are documented; core workflow features remain pending. | Inputs, persistent findings, other roles, dependencies, schedule synchronization, commands, controls, and conversations. |
| Steps 42–47 | Static/ambient artwork foundations exist; full movement and operating acceptance remain pending. | Separate animation delivery from the minimum private operational release. |

Sources: [progress](PROGRESS.md), [integration contract](OPENCLAW_INTEGRATION.md), [adapter verification](verification/step-23-openclaw-adapter.md), and [Rex acceptance](verification/step-24-market-analyst.md).

## Findings and required corrections

Priority meanings: **P1** blocks a dependable live slice or scheduled workflow; **P2** should be resolved before the feature's acceptance; **P3** is documentation or scope cleanup. Items are ordered by implementation dependency rather than severity alone.

### A1 — Current status is inconsistent across documents (P2)

**Evidence:** the guide's Step 20 assessment still says no OpenClaw/Gateway/provider credential is installed, while Step 21 records completed installation and a controlled turn. Section 14 still says the deployed version and callback captures are unverified. Section 12 leaves durable manual requests and runtime discovery unchecked despite recorded implementation. PROGRESS's “Current limits” still says reports exist only as demo fixtures and the real adapter is pending. Integration/Step 23 records retain bootstrap-only statements before their later Rex update. Phase D's progress gate still describes four tasks rather than the expanded workflow manifest.

**Correction:** add a single current acceptance table with states such as planned, implemented, acceptance pending, and accepted, each linked to dated evidence. Label prior observations explicitly historical. Distinguish a verified runtime mapping in `openclaw/deployments/market.json` from a mapping installed in owner-scoped Firestore. Keep “no real app report” separate from “no real runtime turn.” Use the latest authoritative roster: Paz, Rex, Cody, Wolffe; the Maul material currently in the working tree is a conflicting historical/design record that needs clear labeling.

**Acceptance:** guide, PROGRESS, DECISIONS, and integration summaries agree on the same current state without requiring readers to reconcile contradictory paragraphs.

### A2 — Firebase acceptance needs an explicit prerequisite gate (P1)

**Evidence:** Steps 14–19 have implementation records but provider settings, server authorization, Rules/index deployment, migration execution, second-owner emulator acceptance, and authenticated live UI inspection remain pending. The guide lists these across several sections without a concrete environment-activation work package.

**Correction:** add a C1 acceptance task before Step 28: verify project/database and owner UID, Auth provider and private-origin configuration, choose the Oracle-host server credential mechanism and permissions, validate emulator invariants, deploy Rules/indexes, run the reviewed migration, and inspect the owner-authenticated empty app. Document credential renewal/recovery and migration readiness. ADC is a credential-discovery mechanism; it does not itself supply credentials on the Oracle VM.

**Acceptance:** the actual service account can perform permitted app operations, unrelated identities are rejected, and the selected environment starts without demo records.

### A3 — Run-input delivery is sequenced after a step that requires it (P1)

**Evidence:** Step 29 wires dispatch, but the Step 23 integration record says wiring waits for run-specific inputs. Input delivery appears in Step 30, after the Phase C exit gate. The runtime adapter only accepts an external job ID, whereas `RunDispatchAdapter.submit` expects a snapshot-bearing request.

**Correction:** split Step 30. Move minimal immutable input acquisition/export, per-run correlation, and dispatch composition into C2 before Steps 28–29. Rex can use approved owner context/watchlists with explicitly absent holdings. Keep the complete portfolio editor, targets, contributions, and theses in Phase D. Use the documented snapshot-file fallback initially if a custom tool would delay the first slice.

**Acceptance:** one run identifies the exact dated input artifact/hash, and editing inputs during execution cannot change what that run reads. Resolve scheduled/manual overlap and concurrent input acquisition explicitly; a shared mutable `current.json` is insufficient provenance by itself.

### A4 — The adapter must grow before the planned provisioning flow works (P1)

**Evidence:** `ResearchRuntimeAdapter` has no job inventory method, while Step 34 needs to reconcile all observed jobs. `AllowedTaskDefinition` supports cron only, while Step 28 describes a one-shot task. CLI creation sets `--no-deliver` and has no webhook field; enabling schedules is deliberately unsupported. `server.ts` does not inject a dispatch adapter. The guide's app/worker service separation also needs a production composition/entry point.

**Correction:** add explicit adapter extensions at their owning steps: bounded job inventory and scheduler status, controlled one-shot or disabled-cron smoke creation, server-owned completion destination/readback, schedule activation, snapshot-bound dispatch, mapping load/refresh, and worker startup/shutdown. Decide whether the worker runs in the API or separately and supervise it once. Provision the app account's supported Gateway connection before testing dispatch; it cannot rely on reading the isolated OpenClaw account's private state.

**Acceptance:** a task created through the reviewed boundary has verified ownership, inputs and completion delivery; synchronization can detect conflicting/unmapped jobs; capability flags enable only accepted operations. These are planned extensions, not defects in the intentionally limited Step 23 adapter.

### A5 — Callback authentication is unresolved, but a bridge is not yet proven necessary (P1)

**Evidence:** Step 22's probes had no auth header and the CLI has no outbound-auth flag. Step 27 proposes global `cron.webhookToken`. The pinned release documentation explicitly says that field sends a bearer header. A probe without a configured token does not establish that bearer authentication is unsupported.

**Correction:** verify the installed configuration schema and supported secret handling, then test the dedicated token with the private receiver and exact-host SSRF exception. Verify missing/wrong credentials are rejected before durable acknowledgment. Build a bridge only if the configured native mechanism fails or cannot meet the intended boundary. A bridge that merely adds a header to any loopback request would not independently establish the original sender's identity.

**Acceptance:** observed authenticated callback delivery, durable receipt, redacted logging, and unauthorized-request rejection. If native auth is unavailable, document the chosen private transport/authentication mechanism and its limits before enabling tasks. See [pinned OpenClaw configuration](https://raw.githubusercontent.com/openclaw/openclaw/v2026.9.8/docs/automation/cron-jobs/managing-jobs.md).

### A6 — The current report schema is only a market template, and app persistence still uses the older shape (P1)

**Evidence:** Step 26 shows v1 and asks for a new version, but Step 24 already deployed `report-contract.v2.schema.json`. That “common” schema fixes `agent_role` to `market` and limits task/report types to Rex. It forbids extra properties and has no snapshot-reference field. `shared/src/database.ts` stores the older report metadata and `bodyMarkdown`, without the v2 structured fields.

**Correction:** use the existing v2 work as the starting point. Define shared fields plus role-specific validation, trusted provenance attached by ingestion, source-key resolution, compatible storage/API readers, and deterministic Markdown presentation. Explicitly choose whether snapshot references come from verified runtime acquisition or analyst output checked against that acquisition. Add report/source/relationship migrations before live v2 ingestion; do not simply pass v2 through the older schema and lose metadata.

**Acceptance:** valid representative outputs from all four roles survive validation, persistence and API/UI round-trip with coverage, deltas, relations, sources and input provenance intact. Shape validation remains separate from factual verification.

### A7 — Dependency rules need an executable mechanism (P1 for Phase D)

**Evidence:** Steps 32–34 require successful matching prerequisite reports and cutoff handling, but they do not specify how a Paz execution acquires its eligible dependency set or how publication is frozen. Clock separation cannot enforce this. Concurrency is discussed only later in Step 35; a single execution slot may conflict with morning or Saturday deadlines.

**Correction:** define a durable workflow occurrence keyed by workflow/coverage/input version, with expected children, deadline, eligibility, assembly claim, publication state and late-update links. The scheduled Paz task must acquire an app-selected immutable dependency manifest. Choose supported OpenClaw dependency/trigger behavior if verified, or an app-owned dependency gate within OpenClaw-triggered workflows. Preserve one recurring scheduler. Define simultaneous monthly/weekly/AI work, runtime concurrency, queue priority and maximum durations before activation.

**Acceptance:** all-success, failed/missing/late child, cutoff, restart, duplicate assembly, and input-version mismatch produce one honest digest. Measure whether the chosen workload can finish before 06:40/07:00 and 09:00/10:00; adjust editable defaults when evidence requires it.

### A8 — Persistent analyst memory needs a structured write path (P1 for Phase D)

**Evidence:** the roles must persist theses, candidates, milestones and canonical findings through app storage. Step 25 denies broad writes, Step 30's input tool is read-only, and the report schema contains references rather than a defined set of proposed state changes.

**Correction:** define validated research-state proposals in output or a narrowly scoped write API. An app processor must owner-check references, preserve evidence/as-of dates, apply expected-version checks, append an audit/version record, and deduplicate canonical events. Distinguish research updates from owner-approved holdings, targets and contribution settings. Specify canonical-event creation/merge and contradiction handling so “one event once” is reproducible.

**Acceptance:** a later run reads persisted prior findings; replay cannot duplicate updates; conflicting edits do not overwrite silently; analysts cannot approve targets or turn watchlist candidates into holdings.

### A9 — Research access and research quality require more than one source-fetch smoke (P2)

**Evidence:** Step 25 checks official-source access and Step 26 mentions numerical validation, but no deliverable specifies market/FX/valuation/ETF look-through acquisition or calculation implementation. Missing-input gates are strong; sufficient-input correctness is less concrete.

**Correction:** define required data fields and sources per workflow, publication/retrieval/as-of dates, stale thresholds, units, currency and FX direction, adjusted-price/corporate-action handling where relevant, ETF look-through coverage, and unavailable-data behavior. Keep calculations in reviewed deterministic code using exact inputs; record assumptions and round only at defined presentation boundaries. Start with official releases and manual dated portfolio inputs. A paid market-data feed is optional until a required workflow cannot obtain adequate data otherwise.

**Acceptance:** representative correct calculations and source-supported claims, plus missing/stale/partial/contradictory evidence cases. Include known-input DCA, concentration, dividend and overlap examples when those features are implemented; permit honest limited output when data is unavailable. Avoid a large market-data warehouse.

### A10 — Material-event alerts lack a defined detection workflow (P2)

**Evidence:** roles promise exceptional evidence-triggered alerts, while Step 33's manifest contains routine schedules and no specified detector, incoming feed, or materiality policy.

**Correction:** define where events originate, which role owns them, screening cadence, materiality/importance rules, event keys, cooldowns, and report/delivery deduplication. Initially, material alerts can result from scheduled screening; state the resulting detection delay. Do not imply continuous monitoring when none is configured. Lightweight screening should condition expensive deep work.

**Acceptance:** a material event generates one correctly owned alert; unchanged evidence generates none; the same event in a digest does not become another external delivery without an explicit policy.

### A11 — Operational safeguards appear too late in the numbered sequence (P1 for recurring activation)

**Evidence:** spending controls are Step 36 after Step 34 enables jobs. Full deployment, observability, and backups are Steps 43–45 after advanced animation. The guide acknowledges early service supervision, but the concrete early deliverables are incomplete. Step 20 includes later provider and end-to-end checks, making its completion boundary unclear.

**Correction:** move baseline budget/concurrency limits before the first paid research run; move minimum private ingress, supervised API/worker/receiver, correlation logs, backup/recovery choice and release rollback before recurring activation. Split Step 20 into host readiness and later live-path verification. Keep expanded dashboards, restore rehearsal and final reboot acceptance in Phase F. Rollback must account for additive migrations and durable queues, not just switching an application directory.

**Acceptance:** first runs are bounded; the owner can inspect failed dispatch/ingestion; recurring activation has recoverable config/state and a supervised app. The final production gate still requires a demonstrated isolated restore. Firestore managed export/import requires billing/Blaze, so choose the backup mechanism deliberately. See [Firebase export/import requirements](https://firebase.google.com/docs/firestore/manage-data/export-import).

### A12 — Storage limits and retention need explicit implementation work (P2)

**Evidence:** the guide uses bounded strings/events but gives no aggregate byte/depth or transaction-size policy for report/source/input payloads. Some snapshot limits already exist in manual-run code; the same approach must cover completion ingestion. Event/log retention variables are proposed, without a specified cleanup worker or TTL implementation.

**Correction:** enforce aggregate encoded-size limits below Firestore limits, bounded source counts and nested structures, index exemptions for large payloads, and a recoverable rejection/quarantine path. Define raw-event versus normalized-report retention and protect referenced snapshots/history from inappropriate deletion. Use small records or restricted artifact storage only when payload measurements justify it.

**Acceptance:** maximum supported UTF-8 payloads persist atomically; oversized output fails visibly without losing the run; retention cleanup preserves report provenance. Firestore documents are limited to 1 MiB and nested maps/arrays to depth 20. See [Firestore quotas](https://firebase.google.com/docs/firestore/quotas).

### A13 — Remove obsolete implementation examples and make validation executable (P3/P2)

**Evidence:** Step 16 still contains a PostgreSQL RLS example within a Firestore ownership step. Step 28 creates enabled then immediately disables despite the installed `--disabled` capability. Step 2 lists `dev:live`, task synchronization and browser checks, while root scripts do not implement all of them; `test:e2e --workspaces --if-present` can succeed with no browser suite. No `.github` CI directory was present in the inspected tree.

**Correction:** remove active SQL instructions, create smoke jobs disabled atomically, update examples to the verified adapter path, and label scripts accurately as implemented or planned. Add a small automated typecheck/lint/test/build gate plus explicit browser/emulator acceptance commands as those suites exist. Do not describe an empty script pass as acceptance. Keep historical technology choices in a clearly marked archive.

**Acceptance:** an engineer can follow each active command on the selected stack, and a passing gate reports which meaningful checks actually ran.

## Steps to keep, move, split, or defer

| Guide steps | Recommendation |
| --- | --- |
| 1–5 | Keep as completed foundations. Reinspect affected areas; do not repeat Git initialization or rebuild assets unnecessarily. |
| 6–13 | Keep. Extend contracts and affected UI checks for revised requirements rather than redo the demo. |
| 14–19 | Keep; add a distinct environment/emulator/authenticated-UI acceptance gate. |
| 20–24 | Keep; clarify historical evidence and host/runtime/app acceptance boundaries. |
| 25–26 | Keep; finish research capabilities and integrate the existing v2 template into generalized app validation/storage. |
| 27–29 | Keep; resolve native webhook auth, adapter composition, mapping persistence and minimal input binding first. |
| 30 | Split: minimal acquisition/provenance before 28–29; full owner input/thesis/candidate/target features in Phase D. |
| 31–32 | Keep; deploy four policies and a defined persistent research-state path. |
| 33–35 | Keep; implement occurrence/dependency gates and adapter inventory/activation before schedule acceptance. Reuse C2 reconciliation. |
| 36 | Split: limits before first paid runs/activation; measured cost and four-role acceptance here. |
| 37 | Keep; contribution-date/dependency edits need one coordinated mutation with honest partial-application recovery. |
| 38 | Split command routing/coordination into its own work package. It is substantial workflow work, not a small report-chat extension. |
| 39 | Keep durable report follow-ups. Defer streaming until a nonstreaming turn path has correct identity, persistence and ambiguity handling. |
| 40 | Keep optional; in-app feed works first. Telegram is unnecessary for core acceptance. |
| 41 | Keep preferences and truthful measured usage; defer elaborate dashboards. |
| 42 | Keep requested animation scope as a separate milestone. Walking, seating and social clips should not block a private research release. |
| 43–45 | Split: minimum deployment/logging/recovery earlier; final hardening, restore proof and operational visibility here. |
| 46–47 | Keep final acceptance. Reuse earlier laptop-off/reboot evidence only where the deployed topology and versions still match. |

Unnecessary additions at this stage: a second app database, Redis, microservices, a second recurring scheduler, a fifth digest analyst, native agent messaging, realtime price streaming, a market-data warehouse, brokerage integration, a game engine, or a custom input tool when the reviewed file approach is adequate. The guide mostly already avoids these. Cancellation remains capability-gated; a webhook bridge, Gateway RPC client, full-text search provider and paid financial-data service require demonstrated need.

## Corrected next execution sequence

1. Reconcile the current acceptance/status records and explicitly list the outstanding C1 setup.
2. Complete Firebase owner/server authorization, emulator acceptance, reviewed migration/Rules/index deployment and private authenticated empty-app inspection.
3. Complete Step 25's server-resident research tools, source-fetch evidence, model policy and baseline limits.
4. Finish generalized report validation/storage and minimal immutable input acquisition/provenance; save verified app integration/agent mappings.
5. Verify native webhook bearer configuration; implement durable receiver/processing, the necessary adapter delivery features and the app-account Gateway connection.
6. Create one disabled smoke task through the reviewed boundary; obtain one source-backed Rex report, persist it, inspect it in the app, and prove replay/failure handling with fixtures.
7. Compose and supervise dispatch/observation workers; verify manual idempotency, ambiguous dispatch, recovery, and one bounded unattended scheduled path. This closes Phase C.
8. Build full owner inputs and persistent research state; deploy the other three roles and accept one representative report per role.
9. Implement workflow occurrences, dependencies, cutoffs, shared event ownership, drift/inventory reconciliation and budget-aware concurrency; activate reviewed WIB workflows incrementally.
10. Complete command coordination, schedule/input editing, filters/bookmarks and durable follow-ups. Add optional notification delivery and streaming when justified.
11. Complete private release hardening, restore/reboot/final accessibility acceptance. Deliver advanced animation independently against the accepted static interface.

**Decision:** continue the chosen architecture. Repair the roadmap's dependencies and acceptance records before expanding recurring workflows. Completion of Step 24 is credible within its bounded scope; treating it as a researched, persisted live market report would be premature.
