import type { Agent, AgentId } from "@investment-office/shared";
import type { AvatarPose } from "../assets/officeAssets";

export type AmbientActivity =
  | "standing-idle"
  | "standing-reading"
  | "standing-working"
  | "attention";

export type RandomSource = () => number;

export type AvatarBehaviorState = {
  agentId: AgentId;
  activity: AmbientActivity;
  pose: AvatarPose;
  startedAt: number;
  nextTransitionAt: number;
};

const MIN_IDLE_INTERVAL_MS = 20_000;
const MAX_IDLE_INTERVAL_MS = 60_000;
const MIN_WAITING_INTERVAL_MS = 45_000;
const MAX_WAITING_INTERVAL_MS = 120_000;
const MIN_INITIAL_DELAY_MS = 3_000;
const MAX_INITIAL_DELAY_MS = 12_000;

function sampleBetween(random: RandomSource, minimum: number, maximum: number): number {
  return minimum + Math.floor(Math.max(0, Math.min(0.999999, random())) * (maximum - minimum + 1));
}

function baseActivityForStatus(status: Agent["status"]): AmbientActivity {
  if (status === "working") return "standing-working";
  if (status === "waiting") return "standing-reading";
  if (status === "offline") return "attention";
  return "standing-idle";
}

function poseForActivity(
  status: Agent["status"],
  activity: AmbientActivity,
  hasUnreadReport: boolean
): AvatarPose {
  if (status === "working") return "typing";
  if (status === "waiting") return "reading";
  if (status === "offline") return "attention";
  if (status === "unknown") return "idle";
  if (hasUnreadReport) return "report-ready";
  return activity === "standing-reading" ? "reading" : "idle";
}

function intervalForStatus(status: Agent["status"], random: RandomSource): number {
  if (status === "waiting") return sampleBetween(random, MIN_WAITING_INTERVAL_MS, MAX_WAITING_INTERVAL_MS);
  return sampleBetween(random, MIN_IDLE_INTERVAL_MS, MAX_IDLE_INTERVAL_MS);
}

function nextActivityForStatus(
  status: Agent["status"],
  current: AmbientActivity,
  random: RandomSource
): AmbientActivity {
  if (status === "working") return "standing-working";
  if (status === "waiting") return random() < 0.7 ? "standing-reading" : "standing-idle";
  if (status !== "idle") return baseActivityForStatus(status);

  if (current === "standing-reading") return "standing-idle";
  return random() < 0.35 ? "standing-reading" : "standing-idle";
}

export function createSeededRandom(seed: number): RandomSource {
  let value = (seed >>> 0) || 1;

  return () => {
    value = (Math.imul(1664525, value) + 1013904223) >>> 0;
    return value / 0x1_0000_0000;
  };
}

export function createAvatarBehaviorState(
  agentId: AgentId,
  status: Agent["status"],
  now: number,
  random: RandomSource,
  reducedMotion: boolean,
  hasUnreadReport: boolean
): AvatarBehaviorState {
  const activity = baseActivityForStatus(status);
  const isAutonomous = !reducedMotion && (status === "idle" || status === "waiting");

  return {
    agentId,
    activity,
    pose: poseForActivity(status, activity, hasUnreadReport),
    startedAt: now,
    nextTransitionAt: isAutonomous
      ? now + (status === "idle" ? sampleBetween(random, MIN_INITIAL_DELAY_MS, MAX_INITIAL_DELAY_MS) : intervalForStatus(status, random))
      : Number.POSITIVE_INFINITY
  };
}

export function advanceAvatarBehavior(
  state: AvatarBehaviorState,
  status: Agent["status"],
  now: number,
  random: RandomSource,
  reducedMotion: boolean,
  hasUnreadReport: boolean
): AvatarBehaviorState {
  const autonomous = !reducedMotion && (status === "idle" || status === "waiting");
  const pose = poseForActivity(status, state.activity, hasUnreadReport);

  if (!autonomous) {
    const activity = baseActivityForStatus(status);
    if (state.pose === pose && state.activity === activity) return state;
    return { ...state, activity, pose, nextTransitionAt: Number.POSITIVE_INFINITY };
  }

  if (now < state.nextTransitionAt) {
    if (state.pose === pose) return state;
    return { ...state, pose };
  }

  const activity = nextActivityForStatus(status, state.activity, random);
  return {
    agentId: state.agentId,
    activity,
    pose: poseForActivity(status, activity, hasUnreadReport),
    startedAt: now,
    nextTransitionAt: now + intervalForStatus(status, random)
  };
}

export function holdBehaviorState(state: AvatarBehaviorState, now: number): AvatarBehaviorState {
  return { ...state, nextTransitionAt: Number.POSITIVE_INFINITY, startedAt: now };
}

export function resumeBehaviorState(
  state: AvatarBehaviorState,
  status: Agent["status"],
  now: number,
  random: RandomSource,
  hasUnreadReport: boolean
): AvatarBehaviorState {
  const autonomous = status === "idle" || status === "waiting";
  return {
    ...state,
    pose: poseForActivity(status, state.activity, hasUnreadReport),
    nextTransitionAt: autonomous ? now + sampleBetween(random, MIN_INITIAL_DELAY_MS, MAX_INITIAL_DELAY_MS) : Number.POSITIVE_INFINITY
  };
}
