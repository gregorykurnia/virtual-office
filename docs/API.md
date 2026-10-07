# Private API foundation

The API is a Fastify service in `backend/`. It accepts Firebase ID tokens in an `Authorization: Bearer <token>` header over same-origin HTTPS. Firebase Admin verifies the client token, expiry, project claims, signature, revocation status, and account state. A stable `OWNER_UID` allowlist then authorizes the one owner. The owner UID is derived from the verified token and never comes from a request body, query parameter, or browser-selected Firestore path.

## Routes

| Method and route | Access | Response |
| --- | --- | --- |
| `GET /health/live` | Public | Process liveness only; no dependency detail. |
| `GET /health/ready` | Public | `200 { status: "ready" }` or generic `503 { status: "not_ready" }`; dependency details stay private. |
| `GET /api/health/ready` | Owner | Checks Firebase Auth and Firestore; returns safe dependency status codes. |
| `GET /api/auth/session` | Owner | Verified UID, email, and display name for the authenticated session. |

The browser signs in and out through Firebase Auth. The API uses bearer tokens and is stateless, so it does not issue an application cookie or provide a server-side logout endpoint. Signing out clears the Firebase client session. A `401` means the token is absent, expired, invalid, revoked, or the account is disabled; `403` means the signed-in UID is not the configured owner.

## Request and error behavior

- Requests carry or receive a validated `X-Request-ID`; responses echo it.
- `Cache-Control: no-store`, Helmet security headers, a 1 MiB body limit, and a global per-IP rate limit apply.
- CORS is disabled by default for same-origin use. If enabled, `CORS_ORIGINS` accepts only exact origins; trusted proxy addresses are separately configured.
- Errors use `{ "error": { "code", "message", "requestId" } }`. Internal exception text and dependency detail are not exposed on public routes.
- Authorization headers and cookies are redacted from structured logs. Request bodies are not logged.
- The API has no report/task/run endpoints yet. Live data routes belong to Step 17; the demo app remains a separate explicit mode.

## Local setup

See [Firebase setup](./FIREBASE_SETUP.md) for owner creation, ADC, emulator settings, and live-mode startup. Backend configuration is validated at startup; copy `backend/.env.example` to the ignored `backend/.env.local` and set `FIREBASE_PROJECT_ID` and `OWNER_UID` before running the API.
