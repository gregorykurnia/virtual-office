# Wolffe avatar replacement verification

Date: 8 October 2026
Mode: local demo data plus local asset/build checks; no live agent, scheduler, market-data, or OpenClaw configuration changed

## Artwork and normalization

- The supplied reference is [`design-concepts/wolffe-photo-reference.jpeg`](../../design-concepts/wolffe-photo-reference.jpeg). It defines the light/slate armor, narrow visor, cheek and jaw plates, shoulder bands, muted yellow brow details, side rangefinder, and red accent badge.
- The approved idle master is [`design-concepts/wolffe-idle-master-approved-v1.png`](../../design-concepts/wolffe-idle-master-approved-v1.png). The four derived masters are [`wolffe-reading-concept-v1.png`](../../design-concepts/wolffe-reading-concept-v1.png), [`wolffe-typing-concept-v1.png`](../../design-concepts/wolffe-typing-concept-v1.png), [`wolffe-report-ready-concept-v1.png`](../../design-concepts/wolffe-report-ready-concept-v1.png), and [`wolffe-attention-concept-v1.png`](../../design-concepts/wolffe-attention-concept-v1.png).
- The visual review board is [`design-concepts/wolffe-avatar-preview.html`](../../design-concepts/wolffe-avatar-preview.html). It includes the supplied photo, the production Rex/Paz/Maul references, the outgoing risk-slot artwork, the approved idle, five poses, light/dark surfaces, and actual 32/36/40 CSS px samples.
- All ten runtime files use the existing `risk-bot` key, 352 × 352 RGBA frames, transparent backgrounds, matching PNG/WebP framing, the existing logical 128 × 128 character box, and a uniform ground anchor of `324 / 352`.

| Pose | Normalized alpha bounds | PNG bytes | WebP bytes |
| --- | --- | ---: | ---: |
| idle | `(90, 16)–(272, 324)` | 104,030 | 27,120 |
| reading | `(90, 15)–(272, 324)` | 96,501 | 24,702 |
| typing | `(90, 16)–(272, 324)` | 97,304 | 25,022 |
| report-ready | `(72, 15)–(272, 324)` | 105,119 | 27,218 |
| attention | `(59, 15)–(272, 324)` | 106,271 | 27,928 |

The wider bounds on report-ready and attention come from the document and raised hand. All five poses share the same planted bottom and retain the visor, rangefinder, red badge, and pale shoulder bands at the reviewed sizes.

## Identity and data checks

- The stable `risk` role, `risk-bot` artwork key, `risk-console` desk, responsibilities, tasks, reports, schedules, and linked records remain unchanged. The display identity is now **Wolffe**, with title **AI & Technology Analyst**.
- Existing browser-local demo snapshots are migrated in `demoOfficeService` when the stable `risk` record still has the former cosmetic label. State, relationships, and execution history are preserved.
- The HTTP adapter resolves the saved `risk` role to Wolffe for current UI presentation when a configured owner record still contains the former label. No live Firestore or OpenClaw write was attempted because no configured authenticated live data source was available in this workspace.
- Report list/detail fallbacks, accessible names, asset-gallery captions, fixtures, documentation, and the office scene use Wolffe. The total-image-failure path keeps the risk role's existing initial behavior.
- The outgoing robot is retained only as [`design-concepts/wolffe-outgoing-theo-idle.png`](../../design-concepts/wolffe-outgoing-theo-idle.png) for visual comparison. Historical verification records may mention the former label when describing their dated captures; active runtime identity and current roster documentation use Wolffe.

## Browser and fallback checks

The local Vite demo was inspected at 1440 and 390 px. The office overview shows Wolffe in the risk station, the profile panel reads Wolffe and AI & Technology Analyst, and the phone header keeps its controls inside the viewport. The static asset gallery shows all four analysts and all five Wolffe poses. The renderer continues to use the WebP → PNG fallback pair.

Acceptance captures:

- [Office at 1440 px](wolffe-avatar-replacement/office-1440.png)
- [Office at 390 px](wolffe-avatar-replacement/office-390.png)
- [Wolffe profile at 1440 px](wolffe-avatar-replacement/profile-1440.png)
- [Complete asset gallery](wolffe-avatar-replacement/asset-gallery-full.png)
- [Reference board](../../design-concepts/wolffe-avatar-preview.html)

## Verification commands

- PASS — `npm run typecheck`
- PASS — `npm run lint`
- PASS — `npm run build`
- PASS — `git diff --check`

This verification covers the local product and asset rollout only. External agent records, schedules, and OpenClaw dispatch were not changed.
