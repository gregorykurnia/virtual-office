# Maya → Rex avatar replacement plan

> Requirements update — 7 October 2026: [Four-agent workflow specification](./FOUR_AGENT_WORKFLOW_SPEC.md) is authoritative for the revised roles, investor context, watchlists, reporting, coordination, editable WIB schedules, UI controls, and acceptance checks. Conflicting historical defaults below are superseded. Preserve Rex (`market`), Paz (`portfolio`), Clara (`research`), and Theo (`risk`) and their stable artwork keys. Paz is the approved cosmetic replacement for the portfolio display identity; linked responsibilities and records remain unchanged. This update records requirements; it does not claim implementation or live connectivity.

Status: implemented, 4 October 2026. This change replaces Maya's display identity and artwork with Rex, using the supplied Captain Rex preview and design guide. The internal `market-bot` asset key and market analyst relationships remain unchanged.

## Intended result

The blue Market Analyst appears as **Rex** throughout the office, analyst profile, report list, report details, accessible labels, and asset gallery. His five runtime poses share the Captain Rex preview's character design and remain consistent with the office's soft rendered style.

Keep the analyst ID `market`, Market Analyst responsibilities, report/task relationships, desk key `market-terminal`, and existing blue interface accent. This is a character replacement for the existing analyst, so it does not require a new analyst record or changes to scheduling and report ownership.

## References and design decisions

Read and inspected:

- [Captain Rex avatar preview](../design-concepts/captain-rex-avatar-preview.png): primary reference for the intended finished character and all subsequent poses.
- [Captain Rex avatar design guide](../design-concepts/CAPTAIN_REX_AVATAR_DESIGN_GUIDE.md): identity details, office style translation, lighting, export requirements, and pose guidance.
- [Current market idle avatar](../frontend/public/assets/office/avatars/market-bot-idle.png): production scale, camera, and comparison with the other analysts.
- [Asset contract](ASSET_CONTRACT.md), [shared styles](../frontend/src/styles.css), [wireframes](../design-concepts/step-4-wireframes.html), and [wireframe tokens](../design-concepts/step-4-tokens.css): integration and UI consistency requirements.

The preview is the user's supplied visual target. Preserve its oversized rounded helmet, paired blue forehead markings and central stripe, dark angular visor, warm ivory armor, broad blue shoulder/forearm panels, dark joints, short limbs, chunky boots, and dark blue-edged split waist garment. Preserve softly glossy surfaces, gentle upper-left lighting, empty hands in idle, and restrained weathering. Do not substitute the old robot's oval cyan eyes or headset for the Rex helmet.

The guide describes the earlier idle-only experiment and a reference-specific asymmetric pauldron. For this replacement, use the actual preview's shoulder arrangement and silhouette as the visual target; use the guide to keep the pose family coherent. Check the first normalized idle export in context before making the remaining poses. This is an implementation quality checkpoint, not a request to redesign the supplied character.

Retain a small market-chart badge on a clear chest armor area across every pose to meet the contract's non-color role distinction. This is a deliberate, limited office-role adaptation; it must not replace the forehead markings, visor, shoulder treatment, or waist garment. Market Analyst labels and the chart badge together keep the role understandable.

The preview is a **1254 × 1254 RGBA PNG with real transparency**. It is a master/reference rather than a ready-to-swap runtime export. Normalize scale, margins, and floor contact before integration, and inspect alpha edges over light and dark backgrounds for halos and stray pixels.

## Implementation sequence

### 1. Prepare Rex's idle production asset

Use the preview as the starting master. Preserve it in `design-concepts`; create separate production exports. Match visual height and floor contact to the existing analysts rather than simply stretching the square into the current file bounds. Add the small chart badge consistently with the render's materials.

Export transparent **352 × 352 WebP and PNG** versions. Follow the logical **128 × 128** box, ground target **(64, 110)**, and nominal safe visual bounds **x: 18–110, y: 5–117**. Measure the actual alpha-bottom position after export and store its normalized value as `groundAnchorY`; do not reuse Maya's offsets blindly.

Make a temporary in-office and portrait comparison with the other analysts. Confirm the helmet, wider shoulders, and kama fit without cropping, exaggerated scale, or label overlap. Solve alignment by normalizing the asset before considering CSS changes.

### 2. Create the complete pose family

Use the normalized Rex idle master as the identity reference for each additional pose. Any image-generation work should attach the preview and relevant office references explicitly. Keep the camera, helmet-to-body ratio, materials, markings, shoulder panels, chart badge, garment, lighting, and framing consistent.

| Pose | Action and constraints |
| --- | --- |
| `idle` | Relaxed standing pose, arms at sides, empty hands, both boots grounded. |
| `reading` | Hold a small office tablet or folio; helmet markings and chart badge remain visible. |
| `typing` | Compact typing gesture matching the existing office prop convention; no generated desk or chair. |
| `report-ready` | Present a small document or tablet; keep the gesture within the shared bounds. |
| `attention` | Slight attentive lean or restrained hand gesture; status remains an HTML label. |

Deliver ten runtime files: five WebPs and five matching PNGs. Inspect every pose at equal scale beside idle before switching the runtime set; a status transition must never switch Rex back into Maya's robot artwork. Do not bake names, status dots, selection rings, ground shadows, scenery, or weapons into the images.

### 3. Integrate the artwork and display identity together

Retain the internal `market-bot` asset key because the current typed keys and fixture already use it. Replace its five production image pairs with the Rex exports in one change. The key describes the role's asset slot, while the display name and artwork express Rex's identity. Git history retains the previous artwork.

| File / surface | Planned change |
| --- | --- |
| `frontend/public/assets/office/avatars/market-bot-{pose}.{webp,png}` | Replace all five market pose pairs with normalized Rex artwork. |
| `frontend/src/assets/officeAssets.ts` | Set `accessibleName` to `Rex, Market Analyst`, describe the Rex armor and chart badge in `accessory`, and update all measured market ground anchors. |
| `frontend/src/demo/fixtures.ts` | Change the market agent's `displayName` from Maya to Rex; preserve role, IDs, task references, and asset/desk keys. |
| `frontend/src/components/ReportListPage.tsx` | Update the market fallback label to `Rex · Market Analyst`; verify fallback initial becomes R. |
| `frontend/src/components/ReportDetailPage.tsx` | Update the market fallback label to `Rex · Market Analyst`. |
| `frontend/public/assets/office/index.html` | Update market row name, captions, and alt text to Rex; show all five new poses. |
| `docs/ASSET_CONTRACT.md` | Record Rex's identity and chart badge as the market role distinction. |

The office, sidebar, profile, tooltips, and many accessible labels already use `agent.displayName`; verify them after updating the fixture rather than adding independent hardcoded names. `AnalystAvatar.tsx` derives its failure initial from the manifest's accessible name, so the failure treatment should become R automatically.

If the target environment serves persisted agents instead of demo fixtures, inspect the existing `market` record and update its display name to Rex as part of that environment's rollout. A fixture rename alone does not rename data returned by a live backend. Preserve its identity and linked records; do not reseed unrelated data.

Reuse the shared avatar renderer, image loading treatment, WebP-to-PNG fallback, semantic interaction controls, selection ring, shadows, and reduced-motion behavior. The new art fits the existing design system without new application tokens or a layout redesign. Walking frames and rigged 3D animation remain separate future work.

### 4. Verify the complete replacement

- Check export dimensions, true alpha, matching PNG/WebP framing, file availability, safe margins, measured ground anchors, and total asset size compared with the current market family.
- Run `npm run typecheck`, `npm run lint`, and `npm run build`. Run the existing relevant tests for any behavior changed during implementation; a pure asset/name swap does not need duplicate implementation tests.
- Run the application and inspect the office, sidebar, profile, report list, report detail, and asset gallery at desktop **1440 px**, phone **360 px**, and narrow **320 px**, including supported light/dark themes.
- Check reference-size readability at **32–36 CSS px desktop** and **40 CSS px phone**, plus actual current scene and portrait sizes. Compare all four analysts at equal scene scale.
- Exercise all five market poses and transitions. Boots stay planted, apparent size stays stable, accessories stay inside bounds, and labels do not overlap the helmet.
- Inspect hover, keyboard focus, selected state, loading, WebP failure with PNG fallback, total image failure with initial R, and reduced-motion behavior. Preserve at least **44 × 44 CSS px** mobile targets.
- Confirm every active UI name says Rex, including report fallback labels and accessible text. Search remaining Maya references and distinguish historical plans/progress records from active documentation; do not rewrite historical implementation records just to remove the old name.
- Review the diff, stage only replacement-task files, commit, and push to the current branch's configured upstream.

## Completion criteria

Rex is recognizable as the supplied preview in every pose, belongs visually beside Paz, Clara, and Theo, remains clearly the Market Analyst, and appears consistently across active names and fallback states. Existing market assignments, reports, scene interactions, and status behavior still work. Desktop and phone inspection shows no clipping, floor jitter, mismatched lighting, transparency halos, or new overlap.

The design guide has an existing local move from `docs` to `design-concepts`. Leave that user change outside this plan-only commit. During implementation, repair its relative asset-contract links if the move is retained, so the art handoff resolves correctly from its final location.
