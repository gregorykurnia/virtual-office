import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AGENT_IDS, type Agent, type AgentId, type Report, type ReportFilters } from "@investment-office/shared";
import { officeService } from "../demo";
import { useDemoRevision } from "../lib/demoHooks";
import { formatDateOnly, formatDateTime, isDateParameter, localDateBoundary } from "../lib/formatters";
import type { ReportNavigationState } from "./reportNavigation";

const AGENT_FALLBACK_LABELS: Record<AgentId, string> = {
  market: "Rex · Market Analyst",
  portfolio: "Adrian · Portfolio Analyst",
  research: "Clara · Investment Research Analyst",
  risk: "Theo · Risk Analyst"
};

function isAgentId(value: string | null): value is AgentId {
  return value !== null && AGENT_IDS.includes(value as AgentId);
}

function parseReportFilters(search: string) {
  const params = new URLSearchParams(search);
  const from = isDateParameter(params.get("from")) ? params.get("from")! : undefined;
  const to = isDateParameter(params.get("to")) ? params.get("to")! : undefined;
  const query = params.get("q")?.trim() ?? "";
  const agentParam = params.get("agent");
  const agentId = isAgentId(agentParam) ? agentParam : undefined;
  return {
    agentId,
    unreadOnly: params.get("unread") === "true",
    query,
    from,
    to
  };
}

function getAgentLabel(agentId: AgentId, agents: Map<AgentId, Agent>): string {
  const agent = agents.get(agentId);
  return agent ? `${agent.displayName} · ${agent.title}` : AGENT_FALLBACK_LABELS[agentId];
}

function getAgentInitial(agentId: AgentId, agents: Map<AgentId, Agent>): string {
  return agents.get(agentId)?.displayName.slice(0, 1) ?? AGENT_FALLBACK_LABELS[agentId].slice(0, 1);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The report service could not be reached.";
}

function StateCard({
  eyebrow,
  title,
  detail,
  action
}: {
  eyebrow: string;
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="state-card" aria-live="polite">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{detail}</p>
      {action ? <div className="state-card__actions">{action}</div> : null}
    </section>
  );
}

function ReportRow({ report, agents, listSearch }: { report: Report; agents: Map<AgentId, Agent>; listSearch: string }) {
  const agent = agents.get(report.agentId);
  const agentLabel = getAgentLabel(report.agentId, agents);
  const navigationState: ReportNavigationState = {
    from: `/reports${listSearch}`,
    scrollY: window.scrollY
  };

  return (
    <Link
      className={`report-row${report.readAt === null ? " report-row--unread" : ""}`}
      role="listitem"
      to={{ pathname: `/reports/${report.id}`, search: listSearch }}
      state={navigationState}
      aria-label={`${report.title}, ${agentLabel}, generated ${formatDateTime(report.generatedAt, report.metadata.timezone)}`}
    >
      <span className="report-row__marker" aria-hidden="true">{report.readAt === null ? "" : "✓"}</span>
      <span className="report-row__main">
        <span className="report-row__title-line">
          <strong>{report.title}</strong>
          {report.readAt === null ? <span className="status-pill status-pill--new">Unread</span> : null}
        </span>
        <span className="report-row__summary">{report.summary}</span>
      </span>
      <span className="report-row__agent">
        <span className={`agent-avatar agent-avatar--${report.agentId}`} aria-hidden="true">{getAgentInitial(report.agentId, agents)}</span>
        <span>
          <strong>{agent?.displayName ?? report.agentId}</strong>
          <small>{agent?.title ?? "Analyst"}</small>
        </span>
      </span>
      <time className="report-row__date" dateTime={report.generatedAt} title={`Data date: ${formatDateOnly(report.dataAsOf ?? report.generatedAt, report.metadata.timezone)}`}>
        {formatDateTime(report.generatedAt, report.metadata.timezone)}
      </time>
      <span className={`report-row__state${report.readAt === null ? " report-row__state--new" : ""}`}>
        {report.readAt === null ? "New" : "Read"}
      </span>
    </Link>
  );
}

function ReportRowSkeleton() {
  return (
    <div className="report-row report-row--skeleton" aria-hidden="true">
      <span className="skeleton skeleton--marker" />
      <span className="report-row__main"><span className="skeleton skeleton--title" /><span className="skeleton skeleton--summary" /></span>
      <span className="skeleton skeleton--agent" />
      <span className="skeleton skeleton--date" />
      <span className="skeleton skeleton--state" />
    </div>
  );
}

export default function ReportListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const revision = useDemoRevision();
  const parsedFilters = useMemo(() => parseReportFilters(location.search), [location.search]);
  const [searchDraft, setSearchDraft] = useState(parsedFilters.query);

  useEffect(() => setSearchDraft(parsedFilters.query), [parsedFilters.query]);

  useEffect(() => {
    const navigationState = location.state as ReportNavigationState | null;
    if (navigationState?.restoreScrollY === undefined) return undefined;
    const restoreScrollY = navigationState.restoreScrollY;
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: restoreScrollY, behavior: "auto" }));
    return () => window.cancelAnimationFrame(frame);
  }, [location.state]);

  const serviceFilters = useMemo<ReportFilters>(() => ({
    ...(parsedFilters.agentId ? { agentId: parsedFilters.agentId } : {}),
    ...(parsedFilters.unreadOnly ? { unreadOnly: true } : {}),
    ...(parsedFilters.query ? { query: parsedFilters.query } : {}),
    ...(parsedFilters.from ? { generatedFrom: localDateBoundary(parsedFilters.from) } : {}),
    ...(parsedFilters.to ? { generatedTo: localDateBoundary(parsedFilters.to, true) } : {}),
    pageSize: 50
  }), [parsedFilters]);

  const agentsQuery = useQuery({
    queryKey: ["agents", revision],
    queryFn: () => officeService.listAgents()
  });
  const reportsQuery = useInfiniteQuery({
    queryKey: ["reports", serviceFilters, revision],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => officeService.listReports(serviceFilters, pageParam),
    getNextPageParam: (lastPage) => lastPage.data.hasMore ? lastPage.data.nextCursor ?? undefined : undefined
  });

  const agents = useMemo(
    () => new Map((agentsQuery.data?.data ?? []).map((agent) => [agent.id, agent] as const)),
    [agentsQuery.data?.data]
  );

  const setQueryParam = useCallback((name: string, value: string | null) => {
    const params = new URLSearchParams(location.search);
    if (value) params.set(name, value);
    else params.delete(name);
    const search = params.toString();
    navigate({ pathname: "/reports", search: search ? `?${search}` : "" }, { replace: true });
  }, [location.search, navigate]);

  useEffect(() => {
    if (searchDraft === parsedFilters.query) return undefined;
    const timer = window.setTimeout(() => setQueryParam("q", searchDraft.trim() || null), 260);
    return () => window.clearTimeout(timer);
  }, [parsedFilters.query, searchDraft, setQueryParam]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQueryParam("q", searchDraft.trim() || null);
  }

  function clearFilters() {
    setSearchDraft("");
    navigate("/reports", { replace: true });
  }

  const reportPages = reportsQuery.data?.pages ?? [];
  const reports = reportPages.flatMap((page) => page.data.items);
  const hasActiveFilters = Boolean(parsedFilters.agentId || parsedFilters.unreadOnly || parsedFilters.query || parsedFilters.from || parsedFilters.to);
  const observedAt = reportPages[0]?.observedAt;

  return (
    <section className="reports-page" aria-labelledby="reports-title" aria-busy={reportsQuery.isPending}>
      <header className="page-heading page-heading--reports">
        <div>
          <p className="eyebrow">Research output</p>
          <h1 id="reports-title">Reports</h1>
          <p>{import.meta.env.VITE_APP_MODE === "live" ? "Review dated analyst notes saved in the private application database." : "Review dated analyst notes and simulated research outputs."}</p>
        </div>
        <div className="page-heading__context">
          <span className="mode-chip"><span className="mode-chip__dot" aria-hidden="true" />{import.meta.env.VITE_APP_MODE === "live" ? "Live data" : "Demo data"}</span>
          {observedAt ? <span>Observed {formatDateTime(observedAt)}</span> : <span>{import.meta.env.VITE_APP_MODE === "live" ? "Waiting for API" : "Local fixture"}</span>}
        </div>
      </header>

      <form className="reports-filters" onSubmit={submitSearch} role="search">
        <label className="filter-field filter-field--search">
          <span>Search reports</span>
          <span className="search-input-wrap">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.currentTarget.value)}
              placeholder="Titles, summaries, or findings"
              aria-label="Search report titles, summaries, or findings"
            />
          </span>
        </label>
        <label className="filter-field">
          <span>Analyst</span>
          <select value={parsedFilters.agentId ?? "all"} onChange={(event) => setQueryParam("agent", event.currentTarget.value === "all" ? null : event.currentTarget.value)}>
            <option value="all">All analysts</option>
            {AGENT_IDS.map((agentId) => <option key={agentId} value={agentId}>{getAgentLabel(agentId, agents)}</option>)}
          </select>
        </label>
        <label className="filter-field filter-field--date">
          <span>From date</span>
          <input type="date" value={parsedFilters.from ?? ""} onChange={(event) => setQueryParam("from", event.currentTarget.value || null)} />
        </label>
        <label className="filter-field filter-field--date">
          <span>To date</span>
          <input type="date" value={parsedFilters.to ?? ""} onChange={(event) => setQueryParam("to", event.currentTarget.value || null)} />
        </label>
        <label className="filter-toggle">
          <input type="checkbox" checked={parsedFilters.unreadOnly} onChange={(event) => setQueryParam("unread", event.currentTarget.checked ? "true" : null)} />
          <span>Unread only</span>
        </label>
        {hasActiveFilters ? <button className="text-button" type="button" onClick={clearFilters}>Clear filters</button> : null}
      </form>

      {reportsQuery.isError && reports.length === 0 ? (
        <StateCard
          eyebrow="Unavailable"
          title="Reports could not be loaded"
          detail={`${getErrorMessage(reportsQuery.error)} Your search and filters are still here; retry when the data source is available.`}
          action={<button className="primary-button" type="button" onClick={() => void reportsQuery.refetch()}>Retry</button>}
        />
      ) : reportsQuery.isPending ? (
        <div className="report-list" aria-label="Loading reports">
          {Array.from({ length: 5 }, (_, index) => <ReportRowSkeleton key={index} />)}
        </div>
      ) : reports.length === 0 ? (
        <StateCard
          eyebrow={hasActiveFilters ? "No matches" : "No reports"}
          title={hasActiveFilters ? "No reports match these filters" : "No reports have been generated"}
          detail={hasActiveFilters ? "Try a broader analyst, date range, or search term." : import.meta.env.VITE_APP_MODE === "live" ? "The live database contains no reports yet. Demo reports are not included in this workspace." : "This demo scenario has no report records yet. Select another scenario from Demo controls to view illustrative output."}
          action={hasActiveFilters ? <button className="primary-button" type="button" onClick={clearFilters}>Clear filters</button> : <Link className="secondary-button" to="/office">View Office</Link>}
        />
      ) : (
        <>
          <div className="report-list" role="list" aria-label="Reports">
            <div className="report-list__head" aria-hidden="true">
              <span />
              <span>Report</span>
              <span>Analyst</span>
              <span>Generated</span>
              <span>Status</span>
            </div>
            {reports.map((report) => <ReportRow key={report.id} report={report} agents={agents} listSearch={location.search} />)}
          </div>
          <p className="list-footnote">Showing {reports.length} {import.meta.env.VITE_APP_MODE === "live" ? "saved report" : "illustrative report"}{reports.length === 1 ? "" : "s"}. Select a row to read the full dated report.</p>
          {reportsQuery.isFetchNextPageError ? <StateCard eyebrow="Unavailable" title="More reports could not be loaded" detail="The reports already loaded remain available. Retry the next page when the API is reachable." action={<button className="secondary-button" type="button" onClick={() => void reportsQuery.fetchNextPage()}>Retry</button>} /> : null}
          {reportsQuery.hasNextPage ? <div className="report-list__more"><button className="secondary-button" type="button" disabled={reportsQuery.isFetchingNextPage} onClick={() => void reportsQuery.fetchNextPage()}>{reportsQuery.isFetchingNextPage ? "Loading reports…" : "Load older reports"}</button></div> : null}
        </>
      )}
    </section>
  );
}
