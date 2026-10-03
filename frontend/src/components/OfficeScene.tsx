import { useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import type { Agent, AgentId, Report } from "@investment-office/shared";
import { avatarAssetHref, OFFICE_ENVIRONMENT_ASSET, type AvatarPose } from "../assets/officeAssets";
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
  stationName: string;
};

/**
 * Coordinates are normalized against OFFICE_ENVIRONMENT_ASSET. Keeping the
 * image and all semantic controls in the same 0–100 frame prevents drift when
 * the scene scales from a desktop card to a phone.
 */
const SCENE_LAYOUT: Record<AgentId, SceneAgentLayout> = {
  market: {
    desk: { x: 47, y: 41 },
    character: { x: 43, y: 48 },
    report: { x: 53, y: 38 },
    stationName: "left rear workstation"
  },
  portfolio: {
    desk: { x: 38, y: 53 },
    character: { x: 34, y: 59 },
    report: { x: 44, y: 50 },
    stationName: "left front workstation"
  },
  research: {
    desk: { x: 62, y: 44 },
    character: { x: 66, y: 50 },
    report: { x: 69, y: 40 },
    stationName: "right rear workstation"
  },
  risk: {
    desk: { x: 59, y: 57 },
    character: { x: 64, y: 64 },
    report: { x: 69, y: 54 },
    stationName: "right front workstation"
  }
};

const SCENE_LANDMARKS = [
  { id: "lounge", point: { x: 17, y: 18 }, label: "Lounge", detail: "Quiet review" },
  { id: "meeting", point: { x: 67, y: 14 }, label: "Meeting room", detail: "Shared briefing" },
  { id: "work", point: { x: 38, y: 31 }, label: "Work floor", detail: "Four analyst stations" },
  { id: "reception", point: { x: 15, y: 65 }, label: "Reception", detail: "Office entrance" },
  { id: "servers", point: { x: 80, y: 73 }, label: "Server corner", detail: "Operations" }
] as const;

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
  const [artState, setArtState] = useState<"loading" | "ready" | "error">("loading");

  return (
    <>
      <picture className={`office-scene__environment${artState === "error" ? " is-error" : ""}`}>
        <source srcSet={OFFICE_ENVIRONMENT_ASSET.webp} type="image/webp" />
        <img
          className="office-scene__environment-image"
          src={OFFICE_ENVIRONMENT_ASSET.fallback}
          alt=""
          width={OFFICE_ENVIRONMENT_ASSET.width}
          height={OFFICE_ENVIRONMENT_ASSET.height}
          decoding="async"
          onLoad={() => setArtState("ready")}
          onError={() => setArtState("error")}
        />
      </picture>
      {artState === "loading" ? <div className="office-scene__art-loading" aria-hidden="true" /> : null}
      {artState === "error" ? (
        <div className="office-scene__art-fallback" role="status">
          <strong>Office artwork unavailable</strong>
          <span>The analyst controls remain available below.</span>
        </div>
      ) : null}
    </>
  );
}

function SceneLandmarkLabels() {
  return (
    <>
      {SCENE_LANDMARKS.map((landmark) => (
        <div
          className={`office-scene__landmark-label office-scene__landmark-label--${landmark.id}`}
          key={landmark.id}
          style={pointStyle(landmark.point)}
          aria-hidden="true"
        >
          <strong>{landmark.label}</strong>
          <span>{landmark.detail}</span>
        </div>
      ))}
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
        <SceneLandmarkLabels />

        <button
          className="office-scene__briefing"
          type="button"
          style={pointStyle({ x: 82, y: 41 })}
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
                aria-label={`Open ${agent.displayName}'s assignment at the ${layout.stationName}`}
              />

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
        <span><strong>Briefing</strong> · All reports</span>
      </div>
      {reportsUnavailable ? (
        <p className="office-scene__notice" role="status">Latest report shortcuts are unavailable; the accessible analyst list remains available below.</p>
      ) : null}
    </section>
  );
}
