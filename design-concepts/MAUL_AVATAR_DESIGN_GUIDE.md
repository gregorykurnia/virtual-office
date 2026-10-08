# Maul avatar design guide

Status: design guide revised, 7 October 2026. The current deliverable is documentation only. This guide defines Maul in the exact rendering family of the existing avatars. The [visual reference board](maul-avatar-preview.html) and [saved board image](maul-design-reference-board.png) contain the supplied photo and production style references. Artwork creation and replacement are future work described in the [replacement plan](../docs/MAUL_AVATAR_REPLACEMENT_PLAN.md).

## Goal and scope

Translate the supplied Darth Maul photograph into the same rounded, softly rendered 3D avatar family as Rex and Paz. Maul replaces the display identity and artwork of the existing third, `research` analyst. Keep the Opportunity Scout responsibilities, stable ID `research`, `research-bot` artwork key, `research-library` desk key, violet role accent, and linked records. The [replacement plan](../docs/MAUL_AVATAR_REPLACEMENT_PLAN.md) covers the later rollout and complete Clara → Maul name audit.

This pass refines the design guide and reference handoff. Any future artwork must use the production avatars as the visual standard. The planned cosmetic replacement retains research ownership and the four-agent boundary.

## References and priority

Attach these actual image files to any image-generation handoff. Paths or Markdown links alone are not visual conditioning.

| Reference | Purpose |
| --- | --- |
| [Supplied Maul photograph](maul-photo-reference.jpeg) | Facial identity: red skin, reference-specific black tattoo layout, bald horned head, amber eyes, and black upper clothing. This is an unchanged copy of the user's Downloads image. |
| [Production Rex idle](../frontend/public/assets/office/avatars/market-bot-idle.png) | Primary rendering target: proportions, rounded construction, camera, lighting, finish, boots, and detail density. |
| [Production Paz idle](../frontend/public/assets/office/avatars/portfolio-bot-idle.png) | Second finished family reference; confirms compact proportions, gentle material highlights, and role-badge scale. |
| [Current research idle](../frontend/public/assets/office/avatars/research-bot-idle.png) | Replacement footprint, relaxed stance, and violet book badge. Do not preserve the robot face or antenna. |
| [Asset contract](../docs/ASSET_CONTRACT.md) | Runtime exports, placement, alpha, safe bounds, and semantic labels. |
| [Rex design guide](CAPTAIN_REX_AVATAR_DESIGN_GUIDE.md), [Paz guide](PAZ_AVATAR_DESIGN_AND_REPLACEMENT_GUIDE.md) | Existing design and replacement workflow precedents. |

Priority: photo governs Maul's face; production Rex/Paz govern style; asset contract governs exports. Match recognizable facial landmarks closely, but adapt anatomy, pose, and shading to the existing avatar system. A stylized translation cannot promise pixel-identical facial geometry or tattoos.

## Photo-to-avatar translation

| Photo feature | Required avatar treatment |
| --- | --- |
| Bald red head | Oversized rounded exposed head, occupying the same visual head volume as Rex/Paz helmets. No helmet, mask, headset, or hair. |
| Forehead tattoos | Follow the photo's central dark vertical field and paired curved black shapes above the brows. Keep red channels separating the major black masses. Avoid arbitrary stripes or a generic red face with dark eye sockets. |
| Eyes and brows | Amber-yellow irises inside broad black orbital markings. Simplify the intense brow into a focused, calm expression; keep both eyes readable. No cyan robot eyes, glowing beams, or angry snarl. |
| Nose and cheeks | Red central nose and recognizable angular black nose/cheek contours. Keep the overall near-bilateral organization while following visible reference asymmetries. |
| Mouth and chin | Closed mouth, dark mouth/chin field, and narrow vertical red chin accents. Preserve landmark placement without rendering photographic wrinkles or pores. |
| Horn crown | Follow the visible arrangement of forehead, crown, and temple horns; short tapered ivory-gray horns with darker bases. Round the tips slightly for the soft toy construction. Keep every visible horn within the safe box; do not invent a symmetrical ring of identical spikes. Unseen rear horn placement is not established by the photo. |
| Black upper clothing | Simple charcoal layered neckline/tunic. The photo does not show a complete outfit: belt, short split hem, gloves, and boots are explicitly an office-style extrapolation, not photographed costume evidence. |
| Research distinction | Small violet book badge on the chest, matching the existing research badge's scale and visual language. Keep it legible against the dark outfit in every pose. |

The tattoo shape relationships matter more than fine surface detail. At small size, the first-read cues are the red/black head, amber eyes, short horn crown, dark outfit, and violet book badge. Do not repaint the whole uniform red or change the UI accent to red: Wolffe retains the red role accent.

Suggested artwork colors: red `#C92D3D`, black markings `#17191E`, charcoal cloth `#26303B`, amber eyes `#D6A344`, ivory-gray horns `#B8B5A6`. Tune against the supplied photo and lighting; these are art starting points, not new CSS tokens. Retain the research UI accent `#7759C7`.

## Exact family style

| Property | Target |
| --- | --- |
| Render | Polished 3D toy-like raster character with smooth volumes, soft bevels, gentle self-shading, and clean edges. |
| Proportions | Oversized head, compact torso, very short thick limbs, small rounded hands, chunky boots. Match actual Rex/Paz proportions rather than an arbitrary chibi ratio. |
| Materials | Smooth satin skin/tattoo finish; restrained highlights, matte charcoal cloth, simple rounded folds. No realistic skin grain, sweaty gloss, gritty metal, or mirror finish. |
| Camera | Match production avatars' shallow three-quarter view, visible top surfaces, facing direction, and perspective. Do not retain the photo's frontal portrait crop. |
| Light | Soft upper-left key and diffuse fill, consistent with Rex/Paz. No cinematic rim light, strong red glow, or harsh portrait shadows. |
| Idle | Full body, relaxed arms near sides, empty hands, boots slightly apart and grounded. Calm office-colleague presence. |
| Silhouette | Compact shoulders and short hem; avoid a wide flowing cloak, long horns, or robe reaching beyond the boots. |
| Composition | Centered square with genuine transparent margins; no floor, pedestal, baked ground shadow, furniture, text, or status indicators. |

Reject tall realistic action figures, different collectible styles, flat cartoons, anime, pixel art, low-poly models, helmets, weapons, combat poses, and arbitrary tattoo redesigns. Clothing should not be as glossy as Rex's armor; matching family lighting and volume is more important than making all materials identical.

### Shared construction: match the production artwork

Use the actual Rex and Paz images above as the construction reference. Maul should look like another character from their same set, with these specific relationships preserved:

| Shared feature | Required Maul construction |
| --- | --- |
| Head volume | Broad, rounded, oversized head with visible side depth, comparable in visual mass to the existing helmets. Build the forehead, brow, cheeks, nose, jaw, and ears as softly shaded volumes. |
| Body volume | Small sturdy torso beneath the head, rounded shoulders, short thick upper arms and forearms, compact hips, and short legs. Keep the hands near the hips and the boots fully visible. |
| Feet and stance | Wide rounded boot toes, visible top surfaces, thick soles, and a narrow relaxed stance matching the references. Feet share the existing family’s floor contact and perspective. |
| Edges | Smooth raster contours defined by material and light. Avoid black drawn outlines, polygonal corners, or line-art seams. |
| Surface depth | Use gentle shading under the brow, chin, neckline, arms, and clothing overlaps. Highlights follow curved surfaces; a gradient laid over a flat shape does not establish the required volume. |
| Camera | Match the reference yaw, elevation, perspective, and facing direction together. The source face must be translated into that view, rather than retaining the photo’s frontal composition. |
| Lighting | Broad soft highlights toward the upper left, diffuse illumination across the face and torso, and restrained shading on the opposite side. Keep the dark clothing readable using the same lighting environment. |
| Detail scale | Broad facial markings and a few rounded clothing overlaps. Match the references’ visual density; avoid dense tattoo linework, tiny cloth wrinkles, or ornate costume equipment. |

### Character identity within the shared style

Maul’s red skin, black tattoos, amber eyes, horns, and charcoal clothing supply character identity. They do not change the shared proportions, camera, lighting, edge treatment, or rendering quality. Tattoo shapes follow the rounded forehead, cheek, and jaw surfaces, with the same illumination as the skin beneath them. Horns are small shaded tapered forms with rounded tips and visible bases. Eyes sit within modeled brow and socket forms, with restrained iris highlights. Cloth has broad rounded folds and readable volume while remaining less reflective than armor.

Preserve the existing violet book badge’s apparent size and raised rounded construction. Keep its violet backing and light book symbol readable against the charcoal chest. The badge receives the same light as the surrounding outfit.

The flat SVG substitute failed this standard and was removed. Future review must compare the actual artwork beside Rex and Paz at matched apparent height. A match requires the same volume, proportions, camera, lighting, and finish together.

## Future artwork handoff and visual review

These steps apply when artwork creation is requested separately. They are not tasks to execute during this documentation revision.

1. Inspect and attach the four actual image references above.
2. Generate one high-resolution transparent full-body idle master; save separately as `design-concepts/maul-idle-concept-v1.png`. Do not overwrite production images.
3. Inspect the actual image and alpha on light and dark backgrounds. Review face landmarks, horns, head/body ratio, clothing, badge, camera, and light direction.
4. Display the real result inline and in the [review page](maul-avatar-preview.html). Include Rex, Paz, and the existing research avatar at equal apparent character height and common foot baseline. Equal file-box sizes alone do not guarantee equal silhouette scale.
5. Include true **32, 36, and 40 CSS px** samples, with no CSS doubling or zoom mislabeled as actual size. Review at larger portrait/scene sizes as well.
6. Obtain approval of the shown idle design before producing the remaining poses and applying the replacement. This is the staged design checkpoint used in the Paz guide; this plan-only request does not claim design acceptance.

No idle approval question is pending now because no generated candidate exists. The reference board explicitly distinguishes current production artwork from the future Maul concept. Do not present the source photograph as the finished avatar or invent a successful generation record.

## Copy-ready prompt

```text
Use case: style-transfer.
Create a single transparent full-body idle Maul avatar for this virtual office.

Reference 1: supplied Maul photograph, facial identity only. Preserve the
bald red head, reference-specific black forehead pattern, black framing
around amber-yellow eyes, red central nose, angular black cheek/nose
contours, dark mouth/chin field, narrow red chin markings, and visible
crown of short ivory-gray horns with darker bases. Follow the photo's
visible horn arrangement and tattoo landmarks rather than random stripes.
Simplify fine texture, not the defining pattern. Calm focused expression,
closed mouth, uncovered head. No helmet or robot eyes.

References 2 and 3: production Rex and Paz idle avatars, strict STYLE
targets. Match oversized head to compact torso, very short thick limbs,
rounded hands, chunky boots, smooth polished toy-like 3D volumes, soft
bevels, restrained highlights, detail density, shallow three-quarter
camera, facing direction, and soft upper-left light with diffuse fill.
The result should look made by the same artist in the same render session.
Use their broad rounded head volume, small sturdy torso, compact shoulders,
short thick arms, rounded hands near the hips, and chunky rounded boots.
Model the brow, cheeks, nose, jaw, ears, horn bases, neckline, and cloth
overlaps with visible soft depth. Tattoos conform to the curved face and
share its lighting. Contours come from shaded volumes, without drawn black
outlines. Keep the same camera yaw, elevation, perspective, and facing
direction as the production references; do not copy the frontal photo view.

Reference 4: current research idle avatar, role badge and footprint only.
Small violet book badge on chest, matching its scale and visual language.
The supplied photo shows only black upper clothing: extrapolate a simple
compact charcoal tunic with layered neckline, small belt, short split hem,
rounded dark gloves and boots. Minimal broad cloth folds, no ornate armor.
Cloth remains gently matte while the head has smooth restrained highlights.

Relaxed standing office idle, empty hands near sides, boots slightly apart,
whole body visible. Same apparent character height and floor contact as
production references. All horns contained inside square framing with
transparent margins. Genuine transparent alpha and clean edges.

No scenery, floor, pedestal, ground shadow, furniture, weapon, lightsaber,
combat stance, text, name, status icon, selection ring, watermark, poster,
contact sheet, extra characters, adult anatomical proportions, photoreal
skin texture, gritty surfaces, cinematic lighting, anime, flat illustration,
pixel art, low-poly style, vector drawing, heavy contour strokes, or flat
shapes with decorative gradients. Produce one square transparent avatar master.
```

Attach actual references when using the prompt. This brief is a future handoff; it is not evidence that image generation succeeded.

## Pose family after idle approval

Lock the approved face/tattoos, horn arrangement, proportions, materials, outfit, violet badge, camera, lighting, and foot alignment in every pose. Attach the approved idle master for each generation.

| Pose | Office action |
| --- | --- |
| `idle` | Approved grounded, empty-handed stance. |
| `reading` | Small book or research tablet, below the face and clear of the badge. |
| `typing` | Compact typing gesture using the existing research prop convention; no full desk or chair. |
| `report-ready` | Present a small research folio/document within the shared footprint. |
| `attention` | Slight attentive lean or restrained hand gesture; verified state stays in HTML. |

Export each as a **352 × 352 transparent WebP and matching PNG**, following the logical 128 × 128 box, ground target `(64, 110)`, and starting safe bounds `x: 18–110, y: 5–117`. Measure per-pose alpha-bottom anchors after normalization. Preserve masters separately. Inspect horns, dark-cloth separation, and planted feet; do not reuse Clara's anchors blindly. See the replacement plan for runtime integration and acceptance.

## Current acceptance

- [x] Supplied photograph preserved unchanged in this folder.
- [x] Design requirements, generation prompt, pose brief, and replacement plan written.
- [x] Portable visual reference board created with production style references.
- [ ] Actual Maul idle generated and shown; blocked by the generator's output-stage rejection.
- [ ] Idle design approved.
- [ ] Five matching poses exported and integrated.
- [ ] All current Clara display references migrated to Maul and rollout verified.
