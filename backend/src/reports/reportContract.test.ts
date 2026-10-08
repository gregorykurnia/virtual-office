import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  REPORT_PAYLOAD_LIMITS,
  REPORT_TASK_DEFINITIONS,
  renderReportMarkdown,
  validateReportOutput,
  type ReportTaskKey,
  type ReportValidationContext
} from "@investment-office/shared";

type Json = Record<string, unknown>;

const HASH = "a".repeat(64);
const OTHER_HASH = "b".repeat(64);

function readFixture(name: string): Record<string, unknown> {
  const text = readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
  return JSON.parse(text) as Record<string, unknown>;
}

function context(expectedTaskKey: ReportTaskKey, extra: Partial<ReportValidationContext> = {}): ReportValidationContext {
  return { expectedTaskKey, acquiredInputSha256: HASH, ...extra };
}

const marketBase = readFixture("market-morning-brief.valid.json");
const researchDetails = readFixture("research-deep-dive.valid.json").details;
const riskDetails = readFixture("risk-worth-testing.valid.json").details;

// Narrowing helpers for mutating fixture payloads without losing type checks elsewhere.
const at = (value: unknown): Json => value as Json;
const list = (value: unknown): Json[] => value as Json[];

function clone<T>(value: T): T {
  return structuredClone(value);
}

function expectAccepted(raw: string, ctx: ReportValidationContext) {
  const result = validateReportOutput(raw, ctx);
  assert.equal(result.status, "accepted", JSON.stringify(result, null, 2));
  return result;
}

function expectQuarantined(raw: string, ctx: ReportValidationContext, reason: string, code?: string) {
  const result = validateReportOutput(raw, ctx);
  assert.equal(result.status, "quarantined", "expected quarantine");
  if (result.status !== "quarantined") return result;
  assert.equal(result.reason, reason);
  if (code !== undefined) {
    assert.ok(
      result.issues.some((issue) => issue.code === code),
      `expected issue ${code}; got ${result.issues.map((issue) => issue.code).join(", ")}`
    );
  }
  return result;
}

describe("valid fixtures", () => {
  it("accepts the market, monthly-review, deep-dive and worth-testing fixtures", () => {
    expectAccepted(JSON.stringify(marketBase), context("market-morning-brief"));
    expectAccepted(
      JSON.stringify(readFixture("portfolio-monthly-review.limited.json")),
      context("portfolio-monthly-review")
    );
    expectAccepted(
      JSON.stringify(readFixture("research-deep-dive.valid.json")),
      context("research-deep-dive")
    );
    expectAccepted(JSON.stringify(readFixture("risk-worth-testing.valid.json")), context("risk-worth-testing"));
  });

  it("accepts the combined digest only with the matching trusted dependency manifest", () => {
    const digest = JSON.stringify(readFixture("portfolio-combined-digest.valid.json"));
    expectAccepted(
      digest,
      context("portfolio-combined-digest", {
        knownSpecialistReportRefs: ["rpt-market-1", "rpt-risk-1"],
        digestDependencies: [
          { reportRef: "rpt-market-1", role: "market", status: "included" },
          { reportRef: "rpt-risk-1", role: "risk", status: "late" }
        ]
      })
    );
  });
});

// One minimal payload per task proves that every role/task pairing can be expressed and accepted.
const MINIMAL_DETAILS: Record<string, unknown> = {
  market_briefing: {},
  market_weekly_outlook: {
    scenarios: [
      { name: "Base", description: "Fixture.", triggers: [], source_keys: [] },
      { name: "Alternative", description: "Fixture.", triggers: [], source_keys: [] }
    ],
    upcoming_events: []
  },
  market_material_alert: { event_key: "fixture.event.one", materiality_reason: "Fixture.", source_keys: ["S1"] },
  portfolio_health_weekly: { stock_reviews: [], etf_reviews: [] },
  portfolio_thesis_change: {
    ticker: "MSFT",
    ownership: "watchlist",
    event_key: "fixture.thesis.one",
    thesis_status: "weakening",
    weakening_conditions: ["Fixture."],
    invalidation_criteria: ["Fixture."],
    milestones: [],
    source_keys: ["S1"]
  },
  portfolio_monthly_review: {
    input_gates: {
      holdings: { status: "absent", as_of: null, version: null },
      approved_targets: { status: "absent", as_of: null, version: null },
      contribution: { status: "absent", as_of: null, version: null },
      cash_fx: { status: "absent", as_of: null, version: null }
    },
    proposals: [],
    dividends: []
  },
  combined_digest: { included_reports: [], section_notes: [] },
  opportunity_radar: { developments: [] },
  opportunity_deep_dive: researchDetails,
  opportunity_watchlist_update: {
    subject: "Fixture subject",
    ticker: null,
    change_type: "evidence_change",
    milestones: [],
    removal_criteria: ["Fixture."],
    source_keys: ["S1"]
  },
  ai_digest: { items: [] },
  ai_worth_testing: riskDetails,
  ai_material_alert: {
    event_key: "fixture.ai.one",
    classification: "watch",
    availability: "announced",
    implication: "Fixture.",
    source_keys: ["S1"]
  }
};

describe("every task type", () => {
  for (const [taskKey, definition] of Object.entries(REPORT_TASK_DEFINITIONS)) {
    it(`accepts a minimal ${definition.reportType} payload for ${taskKey}`, () => {
      const payload = clone(marketBase);
      payload.agent_role = definition.agentRole;
      payload.task_key = taskKey;
      payload.report_type = definition.reportType;
      payload.details = clone(MINIMAL_DETAILS[definition.reportType] as Record<string, unknown>);
      const ctx =
        definition.reportType === "combined_digest"
          ? context(taskKey as ReportTaskKey, { digestDependencies: [] })
          : context(taskKey as ReportTaskKey);
      expectAccepted(JSON.stringify(payload), ctx);
    });
  }
});

describe("trusted provenance and snapshot references", () => {
  it("accepts a matching echo of the acquired input artifact", () => {
    const payload = clone(marketBase);
    payload.input_artifact_sha256 = HASH;
    expectAccepted(JSON.stringify(payload), context("market-morning-brief"));
  });

  it("quarantines an echo that names a different artifact", () => {
    const payload = clone(marketBase);
    payload.input_artifact_sha256 = OTHER_HASH;
    expectQuarantined(JSON.stringify(payload), context("market-morning-brief"), "semantic_invalid", "input_reference_mismatch");
  });

  it("rejects model-supplied routing identifiers", () => {
    for (const field of ["owner_id", "agent_id", "run_id", "task_id", "generated_at"]) {
      const payload = clone(marketBase);
      payload[field] = "model-supplied";
      expectQuarantined(JSON.stringify(payload), context("market-morning-brief"), "schema_invalid");
    }
  });

  it("does not treat a watchlist entry as a holding", () => {
    const report = clone(marketBase);
    report.agent_role = "portfolio";
    report.task_key = "portfolio-weekly-health";
    report.report_type = "portfolio_health_weekly";
    report.details = {
      stock_reviews: [
        {
          ticker: "MSFT",
          ownership: "owned",
          thesis_status: "no_change",
          price_change_cause: "uncertain",
          price_change_explanation: "Fixture.",
          source_keys: ["S1"]
        }
      ],
      etf_reviews: []
    };
    expectQuarantined(JSON.stringify(report), context("portfolio-weekly-health"), "semantic_invalid", "owned_without_holdings");
    expectAccepted(
      JSON.stringify(report),
      context("portfolio-weekly-health", { ownedTickers: ["MSFT"] })
    );
  });
});

describe("rejection rules", () => {
  type Case = {
    name: string;
    mutate: (payload: Json) => void;
    context?: Partial<ReportValidationContext>;
    expectedTaskKey?: ReportTaskKey;
    reason: string;
    code: string;
  };

  const cases: Case[] = [
    {
      name: "unknown source citation in prose",
      mutate: (p) => (p.summary = "A citation to a missing source [S9]."),
      reason: "semantic_invalid",
      code: "citation_without_source"
    },
    {
      name: "fact referencing an undeclared source",
      mutate: (p) => (at(list(p.facts)[0]).source_keys = ["S9"]),
      reason: "semantic_invalid",
      code: "unknown_source_key"
    },
    {
      name: "task not bound to the run",
      mutate: () => undefined,
      expectedTaskKey: "market-weekly-outlook",
      reason: "semantic_invalid",
      code: "task_mismatch"
    },
    {
      name: "complete report without a known as-of instant",
      mutate: (p) => {
        p.coverage_status = "complete";
        p.coverage_start = "2026-10-05T00:00:00Z";
        p.coverage_end = "2026-10-06T00:00:00Z";
      },
      reason: "semantic_invalid",
      code: "complete_requires_dates"
    },
    {
      name: "coverage end before start",
      mutate: (p) => {
        p.coverage_start = "2026-10-06T00:00:00Z";
        p.coverage_end = "2026-10-05T00:00:00Z";
      },
      reason: "semantic_invalid",
      code: "coverage_order"
    },
    {
      name: "unknown report type",
      mutate: (p) => (p.report_type = "market_rumour"),
      reason: "schema_invalid",
      code: "schema"
    },
    {
      name: "javascript source URL",
      mutate: (p) => (at(list(p.sources)[0]).url = "javascript:alert(1)"),
      reason: "schema_invalid",
      code: "schema"
    },
    {
      name: "source URL with embedded credentials",
      mutate: (p) => (at(list(p.sources)[0]).url = "https://user:secret@example.com/source"),
      reason: "schema_invalid",
      code: "schema"
    },
    {
      name: "impossible calendar date",
      mutate: (p) => (p.market_session_date = "2026-02-30"),
      reason: "schema_invalid",
      code: "schema"
    },
    {
      name: "non-UTC coverage instant",
      mutate: (p) => (p.coverage_start = "2026-10-05T07:00:00+07:00"),
      reason: "schema_invalid",
      code: "schema"
    },
    {
      name: "unknown related specialist report",
      mutate: (p) => (p.related_specialist_reports = ["rpt-unknown"]),
      reason: "semantic_invalid",
      code: "unknown_related_report"
    },
    {
      name: "monthly review claims a supplied input without trusted input",
      mutate: (p) => {
        p.agent_role = "portfolio";
        p.task_key = "portfolio-monthly-review";
        p.report_type = "portfolio_monthly_review";
        p.details = clone(MINIMAL_DETAILS.portfolio_monthly_review as Record<string, unknown>);
        at(at(p.details).input_gates).holdings = { status: "supplied", as_of: "2026-10-01", version: "h1" };
      },
      expectedTaskKey: "portfolio-monthly-review",
      reason: "semantic_invalid",
      code: "input_gate_mismatch"
    },
    {
      name: "monthly proposal while inputs are absent",
      mutate: (p) => {
        p.agent_role = "portfolio";
        p.task_key = "portfolio-monthly-review";
        p.report_type = "portfolio_monthly_review";
        p.details = clone(MINIMAL_DETAILS.portfolio_monthly_review as Record<string, unknown>);
        at(p.details).proposals = [{ kind: "dca", description: "Fixture.", required_inputs: ["Fixture."] }];
      },
      expectedTaskKey: "portfolio-monthly-review",
      reason: "semantic_invalid",
      code: "absent_input_blocks_proposals"
    },
    {
      name: "monthly review marked complete with absent inputs",
      mutate: (p) => {
        p.agent_role = "portfolio";
        p.task_key = "portfolio-monthly-review";
        p.report_type = "portfolio_monthly_review";
        p.details = clone(MINIMAL_DETAILS.portfolio_monthly_review as Record<string, unknown>);
        p.coverage_status = "complete";
        p.coverage_start = "2026-10-01T00:00:00Z";
        p.coverage_end = "2026-10-02T00:00:00Z";
        at(p.data_freshness).as_of = "2026-10-02T00:00:00Z";
      },
      expectedTaskKey: "portfolio-monthly-review",
      reason: "semantic_invalid",
      code: "complete_with_absent_input"
    },
    {
      name: "radar with more than three developments",
      mutate: (p) => {
        p.agent_role = "research";
        p.task_key = "research-weekly-radar";
        p.report_type = "opportunity_radar";
        const development = { title: "Fixture", why_it_matters: "Fixture.", catalyst_date: null, source_keys: ["S1"] };
        p.details = { developments: [development, development, development, development] };
      },
      expectedTaskKey: "research-weekly-radar",
      reason: "schema_invalid",
      code: "schema"
    },
    {
      name: "deep dive without a candidate",
      mutate: (p) => {
        p.agent_role = "research";
        p.task_key = "research-deep-dive";
        p.report_type = "opportunity_deep_dive";
        p.details = { candidates: [] };
      },
      expectedTaskKey: "research-deep-dive",
      reason: "schema_invalid",
      code: "schema"
    },
    {
      name: "deep dive candidate missing a required answer",
      mutate: (p) => {
        p.agent_role = "research";
        p.task_key = "research-deep-dive";
        p.report_type = "opportunity_deep_dive";
        p.details = clone(researchDetails);
        delete at(list(at(p.details).candidates)[0]).growth_priced_in;
      },
      expectedTaskKey: "research-deep-dive",
      reason: "schema_invalid",
      code: "schema"
    },
    {
      name: "digest includes a report that was not successful",
      mutate: (p) => {
        p.agent_role = "portfolio";
        p.task_key = "portfolio-combined-digest";
        p.report_type = "combined_digest";
        p.details = { included_reports: [], section_notes: [] };
      },
      context: {
        digestDependencies: [{ reportRef: "rpt-market-1", role: "market", status: "included" }],
        knownSpecialistReportRefs: ["rpt-market-1"]
      },
      expectedTaskKey: "portfolio-combined-digest",
      reason: "semantic_invalid",
      code: "digest_included_mismatch"
    },
    {
      name: "late digest dependency not listed as a gap",
      mutate: (p) => {
        p.agent_role = "portfolio";
        p.task_key = "portfolio-combined-digest";
        p.report_type = "combined_digest";
        p.details = { included_reports: [], section_notes: [] };
        p.related_specialist_reports = ["rpt-risk-1"];
      },
      context: {
        digestDependencies: [{ reportRef: "rpt-risk-1", role: "risk", status: "late" }],
        knownSpecialistReportRefs: ["rpt-risk-1"]
      },
      expectedTaskKey: "portfolio-combined-digest",
      reason: "semantic_invalid",
      code: "digest_gap_not_listed"
    },
    {
      name: "digest without a trusted dependency manifest",
      mutate: (p) => {
        p.agent_role = "portfolio";
        p.task_key = "portfolio-combined-digest";
        p.report_type = "combined_digest";
        p.details = { included_reports: [], section_notes: [] };
      },
      expectedTaskKey: "portfolio-combined-digest",
      reason: "semantic_invalid",
      code: "digest_dependencies_required"
    }
  ];

  for (const testCase of cases) {
    it(`quarantines: ${testCase.name}`, () => {
      const payload = clone(marketBase);
      testCase.mutate(payload);
      const ctx = context(testCase.expectedTaskKey ?? "market-morning-brief", testCase.context);
      expectQuarantined(JSON.stringify(payload), ctx, testCase.reason, testCase.code);
    });
  }

  it("quarantines a plain-text or wrapped response as invalid JSON", () => {
    const wrapped = `Here is the report:\n${JSON.stringify(marketBase)}`;
    expectQuarantined(wrapped, context("market-morning-brief"), "invalid_json");
  });

  it("keeps a bounded copy of oversized output and flags it", () => {
    const payload = clone(marketBase);
    payload.summary = "x".repeat(REPORT_PAYLOAD_LIMITS.maxUtf8Bytes);
    const result = expectQuarantined(JSON.stringify(payload), context("market-morning-brief"), "payload_too_large");
    if (result.status !== "quarantined") return;
    assert.equal(result.retainedOutput.truncated, true);
    assert.ok(result.retainedOutput.text.length <= REPORT_PAYLOAD_LIMITS.maxRetainedRawChars);
    assert.ok(result.retainedOutput.utf8Bytes > REPORT_PAYLOAD_LIMITS.maxUtf8Bytes);
  });

  it("quarantines nesting beyond the depth limit", () => {
    let nested = "1";
    for (let depth = 0; depth < REPORT_PAYLOAD_LIMITS.maxDepth + 2; depth += 1) {
      nested = `{"a":${nested}}`;
    }
    expectQuarantined(nested, context("market-morning-brief"), "depth_exceeded");
  });
});

describe("deterministic Markdown presentation", () => {
  it("renders the same Markdown for the same payload, with sources and gaps visible", () => {
    const payload = validateReportOutput(JSON.stringify(marketBase), context("market-morning-brief"));
    assert.equal(payload.status, "accepted");
    if (payload.status !== "accepted") return;
    const first = renderReportMarkdown(payload.report);
    const second = renderReportMarkdown(payload.report);
    assert.equal(first, second);
    assert.match(first, /^# Structural fixture: market morning brief/m);
    assert.match(first, /- \*\*Data as of:\*\* Unknown/);
    assert.match(
      first,
      /^- \[S1\] \[Placeholder source for the fixture\]\(https:\/\/example\.com\/fixtures\/market-morning-brief\) — published Unknown$/m
    );
    assert.match(first, /_Sources: S1_/);
    assert.match(first, /## Missing inputs/);
  });

  it("renders every accepted task type without throwing", () => {
    for (const [taskKey, definition] of Object.entries(REPORT_TASK_DEFINITIONS)) {
      const payload = clone(marketBase);
      payload.agent_role = definition.agentRole;
      payload.task_key = taskKey;
      payload.report_type = definition.reportType;
      payload.details = clone(MINIMAL_DETAILS[definition.reportType] as Record<string, unknown>);
      const ctx =
        definition.reportType === "combined_digest"
          ? context(taskKey as ReportTaskKey, { digestDependencies: [] })
          : context(taskKey as ReportTaskKey);
      const result = validateReportOutput(JSON.stringify(payload), ctx);
      assert.equal(result.status, "accepted");
      if (result.status === "accepted") {
        assert.match(renderReportMarkdown(result.report), /## Sources/);
      }
    }
  });
});
