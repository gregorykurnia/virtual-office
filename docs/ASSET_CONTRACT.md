# Office production asset contract

Step 5 turns the visual concepts into a reusable, native SVG set. The source art deliberately follows the soft, shallow-isometric direction: compact rounded bots, warm neutral desks, restrained role colours, and clear geometric props. It does **not** embed or ship the concept PNGs as product UI.

## Source and manifest

| Concern | Source of truth |
| --- | --- |
| Analyst pose symbols | `frontend/public/assets/office/analysts.svg` |
| Desk symbols | `frontend/public/assets/office/desks.svg` |
| Agent IDs, keys, accessible names, accent, and accessory | `frontend/src/assets/officeAssets.ts` |
| Visual inspection | `frontend/public/assets/office/index.html` |

The TypeScript manifest is the application-facing record. A scene renders a symbol via `avatarAssetHref(agentId, pose)` or `deskAssetHref(agentId)`, then supplies the corresponding name, role, current status, and interaction label through HTML.

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

Place the ground anchor at the scene waypoint rather than centering the file bounds. This keeps poses from jumping when a future scene swaps them. Desk art paints before the avatar; avatar z-order follows its ground-anchor Y coordinate. Assets are vector-first, so raster delivery should export at 2× the intended CSS size only when a target cannot render SVG.

Use a 44 × 44 CSS px (or larger) semantic button/card as the mobile interaction target; do not enlarge or distort the illustration to create the hit area. The source art contains no text, names, status dots, or status labels. A surrounding HTML control owns `aria-label`, visible name/role, status icon and text, focus ring, and selected state.

## Authoring guardrails

- Preserve the exact viewBox and ground anchor for any replacement pose.
- Keep a character's accent and role accessory in every pose; colour alone is never its identity.
- Use `attention` only as a decorative pose. Verified execution state still comes from an HTML status treatment and data.
- Avoid embedded raster images, text elements, and one-off labels in the SVG sprites.
- Keep motion-free fallbacks on these five static poses. Future walking frames must use the same avatar box and anchor.

To inspect the complete set, open `frontend/public/assets/office/index.html` directly in a browser, or run `npm run dev` and open `/assets/office/index.html`. The two SVG files also render their sprite sheets when opened directly; the application continues to reference individual symbols by ID.
