# Investment Office

A private, responsive research-office frontend for four investment analyst agents. The frontend initializes the supplied Firebase web app and provides an on-demand Cloud Firestore client; no agents or market feeds are connected yet.

## Requirements

- Node.js 26.10.0 (see `.node-version`)
- npm 10 or newer

With nvm, run `nvm install 26.10.0` once if needed, then `nvm use 26.10.0`. Install the workspace dependencies and start the frontend:

```sh
npm ci
npm run dev
```

The frontend runs in demo mode and makes no live research or market-data requests. `npm run build`, `npm run typecheck`, and `npm run lint` operate across the current workspaces.

Firebase project setup is documented in [docs/FIREBASE_SETUP.md](./docs/FIREBASE_SETUP.md). The local Firebase client configuration is in ignored `frontend/.env.local`; Firestore reads and writes should only be added after Authentication and Security Rules are configured.

## Project structure

- `frontend/` — React, TypeScript, Vite, route shell, and deterministic demo adapter/fixtures
- `backend/` — inactive Node/TypeScript API workspace for a later phase
- `shared/` — app-owned Zod schemas, service contracts, and state-transition policies
- `docs/` — decisions, progress, and route/interaction specifications
- `design-concepts/` — visual direction references, not production UI assets

See [Investment Office Implementation Plan.md](./Investment%20Office%20Implementation%20Plan.md) for product requirements and [docs/PROGRESS.md](./docs/PROGRESS.md) for milestone status.
