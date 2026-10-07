# Investment Office

> Requirements update — 7 October 2026: [Four-agent workflow specification](./docs/FOUR_AGENT_WORKFLOW_SPEC.md) is authoritative for the revised roles, investor context, watchlists, reporting, coordination, editable WIB schedules, UI controls, and acceptance checks. Conflicting historical defaults below are superseded. Preserve Rex (`market`), Paz (`portfolio`), Clara (`research`), and Theo (`risk`) and their stable artwork keys. Paz is the approved cosmetic replacement for the portfolio display identity; linked responsibilities and records remain unchanged. This update records requirements; it does not claim implementation or live connectivity.

A private, responsive research-office app foundation for four investment analyst agents. Demo mode remains the default. Steps 14 and 15 add an optional Firebase owner login, private Fastify API, and versioned Firestore schema; live report routes and agents are not connected yet.

## Requirements

- Node.js 26.10.0 (see `.node-version`)
- npm 10 or newer

With nvm, run `nvm install 26.10.0` once if needed, then `nvm use 26.10.0`. Install the workspace dependencies and start the frontend:

```sh
npm ci
npm run dev
```

The frontend runs in demo mode and makes no live research or market-data requests. `npm run build`, `npm run typecheck`, and `npm run lint` operate across the current workspaces.

Firebase project setup is documented in [docs/FIREBASE_SETUP.md](./docs/FIREBASE_SETUP.md). The local Firebase web configuration belongs in ignored `frontend/.env.local`; backend configuration belongs in ignored `backend/.env.local`. Firestore product data is accessed through the API only. Review [docs/DATA_MODEL.md](./docs/DATA_MODEL.md) before applying the schema migration.

To run the optional API locally, create `backend/.env.local` from `backend/.env.example`, configure Firebase Admin credentials and an owner UID, then run `npm run dev:api` in one terminal. The frontend can run in another terminal with `npm run dev`. `npm run db:migrate` applies the schema marker and empty owner profile to the Firebase project selected by the backend environment; inspect the project and credentials before running it.

## Project structure

- `frontend/` — React, TypeScript, Vite, route shell, and deterministic demo adapter/fixtures
- `backend/` — Fastify API, Firebase token verification, health routes, and Firestore migration foundation
- `shared/` — app-owned Zod schemas, service contracts, and state-transition policies
- `database/` — deny-all browser rules and Firestore composite indexes
- `docs/` — decisions, progress, data model, and route/interaction specifications
- `design-concepts/` — visual direction references, not production UI assets

See [Investment Office Implementation Plan.md](./Investment%20Office%20Implementation%20Plan.md) for product requirements and [docs/PROGRESS.md](./docs/PROGRESS.md) for milestone status.
