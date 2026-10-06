import { AGENT_IDS, type Agent, type AgentId } from "@investment-office/shared";
import {
  advanceAvatarBehavior,
  createAvatarBehaviorState,
  createSeededRandom,
  holdBehaviorState,
  resumeBehaviorState,
  type AvatarBehaviorState
} from "./avatarBehavior";

export type ActivityAgentInput = Pick<Agent, "id" | "status">;
export type ActivityListener = () => void;

const AGENT_SEEDS: Record<AgentId, number> = {
  market: 0x524558,
  portfolio: 0x41445249,
  research: 0x434c4152,
  risk: 0x5448454f
};

export class OfficeActivityController {
  private readonly now: () => number;
  private readonly randomByAgent = new Map<AgentId, ReturnType<typeof createSeededRandom>>();
  private readonly listeners = new Set<ActivityListener>();
  private readonly agents = new Map<AgentId, ActivityAgentInput>();
  private readonly states = new Map<AgentId, AvatarBehaviorState>();
  private readonly heldAgents = new Set<AgentId>();
  private unreadReports = new Set<AgentId>();
  private snapshot: ReadonlyMap<AgentId, AvatarBehaviorState> = new Map();
  private selectedAgent: AgentId | undefined;
  private reducedMotion = false;
  private visible = true;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(now: () => number = () => Date.now()) {
    this.now = now;
    for (const agentId of AGENT_IDS) {
      this.randomByAgent.set(agentId, createSeededRandom(AGENT_SEEDS[agentId]));
    }
  }

  subscribe(listener: ActivityListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): ReadonlyMap<AgentId, AvatarBehaviorState> {
    return this.snapshot;
  }

  setAgents(agents: readonly ActivityAgentInput[], unreadReportAgentIds: readonly AgentId[] = []): void {
    const now = this.now();
    const nextIds = new Set(agents.map((agent) => agent.id));
    let changed = false;

    for (const agentId of this.agents.keys()) {
      if (!nextIds.has(agentId)) {
        this.agents.delete(agentId);
        this.states.delete(agentId);
        this.heldAgents.delete(agentId);
        changed = true;
      }
    }

    this.unreadReports = new Set(unreadReportAgentIds);
    for (const agent of agents) {
      const previous = this.agents.get(agent.id);
      this.agents.set(agent.id, agent);
      const random = this.randomByAgent.get(agent.id)!;
      if (!previous || previous.status !== agent.status || !this.states.has(agent.id)) {
        this.states.set(agent.id, createAvatarBehaviorState(
          agent.id,
          agent.status,
          now,
          random,
          this.reducedMotion,
          this.unreadReports.has(agent.id)
        ));
        changed = true;
      } else {
        const current = this.states.get(agent.id)!;
        const updated = advanceAvatarBehavior(
          current,
          agent.status,
          now,
          random,
          this.reducedMotion,
          this.unreadReports.has(agent.id)
        );
        if (!sameState(current, updated)) {
          this.states.set(agent.id, updated);
          changed = true;
        }
      }
    }

    if (changed) this.publish();
    this.schedule();
  }

  setReducedMotion(reducedMotion: boolean): void {
    if (this.reducedMotion === reducedMotion) return;
    this.reducedMotion = reducedMotion;
    const now = this.now();

    for (const agent of this.agents.values()) {
      const random = this.randomByAgent.get(agent.id)!;
      this.states.set(agent.id, createAvatarBehaviorState(
        agent.id,
        agent.status,
        now,
        random,
        reducedMotion,
        this.unreadReports.has(agent.id)
      ));
    }

    this.publish();
    this.schedule();
  }

  setSelectedAgent(agentId: AgentId | undefined): void {
    if (this.selectedAgent === agentId) return;
    const previous = this.selectedAgent;
    this.selectedAgent = agentId;
    const now = this.now();

    for (const candidate of [previous, agentId]) {
      if (!candidate) continue;
      const agent = this.agents.get(candidate);
      const state = this.states.get(candidate);
      if (!agent || !state) continue;
      const random = this.randomByAgent.get(candidate)!;
      this.states.set(candidate, candidate === agentId
        ? holdBehaviorState(state, now)
        : resumeBehaviorState(state, agent.status, now, random, this.unreadReports.has(candidate)));
    }

    this.publish();
    this.schedule();
  }

  setHeld(agentId: AgentId, held: boolean): void {
    if (held) {
      this.heldAgents.add(agentId);
    } else {
      this.heldAgents.delete(agentId);
    }
    if (!held) this.tick();
    this.schedule();
  }

  setVisible(visible: boolean): void {
    if (this.visible === visible) return;
    this.visible = visible;
    if (!visible) {
      this.clearTimer();
      return;
    }

    const now = this.now();
    for (const [agentId, state] of this.states) {
      if (!Number.isFinite(state.nextTransitionAt)) continue;
      const random = this.randomByAgent.get(agentId)!;
      this.states.set(agentId, resumeBehaviorState(
        state,
        this.agents.get(agentId)!.status,
        now,
        random,
        this.unreadReports.has(agentId)
      ));
    }

    this.publish();
    this.schedule();
  }

  dispose(): void {
    this.clearTimer();
    this.listeners.clear();
    this.agents.clear();
    this.states.clear();
    this.heldAgents.clear();
    this.snapshot = new Map();
  }

  private tick(): void {
    if (!this.visible) return;
    const now = this.now();
    let changed = false;

    for (const [agentId, agent] of this.agents) {
      if (this.heldAgents.has(agentId) || this.selectedAgent === agentId) continue;
      const current = this.states.get(agentId);
      if (!current) continue;
      const updated = advanceAvatarBehavior(
        current,
        agent.status,
        now,
        this.randomByAgent.get(agentId)!,
        this.reducedMotion,
        this.unreadReports.has(agentId)
      );
      if (!sameState(current, updated)) {
        this.states.set(agentId, updated);
        changed = true;
      }
    }

    if (changed) this.publish();
    this.schedule();
  }

  private schedule(): void {
    this.clearTimer();
    if (!this.visible || this.reducedMotion) return;

    const now = this.now();
    let nextWake = Number.POSITIVE_INFINITY;
    for (const [agentId, state] of this.states) {
      if (this.heldAgents.has(agentId) || this.selectedAgent === agentId) continue;
      nextWake = Math.min(nextWake, state.nextTransitionAt);
    }
    if (!Number.isFinite(nextWake)) return;

    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.tick();
    }, Math.max(50, nextWake - now));
  }

  private clearTimer(): void {
    if (this.timer === undefined) return;
    clearTimeout(this.timer);
    this.timer = undefined;
  }

  private publish(): void {
    this.snapshot = new Map(this.states);
    for (const listener of this.listeners) listener();
  }
}

function sameState(left: AvatarBehaviorState, right: AvatarBehaviorState): boolean {
  return left.activity === right.activity
    && left.pose === right.pose
    && left.startedAt === right.startedAt
    && left.nextTransitionAt === right.nextTransitionAt;
}
