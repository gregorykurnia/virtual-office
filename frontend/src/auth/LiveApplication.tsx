import { useQuery } from "@tanstack/react-query";
import { Link, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { signOut, type User } from "firebase/auth";
import { getAuth } from "firebase/auth";
import { firebaseApp } from "../lib/firebase";
import OfficePage from "../components/LiveOfficePage";
import ReportDetailPage from "../components/ReportDetailPage";
import ReportListPage from "../components/ReportListPage";
import { httpOfficeService } from "../services/httpOfficeService";

function ConnectionStatus() {
  const connection = useQuery({
    queryKey: ["live-connection"],
    queryFn: () => httpOfficeService.getConnection(),
    refetchInterval: () => document.visibilityState === "visible" ? 30_000 : false,
    refetchIntervalInBackground: false,
    staleTime: 15_000
  });
  const data = connection.data?.data;
  const state = connection.isError || data?.status === "unavailable" ? "unavailable" : !data || data.status === "unknown" ? "unknown" : data.stale ? "stale" : "connected";
  const label = state === "connected" ? "Gateway connected" : state === "stale" ? "Gateway status stale" : state === "unknown" ? "Gateway not checked" : "Gateway unavailable";
  return <span className={`connection-status connection-status--${state}`} title={data?.lastSuccessfulCheckAt ? `Last successful check ${new Date(data.lastSuccessfulCheckAt).toLocaleString()}` : "No successful Gateway check has been recorded"}><span className="connection-status__dot" aria-hidden="true" /><span>{label}</span></span>;
}

export default function LiveApplication({ user }: { user: User }) {
  const location = useLocation();
  async function handleSignOut() {
    if (firebaseApp) await signOut(getAuth(firebaseApp));
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__main">
          <Link className="brand" to="/office" aria-label="Investment Office home"><span className="brand-mark" aria-hidden="true">IO</span><span>Investment Office</span></Link>
          <nav aria-label="Primary navigation">
            <Link className={location.pathname.startsWith("/office") ? "is-active" : ""} to="/office">Office</Link>
            <Link className={location.pathname.startsWith("/reports") ? "is-active" : ""} to="/reports">Reports</Link>
          </nav>
        </div>
        <div className="topbar__actions">
          <ConnectionStatus />
          <span className="owner-access-label">Live workspace</span>
          <button className="profile-button" type="button" aria-label={`Sign out ${user.email ?? "owner"}`} title={user.email ?? "Sign out"} onClick={() => void handleSignOut()}>↗</button>
        </div>
      </header>
      <main>
        <p className="live-banner" role="status"><strong>Private live data</strong><span>Reports and analyst records are read from the authenticated application database. Gateway availability is shown separately.</span></p>
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
