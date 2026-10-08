# Step 26 verification — report output contract

Date: 8 October 2026. Scope: the app-owned v3 contract, validation pipeline, deterministic Markdown presentation, fixtures and automated tests. No live OpenClaw call, Firestore write, migration, deployment or model call was made.

Contract reference: [`docs/REPORT_CONTRACT.md`](../REPORT_CONTRACT.md).

## What was built

- `shared/src/reportContract.ts`: the v3 Zod discriminated schema for 13 task types across the four stable roles, trusted-context types, the `validateReportOutput` pipeline, `checkReportSemantics`, and `renderReportMarkdown`.
- `shared/src/index.ts`: exports the module.
- `backend/src/reports/fixtures/`: four valid structural fixtures (market briefing, limited monthly review with absent inputs, opportunity deep dive, AI worth-testing) and one valid combined digest with a late dependency. Fixtures use `example.com` placeholder sources and state no market facts, prices or numbers.
- `backend/src/reports/reportContract.test.ts`: 59 `node:test` cases, added to the backend `test` script.

## Decisions recorded in the contract

1. **Generalized v3, not an edit of the deployed v2.** The Rex v2 runtime schema is Step 24 evidence and stays unchanged until a template is deliberately revised.
2. **Trusted provenance is attached by the application.** Owner, agent, task, run, generation and ingestion identifiers are not accepted from the model. The strict schema rejects them.
3. **Snapshot reference rule.** The acquired input artifact hash is authoritative. The model may echo it; a non-null echo must match or the output is quarantined. A null echo is allowed, and provenance comes from the run record.
4. **Fail-closed portfolio context.** Missing holdings mean no owned tickers. Missing input gates mean all inputs are absent. A monthly review then cannot be complete or include proposals.
5. **No repair call.** Malformed or invalid output is quarantined with a bounded copy of the raw text. No second model call and no deterministic extraction were added, because no observed output required them.
6. **Digest dependencies are trusted.** Included reports must equal the successful dependencies from the manifest, and every failed, missing or late dependency must be named in `missing_inputs`.
7. **Task names.** `market-*` keys are retained from v2. The other task keys are proposed names; Step 33 definitions must reuse them.

## Commands and results

| Command | Result |
| --- | --- |
| `npm run build --workspace @investment-office/shared` | Passed |
| `npm run typecheck --workspace @investment-office/backend` | Passed |
| `npm run lint --workspace @investment-office/shared` | Passed |
| `npm run lint --workspace @investment-office/backend` | Passed |
| `npm test --workspace @investment-office/backend` | 59 tests, 59 pass, 0 fail (baseline before Step 26: 15 pass) |

Test coverage:

- The three valid fixtures and the digest fixture are accepted with their matching trusted context.
- Each of the 13 task types accepts a minimal payload, and each one renders Markdown.
- Matching input echoes are accepted; mismatched echoes are quarantined.
- Model-supplied routing identifiers are rejected.
- A watchlist ticker marked `owned` is rejected without trusted holdings and accepted with them.
- Twenty table-driven rejection cases: unknown citations and source keys, task mismatch, incomplete `complete` reports, reversed coverage, unknown report type, unsafe or credential-bearing URLs, impossible dates, non-UTC instants, unknown related reports, input-gate mismatch, proposals with absent inputs, complete monthly reviews with absent inputs, radar over three developments, deep dives without a candidate or with a missing required answer, and digest manifest violations.
- Invalid JSON, oversized output (with truncation flagged), and excessive nesting are each quarantined with the correct reason.
- Rendering is deterministic, and it shows sources with publication dates or `Unknown`.

## Limits of this evidence

- The validator checks shape and consistency. It does not verify facts or numbers; the schema says so and the Markdown does not imply otherwise.
- The fixtures are structural. They are not evidence of any research claim.
- Persistence, Firestore migrations, owner-scoped readers, API and UI rendering of v3 fields, bookmarks, filters, and ingestion-time provenance attachment are **not** implemented. Step 26's extension acceptance (round trip through validation, persistence, API and UI) therefore remains open.
- The deployed OpenClaw instruction templates and the Rex v2 runtime contract were not changed or deployed.
- No live model output was validated; the test inputs are hand-written fixtures.

## Next gate

Implement the v3 storage migration and readers, then run the four-role round trip through validation, persistence, API and UI. Ingestion-time provenance attachment and immutable input-artifact acquisition (Step C2 prerequisite) are required before any live v3 report is ingested.
