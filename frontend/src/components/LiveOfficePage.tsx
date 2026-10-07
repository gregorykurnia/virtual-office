import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { AGENT_IDS, type Agent, type AgentId } from "@investment-office/shared";
import AnalystAvatar from "./AnalystAvatar";
import AnalystProfilePanel, { PROFILE_TABS, type AnalystProfileTab } from "./AnalystProfilePanel";
import OfficeScene from "./OfficeScene";
import { officeService } from "../demo";

function isAgentId(value: string | null): value is AgentId { return value !== null && AGENT_IDS.includes(value as AgentId); }
function isProfileTab(value: string | null): value is AnalystProfileTab { return value !== null && PROFILE_TABS.includes(value as AnalystProfileTab); }

function State({ title, detail, retry }: { title: string; detail: string; retry?: () => void }) {
  return <section className="office-state" aria-live="polite"><p className="eyebrow">Live analyst data</p><h2>{title}</h2><p>{detail}</p>{retry ? <button className="secondary-button" type="button" onClick={retry}>Retry</button> : null}</section>;
}

function RosterCard({ agent }: { agent: Agent }) {
  return <article className={`analyst-card analyst-card--${agent.id}`}><div className="analyst-card__topline"><Link className="analyst-card__identity" to={`/office?agent=${agent.id}&tab=overview`}><span className={`analyst-card__avatar analyst-card__avatar--${agent.id}`} aria-hidden="true"><AnalystAvatar agentId={agent.id} pose="idle" context="portrait" /></span><span><strong>{agent.displayName}</strong><small>{agent.title}</small></span></Link><span className={`analyst-card__status analyst-card__status--${agent.status}`}><span aria-hidden="true" />{agent.statusLabel}</span></div><p>{agent.responsibility}</p><div className="analyst-card__actions"><Link className="secondary-button" to={`/office?agent=${agent.id}&tab=overview`}>Open profile</Link></div></article>;
}

export default function LiveOfficePage() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const selectedAgent = useMemo(() => isAgentId(query.get("agent")) ? query.get("agent") as AgentId : undefined, [location.search]);
  const selectedTab = isProfileTab(query.get("tab")) ? query.get("tab") as AnalystProfileTab : "overview";
  const agentsQuery = useQuery({ queryKey: ["agents"], queryFn: () => officeService.listAgents(), refetchInterval: () => document.visibilityState === "visible" ? 30_000 : false, refetchIntervalInBackground: false });
  const reportsQuery = useQuery({ queryKey: ["office-reports"], queryFn: () => officeService.listReports({ pageSize: 50 }) });
  const agents = agentsQuery.data?.data ?? [];
  const reports = reportsQuery.data?.data.items ?? [];

  return <section className="office-page" aria-labelledby="office-title">
    <header className="page-heading page-heading--office"><div><p className="eyebrow">Research workspace</p><h1 id="office-title">Office</h1><p>Analyst records and reports from your private application database.</p></div><div className="page-heading__context"><span className="mode-chip"><span className="mode-chip__dot" aria-hidden="true" /> Live data</span><span>{agentsQuery.isPending ? "Loading analysts" : `${agents.length} saved analyst${agents.length === 1 ? "" : "s"}`}</span></div></header>
    <div className={`office-workspace${selectedAgent ? " office-workspace--profile-open" : ""}`}>
      <section className="office-overview" aria-labelledby="office-overview-title"><div className="office-room-card"><div className="office-room-card__heading"><div><p className="eyebrow">Office overview</p><h2 id="office-overview-title">Your saved analyst roster</h2></div><span className="office-room-card__badge">Live records</span></div><p>Analyst availability reflects the latest application run observation. It does not imply that the Gateway is currently reachable.</p>
        {agentsQuery.isPending ? <div className="office-scene office-scene--loading" aria-busy="true" aria-label="Loading office scene"><span className="skeleton office-scene__loading-block" /></div> : agentsQuery.isError ? <State title="Analysts could not be loaded" detail="The saved analyst roster is unavailable. Retry when the API is reachable." retry={() => void agentsQuery.refetch()} /> : agents.length === 0 ? <State title="No analysts have been configured" detail="The live database has no analyst records yet. The demo roster is not shown in this workspace." /> : <OfficeScene agents={agents} reports={reports} selectedAgent={selectedAgent} reportsPending={reportsQuery.isPending} reportsUnavailable={reportsQuery.isError} />}</div>
        {agentsQuery.isPending ? <div className="analyst-card-list" aria-busy="true">{AGENT_IDS.map((id) => <div className="analyst-card analyst-card--skeleton" key={id}><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div>)}</div> : agentsQuery.isError ? null : agents.length ? <section className="office-roster" aria-labelledby="analyst-roster-title"><div className="office-roster__heading"><div><p className="eyebrow">Saved profiles</p><h2 id="analyst-roster-title">Choose an analyst</h2></div><span>{agents.length} configured</span></div><div className="analyst-card-list">{agents.map((agent) => <RosterCard key={agent.id} agent={agent} />)}</div></section> : null}
      </section>
      {selectedAgent ? <AnalystProfilePanel agentId={selectedAgent} tab={selectedTab} /> : null}
    </div>
  </section>;
}
