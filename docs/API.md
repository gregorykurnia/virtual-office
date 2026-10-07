# Private API foundation

The API is a Fastify service in `backend/`. It accepts Firebase ID tokens in an `Authorization: Bearer <token>` header over same-origin HTTPS. Firebase Admin verifies the client token, expiry, project claims, signature, revocation status, and account state. A stable `OWNER_UID` allowlist then authorizes the one owner. The owner UID is derived from the verified token and never comes from a request body, query parameter, or browser-selected Firestore path.

## Routes

| Method and route | Access | Response |
| --- | --- | --- |
| `GET /health/live` | Public | Process liveness only; no dependency detail. |
| `GET /health/ready` | Public | `200 { status: "ready" }` or generic `503 { status: "not_ready" }`; dependency details stay private. |
| `GET /api/health/ready` | Owner | Checks Firebase Auth and Firestore; returns safe dependency status codes. |
| `GET /api/auth/session` | Owner | Verified UID, email, and display name for the authenticated session. |
| `GET /api/agents` | Owner | Saved analyst roster with availability derived from observed app runs. |
| `GET /api/agents/:id` | Owner | One analyst, saved tasks, recent reports, and recorded missing-input guidance. |
| `GET /api/reports` | Owner | Cursor-paginated report summaries; accepts `agentId`, `unreadOnly`, `query`, `generatedFrom`, `generatedTo`, `pageSize`, and `cursor`. |
| `GET /api/reports/:id` | Owner | Report, sources, linked run, and safe immutable input-snapshot metadata. |
| `PATCH /api/reports/:id/read` | Owner | Idempotently creates the owner's read-state document and returns its timestamp. |
| `GET /api/runs` | Owner | Cursor-paginated run history; accepts `agentId`, `taskId`, `pageSize`, and `cursor`. |
| `GET /api/runs/:id` | Owner | One owner-scoped run record. |
| `GET /api/connection` | Owner | Gateway status; reports `unknown` and stale until a successful connection check is persisted. |

Successful resource responses use `{ dataMode: "live", observedAt, data }`. Record IDs that do not resolve below the authenticated owner's Firestore root return the same `404` response as unknown IDs.

Report ordering is newest `generatedAt` first, then document ID descending. Run ordering is newest `queuedAt` first, then document ID descending. Cursors are opaque base64url values carrying the exact Firestore timestamp, ID, and filter scope, so equal timestamps remain stable and a cursor cannot be reused with different filters. `pageSize` defaults to 20 and is capped at 50. Report filtering/search scans at most 250 recent documents per request; when that bound is reached, `hasMore` and `nextCursor` let the caller continue. The current case-insensitive search covers report title and summary. A dedicated index/provider is needed for full-text search over Markdown or unrestricted historical search.

The report detail route does not return the snapshot's `validatedInput` payload. It exposes only the snapshot ID, input version, dates, and content hash. The report body Markdown and source records remain in their separate validated Firestore documents.

`GET /api/agents` returns only saved agent documents; the empty owner profile created by migration therefore produces a genuine empty roster. Availability is `working` or `waiting` only while an app run is explicitly active/queued. Otherwise the API says `unknown` and includes the latest run observation; it does not treat a stale last run as proof that the Gateway is online. Tasks without input metadata state that their input requirements have not been configured.

The browser signs in and out through Firebase Auth. The API uses bearer tokens and is stateless, so it does not issue an application cookie or provide a server-side logout endpoint. Signing out clears the Firebase client session. A `401` means the token is absent, expired, invalid, revoked, or the account is disabled; `403` means the signed-in UID is not the configured owner.

## Request and error behavior

- Requests carry or receive a validated `X-Request-ID`; responses echo it.
- `Cache-Control: no-store`, Helmet security headers, a 1 MiB body limit, and a global per-IP rate limit apply.
- CORS is disabled by default for same-origin use. If enabled, `CORS_ORIGINS` accepts only exact origins; trusted proxy addresses are separately configured.
- Errors use `{ "error": { "code", "message", "requestId" } }`. Internal exception text and dependency detail are not exposed on public routes.
- Application validation errors use `422`; inaccessible resource IDs use `404`; expired/missing credentials use `401`; valid nonowner identities use `403`.
- Authorization headers and cookies are redacted from structured logs. Request bodies are not logged.
- The API is a separate live data path; it does not read or fall back to the browser's demo fixtures.

## Deferred write contracts

These routes are documented for the next implementation steps and are not mounted yet:

| Planned method and route | Contract |
| --- | --- |
| `POST /api/tasks/:id/runs` | Require an `Idempotency-Key`; persist the request, queued run, immutable input reference, and dispatch work item in one transaction; return `202` with the app run ID. Reuse the response for the same key and canonical body; return `409` when a key is reused with a different body or an active-task conflict exists. |
| `GET/PUT /api/holdings` | Validate dated holdings, decimal strings, and an expected collection version. Return `409` on a version mismatch; never derive owner identity from the body. |
| `GET/PUT /api/watchlist` | Validate the owner research universe and expected collection version; return `409` on a version mismatch. |
| `PATCH /api/tasks/:id` | Accept only supported schedule/timezone/enabled/instruction fields plus the expected config version. Persist a mutation before external work, serialize updates per task, and report saved state only after external readback. |
| `POST /api/reports/:id/conversations` | Resolve the report and its saved analyst under the authenticated owner; create a stable thread with a server-generated external session key. Never accept external agent or session IDs from the browser. |
| `POST /api/conversations/:id/messages` | Persist an owner-scoped user turn and request key before dispatch; serialize turns per conversation and retain pending/partial/failed assistant state across disconnects. |
| `POST /integrations/openclaw/report` | Use a separate private listener and dedicated constant-time-checked integration credential, with bounded payload validation and idempotent event handling. It is not a browser route and does not use the owner Firebase bearer token. |

The durable run, task mutation, conversation, and integration routes must keep external work outside Firestore transaction callbacks. A provider timeout is an unknown outcome to reconcile, not permission to blindly repeat a potentially paid action.

## Local setup

See [Firebase setup](./FIREBASE_SETUP.md) for owner creation, ADC, emulator settings, and live-mode startup. Backend configuration is validated at startup; copy `backend/.env.example` to the ignored `backend/.env.local` and set `FIREBASE_PROJECT_ID` and `OWNER_UID` before running the API.
