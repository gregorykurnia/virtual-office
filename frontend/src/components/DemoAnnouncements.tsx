import { useEffect, useRef, useState } from "react";
import type { Agent, Report, Run } from "@investment-office/shared";
import { officeService } from "../demo";
import { useDemoRevision } from "../lib/demoHooks";

type DemoAnnouncementSnapshot = {
  agents: Map<Agent["id"], Agent["displayName"]>;
  reports: Map<string, Report>;
  runs: Map<string, Run>;
};

function announceRunChange(
  run: Run,
  previous: Run | undefined,
  agentName: string,
  report: Report | undefined
): string | null {
  if (previous && previous.executionStatus === run.executionStatus) return null;

  switch (run.executionStatus) {
    case "queued":
      return `${agentName}'s demo run ${run.id} is queued.`;
    case "running":
      return `${agentName}'s demo run ${run.id} is running.`;
    case "succeeded":
      return report
        ? `${agentName}'s demo run ${run.id} succeeded. New report ready: ${report.title}.`
        : `${agentName}'s demo run ${run.id} succeeded.`;
    case "failed":
      return `${agentName}'s demo run ${run.id} failed. ${run.errorSummary ?? "No report was produced."}`;
    case "interrupted":
      return `${agentName}'s demo run ${run.id} was interrupted. ${run.errorSummary ?? "No report was produced."}`;
    case "cancelled":
      return `${agentName}'s demo run ${run.id} was cancelled.`;
    case "skipped":
      return `${agentName}'s demo run ${run.id} was skipped.`;
    case "unknown":
      return `${agentName}'s demo run ${run.id} has an unknown status.`;
  }
}

function createSnapshot(
  agents: Agent[],
  reports: Report[],
  runs: Run[]
): DemoAnnouncementSnapshot {
  return {
    agents: new Map(agents.map((agent) => [agent.id, agent.displayName] as const)),
    reports: new Map(reports.map((report) => [report.id, report] as const)),
    runs: new Map(runs.map((run) => [run.id, run] as const))
  };
}

function findAnnouncement(
  previous: DemoAnnouncementSnapshot,
  current: DemoAnnouncementSnapshot
): string | null {
  const changedRuns = [...current.runs.values()]
    .map((run) => ({
      run,
      previous: previous.runs.get(run.id),
      agentName: current.agents.get(run.agentId) ?? "An analyst",
      report: run.reportId ? current.reports.get(run.reportId) : undefined
    }))
    .filter(({ run, previous: previousRun }) => !previousRun || run.executionStatus !== previousRun.executionStatus);

  for (const change of changedRuns) {
    const message = announceRunChange(change.run, change.previous, change.agentName, change.report);
    if (message) return message;
  }

  const newReport = [...current.reports.values()].find((report) => !previous.reports.has(report.id));
  if (newReport) {
    const agentName = current.agents.get(newReport.agentId) ?? "An analyst";
    return `New report from ${agentName}: ${newReport.title}.`;
  }

  return null;
}

export default function DemoAnnouncements() {
  const revision = useDemoRevision();
  const previousSnapshot = useRef<DemoAnnouncementSnapshot | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      officeService.listAgents(),
      officeService.listReports({ pageSize: 50 }),
      officeService.listRuns()
    ]).then(([agentsResult, reportsResult, runsResult]) => {
      if (cancelled) return;

      const currentSnapshot = createSnapshot(
        agentsResult.data,
        reportsResult.data.items,
        runsResult.data
      );
      const previous = previousSnapshot.current;
      previousSnapshot.current = currentSnapshot;
      if (!previous) return;

      setMessage(findAnnouncement(previous, currentSnapshot) ?? "");
    }).catch(() => {
      // The existing service status surfaces describe unavailable demo data.
      // An announcement is intentionally omitted when the snapshot cannot be read.
    });

    return () => {
      cancelled = true;
    };
  }, [revision]);

  return (
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </p>
  );
}
