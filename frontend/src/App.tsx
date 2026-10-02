import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AGENT_IDS, type Agent, type AgentId } from "@investment-office/shared";
import { avatarAssetHref } from "./assets/officeAssets";
import AnalystProfilePanel, { PROFILE_TABS, type AnalystProfileTab } from "./components/AnalystProfilePanel";
import PreferencesMenu from "./components/PreferencesMenu";
import ReportDetailPage from "./components/ReportDetailPage";
import ReportListPage from "./components/ReportListPage";
import DemoScenarioControls from "./demo/DemoScenarioControls";
import { officeService } from "./demo";
import { useDemoRevision } from "./lib/demoHooks";

function isAgentId(value: string | null): value is AgentId {
  return value !== null && AGENT_IDS.includes(value as AgentId);
}

function isProfileTab(value: string | null): value is AnalystProfileTab {
  return value !== null && PROFILE_TABS.includes(value as AnalystProfileTab);
}

function OfficeState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <section className="office-state" aria-live="polite">
      <p className="eyebrow">Office roster</p>
      <h2>{title}</h2>
      <p>{detail}</p>
      {action ? <div className="profile-state__actions">{action}</div> : null}
    </section>
  );
}

function AgentCard({ agent, selected }: { agent: Agent; selected: boolean }) {
  return (
    <article className={`analyst-card${selected ? " analyst-card--selected" : ""}`}>
      <div className="analyst-card__topline">
        <Link className="analyst-card__identity" to={`/office?agent=${agent.id}&tab=overview`}>
          <span className={`analyst-card__avatar analyst-card__avatar--${agent.id}`} aria-hidden="true">
            <svg viewBox="0 0 128 128" role="presentation"><use href={avatarAssetHref(agent.id, "idle")} /></svg>
          </span>
          <span>
            <strong>{agent.displayName}</strong>
            <small>{agent.title}</small>
          </span>
        </Link>
        <span className={`analyst-card__status analyst-card__status--${agent.status}`}>
          <span aria-hidden="true" />
          {agent.statusLabel}
        </span>
      </div>
      <p>{agent.responsibility}</p>
      <div className="analyst-card__actions">
        <Link className="secondary-button" to={`/office?agent=${agent.id}&tab=overview`}>Open profile</Link>
        <Link className="text-button" to={`/office?agent=${agent.id}&tab=assignment`}>Assignment</Link>
      </div>
    </article>
  );
}

function OfficeRoster({ agents, selectedAgent }: { agents: Agent[]; selectedAgent: AgentId | undefined }) {
  return (
    <section className="office-roster" aria-labelledby="analyst-roster-title">
      <div className="office-roster__heading">
        <div>
          <p className="eyebrow">Accessible analyst list</p>
          <h2 id="analyst-roster-title">Choose an analyst</h2>
        </div>
        <span>{agents.length} available</span>
      </div>
      <div className="analyst-card-list">
        {agents.map((agent) => <AgentCard key={agent.id} agent={agent} selected={selectedAgent === agent.id} />)}
      </div>
    </section>
  );
}

function OfficePage() {
  const location = useLocation();
  const revision = useDemoRevision();
  const selectedAgent = useMemo(() => {
    const candidate = new URLSearchParams(location.search).get("agent");
    return isAgentId(candidate) ? candidate : undefined;
  }, [location.search]);
  const selectedTab = useMemo(() => {
    const candidate = new URLSearchParams(location.search).get("tab");
    return isProfileTab(candidate) ? candidate : "overview";
  }, [location.search]);
  const agentsQuery = useQuery({
    queryKey: ["agents", revision],
    queryFn: () => officeService.listAgents()
  });
  const agents = agentsQuery.data?.data ?? [];

  return (
    <section className="office-page" aria-labelledby="office-title">
      <header className="page-heading page-heading--office">
        <div>
          <p className="eyebrow">Research workspace</p>
          <h1 id="office-title">Office</h1>
          <p>Open a shared analyst profile to inspect responsibility, assignment, reports, and demo execution state.</p>
        </div>
        <div className="page-heading__context">
          <span className="mode-chip"><span className="mode-chip__dot" aria-hidden="true" /> Demo workspace</span>
          <span>{agents.length || "Four"} analysts · local fixture</span>
        </div>
      </header>

      <div className={`office-workspace${selectedAgent ? " office-workspace--profile-open" : ""}`}>
        <section className="office-overview" aria-labelledby="office-overview-title">
          <div className="office-room-card">
            <div className="office-room-card__heading">
              <div>
                <p className="eyebrow">Office overview</p>
                <h2 id="office-overview-title">Four analysts, one shared workspace</h2>
              </div>
              <span className="office-room-card__badge">Scene foundation</span>
            </div>
            <p>The room scene will become clickable in the next frontend milestone. For now, the roster keeps every profile and assignment reachable by keyboard, pointer, and touch.</p>
            <div className="office-room-card__floor" aria-hidden="true">
              <span className="office-room-card__floor-line office-room-card__floor-line--one" />
              <span className="office-room-card__floor-line office-room-card__floor-line--two" />
              <span className="office-room-card__plant office-room-card__plant--one" />
              <span className="office-room-card__plant office-room-card__plant--two" />
              <span className="office-room-card__desk office-room-card__desk--one" />
              <span className="office-room-card__desk office-room-card__desk--two" />
              <span className="office-room-card__table" />
            </div>
          </div>
          {agentsQuery.isPending ? (
            <div className="analyst-card-list" aria-label="Loading analysts" aria-busy="true">
              {Array.from({ length: 4 }, (_, index) => <div className="analyst-card analyst-card--skeleton" key={index}><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div>)}
            </div>
          ) : agentsQuery.isError ? (
            <OfficeState
              title="Analysts could not be loaded"
              detail="The office profile roster is unavailable. Retry without leaving the office."
              action={<button className="secondary-button" type="button" onClick={() => void agentsQuery.refetch()}>Retry</button>}
            />
          ) : (
            <OfficeRoster agents={agents} selectedAgent={selectedAgent} />
          )}
        </section>
        {selectedAgent ? <AnalystProfilePanel agentId={selectedAgent} tab={selectedTab} /> : null}
      </div>
    </section>
  );
}

function AppHeader() {
  const location = useLocation();

  return (
    <header className="topbar">
      <div className="topbar__main">
        <Link className="brand" to="/office" aria-label="Investment Office home">
          <span className="brand-mark" aria-hidden="true">IO</span>
          <span>Investment Office</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link className={location.pathname.startsWith("/office") ? "is-active" : ""} to="/office">Office</Link>
          <Link className={location.pathname.startsWith("/reports") ? "is-active" : ""} to="/reports">Reports</Link>
        </nav>
      </div>
      <div className="topbar__actions">
        <span className="connection-status"><span className="connection-status__dot" aria-hidden="true" /> <span>Demo ready</span></span>
        <PreferencesMenu />
        <button className="profile-button" type="button" aria-label="Owner profile">GK</button>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <AppHeader />

      <main>
        <p className="demo-banner" role="status">
          Demo — simulated agents and illustrative reports; no live market data.
        </p>
        <DemoScenarioControls />
        <Routes>
          <Route path="/" element={<Navigate to="/office" replace />} />
          <Route path="/office" element={<OfficePage />} />
          <Route path="/reports" element={<ReportListPage />} />
          <Route path="/reports/:reportId" element={<ReportDetailPage />} />
          <Route path="*" element={<Navigate to="/office" replace />} />
        </Routes>
      </main>
    </div>
  );
}
