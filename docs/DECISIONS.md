# Implementation decisions

> Requirements update — 7 October 2026: [Four-agent workflow specification](./FOUR_AGENT_WORKFLOW_SPEC.md) is authoritative for the revised roles, investor context, watchlists, reporting, coordination, editable WIB schedules, UI controls, and acceptance checks. Conflicting historical defaults below are superseded. Preserve Rex (`market`), Paz (`portfolio`), Clara (`research`), and Theo (`risk`) and their stable artwork keys. Paz is the approved cosmetic replacement for the portfolio display identity; linked responsibilities and records remain unchanged. This update records requirements; it does not claim implementation or live connectivity.

This file records reversible implementation defaults and facts observed in the workspace. Choices marked proposed remain open where the product plan says they are not binding.

| Area | Current decision | Status / evidence |
| --- | --- | --- |
| Source baseline | Existing plans, visual direction, and concept assets committed as `7f6c0f5` | Done, 2 Oct 2026 |
| Runtime | Node.js 26.10.0, pinned in `.node-version`; package engines accept 24.x or 26.x | Local work follows the implementation guide; the Vercel log uses Node 24.21.0. Vite 8 supports this build runtime. |
| Frontend | React 19.3.0 + TypeScript 5.9.3 + Vite 8.3.2 | Proposed default from the guide; exact dependency versions are pinned by `package-lock.json`. |
| Routing/data | React Router 7.18.4 and TanStack Query 5.104.0 | Added to the route shell; no live API requests are configured. |
| Shared validation | Zod schemas in `shared/src/` define app-owned agent, task, report, run, and preference contracts; `OfficeService` returns a data mode and observation time. | Step 6 complete; these schemas describe the application boundary and are not OpenClaw payload definitions. |
| Linting | ESLint 10.11.0 with typescript-eslint 8.71.0 | Installed and configured with flat config. |
| Backend | Node/TypeScript with Fastify | Step 14 API, request IDs, redacted structured logs, rate limiting, exact optional CORS, health checks, and Firebase ID-token owner authorization are implemented. Live credentials and deployment are pending. |
| Authentication | Firebase Authentication Email/Password, one owner UID allowlist | The browser signs in with Firebase Auth only in `VITE_APP_MODE=live`; the API verifies ID tokens and derives the owner UID. Enable the provider and set `OWNER_UID` before live use. |
| Application database | Firebase Cloud Firestore | The owner supplied a registered web app config for project `virtual-office-77c1d`; Step 15 adds owner-scoped document schemas, deny-all web rules, indexes, and an idempotent migration. Server ADC, project setup, rules/index deployment, and migration execution remain pending. The guide's original Supabase/PostgreSQL choice was a proposal and is superseded by this workspace decision. |
| Office scene | SVG/HTML/CSS remains the proposed rendering approach | Step 4 visual wireframes use native HTML/CSS in `design-concepts/step-4-wireframes.html`; existing PNGs remain direction references rather than embedded product assets. |
| Production office art | SVG sprite symbols with a typed agent manifest | Step 5 added a coherent four-analyst/four-desk set, normalized boxes and anchors, and five static reduced-motion poses per analyst. See `docs/ASSET_CONTRACT.md`. |
| Analyst profile surface | Nonmodal side panel on desktop; full-width profile with visible Back to Office action on phone | The desktop office roster remains available beside the profile, so focus is not trapped. The profile heading receives focus when a new analyst opens; mobile hides the roster while the profile is selected. |
| Demo run lifecycle | Timers belong to the local demo service; profile navigation does not stop them, a full page refresh marks active runs interrupted, and Reset demo cancels timers before replacing only the namespaced demo snapshot. | Step 11 complete; run progress is simulated locally and makes no model, market-data, or OpenClaw request. |
| Product mode | Local foundation/demo only | No OpenClaw, model, market-data, or personal-holdings connection. |
| Always-on research host | Oracle Cloud VM creation is in progress in Batam (`ap-batam-1`). The owner supplied VCN/subnet names and a private DNS hostname, but no running instance, OS, architecture, or authorized SSH route has been verified; no named SSH host appears in this workstation's SSH configuration. See [`docs/verification/step-20-host-readiness.md`](./verification/step-20-host-readiness.md). | Step 20 is incomplete. VM and SSH verification, host inspection, and server-side validation remain pending. No remote infrastructure was changed. |

The official Node release page lists Node 26.10.0 as Current and 24.21.0 as LTS as of this baseline. The package engine range permits Node 24.x for Vercel builds and Node 26.x locally for the planned OpenClaw runtime. See [Node.js releases](https://nodejs.org/en/about/previous-releases).

The selected Vite 8 line supports Node 20.19+ and 22.12+; this project pins Node 26 per the guide. See the [Vite 8 release notes](https://vite.dev/blog/announcing-vite8).
