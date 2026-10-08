import { z } from "zod";

// App-owned analyst report contract, version 3.0. It generalizes the deployed
// Rex-only OpenClaw v2 schema (openclaw/templates/common/report-contract.v2.schema.json),
// which remains the runtime evidence for Step 24. The analyst returns only content.
// Owner, agent, task, run, input-acquisition and ingestion metadata are trusted
// values supplied by the application through ReportValidationContext.

export const REPORT_CONTRACT_VERSION = "investment-office-report@3.0.0";
export const REPORT_SCHEMA_VERSION = "3.0";

export const REPORT_PAYLOAD_LIMITS = {
  maxUtf8Bytes: 128 * 1024,
  maxDepth: 8,
  maxRetainedRawChars: 100_000,
  maxIssues: 50
} as const;

export const REPORT_TASK_DEFINITIONS = {
  "portfolio-weekly-health": { agentRole: "portfolio", reportType: "portfolio_health_weekly" },
  "portfolio-thesis-change": { agentRole: "portfolio", reportType: "portfolio_thesis_change" },
  "portfolio-monthly-review": { agentRole: "portfolio", reportType: "portfolio_monthly_review" },
  "portfolio-combined-digest": { agentRole: "portfolio", reportType: "combined_digest" },
  "market-morning-brief": { agentRole: "market", reportType: "market_briefing" },
  "market-weekly-outlook": { agentRole: "market", reportType: "market_weekly_outlook" },
  "market-material-alert": { agentRole: "market", reportType: "market_material_alert" },
  "research-weekly-radar": { agentRole: "research", reportType: "opportunity_radar" },
  "research-deep-dive": { agentRole: "research", reportType: "opportunity_deep_dive" },
  "research-watchlist-update": { agentRole: "research", reportType: "opportunity_watchlist_update" },
  "risk-ai-digest": { agentRole: "risk", reportType: "ai_digest" },
  "risk-worth-testing": { agentRole: "risk", reportType: "ai_worth_testing" },
  "risk-material-alert": { agentRole: "risk", reportType: "ai_material_alert" }
} as const;

export type ReportTaskKey = keyof typeof REPORT_TASK_DEFINITIONS;
export type ReportType = (typeof REPORT_TASK_DEFINITIONS)[ReportTaskKey]["reportType"];
export type PortfolioInputName = "holdings" | "approved_targets" | "contribution" | "cash_fx";
export type InputGateStatus = "supplied" | "absent";
export type DigestDependencyStatus = "included" | "failed" | "missing" | "late";

// Trusted, ingestion-side context. Anything the model writes that contradicts this is rejected.
export type ReportValidationContext = {
  expectedTaskKey: ReportTaskKey;
  // SHA-256 of the immutable run input artifact that was acquired and bound to this run.
  acquiredInputSha256: string;
  // Tickers from trusted, owner-approved holdings. Undefined means no holdings were supplied.
  ownedTickers?: readonly string[];
  // Trusted portfolio input gates. Undefined means every gate is absent (fail closed).
  inputGates?: Record<PortfolioInputName, InputGateStatus>;
  // Trusted dependency manifest for combined_digest assembly.
  digestDependencies?: readonly { reportRef: string; role: string; status: DigestDependencyStatus }[];
  // Specialist report references that exist for this owner and may be cited as related.
  knownSpecialistReportRefs?: readonly string[];
};

export type ReportIssue = {
  code: string;
  path: string;
  message: string;
};

export type ReportQuarantineReason =
  | "payload_too_large"
  | "invalid_json"
  | "depth_exceeded"
  | "schema_invalid"
  | "semantic_invalid";

export type ReportValidationResult =
  | { status: "accepted"; report: ReportPayload; warnings: ReportIssue[] }
  | {
      status: "quarantined";
      reason: ReportQuarantineReason;
      issues: ReportIssue[];
      retainedOutput: { text: string; truncated: boolean; utf8Bytes: number };
    };

const SourceKeyPattern = /^S[1-9][0-9]{0,2}$/;
const CitationPattern = /\[(S[1-9][0-9]{0,2})\]/g;
const TickerPattern = /^[A-Z][A-Z0-9.-]{0,9}$/;
const EventKeyPattern = /^[a-z0-9][a-z0-9._:-]{2,127}$/;
const ReportRefPattern = /^[A-Za-z0-9_-]{1,128}$/;
const Sha256Pattern = /^[a-f0-9]{64}$/;

function isRealCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function hasNoDuplicates(items: readonly string[]): boolean {
  return new Set(items).size === items.length;
}

const BoundedText = (max: number) =>
  z.string().min(1).max(max).refine((value) => value.trim().length > 0, "Must not be blank.");

const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must use YYYY-MM-DD.")
  .refine(isRealCalendarDate, "Must be a real calendar date.");

// UTC RFC 3339 instant with a trailing Z, as required for known coverage instants.
const UtcDateTime = z.string().datetime().max(40);

const PublicationDate = z.union([IsoDate, UtcDateTime]).nullable();

const SourceKey = z.string().regex(SourceKeyPattern, "Source keys use S1, S2, … S999.");
const SourceKeyList = (min: number, max: number) =>
  z
    .array(SourceKey)
    .min(min)
    .max(max)
    .refine(hasNoDuplicates, "Source keys must be unique within a list.");

const Ticker = z.string().regex(TickerPattern, "Use an uppercase ticker symbol.");
const EventKey = z.string().regex(EventKeyPattern, "Use a lowercase canonical event key.");
const ReportRef = z.string().regex(ReportRefPattern, "Invalid specialist report reference.");

const TextList = (itemMax: number, max: number, min = 0) =>
  z
    .array(BoundedText(itemMax))
    .min(min)
    .max(max);

const UniqueTickerList = (max: number) =>
  z.array(Ticker).max(max).refine(hasNoDuplicates, "Tickers must be unique.");

const SourceUrl = z
  .string()
  .min(1)
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return (url.protocol === "https:" || url.protocol === "http:") && url.username === "" && url.password === "";
    } catch {
      return false;
    }
  }, "Source URLs must be absolute HTTP(S) URLs without embedded credentials.");

const Gate = z.strictObject({
  status: z.enum(["supplied", "absent"]),
  as_of: IsoDate.nullable(),
  version: BoundedText(120).nullable()
});

const Candidate = z.strictObject({
  subject_type: z.enum(["company", "sector", "subsector", "etf"]),
  subject: BoundedText(200),
  ticker: Ticker.nullable(),
  why_business: BoundedText(1500),
  why_now: BoundedText(1500),
  source_keys: SourceKeyList(1, 20),
  market_may_underestimate: BoundedText(1500),
  growth_priced_in: BoundedText(1500),
  scenarios: z.strictObject({
    bull: BoundedText(1500),
    base: BoundedText(1500),
    bear: BoundedText(1500)
  }),
  thesis_invalidation: TextList(1000, 10, 1),
  next_monitoring_steps: TextList(1000, 10, 1),
  catalysts: z
    .array(z.strictObject({ description: BoundedText(500), expected_window: BoundedText(200) }))
    .max(10),
  valuation_note: BoundedText(1500),
  etf_alternatives: UniqueTickerList(5),
  removal_criteria: TextList(1000, 10, 1)
});

const ClassificationValues = ["use_now", "watch", "investment_implication"] as const;
const AvailabilityValues = ["announced", "general_availability", "limited_beta", "unknown"] as const;

const CommonShape = {
  schema_version: z.literal(REPORT_SCHEMA_VERSION),
  title: BoundedText(240),
  summary: BoundedText(3000),
  coverage_start: UtcDateTime.nullable(),
  coverage_end: UtcDateTime.nullable(),
  market_session_date: IsoDate.nullable(),
  coverage_status: z.enum(["complete", "limited", "no_material_update"]),
  coverage_explanation: BoundedText(2000),
  data_freshness: z.strictObject({
    as_of: UtcDateTime.nullable(),
    explanation: BoundedText(2000)
  }),
  changes_since_previous: z
    .array(
      z.strictObject({
        topic: BoundedText(160),
        change: BoundedText(1000),
        prior_finding_ref: z.string().min(1).max(160).nullable()
      })
    )
    .max(20),
  personal_relevance: BoundedText(3000),
  facts: z
    .array(
      z.strictObject({
        statement: BoundedText(2000),
        source_keys: SourceKeyList(1, 20)
      })
    )
    .max(60),
  interpretation: BoundedText(6000),
  risks_uncertainties: TextList(1500, 40),
  contradictions: z
    .array(
      z.strictObject({
        topic: BoundedText(160),
        accounts: TextList(1500, 6, 2),
        resolution_status: z.enum(["unresolved", "partially_resolved", "resolved_with_evidence"])
      })
    )
    .max(20),
  follow_up_questions: TextList(1000, 20),
  related: z.strictObject({
    holdings: UniqueTickerList(40),
    etfs: UniqueTickerList(40),
    sectors: z.array(BoundedText(200)).max(40).refine(hasNoDuplicates, "Entries must be unique."),
    topics: z.array(BoundedText(200)).max(40).refine(hasNoDuplicates, "Entries must be unique.")
  }),
  proposed_next_step: BoundedText(2000),
  sources: z
    .array(
      z.strictObject({
        key: SourceKey,
        label: BoundedText(400),
        url: SourceUrl,
        published_at: PublicationDate,
        retrieved_at: UtcDateTime.nullable()
      })
    )
    .max(80),
  missing_inputs: TextList(1000, 40),
  assumptions: TextList(1000, 40),
  canonical_event_refs: z.array(EventKey).max(20).refine(hasNoDuplicates, "Event keys must be unique."),
  related_specialist_reports: z
    .array(ReportRef)
    .max(20)
    .refine(hasNoDuplicates, "Report references must be unique."),
  // Optional echo of the acquired input artifact. Null means the model did not echo it;
  // provenance still comes from the trusted run record. A non-null echo must match.
  input_artifact_sha256: z.string().regex(Sha256Pattern).nullable()
};

const MarketBriefingDetails = z.strictObject({});

const MarketWeeklyOutlookDetails = z.strictObject({
  scenarios: z
    .array(
      z.strictObject({
        name: BoundedText(160),
        description: BoundedText(1500),
        triggers: TextList(500, 5),
        source_keys: SourceKeyList(0, 20)
      })
    )
    .min(2)
    .max(4),
  upcoming_events: z
    .array(z.strictObject({ date: IsoDate, event: BoundedText(300) }))
    .max(20)
});

const MarketMaterialAlertDetails = z.strictObject({
  event_key: EventKey,
  materiality_reason: BoundedText(1500),
  source_keys: SourceKeyList(1, 20)
});

const PortfolioHealthDetails = z.strictObject({
  stock_reviews: z
    .array(
      z.strictObject({
        ticker: Ticker,
        ownership: z.enum(["owned", "watchlist"]),
        thesis_status: z.enum(["intact", "weakening", "invalidated", "no_change"]),
        price_change_cause: z.enum(["business", "valuation", "uncertain"]),
        price_change_explanation: BoundedText(1500),
        source_keys: SourceKeyList(1, 20)
      })
    )
    .max(13),
  etf_reviews: z
    .array(
      z.strictObject({
        ticker: Ticker,
        distribution_note: BoundedText(1000),
        fee_note: BoundedText(1000),
        exposure_change_note: BoundedText(1000),
        source_keys: SourceKeyList(1, 20)
      })
    )
    .max(4)
});

const PortfolioThesisChangeDetails = z.strictObject({
  ticker: Ticker,
  ownership: z.enum(["owned", "watchlist"]),
  event_key: EventKey,
  thesis_status: z.enum(["intact", "weakening", "invalidated"]),
  weakening_conditions: TextList(1000, 20, 1),
  invalidation_criteria: TextList(1000, 20, 1),
  milestones: TextList(1000, 20),
  source_keys: SourceKeyList(1, 20)
});

const PortfolioMonthlyReviewDetails = z.strictObject({
  input_gates: z.strictObject({
    holdings: Gate,
    approved_targets: Gate,
    contribution: Gate,
    cash_fx: Gate
  }),
  proposals: z
    .array(
      z.strictObject({
        kind: z.enum(["dca", "rebalance", "dividend_reinvestment"]),
        description: BoundedText(1500),
        required_inputs: TextList(200, 10, 1)
      })
    )
    .max(10),
  dividends: z
    .array(
      z.strictObject({
        ticker: Ticker,
        ex_date: IsoDate.nullable(),
        payment_date: IsoDate.nullable(),
        amount_status: z.enum(["estimated", "confirmed_by_brokerage", "unknown"]),
        amount_text: BoundedText(300).nullable(),
        source_keys: SourceKeyList(0, 20)
      })
    )
    .max(40)
});

const DigestDetails = z.strictObject({
  included_reports: z
    .array(ReportRef)
    .max(20)
    .refine(hasNoDuplicates, "Included report references must be unique."),
  section_notes: z
    .array(z.strictObject({ role: z.enum(["portfolio", "market", "research", "risk"]), note: BoundedText(500) }))
    .max(8)
});

const OpportunityRadarDetails = z.strictObject({
  developments: z
    .array(
      z.strictObject({
        title: BoundedText(200),
        why_it_matters: BoundedText(1500),
        catalyst_date: IsoDate.nullable(),
        source_keys: SourceKeyList(1, 20)
      })
    )
    .max(3)
});

const OpportunityDeepDiveDetails = z.strictObject({
  candidates: z.array(Candidate).length(1)
});

const OpportunityWatchlistUpdateDetails = z.strictObject({
  subject: BoundedText(200),
  ticker: Ticker.nullable(),
  change_type: z.enum(["added", "removed", "criteria_changed", "milestone_update", "evidence_change"]),
  milestones: TextList(1000, 10),
  removal_criteria: TextList(1000, 10, 1),
  source_keys: SourceKeyList(1, 20)
});

const AiDigestDetails = z.strictObject({
  items: z
    .array(
      z.strictObject({
        title: BoundedText(200),
        classification: z.enum(ClassificationValues),
        availability: z.enum(AvailabilityValues),
        implication: BoundedText(1000),
        source_keys: SourceKeyList(1, 20)
      })
    )
    .max(10)
});

const AiWorthTestingDetails = z.strictObject({
  use_case: BoundedText(1000),
  applies_to: z
    .array(z.enum(["DEUS", "development", "solo_software"]))
    .min(1)
    .refine(hasNoDuplicates, "Entries must be unique."),
  availability: z.enum(AvailabilityValues),
  expected_benefit: BoundedText(1500),
  cost_estimate: BoundedText(1000),
  cost_basis: BoundedText(1000),
  limitations: TextList(1000, 10, 1),
  source_keys: SourceKeyList(1, 20)
});

const AiMaterialAlertDetails = z.strictObject({
  event_key: EventKey,
  classification: z.enum(ClassificationValues),
  availability: z.enum(AvailabilityValues),
  implication: BoundedText(1500),
  source_keys: SourceKeyList(1, 20)
});

function reportBranch<R extends string, T extends string, A extends string, D extends z.ZodType>(
  reportType: R,
  taskKey: T,
  agentRole: A,
  details: D
) {
  return z.strictObject({
    ...CommonShape,
    report_type: z.literal(reportType),
    task_key: z.literal(taskKey),
    agent_role: z.literal(agentRole),
    details
  });
}

export const ReportPayloadSchema = z.discriminatedUnion("report_type", [
  reportBranch("market_briefing", "market-morning-brief", "market", MarketBriefingDetails),
  reportBranch("market_weekly_outlook", "market-weekly-outlook", "market", MarketWeeklyOutlookDetails),
  reportBranch("market_material_alert", "market-material-alert", "market", MarketMaterialAlertDetails),
  reportBranch("portfolio_health_weekly", "portfolio-weekly-health", "portfolio", PortfolioHealthDetails),
  reportBranch("portfolio_thesis_change", "portfolio-thesis-change", "portfolio", PortfolioThesisChangeDetails),
  reportBranch("portfolio_monthly_review", "portfolio-monthly-review", "portfolio", PortfolioMonthlyReviewDetails),
  reportBranch("combined_digest", "portfolio-combined-digest", "portfolio", DigestDetails),
  reportBranch("opportunity_radar", "research-weekly-radar", "research", OpportunityRadarDetails),
  reportBranch("opportunity_deep_dive", "research-deep-dive", "research", OpportunityDeepDiveDetails),
  reportBranch(
    "opportunity_watchlist_update",
    "research-watchlist-update",
    "research",
    OpportunityWatchlistUpdateDetails
  ),
  reportBranch("ai_digest", "risk-ai-digest", "risk", AiDigestDetails),
  reportBranch("ai_worth_testing", "risk-worth-testing", "risk", AiWorthTestingDetails),
  reportBranch("ai_material_alert", "risk-material-alert", "risk", AiMaterialAlertDetails)
]);

export type ReportPayload = z.infer<typeof ReportPayloadSchema>;

type Visitor = {
  text: (value: string, path: string) => void;
  sourceKeys: (keys: readonly string[], path: string) => void;
};

// Walks prose and references. Source metadata is skipped because URLs and labels are not citations.
function walkReport(value: unknown, path: string, visitor: Visitor): void {
  if (typeof value === "string") {
    visitor.text(value, path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkReport(item, `${path}[${index}]`, visitor));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (path === "" && key === "sources") continue;
      const childPath = path === "" ? key : `${path}.${key}`;
      if (key === "source_keys" && Array.isArray(child)) {
        visitor.sourceKeys(child.map(String), childPath);
        continue;
      }
      walkReport(child, childPath, visitor);
    }
  }
}

function singleLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

// Checks rules that depend on other fields or on trusted ingestion context. The parsed payload must already be valid.
export function checkReportSemantics(payload: ReportPayload, context: ReportValidationContext): ReportIssue[] {
  const issues: ReportIssue[] = [];
  const add = (code: string, path: string, message: string) => issues.push({ code, path, message });

  if (payload.task_key !== context.expectedTaskKey) {
    add("task_mismatch", "task_key", "The report task does not match the task bound to this run.");
  }

  // Snapshot rule: the acquired artifact hash is authoritative. The model echo is only a consistency check.
  if (payload.input_artifact_sha256 !== null && payload.input_artifact_sha256 !== context.acquiredInputSha256) {
    add(
      "input_reference_mismatch",
      "input_artifact_sha256",
      "The reported input artifact does not match the artifact acquired for this run."
    );
  }

  const declaredKeys = payload.sources.map((source) => source.key);
  if (!hasNoDuplicates(declaredKeys)) {
    add("duplicate_source_key", "sources", "Each source key must be declared once.");
  }
  const declared = new Set(declaredKeys);

  walkReport(payload, "", {
    text: (value, path) => {
      for (const match of value.matchAll(CitationPattern)) {
        const key = match[1];
        if (key !== undefined && !declared.has(key)) {
          add("citation_without_source", path, `Citation ${key} has no declared source.`);
        }
      }
    },
    sourceKeys: (keys, path) => {
      for (const key of keys) {
        if (!declared.has(key)) add("unknown_source_key", path, `Source key ${key} is not declared.`);
      }
    }
  });

  const { coverage_start: start, coverage_end: end, coverage_status: status, data_freshness: freshness } = payload;
  if (start !== null && end !== null && Date.parse(end) < Date.parse(start)) {
    add("coverage_order", "coverage_end", "coverage_end must not be earlier than coverage_start.");
  }
  if (status === "complete" && (start === null || end === null || freshness.as_of === null)) {
    add(
      "complete_requires_dates",
      "coverage_status",
      "A complete report needs known coverage start, end and data as-of instants."
    );
  }

  const related = payload.related_specialist_reports;
  if (related.length > 0) {
    const known = new Set(context.knownSpecialistReportRefs ?? []);
    for (const ref of related) {
      if (!known.has(ref)) add("unknown_related_report", "related_specialist_reports", `Report ${ref} is not known.`);
    }
  }

  const ownedTickers = new Set(context.ownedTickers ?? []);
  if (payload.report_type === "portfolio_health_weekly") {
    for (const review of payload.details.stock_reviews) {
      if (review.ownership === "owned" && !ownedTickers.has(review.ticker)) {
        add("owned_without_holdings", `details.stock_reviews.${review.ticker}`, "Only trusted holdings may be marked owned.");
      }
    }
  }
  if (payload.report_type === "portfolio_thesis_change" && payload.details.ownership === "owned") {
    if (!ownedTickers.has(payload.details.ticker)) {
      add("owned_without_holdings", "details.ownership", "Only trusted holdings may be marked owned.");
    }
  }

  if (payload.report_type === "portfolio_monthly_review") {
    const trusted = context.inputGates ?? {
      holdings: "absent",
      approved_targets: "absent",
      contribution: "absent",
      cash_fx: "absent"
    };
    const reported = payload.details.input_gates;
    const names: PortfolioInputName[] = ["holdings", "approved_targets", "contribution", "cash_fx"];
    for (const name of names) {
      if (reported[name].status !== trusted[name]) {
        add("input_gate_mismatch", `details.input_gates.${name}`, `The ${name} input status does not match trusted state.`);
      }
    }
    const anyAbsent = names.some((name) => trusted[name] === "absent");
    if (anyAbsent && payload.details.proposals.length > 0) {
      add(
        "absent_input_blocks_proposals",
        "details.proposals",
        "Allocation, DCA or dividend proposals require every portfolio input to be supplied."
      );
    }
    if (anyAbsent && status === "complete") {
      add("complete_with_absent_input", "coverage_status", "A monthly review with missing inputs cannot be complete.");
    }
  }

  if (payload.report_type === "combined_digest") {
    const dependencies = context.digestDependencies;
    if (dependencies === undefined) {
      add("digest_dependencies_required", "details", "A digest needs the trusted dependency manifest.");
    } else {
      const included = dependencies.filter((item) => item.status === "included").map((item) => item.reportRef);
      const reportedIncluded = [...payload.details.included_reports].sort();
      if (reportedIncluded.join("\n") !== [...included].sort().join("\n")) {
        add(
          "digest_included_mismatch",
          "details.included_reports",
          "Included reports must match the trusted successful dependencies."
        );
      }
      const missingText = payload.missing_inputs.join("\n");
      for (const item of dependencies) {
        if (item.status !== "included" && !missingText.includes(item.reportRef)) {
          add(
            "digest_gap_not_listed",
            "missing_inputs",
            `Report ${item.reportRef} is ${item.status} and must be listed in missing_inputs.`
          );
        }
      }
    }
  }

  return issues;
}

function jsonDepthExceeds(value: unknown, maxDepth: number, depth = 1): boolean {
  if (depth > maxDepth) return true;
  if (value === null || typeof value !== "object") return false;
  const children = Array.isArray(value) ? value : Object.values(value);
  return children.some((child) => jsonDepthExceeds(child, maxDepth, depth + 1));
}

function toIssues(error: z.ZodError): ReportIssue[] {
  return error.issues.slice(0, REPORT_PAYLOAD_LIMITS.maxIssues).map((issue) => ({
    code: "schema",
    path: issue.path.map(String).join("."),
    message: issue.message
  }));
}

// Validates one raw model output. It never repairs or re-asks the model. Failures keep bounded raw text.
export function validateReportOutput(rawOutput: string, context: ReportValidationContext): ReportValidationResult {
  const utf8Bytes = new TextEncoder().encode(rawOutput).byteLength;
  const retained = (): { text: string; truncated: boolean; utf8Bytes: number } => {
    const text = rawOutput.slice(0, REPORT_PAYLOAD_LIMITS.maxRetainedRawChars);
    return { text, truncated: text.length < rawOutput.length, utf8Bytes };
  };
  const quarantine = (reason: ReportQuarantineReason, issues: ReportIssue[]): ReportValidationResult => ({
    status: "quarantined",
    reason,
    issues: issues.slice(0, REPORT_PAYLOAD_LIMITS.maxIssues),
    retainedOutput: retained()
  });

  if (utf8Bytes > REPORT_PAYLOAD_LIMITS.maxUtf8Bytes) {
    return quarantine("payload_too_large", [
      { code: "payload_too_large", path: "", message: `Output exceeds ${REPORT_PAYLOAD_LIMITS.maxUtf8Bytes} UTF-8 bytes.` }
    ]);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawOutput);
  } catch {
    return quarantine("invalid_json", [{ code: "invalid_json", path: "", message: "Output is not a single JSON object." }]);
  }

  if (jsonDepthExceeds(parsed, REPORT_PAYLOAD_LIMITS.maxDepth)) {
    return quarantine("depth_exceeded", [
      { code: "depth_exceeded", path: "", message: `Nesting exceeds ${REPORT_PAYLOAD_LIMITS.maxDepth} levels.` }
    ]);
  }

  const result = ReportPayloadSchema.safeParse(parsed);
  if (!result.success) {
    return quarantine("schema_invalid", toIssues(result.error));
  }

  const semanticIssues = checkReportSemantics(result.data, context);
  if (semanticIssues.length > 0) {
    return quarantine("semantic_invalid", semanticIssues);
  }

  return { status: "accepted", report: result.data, warnings: [] };
}

// Deterministic presentation: the same payload always produces the same Markdown.
export function renderReportMarkdown(report: ReportPayload): string {
  const lines: string[] = [];
  const push = (...items: string[]) => lines.push(...items);
  const instant = (value: string | null) => value ?? "Unknown";

  push(`# ${singleLine(report.title)}`, "");
  push(`- **Report type:** ${report.report_type}`);
  push(`- **Coverage status:** ${report.coverage_status}`);
  push(`- **Coverage:** ${instant(report.coverage_start)} to ${instant(report.coverage_end)}`);
  push(`- **Market session:** ${report.market_session_date ?? "Not applicable or unknown"}`);
  push(`- **Data as of:** ${instant(report.data_freshness.as_of)}`);
  push("", "## Summary", "", report.summary);
  push("", "## Coverage and freshness", "", report.coverage_explanation, "", report.data_freshness.explanation);

  if (report.changes_since_previous.length > 0) {
    push("", "## Changes since previous report");
    for (const change of report.changes_since_previous) {
      const prior = change.prior_finding_ref ? ` (prior: ${change.prior_finding_ref})` : "";
      push(`- **${change.topic}:** ${change.change}${prior}`);
    }
  }

  push("", "## Personal relevance", "", report.personal_relevance);

  if (report.facts.length > 0) {
    push("", "## Facts");
    for (const fact of report.facts) {
      push(`- ${fact.statement} _Sources: ${fact.source_keys.join(", ")}_`);
    }
  }

  push("", "## Interpretation", "", report.interpretation);
  const detailLines = renderDetails(report.details);
  if (detailLines.length > 0) {
    push("", "## Details");
    push(...detailLines);
  }

  if (report.risks_uncertainties.length > 0) {
    push("", "## Risks and uncertainties");
    push(...report.risks_uncertainties.map((item) => `- ${item}`));
  }

  if (report.contradictions.length > 0) {
    push("", "## Contradictions");
    for (const item of report.contradictions) {
      push(`- **${item.topic}** (${item.resolution_status})`);
      push(...item.accounts.map((account) => `  - ${account}`));
    }
  }

  if (report.follow_up_questions.length > 0) {
    push("", "## Follow-up questions");
    push(...report.follow_up_questions.map((item) => `- ${item}`));
  }

  push("", "## Proposed next step", "", report.proposed_next_step);

  const related = report.related;
  const relatedLines = [
    ["Holdings", related.holdings],
    ["ETFs", related.etfs],
    ["Sectors", related.sectors],
    ["Topics", related.topics]
  ] as const;
  if (relatedLines.some(([, values]) => values.length > 0)) {
    push("", "## Related");
    for (const [label, values] of relatedLines) {
      if (values.length > 0) push(`- **${label}:** ${values.join(", ")}`);
    }
  }

  if (report.missing_inputs.length > 0) {
    push("", "## Missing inputs");
    push(...report.missing_inputs.map((item) => `- ${item}`));
  }
  if (report.assumptions.length > 0) {
    push("", "## Assumptions");
    push(...report.assumptions.map((item) => `- ${item}`));
  }

  push("", "## Sources");
  if (report.sources.length === 0) {
    push("- No sources were supplied.");
  }
  for (const source of report.sources) {
    const label = singleLine(source.label).replace(/[[\]]/g, "");
    const published = source.published_at ?? "Unknown";
    push(`- [${source.key}] [${label}](${source.url}) — published ${published}`);
  }

  if (report.canonical_event_refs.length > 0 || report.related_specialist_reports.length > 0) {
    push("", "## References");
    if (report.canonical_event_refs.length > 0) {
      push(`- **Canonical events:** ${report.canonical_event_refs.join(", ")}`);
    }
    if (report.related_specialist_reports.length > 0) {
      push(`- **Related specialist reports:** ${report.related_specialist_reports.join(", ")}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function humanLabel(key: string): string {
  const spaced = key.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function renderDetails(value: unknown, indent = ""): string[] {
  if (value === null || typeof value !== "object") {
    return [`${indent}- ${value === null ? "Not stated" : String(value)}`];
  }
  const lines: string[] = [];
  for (const [key, child] of Object.entries(value)) {
    const label = humanLabel(key);
    if (Array.isArray(child)) {
      if (child.length === 0) {
        lines.push(`${indent}- **${label}:** none`);
        continue;
      }
      lines.push(`${indent}- **${label}:**`);
      child.forEach((item, index) => {
        if (item !== null && typeof item === "object") {
          lines.push(`${indent}  - ${label} ${index + 1}`);
          lines.push(...renderDetails(item, `${indent}    `));
        } else {
          lines.push(`${indent}  - ${String(item)}`);
        }
      });
    } else if (child !== null && typeof child === "object") {
      lines.push(`${indent}- **${label}:**`);
      lines.push(...renderDetails(child, `${indent}  `));
    } else {
      lines.push(`${indent}- **${label}:** ${child === null ? "Not stated" : String(child)}`);
    }
  }
  return lines;
}
