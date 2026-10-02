import { useMemo } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AGENT_IDS } from "@investment-office/shared";
import PreferencesMenu from "./components/PreferencesMenu";
import ReportDetailPage from "./components/ReportDetailPage";
import ReportListPage from "./components/ReportListPage";
import DemoScenarioControls from "./demo/DemoScenarioControls";

function PagePlaceholder({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="placeholder" aria-labelledby="page-title">
      <p className="eyebrow">Foundation phase</p>
      <h1 id="page-title">{title}</h1>
      <p>{detail}</p>
    </section>
  );
}

function OfficePage() {
  const location = useLocation();
  const selectedAgent = useMemo(() => {
    const candidate = new URLSearchParams(location.search).get("agent");
    return AGENT_IDS.find((agentId) => agentId === candidate);
  }, [location.search]);

  return (
    <PagePlaceholder
      title="Office"
      detail={
        selectedAgent
          ? `The ${selectedAgent} analyst profile route is reserved; the office scene arrives in the demo phase.`
          : "The office scene and analyst cards will be added in the demo phase."
      }
    />
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
