# Investment Office — Product Brief and Implementation Plan

> Requirements update — 7 October 2026: [Four-agent workflow specification](./docs/FOUR_AGENT_WORKFLOW_SPEC.md) is authoritative for the revised roles, investor context, watchlists, reporting, coordination, editable WIB schedules, UI controls, and acceptance checks. Conflicting historical defaults below are superseded. Preserve Rex (`market`), Paz (`portfolio`), Clara (`research`), and Theo (`risk`) and their stable artwork keys. Paz is the approved cosmetic replacement for the portfolio display identity; linked responsibilities and records remain unchanged. This update records requirements; it does not claim implementation or live connectivity.

Version: 1.0 · Prepared: 2 October 2026

## 1. Read this first, Codex

Build a private, responsive web application that feels like a small investment research office. Four illustrated analyst characters represent four AI agents. The owner can click analysts and their desks, inspect assignments and schedules, read reports, and eventually request new research and ask follow-up questions.

Begin with interaction design and a working frontend demonstration. Implement the live research integration as a later phase. A visual prototype is not evidence that real agents are connected.

This document supplies the complete project context. No previous conversation is required. It is a proposed plan, not a claim that a repository, server, assets, credentials, or OpenClaw installation already exists.

When handed an existing repository, read its applicable AGENTS.md and inspect its framework, entry points, design assets, and scripts first. Preserve compatible existing choices. When starting fresh, use the proposed defaults below. Do not purchase services, provision accounts, or deploy publicly merely because those appear in this roadmap.

## 2. Requirements and proposed defaults

| Item | Status | Direction |
| --- | --- | --- |
| Private investment-agent headquarters | Confirmed requirement | Personal application, initially one owner |
| Four analyst characters | Confirmed requirement | Global markets, portfolio, opportunity scout, AI & technology |
| Clickable analysts and desks | Confirmed requirement | Meaningful profile and assignment interactions |
| Report list, report detail, agent profile panel | Confirmed requirement | Core readable information surfaces |
| Clearly labelled demonstration data | Confirmed requirement | Required throughout the prototype |
| Operation while laptop is off | Confirmed requirement for live phase | Research runs on an always-on remote server |
| OpenClaw | Planned integration | Agent execution and research scheduling |
| Original avatars with movement | Planned experience | Non-pixel visual direction is a proposed default |
| Art direction | Proposed default | Warm, polished, illustrated 2D office with slight isometric depth |
| Database | Proposed default, not a binding user decision | Supabase PostgreSQL; verify limits before provisioning |
| Frontend | Proposed default | React + TypeScript; Vite for a new frontend prototype |
| Backend | Proposed default | Small Node.js + TypeScript service |
| Office rendering | Proposed default | SVG/HTML/CSS for the initial scene; introduce a canvas renderer only if justified |
| Chat, notifications, schedule editing | Later scope | Add after reports and execution work reliably |
| Product name | Working title | Investment Office; replace without changing architecture |

Resolve routine reversible choices autonomously. Record assumptions. Ask the owner only when a missing decision materially blocks implementation or changes cost, privacy, or intended scope.

## 3. Product objective

The owner should be able to open the app on a phone or laptop and answer:

1. What did my analysts discover?
2. Which analyst is working, waiting, or unavailable?
3. What matters for my holdings and research interests?
4. What is scheduled next?
5. What can I read, investigate, or request next?

The office is both an enjoyable visual environment and a useful entry point into reports. Maintain a practical list-based navigation alternative so information remains accessible without manipulating the scene.

### Success criteria

- Each analyst is visually recognizable and has a stable identity.
- Clicking a character or desk consistently opens the correct information.
- Reports are legible, searchable, and traceable to their agent and run.
- Demonstration and live behaviour are visibly distinguishable.
- Live status comes from verified execution state, not decorative animation.
- Scheduled research continues when the owner's device is off.
- Sources, uncertainty, errors, and stale information are visible.

### Out of scope for the initial release

- Brokerage login, order execution, or automated trading.
- Public subscriptions, billing, or multi-tenant access.
- Streaming tick-by-tick prices or a historical market-data warehouse.
- Autonomous continuous research all day.
- Complex 3D environments, multiplayer, or game progression.
- AI-generated movement decisions for every animation.
- Claiming an investment is guaranteed to succeed.

## 4. Analyst roster

Names below are demonstration defaults and may be changed. Use stable technical IDs independent of display names.

| ID | Character | Responsibility | Required inputs | Report emphasis |
| --- | --- | --- | --- | --- |
| market | Rex — Global Markets Analyst | Macro, rates, currencies, commodities and global markets | Dated official releases, market observations and owner context | Weekday briefing, weekly scenarios, material alerts |
| portfolio | Paz — Portfolio Analyst | Existing stocks/ETFs, theses, dividends, allocation and digest assembly | Latest holdings, approved targets, contribution inputs and dated look-through | Weekly health, material thesis changes, monthly DCA/dividends, combined digest |
| research | Clara — Opportunity Scout | Independent emerging-sector and company discovery | Adoption/financial evidence, valuation and catalyst assumptions | Up to three radar developments, justified deep dive, persistent candidate updates |
| risk | Theo — AI & Technology Analyst | Models, coding agents, automation, AI economics and practical applications | Official docs, credible evaluations, pricing/availability and practical evidence | Use now/Watch/Investment implication, weekly worth-testing recommendation |

Give characters individual clothing, silhouettes, accent colours, and desk props. Do not make colour the only differentiator. Avoid tying analytical ability to appearance or stereotypes.

For live research, the Portfolio Analyst must receive position sizes before calculating concentration. ETF look-through exposure requires reliable holdings data and a stated as-of date. Never manufacture missing holdings or assume previous portfolio information is current.

## 5. Information architecture

| Surface | Purpose | Essential content |
| --- | --- | --- |
| Office | Visual overview | Four analysts/desks, activity indicators, briefing area, upcoming runs |
| Reports | Read and find outputs | Search, filters, unread indicators, agent, title, date |
| Report detail | Read one output | Summary, findings, interpretation, uncertainties, sources, report/run metadata |
| Agent profile | Inspect one analyst | Identity, assignment, status, schedule, recent reports, run control |
| Holdings/watchlist | Supply research inputs | Tickers, optional quantities/weights, update date; later live phase |
| Settings | Control preferences | Timezone, motion, theme, model preferences; live connection status later |
| Run history | Understand execution | Queued/start/end times, execution result, delivery result, retry action |

Prototype navigation: Office and Reports as primary destinations; agent profiles as contextual panels. Use a full-page mobile profile/detail when necessary. Give report detail a stable URL or equivalent route state so refresh/back navigation behaves predictably.

## 6. Interaction specification

| Trigger | Result | Close/back behaviour | Mobile equivalent |
| --- | --- | --- | --- |
| Select analyst | Open their profile on Overview | Restore focus to selected character; preserve office selection | Tap character or accessible analyst card |
| Select analyst desk | Open same profile on Assignment | Return to previous office position | Tap desk or Assignment action |
| Select report indicator | Open that analyst's indicated report | Return to originating office/profile | Tap sufficiently large report control |
| Select shared briefing area | Open Reports with all agents | Back returns to Office | Briefing button/card |
| Select report row | Open report detail and mark read | Restore list filters, query, and scroll | Full-page report |
| Change report filter/search | Update matching reports | Keep controls and empty state visible | Compact filter controls |
| Select Run now | Queue one run for that task | User can leave; run remains visible | Same behaviour |
| Select Ask about report | Open contextual conversation | Preserve report and thread | Dedicated panel/page |
| Select failed run | Show reason and permitted retry | Return to profile/history | Same behaviour |
| Escape or close profile | Close topmost dismissible overlay | Restore initiating control focus | Visible close/back button |

Use one agent panel with Overview, Assignment, and Reports sections rather than multiple overlapping panels. Preserve selections when moving between report and profile. Avoid accidental character movement when the owner is trying to select a control.

### Prototype action rules

- Run now performs a deterministic, bounded simulation: queued → running → succeeded, then inserts an explicitly fictional report.
- Disable duplicate activation while that demo task is active.
- Include a development/demo scenario switch to exercise failure and offline states.
- Demonstration follow-up chat uses labelled canned responses; no model call.
- Read/unread, filters, and preferences may persist in localStorage. Provide Reset demo.
- Closing/reopening a panel must not restart a simulation.

## 7. Visual direction and asset plan

Proposed look: a welcoming analyst studio with warm neutral surfaces, restrained blue/teal accents, subtle shadows, books, plants, and distinct desks. Use typography and spacing that suit long research reports. Select a cohesive style rather than combining unrelated avatar assets.

Office composition: four desks with clear interaction targets, shared briefing table, a small lounge/walking area, and enough empty space for movement. UI text belongs in ordinary accessible HTML; decorative illustration may sit behind it.

Create one static character and one desk first, validate readability at phone size, then expand the asset system to four characters. Assets may be SVG, layered illustrations, or consistent sprite frames. Concept imagery is not automatically animation-ready: walking requires suitable poses/layers and consistent dimensions.

Animation states: idle, reading, typing, walking, report-ready, and error attention. Use a small animation state machine. Prefer predefined waypoints; add obstacle-aware pathfinding only if the room requires it. Characters must not cross desks/walls. Match scene depth ordering to position.

Separate decorative behaviour from verified execution state. An idle analyst can walk casually, but that does not mean research is running. Reduced motion uses static poses and text indicators. Pause unnecessary animation when the page is hidden.

## 8. Responsive and accessibility requirements

- Verify at approximately 360 px, 390 px, 768 px, and 1440 px widths.
- Desktop: large office with contextual side panel; report text retains a comfortable reading width.
- Phone: compact office plus analyst cards; profiles and reports become readable full-page views or properly sized sheets.
- No essential information requires hovering, sound, precise scene tapping, or horizontal scrolling.
- Use semantic buttons, labelled icons, visible keyboard focus, and practical touch targets of about 44 px.
- Modal panels manage focus and return it on close. Nonmodal panels should not trap focus unnecessarily.
- Respect prefers-reduced-motion. Use text and icons as well as colour for status.
- Include empty, loading, error, offline, and permission-denied feedback where relevant.

## 9. Demonstration content

Display a persistent banner: **Demo — simulated agents and illustrative reports; no live market data.**

Provide two or three reports per analyst with varied read status and timestamps, plus at least one failed run and an empty-filter case. Use an invented sample portfolio or clearly labelled sample tickers; do not import assumed personal holdings.

Each report contains title, author, generation time, market/data as-of time where relevant, summary, findings, interpretation, risks, missing information, and source references. Demo references must be labelled illustrative. Real official homepage links may be offered as sample destinations, but do not claim they support fabricated findings.

Keep demo and live data paths distinct. Do not let prototype records enter live portfolio calculations. A connected app with no reports shows a genuine empty state rather than silently falling back to fictional data.

## 10. Architecture and boundaries

| Component | Responsibility |
| --- | --- |
| Frontend | Office rendering, report reading, controls, accessibility |
| Application backend | Login verification, authorization, database writes, integration adapter |
| Application database | App profiles, reports, run projections, portfolio inputs, read state |
| OpenClaw Gateway | Agent execution, its own internal state and research schedules |
| Research/model services | Inference, web research, optional financial-data APIs |
| File storage | Avatar assets and optional report attachments |

Supabase is proposed for managed PostgreSQL and optional Auth/Realtime. It does not replace the server running OpenClaw. SQLite on the VPS is a viable smaller single-owner alternative if chosen deliberately. Do not install both application databases without a reason.

Do not edit or repurpose OpenClaw's internal database as the app database. Build an adapter against supported interfaces. OpenClaw owns research schedules; the app stores external job references and reads back schedule updates.

For the prototype, use a mock implementation of the same application service interface that the live backend will later satisfy. Components should not embed OpenClaw CLI strings or provider secrets.

## 11. Proposed application data model

All owner-sensitive records carry owner_id or inherit ownership through an enforced parent relationship. Use UTC timestamps; show schedules in Asia/Jakarta by default.

| Entity | Principal fields |
| --- | --- |
| agents | id, owner_id, external_agent_id, display_name, role, avatar_key, desk_key, active |
| tasks | id, owner_id, agent_id, external_job_id, name, instruction, enabled, schedule_display, timezone |
| runs | id, owner_id, task_id, external_run_id, execution_status, delivery_status, queued_at, started_at, finished_at, error_code, error_summary |
| reports | id, owner_id, agent_id, run_id, title, summary, body_markdown, generated_at, data_as_of, mode |
| report_sources | id, report_id, label, url, published_at, retrieved_at, illustrative |
| report_reads | owner_id, report_id, read_at |
| holdings | id, owner_id, symbol, asset_type, quantity, weight, currency, as_of |
| watchlist | id, owner_id, symbol, notes |
| conversations | id, owner_id, agent_id, report_id, external_session_id |
| messages | id, conversation_id, role, body, created_at, mode |
| integration_events | id, external_event_key, payload, received_at, processed_at, processing_error |
| preferences | owner_id, timezone, theme, reduced_motion, notification_preferences |

Do not require both quantity and weight; define validation and calculation policy for partial holdings. Index report date/agent, run task/date, and external unique identifiers. Paginate reports. Avoid storing animation frames or every character position.

Store report content as Markdown initially. Normalize verified source references separately when available. Preserve a raw event for debugging with bounded retention; redact secrets and avoid unnecessary full research transcript retention.

## 12. Application API proposal

These routes are for our backend, **not asserted OpenClaw endpoint names**:

| Route | Purpose |
| --- | --- |
| GET /api/agents | Roster and latest known status |
| GET /api/agents/:id | Profile and task summaries |
| GET /api/reports | Paginated search/filter results |
| GET /api/reports/:id | Report detail and sources |
| PATCH /api/reports/:id/read | Owner read state |
| POST /api/tasks/:id/runs | Authenticated Run now request with idempotency key |
| GET /api/runs/:id | Execution and delivery state |
| PATCH /api/tasks/:id | Later schedule/instruction editing |
| POST /api/reports/:id/conversations | Later contextual conversation creation |
| POST /api/conversations/:id/messages | Later follow-up turn |
| POST /integrations/openclaw/report | Authenticated completion-event receiver |

Backend endpoints enforce ownership and allowed task IDs. If any frontend database access is used, enforce row-level policies and verify them. Keep privileged Supabase credentials and OpenClaw tokens server-side. Sanitize Markdown output and validate external URLs.

## 13. OpenClaw integration discovery and implementation

Before implementing, record the installed OpenClaw version and consult its current documentation. Inspect actual test outputs; do not assume copied examples match the installed release.

### Completion reports

Configure one isolated scheduled task with webhook delivery to the application backend. Capture a successful event and a failure event. Build the adapter from their actual formats. Establish an authenticated delivery mechanism supported by the installed version or a private network receiver; do not assume payload signatures exist.

Persist events before acknowledging receipt. Deduplicate using verified event/run IDs and reconcile against run history. Handle failed delivery and ambiguous acknowledgements; do not assume every webhook is automatically retried.

### Manual research

Request an allowed OpenClaw task run through the backend. Record the accepted run identifier and distinguish queued from running. Use argument arrays for any CLI adapter, not user-interpolated shell commands. A request timeout does not necessarily mean execution stopped; reconcile before allowing a retry.

### Status

Completion delivery supplies terminal information, not necessarily start or step events. Confirm supported status/event fields. Begin with polling supported interfaces if adequate. Add streaming only when justified. Record status_observed_at and show stale/unknown status when the integration is unavailable.

### Follow-up chat

Later, use a supported agent-turn API with explicit agent and session routing. Attach the selected report context. Keep one conversation identity per thread and distinguish a follow-up from a scheduled research run. Verify streaming, permissions, and cancellation behaviour.

### Schedule ownership

Create schedules in OpenClaw and store returned job IDs. For edits, write through the adapter, read back the actual saved schedule, then update the app projection. Never run a second independent research timer in the frontend.

## 14. Execution state and reliability

Execution: queued → running → succeeded / failed / cancelled / interrupted. Unknown describes insufficient observation, not an invented failure. Delivery has separate pending / delivered / failed / unknown status.

| Situation | Required behaviour |
| --- | --- |
| Repeated Run now click | Reuse idempotency key or reject duplicate active task |
| Duplicate event | One run/report record; no duplicate notification |
| Server disconnect | Display stale/unknown and last observation time |
| Agent failure | Preserve error summary and offer a controlled retry |
| Research succeeded but webhook failed | Show execution success and delivery issue; reconcile report |
| Incomplete financial inputs | Explain missing data; skip unsupported calculations |
| Malformed output | Preserve event, flag processing error, avoid silent data loss |
| Restart during active run | Reconcile with OpenClaw; do not fabricate success or rerun blindly |
| Demo reset | Clear only demonstration state |

Idle animation has no execution authority. A notification of task acceptance cannot set succeeded. Bound the number of concurrent runs and expose timeout/failure information. Keep logs useful without logging credentials.

## 15. Research and report standards

- Define scope and source preferences in each agent's instructions.
- Prefer original filings, investor-relations releases, and official fund documentation for factual claims.
- Include dates, source links, and data freshness.
- Separate facts, estimates, inferences, and speculative scenarios.
- Permit a short 'No material update' report.
- Require a report on every scheduled task even when findings are empty if the owner expects visible delivery.
- Do not use another analyst's conclusion as independent evidence.
- Identify assumptions in valuation and portfolio calculations.
- Configure bounded research effort, model usage, and run duration.
- Do not claim exact per-run cost unless the integration exposes reliable usage data; label estimates.

Proposed schedule defaults: market at 07:00 and portfolio at 07:20 Tuesday–Saturday Jakarta time; research Wednesday/Saturday at 09:00; risk Sunday at 10:00. Morning reports summarize the latest available U.S. session and acknowledge holidays. These are editable suggestions, not confirmed owner preferences.

## 16. Build phases and acceptance criteria

### Phase A — Inspect and sketch

- Inspect the repository if supplied; document stack and available assets.
- Produce annotated desktop/mobile wireframes and the interaction table.
- Map office clicks, panel tabs, report navigation, back behaviour, and error states.
- Record chosen art direction and unresolved choices.

Done when every required interaction has a defined destination and return path. Use owner feedback when available; routine reversible prototype work can proceed from the marked defaults.

### Phase B — Frontend demonstration

- Build responsive shell, report list/detail, and reusable agent panel.
- Add four coherent characters/desks and accessible selection targets.
- Add seeded demo records, filters, read state, simulated runs/chat, and Reset demo.
- Separate data services from visual components.
- Add reduced motion and labelled demo banner.

Done when all four agents open correctly, report filters work, detail/back preserves context, duplicate demo runs are prevented, and there is no live API traffic.

### Phase C — Minimal live vertical slice

- Configure private backend, database migrations, and owner login.
- Store the roster and receive one real OpenClaw completion event.
- Deduplicate and display the report.
- Implement one allowed Run now task and reliable status observation.
- Verify services continue without the laptop.

Done when a real run produces one persisted, readable report and failures are visible. Keep demo mode available as a clearly separate environment/path.

### Phase D — Four-agent operation

- Add the other three agents and tasks.
- Supply dated holdings/watchlist through owner input.
- Configure schedules, run history, stale-state detection, and reconciliation.
- Add search and unread indicators to real reports.
- Verify all reports identify their agent, run, and data dates.

Done when all four scheduled tasks work independently and duplicate/failed deliveries are handled.

### Phase E — Controls and conversations

- Add schedule/instruction editing through the adapter.
- Add contextual follow-up conversations with stable sessions.
- Add optional notifications, preferences, and usage visibility.
- Provide cancellation only if the selected interface supports it reliably.

Done when questions reach the correct agent with the correct report context and schedule changes match OpenClaw's saved state.

### Phase F — Office polish and operating checks

- Refine movement, character animation, depth order, lighting, and feedback.
- Optimize mobile rendering and reduced-motion behaviour.
- Configure HTTPS, supervised services, backups, and restoration instructions.
- Verify reboot recovery, failure handling, and owner-only access.

Done when the office reflects verified states and the application is usable without movement enabled.

## 17. Verification plan

Use focused checks appropriate to each phase rather than exhaustive tests that merely mirror implementation.

Prototype: verify four character/desk paths, report filters/read state, back/close, bounded simulation, keyboard selection, reduced motion, and phone layout. Inspect representative desktop and mobile screenshots.

Integration: test an unauthorized request, duplicate event, wrong owner/report ID, malformed event, queued acceptance, failed run, delivery failure, and stale status. Validate migrations and backup restoration using nonproduction data.

Unattended operation: schedule a short real task, disconnect the owner's laptop, verify the report; restart the server and verify service recovery. Avoid repeated paid research runs when a single successful test already validates the path.

## 18. Planning estimates and dependencies

These are rough estimates for an experienced developer with AI assistance, not delivery promises. Learning infrastructure or developing custom animated assets can add substantial time.

| Work | Approximate effort |
| --- | --- |
| Interaction sketch and visual direction | 1–3 working days |
| Functional frontend demo | 3–7 working days |
| First live report and Run now integration | 3–7 working days |
| Four-agent reliability and input management | 3–6 working days |
| Conversations and schedule editing | 2–5 working days |
| Animation polish, deployment, operating checks | 4–10 working days |

Dependencies: approved or assumed visual direction; coherent character assets; server/account access for live phases; model and search credentials; verified OpenClaw interfaces; dated portfolio inputs; selected database and hosting. Work can overlap, but do not promise polished live functionality from a frontend demo alone.

## 19. Deliverables and suggested project structure

Deliver runnable source, README with preview/setup commands, environment-variable names without values, data migrations for live phases, demo fixtures, integration notes including tested OpenClaw version, and a progress checklist.

Suggested directories: frontend/ for UI; backend/ for the private API and OpenClaw adapter; shared/ for types/contracts; database/ for migrations; docs/ for decisions and operation; assets/ for original office art. Adapt these to existing repository conventions rather than reorganizing needlessly.

Maintain implementation progress in docs/PROGRESS.md. Record completed acceptance checks and remaining gaps. At each meaningful milestone report what works, whether it is simulated or live, and the next concrete task.

## 20. First instruction to Codex

> Read this plan and inspect the repository. Implement Phases A and B first: the interaction sketch and a runnable frontend demonstration with four analysts, clickable desks, report list/detail, and agent profiles. Use the marked defaults for reversible choices. Keep all activity and data visibly simulated. Do not provision external services or implement live OpenClaw integration in this initial pass. Show the prototype and list the interactions verified. Keep later phases documented for continuation.

## 21. Reference documentation

Recheck these when implementing; software capabilities and service limits can change.

- OpenClaw quickstart: https://docs.openclaw.ai/start/getting-started
- Server installation: https://docs.openclaw.ai/install/digitalocean
- Agent management: https://docs.openclaw.ai/cli/agents
- Automations CLI: https://docs.openclaw.ai/cli/cron
- Completion delivery: https://docs.openclaw.ai/automation/cron-jobs/delivery
- Optional responses API: https://docs.openclaw.ai/gateway/openresponses-http-api
- Gateway security: https://docs.openclaw.ai/gateway/security
- Web research setup: https://docs.openclaw.ai/tools/web
- Supabase database: https://supabase.com/docs/guides/database/overview
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- Supabase limits/pricing: https://supabase.com/pricing
- SQLite suitability: https://www.sqlite.org/whentouse.html
