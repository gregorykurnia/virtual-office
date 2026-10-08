# Application data model

> Requirements update — 8 October 2026: [Four-agent workflow specification](./FOUR_AGENT_WORKFLOW_SPEC.md) is authoritative for the revised roles, investor context, watchlists, reporting, coordination, editable WIB schedules, UI controls, and acceptance checks. Conflicting historical defaults below are superseded. Preserve Rex (`market`), Paz (`portfolio`), Cody (`research`), and Wolffe (`risk`) and their stable artwork keys. Paz, Cody, and Wolffe are approved cosmetic replacements for prior display identities; linked responsibilities and records remain unchanged. This update records requirements; it does not claim implementation or live connectivity.

The live application uses Cloud Firestore because the workspace's recorded implementation decision selected Firebase. This model translates the guide's proposed relational entities into owner-scoped Firestore documents; it does not introduce a second database.

## Paths

```text
system/schema                                      schema version and timestamps
schemaVersions/0001                                applied migration record
owners/{authUid}                                   owner profile and schema version
owners/{authUid}/agents/{agentId}
owners/{authUid}/tasks/{taskId}
owners/{authUid}/runs/{runId}
owners/{authUid}/reports/{reportId}
owners/{authUid}/reportSources/{sourceId}
owners/{authUid}/reportReads/{reportId}
owners/{authUid}/holdings/{holdingId}
owners/{authUid}/watchlist/{watchlistId}
owners/{authUid}/inputSnapshots/{snapshotId}
owners/{authUid}/runInputs/{runId}
owners/{authUid}/conversations/{conversationId}
owners/{authUid}/conversations/{conversationId}/messages/{messageId}
owners/{authUid}/preferences/current
owners/{authUid}/runRequests/{requestId}
owners/{authUid}/taskMutations/{mutationId}
owners/{authUid}/notificationOutbox/{outboxId}
owners/{authUid}/auditEvents/{eventId}
owners/{authUid}/_unique/{sha256ConstraintKey}
integrationInstances/{integrationId}
integrationInstances/{integrationId}/events/{eventId}
workItems/{workItemId}                            ownerUid, work kind, lease and terminal state
externalRunKeys/{sha256IntegrationAndExternalRunId}
```

All timestamps are Firestore `Timestamp` values in UTC. HTTP contracts serialize them as ISO 8601 strings. Financial quantities and weights are canonical decimal strings in Firestore/API contracts so IEEE-754 rounding cannot alter them; calculations must use a decimal library or integer minor units appropriate to the instrument.

## Document contracts

`shared/src/database.ts` contains the runtime Zod contracts for every document type, including integration instances. It bounds strings and payloads, validates stable role/status values, requires dated holdings, keeps source dates distinct, and rejects holdings with neither a quantity nor a weight. Task display/input metadata (`name`, `purpose`, `inputs`, and `missingInputs`) is optional and additive; older task documents remain readable, and absent metadata is shown as unconfigured rather than inferred. The owner profile ID is the Firebase Auth UID; owner IDs are not accepted from request bodies.

| Entity | Location | Key invariants |
| --- | --- | --- |
| Profile | `owners/{uid}` | One profile per Auth UID; enabled state and schema version are explicit. |
| Agent | `agents/{roleKey}` | Stable role key is the document ID; external agent ID is scoped to the integration. |
| Task | `tasks/{taskId}` | Stable definition key, prompt version, schedule/timezone, observed next run, and config version are saved together. |
| Run | `runs/{runId}` | Execution, delivery, and report processing states remain separate; external identity includes integration ID. |
| Report | `reports/{reportId}` | One canonical report per successful run initially; generated and data-as-of dates remain distinct. |
| Report source/read | `reportSources/{sourceId}`, `reportReads/{reportId}` | A source keeps published/retrieved/as-of dates distinct; a read document ID makes owner/report read state unique. |
| Holding/watchlist | `holdings/{id}`, `watchlist/{id}` | Numeric inputs use decimal strings with currency and as-of date; no demo positions are seeded. |
| Input snapshot/run input | `inputSnapshots/{id}`, `runInputs/{runId}` | Snapshots are immutable and content-hashed; the run ID path permits one primary input snapshot per run. |
| Conversation/message | `conversations/{id}/messages/{id}` | Stable external session and context version are recorded; message generation state is explicit. |
| Integration event | `integrationInstances/{id}/events/{id}` | Raw JSON is bounded and retained separately; event processing state/times are explicit. |
| Work item | `workItems/{id}` | Owner UID, work kind, availability, attempt count, and lease owner/expiry support durable processing. |
| Run request | `runRequests/{id}` | Idempotency key/request hash, local run, and dispatch state are persisted together. |
| Task mutation | `taskMutations/{id}` | Desired patch, expected config version, external result/readback, and reconciliation state are preserved. |
| Notification outbox | `notificationOutbox/{id}` | Deduplication key, destination, availability, attempts, and delivery state are explicit. |
| Preferences/audit | `preferences/current`, `auditEvents/{id}` | Preferences are a single document; audit metadata excludes secrets and full research transcripts. |

## Constraint strategy

Firestore does not provide SQL foreign keys or composite unique constraints. This single-owner design makes the ownership boundary structural: data references are built under `owners/{verifiedUid}`, and server request bodies never select that UID. The Admin SDK bypasses Firestore Rules, so runtime repositories take a branded `VerifiedOwnerContext` created after token verification and the UID allowlist check; path helpers do not accept a raw UID or caller-supplied Firestore path.

`createOwnerDocumentWithUniqueClaims()` reserves deterministic SHA-256 claim documents in the same Firestore transaction as the target write. It requires an existing enabled owner profile and can load declared parent records from that owner's subtree in the same transaction. Use it for `(owner, roleKey)`, `(owner, task definition key)`, `(owner, idempotency key)`, and other logical unique keys. Pass canonical values (case normalization is field-specific) and use a global claim incorporating the integration ID for external run IDs. Deterministic document IDs implement one report per run, one read state per report, and one primary input snapshot per run. Parent records must be loaded from the same owner's subtree before a child write. These checks are transactional application invariants rather than SQL constraints.

Manual run creation uses a deterministic request document ID derived from the idempotency key and a matching owner-scoped unique claim. In the same transaction it checks the owner/task/analyst, reads bounded holdings and watchlist queries, creates a content-hashed input snapshot and `runInputs/{runId}`, creates the queued run and global work item, and reserves `_unique/{sha256("activeTaskRun:" + taskId)}`. This task lock also covers runs whose external outcome is unknown. Release it only in a transaction that proves the same run reached a terminal state. The worker receives a system owner context from validated server configuration; it never accepts a UID from work-item payload as authority.

The dispatch worker claims queued work and changes the request to `dispatching` transactionally, then calls the adapter outside the transaction. It does not retry an expired dispatch lease: it records `unknown` on the request/run and leaves the task lock reserved for reconciliation. Only safe pre-submission connection checks retry, with a three-attempt bound. The real OpenClaw receipt/history reconciliation contract remains part of the later integration discovery step.

The shared Zod schemas validate document data at every repository boundary. `database/firestore.rules` denies all direct web-client Firestore reads/writes; the browser authenticates with Firebase Auth and sends a bearer ID token to the private API. The Admin SDK uses Application Default Credentials or the host's workload identity and bypasses Rules. Keep its identity server-side and grant only the Firebase Auth verification and Firestore access the API needs.

The initial migration (`backend/src/database/migrations.ts`) is versioned and idempotent. It creates only the schema marker, migration marker, and empty owner profile. It does not seed demo records, holdings, agent IDs, tasks, or reports. Firestore composite indexes and large-field index exemptions are in `database/firestore.indexes.json`.

## Verification and limits

- `npm run db:migrate` applies the migration to the Firebase project configured in `backend/.env.local`; inspect that file and the ADC identity before running it.
- `firebase.json` points the Firebase CLI at the deny-all client rules and index definitions. Deploy those only after reviewing the selected project.
- The workspace has one allowlisted owner. The document layout and contracts should be redesigned before enabling multi-tenant access or granting any browser Firestore access.
- Firestore is schemaless, so introducing a new version requires a numbered migration and compatible readers/writers. Do not edit an already-applied migration; add the next version.
