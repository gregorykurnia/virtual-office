# Paz avatar design guide and portfolio replacement plan

Status: implemented, 7 October 2026. The idle design was shown inline and approved by the user; the complete five-pose family is now normalized into the portfolio runtime slot and the active display identity is Paz.

## Goal and scope

Create a Paz Vizsla-inspired avatar that looks like it was made by the same artist, in the same render session, as the existing office avatars. Generate and **show the user an idle avatar preview**, with an equal-scale comparison beside Rex and the current portfolio avatar. After idle approval, develop the complete pose family and replace the portfolio display name and artwork with Paz.

The target is the existing **`portfolio` agent**, identified by the user's explicit Adrian → Paz request. Do not infer the target from list position or “second agent.” Keep exactly four agents; preserve `portfolio`, its Portfolio Analyst responsibilities and digest ownership, `portfolio-bot`, `portfolio-ledger`, linked tasks/reports, and verified external IDs.

The user's new character request supersedes the earlier Adrian name/artwork preservation requirement **for this cosmetic replacement only**. [FOUR_AGENT_WORKFLOW_SPEC.md](../docs/FOUR_AGENT_WORKFLOW_SPEC.md) still governs research behavior, ownership, schedules, and coordination. This plan does not authorize research configuration, new agents, or external messages.

## Required references and their priority

Attach the actual images to the image generator; a Markdown link or filesystem path alone does not supply visual conditioning to another model.

| Reference | Purpose |
| --- | --- |
| User-supplied Paz Vizsla image, `/Users/gregorykurnia/Downloads/Paz Vizsla.webp` | Costume identity: blue Mandalorian helmet and armor, dark T-shaped visor, broad shoulder plates, muted yellow/ochre equipment and knee details. Attach separately when handing this guide to another model; the Downloads path is local and is not a repository asset. |
| [Current Rex idle avatar](../frontend/public/assets/office/avatars/market-bot-idle.png) | **Primary finished style target** for translating helmeted armor into this avatar family. Match proportions, surface treatment, camera, lighting, and detail density. |
| [Current portfolio idle avatar](../frontend/public/assets/office/avatars/portfolio-bot-idle.png) | Existing replacement slot: subject scale, rounded construction, stance, green ledger badge, and alignment with other analysts. |
| [Rex preview master](captain-rex-avatar-preview.png) | Larger style reference for the armored character treatment. The production Rex image governs runtime scale. |
| [Avatar reference sheet](03-avatar-states.png) and [office environment](../frontend/public/assets/office/office-environment.webp) | Supporting family and environment context. |

**Priority:** existing office avatars govern the rendering style; the Paz photo governs costume identity; the asset contract governs export and placement. Do not inherit the photo's adult anatomy, weapon, wide combat stance, gritty texture, or dramatic presentation. Do not recolor Rex and call it Paz: the Mandalorian helmet shape and blue armor must come from the supplied Paz reference.

## Exact avatar style requirements

“Stylized,” “cute,” or “chibi” alone is not a sufficient brief. Use these concrete requirements and compare them directly with the supplied production images:

| Style property | Required treatment |
| --- | --- |
| Rendering | Polished, softly rendered **3D toy-like character**, matching the current raster avatars. Smooth shaded volumes, soft bevels, subtle reflections, and clean edges. |
| Proportions | Oversized rounded helmet, compact torso, very short thick arms and legs, small rounded hands, and chunky boots. Match Rex's helmet-to-body ratio visually rather than using adult proportions or an arbitrary new chibi ratio. |
| Silhouette | Full body, compact width, feet apart only slightly, relaxed arms near the torso. Paz can have slightly broader rounded shoulder armor, but stays inside the same apparent height and shared footprint. |
| Helmet construction | Rounded dome and simplified beveled face plates; keep Paz's recognizable dark Mandalorian T visor. The helmet occupies the head volume used by the existing avatars. |
| Materials | Softly glossy painted armor, restrained highlights, charcoal joints/undersuit, smooth rounded gloves and boots. Match Rex's gentle plastic-like finish; avoid mirror chrome and gritty metal. |
| Detail density | Broad color blocks and a few readable panel boundaries. Simplify straps, hoses, seams, backpack hardware, scratches, and ammunition details; tiny costume detail must not overwhelm the face. |
| Camera | Match Rex and the portfolio idle image's shallow three-quarter view, visible top surfaces, facing direction, and perspective. No new front-on, side-on, low-angle, or dramatic lens treatment. |
| Lighting | Same soft upper-left key light, diffuse fill, gentle self-shading, and warm highlights. No hard cinematic shadows or strong rim light. |
| Expression and pose | Helmet stays on. Approachable, calm office-colleague presence through stance; visor remains a single recognizable T shape. Do not add the robot's oval cyan eyes or a human face. |
| Composition | Centered square, entire body visible, transparent margins, same apparent scale and floor contact as the existing family. No floor, pedestal, or baked ground shadow. |

Reject a result that resembles a realistic action figure, tall game character, flat cartoon, anime illustration, pixel sprite, low-poly model, or collectible with a different render style. The desired match is to the **actual attached office avatars**, not to a generic interpretation of any of these style words.

## Paz identity translated into the office style

| Costume feature | Office avatar treatment |
| --- | --- |
| Blue helmet | Preserve the rounded blue dome and reference-specific faceplate structure. Use softened geometry without losing the Mandalorian identity. |
| Dark T-shaped visor | Keep the horizontal brow slit and vertical central section legible at small size. Use restrained reflections rather than glowing eyes. |
| Blue armor and broad shoulders | Use muted blue chest, shoulder, forearm, thigh, and boot-shell panels, with clear separation from the charcoal undersuit. Shoulders feel sturdy without creating a tall or wide combat silhouette. |
| Yellow/ochre accents | Preserve a few clear reference-based accents, especially knees and simplified backpack details where visible. Avoid adding yellow stripes everywhere. |
| Backpack/jetpack | Optional compact rounded form behind the shoulders if visible from the matching camera; stay within the shared bounds. It must not become a large silhouette extension or hide the face. |
| Straps and equipment | Reduce to a small number of broad, tidy forms. Omit the heavy gun and ammunition belt for the office avatar; hands are empty in idle. |
| Portfolio distinction | Add a small green ledger/chart badge on a clear chest armor area, matching the existing portfolio role marker. Retain it across every pose; use a portfolio folio for appropriate working poses. |
| Weathering | Minimal subtle variation only. Remove the photo's heavy scratches and worn metal treatment so Paz matches Rex's clean finish. |

Suggested starting art colors: muted armor blue `#527A9D`, light blue bevels `#85ABC1`, ochre `#C5A34F`, charcoal `#202B3A`. Tune them against the references and render lighting. These are art suggestions, not new CSS tokens. Keep the portfolio UI accent and role badge green (`#16845B`); blue armor does not change Paz into the market analyst.

## First deliverable: generate and show the preview

1. Inspect the supplied Paz image and the actual production style references. When using an image-generation tool, load its applicable imagegen skill and attach the references explicitly.
2. Generate **one full-body idle avatar**, with empty hands, both boots grounded, compact relaxed stance, and genuine transparent alpha. Save a high-resolution PNG master separately from runtime assets, suggested name `paz-idle-concept-v1.png` in `design-concepts`.
3. **Display the generated avatar inline to the user.** A saved filename, description, or prompt is not an avatar preview. Provide a link to the master as well.
4. Show an equal-apparent-height comparison of Paz, production Rex, and the current portfolio avatar, plus small-size samples. Preview on both light and dark backgrounds to reveal halos and contrast problems. Comparison backgrounds and captions belong only in the review artifact, never in the transparent master.
5. Check the helmet-to-body ratio, shoulders, camera, material sheen, light direction, boot shape, alpha edges, and small-size readability against Rex. Fix visible mismatches before presenting the candidate as ready.
6. Ask the user to approve the **shown idle design** before generating the remaining poses or replacing runtime assets. Approval here is an explicit requested visual checkpoint, not permission to write this guide. Keep production artwork unchanged until that checkpoint is satisfied.

If image generation or inline display is unavailable, state that limitation and leave preview acceptance pending. Never claim the avatar has been previewed or approved from a text prompt alone.

## Copy-ready generation prompt

```text
Create one Paz Vizsla-inspired avatar for this existing virtual office.

Attached reference 1: the user's Paz Vizsla image. Use it for costume
identity only: blue Mandalorian helmet with its dark T-shaped visor and
recognizable faceplate structure, blue armored torso and broad shoulders,
charcoal undersuit, and selective muted yellow/ochre knee and equipment
accents. Follow the visible costume features. Omit the heavy weapon and
ammunition belt. Keep the helmet on.

Attached reference 2: the current production Rex idle avatar. This is the
strict finished STYLE target. Match its oversized rounded helmet-to-body
ratio, compact torso, very short thick limbs, rounded hands, chunky boots,
soft bevels, smoothly shaded toy-like 3D volumes, softly glossy painted
surfaces, restrained highlights, detail density, camera, facing direction,
and soft upper-left lighting with diffuse fill. The result must look made
by the same artist in the same render session as this avatar.

Attached reference 3: the current portfolio idle avatar. Match its apparent
scale and relaxed office stance. Include a small green portfolio ledger
badge on clear chest armor. Keep Paz's armor blue; the green badge is a
small role cue. Do not turn Paz into the old white robot.

Translate the photo's armor into the existing avatar's compact rounded
construction. Preserve Paz's own Mandalorian helmet geometry and blue
armor; do not merely recolor Rex. Keep the dark T visor legible without
adding oval robot eyes. Simplify costume hardware and minimize weathering.
Any backpack is compact and contained within the existing avatar footprint.

One full-body idle character, relaxed arms close to the sides, empty hands,
feet only slightly apart, both boots visible and grounded. Same shallow
three-quarter camera and perspective as the office references. Centered
square composition with transparent margins, genuine transparent alpha,
and clean edges. Friendly, sturdy office-colleague presence.

No adult anatomical proportions, tall action figure, realistic battle armor,
gritty scratches, cinematic lighting, anime, flat illustration, pixel art,
low-poly style, gun, ammunition belt, combat stance, extra characters,
scenery, furniture, floor, pedestal, baked ground shadow, text, names,
status icons, selection rings, watermark, poster, or contact sheet.
Produce a single transparent avatar master.
```

Instruction to the agent using this prompt: **after generation, show the actual avatar preview inline, link the master, show the reference comparison, and obtain idle-design approval before continuing to pose production and replacement.** This is a workflow instruction; it is not lettering to paint into the image.

## Replacement plan after preview approval

### 1. Normalize the approved idle

Use the approved Paz master as the identity reference. Preserve the master; make separate production exports following [ASSET_CONTRACT.md](../docs/ASSET_CONTRACT.md):

- Transparent **352 × 352 WebP and matching PNG**, using the logical **128 × 128** box.
- Logical ground target **(64, 110)** and nominal safe bounds **x: 18–110, y: 5–117**.
- Match apparent height and floor contact to the existing analysts. Measure each exported pose's actual alpha-bottom position and store its normalized `groundAnchorY`; do not copy legacy offsets.
- Inspect at **32–36 CSS px desktop**, **40 CSS px phone**, and actual scene/profile sizes. Check both light and dark backgrounds for clipped equipment, stray pixels, and halos.

The approved normalized idle and pose family fit the existing renderer without CSS changes. Runtime alpha-bottom anchors are idle `326 / 352`, reading `326 / 352`, typing `327 / 352`, report-ready `326 / 352`, and attention `326 / 352`.

### 2. Create the five-pose family

Attach the approved Paz idle master for every pose. Lock helmet shape, head size, proportions, armor colors, shoulder width, badge, accessories, material finish, camera, lighting, and framing.

| Runtime pose | Action |
| --- | --- |
| `idle` | Approved relaxed stance, empty hands, grounded boots. |
| `reading` | Hold a small portfolio folio or tablet; keep visor and badge visible. |
| `typing` | Compact typing gesture using the existing pose family's prop convention; no full desk or chair. |
| `report-ready` | Present a small folio, document, or tablet within the shared bounds. |
| `attention` | Slight attentive lean or restrained hand gesture. Execution state remains in HTML. |

Deliver five WebPs and five matching PNGs. Compare every pose beside idle at equal scale; transitions must preserve identity and planted feet. Walking frames and rigged 3D animation are outside this replacement.

### 3. Replace the portfolio artwork and display identity together

Before editing UI, inspect [shared styles](../frontend/src/styles.css), [wireframes](step-4-wireframes.html), [tokens](step-4-tokens.css), the running affected views, and the asset contract. Reuse the existing renderer, loading/fallback treatments, shadows, selection controls, and responsive layout.

| File / surface | Change |
| --- | --- |
| `frontend/public/assets/office/avatars/portfolio-bot-{pose}.{webp,png}` | Replace all five pose pairs with the approved normalized Paz family together. Keep the existing asset key. |
| `frontend/src/assets/officeAssets.ts` | Set portfolio `accessibleName` to `Paz, Portfolio Analyst`; describe Paz armor and green ledger badge; update all measured portfolio ground anchors. |
| `frontend/src/demo/fixtures.ts` | Change only portfolio `displayName` from Adrian to Paz. Preserve ID, role, title/responsibilities, linked tasks, and asset/desk keys. |
| `frontend/src/components/ReportListPage.tsx` and `ReportDetailPage.tsx` | Update portfolio fallback labels to `Paz · Portfolio Analyst`; verify initials become P. |
| `frontend/public/assets/office/index.html` | Update portfolio captions, name, alt text, and all five pose previews. |
| `docs/ASSET_CONTRACT.md` | Record Paz as the portfolio display identity with the green ledger badge and folio. |
| `docs/FOUR_AGENT_WORKFLOW_SPEC.md`, `AGENTS.md`, and active identity documentation | Reconcile the previous Adrian preservation instructions with this approved Paz cosmetic replacement. Keep the same portfolio ownership and exactly four agents; preserve historical records. |
| `docs/PROGRESS.md` and this guide | Record actual implementation/verification evidence and the user approval reference. |

Inspect persisted `portfolio` data if the environment uses a backend rather than fixtures. A fixture change alone does not rename persisted data. Update only the relevant display identity through the supported owner-scoped path, preserving linked records. Do not recreate agents, reseed unrelated data, or invent external identity mappings. Reconcile verified external display labels only if they fall within the authorized rollout.

Search active legacy references beyond this table. Most office/profile/sidebar labels derive from `agent.displayName`; verify those surfaces instead of introducing duplicate hardcoded names. Preserve Rex, Clara, and Wolffe's names/artwork. Keep green portfolio interface accents; no new UI palette or layout is needed.

### 4. Verify and deliver

- Validate dimensions, true alpha, PNG/WebP framing, safe margins, measured anchors, availability, and total asset size against the existing portfolio family.
- Run relevant typecheck, lint, and build scripts and existing tests for any behavior changed. A pure artwork/name replacement does not need tests that duplicate implementation.
- Inspect the office, sidebar, profile, report list/detail, and asset gallery at **1440 px**, **360 px**, and **320 px**, in supported light/dark themes. Compare all four avatars at equal scene scale.
- Exercise all five portfolio poses and transitions. Check clipping, floor jitter, apparent size, label overlap, badge readability, and consistency with Rex.
- Check hover, keyboard focus, selection, loading, WebP failure with PNG fallback, total image failure with initial P, reduced motion, and mobile targets of at least **44 × 44 CSS px**.
- Confirm active UI and accessible names say Paz; portfolio responsibilities, digest ownership, and report/task relationships remain intact. Historical Adrian records can remain historical.
- Review the diff, stage only task files, commit, and push to the current branch's configured upstream. Leave unrelated existing changes, including the Rex guide's local move, out of the commit.

Implementation evidence for this pass is recorded in [`docs/verification/paz-avatar-replacement.md`](../docs/verification/paz-avatar-replacement.md): the five concept masters are in `design-concepts/paz-*-concept-v1.png`; the five normalized runtime pairs remain under the existing `portfolio-bot-{pose}.{png,webp}` keys; the visual review page shows the pose family; `npm run typecheck`, `npm run lint`, and `npm run build` pass; and the `portfolio` ID, desk key, responsibilities, tasks, reports, and ownership remain unchanged.

## Acceptance checklist

- [x] The actual idle avatar was shown inline with its master link and equal-scale reference comparison.
- [x] The user approved the shown idle design before pose production and runtime replacement.
- [x] Paz is recognizable through his own blue Mandalorian helmet, dark T visor, sturdy armor, and selective ochre accents.
- [x] Paz matches the existing avatars' proportions, rounded 3D construction, materials, camera, lighting, and small-size detail density.
- [x] All five poses share that approved identity, with the green portfolio badge and stable floor alignment.
- [x] Runtime name, accessible text, fallbacks, documentation, and the demo display identity are consistent.
- [x] Exactly four agents remain, with stable IDs and unchanged role ownership.
- [x] Automated checks pass and the remaining visual verification evidence is recorded separately from live integration claims.
