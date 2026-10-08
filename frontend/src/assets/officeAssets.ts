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

export const DESK_SPRITE_URL = "/assets/office/desks.svg";

export type AvatarAssetFile = {
  /** Alpha WebP used by supported browsers. */
  readonly webp: string;
  /** Alpha PNG fallback used by browsers without WebP support. */
  readonly png: string;
  /** Measured alpha-bottom anchor in the 352px export box. */
  readonly groundAnchorY: number;
};

export type AvatarAssetManifest = Record<AvatarPose, AvatarAssetFile>;

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
  /** Use this for the button/card label around the otherwise decorative artwork. */
  readonly accessibleName: string;
};

export const OFFICE_ASSETS = {
  market: {
    avatarKey: "market-bot",
    deskKey: "market-terminal",
    accent: "#3867e8",
    accessory: "cobalt Rex armor with market-chart badge",
    accessibleName: "Rex, Market Analyst"
  },
  portfolio: {
    avatarKey: "portfolio-bot",
    deskKey: "portfolio-ledger",
    accent: "#16845b",
    accessory: "blue armored helmet, green ledger badge and portfolio folio",
    accessibleName: "Paz, Portfolio Analyst"
  },
  research: {
    avatarKey: "research-bot",
    deskKey: "research-library",
    accent: "#7759c7",
    accessory: "ivory and orange armor, compact helmet equipment, and violet book badge",
    accessibleName: "Cody, Investment Research Analyst"
  },
  risk: {
    avatarKey: "risk-bot",
    deskKey: "risk-console",
    accent: "#c53b4a",
    accessory: "slate and light armor, side rangefinder, red shield badge and risk-console alert light",
    accessibleName: "Wolffe, AI & Technology Analyst"
  }
} as const satisfies Record<AgentId, AnalystOfficeAsset>;

function createAvatarManifest(
  avatarKey: AssetKey,
  groundAnchors: Record<AvatarPose, number>
): AvatarAssetManifest {
  const path = (pose: AvatarPose) => `/assets/office/avatars/${avatarKey}-${pose}.png`;
  const webpPath = (pose: AvatarPose) => `/assets/office/avatars/${avatarKey}-${pose}.webp`;
  const file = (pose: AvatarPose): AvatarAssetFile => ({
    webp: webpPath(pose),
    png: path(pose),
    groundAnchorY: groundAnchors[pose]
  });

  return {
    idle: file("idle"),
    reading: file("reading"),
    typing: file("typing"),
    "report-ready": file("report-ready"),
    attention: file("attention")
  };
}

/** Typed image manifest for the rendered analyst family. */
export const AVATAR_ASSETS = {
  market: createAvatarManifest("market-bot", {
    idle: 325 / 352,
    reading: 325 / 352,
    typing: 325 / 352,
    "report-ready": 325 / 352,
    attention: 325 / 352
  }),
  portfolio: createAvatarManifest("portfolio-bot", {
    idle: 326 / 352,
    reading: 326 / 352,
    typing: 327 / 352,
    "report-ready": 326 / 352,
    attention: 326 / 352
  }),
  research: createAvatarManifest("research-bot", {
    idle: 325 / 352,
    reading: 325 / 352,
    typing: 325 / 352,
    "report-ready": 325 / 352,
    attention: 325 / 352
  }),
  risk: createAvatarManifest("risk-bot", {
    idle: 324 / 352,
    reading: 324 / 352,
    typing: 324 / 352,
    "report-ready": 324 / 352,
    attention: 324 / 352
  })
} satisfies Record<AgentId, AvatarAssetManifest>;

/** Returns a fragment URL suitable for `<use href={...}>` inside an SVG. */
export function deskAssetHref(agentId: AgentId): string {
  return `${DESK_SPRITE_URL}#${OFFICE_ASSETS[agentId].deskKey}`;
}
