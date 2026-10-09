# Firebase Auth and Firestore setup

> Requirements update — 8 October 2026: [Four-agent workflow specification](./FOUR_AGENT_WORKFLOW_SPEC.md) is authoritative for the revised roles, investor context, watchlists, reporting, coordination, editable WIB schedules, UI controls, and acceptance checks. Conflicting historical defaults below are superseded. Preserve Rex (`market`), Paz (`portfolio`), Cody (`research`), and Wolffe (`risk`) and their stable artwork keys. Paz, Cody, and Wolffe are approved cosmetic replacements for prior display identities; linked responsibilities and records remain unchanged. This update records requirements; it does not claim implementation or live connectivity.

The frontend uses Firebase Authentication and the modular Firebase JavaScript SDK for the registered `virtual-office-77c1d` web app. Product Firestore access is server-only through the private Fastify API; the browser does not read or write Firestore.

## Local configuration

The supplied web app configuration is in the ignored file `frontend/.env.local`. For a new checkout, copy `frontend/.env.example` to `frontend/.env.local` and fill in the values from Firebase Console → Project settings → Your apps. Vite exposes only variables prefixed with `VITE_` to browser code.

The Firebase app singleton is `frontend/src/lib/firebase.ts`:

- `firebaseApp` is initialized only when the live sign-in screen is loaded and the required public web config is present.
- `isFirebaseConfigured` lets the login screen handle an unconfigured environment explicitly.

The demo does not initialize Firebase. Live UI requests go through the same-origin API; there is no browser Firestore data client.

The web configuration is public client configuration and will be present in the built frontend. It does not authorize API access. The API verifies Firebase ID tokens and accepts only the `OWNER_UID` configured on the server. Do not put service-account credentials or Admin SDK keys in Vite variables.

## Owner sign-in and private API

1. In Firebase Console, enable the Email/Password sign-in provider and create the intended owner account. The application has no user-registration screen.
2. Copy the account's stable Firebase Auth UID into `backend/.env.local` as `OWNER_UID`, with the matching `FIREBASE_PROJECT_ID`.
3. Configure Firebase Admin credentials for the backend using Application Default Credentials or the deployment's workload identity. Keep service-account credentials out of Git and frontend variables.
4. Copy `backend/.env.example` to `backend/.env.local`, then fill in the project ID, owner UID, and any exact CORS origin. Start the API with `npm run dev:api`.
5. To preview the login surface, set `VITE_APP_MODE=live` in `frontend/.env.local` and run the frontend. The local Vite server proxies `/api` to `127.0.0.1:3001`. Leave the mode unset or `demo` to keep using the simulated office.

The API checks revoked tokens, expiration, and Firebase token signatures/claims, then enforces the UID allowlist. Nonallowlisted accounts receive no owner data. The browser uses session-scoped Firebase Auth persistence and signs out locally; the API is stateless.

For local auth/database work, the included `firebase.json` configures the Auth and Firestore emulator ports. Start them with `firebase emulators:start --only auth,firestore --project virtual-office-local`, set `VITE_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` for the frontend, and set `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` plus `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` for the backend. Create a test owner in the emulator and use its UID in `OWNER_UID`; never use the emulator project ID for a production migration.

To check the owner boundary against the emulators, start them with the project above and run `npm run test:emulator` in `backend/` with `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` and `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` set (Node 24.x or 26.x; Java for the Firestore emulator). The test creates two random emulator accounts with per-run generated passwords, seeds one agent, task, run, and report under each, and asserts that: anonymous and malformed tokens get 401; a valid non-owner account gets 403 on every private route; the allowlisted owner sees only their own reports, runs, and agents; the other owner's identifiers return 404; and a token is rejected after the owner's refresh tokens are revoked. It refuses to start without both emulator hosts, does not read `backend/.env.local`, and removes its test accounts and documents afterwards. `EMULATOR_PROJECT_ID` must match the project the Auth emulator was started with (default `virtual-office-local`). This verifies the API boundary on emulators only. It does not verify live Firebase Auth, deployed Rules or indexes, or the Admin credentials used by the real project.

## Firestore schema and rules

`database/firestore.rules` denies direct browser reads and writes. `database/firestore.indexes.json` contains the initial composite indexes and large-field exemptions. The schema is documented in [DATA_MODEL.md](./DATA_MODEL.md). `npm run db:migrate` writes only schema version markers and an empty owner profile to the configured Firestore project. Inspect the selected project and ADC identity before running it; this setup guide does not deploy rules or execute a cloud migration.

The initialization follows Firebase's [modular web SDK setup](https://firebase.google.com/docs/web/setup) and [Cloud Firestore web initialization](https://firebase.google.com/docs/firestore/quickstart#initialize_cloud_firestore).
