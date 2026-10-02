import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { Agent, AgentId, ExecutionStatus, Report, Run, Task } from "@investment-office/shared";
import { avatarAssetHref } from "../assets/officeAssets";
import { officeService } from "../demo";
import { useDemoRevision } from "../lib/demoHooks";
import { formatDateOnly, formatDateTime } from "../lib/formatters";
import type { ReportNavigationState } from "./reportNavigation";

export const PROFILE_TABS = ["overview", "assignment", "reports"] as const;
export type AnalystProfileTab = (typeof PROFILE_TABS)[number];

const PROFILE_TAB_LABELS: Record<AnalystProfileTab, string> = {
  overview: "Overview",
  assignment: "Assignment",
  reports: "Reports"
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The analyst profile service could not be reached.";
}

function getStatusTone(status: Agent["status"]): string {
  return status === "working" || status === "waiting" || status === "offline" ? status : "unknown";
}

function getRunStatusLabel(status: ExecutionStatus): string {
  const labels: Record<ExecutionStatus, string> = {
    queued: "Queued",
    running: "Running",
    succeeded: "Succeeded",
    failed: "Failed",
    cancelled: "Cancelled",
    interrupted: "Interrupted",
    skipped: "Skipped",
    unknown: "Unknown"
  };
  return labels[status];
}

function getRunStatusTone(status: ExecutionStatus): string {
  if (status === "succeeded") return "complete";
  if (status === "failed" || status === "cancelled" || status === "interrupted") return "error";
  if (status === "queued" || status === "running") return "active";
  return "unknown";
}

function getAvatarPose(agent: Agent): "idle" | "reading" | "typing" {
  if (agent.status === "working") return "typing";
  if (agent.status === "waiting") return "reading";
  return "idle";
}

function ProfileState({
  eyebrow,
  title,
  detail,
  action,
  className = ""
}: {
  eyebrow: string;
  title: string;
  detail: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`profile-state ${className}`.trim()} role="status">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{detail}</p>
      {action ? <div className="profile-state__actions">{action}</div> : null}
    </div>
  );
}

function ProfileHeader({
  agent,
  activeTab,
  headingRef
}: {
  agent: Agent;
  activeTab: AnalystProfileTab;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <>
      <Link className="profile-panel__back" to="/office">← Back to Office</Link>
      <header className="profile-panel__header">
        <div className="profile-identity">
          <span className={`profile-avatar profile-avatar--${agent.id}`} aria-hidden="true">
            <svg viewBox="0 0 128 128" role="presentation">
              <use href={avatarAssetHref(agent.id, getAvatarPose(agent))} />
            </svg>
          </span>
          <div className="profile-identity__copy">
            <p className="eyebrow">Analyst profile</p>
            <h1 id="analyst-profile-title" ref={headingRef} tabIndex={-1}>{agent.displayName}</h1>
            <p>{agent.title}</p>
          </div>
        </div>
        <Link className="profile-panel__close" to="/office" aria-label={`Close ${agent.displayName} profile`}>
          <span aria-hidden="true">×</span>
          <span>Close</span>
        </Link>
      </header>
      <div className="profile-status-row">
        <span className={`profile-status profile-status--${getStatusTone(agent.status)}`}>
          <span className="profile-status__dot" aria-hidden="true" />
          <span>{agent.statusLabel}</span>
        </span>
        <span className="profile-observation">
          <span>Latest observation</span>
          <strong>{agent.observedAt ? formatDateTime(agent.observedAt) : "Not observed"}</strong>
        </span>
      </div>
      <nav className="profile-tabs" aria-label={`${agent.displayName} profile sections`}>
        {PROFILE_TABS.map((tab) => (
          <Link
            key={tab}
            className={activeTab === tab ? "is-active" : ""}
            to={{ pathname: "/office", search: `?agent=${agent.id}&tab=${tab}` }}
            id={`profile-tab-${tab}`}
            aria-current={activeTab === tab ? "page" : undefined}
          >
            {PROFILE_TAB_LABELS[tab]}
          </Link>
        ))}
      </nav>
    </>
  );
}

function ProfileRunControl({
  agent,
  task,
  activeRun,
  latestRun,
  isRequesting,
  message,
  error,
  onRun
}: {
  agent: Agent;
  task: Task | null;
  activeRun: Run | null;
  latestRun: Run | null;
  isRequesting: boolean;
  message: string | null;
  error: string | null;
  onRun: () => void;
}) {
  const unavailable = !task || !task.enabled || agent.status === "offline";
  const disabled = unavailable || Boolean(activeRun) || isRequesting;
  const buttonLabel = isRequesting
    ? "Starting run…"
    : activeRun
      ? "Run in progress"
      : agent.status === "offline"
        ? "Unavailable offline"
        : task
          ? "Run now"
          : "No task available";

  return (
    <section className="profile-run-card" aria-labelledby="profile-run-title">
      <div className="profile-run-card__main">
        <p className="profile-card__eyebrow">Simulated execution</p>
        <h2 id="profile-run-title">Run this analyst now</h2>
        <p>
          {task
            ? `Queue “${task.name}” using the local demo adapter. No model, market-data, or OpenClaw request is made.`
            : "A task is not available for this analyst in the current demo scenario."}
        </p>
        <dl className="profile-run-card__facts">
          <div>
            <dt>Schedule</dt>
            <dd>{task?.scheduleLabel ?? "Not scheduled"}</dd>
          </div>
          <div>
            <dt>Next run</dt>
            <dd>{task?.nextRunAt ? formatDateTime(task.nextRunAt, task.timezone) : "Not scheduled"}</dd>
          </div>
          <div>
            <dt>Last state</dt>
            <dd>{latestRun ? getRunStatusLabel(latestRun.executionStatus) : "No run history"}</dd>
          </div>
        </dl>
      </div>
      <div className="profile-run-card__action">
        <button className="primary-button" type="button" onClick={onRun} disabled={disabled}>
          {buttonLabel}
        </button>
        {activeRun ? (
          <span className={`run-status run-status--${getRunStatusTone(activeRun.executionStatus)}`} role="status">
            {getRunStatusLabel(activeRun.executionStatus)} · {activeRun.id}
          </span>
        ) : null}
        {message ? <span className="profile-run-card__message" role="status">{message}</span> : null}
        {error ? <span className="profile-run-card__error" role="alert">{error}</span> : null}
      </div>
    </section>
  );
}

function ProfileFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function reportNavigation(agentId: AgentId, tab: AnalystProfileTab): ReportNavigationState {
  return {
    from: `/office?agent=${agentId}&tab=${tab}`,
    scrollY: window.scrollY
  };
}

function ProfileReportLink({
  report,
  agent,
  tab = "reports"
}: {
  report: Report;
  agent: Agent;
  tab?: AnalystProfileTab;
}) {
  return (
    <Link
      className="profile-report-row"
      to={`/reports/${report.id}`}
      state={reportNavigation(agent.id, tab)}
      aria-label={`${report.title}, generated ${formatDateTime(report.generatedAt, report.metadata.timezone)}`}
    >
      <span className="profile-report-row__marker" aria-hidden="true">{report.readAt ? "✓" : ""}</span>
      <span className="profile-report-row__main">
        <strong>{report.title}</strong>
        <span>{report.summary}</span>
      </span>
      <span className="profile-report-row__date">
        {report.readAt === null ? <span className="status-pill status-pill--new">Unread</span> : null}
        <time dateTime={report.generatedAt}>{formatDateOnly(report.generatedAt, report.metadata.timezone)}</time>
      </span>
    </Link>
  );
}

function OverviewTab({ agent, task, latestReport }: { agent: Agent; task: Task | null; latestReport: Report | null }) {
  return (
    <div className="profile-tab-panel" role="tabpanel" aria-labelledby="profile-tab-overview" tabIndex={-1}>
      <div className="profile-card-grid">
        <section className="profile-card profile-card--wide">
          <div className="profile-card__heading">
            <div>
              <p className="profile-card__eyebrow">Responsibility</p>
              <h2>What {agent.displayName} covers</h2>
            </div>
            <span className="mode-chip"><span className="mode-chip__dot" aria-hidden="true" /> Demo</span>
          </div>
          <p className="profile-card__lead">{agent.responsibility}</p>
          <dl className="profile-facts">
            <ProfileFact label="Agent ID"><code>{agent.id}</code></ProfileFact>
            <ProfileFact label="Status label">{agent.statusLabel}</ProfileFact>
            <ProfileFact label="Observed at">{agent.observedAt ? formatDateTime(agent.observedAt) : "Not observed"}</ProfileFact>
          </dl>
        </section>
        <section className="profile-card">
          <p className="profile-card__eyebrow">Current task</p>
          <h2>{task?.name ?? "No task assigned"}</h2>
          <p>{task?.purpose ?? "No assignment is available for this analyst in the current scenario."}</p>
          <dl className="profile-facts profile-facts--stacked">
            <ProfileFact label="Next run">{task?.nextRunAt ? formatDateTime(task.nextRunAt, task.timezone) : "Not scheduled"}</ProfileFact>
            <ProfileFact label="Timezone">{task?.timezone ?? "Not set"}</ProfileFact>
          </dl>
        </section>
      </div>
      <section className="profile-card profile-card--preview">
        <div className="profile-card__heading">
          <div>
            <p className="profile-card__eyebrow">Latest report</p>
            <h2>Recent output from {agent.displayName}</h2>
          </div>
          <Link className="text-button" to={`/office?agent=${agent.id}&tab=reports`}>View all</Link>
        </div>
        {latestReport ? (
          <ProfileReportLink report={latestReport} agent={agent} tab="overview" />
        ) : (
          <p className="profile-card__empty">No reports have been generated for this analyst in the current demo scenario.</p>
        )}
      </section>
    </div>
  );
}

function AssignmentTab({ agent, task }: { agent: Agent; task: Task | null }) {
  if (!task) {
    return (
      <div className="profile-tab-panel" role="tabpanel" aria-labelledby="profile-tab-assignment" tabIndex={-1}>
        <ProfileState
          eyebrow="No assignment"
          title={`${agent.displayName} has no task configured`}
          detail="The profile remains available, but there is no verified task or schedule to run in this demo scenario."
        />
      </div>
    );
  }

  return (
    <div className="profile-tab-panel" role="tabpanel" aria-labelledby="profile-tab-assignment" tabIndex={-1}>
      <div className="profile-card-grid profile-card-grid--assignment">
        <section className="profile-card profile-card--wide">
          <p className="profile-card__eyebrow">Assignment</p>
          <h2>{task.name}</h2>
          <p className="profile-card__lead">{task.purpose}</p>
          <div className="profile-subsection">
            <h3>Task inputs</h3>
            <ul className="profile-bullet-list">
              {task.inputs.map((input) => <li key={input}>{input}</li>)}
            </ul>
          </div>
        </section>
        <aside className={`profile-guidance${task.missingInputs.length > 0 ? " profile-guidance--attention" : ""}`}>
          <p className="profile-card__eyebrow">Before a live run</p>
          <h2>Missing-input guidance</h2>
          {task.missingInputs.length > 0 ? (
            <ul className="profile-bullet-list">
              {task.missingInputs.map((input) => <li key={input}>{input}</li>)}
            </ul>
          ) : (
            <p>No missing inputs are recorded for this task.</p>
          )}
          <p className="profile-guidance__note">The demo uses fictional fixtures and does not infer or request personal holdings.</p>
        </aside>
      </div>
      <section className="profile-card profile-card--schedule">
        <div>
          <p className="profile-card__eyebrow">Schedule</p>
          <h2>{task.scheduleLabel}</h2>
          <p>Times are displayed in {task.timezone}. A schedule label is descriptive in demo mode; it does not start a background job.</p>
        </div>
        <dl className="profile-facts profile-facts--schedule">
          <ProfileFact label="Enabled">{task.enabled ? "Yes · simulated" : "No · disabled"}</ProfileFact>
          <ProfileFact label="Next run">{task.nextRunAt ? formatDateTime(task.nextRunAt, task.timezone) : "Not scheduled"}</ProfileFact>
        </dl>
      </section>
    </div>
  );
}

function ReportsTab({
  agent,
  reports,
  reportsPending,
  reportsError,
  refetchReports,
  runs,
  runsPending,
  runsError,
  refetchRuns
}: {
  agent: Agent;
  reports: Report[];
  reportsPending: boolean;
  reportsError: unknown;
  refetchReports: () => void;
  runs: Run[];
  runsPending: boolean;
  runsError: unknown;
  refetchRuns: () => void;
}) {
  return (
    <div className="profile-tab-panel" role="tabpanel" aria-labelledby="profile-tab-reports" tabIndex={-1}>
      <div className="profile-history-grid">
        <section className="profile-card">
          <div className="profile-card__heading">
            <div>
              <p className="profile-card__eyebrow">Recent reports</p>
              <h2>Outputs from {agent.displayName}</h2>
            </div>
            <Link className="text-button" to={`/reports?agent=${agent.id}`}>Open Reports</Link>
          </div>
          {reportsPending ? (
            <div className="profile-list-skeleton" aria-label="Loading recent reports" aria-busy="true">
              <span /><span /><span />
            </div>
          ) : reportsError ? (
            <ProfileState
              eyebrow="Unavailable"
              title="Reports could not be loaded"
              detail={`${getErrorMessage(reportsError)} Retry without leaving the profile.`}
              action={<button className="secondary-button" type="button" onClick={refetchReports}>Retry</button>}
            />
          ) : reports.length === 0 ? (
            <p className="profile-card__empty">No reports have been generated for this analyst in the current demo scenario.</p>
          ) : (
            <div className="profile-report-list" role="list" aria-label={`${agent.displayName} recent reports`}>
              {reports.map((report) => <ProfileReportLink key={report.id} report={report} agent={agent} />)}
            </div>
          )}
        </section>
        <section className="profile-card">
          <div className="profile-card__heading">
            <div>
              <p className="profile-card__eyebrow">Run history</p>
              <h2>Execution records</h2>
            </div>
            <span className="profile-card__count">{runs.length > 6 ? "6 latest" : `${runs.length} shown`}</span>
          </div>
          {runsPending ? (
            <div className="profile-list-skeleton" aria-label="Loading run history" aria-busy="true">
              <span /><span /><span />
            </div>
          ) : runsError ? (
            <ProfileState
              eyebrow="Unavailable"
              title="Run history could not be loaded"
              detail={`${getErrorMessage(runsError)} Retry without changing task state.`}
              action={<button className="secondary-button" type="button" onClick={refetchRuns}>Retry</button>}
            />
          ) : runs.length === 0 ? (
            <p className="profile-card__empty">No execution records are available for this analyst yet.</p>
          ) : (
            <div className="profile-run-list" role="list" aria-label={`${agent.displayName} run history`}>
              {runs.slice(0, 6).map((run) => {
                return (
                  <article className="profile-run-row" key={run.id} role="listitem">
                    <div className="profile-run-row__topline">
                      <span className={`run-status run-status--${getRunStatusTone(run.executionStatus)}`}>
                        {getRunStatusLabel(run.executionStatus)}
                      </span>
                      <code>{run.id}</code>
                    </div>
                    <time dateTime={run.queuedAt}>Queued {formatDateTime(run.queuedAt)}</time>
                    {run.finishedAt ? <time dateTime={run.finishedAt}>Finished {formatDateTime(run.finishedAt)}</time> : null}
                    {run.errorSummary ? <p className="profile-run-row__error">{run.errorSummary}</p> : null}
                    {run.reportId ? (
                      <Link to={`/reports/${run.reportId}`} state={reportNavigation(agent.id, "reports")}>Open report</Link>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ProfileLoadingPanel() {
  return (
    <section className="profile-panel profile-panel--loading" aria-busy="true">
      <Link className="profile-panel__back" to="/office">← Back to Office</Link>
      <div className="profile-loading__identity">
        <span className="skeleton profile-loading__avatar" />
        <div><span className="skeleton profile-loading__kicker" /><span className="skeleton profile-loading__name" /><span className="skeleton profile-loading__title" /></div>
      </div>
      <span className="skeleton profile-loading__tabs" />
      <span className="skeleton profile-loading__card" />
      <span className="skeleton profile-loading__card profile-loading__card--short" />
    </section>
  );
}

export default function AnalystProfilePanel({ agentId, tab }: { agentId: AgentId; tab: AnalystProfileTab }) {
  const revision = useDemoRevision();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusedAgent = useRef<AgentId | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const agentQuery = useQuery({
    queryKey: ["agent", agentId, revision],
    queryFn: () => officeService.getAgent(agentId)
  });
  const tasksQuery = useQuery({
    queryKey: ["tasks", agentId, revision],
    queryFn: () => officeService.listTasks(agentId)
  });
  const reportsQuery = useQuery({
    queryKey: ["agent-reports", agentId, revision],
    queryFn: () => officeService.listReports({ agentId, pageSize: 5 })
  });
  const runsQuery = useQuery({
    queryKey: ["agent-runs", agentId, revision],
    queryFn: () => officeService.listRuns(agentId)
  });

  const agent = agentQuery.data?.data ?? null;
  const tasks = tasksQuery.data?.data ?? [];
  const task = useMemo(
    () => tasks.find((candidate) => candidate.id === agent?.currentTaskId) ?? tasks[0] ?? null,
    [agent?.currentTaskId, tasks]
  );
  const reports = reportsQuery.data?.data.items ?? [];
  const runs = runsQuery.data?.data ?? [];
  const activeRun = useMemo(
    () => runs.find((run) => run.taskId === task?.id && (run.executionStatus === "queued" || run.executionStatus === "running")) ?? null,
    [runs, task?.id]
  );
  const latestRun = runs[0] ?? null;
  const latestReport = reports[0] ?? null;

  useEffect(() => {
    if (!agent || focusedAgent.current === agent.id) return;
    focusedAgent.current = agent.id;
    headingRef.current?.focus({ preventScroll: true });
  }, [agent]);

  async function requestRun() {
    if (!task || isRequesting || activeRun || agent?.status === "offline") return;
    setIsRequesting(true);
    setRunMessage(null);
    setRunError(null);
    const idempotencyKey = `profile-${task.id}-${Date.now()}`;
    try {
      const result = await officeService.requestRun(task.id, idempotencyKey);
      setRunMessage(result.data.reused ? `Existing demo run ${result.data.run.id} is still active.` : `Demo run ${result.data.run.id} queued.`);
    } catch (error: unknown) {
      setRunError(getErrorMessage(error));
    } finally {
      setIsRequesting(false);
    }
  }

  if (agentQuery.isPending) return <ProfileLoadingPanel />;

  if (agentQuery.isError) {
    return (
      <section className="profile-panel">
        <Link className="profile-panel__back" to="/office">← Back to Office</Link>
        <ProfileState
          eyebrow="Unavailable"
          title="Analyst profile could not be loaded"
          detail={`${getErrorMessage(agentQuery.error)} The office roster remains available.`}
          action={<button className="secondary-button" type="button" onClick={() => void agentQuery.refetch()}>Retry</button>}
        />
      </section>
    );
  }

  if (!agent) {
    return (
      <section className="profile-panel">
        <Link className="profile-panel__back" to="/office">← Back to Office</Link>
        <ProfileState
          eyebrow="Not found"
          title="That analyst is not configured"
          detail="The profile link may be stale or the analyst may not be part of the current demo scenario."
        />
      </section>
    );
  }

  return (
    <section className="profile-panel" aria-labelledby="analyst-profile-title">
      <ProfileHeader agent={agent} activeTab={tab} headingRef={headingRef} />
      <ProfileRunControl
        agent={agent}
        task={task}
        activeRun={activeRun}
        latestRun={latestRun}
        isRequesting={isRequesting}
        message={runMessage}
        error={runError}
        onRun={() => void requestRun()}
      />
      {tab === "overview" ? (
        <OverviewTab agent={agent} task={task} latestReport={latestReport} />
      ) : tab === "assignment" ? (
        <AssignmentTab agent={agent} task={task} />
      ) : (
        <ReportsTab
          agent={agent}
          reports={reports}
          reportsPending={reportsQuery.isPending}
          reportsError={reportsQuery.error}
          refetchReports={() => void reportsQuery.refetch()}
          runs={runs}
          runsPending={runsQuery.isPending}
          runsError={runsQuery.error}
          refetchRuns={() => void runsQuery.refetch()}
        />
      )}
    </section>
  );
}
