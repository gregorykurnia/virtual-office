# Rendered 3D analyst avatar implementation plan

> Requirements update — 7 October 2026: [Four-agent workflow specification](./FOUR_AGENT_WORKFLOW_SPEC.md) is authoritative for the revised roles, investor context, watchlists, reporting, coordination, editable WIB schedules, UI controls, and acceptance checks. Conflicting historical defaults below are superseded. Preserve Rex (`market`), Adrian (`portfolio`), Clara (`research`), and Theo (`risk`) and their artwork. This update records requirements; it does not claim implementation or live connectivity.

Status: implemented, 3 October 2026. This document records the reference-matched avatar work delivered after the rendered office environment. The fixed-camera character slice is complete; walking, roaming, camera rotation, and a real-time 3D engine remain outside scope.

The delivered runtime contains 20 transparent 352 × 352 WebP poses with matching PNG fallbacks, a typed per-agent/per-pose manifest, a shared scene/portrait renderer, measured ground offsets, a calm loading state, and a one-time format fallback. The WebP family is approximately 1.11 MB and the PNG fallback family is approximately 1.86 MB.

## Target and references

Replace the flat outlined analyst characters with small, softly rendered robots that look physically present in the office: rounded white shells, glossy dark face panels, luminous cyan eyes, shaded limbs, subtle reflections, and believable contact shadows.

Reference priority:

1. [Desktop concept](../design-concepts/04-desktop-ui.png): primary robot appearance, proportions, material finish, floor contact, and perspective. The user's second screenshot shows this same visual direction.
2. [Office layout concept](../design-concepts/02-office-layout.png): how rounded robots fit into the warm office lighting and desk scale.
3. [Current production environment](../frontend/public/assets/office/office-environment.webp): actual camera, lighting, and placement context for the new assets.
4. [Avatar states concept](../design-concepts/03-avatar-states.png): pose and expression ideas only. Its outlined illustration treatment is not the final rendering target.

Keep the four existing analysts and the current office environment. This is the character slice of [the existing 3D visual plan](ISOMETRIC_3D_VISUAL_PLAN.md), not a new office redesign. Walking, roaming, camera rotation, and a real-time 3D engine are outside this change.

## Why the current avatars still look flat

- `frontend/public/assets/office/analysts.svg` builds every character from the same front-facing shapes, a 4-unit dark outline, mostly flat fills, and a simple ellipse shadow. It contains 20 symbols: four identities × five poses.
- `frontend/src/assets/officeAssets.ts` still returns SVG fragment URLs through `avatarAssetHref()`.
- `OfficeScene.tsx`, the analyst cards in `App.tsx`, and `AnalystProfilePanel.tsx` all render those fragments with `<svg><use /></svg>`.
- `styles.css` adds a drop shadow to the whole scene button, including its overlays, and outlines the selected character's circular button. These effects do not create material depth or a floor-aligned selection ring.
- The asset contract says avatars should render at 32–36 px on desktop, but the scene currently uses `clamp(3rem, 8%, 5.2rem)` for the square avatar control. Artwork scale and interaction target size need to be specified separately and reconciled with the actual scene.
- The documented ground anchor is `(64, 110)` in a 128 × 128 box, while the current button uses `translate(-50%, -100%)`. That aligns the box bottom to the waypoint, not the documented feet position. Replacement art must fix this discrepancy rather than inherit it.

The main work is new coherent character artwork and correct compositing. CSS polish supports that work but cannot substitute for it.

## Rendering and asset approach

Use separately rendered, transparent raster avatars inside the existing React scene. This matches the environment's rendered appearance without introducing a scene engine.

Start with the built-in image generation workflow using the desktop concept, office layout, and actual environment as visual references. Generate one master robot, then derive identities and poses from that master instead of generating each independently. Request real alpha transparency; never use an opaque white or checkerboard background as a cutout.

If generation cannot keep the camera, silhouette, or pose alignment consistent, switch character production to a shared 3D model and fixed camera. This is an asset-authoring fallback; runtime delivery remains transparent images.

### Character art brief

- Elevated three-quarter camera matching the current office; show a little of the head top and side volume while keeping both eyes readable.
- Compact rounded white ceramic/plastic body, distinct head and torso, small shaded arms and feet, and a short antenna with a colored tip.
- Dark rounded face panel with two cyan eyes and restrained glossy highlights. Avoid the thick ink outline and flat smiling-eye treatment of the current sprites.
- Soft light from the upper left, gentle shadow toward the lower right, ambient shading around joints, and warm reflected light matching the floor.
- Stable proportions, camera, lighting, and material finish across every identity and pose.
- No baked names, labels, status dots, selection rings, report badges, desk furniture, or extra robots.
- Role accents identify analysts; verified execution status remains in the existing HTML labels and indicators.

| Analyst | Accent retained | Persistent identity detail |
| --- | --- | --- |
| Maya / market | Blue `#3867e8` | Small headset and chart detail |
| Adrian / portfolio | Green `#16845b` | Ledger/folio detail |
| Clara / research | Violet `#7759c7` | Book/bookmark detail |
| Theo / risk | Red `#c53b4a` | Shield detail |

Keep accessories subtle enough for the reference's simple rounded silhouette, but readable in larger roster/profile views. Identity must also remain available through text.

### Export contract

- Author at least 512 × 512 transparent masters. Export consistent square canvases with enough resolution for 2× display at the largest profile size.
- Retain the existing logical 128 × 128 design box and `(64, 110)` ground anchor if possible. In a 512 × 512 master this is `(256, 440)`. Keep current safe bounds as a starting point, and document any necessary revision before integration.
- Deliver alpha WebP runtime files with transparent PNG fallbacks; no JPEG for avatars. Record actual dimensions, URLs, normalized anchor, and any per-pose offsets in the typed manifest.
- Use separate floor/contact shadow treatment for scene avatars; roster/profile portraits should not inherit floor shadows. Confirm that no shadow is counted twice between artwork and CSS.
- Optimize idle assets for initial loading and preload likely next poses after idle assets are ready. Keep the existing complete-scene initial transfer target of at most 2 MB; measure actual output before finalizing export quality.
- Store provenance, generation prompts/settings where available, reference paths, and normalization/export instructions. Keep source masters outside the runtime asset set.

## Implementation sequence

### 1. Prove one robot in the real office

Produce Maya's idle pose first. Make a temporary in-context composition at her intended waypoint using the actual production background and current screenshot as the baseline.

Tune perspective, proportions, visible height relative to the chairs and monitors, white balance, face readability, alpha edges, and shadow softness at actual browser size. Start around 4–6% of artwork width for visible robot width, then choose the final size from the composition rather than treating that range as a fixed requirement.

Check a selected and unselected view. The robot must read as a small physical object without labels or a selection effect doing the work. Resolve this checkpoint before producing the other identities and poses; it is a visual quality gate, not a required user approval pause.

Output: one reference-compatible master, a documented scale/anchor, and an office comparison image.

### 2. Produce the four identities and five poses

Derive the four analyst variants from the successful master, then produce the existing pose keys:

| Pose | Intended artwork |
| --- | --- |
| `idle` | Neutral relaxed stance |
| `reading` | Holding a small readable book or folio |
| `typing` | Working posture and hands directed toward the workstation; avoid a second desk or oversized floating keyboard |
| `report-ready` | Holding a small document without baking in the app's report badge |
| `attention` | Subtle concerned expression/gesture; HTML still explains the actual state |

Review all 20 poses as a contact sheet and at scene size. Normalize foot position, head scale, lighting, and margins so a status-driven swap does not jump or resize. A props change must not hide the defining accessory or push the character outside its safe bounds.

Ship the complete pose set together. Do not silently map unfinished poses to idle or mix rendered avatars with the old SVGs in normal operation.

Output: 20 normalized avatar assets, optimized formats/fallbacks, shadow assets or a verified shared shadow treatment, and a refreshed review page.

### 3. Integrate one reusable avatar renderer

Update `frontend/src/assets/officeAssets.ts` with a typed per-agent/per-pose image manifest. Replace SVG fragment consumption with a shared `AnalystAvatar.tsx` component supporting scene and portrait contexts, stable reserved dimensions, decorative image semantics, loading, and a one-time fallback to PNG on image failure.

Use it in:

- `frontend/src/components/OfficeScene.tsx` for scene characters.
- `frontend/src/App.tsx` for analyst-card portraits.
- `frontend/src/components/AnalystProfilePanel.tsx` for profile portraits.

Keep the current pose selection and routing behavior during this visual change. Scene working → typing, waiting → reading, unread report → report-ready, offline → attention, otherwise idle; the profile currently uses its own working/waiting/idle mapping. Share rendering without accidentally changing these data rules.

If both image formats fail, display a restrained initial/identity placeholder and retain the button, name, status, and navigation. Avoid fallback loops and blank interactive targets.

Output: all three existing illustrated avatar surfaces use the rendered assets. Report-list initial badges can stay as their existing compact identity treatment.

### 4. Ground the characters and tune overlays

Treat each `SCENE_LAYOUT.character` coordinate as the feet waypoint. Position the artwork using its normalized anchor: for the existing logical box, horizontal offset is −50% and vertical offset is −85.9375% of the image dimensions, not −100%. Apply these offsets to the artwork layer independently of hit-area sizing.

- Scale the art with the scene; keep semantic touch targets at least 44 × 44 px without inflating the robot itself.
- Remove the whole-button drop shadow. Place a restrained contact shadow and a shallow floor ellipse behind each robot; use the ellipse for selection. Keep a clear keyboard focus treatment using existing `--io-*` tokens.
- Inspect each existing waypoint before changing it. Prefer a visible open floor patch beside its assigned desk when that avoids difficult occlusion.
- If the chosen position requires a desk or plant to cover part of the robot, add an accurately aligned foreground mask for that local region. Do not let characters appear pasted over monitors or desk fronts. Decorative masks must not intercept input.
- Keep name/status labels above or beside the face with sufficient clearance. Reposition nearby report shortcuts only where they cover the new artwork or collide with labels.
- Check the large briefing shortcut against the new composition; make only the local placement/size adjustment needed to keep characters visible.
- Retain existing narrow-screen label behavior and the accessible analyst roster. If scene hit targets overlap at phone widths, use the roster as the precise interaction surface and define a coherent compact scene policy rather than enlarging the art.
- Preserve reduced-motion behavior; these five poses work without animation. Any optional ambient animation is later work after static visual quality is established.

Output: characters grounded in the office, stable pose swaps, clear selection/focus, and readable overlays.

### 5. Verify and document the finished change

Inspect the running office at 1440 px desktop, 1024 px with the profile open, 768 px tablet, and 390/360 px phone widths. Compare equivalent-sized crops with `04-desktop-ui.png`, including an artwork-only view and a final UI view.

Exercise all identities and poses, selected/unselected, hover/keyboard focus, working/waiting/idle/offline, unread/read/missing reports, image loading/failure, dark theme, and reduced motion. Check scene → Overview, desk → Assignment, report → latest report, and briefing → Reports through mouse, keyboard, and touch-sized controls.

Run `npm run typecheck`, `npm run lint`, and `npm run build`. Run existing relevant interaction tests if available; add targeted coverage only for new behavior such as format fallback or anchor logic where it provides meaningful protection.

Update `docs/ASSET_CONTRACT.md`, `docs/ISOMETRIC_3D_VISUAL_PLAN.md`, `design-concepts/README.md`, and the asset review page to describe the actual delivered raster character contract. Review the scoped diff, commit the task files, and push to the configured upstream per `AGENTS.md`.

## Completion criteria

- All four avatars visually match the softly rendered robot family in the desktop reference, with curved material shading and no heavy outline.
- The robots share the office camera, light direction, and scale, with believable floor contact and appropriate furniture occlusion.
- All 20 poses retain identity and swap without anchor or scale jumps.
- Scene, roster, and profile artwork share the same character family; face, name, and status remain legible.
- Selection lies on the floor, focus is visible, and labels/report controls do not hide faces or collide at inspected widths.
- The office remains usable while assets load or fail; layout stays stable and keyboard/touch navigation remains intact.
- Final browser comparisons, measured asset sizes, verification results, and any remaining limitations are recorded. Asset generation alone does not count as completed integration.
