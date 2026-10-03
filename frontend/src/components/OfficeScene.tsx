import { useMemo, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Agent, AgentId, Report } from "@investment-office/shared";
import { OFFICE_ENVIRONMENT_ASSET, type AvatarPose } from "../assets/officeAssets";
import { formatDateTime } from "../lib/formatters";
import AnalystAvatar from "./AnalystAvatar";

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
  { id: "lounge", point: { x: 17, y: 18 }, label: "Lounge" },
  { id: "meeting", point: { x: 67, y: 14 }, label: "Meeting room" },
  { id: "work", point: { x: 38, y: 31 }, label: "Work floor" },
  { id: "reception", point: { x: 15, y: 65 }, label: "Reception" },
  { id: "servers", point: { x: 80, y: 73 }, label: "Server corner" }
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

function formatAgentNames(names: string[]): string {
  if (names.length === 1) return names[0]!;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
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

function SceneLandmarkLabels({ visible }: { visible: boolean }) {
  if (!visible) return null;

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
  const [showLabels, setShowLabels] = useState(false);
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

  const missingReportNames = agents
    .filter((agent) => !latestReportsByAgent.has(agent.id))
    .map((agent) => agent.displayName);
  const sceneNotice = reportsUnavailable
    ? "Latest report shortcuts are unavailable; the accessible analyst list remains available below."
    : reportsPending
      ? "Latest report shortcuts are loading."
      : missingReportNames.length > 0
        ? `No latest report is available for ${formatAgentNames(missingReportNames)}. Open an analyst profile for more detail.`
        : null;

  return (
    <section className="office-scene" aria-labelledby="office-scene-title">
      <div className="office-scene__heading">
        <div>
          <p className="eyebrow">Office floor</p>
          <h2 id="office-scene-title">Four desks, shared workspace</h2>
        </div>
        <div className="office-scene__heading-actions">
          <button
            className="office-scene__label-toggle"
            type="button"
            aria-pressed={showLabels}
            aria-controls="office-scene-canvas"
            onClick={() => setShowLabels((current) => !current)}
          >
            {showLabels ? "Hide labels" : "Show labels"}
          </button>
          <Link className="office-scene__reports-link" to="/reports">All reports <span aria-hidden="true">↗</span></Link>
        </div>
      </div>

      <div className="office-scene__canvas" id="office-scene-canvas" aria-describedby="office-scene-help">
        <OfficeRoomBackground />
        <SceneLandmarkLabels visible={showLabels} />

        {agents.map((agent) => {
          const layout = SCENE_LAYOUT[agent.id];
          const report = latestReportsByAgent.get(agent.id);
          const selected = selectedAgent === agent.id;
          const reportState = report?.readAt === null ? "Unread" : "Read";
          const reportLabel = report
            ? `Open ${agent.displayName}'s latest report: ${report.title}. ${reportState}. Generated ${formatDateTime(report.generatedAt, report.metadata.timezone)}.`
            : reportsUnavailable
              ? `${agent.displayName}'s latest report is unavailable.`
              : reportsPending
                ? `${agent.displayName}'s latest report is loading.`
                : `${agent.displayName} has no latest report available.`;

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
                <AnalystAvatar
                  agentId={agent.id}
                  pose={getAvatarPose(agent, report)}
                  context="scene"
                  className="office-scene__character-avatar"
                  eager
                />
                <span className={`office-scene__status-dot office-scene__status-dot--${getStatusTone(agent.status)}`} aria-hidden="true" />
                <span className="office-scene__character-label">
                  <strong>{agent.displayName}</strong>
                  <span className="office-scene__status-tooltip" aria-hidden="true">{agent.statusLabel.replace(" · simulated", "")}</span>
                </span>
              </button>

              {report ? (
                <button
                  className={`office-scene__report office-scene__control${report.readAt === null ? " is-unread" : ""}`}
                  type="button"
                  style={pointStyle(layout.report)}
                  onClick={() => openReport(agent, report)}
                  aria-label={reportLabel}
                  title={reportLabel}
                >
                  <span className="office-scene__report-icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20" focusable="false">
                      <path d="M6 2.75h5.35L15.5 6.9v10.35H6z" />
                      <path d="M11.25 2.75V7h4.25M8.25 10h5M8.25 12.75h5" />
                    </svg>
                  </span>
                  {report.readAt === null ? <span className="office-scene__report-unread" aria-hidden="true" /> : null}
                  <span className="office-scene__report-tooltip" aria-hidden="true">{agent.displayName} · Open latest report · {report.readAt === null ? "Unread" : "Read"}</span>
                </button>
              ) : reportsPending ? (
                <span className="office-scene__report-state office-scene__report-state--loading" style={pointStyle(layout.report)} aria-hidden="true">
                  <span className="office-scene__report-state-icon" />
                </span>
              ) : reportsUnavailable ? (
                <span className="office-scene__report-state office-scene__report-state--unavailable" style={pointStyle(layout.report)} aria-hidden="true" title={reportLabel}>
                  <span className="office-scene__report-state-icon" aria-hidden="true">!</span>
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="office-scene__help" id="office-scene-help">
        <span><strong>Character</strong> · Overview</span>
        <span><strong>Desk</strong> · Assignment</span>
        <span><strong>Document</strong> · Latest report</span>
        <span><strong>All reports</strong> · Reports list</span>
      </div>
      {sceneNotice ? <p className="office-scene__notice" role="status">{sceneNotice}</p> : null}
    </section>
  );
}
