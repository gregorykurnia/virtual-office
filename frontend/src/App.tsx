import { useMemo } from "react";
import { Link, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { AGENT_IDS } from "@investment-office/shared";
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

function ReportPage() {
  const { reportId } = useParams();

  return (
    <PagePlaceholder
      title={reportId ? "Report detail" : "Reports"}
      detail={
        reportId
          ? `Report ${reportId} has a stable route; report content will arrive with the demo fixtures.`
          : "Search, filters, and illustrative reports will arrive in the demo phase."
      }
    />
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/office" aria-label="Investment Office home">
          <span className="brand-mark" aria-hidden="true">IO</span>
          <span>Investment Office</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link to="/office">Office</Link>
          <Link to="/reports">Reports</Link>
        </nav>
      </header>

      <main>
        <p className="demo-banner" role="status">
          Demo — simulated agents and illustrative reports; no live market data.
        </p>
        <DemoScenarioControls />
        <Routes>
          <Route path="/" element={<Navigate to="/office" replace />} />
          <Route path="/office" element={<OfficePage />} />
          <Route path="/reports" element={<ReportPage />} />
          <Route path="/reports/:reportId" element={<ReportPage />} />
          <Route path="*" element={<Navigate to="/office" replace />} />
        </Routes>
      </main>
    </div>
  );
}
