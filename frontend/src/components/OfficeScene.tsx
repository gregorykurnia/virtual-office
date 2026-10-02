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
          <stop offset="0" stopColor="#e9eef5" />
          <stop offset="0.52" stopColor="#f8fafc" />
          <stop offset="1" stopColor="#e4ecf4" />
        </linearGradient>
        <pattern id="office-floor-grid" width="58" height="58" patternUnits="userSpaceOnUse">
          <path d="M 58 0 L 0 0 0 58" fill="none" stroke="#dfe7ee" strokeWidth="2" />
        </pattern>
        <linearGradient id="office-briefing-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dff1ea" />
          <stop offset="1" stopColor="#c5e5d7" />
        </linearGradient>
      </defs>

      <rect width="1000" height="620" fill="url(#office-room-gradient)" />
      <rect x="26" y="24" width="948" height="572" rx="34" fill="#f9fcfd" stroke="#cbd6e1" strokeWidth="4" />
      <rect x="52" y="50" width="896" height="520" rx="24" fill="url(#office-floor-grid)" opacity="0.74" />
      <path d="M508 48 L508 572" stroke="#edf2f5" strokeWidth="72" opacity="0.92" />
      <path d="M52 310 L948 310" stroke="#eef3f6" strokeWidth="40" opacity="0.82" />

      <rect x="96" y="94" width="364" height="196" rx="26" fill="#edf3ff" stroke="#b7c9ef" strokeWidth="3" strokeDasharray="10 8" />
      <rect x="96" y="342" width="364" height="184" rx="26" fill="#f3efff" stroke="#d6caef" strokeWidth="3" strokeDasharray="10 8" />
      <rect x="540" y="94" width="364" height="196" rx="26" fill="#ecf8f4" stroke="#b8dfd1" strokeWidth="3" strokeDasharray="10 8" />
      <rect x="540" y="342" width="364" height="184" rx="26" fill="#fff4e7" stroke="#ebd2ad" strokeWidth="3" strokeDasharray="10 8" />

      <rect x="428" y="82" width="144" height="106" rx="26" fill="url(#office-briefing-gradient)" stroke="#a8d2c0" strokeWidth="3" />
      <ellipse cx="500" cy="138" rx="45" ry="23" fill="#b9dccd" stroke="#83b59e" strokeWidth="4" />
      <circle cx="474" cy="137" r="6" fill="#ffffff" opacity="0.85" />
      <circle cx="500" cy="128" r="6" fill="#ffffff" opacity="0.85" />
      <circle cx="526" cy="137" r="6" fill="#ffffff" opacity="0.85" />

      <g fill="#d8e4ee" stroke="#a7bacb" strokeWidth="4">
        <rect x="72" y="70" width="126" height="14" rx="7" />
        <rect x="802" y="70" width="126" height="14" rx="7" />
      </g>
      <g fill="#9bc9b6" stroke="#78a895" strokeWidth="4">
        <circle cx="82" cy="548" r="18" />
        <circle cx="111" cy="538" r="14" />
        <circle cx="890" cy="548" r="19" />
        <circle cx="919" cy="538" r="13" />
      </g>
      <g fill="#bd8e65">
        <rect x="83" y="554" width="8" height="22" rx="4" />
        <rect x="895" y="554" width="8" height="22" rx="4" />
      </g>
      <rect x="458" y="464" width="84" height="62" rx="12" fill="#dcb77e" stroke="#c29a61" strokeWidth="4" />
      <path d="M470 480h60M470 496h60M470 512h60" stroke="#f0d0a1" strokeWidth="7" strokeLinecap="round" />
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
