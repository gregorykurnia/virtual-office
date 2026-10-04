import type { AgentId } from "@investment-office/shared";

export type ScenePoint = {
  x: number;
  y: number;
};

export type SceneAgentLayout = {
  desk: ScenePoint;
  character: ScenePoint;
  stationName: string;
};

/**
 * Coordinates are normalized against the production office artwork. The
 * character point is the current standing home point; chair and route geometry
 * stays deliberately separate until measured foreground masks and animation
 * clips are available.
 */
export const SCENE_LAYOUT: Record<AgentId, SceneAgentLayout> = {
  market: {
    desk: { x: 47, y: 41 },
    character: { x: 43, y: 48 },
    stationName: "left rear workstation"
  },
  portfolio: {
    desk: { x: 38, y: 53 },
    character: { x: 34, y: 59 },
    stationName: "left front workstation"
  },
  research: {
    desk: { x: 62, y: 44 },
    character: { x: 66, y: 50 },
    stationName: "right rear workstation"
  },
  risk: {
    desk: { x: 59, y: 57 },
    character: { x: 64, y: 64 },
    stationName: "right front workstation"
  }
};
