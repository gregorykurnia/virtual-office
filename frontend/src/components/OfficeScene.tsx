import { useMemo, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import type { Agent, AgentId, Report } from "@investment-office/shared";
import { avatarAssetHref, deskAssetHref, type AvatarPose } from "../assets/officeAssets";
import { formatDateTime } from "../lib/formatters";

type OfficeProfileTab = "overview" | "assignment" | "reports";

type ScenePoint = {
  x: number;
  y: number;
};

type SceneAgentLayout = {
  desk: ScenePoint;
  character: ScenePoint;
  report: ScenePoint;
  zoneLabel: ScenePoint;
  zoneName: string;
  zoneDetail: string;
};

/**
 * All interactive scene layers use the same 0–100 coordinate space as the
 * room SVG. Keeping the anchors together prevents an art or viewport change
 * from making desks, characters, and report shortcuts drift apart.
 */
const SCENE_LAYOUT: Record<AgentId, SceneAgentLayout> = {
  market: {
    desk: { x: 30, y: 43 },
    character: { x: 30, y: 52 },
    report: { x: 38, y: 41 },
    zoneLabel: { x: 12, y: 16 },
    zoneName: "Market desk",
    zoneDetail: "Focus and research"
  },
  portfolio: {
    desk: { x: 30, y: 73 },
    character: { x: 30, y: 82 },
    report: { x: 38, y: 71 },
    zoneLabel: { x: 12, y: 56 },
    zoneName: "Portfolio desk",
    zoneDetail: "Holdings review"
  },
  research: {
    desk: { x: 72, y: 43 },
    character: { x: 72, y: 52 },
    report: { x: 80, y: 41 },
    zoneLabel: { x: 61, y: 16 },
    zoneName: "Research desk",
    zoneDetail: "Evidence and notes"
  },
  risk: {
    desk: { x: 72, y: 73 },
    character: { x: 72, y: 82 },
    report: { x: 80, y: 71 },
    zoneLabel: { x: 61, y: 56 },
    zoneName: "Risk desk",
    zoneDetail: "Challenge and review"
  }
};

const AGENT_ORDER: AgentId[] = ["market", "portfolio", "research", "risk"];

function pointStyle(point: ScenePoint): CSSProperties {
  return { left: `${point.x}%`, top: `${point.y}%` };
}

function profilePath(agentId: AgentId, tab: OfficeProfileTab): string {
  const params = new URLSearchParams({ agent: agentId, tab });
  return `/office?${params.toString()}`;
}

function getAvatarPose(agent: Agent, report: Report | undefined): AvatarPose {
  if (agent.status === "working") return "typing";
  if (agent.status === "waiting") return "reading";
  if (report?.readAt === null) return "report-ready";
  if (agent.status === "offline") return "attention";
  return "idle";
}

function getStatusTone(status: Agent["status"]): string {
  if (status === "working" || status === "waiting" || status === "offline") return status;
  return "unknown";
}

function OfficeRoomBackground() {
  return (
    <svg className="office-scene__background" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="office-room-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8f4ec" />
          <stop offset="0.5" stopColor="#fffdfa" />
          <stop offset="1" stopColor="#e9eef1" />
        </linearGradient>
        <pattern id="office-floor-grid" width="58" height="58" patternUnits="userSpaceOnUse">
          <path d="M0 0 29 15 58 0M0 29 29 44 58 29M0 58 29 43 58 58" fill="none" stroke="#d9e1e4" strokeWidth="1.5" />
          <path d="M0 0v58M29 15v29M58 0v58" fill="none" stroke="#e8eceb" strokeWidth="1" />
        </pattern>
        <linearGradient id="office-briefing-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e4f4ec" />
          <stop offset="1" stopColor="#c0e2d1" />
        </linearGradient>
        <linearGradient id="office-glass-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4fbfb" stopOpacity="0.9" />
          <stop offset="0.55" stopColor="#cfe9e8" stopOpacity="0.6" />
          <stop offset="1" stopColor="#b6d4df" stopOpacity="0.38" />
        </linearGradient>
        <linearGradient id="office-wood-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3d5a4" />
          <stop offset="1" stopColor="#c89557" />
        </linearGradient>
        <filter id="office-soft-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#657487" floodOpacity="0.18" />
        </filter>
      </defs>

      <rect width="1000" height="620" fill="url(#office-room-gradient)" />
      <rect x="20" y="18" width="960" height="584" rx="42" fill="#fffefa" stroke="#d8d3ca" strokeWidth="4" />
      <rect x="42" y="40" width="916" height="540" rx="32" fill="#f7f5ef" stroke="#e4e0d8" strokeWidth="2" />
      <rect x="54" y="52" width="892" height="516" rx="26" fill="url(#office-floor-grid)" opacity="0.5" />
      <path d="M500 44V576" stroke="#fffdf8" strokeWidth="74" opacity="0.92" />
      <path d="M48 310H952" stroke="#fffdf8" strokeWidth="42" opacity="0.9" />
      <path d="M78 310H922M500 68V552" stroke="#e9e3d9" strokeWidth="2" strokeDasharray="5 12" opacity="0.72" />

      <g filter="url(#office-soft-shadow)">
        <rect x="88" y="92" width="372" height="200" rx="28" fill="#edf3ff" stroke="#adc4f1" strokeWidth="3" strokeDasharray="11 8" />
        <rect x="88" y="338" width="372" height="192" rx="28" fill="#f4efff" stroke="#d5c8ef" strokeWidth="3" strokeDasharray="11 8" />
        <rect x="540" y="92" width="372" height="200" rx="28" fill="#eaf7f3" stroke="#addccb" strokeWidth="3" strokeDasharray="11 8" />
        <rect x="540" y="338" width="372" height="192" rx="28" fill="#fff3e2" stroke="#e8cda5" strokeWidth="3" strokeDasharray="11 8" />
      </g>

      <g opacity="0.9">
        <rect x="112" y="67" width="238" height="18" rx="9" fill="#d7e1e7" stroke="#a6bac9" strokeWidth="4" />
        <path d="M140 70v12M168 70v12M196 70v12M224 70v12M252 70v12M280 70v12M308 70v12" stroke="#eef4f5" strokeWidth="3" />
        <rect x="650" y="67" width="238" height="18" rx="9" fill="#d7e1e7" stroke="#a6bac9" strokeWidth="4" />
        <path d="M678 70v12M706 70v12M734 70v12M762 70v12M790 70v12M818 70v12M846 70v12" stroke="#eef4f5" strokeWidth="3" />
      </g>

      <g opacity="0.78">
        <path d="M562 116H670L702 138V238H562Z" fill="url(#office-glass-gradient)" stroke="#8eabb5" strokeWidth="3" />
        <path d="M615 116V238M670 116V238M562 178H702" fill="none" stroke="#abc8cc" strokeWidth="2" />
        <ellipse cx="634" cy="196" rx="42" ry="17" fill="#e8d1ad" stroke="#b48a55" strokeWidth="3" />
        <path d="M603 204v24M665 204v24" stroke="#7c8795" strokeWidth="4" />
        <rect x="582" y="184" width="15" height="15" rx="5" fill="#5f8cb3" />
        <rect x="671" y="184" width="15" height="15" rx="5" fill="#5f8cb3" />
      </g>

      <g filter="url(#office-soft-shadow)">
        <ellipse cx="183" cy="473" rx="76" ry="30" fill="#e9ddcd" opacity="0.8" />
        <path d="M118 442Q118 428 134 428H228Q244 428 244 442V470H118Z" fill="#fbf6ee" stroke="#cdbda8" strokeWidth="4" />
        <path d="M118 442h20v28h-20ZM224 442h20v28h-20Z" fill="#e8dac8" />
        <rect x="136" y="421" width="32" height="17" rx="8" fill="#b9cfae" />
        <rect x="190" y="421" width="32" height="17" rx="8" fill="#cfddc5" />
        <ellipse cx="182" cy="507" rx="38" ry="17" fill="#e7c891" stroke="#b68a54" strokeWidth="3" />
        <path d="M166 507v17M198 507v17" stroke="#9e734b" strokeWidth="3" />
        <circle cx="182" cy="499" r="8" fill="#80a66d" />
      </g>

      <g filter="url(#office-soft-shadow)">
        <rect x="770" y="405" width="40" height="106" rx="6" fill="#263548" stroke="#162333" strokeWidth="3" />
        <rect x="816" y="393" width="40" height="118" rx="6" fill="#2f3e51" stroke="#162333" strokeWidth="3" />
        <rect x="862" y="414" width="40" height="97" rx="6" fill="#263548" stroke="#162333" strokeWidth="3" />
        <path d="M782 424h16M782 437h16M828 412h16M828 425h16M874 433h16M874 446h16" stroke="#57c7b2" strokeWidth="4" strokeLinecap="round" />
        <path d="M782 467h16M828 458h16M874 471h16" stroke="#6d89a9" strokeWidth="4" strokeLinecap="round" />
        <rect x="754" y="512" width="158" height="11" rx="5" fill="#b6a999" opacity="0.6" />
      </g>

      <g opacity="0.85">
        <path d="M74 546q23-21 46 0M880 546q23-21 46 0" fill="none" stroke="#d7c4a5" strokeWidth="8" strokeLinecap="round" />
        <circle cx="84" cy="534" r="18" fill="#91bfa9" stroke="#6d9e88" strokeWidth="4" />
        <circle cx="112" cy="522" r="15" fill="#a5caae" stroke="#6d9e88" strokeWidth="4" />
        <circle cx="890" cy="534" r="18" fill="#91bfa9" stroke="#6d9e88" strokeWidth="4" />
        <circle cx="918" cy="522" r="15" fill="#a5caae" stroke="#6d9e88" strokeWidth="4" />
        <path d="M84 550v22M890 550v22" stroke="#bb8958" strokeWidth="8" strokeLinecap="round" />
      </g>

      <g filter="url(#office-soft-shadow)">
        <rect x="430" y="468" width="140" height="70" rx="16" fill="url(#office-wood-gradient)" stroke="#b98a53" strokeWidth="4" />
        <path d="M448 486h104M448 504h104M448 522h104" stroke="#f7dfb8" strokeWidth="7" strokeLinecap="round" opacity="0.84" />
      </g>

      <g>
        <rect x="428" y="82" width="144" height="106" rx="28" fill="url(#office-briefing-gradient)" stroke="#98ceb4" strokeWidth="4" />
        <ellipse cx="500" cy="138" rx="45" ry="23" fill="#b9dccd" stroke="#83b59e" strokeWidth="4" />
        <circle cx="474" cy="137" r="6" fill="#ffffff" opacity="0.9" />
        <circle cx="500" cy="128" r="6" fill="#ffffff" opacity="0.9" />
        <circle cx="526" cy="137" r="6" fill="#ffffff" opacity="0.9" />
      </g>
    </svg>
  );
}

function SceneZoneLabels() {
  return (
    <>
      {AGENT_ORDER.map((agentId) => {
        const layout = SCENE_LAYOUT[agentId];
        return (
          <div
            className={`office-scene__zone-label office-scene__zone-label--${agentId}`}
            key={agentId}
            style={pointStyle(layout.zoneLabel)}
            aria-hidden="true"
          >
            <strong>{layout.zoneName}</strong>
            <span>{layout.zoneDetail}</span>
          </div>
        );
      })}
    </>
  );
}

export default function OfficeScene({
  agents,
  reports,
  selectedAgent,
  reportsPending = false,
  reportsUnavailable = false
}: {
  agents: Agent[];
  reports: Report[];
  selectedAgent: AgentId | undefined;
  reportsPending?: boolean;
  reportsUnavailable?: boolean;
}) {
  const navigate = useNavigate();
  const latestReportsByAgent = useMemo(() => {
    const result = new Map<AgentId, Report>();
    for (const report of reports) {
      const current = result.get(report.agentId);
      if (!current || Date.parse(report.generatedAt) > Date.parse(current.generatedAt)) {
        result.set(report.agentId, report);
      }
    }
    return result;
  }, [reports]);

  function openProfile(agentId: AgentId, tab: OfficeProfileTab) {
    navigate(profilePath(agentId, tab));
  }

  function openReport(agent: Agent, report: Report) {
    navigate(`/reports/${report.id}`, {
      state: {
        from: profilePath(agent.id, "reports"),
        scrollY: window.scrollY
      }
    });
  }

  return (
    <section className="office-scene" aria-labelledby="office-scene-title">
      <div className="office-scene__heading">
        <div>
          <p className="eyebrow">Clickable office</p>
          <h2 id="office-scene-title">Four desks, one shared briefing area</h2>
        </div>
        <span className="office-scene__hint">Select a character, desk, or report</span>
      </div>

      <div className="office-scene__canvas" aria-describedby="office-scene-help">
        <OfficeRoomBackground />
        <SceneZoneLabels />

        <button
          className="office-scene__briefing"
          type="button"
          style={{ left: "50%", top: "22%" }}
          onClick={() => navigate("/reports")}
          aria-label="Open Reports for all analysts from the shared briefing area"
        >
          <span className="office-scene__briefing-icon" aria-hidden="true">↗</span>
          <span>
            <strong>Shared briefing</strong>
            <small>Open all reports</small>
          </span>
        </button>

        {agents.map((agent) => {
          const layout = SCENE_LAYOUT[agent.id];
          const report = latestReportsByAgent.get(agent.id);
          const selected = selectedAgent === agent.id;
          const reportLabel = report
            ? `${report.title} · ${report.readAt === null ? "unread" : "read"} · ${formatDateTime(report.generatedAt, report.metadata.timezone)}`
            : reportsUnavailable
              ? "Report shortcut unavailable"
              : reportsPending
                ? "Loading latest report"
                : "No report available";

          return (
            <div className="office-scene__agent-layer" key={agent.id}>
              <button
                className={`office-scene__desk office-scene__control office-scene__control--${agent.id}${selected ? " is-selected" : ""}`}
                type="button"
                style={pointStyle(layout.desk)}
                onClick={() => openProfile(agent.id, "assignment")}
                aria-pressed={selected}
                aria-label={`Open ${agent.displayName}'s assignment at the ${layout.zoneName.toLowerCase()}`}
              >
                <svg viewBox="0 0 192 128" role="presentation" aria-hidden="true">
                  <use href={deskAssetHref(agent.id)} />
                </svg>
              </button>

              <button
                className={`office-scene__character office-scene__control office-scene__control--${agent.id}${selected ? " is-selected" : ""}`}
                type="button"
                style={pointStyle(layout.character)}
                onClick={() => openProfile(agent.id, "overview")}
                aria-pressed={selected}
                aria-label={`Open ${agent.displayName}, ${agent.title}, ${agent.statusLabel}, on Overview`}
              >
                <span className={`office-scene__character-avatar office-scene__character-avatar--${agent.id}`}>
                  <svg viewBox="0 0 128 128" role="presentation" aria-hidden="true">
                    <use href={avatarAssetHref(agent.id, getAvatarPose(agent, report))} />
                  </svg>
                </span>
                <span className={`office-scene__status-dot office-scene__status-dot--${getStatusTone(agent.status)}`} aria-hidden="true" />
                <span className="office-scene__character-label">
                  <strong>{agent.displayName}</strong>
                  <small>{agent.statusLabel.replace(" · simulated", "")}</small>
                </span>
              </button>

              <button
                className={`office-scene__report office-scene__control${report?.readAt === null ? " is-unread" : ""}${!report ? " is-empty" : ""}`}
                type="button"
                style={pointStyle(layout.report)}
                onClick={() => report && openReport(agent, report)}
                disabled={!report}
                aria-label={report ? `Open ${agent.displayName}'s latest report: ${reportLabel}` : `${agent.displayName}: ${reportLabel}`}
                title={reportLabel}
              >
                <span className="office-scene__report-icon" aria-hidden="true">▤</span>
                <span>{report ? (report.readAt === null ? "New" : "Read") : reportsPending ? "…" : "—"}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="office-scene__help" id="office-scene-help">
        <span><strong>Character</strong> · Overview</span>
        <span><strong>Desk</strong> · Assignment</span>
        <span><strong>Report badge</strong> · Latest report</span>
      </div>
      {reportsUnavailable ? (
        <p className="office-scene__notice" role="status">Latest report shortcuts are unavailable; the accessible analyst list remains available below.</p>
      ) : null}
    </section>
  );
}
