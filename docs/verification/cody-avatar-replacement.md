# Cody avatar replacement verification

Date: 8 October 2026

Status: implemented locally. This records the Cody cosmetic replacement for the stable `research` slot. It does not establish live research execution, external identity mapping, scheduler configuration, or deployment acceptance.

## Artwork inputs and review

- Unchanged source reference: [`design-concepts/cody-photo-reference.jpeg`](../../design-concepts/cody-photo-reference.jpeg).
- High-resolution idle baseline: [`design-concepts/cody-idle-master-approved-v1.png`](../../design-concepts/cody-idle-master-approved-v1.png), 1254 × 1254 RGBA PNG.
- High-resolution pose concepts: `cody-reading-concept-v1.png`, `cody-typing-concept-v1.png`, `cody-report-ready-concept-v1.png`, and `cody-attention-concept-v1.png` in `design-concepts/`.
- Review board: [`design-concepts/cody-avatar-preview.html`](../../design-concepts/cody-avatar-preview.html). It includes the costume reference, Rex/Paz/Wolffe family comparisons, outgoing Maul reference, five poses, light/dark surfaces, 32/36/40 CSS pixel samples, and current scene/profile sizes.

The idle candidate was reviewed against the production family for the ivory helmet silhouette, orange brow/shoulder/chest/leg blocks, compact side equipment, violet book badge, short limbs, planted boots, soft upper-left light, and transparent margins. The implementation request was treated as authorization to accept that idle baseline and derive the four remaining decorative poses from it.

## Runtime exports

All ten files retain the existing `research-bot` artwork key and are 352 × 352 RGBA PNG/WebP pairs. Meaningful alpha bounds use an alpha threshold greater than 16; `groundAnchorY` is the exclusive alpha-bottom coordinate recorded in `AVATAR_ASSETS`.

| Pose | PNG/WebP | Meaningful alpha bounds | `groundAnchorY` |
| --- | --- | --- | --- |
| idle | present / present | `x: 73–278`, `y: 15–324` | `325 / 352` |
| reading | present / present | `x: 81–270`, `y: 15–324` | `325 / 352` |
| typing | present / present | `x: 83–268`, `y: 15–324` | `325 / 352` |
| report-ready | present / present | `x: 84–267`, `y: 15–324` | `325 / 352` |
| attention | present / present | `x: 69–282`, `y: 15–324` | `325 / 352` |

The normalized bounds keep the helmet attachments inside the shared safe region, preserve full boot contact, and keep the head baseline stable across state changes. PNG and WebP exports were generated from the same normalized RGBA frames; the PNG remains the fallback source.

## Runtime and identity changes

- `research` remains the only research agent ID; `research-bot`, `research-library`, tasks, reports, runs, schedules, ownership, and title remain unchanged.
- The research display identity is Cody in the demo fixture, persisted-demo migration, HTTP presentation mapping, report fallbacks, accessible asset name, and static asset gallery.
- The violet research interface accent remains `#7759c7`; the violet book badge remains the role marker. Orange is costume color only.
- The app still has exactly four agents: Paz/portfolio, Rex/market, Cody/research, and Wolffe/risk.
- Maul guides, concept masters, replacement plan, and dated evidence remain preserved as outgoing-character history.
- No OpenClaw job, external agent, notification target, live report, owner-scoped record, or scheduler was created or renamed.

## Checks

Completed locally:

- `git diff --check`
- Runtime file type, dimensions, paired PNG/WebP availability, and alpha-bound inspection with Pillow.
- Current source audit: no Maul display label remains under `frontend/`; remaining Maul matches are historical documentation or explicit outgoing-character comparisons.
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Local Vite route and asset smoke checks for `/`, `/assets/office/index.html`, and all ten Cody runtime files.

The CUA browser surface was unavailable in this session (`CUA_REPL_ENABLED_SURFACES is required`), and no Playwright browser dependency is installed. I therefore could not capture fresh 1440px or 360px browser screenshots or exercise keyboard/focus states visually here. The generated assets were inspected inline and the review board/source structure was checked locally; browser visual acceptance remains the only unverified part of this handoff.
