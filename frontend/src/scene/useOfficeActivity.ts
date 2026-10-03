import { useEffect, useRef, useState } from "react";
import type { Agent, AgentId } from "@investment-office/shared";
import { OfficeActivityController } from "./officeActivityController";

export function useOfficeActivity({
  agents,
  unreadReportAgentIds,
  selectedAgent
}: {
  agents: readonly Pick<Agent, "id" | "status">[];
  unreadReportAgentIds: readonly AgentId[];
  selectedAgent: AgentId | undefined;
}) {
  const controllerRef = useRef<OfficeActivityController | null>(null);
  if (!controllerRef.current) controllerRef.current = new OfficeActivityController();
  const controller = controllerRef.current;
  const [snapshot, setSnapshot] = useState(controller.getSnapshot());
  const [reducedMotion, setReducedMotion] = useState(readReducedMotionPreference);

  useEffect(() => controller.subscribe(() => setSnapshot(controller.getSnapshot())), [controller]);

  useEffect(() => {
    controller.setAgents(agents, unreadReportAgentIds);
  }, [agents, controller, unreadReportAgentIds]);

  useEffect(() => {
    controller.setReducedMotion(reducedMotion);
  }, [controller, reducedMotion]);

  useEffect(() => {
    controller.setSelectedAgent(selectedAgent);
  }, [controller, selectedAgent]);

  useEffect(() => {
    function updateVisibility() {
      controller.setVisible(document.visibilityState === "visible");
    }

    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, [controller]);

  useEffect(() => {
    function updateMotionPreference() {
      setReducedMotion(readReducedMotionPreference());
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    mediaQuery.addEventListener("change", updateMotionPreference);
    window.addEventListener("office-motion-change", updateMotionPreference);
    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference);
      window.removeEventListener("office-motion-change", updateMotionPreference);
    };
  }, []);

  useEffect(() => () => controller.dispose(), [controller]);

  return {
    activityByAgent: snapshot,
    holdAgent: controller.setHeld.bind(controller)
  };
}

function readReducedMotionPreference(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  return document.documentElement.dataset.motion === "reduced"
    || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
