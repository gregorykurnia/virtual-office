# Investment Office report contract v3 (app-owned)

Contract version: `investment-office-report@3.0.0`, schema version `3.0`.
Implementation: [`shared/src/reportContract.ts`](../shared/src/reportContract.ts). Fixtures and tests: [`backend/src/reports/`](../backend/src/reports/). Evidence: [Step 26 verification](verification/step-26-report-contract.md).

This is the analyst's content payload. It is not the Gateway webhook envelope, and it does not replace the deployed Rex v2 runtime schema (`openclaw/templates/common/report-contract.v2.schema.json`). That v2 contract remains Step 24 evidence until a runtime template is deliberately revised.

## Who supplies what

The analyst returns one JSON object. The application attaches everything that establishes ownership or provenance.

| Set by the analyst (validated) | Set by the application (trusted, never from the model) |
| --- | --- |
| `schema_version`, `agent_role`, `task_key`, `report_type` | owner, agent, task, run and ingestion identifiers |
| Shared content fields and `details` for the report type | generation time (external execution time when verified, otherwise labelled ingestion time) |
| `sources`, `facts[].source_keys`, citation tokens `[S1]` | acquired input artifact SHA-256 and its immutable reference |
| Optional `input_artifact_sha256` echo | holdings, approved-target and contribution/cash/FX gate status |
| | digest dependency manifest and each dependency's status |

Routing identifiers in the model output are rejected by the strict schema. `agent_role` and `task_key` are consistency checks against the task bound to the run, not routing authority.

## Task mapping

| Task key | Agent (stable ID / display) | Report type |
| --- | --- | --- |
| `portfolio-weekly-health` | `portfolio` / Paz | `portfolio_health_weekly` |
| `portfolio-thesis-change` | `portfolio` / Paz | `portfolio_thesis_change` |
| `portfolio-monthly-review` | `portfolio` / Paz | `portfolio_monthly_review` |
| `portfolio-combined-digest` | `portfolio` / Paz | `combined_digest` |
| `market-morning-brief` | `market` / Rex | `market_briefing` |
| `market-weekly-outlook` | `market` / Rex | `market_weekly_outlook` |
| `market-material-alert` | `market` / Rex | `market_material_alert` |
| `research-weekly-radar` | `research` / Cody | `opportunity_radar` |
| `research-deep-dive` | `research` / Cody | `opportunity_deep_dive` |
| `research-watchlist-update` | `research` / Cody | `opportunity_watchlist_update` |
| `risk-ai-digest` | `risk` / Wolffe | `ai_digest` |
| `risk-worth-testing` | `risk` / Wolffe | `ai_worth_testing` |
| `risk-material-alert` | `risk` / Wolffe | `ai_material_alert` |

Task keys are the contract's names. Step 33 scheduled definitions must reuse them when they are created.

## Shared fields

Every report includes: title; summary; coverage start/end (UTC RFC 3339 or `null`); optional US market session date; `coverage_status` (`complete`, `limited`, `no_material_update`) with explanation; `data_freshness` (as-of instant or `null`, with explanation); changes since the previous report; personal relevance; facts with source keys; interpretation (kept separate from facts); risks and contradictions; follow-up questions; related holdings/ETFs/sectors/topics; proposed next step; sources; missing inputs; assumptions; canonical event keys; related specialist report references.

Role-specific content lives in `details`, whose shape is fixed by `report_type`. Examples: Cody's deep dive requires exactly one candidate that answers the approved questions (why the business, why now, evidence, what the market may underestimate, growth priced in, bull/base/bear, invalidation, monitoring steps, removal criteria). Wolffe's worth-testing report separates cost estimate from cost basis and lists limitations. Paz's monthly review carries four input gates.

## Validation pipeline

`validateReportOutput(raw, context)` runs in this order and never repairs output or calls a model again:

1. Bounds: UTF-8 size at most 128 KiB, then JSON parse as a single object, then nesting depth at most 8.
2. Structure: the strict discriminated Zod schema for the report type. Unknown fields, unknown report types, bad URLs, impossible dates and non-UTC instants fail here.
3. Semantics against trusted context:
   - `task_key` equals the bound task.
   - Any non-null `input_artifact_sha256` echo equals the acquired artifact hash. A null echo is allowed; provenance still comes from the run record.
   - Every citation `[S#]` in prose and every `source_keys` entry resolves to a declared source; source keys are unique.
   - `complete` needs known coverage start, end and as-of instants; coverage end is not before start.
   - Related specialist reports must be known to the owner.
   - Only trusted holdings may be marked `owned`. Missing holdings fail closed.
   - Monthly review gate statuses must match trusted state. If any portfolio input is absent, the review cannot be `complete` and cannot contain proposals.
   - A digest's included reports must equal the trusted successful dependencies. Every failed, missing or late dependency must be named in `missing_inputs`. A digest without a manifest is rejected.

Failures return `status: "quarantined"` with a reason (`payload_too_large`, `invalid_json`, `depth_exceeded`, `schema_invalid`, `semantic_invalid`), up to 50 issues with codes and paths, and a retained copy of the raw output (at most 100,000 characters, marked `truncated` when cut). Nothing is discarded silently. Persistence of the quarantine record is part of the later ingestion work.

## Limits

| Limit | Value | Notes |
| --- | --- | --- |
| UTF-8 payload | 128 KiB | Checked before parsing |
| Nesting depth | 8 | Checked before schema parsing |
| Sources | 80 | Per report |
| Facts | 60 | Each with 1–20 source keys |
| Text fields | 160–6,000 characters | Per field; Zod length is UTF-16 units, the byte cap covers UTF-8 |
| Retained raw output | 100,000 characters | For quarantined output |

These are well below Firestore's 1 MiB document limit and its nesting limit of 20. Index exemptions for large payloads are still to be configured when persistence lands.

## Markdown presentation

`renderReportMarkdown(report)` is deterministic: the same payload always renders the same Markdown. It shows the title, coverage and freshness (with `Unknown` for null instants), each section, the role-specific details as labelled bullets, and a source list with publication dates or `Unknown`. Source labels have square brackets stripped so links stay well formed. The frontend's existing safe Markdown rendering remains responsible for display-time sanitization.

## Not yet implemented

- Firestore persistence, migrations, owner-scoped readers, and API/UI rendering of v3 fields. Step 26's acceptance requires a round trip through these; that work is open.
- Attaching trusted metadata at ingestion, and the immutable input-artifact acquisition that produces the hash.
- Bookmarks, report-type/topic/ticker/importance filters, and bounded-search disclosure.
- Known-input DCA, concentration, dividend and overlap calculations. The contract only blocks unsupported proposals; it does not validate numerical claims.
- Deployment of a v3 instruction template to the OpenClaw workspace. The deployed Rex v2 contract is unchanged.
