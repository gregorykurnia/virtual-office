# Reference-matched 3D office visual plan

> Requirements update — 8 October 2026: [Four-agent workflow specification](./FOUR_AGENT_WORKFLOW_SPEC.md) is authoritative for the revised roles, investor context, watchlists, reporting, coordination, editable WIB schedules, UI controls, and acceptance checks. Conflicting historical defaults below are superseded. Preserve Rex (`market`), Paz (`portfolio`), Clara (`research`), and Wolffe (`risk`) and their stable artwork keys. Paz is the approved cosmetic replacement for the portfolio display identity; Wolffe replaces the risk display identity, with linked responsibilities and records unchanged. This update records requirements; it does not claim implementation or live connectivity.

Status: environment and avatar slices implemented, 3 October 2026. The rendered office background, normalized interaction frame, and reference-matched raster analyst family are now in the frontend.

## Visual target and source of truth

Make the office resemble the rendered miniature workspace in these references:

- [Office layout](../design-concepts/02-office-layout.png): primary composition, camera, floor silhouette, furniture, plants, and lighting reference.
- [Art direction comparison](../design-concepts/01-art-direction-comparison.png): use the **left-hand isometric scene** for material quality and object depth. The right-hand overhead map is not the target.
- The user's current-site screenshot: baseline for evaluating the change from a flat four-zone map to a cohesive miniature office.

Success means recognizable similarity in perspective, arrangement, material shading, and softness at actual website size. A few gradients or stronger CSS shadows on the current map will not meet this target.

The PNGs take precedence for this visual work over the earlier wording in `VISUAL_UI_DIRECTION.md`, `design-concepts/GENERATION_NOTES.md`, and `docs/VISUAL_REFINEMENT_PLAN.md` that favors simple geometry and avoids rendered artwork. Before implementation, update `docs/ASSET_CONTRACT.md` to allow production raster scenery and character assets. Keep the concept images as references; author a separate production scene suited to the four real analysts and their controls.

## Chosen rendering approach

Use a fixed-camera, pre-rendered isometric office with HTML interaction layers and matching transparent rendered character assets. This gives direct control over the illustrated 3D appearance while fitting the existing React application.

Start with one cohesive static environment containing floor, furniture, glass, plants, and shadows. Render the four analysts separately so their identity and pose can reflect application data. The environment must contain no decorative extra bots, baked names, statuses, or report badges.

For the first version, keep analyst placements fixed at their desks. That allows a single environment plus four character layers without requiring a full scene engine. Prepare a foreground masking layer only where desks or plants need to obscure characters. Moving characters through the office would require additional depth layers or a real 3D scene and is a separate implementation decision.

Real-time 3D is unnecessary for the requested fixed visual presentation. Reconsider it only if camera rotation, free navigation, or complex spatial animation becomes a requirement.

## Composition to reproduce

Use the same overall spatial arrangement as `02-office-layout.png`, with four analyst stations in the central work area:

| Region | Intended appearance and placement | Product behavior |
| --- | --- | --- |
| Center | Two rows of paired light-oak desks on one muted blue-gray work rug; monitors, chairs, small desk plants | Four distinct assignment targets and four analyst overview targets |
| Upper left | Cream sofa, sage armchair, round coffee table, warm rug, low cabinet, leafy plants | Quiet lounge scenery |
| Upper right | Glass meeting enclosure, oak table, blue chairs, pendant light | Shared briefing target opens Reports |
| Lower left | Rounded reception counter, oak slat divider, small blue rug, planters | Entrance scenery |
| Lower right | Three charcoal server racks on a dark floor inset, restrained teal indicator lights, surrounding plants | Technical scenery; no additional actions implied |
| Perimeter | Thick cream floor platform, gently rounded edges, connected pale walkways, warm off-white background | Open space for compact labels and selection cues |

Keep the lounge and meeting room behind the workstations, with reception and servers nearer the viewer. Use broad paths around the central work area. Replace the existing four oversized pastel rectangles and dashed borders with spatial separation through furniture and flooring.

Suggested analyst assignment: Rex at the left work station, Paz at the rear station, Clara at the front station, and Wolffe at the right station. Exact anchors must be measured from the final artwork, rather than imposed on an image generated independently.

## Art requirements

### Camera and geometry

- Fixed elevated three-quarter view, close to the layout reference; parallel-looking desk edges and consistent perspective throughout.
- Broad diamond-like floor footprint, with visible front thickness and rounded perimeter corners.
- Furniture has visible tops, side faces, thickness, rounded edges, and believable contact with the floor.
- Reserve enough headroom around each analyst for controls without hiding faces or monitors.
- All separate assets share the environment's camera direction, scale, and lighting. Avoid mixing overhead desks with front-facing icon bots.

### Materials and lighting

- Floor: warm ivory with quiet tile detail; soft tan platform sides.
- Desks and cabinetry: pale oak, subtle grain, rounded edges, gentle highlights.
- Sofa and chairs: cream upholstery, sage lounge fabric, muted blue task chairs.
- Glass: translucent blue-green panels, thin dark frames, restrained reflections; visible furniture inside.
- Plants: varied rounded leaves with shaded volume, warm neutral planters, controlled density.
- Servers: charcoal housings, visible side depth, small teal indicators.
- Bots: rounded white ceramic-like shells, dark glossy face panels, small cyan eyes, role accessories and restrained accent colors.
- One broad soft light from the upper left; consistent shadows cast toward the lower right. Darker contact shadows under objects, soft ambient shading in joints, and subtle highlights on curved surfaces.
- Match the reference's warm, diffuse illustrated rendering. Avoid heavy outlines, flat pictograms, hard spotlighting, excessive gloss, or a dark gaming aesthetic.

### Analyst identity

Preserve the existing manifest identities: Rex / market blue, Paz / portfolio green, Clara / research violet, Wolffe / risk red. Keep a small headset/chart, blue armored folio/ledger, book, and slate/light rangefinder armor with shield/console distinction respectively. The reference's antenna colors are inspiration, not a reason to change application role meanings.

Produce the five existing pose keys (`idle`, `reading`, `typing`, `report-ready`, `attention`) using consistent silhouettes and ground anchors. Validate one character in context first, then expand to four characters and their poses. Reuse matching portraits in roster and profile components so the scene and surrounding UI share one character style.

## Interaction and visual hierarchy

The office artwork should dominate the canvas. Characters stand or sit in the scene without the current large square avatar-card backgrounds. Desk hit areas are transparent semantic buttons, with restrained hover and focus outlines.

Use compact name/status labels on opaque warm-white surfaces. At narrow widths, emphasize the selected analyst's label and provide all identities through the accessible roster. Keep report badges close to their corresponding desks, away from faces and primary furniture. Place the shared briefing shortcut by the meeting room instead of a large central green panel.

Retain existing routing and data behavior: character → Overview, desk → Assignment, report badge → latest report, briefing → Reports. Actual statuses remain HTML labels sourced from application data; decorative art must not imply a different execution state.

Reuse the current `--io-*` text, action, role, focus, spacing, and radius tokens for controls. Warm materials belong to the artwork. Use a subtle floor-level selection ring and visible keyboard focus rather than recoloring whole rooms. Preserve hover, focus, selected, disabled, loading, empty, and error treatments, plus reduced-motion behavior.

## Asset and layout contract

- Environment: production master around 2400 × 1600, maintaining the reference's approximately 3:2 composition; deliver optimized WebP/AVIF variants with a supported fallback.
- Characters: 20 transparent 352 × 352 WebP runtime poses with PNG fallbacks, authored from larger square masters; consistent logical 128 × 128 box, measured alpha-bottom offsets, safe bounds, ground anchor, and pose alignment.
- Foreground layer, if needed: transparent export aligned exactly to the environment's master canvas. Keep each shadow in one layer to avoid doubling it.
- Store asset URLs, natural dimensions, ground anchors, and analyst/desk/report/briefing coordinates in a typed manifest. Record the artwork provenance and reproducible generation/export instructions.
- Use one aspect-ratio-preserving scene wrapper for the image and every interactive layer. Replace the existing stretched `preserveAspectRatio="none"` behavior; never independently stretch the background or overlays.
- Express placement in normalized coordinates against the same artwork rectangle. If letterboxing is needed, controls stay inside that rectangle rather than being positioned against the outer container.
- Keep artwork decorative for screen readers and use named HTML controls for interaction. The roster remains a complete alternative to navigating the scene.
- Start with a target of at most 1 MB for the desktop environment and at most 2 MB for the initially visible scene asset set. Measure exported quality and transfer size before finalizing these budgets; load alternate poses only as needed.
- Reserve the image dimensions to prevent layout shifts. If artwork fails to load, show a calm fallback and keep analyst/report navigation usable.

## Implementation sequence and visual checkpoints

1. **Prepare the production scene.** Generate or render a bot-free environment following the composition and material brief. Inspect it beside both source PNGs. Resolve camera, floor silhouette, room placement, lighting, and material problems before integration. Output: environment master, optimized preview, and generation/export notes.
2. **Prove character compatibility.** Done. The four identity masters and five pose variants share the reference camera, warm upper-left light, glossy face panel, cyan eyes, transparent square canvas, and measured alpha-bottom offsets.
3. **Integrate the visual scene.** Done. `AnalystAvatar.tsx` is the shared renderer for `OfficeScene.tsx`, analyst cards, and `AnalystProfilePanel.tsx`; the old SVG character fragments are no longer used in normal operation.
4. **Refine overlays and responsive behavior.** Done. Scene hit targets remain separate from artwork, selection is a floor ring, labels/statuses remain semantic HTML, and the roster remains the precise mobile alternative.
5. **Verify against the references.** Browser screenshots were inspected at desktop, profile-open laptop, tablet, and phone widths. Typecheck, lint, build, asset dimensions/alpha checks, and the refreshed asset review page are part of the delivered verification pass.

These checkpoints are implementation quality gates. They do not imply that artwork or application changes have already been made.

## Acceptance criteria

- At first glance, the scene reads as a softly rendered miniature 3D office with an isometric floor, rather than a dashboard diagram.
- The lounge, central workstations, glass meeting room, reception, and server corner occupy the reference's relative positions.
- Furniture shows material shading and visible volume; glass shows transparency; plants and bots have rounded depth; shadows agree across all layers.
- Four analysts are clearly identifiable, correctly seated/placed, and visually consistent with the environment. No duplicate or baked-in decorative bots appear.
- The reference comparison uses both an artwork-only view and the final website screenshot. Good source artwork alone is insufficient if oversized controls hide it.
- Desk, analyst, report, and briefing interactions work using mouse, touch, and keyboard. Labels and badges remain legible without obscuring faces, overlapping one another, or drifting after resize.
- Desktop with the profile open keeps the scene proportional. Phone layouts have no page overflow or overlapping scene targets; accessible list controls remain at least 44 × 44 CSS px.
- Selected, working, waiting, idle, offline, unread/read, missing-report, loading, and failed-artwork states remain understandable. Motion respects user preferences.
- Browser inspection confirms crisp assets, no visible transparent-edge halos, sensible occlusion, stable layout, and acceptable loading cost.
- Build/lint and relevant existing interaction checks pass after implementation. Any unavailable browser verification is explicitly recorded.

## Main risks and how to resolve them

The hardest part is creating coherent artwork, not placing an image in React. Separately generated bots can differ in camera, lighting, or proportions; validate the first composited bot and use the same approved visual reference for subsequent assets. If that method cannot produce coherent assets, use a common 3D source scene and camera for environment and character exports.

The concept has more decorative robots than the product has analysts. Author the background without robots so application characters are the only occupants. Complex desk occlusion may require a foreground mask; confirm character seating before freezing the environment.

At phone width the reference's furniture becomes small. Prioritize the full-office overview and accessible roster over crowding every workstation with permanent labels. The visual plan changes the office presentation; new mobile navigation patterns or character movement should be evaluated separately if they become necessary.
