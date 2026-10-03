# Office production asset contract

The office uses a bot-free rendered environment with semantic HTML interaction layers and a reusable SVG character set. The environment follows the visual concepts' soft, shallow-isometric direction with warm materials, visible furniture depth, glass, plants, and consistent diffuse lighting. The concept PNGs remain references; the production environment is a separate optimized asset.

## Source and manifest

| Concern | Source of truth |
| --- | --- |
| Bot-free environment artwork | `frontend/public/assets/office/office-environment.webp` with `office-environment.jpg` fallback |
| Analyst pose symbols | `frontend/public/assets/office/analysts.svg` |
| Desk symbols | `frontend/public/assets/office/desks.svg` |
| Environment dimensions and asset URLs | `OFFICE_ENVIRONMENT_ASSET` in `frontend/src/assets/officeAssets.ts` |
| Agent IDs, keys, accessible names, accent, and accessory | `OFFICE_ASSETS` in `frontend/src/assets/officeAssets.ts` |
| Scene interaction coordinates | `SCENE_LAYOUT` in `frontend/src/components/OfficeScene.tsx` |
| Visual inspection | `frontend/public/assets/office/index.html` |

The TypeScript manifest is the application-facing record. The scene renders the environment inside a fixed 3:2 wrapper, then places normalized HTML controls and transparent avatar symbols over the same artwork rectangle. Names, roles, current status, report state, focus rings, and interaction labels stay outside the artwork.

## Analyst set

| Agent | Avatar key | Desk key | Accent | Persistent role distinction |
| --- | --- | --- | --- | --- |
| Maya — Market Analyst | `market-bot` | `market-terminal` | Blue `#3867e8` | Headset and market-chart badge |
| Adrian — Portfolio Analyst | `portfolio-bot` | `portfolio-ledger` | Green `#16845b` | Ledger badge and portfolio folio |
| Clara — Investment Research Analyst | `research-bot` | `research-library` | Violet `#7759c7` | Book badge and bookmark/book desk prop |
| Theo — Risk Analyst | `risk-bot` | `risk-console` | Red `#c53b4a` | Shield badge and console alert light |

Each avatar key exposes these static symbols: `idle`, `reading`, `typing`, `report-ready`, and `attention`. The set has 20 avatar symbols and four desk symbols. Walking frames are intentionally deferred, as specified in Step 5.

## Geometry and export rules

| Asset | Design box / export | Preferred rendered size | Ground anchor | Safe visual bounds |
| --- | --- | --- | --- | --- |
| Avatar pose | `128 × 128` SVG viewBox; transparent | 32–36 CSS px desktop; 40 CSS px on phone | `(64, 110)` | `x: 18–110`, `y: 5–117` |
| Desk | `192 × 128` SVG viewBox; transparent | 96–144 CSS px wide | `(96, 99)` | `x: 24–168`, `y: 28–117` |

The environment is a `1536 × 1024` raster frame with a `3:2` aspect ratio. Its furniture and floor are decorative; desk controls use normalized coordinates measured against this frame, and avatar symbols use the same coordinate system. Place the avatar ground anchor at the scene waypoint rather than centering the file bounds so poses do not jump when a future scene swaps them.

Use a 44 × 44 CSS px (or larger) semantic button/card as the mobile interaction target; do not enlarge or distort the illustration to create the hit area. The source art contains no text, names, status dots, or status labels. A surrounding HTML control owns `aria-label`, visible name/role, status icon and text, focus ring, and selected state.

## Authoring guardrails

- Preserve the exact viewBox and ground anchor for any replacement pose.
- Keep a character's accent and role accessory in every pose; colour alone is never its identity.
- Use `attention` only as a decorative pose. Verified execution state still comes from an HTML status treatment and data.
- Keep the SVG sprites free of text elements and one-off labels. The environment may be raster because its purpose is to carry the cohesive rendered lighting and material detail that would otherwise require a full 3D renderer.
- Keep motion-free fallbacks on these five static poses. Future walking frames must use the same avatar box and anchor.

## Environment artwork provenance

The current environment was generated on 3 October 2026 with the built-in ImageGen workflow from a structured prompt based on `design-concepts/01-art-direction-comparison.png` and `design-concepts/02-office-layout.png`. The prompt required a bot-free fixed-camera office with central pale-oak workstations, upper-left lounge, upper-right glass meeting room, lower-left reception, lower-right server corner, a warm rounded platform, and soft upper-left lighting. It explicitly excluded people, robots, UI, labels, badges, and watermarks so application controls remain the only semantic occupants.

The checked-in WebP is the preferred runtime file at approximately 160 KB. The JPEG fallback is approximately 462 KB. Both are 1536 × 1024 exports of the same generated frame. If the environment is regenerated, preserve the camera, platform silhouette, object regions, and 3:2 dimensions, then update the normalized coordinates in `OfficeScene.tsx` after comparing the artwork at the target website size.

To inspect the complete set, open `frontend/public/assets/office/index.html` directly in a browser, or run `npm run dev` and open `/assets/office/index.html`. The two SVG files still render their sprite sheets when opened directly; the application references the analyst symbols by ID while the rendered environment carries the desk artwork.
