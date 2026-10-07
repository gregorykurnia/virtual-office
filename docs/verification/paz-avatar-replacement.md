# Paz avatar replacement verification

Date: 7 October 2026
Mode: local demo data only; no live agent, scheduler, market-data, or OpenClaw configuration changed

## Delivered assets

- Approved transparent concept masters: [`design-concepts/paz-idle-concept-v1.png`](../../design-concepts/paz-idle-concept-v1.png), plus the reading, typing, report-ready, and attention masters beside it.
- Runtime files: all five `frontend/public/assets/office/avatars/portfolio-bot-{pose}.{png,webp}` pairs.
- Runtime frame: 352 × 352 RGBA PNG/WebP files with the existing `portfolio-bot` key and no baked floor, text, status, or selection treatment.
- Measured `groundAnchorY`: idle `326 / 352`, reading `326 / 352`, typing `327 / 352`, report-ready `326 / 352`, attention `326 / 352`.
- Visual review: [`design-concepts/paz-avatar-preview.html`](../../design-concepts/paz-avatar-preview.html), including light/dark comparisons, small-size samples, and all five poses.

## Identity and data checks

- The demo portfolio display name is `Paz`; the accessible name is `Paz, Portfolio Analyst`; report fallback labels and asset-gallery captions use Paz.
- Stable agent ID `portfolio`, `portfolio-bot`, `portfolio-ledger`, title, responsibility, tasks, reports, and ownership remain unchanged.
- Exactly four demo agents remain: Rex, Paz, Clara, and Theo.
- Active UI/source checks found no remaining Adrian display reference. Historical replacement-plan context remains in its historical documents only where it explains the earlier migration.

## Browser inspection

Read-only headless browser inspection completed against the local Vite demo at `http://127.0.0.1:4174/`:

- `/office` at 1440, 390, and 320 px: Paz appears in the scene and roster, body width matches the viewport, no page or console errors, and mobile controls retain at least 44 px targets.
- `/office?agent=portfolio&tab=overview` and `/office?agent=portfolio&tab=reports`: profile artwork loads, the heading is Paz, the close control is labelled `Close Paz profile`, and the phone view has no horizontal overflow.
- `/reports`: Paz is visible and Adrian is absent; `/reports/report-portfolio-developments` shows `PAZ · PORTFOLIO ANALYST` and `Paz · Portfolio Analyst` in the report context.
- `/assets/office/index.html`: all five Paz pose images load at 352 × 352 with updated alt text and captions; the page has no horizontal overflow at the desktop viewport.
- WebP failure was forced for the portfolio idle pose and the PNG fallback loaded. Forcing both files to fail displayed the initial `P` fallback.

## Automated checks

- PASS — `npm run typecheck`
- PASS — `npm run lint`
- PASS — `npm run build`
- PASS — `git diff --check`

The app remains demo-only; the visual identity replacement does not claim live persistence or external agent renaming.
