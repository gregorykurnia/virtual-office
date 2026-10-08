# Office production asset contract

> Requirements update — 8 October 2026: [Four-agent workflow specification](./FOUR_AGENT_WORKFLOW_SPEC.md) is authoritative for the revised roles, investor context, watchlists, reporting, coordination, editable WIB schedules, UI controls, and acceptance checks. Conflicting historical defaults below are superseded. Preserve Rex (`market`), Paz (`portfolio`), Clara (`research`), and Wolffe (`risk`) and their stable artwork keys. Paz is the approved cosmetic replacement for the portfolio display identity; Wolffe replaces the risk display identity, with linked responsibilities and records unchanged. This update records requirements; it does not claim implementation or live connectivity.

The office uses a bot-free rendered environment with semantic HTML interaction layers and a reusable raster character set. The environment and avatars follow the visual concepts' soft, shallow-isometric direction with warm materials, visible furniture depth, glass, plants, rounded shells, glossy face panels, role badges, and consistent diffuse lighting. The concept PNGs remain references; the production assets are separate runtime files.

## Source and manifest

| Concern | Source of truth |
| --- | --- |
| Bot-free environment artwork | `frontend/public/assets/office/office-environment.webp` with `office-environment.jpg` fallback |
| Analyst pose images | `frontend/public/assets/office/avatars/*.webp` with matching `*.png` fallback |
| Desk symbols | `frontend/public/assets/office/desks.svg` |
| Environment dimensions and asset URLs | `OFFICE_ENVIRONMENT_ASSET` in `frontend/src/assets/officeAssets.ts` |
| Avatar dimensions, poses, and ground offsets | `AVATAR_ASSETS` in `frontend/src/assets/officeAssets.ts` |
| Shared avatar renderer | `frontend/src/components/AnalystAvatar.tsx` |
| Agent IDs, keys, accessible names, accent, and accessory | `OFFICE_ASSETS` in `frontend/src/assets/officeAssets.ts` |
| Scene interaction coordinates | `SCENE_LAYOUT` in `frontend/src/components/OfficeScene.tsx` |
| Visual inspection | `frontend/public/assets/office/index.html` |

The TypeScript manifest is the application-facing record. The scene renders the environment inside a fixed 3:2 wrapper, then places normalized HTML controls and transparent avatar images over the same artwork rectangle. Names, roles, current status, report state, focus rings, selection rings, and interaction labels stay outside the artwork.

## Analyst set

| Agent | Avatar key | Desk key | Accent | Persistent role distinction |
| --- | --- | --- | --- | --- |
| Rex — Global Markets Analyst | `market-bot` | `market-terminal` | Blue `#3867e8` | Rex helmet/armor and market-chart badge |
| Paz — Portfolio Analyst | `portfolio-bot` | `portfolio-ledger` | Green `#16845b` | Blue armored helmet, green ledger badge, and portfolio folio |
| Clara — Opportunity Scout | `research-bot` | `research-library` | Violet `#7759c7` | Book badge and bookmark/book desk prop |
| Wolffe — AI & Technology Analyst | `risk-bot` | `risk-console` | Red `#c53b4a` | Slate/light armor, side rangefinder, red shield badge and console alert light |

The current `risk-bot` set is Wolffe. Its five normalized poses share a measured `groundAnchorY` of `324 / 352`; alpha bounds are `x: 90–272, y: 15/16–324` for idle, reading, and typing, `x: 72–272, y: 15–324` for report-ready, and `x: 59–272, y: 15–324` for attention. High-resolution masters and the unchanged photo reference are preserved in `design-concepts/`.

Each avatar key exposes these static images: `idle`, `reading`, `typing`, `report-ready`, and `attention`. The set has 20 rendered 352 × 352 transparent WebPs with matching PNG fallbacks and four desk symbols. The source masters were authored at larger square resolution and exported into the runtime box. Walking frames are intentionally deferred, as specified in Step 5.

## Geometry and export rules

| Asset | Design box / export | Preferred rendered size | Ground anchor | Safe visual bounds |
| --- | --- | --- | --- | --- |
| Avatar pose | `352 × 352` transparent WebP with PNG fallback; logical `128 × 128` box | 32–36 CSS px desktop; 40 CSS px on phone | `(64, 110)` logical; measured per-pose alpha-bottom offsets are in `AVATAR_ASSETS` | `x: 18–110`, `y: 5–117` logical starting bounds |
| Desk | `192 × 128` SVG viewBox; transparent | 96–144 CSS px wide | `(96, 99)` | `x: 24–168`, `y: 28–117` |

The environment is a `1536 × 1024` raster frame with a `3:2` aspect ratio. Its furniture and floor are decorative; desk controls use normalized coordinates measured against this frame, and avatar images use the same coordinate system. Place the avatar ground anchor at the scene waypoint rather than centering the file bounds. `AnalystAvatar` applies each manifest's measured alpha-bottom offset so generated pose padding does not make feet jump when state changes.

Use a 44 × 44 CSS px (or larger) semantic button/card as the mobile interaction target; do not enlarge or distort the illustration to create the hit area. The source art contains no text, names, status dots, or status labels. A surrounding HTML control owns `aria-label`, visible name/role, status icon and text, focus ring, and selected state.

## Authoring guardrails

- Preserve the exact viewBox and ground anchor for any replacement pose.
- Keep a character's accent and role accessory in every pose; colour alone is never its identity.
- Use `attention` only as a decorative pose. Verified execution state still comes from an HTML status treatment and data.
- Keep the raster avatars free of names, status text, selection rings, and one-off labels. The environment and characters may be raster because their purpose is to carry cohesive rendered lighting and material detail without requiring a full 3D renderer.
- Keep motion-free fallbacks on these five static poses. Future walking frames must use the same avatar box and anchor.

## Environment artwork provenance

The current environment was generated on 3 October 2026 with the built-in ImageGen workflow from a structured prompt based on `design-concepts/01-art-direction-comparison.png` and `design-concepts/02-office-layout.png`. The prompt required a bot-free fixed-camera office with central pale-oak workstations, upper-left lounge, upper-right glass meeting room, lower-left reception, lower-right server corner, a warm rounded platform, and soft upper-left lighting. It explicitly excluded people, robots, UI, labels, badges, and watermarks so application controls remain the only semantic occupants.

The checked-in WebP is the preferred runtime file at approximately 160 KB. The JPEG fallback is approximately 462 KB. Both are 1536 × 1024 exports of the same generated frame. If the environment is regenerated, preserve the camera, platform silhouette, object regions, and 3:2 dimensions, then update the normalized coordinates in `OfficeScene.tsx` after comparing the artwork at the target website size.

To inspect the complete set, open `frontend/public/assets/office/index.html` directly in a browser, or run `npm run dev` and open `/assets/office/index.html`. The runtime page shows all 20 raster poses, the environment, and the desk symbols. The legacy analyst SVG remains in the repository as a historical reference and is no longer used by the application.
