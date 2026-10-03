import type { AgentId } from "@investment-office/shared";

/**
 * Production illustration contract for the office scene.
 *
 * The artwork deliberately contains no names, status text, or status colours.
 * Those belong to semantic HTML controls so the scene remains accessible and
 * status can be updated independently of a pose.
 */
export const AVATAR_POSES = ["idle", "reading", "typing", "report-ready", "attention"] as const;

export type AvatarPose = (typeof AVATAR_POSES)[number];

export const AVATAR_SPRITE_URL = "/assets/office/analysts.svg";
export const DESK_SPRITE_URL = "/assets/office/desks.svg";

/**
 * Bot-free production environment. The JPG keeps the scene available in
 * browsers without WebP support; both files share the same 3:2 artwork frame.
 */
export const OFFICE_ENVIRONMENT_ASSET = {
  webp: "/assets/office/office-environment.webp",
  fallback: "/assets/office/office-environment.jpg",
  width: 1536,
  height: 1024,
  aspectRatio: "1536 / 1024"
} as const;

type AssetKey = `${AgentId}-bot`;
type DeskKey =
  | "market-terminal"
  | "portfolio-ledger"
  | "research-library"
  | "risk-console";

export type AnalystOfficeAsset = {
  readonly avatarKey: AssetKey;
  readonly deskKey: DeskKey;
  readonly accent: string;
  readonly accessory: string;
  /** Use this for the button/card label around the otherwise decorative SVG. */
  readonly accessibleName: string;
};

export const OFFICE_ASSETS = {
  market: {
    avatarKey: "market-bot",
    deskKey: "market-terminal",
    accent: "#3867e8",
    accessory: "cobalt headset and market-chart badge",
    accessibleName: "Maya, Market Analyst"
  },
  portfolio: {
    avatarKey: "portfolio-bot",
    deskKey: "portfolio-ledger",
    accent: "#16845b",
    accessory: "green ledger badge and portfolio folio",
    accessibleName: "Adrian, Portfolio Analyst"
  },
  research: {
    avatarKey: "research-bot",
    deskKey: "research-library",
    accent: "#7759c7",
    accessory: "violet book badge and research bookmark",
    accessibleName: "Clara, Investment Research Analyst"
  },
  risk: {
    avatarKey: "risk-bot",
    deskKey: "risk-console",
    accent: "#c53b4a",
    accessory: "red shield badge and risk-console alert light",
    accessibleName: "Theo, Risk Analyst"
  }
} as const satisfies Record<AgentId, AnalystOfficeAsset>;

/** Returns a fragment URL suitable for `<use href={...}>` inside an SVG. */
export function avatarAssetHref(agentId: AgentId, pose: AvatarPose): string {
  return `${AVATAR_SPRITE_URL}#${OFFICE_ASSETS[agentId].avatarKey}-${pose}`;
}

/** Returns a fragment URL suitable for `<use href={...}>` inside an SVG. */
export function deskAssetHref(agentId: AgentId): string {
  return `${DESK_SPRITE_URL}#${OFFICE_ASSETS[agentId].deskKey}`;
}
