# C1 Firebase emulator verification

Date: 9 October 2026

Scope: local Auth and Firestore emulators only (project `virtual-office-local`), the private API on `127.0.0.1:3001`, and the Vite dev server in live mode. No real Firebase project, deployed Rules or indexes, migration, OCI resource, or OpenClaw runtime was touched.

## Owner-isolation test (`npm run test:emulator`)

| Case | Result |
| --- | --- |
| Anonymous and malformed tokens are rejected with 401 before any owner data is read | Pass |
| A valid non-owner account gets 403 on every private route and no owner or other-owner data | Pass |
| The allowlisted owner's session identity is returned | Pass |
| The owner's report list contains the owner's report and never the other owner's report | Pass |
| The other owner's report, run, and agent data return 404 or are absent from owner responses | Pass |
| The owner's own report detail is returned | Pass |
| An ID token is rejected after the owner's refresh tokens are revoked | Pass |

The test seeds one agent, task, run, and report under each of two random emulator accounts, asserts that the other owner's sentinel record exists, and removes both accounts and their documents afterwards. Passwords are generated per run. Result: 7 of 7 pass. `npm test` remains 59 of 59.

## Live-mode browser sign-in (headless Chromium, emulator only)

The browser was limited to localhost. No request left the machine, so the emulator wiring held and no traffic reached the real Firebase project.

| Scenario | Viewport | API responses | Observed |
| --- | --- | --- | --- |
| Emulator owner signs in | 1440 px | `/api/auth/session`, `/api/connection`, `/api/agents`, `/api/reports` all 200 | Live workspace with the empty-database state; no horizontal overflow |
| Emulator owner signs in | 390 px | Same as above, all 200 | Live workspace renders; header controls wrap to a second row; no horizontal overflow |
| Valid non-owner account signs in | 1440 px | `/api/auth/session` 403 | "This account is not on the owner allowlist" message; no owner data |
| Owner email with a wrong password | 1440 px | None (rejected by the Auth emulator) | "Sign-in failed" message |

Screenshots were reviewed at 1440 and 390 px. The phone header wrap is cosmetic and was left unchanged.

## Not verified

- Sign-in against the real `virtual-office-77c1d` project.
- Server Admin credentials for the real project (ADC or workload identity).
- Deployed Firestore Rules and indexes, and the reviewed migration.
- Authenticated inspection of the real project's empty app.
