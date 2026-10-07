# Implementation progress

Last updated: 7 October 2026

## Milestones

| Phase | Mode | Status | Acceptance check |
| --- | --- | --- | --- |
| A — Foundation and interaction design (Steps 1–5) | Demo foundation; no live integration | Complete | Baseline is reproducible; runtime/workspaces are installable; route and return behavior is specified; desktop/mobile wireframes are complete; a four-analyst/four-desk production SVG contract is defined. |
| B — Working frontend demonstration (Steps 6–13) | Demo only; simulated agents/reports/runs, no model or OpenClaw calls | Complete | Four analysts and desks work by keyboard/touch; the concept-quality native visual system, reports, filters, profiles, demo run lifecycle, reduced-motion behavior, and handoff evidence are available. |
| C1 — Private backend and app database (Steps 14–19) | Live app foundation; owner-authenticated, with genuine empty states | In progress — Steps 14–17 implemented; 18–19 remain | Firebase owner auth, Firestore schema, owner-scoped repositories, and read APIs are implemented; emulator acceptance, durable runs, and the live frontend adapter remain. |
| C2 — OpenClaw setup and first live report (Steps 20–29) | Live integration | Not started | A captured, authenticated OpenClaw completion becomes exactly one persisted report; a controlled run is reconciled after disconnect/restart. |
| D — Four analysts and dependable schedules (Steps 30–36) | Live integration | Not started | Four reviewed tasks and saved schedules use dated inputs, map to verified agent/job IDs, and reconcile without duplicates. |
| E — Editing, conversations, notifications (Steps 37–41) | Live integration with optional user-facing features | Not started | Schedule edits are read back, report conversations retain correct context, and any notifications/usage reflect actual state. |
| F — Animation, private deployment, operations (Steps 42–47) | Private live deployment | Not started | Private release, restart recovery, backup restoration, laptop-off execution, and final accessibility/security review are evidenced. |

## Completed in this pass

- Read the product brief and technical implementation guide.
- Confirmed there is no existing app source, applicable `AGENTS.md`, or Git history in the workspace.
- Created baseline Git commit `7f6c0f5` containing the existing documentation and design references.
- Completed Step 2 with the Node-pinned npm workspace, lockfile, React/TypeScript/Vite frontend shell, inactive backend package, shared Zod schema, strict TypeScript, and lint configuration.
- Completed Step 3 with the route and interaction contract in `INTERACTIONS.md`, including mobile/back behavior and loading/empty/error states.
- Completed Step 4 with annotated, browser-openable desktop and 360 px mobile wireframes for Office, analyst profile, Reports, and report detail in `design-concepts/step-4-wireframes.html`. The related CSS tokens are in `design-concepts/step-4-tokens.css`.
- Completed Step 5 with a coherent vector set for Rex, Adrian, Clara, and Theo: four distinct desk assets plus idle, reading, typing, report-ready, and attention poses. The manifest, normalized anchor/export rules, accessibility boundary, and local preview are documented in `docs/ASSET_CONTRACT.md`.
- Completed Step 6 with Zod-validated app-owned agent/task/report/run/preferences contracts, an `OfficeService` interface with data-mode and observed-time envelopes, filter/page shapes, and separate execution, delivery, and report-processing transition rules.
- Completed Step 7 with a fixed-clock demo fixture set, four analysts and tasks, eight complete illustrative reports, fictional sample symbols, a failed run, offline/no-report/failing-run scenarios, local-only idempotent run simulation, and versioned `investment-office:demo:v1` persistence. The app shell now exposes a scenario selector and Reset demo control.
- Completed Step 8 with the application shell, header/demo/preferences controls, Reports list and stable detail routes, URL-preserving analyst/unread/date filters, debounced search, safe Markdown rendering with controlled links, source and run metadata, detail-time read tracking, and loading/empty/not-found/unavailable states. The affected screens were inspected at desktop and phone widths.
- Completed Step 9 with a shared analyst profile surface for all four demo agents: Overview, Assignment, and Reports sections; identity/status/observation/task/schedule facts; task inputs and missing-input guidance; recent reports and run history; and a bounded Run now control that observes the existing persisted demo timer. Desktop uses a nonmodal side panel; phone widths use a readable full-width profile with an explicit Back to Office action.
- Completed Step 10 with a shared-coordinate SVG office room, four clickable desk and character controls using the production sprite assets, per-agent report shortcuts, a shared briefing shortcut to Reports, visible selection rings, and an accessible analyst-card mirror. The scene was visually inspected at 1440, 390, and 360 px widths.
- Completed Step 11 with service-owned queued/running/terminal run timers, active-task reuse, atomic success/report persistence, explicit interruption on full page refresh, reset cancellation, and report-scoped canned follow-up responses with no model or network traffic.
- Completed Step 12 with a shared live region for meaningful demo run/report updates, explicit hidden-tab pausing for both the activity clock and decorative CSS loops, stored/system reduced-motion handling, and a Rex-specific deterministic activity seed. The responsive styles and required browser captures now verify the motion-free and phone-width presentation.
- Completed Step 13 with typecheck, lint, production build, local route/asset smoke checks, CDP-controlled captures at 360/390/768/1440 px, Reports/profile/detail evidence, visual-fidelity comparison, and a documented frontend handoff in `docs/verification/step-13-frontend-handoff.md`.
- Implemented Step 14 with a Fastify API, validated server configuration, structured request IDs and redacted logs, health/readiness endpoints, exact optional CORS, request/rate limits, Firebase Admin ID-token verification including revocation checks, and a stable owner UID allowlist. Added an opt-in live-mode sign-in/sign-out screen; demo remains the default.
- Implemented Step 15 against the recorded Firebase/Firestore decision: Zod document contracts for the guide's entities, owner-scoped collection paths, transactional uniqueness claim helpers, an idempotent schema migration, deny-all browser Firestore Rules, composite indexes, and `docs/DATA_MODEL.md`. The cloud migration and Rules/index deployment were not run.
- Implemented Step 16 with a branded verified-owner context required by runtime Firestore path helpers and repositories; owner-scoped report/task/run/source/read/snapshot lookups; transactional parent validation for report read-state writes; and no browser Firestore access. Added API checks for missing, expired, nonallowlisted, and mismatched owner/resource requests. Verification used injected identities and a path-recording Firestore stub; a second authenticated identity against the Firestore emulator remains pending.
- Implemented Step 17 with authenticated agent/profile, report list/detail/read-state, run history/detail, and connection-status routes. Responses have a shared success/error envelope, stable timestamp-plus-ID cursors, bounded report filtering/search, parent checks, and source/run/input-snapshot metadata. Manual run creation, holdings, watchlist, task mutation, and conversations remain in their later steps.
- Completed the isometric visual pass with a bot-free rendered office environment, WebP/JPEG runtime assets, normalized scene anchors, transparent desk hit areas, landmark labels, report/briefing overlays, artwork failure fallback, and preserved SVG analyst pose states.
- Confirmed typecheck, lint, and production build pass; the Vite development server starts at `127.0.0.1:5173`.

## Visual fidelity target

The seven files in `design-concepts/` remain the visual acceptance references for the frontend. The product now uses a separate bot-free rendered environment based on the shallow-isometric office composition, with HTML and SVG layers for application-owned interaction and analyst state. The target still includes the illustrated desks and analysts, clear zone hierarchy, selected analyst treatment, status language, responsive desktop/phone composition, and the spacing, colour, depth, and surface quality shown in the references.

The current Step 5 assets provide the stable production contract for that work: four typed analyst identities, four desks, five static poses per analyst, normalized anchors, and accessible HTML boundaries. Step 13 records the visual comparison against `02-office-layout.png`, `03-avatar-states.png`, `04-desktop-ui.png`, `05-mobile-ui.png`, `06-motion-storyboard.png`, and `07-visual-clarity-system.png`, including the deliberate choice to keep the rendered environment bot-free and place interaction in accessible HTML/SVG overlays.

## Current limits

- The workspace has no provisioned live agent mappings, real holdings, or market feed; reports currently exist only as local illustrative demo fixtures. The authenticated read API is implemented, but Firebase Auth provider settings, server ADC, Firestore emulator checks, deployed Rules/indexes, migration execution, durable run handling, and the live frontend adapter remain pending.
- The frontend demo through Step 13 is complete and the required browser captures are recorded. Live agents, backend persistence, market data, model traffic, OpenClaw integration, and production deployment remain future phase work.
- Node 26.10.0 remains the local pin; package engines also allow Node 24.x for Vercel, which currently builds with Node 24.21.0.
- No infrastructure, account, paid service, or public deployment has been provisioned.
