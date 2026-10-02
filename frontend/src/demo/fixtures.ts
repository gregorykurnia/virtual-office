import {
  AgentSchema,
  AppPreferencesSchema,
  ReportSchema,
  RunSchema,
  TaskSchema,
  type Agent,
  type AppPreferences,
  type Report,
  type Run,
  type Task
} from "@investment-office/shared";
import type { DemoScenario } from "./scenarios";

export const DEMO_FIXTURE_VERSION = 1;
export const DEMO_CLOCK_START = "2026-10-02T01:30:00.000Z";
export const DEMO_STORAGE_KEY = "investment-office:demo:v1";

export type DemoSnapshot = {
  scenario: DemoScenario;
  clockAt: string;
  nextRunNumber: number;
  agents: Agent[];
  tasks: Task[];
  reports: Report[];
  runs: Run[];
  idempotencyKeys: Record<string, string>;
  preferences: AppPreferences;
};

function buildSource(id: string, label: string, timestamp: string) {
  return {
    id,
    label: `Illustrative reference — ${label}. No external source substantiates this fictional finding.`,
    url: null,
    publishedAt: timestamp,
    retrievedAt: timestamp,
    illustrative: true
  };
}

function buildReport(input: {
  id: string;
  agentId: Report["agentId"];
  taskId: string;
  runId: string;
  title: string;
  generatedAt: string;
  dataAsOf: string;
  summary: string;
  findings: string[];
  interpretation: string;
  uncertainties: string[];
  missingInputs: string[];
  sourceLabel: string;
  elapsedSeconds: number;
  readAt: string | null;
  sampleSymbols?: Array<{ symbol: string; label: string; illustrative: true }>;
}): Report {
  const { sampleSymbols = [], ...reportFields } = input;
  return ReportSchema.parse({
    ...reportFields,
    sources: [buildSource(`${input.id}-source-1`, input.sourceLabel, input.dataAsOf)],
    metadata: {
      timezone: "Asia/Jakarta",
      elapsedSeconds: input.elapsedSeconds,
      sampleSymbols
    },
    processingStatus: "processed",
    mode: "demo"
  });
}

const agents: Agent[] = [
  AgentSchema.parse({
    id: "market",
    role: "market",
    displayName: "Maya",
    title: "Market Analyst",
    responsibility: "Broad market developments and economic events",
    avatarKey: "market-bot",
    deskKey: "market-terminal",
    status: "working",
    statusLabel: "Working · simulated",
    currentTaskId: "task-market-opening-scan",
    observedAt: "2026-10-02T01:20:00.000Z"
  }),
  AgentSchema.parse({
    id: "portfolio",
    role: "portfolio",
    displayName: "Adrian",
    title: "Portfolio Analyst",
    responsibility: "Material developments affecting sample holdings and watchlist",
    avatarKey: "portfolio-bot",
    deskKey: "portfolio-ledger",
    status: "idle",
    statusLabel: "Idle · simulated",
    currentTaskId: "task-portfolio-check",
    observedAt: "2026-10-02T01:18:00.000Z"
  }),
  AgentSchema.parse({
    id: "research",
    role: "research",
    displayName: "Clara",
    title: "Investment Research Analyst",
    responsibility: "Company and fund research with explicit assumptions",
    avatarKey: "research-bot",
    deskKey: "research-library",
    status: "waiting",
    statusLabel: "Waiting · simulated",
    currentTaskId: "task-research-thesis",
    observedAt: "2026-10-02T01:16:00.000Z"
  }),
  AgentSchema.parse({
    id: "risk",
    role: "risk",
    displayName: "Theo",
    title: "Risk Analyst",
    responsibility: "Challenge assumptions and identify exposure or data gaps",
    avatarKey: "risk-bot",
    deskKey: "risk-console",
    status: "idle",
    statusLabel: "Idle · simulated",
    currentTaskId: "task-risk-review",
    observedAt: "2026-10-02T01:14:00.000Z"
  })
];

const tasks: Task[] = [
  TaskSchema.parse({
    id: "task-market-opening-scan",
    agentId: "market",
    name: "Opening market scan",
    purpose: "Summarize fictional overnight market and macro signals for the demo.",
    enabled: true,
    scheduleLabel: "Weekdays · 08:15 WIB",
    timezone: "Asia/Jakarta",
    nextRunAt: "2026-10-05T01:15:00.000Z"
  }),
  TaskSchema.parse({
    id: "task-portfolio-check",
    agentId: "portfolio",
    name: "Sample portfolio developments",
    purpose: "Review only the fictional sample symbols included with this fixture.",
    enabled: true,
    scheduleLabel: "Weekdays · 08:30 WIB",
    timezone: "Asia/Jakarta",
    nextRunAt: "2026-10-05T01:30:00.000Z"
  }),
  TaskSchema.parse({
    id: "task-research-thesis",
    agentId: "research",
    name: "Illustrative research brief",
    purpose: "Show a research structure with assumptions and unknowns clearly stated.",
    enabled: true,
    scheduleLabel: "Weekly · Monday 09:00 WIB",
    timezone: "Asia/Jakarta",
    nextRunAt: "2026-10-05T02:00:00.000Z"
  }),
  TaskSchema.parse({
    id: "task-risk-review",
    agentId: "risk",
    name: "Sample exposure challenge",
    purpose: "Demonstrate risk review using fictional sample symbols only.",
    enabled: true,
    scheduleLabel: "Weekdays · 09:15 WIB",
    timezone: "Asia/Jakarta",
    nextRunAt: "2026-10-05T02:15:00.000Z"
  })
];

const reports: Report[] = [
  buildReport({
    id: "report-market-opening-scan",
    agentId: "market",
    taskId: "task-market-opening-scan",
    runId: "demo-run-001",
    title: "Asia market opening scan",
    generatedAt: "2026-10-02T01:15:00.000Z",
    dataAsOf: "2026-10-02T00:45:00.000Z",
    summary: "An illustrative premarket note groups a fictional rates move, currency shift, and calendar item into a short watchlist.",
    findings: [
      "The invented regional equity basket is shown 0.4% higher in the sample snapshot.",
      "A fictional long-end yield move is the largest cross-asset change in this example.",
      "The sample calendar contains one event flagged for later review."
    ],
    interpretation: "The example illustrates how a report can separate observations from a watchpoint. It does not describe real market conditions or support an investment decision.",
    uncertainties: ["All values are fabricated and no live feed was queried."],
    missingInputs: ["No current prices, official releases, or source documents were supplied."],
    sourceLabel: "fictional overnight macro snapshot",
    elapsedSeconds: 42,
    readAt: null
  }),
  buildReport({
    id: "report-market-week-ahead",
    agentId: "market",
    taskId: "task-market-opening-scan",
    runId: "demo-run-002",
    title: "Week-ahead event watchlist",
    generatedAt: "2026-09-30T02:10:00.000Z",
    dataAsOf: "2026-09-30T01:45:00.000Z",
    summary: "A fictional weekly calendar demonstrates how event dates, possible sensitivities, and unknowns can sit together.",
    findings: [
      "Two invented policy events are listed for the sample week.",
      "The example highlights a hypothetical currency sensitivity and one energy-price watchpoint."
    ],
    interpretation: "The calendar is a layout example only. No event date or market sensitivity in this record has been checked against a real calendar.",
    uncertainties: ["The fictional events have no verified time, consensus estimate, or outcome."],
    missingInputs: ["No current economic calendar or source publication was provided."],
    sourceLabel: "made-up weekly event calendar",
    elapsedSeconds: 37,
    readAt: "2026-10-01T03:00:00.000Z"
  }),
  buildReport({
    id: "report-portfolio-developments",
    agentId: "portfolio",
    taskId: "task-portfolio-check",
    runId: "demo-run-003",
    title: "Sample portfolio developments",
    generatedAt: "2026-10-02T00:55:00.000Z",
    dataAsOf: "2026-10-02T00:30:00.000Z",
    summary: "This report uses clearly fictional sample symbols to demonstrate a dated portfolio-impact summary.",
    findings: [
      "DEMO-ALFA is labelled as a fictional software company in the sample inputs.",
      "DEMO-BETA is labelled as a fictional consumer company; no price return is attached."
    ],
    interpretation: "The example shows how an analyst could separate a company event from portfolio impact. The symbols and company descriptions are invented and are not real listed securities.",
    uncertainties: ["No position size, valuation, or verified corporate event is available."],
    missingInputs: ["No owner holdings, current watchlist, prices, or company filings were supplied."],
    sourceLabel: "fictional sample-company notes",
    elapsedSeconds: 51,
    readAt: "2026-10-02T01:05:00.000Z",
    sampleSymbols: [
      { symbol: "DEMO-ALFA", label: "Fictional software company", illustrative: true },
      { symbol: "DEMO-BETA", label: "Fictional consumer company", illustrative: true }
    ]
  }),
  buildReport({
    id: "report-portfolio-concentration",
    agentId: "portfolio",
    taskId: "task-portfolio-check",
    runId: "demo-run-004",
    title: "Illustrative allocation observations",
    generatedAt: "2026-09-29T01:20:00.000Z",
    dataAsOf: "2026-09-29T01:00:00.000Z",
    summary: "A mock allocation table demonstrates how concentration questions can be framed without claiming to know a real portfolio.",
    findings: [
      "A fictional sample assigns equal 20% weights to five invented buckets.",
      "The example marks overlapping exposure as unknown instead of estimating it."
    ],
    interpretation: "The equal-weight example is only a fixture for report layout. It does not represent the owner's assets or provide a risk calculation.",
    uncertainties: ["Underlying security exposure and correlations are intentionally unavailable."],
    missingInputs: ["No dated positions, fund holdings, cash balance, or target allocation were supplied."],
    sourceLabel: "invented allocation worksheet",
    elapsedSeconds: 46,
    readAt: "2026-09-29T04:15:00.000Z",
    sampleSymbols: [
      { symbol: "DEMO-ALFA", label: "Fictional sample symbol", illustrative: true },
      { symbol: "DEMO-BETA", label: "Fictional sample symbol", illustrative: true }
    ]
  }),
  buildReport({
    id: "report-research-thesis",
    agentId: "research",
    taskId: "task-research-thesis",
    runId: "demo-run-005",
    title: "Research memo structure: DEMO-GAMMA",
    generatedAt: "2026-10-01T03:05:00.000Z",
    dataAsOf: "2026-10-01T02:30:00.000Z",
    summary: "A fictional company memo demonstrates the distinction between a business question, an interpretation, and the evidence still needed.",
    findings: [
      "DEMO-GAMMA is explicitly an invented company used for this fixture.",
      "The example lists recurring revenue and customer concentration as diligence topics, not verified company facts.",
      "No valuation estimate is included."
    ],
    interpretation: "This is a writing-pattern example only. No claim about a real issuer, business, or security is made.",
    uncertainties: ["The fictional company has no accounts, customers, products, or market price."],
    missingInputs: ["No audited statements, management commentary, competitive data, or valuation assumptions were supplied."],
    sourceLabel: "fictional research prompt",
    elapsedSeconds: 84,
    readAt: null,
    sampleSymbols: [{ symbol: "DEMO-GAMMA", label: "Fictional company", illustrative: true }]
  }),
  buildReport({
    id: "report-research-fund-questions",
    agentId: "research",
    taskId: "task-research-thesis",
    runId: "demo-run-006",
    title: "Fund review questions",
    generatedAt: "2026-09-27T02:35:00.000Z",
    dataAsOf: "2026-09-27T02:00:00.000Z",
    summary: "A sample checklist shows the kinds of fund facts a deeper review would require before comparing alternatives.",
    findings: [
      "The fictional checklist covers mandate, fees, tracking method, liquidity, and holdings date.",
      "No specific real fund or benchmark is named."
    ],
    interpretation: "The record demonstrates a research template. It does not compare products or establish that any fund meets a particular objective.",
    uncertainties: ["No product documents, current holdings, or investor constraints are available."],
    missingInputs: ["No fund identifier, benchmark, fee schedule, domicile, or time horizon was supplied."],
    sourceLabel: "invented fund-review checklist",
    elapsedSeconds: 65,
    readAt: "2026-09-28T02:30:00.000Z"
  }),
  buildReport({
    id: "report-risk-exposure-review",
    agentId: "risk",
    taskId: "task-risk-review",
    runId: "demo-run-007",
    title: "Sample exposure challenge",
    generatedAt: "2026-10-02T00:40:00.000Z",
    dataAsOf: "2026-10-02T00:15:00.000Z",
    summary: "The risk example asks what is needed before concentration can be measured for a fictional two-symbol sample.",
    findings: [
      "DEMO-ALFA and DEMO-BETA are fictional labels, not exchange-listed securities.",
      "The fixture intentionally leaves weights blank and reports concentration as not calculated."
    ],
    interpretation: "A risk review must not infer position sizes. This record demonstrates a missing-input warning rather than a portfolio conclusion.",
    uncertainties: ["No position size, issuer exposure, or fund look-through data is present."],
    missingInputs: ["A dated holdings snapshot and verified instrument identifiers are required for a real concentration review."],
    sourceLabel: "fictional holdings-input stub",
    elapsedSeconds: 32,
    readAt: null,
    sampleSymbols: [
      { symbol: "DEMO-ALFA", label: "Fictional sample symbol", illustrative: true },
      { symbol: "DEMO-BETA", label: "Fictional sample symbol", illustrative: true }
    ]
  }),
  buildReport({
    id: "report-risk-data-quality",
    agentId: "risk",
    taskId: "task-risk-review",
    runId: "demo-run-008",
    title: "Input freshness and data gaps",
    generatedAt: "2026-09-28T03:25:00.000Z",
    dataAsOf: "2026-09-28T03:00:00.000Z",
    summary: "A fictional review demonstrates how to flag missing as-of dates before calculating portfolio exposure.",
    findings: [
      "The example contains one undated fictional price and one symbol with no weight.",
      "No derived exposure value is displayed because required inputs are incomplete."
    ],
    interpretation: "Freshness and completeness should be visible before downstream calculations. This example contains no real financial data.",
    uncertainties: ["The dates and data gaps are fabricated for demonstrating the interface."],
    missingInputs: ["No verified prices, currency, quantities, weights, or source timestamps were supplied."],
    sourceLabel: "made-up input-quality worksheet",
    elapsedSeconds: 29,
    readAt: "2026-09-29T03:05:00.000Z"
  })
];

const runs: Run[] = [
  RunSchema.parse({
    id: "demo-run-001", taskId: "task-market-opening-scan", agentId: "market", idempotencyKey: null,
    executionStatus: "succeeded", deliveryStatus: "delivered", reportProcessingStatus: "processed",
    queuedAt: "2026-10-02T01:10:00.000Z", startedAt: "2026-10-02T01:10:05.000Z", finishedAt: "2026-10-02T01:15:00.000Z",
    reportId: "report-market-opening-scan", reason: null, errorSummary: null, mode: "demo"
  }),
  RunSchema.parse({
    id: "demo-run-002", taskId: "task-market-opening-scan", agentId: "market", idempotencyKey: null,
    executionStatus: "succeeded", deliveryStatus: "delivered", reportProcessingStatus: "processed",
    queuedAt: "2026-09-30T02:05:00.000Z", startedAt: "2026-09-30T02:05:05.000Z", finishedAt: "2026-09-30T02:10:00.000Z",
    reportId: "report-market-week-ahead", reason: null, errorSummary: null, mode: "demo"
  }),
  RunSchema.parse({
    id: "demo-run-003", taskId: "task-portfolio-check", agentId: "portfolio", idempotencyKey: null,
    executionStatus: "succeeded", deliveryStatus: "delivered", reportProcessingStatus: "processed",
    queuedAt: "2026-10-02T00:50:00.000Z", startedAt: "2026-10-02T00:50:05.000Z", finishedAt: "2026-10-02T00:55:00.000Z",
    reportId: "report-portfolio-developments", reason: null, errorSummary: null, mode: "demo"
  }),
  RunSchema.parse({
    id: "demo-run-004", taskId: "task-portfolio-check", agentId: "portfolio", idempotencyKey: null,
    executionStatus: "succeeded", deliveryStatus: "delivered", reportProcessingStatus: "processed",
    queuedAt: "2026-09-29T01:15:00.000Z", startedAt: "2026-09-29T01:15:05.000Z", finishedAt: "2026-09-29T01:20:00.000Z",
    reportId: "report-portfolio-concentration", reason: null, errorSummary: null, mode: "demo"
  }),
  RunSchema.parse({
    id: "demo-run-005", taskId: "task-research-thesis", agentId: "research", idempotencyKey: null,
    executionStatus: "succeeded", deliveryStatus: "delivered", reportProcessingStatus: "processed",
    queuedAt: "2026-10-01T03:00:00.000Z", startedAt: "2026-10-01T03:00:05.000Z", finishedAt: "2026-10-01T03:05:00.000Z",
    reportId: "report-research-thesis", reason: null, errorSummary: null, mode: "demo"
  }),
  RunSchema.parse({
    id: "demo-run-006", taskId: "task-research-thesis", agentId: "research", idempotencyKey: null,
    executionStatus: "succeeded", deliveryStatus: "delivered", reportProcessingStatus: "processed",
    queuedAt: "2026-09-27T02:30:00.000Z", startedAt: "2026-09-27T02:30:05.000Z", finishedAt: "2026-09-27T02:35:00.000Z",
    reportId: "report-research-fund-questions", reason: null, errorSummary: null, mode: "demo"
  }),
  RunSchema.parse({
    id: "demo-run-007", taskId: "task-risk-review", agentId: "risk", idempotencyKey: null,
    executionStatus: "succeeded", deliveryStatus: "delivered", reportProcessingStatus: "processed",
    queuedAt: "2026-10-02T00:35:00.000Z", startedAt: "2026-10-02T00:35:05.000Z", finishedAt: "2026-10-02T00:40:00.000Z",
    reportId: "report-risk-exposure-review", reason: null, errorSummary: null, mode: "demo"
  }),
  RunSchema.parse({
    id: "demo-run-008", taskId: "task-risk-review", agentId: "risk", idempotencyKey: null,
    executionStatus: "succeeded", deliveryStatus: "delivered", reportProcessingStatus: "processed",
    queuedAt: "2026-09-28T03:20:00.000Z", startedAt: "2026-09-28T03:20:05.000Z", finishedAt: "2026-09-28T03:25:00.000Z",
    reportId: "report-risk-data-quality", reason: null, errorSummary: null, mode: "demo"
  }),
  RunSchema.parse({
    id: "demo-run-009", taskId: "task-risk-review", agentId: "risk", idempotencyKey: null,
    executionStatus: "failed", deliveryStatus: "unknown", reportProcessingStatus: "failed",
    queuedAt: "2026-10-01T04:00:00.000Z", startedAt: "2026-10-01T04:00:05.000Z", finishedAt: "2026-10-01T04:00:21.000Z",
    reportId: null, reason: null, errorSummary: "Illustrative simulated failure. No research request was sent.", mode: "demo"
  })
];

export function createDemoFixture(scenario: DemoScenario): DemoSnapshot {
  const snapshot: DemoSnapshot = {
    scenario,
    clockAt: DEMO_CLOCK_START,
    nextRunNumber: 10,
    agents: structuredClone(agents),
    tasks: structuredClone(tasks),
    reports: structuredClone(reports),
    runs: structuredClone(runs),
    idempotencyKeys: {},
    preferences: AppPreferencesSchema.parse({ timezone: "Asia/Jakarta", reducedMotion: false, theme: "system" })
  };

  if (scenario === "offline") {
    snapshot.agents = snapshot.agents.map((agent) => ({
      ...agent,
      status: "offline",
      statusLabel: "Offline · simulated scenario"
    }));
  }

  if (scenario === "empty-reports") {
    snapshot.reports = [];
    snapshot.runs = [];
  }

  if (scenario === "run-fails") {
    snapshot.agents = snapshot.agents.map((agent) => ({
      ...agent,
      status: "idle",
      statusLabel: "Idle · simulated"
    }));
  }

  return snapshot;
}
