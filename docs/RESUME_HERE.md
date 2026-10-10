# Resume here: open gaps in Steps 14–26 and how to continue

Last updated: 10 October 2026

> **Resume rule.** Development is paused at the open items in this file. When every open item in sections 1–4 is closed, or the owner has explicitly deferred it, tell the owner:
>
> **"Continue development from Step 27 of the Investment Office Technical Implementation Guide."**
>
> Then continue from Step 27 under that guide. Section 5 lists the first Step 27 carry-over items.

The guide, [`Investment Office Technical Implementation Guide.md`](../Investment%20Office%20Technical%20Implementation%20Guide.md), is the source of truth for the steps. This file lists what is still open inside Steps 14–26, even where the guide marks a step done.

## Rules that stay in force

- Do not deploy to the real Firebase project, change Oracle resources, change the OpenClaw runtime, reboot the server, or start any paid action without the owner's explicit approval for that specific action. Approval for one action does not cover the next.
- Keep secrets, service-account keys, and passwords out of the repository and out of `VITE_` variables.
- Commit and push finished task files only (`AGENTS.md`). Do not commit the uncommitted Maul batch unless the owner asks.
- Maul is on hold and Cody is the research identity ([decision log](./DECISIONS.md)). Do not delete the Maul design files.

---

## 1. Steps 14–19: private backend, database, and live screens

**Done:** API routes for agents, reports, runs, and connection status; owner sign-in check; Firestore schema, deny-all browser rules, indexes; manual-run queue code; live screens. Owner-isolation test passes 7 of 7 on the test copy (`npm run test:emulator`). Browser sign-in checked on the test copy.

**Open:**
- [ ] **1.1 Real Firebase project check.** Confirm the project `virtual-office-77c1d` and its database exist and are the intended ones. Set the private app address. Needs decision D3. (Step 14, C1 item 1)
- [ ] **1.2 Server access to Firebase.** Set up the Oracle server's Firebase access with least permissions, and record how it is renewed, revoked, and recovered. Needs D1. Without it, the API's sign-in check cannot run against the real project. (Step 14, C1 item 2)
- [ ] **1.3 Test-copy checks not yet written.** Migrations can be repeated safely; duplicate records are rejected; security rules block browser access. Test copy only, no live changes. (C1 item 3)
- [ ] **1.4 Rules and indexes on the real project.** Review, then deploy. Needs approval. (Step 15, C1 item 4)
- [ ] **1.5 Migration on the real project.** Review, then run. The only migration in the code today is version 1, which writes a schema marker and an empty owner profile. Needs approval. (Step 15, C1 item 4)
- [ ] **1.6 Migration rollback notes.** Record how to recover if the migration goes wrong. Needs D2. (C1 item 6)
- [ ] **1.7 Signed-in check on the real project.** The owner signs in, and the app shows honest empty states with no demo data. Needs approval and 1.2. (Steps 14 and 19, C1 item 5)

*Not part of these steps:* holdings, watchlist, task-editing, and conversation routes are not built. They belong to Steps 30, 37, and 38.

## 2. Steps 20–22: Oracle server and OpenClaw

**Done:** host identity, account isolation, storage, time, and firewall checks. Root login disabled. `rpcbind` disabled (10 Oct). Memory job disabled (10 Oct). Volume-only restore test done and cleaned up (10 Oct). The scheduler is off, and all five jobs are disabled (checked 10 Oct). OpenClaw `2026.9.8` is installed and running in scope.

**Open:**
- [ ] **2.1 Second internet address on the login list.** Still unexplained. The owner asked to leave it unchanged for now. Needs D8. (Step 20)
- [ ] **2.2 Recovery route.** The remote console is not set up, and the recovery choice is not recorded. Needs D9. (Step 20)
- [ ] **2.3 Restart to the newer system software (kernel `7.0.0-1012-oracle`).** Deferred by the owner. Needs the remote console, a fresh backup, and the owner's go-ahead. Needs D9. (Step 20)
- [ ] **2.4 Completion-message secret check.** Untested. This is part of Step 27, not a blocker for resuming.

*Keep in force:* the scheduler stays off. After any restart, check that the memory job is still disabled.

## 3. Steps 23–24: connector and Rex

- [ ] **3.1 App-side record of Rex's connection.** Rex's connection exists only in `openclaw/deployments/market.json`. The app database has no matching record, and no code creates one. Needs approval, since it writes to the real project. (Step 24; the guide's mapping distinction)
- [ ] **3.2 Integration record for the connector.** Without it, every "Run now" is refused with an "integration unavailable" error (503). That is the safe current state. Do not change it before Step 28. (Steps 18, 23)

## 4. Steps 18 and 25–26: research tools, run inputs, and report format

**Step 25 (research tools):**
- [ ] **4.1 Monthly spending cap approved and recorded.** Real market searches stay blocked until then. Needs D4. (Step 25, Step 36)
- [ ] **4.2 Source-quality and calculation rules accepted.** Only the fetch test is done. Each workflow needs its required data, sources, dates, currency, and missing-data behavior. (Step 25; audit A9)
- [ ] **4.3 Baseline run limits applied and verified.** Spend, concurrency, timeouts, and queue size. (Step 36)
- [ ] **4.4 Fixed input for every run.** Each run must read a dated input file recorded by hash, and dispatch must be bound to it. Needs D10 for the check. (Step 25 item 5; guide C2 input prerequisite)

**Step 26 (report format):**
- [ ] **4.5 Save v3 reports in the database.** The v3 format is checked in code and has passing tests, but nothing saves it. The saved shape is still the older one. Needs a migration, so it needs approval on the real project. (Step 26 extension; audit A6)
- [ ] **4.6 Provenance attached at ingestion.** Owner, agent, task, run, and source links must come from the system, never from the model's output. (Step 26)
- [ ] **4.7 Report input reference checked against the acquired input.** Needs D10. (Step 26)
- [ ] **4.8 Size limits and retention.** Keep each report's total size below Firestore's 1 MiB document limit. Keep retention separate for raw events, reports, and input snapshots. Needs D7. (Step 26; audit A12)
- [ ] **4.9 Read path and screens.** The API and report screen must show coverage, changes since the last report, related items, source links, and provenance.
- [ ] **4.10 Bookmarks and filters.** Owner bookmark state, and filters by type, topic, ticker, and importance. (Step 26 extension)
- [ ] **4.11 Round trip for all four roles.** Test fixtures exist for all four roles. Each must pass validation, saving, the API, and the screen.

## 5. Carried into Step 27 (the first work after resuming)

The guide places these after the receiver. They are listed here so they are not lost.

- [ ] **5.1 Receiver and completion-message secret check.** A private listener that accepts completion messages only with the correct secret, and stores each message before confirming it. (Step 27; needs approval for OpenClaw configuration changes)
- [ ] **5.2 Completion destination and readback.** The connector confirms where completions are sent. (Step 27, 23)
- [ ] **5.3 Connector additions.** Job list and scheduler status; creating a disabled smoke job (currently cron-only; the one-time option is not supported); loading job mappings from the app database; using the run status and history methods that exist in code but are not called. (Steps 23, 28, 34, 35)
- [ ] **5.4 One worker, supervised once.** Nothing starts the dispatch worker today, and the server does not supply it a connector. Place it per D11. Also decide how unclear submissions are checked against the assistant's history before anything is sent again. (Steps 18, 28, 35)

---

## 6. Decisions only the owner can make

| # | Decision | Recommendation | Needed for |
|---|---|---|---|
| D1 | How the server gets Firebase access, with its permissions, rotation, and recovery | A dedicated Firebase service account with only the Firestore and Auth roles the app needs. Key file kept root-only on the server, outside the repository, with a written rotation procedure. | 1.2, then 1.4–1.7 |
| D2 | Firestore backup plan and billing | The audit says managed backups need the paid "Blaze" plan. Current pricing is not checked. If you accept the cost, use managed backups. If not, choose an approved export method. | 1.6, Step 45 |
| D3 | Private app address and secure connection | Tailscale or similar, so only your own devices can reach it | 1.1, deployment |
| D4 | Monthly spending cap and provider limits | A starting cap you can raise later, plus provider alerts | 4.1, 4.3 |
| D5 | Paid market-data feed | No, not yet. Use official sources until a required workflow cannot be met that way. | 4.2 |
| D6 | Keep or change the proposed schedules | Keep the defaults, and change them after measuring | Phase D (Step 33) |
| D7 | Retention periods | Start with the guide's proposed 14 days for raw events and logs. Keep reports. Keep chats until you delete them. | 4.8 |
| D8 | Second internet address on the login list | Tell us if you recognize it. If not, remove it only after the recovery route is confirmed working. | 2.1 |
| D9 | Remote recovery console and restart timing | Set up the remote console and take a fresh backup before any restart. Restart in a quiet window with the scheduler still off. | 2.2, 2.3 |
| D10 | How a report's input reference is checked | Record the input file's ID and hash when the run is dispatched. Reject any report whose reference does not match. | 4.4, 4.7 |
| D11 | Where the dispatch worker runs | Inside the API service as one supervised process. Never two supervisors. | 5.4 |
| D12 | Captain Rex guide move (see section 8) | Confirm whether the move is intended | Housekeeping |

## 7. Approvals needed when we act

Ask first, every time:
- Any deploy, migration, or write to the real Firebase project
- Any Oracle write: new volumes, security-list changes, remote console, backups, or restart
- Any change to OpenClaw's configuration or jobs, including the secret for completion messages and the local-address exception in Step 27
- Anything that could start paid research
- Deleting anything, including Maul files

## 8. Next steps, in order

1. **Update the records** to match this file: the guide's status table, the progress log, the decision log, and the connector notes (guide §12.1, item 1). The progress log has uncommitted Maul text, so it needs the owner's OK first. No live changes.
2. **Write the test-copy checks** for the Firebase gate (1.3). No live changes.
3. **Decide D1–D3**, then do the real Firebase steps 1.1, 1.2, and 1.4–1.7. Approve each one separately.
4. **Decide D4–D5**, then do Step 25 acceptance and baseline limits (4.1–4.4).
5. **Step 26 storage, reading, and screens** (4.5–4.11), with D7 and D10. The migration needs approval.
6. **Close the Oracle items** (2.1–2.3) with D8 and D9.
7. **Close Rex's record** (3.1) and the connector record (3.2).
8. **Resume at Step 27** using the resume rule at the top of this file.

## 9. Already done (do not redo)

- Steps 1–13: demo, accepted (Step 13 handoff)
- Owner-isolation test, 7 of 7 on the test copy (commit `929318b`)
- Browser sign-in check on the test copy (commit `1c520c6`)
- Maul hold recorded in the decision log (commit `b544dcc`)
- Oracle server: `rpcbind` disabled, memory job disabled, volume-only restore test done and cleaned up (commit `d057235`)
- OpenClaw: scheduler off, all five jobs disabled (10 Oct 2026)
- Step 21 installed and accepted in scope; Step 24 Rex permissions accepted; Step 25 research tool access configured
- Step 26 format rules written; 59 backend tests pass
- Checks passing on 10 Oct 2026: typecheck, lint, build, backend tests

## 10. Test commands

Use Node 26, not the shell default Node 20.

- Node 26 bin folder: `/Users/gregorykurnia/.nvm/versions/node/v26.10.0/bin`
- Java for the Firestore test copy: `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`
- Project checks, from the repository root: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`
- Start the test copy from the repository root: `firebase emulators:start --only auth,firestore --project virtual-office-local`. The Firebase CLI is installed under Node 20 at `/Users/gregorykurnia/.nvm/versions/node/v20.20.2/bin/firebase`. The emulators are in-memory, so restarting them erases the test owner.
- Owner-isolation test, from `backend/`: `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run test:emulator`
- `npm test` does not include the emulator test.
- Test accounts use generated passwords. Never reuse them outside the test copy.

## 11. Working copy and housekeeping

- The Maul design files are kept. Their status lines say on hold. Do not delete them.
- Uncommitted: the Maul section of `docs/PROGRESS.md` (stale; needs the owner's OK to change), the Maul plan's on-hold banner, and a Captain Rex guide that was moved. The old path is deleted and a new untracked copy sits in `design-concepts/`. The owner decides this (D12).
- `docs/PROGRESS.md` "Last updated" and "Current limits" are out of date. Guide line 47 still describes the Maul conflict as open.
- The owner-isolation test is not part of `npm test`.
