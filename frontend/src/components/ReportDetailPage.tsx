import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "react-router-dom";
import type { Agent, AgentId, Report } from "@investment-office/shared";
import { officeService } from "../demo";
import { useDemoRevision } from "../lib/demoHooks";
import { formatDateOnly, formatDateTime } from "../lib/formatters";
import MarkdownContent, { getSafeHref } from "./MarkdownContent";
import type { ReportNavigationState } from "./reportNavigation";

const AGENT_LABELS: Record<AgentId, string> = {
  market: "Rex · Market Analyst",
  portfolio: "Paz · Portfolio Analyst",
  research: "Cody · Investment Research Analyst",
  risk: "Wolffe · AI & Technology Analyst"
};

function getAgentLabel(agentId: AgentId, agents: Agent[]): string {
  const agent = agents.find((candidate) => candidate.id === agentId);
  return agent ? `${agent.displayName} · ${agent.title}` : AGENT_LABELS[agentId];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The report service could not be reached.";
}

function DetailSkeleton() {
  return (
    <div className="detail-layout" aria-label="Loading report" aria-busy="true">
      <article className="report-paper report-paper--skeleton">
        <span className="skeleton skeleton--kicker" />
        <span className="skeleton skeleton--detail-title" />
        <span className="skeleton skeleton--detail-meta" />
        <span className="skeleton skeleton--paragraph" />
        <span className="skeleton skeleton--paragraph skeleton--paragraph-short" />
        <span className="skeleton skeleton--paragraph" />
        <span className="skeleton skeleton--paragraph" />
      </article>
      <aside className="detail-side detail-side--skeleton">
        <span className="skeleton skeleton--side-title" />
        <span className="skeleton skeleton--side-card" />
        <span className="skeleton skeleton--side-card" />
      </aside>
    </div>
  );
}

function MetaCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="meta-card">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function ReportPaper({ report }: { report: Report }) {
  const bodyFindings = report.findings.map((finding) => `- ${finding}`).join("\n");
  const bodyUncertainties = report.uncertainties.map((uncertainty) => `- ${uncertainty}`).join("\n");
  const bodyMissingInputs = report.missingInputs.map((input) => `- ${input}`).join("\n");

  return (
    <article className="report-paper">
      <p className="report-kicker">{getAgentLabel(report.agentId, [])} · {import.meta.env.VITE_APP_MODE === "live" ? "saved report" : "simulated report"}</p>
      <h1>{report.title}</h1>
      <div className="report-meta">
        <span>Generated {formatDateTime(report.generatedAt, report.metadata.timezone)}</span>
        <span aria-hidden="true">·</span>
        <span>Data date {formatDateTime(report.dataAsOf ?? report.generatedAt, report.metadata.timezone)}</span>
      </div>
      <div className="report-takeaway">
        <span className="report-takeaway__label">Summary</span>
        <MarkdownContent source={report.summary} />
      </div>
      <div className="report-sections">
        {import.meta.env.VITE_APP_MODE === "live" ? (
          <section><h2>Report</h2><MarkdownContent source={report.bodyMarkdown ?? "Report content was not recorded."} /></section>
        ) : (
          <>
            <section><h2>Findings</h2><MarkdownContent source={bodyFindings} /></section>
            <section><h2>Interpretation</h2><MarkdownContent source={report.interpretation} /></section>
            <section><h2>Uncertainties</h2><MarkdownContent source={bodyUncertainties} /></section>
            <section><h2>Missing inputs</h2><MarkdownContent source={bodyMissingInputs} /></section>
          </>
        )}
      </div>
    </article>
  );
}

function ReportSources({ report }: { report: Report }) {
  return (
    <section className="report-sources" aria-labelledby="sources-title">
      <div className="section-heading--compact">
        <h2 id="sources-title">Source references</h2>
        <span>{report.sources.length} reference{report.sources.length === 1 ? "" : "s"}</span>
      </div>
      <ol>
        {report.sources.map((source) => {
          const safeHref = source.url ? getSafeHref(source.url) : null;
          return (
            <li key={source.id}>
              <span className="source-index" aria-hidden="true">{report.sources.indexOf(source) + 1}</span>
              <div>
                {safeHref ? <a href={safeHref} target="_blank" rel="noreferrer">{source.label}</a> : <span>{source.label}</span>}
                <small>
                  {source.illustrative ? "Illustrative reference" : "Verified source"}
                  {source.retrievedAt ? ` · retrieved ${formatDateTime(source.retrievedAt, report.metadata.timezone)}` : ""}
                </small>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

const CANNED_FOLLOW_UPS = [
  {
    id: "takeaway",
    label: "What is the main takeaway?",
    respond: (report: Report) => report.summary
  },
  {
    id: "uncertainties",
    label: "What remains uncertain?",
    respond: (report: Report) => report.uncertainties.join(" ")
  },
  {
    id: "missing-inputs",
    label: "Which inputs are missing?",
    respond: (report: Report) => report.missingInputs.join(" ")
  }
] as const;

type CannedFollowUp = (typeof CANNED_FOLLOW_UPS)[number];

function CannedReportFollowUp({ report }: { report: Report }) {
  const [turns, setTurns] = useState<CannedFollowUp[]>([]);

  return (
    <section className="report-follow-up" aria-labelledby="report-follow-up-title">
      <div className="report-follow-up__heading">
        <div>
          <p className="eyebrow">Report follow-up · demo</p>
          <h2 id="report-follow-up-title">Ask about this report</h2>
        </div>
        <span className="report-follow-up__badge">Canned responses</span>
      </div>
      <p className="report-follow-up__intro">
        Choose a question to see a response based on this report. No model or network request is made.
      </p>
      <div className="report-follow-up__prompts" role="group" aria-label="Canned follow-up questions">
        {CANNED_FOLLOW_UPS.map((prompt) => (
          <button
            className="secondary-button report-follow-up__prompt"
            key={prompt.id}
            type="button"
            onClick={() => setTurns((current) => [...current, prompt])}
          >
            {prompt.label}
          </button>
        ))}
      </div>
      {turns.length > 0 ? (
        <>
          <ol className="report-follow-up__turns" aria-label="Demo follow-up conversation" role="log" aria-live="polite" aria-relevant="additions">
            {turns.map((prompt, index) => (
              <li className="report-follow-up__turn" key={`${prompt.id}-${index}`}>
                <div className="report-follow-up__bubble report-follow-up__bubble--question">
                  <span className="report-follow-up__turn-label">You asked</span>
                  <p>{prompt.label}</p>
                </div>
                <div className="report-follow-up__bubble report-follow-up__bubble--answer">
                  <span className="report-follow-up__turn-label">Canned demo response</span>
                  <p>{prompt.respond(report)}</p>
                </div>
              </li>
            ))}
          </ol>
          <button className="text-button report-follow-up__clear" type="button" onClick={() => setTurns([])}>
            Clear conversation
          </button>
        </>
      ) : null}
    </section>
  );
}

function ReportContext({ report, agents, readError }: { report: Report; agents: Agent[]; readError: string | null }) {
  return (
    <aside className="detail-side" aria-label="Report context">
      <div className="detail-side__heading">
        <p className="eyebrow">Report context</p>
        <span className="status-pill status-pill--complete">{report.readAt ? "Read" : "Reading"}</span>
      </div>
      <dl className="meta-stack">
        <MetaCard label="Analyst">{getAgentLabel(report.agentId, agents)}</MetaCard>
        <MetaCard label="Agent ID"><code>{report.agentId}</code></MetaCard>
        <MetaCard label="Run ID"><code>{report.runId}</code></MetaCard>
        <MetaCard label="Data date">{formatDateOnly(report.dataAsOf ?? report.generatedAt, report.metadata.timezone)}</MetaCard>
        <MetaCard label="Observed timezone">{report.metadata.timezone}</MetaCard>
        {import.meta.env.VITE_APP_MODE !== "live" ? <MetaCard label="Elapsed">{report.metadata.elapsedSeconds === null ? "Not recorded" : `${report.metadata.elapsedSeconds}s`}</MetaCard> : null}
      </dl>
      {report.metadata.sampleSymbols.length > 0 ? (
        <div className="context-note">
          <strong>Sample symbols</strong>
          <p>{report.metadata.sampleSymbols.map((symbol) => symbol.symbol).join(" · ")}</p>
          <small>Fictional labels included for the demo fixture.</small>
        </div>
      ) : null}
      {readError ? <p className="context-error" role="status">{readError}</p> : null}
      <Link className="secondary-button secondary-button--full" to={`/office?agent=${report.agentId}&tab=overview`}>Open analyst profile</Link>
    </aside>
  );
}

export default function ReportDetailPage() {
  const { reportId = "" } = useParams();
  const location = useLocation();
  const revision = useDemoRevision();
  const queryClient = useQueryClient();
  const [readError, setReadError] = useState<string | null>(null);
  const reportQuery = useQuery({
    queryKey: ["report", reportId, revision],
    queryFn: () => officeService.getReport(reportId),
    enabled: Boolean(reportId)
  });
  const agentsQuery = useQuery({
    queryKey: ["agents", revision],
    queryFn: () => officeService.listAgents()
  });
  const report = reportQuery.data?.data ?? null;
  const navigationState = location.state as ReportNavigationState | null;
  const backPath = navigationState?.from ?? `/reports${location.search}`;
  const backState = navigationState?.scrollY === undefined ? undefined : { restoreScrollY: navigationState.scrollY };

  useEffect(() => {
    if (!report || report.readAt !== null) return undefined;
    let active = true;
    void officeService.markReportRead(report.id).then((result) => {
      if (active && result.data) queryClient.setQueryData(["report", reportId, revision], result);
    }).catch((error: unknown) => {
      if (active) setReadError(getErrorMessage(error));
    });
    return () => {
      active = false;
    };
  }, [report?.id, report?.readAt, queryClient, reportId, revision]);

  return (
    <section className="report-detail-page" aria-labelledby="report-detail-title" aria-busy={reportQuery.isPending}>
      <Link className="back-link" to={backPath} state={backState}>← Back to Reports</Link>
      {reportQuery.isError ? (
        <section className="state-card state-card--error" role="alert">
          <p className="eyebrow">Unavailable</p>
          <h1 id="report-detail-title">Report could not be loaded</h1>
          <p>{getErrorMessage(reportQuery.error)} The report has not been marked read.</p>
          <div className="state-card__actions"><button className="primary-button" type="button" onClick={() => void reportQuery.refetch()}>Retry</button></div>
        </section>
      ) : reportQuery.isPending ? (
        <DetailSkeleton />
      ) : !report ? (
        <section className="state-card" role="status">
          <p className="eyebrow">Not found</p>
          <h1 id="report-detail-title">That report is not available</h1>
          <p>{import.meta.env.VITE_APP_MODE === "live" ? "The report may have been removed or is not available to this owner. Nothing was marked read." : "The report link may be stale or the record may not be part of the current demo scenario. Nothing was marked read."}</p>
          <div className="state-card__actions"><Link className="primary-button" to={backPath} state={backState}>Return to Reports</Link></div>
        </section>
      ) : (
        <>
          <div className="detail-layout">
            <ReportPaper report={report} />
            <ReportContext report={report} agents={agentsQuery.data?.data ?? []} readError={readError} />
          </div>
          <ReportSources report={report} />
          {import.meta.env.VITE_APP_MODE === "live" ? null : <CannedReportFollowUp key={report.id} report={report} />}
        </>
      )}
    </section>
  );
}
