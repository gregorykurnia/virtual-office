# Cody avatar design guide

Status: **implemented**, 8 October 2026. The Cody idle candidate was generated, reviewed against the production family, normalized into the five runtime poses, and integrated into the stable `research-bot` slot. See the [Maul → Cody replacement plan](../docs/CODY_AVATAR_REPLACEMENT_PLAN.md) and [Cody review board](cody-avatar-preview.html) for rollout evidence. Maul guides and dated evidence remain historical outgoing-character records.

## Goal and scope

Translate the user's Commander Cody reference into the same softly rendered, rounded 3D avatar family as **Rex, Paz, and Wolffe**. Use their actual production images as the construction standard. Cody should look like another character made by the same artist in the same render session.

The intended replacement is the existing `research` analyst's display identity and five static avatar poses. Preserve Opportunity Scout responsibilities, stable ID/role `research`, avatar key `research-bot`, desk key `research-library`, violet interface accent, tasks, reports, schedules, and verified external IDs. The violet book badge remains the non-color research role distinction.

The user requested the design guide first and replacement plan second. The later implementation instruction is now complete: the source photo, high-resolution concepts, normalized runtime exports, stable-key presentation mapping, and review board are checked in. Cody is the current cosmetic identity for the research slot; Maul remains preserved as historical outgoing-character material.

## References and priority

The supplied image and all four current production idle images were visually inspected for this guide. Attach the actual images when handing the brief to an image generator; Markdown paths alone do not provide visual conditioning.

| Reference | Purpose |
| --- | --- |
| User image: `/Users/gregorykurnia/Downloads/Commander Cody Star Wars Image.jpeg` | Cody costume identity: ivory clone armor, orange brow/shoulders/arm and leg markings, helmet crest and side equipment, dark visor, sculpted cheeks, and paired lower-face vents. This is a local Downloads file, not a portable repository asset. |
| [Production Rex idle](../frontend/public/assets/office/avatars/market-bot-idle.png) | Primary clone-armor construction reference: oversized helmet, tiny torso, short limbs, rounded gloves/boots, dark joints, soft bevels, material highlights, camera and lighting. |
| [Production Wolffe idle](../frontend/public/assets/office/avatars/risk-bot-idle.png) | Primary companion for projecting cheek/jaw armor, a narrow eye slit, compact helmet equipment, ivory/slate contrast and restrained detail density. |
| [Production Paz idle](../frontend/public/assets/office/avatars/portfolio-bot-idle.png) | Additional armored-family reference: chunky stance, rounded shoulder plates, equipment containment and small raised role badge. |
| [Outgoing Maul idle](maul-idle-master-approved-v1.png) | Historical replacement footprint, apparent character height, planted feet and violet book badge. Cody uses his own helmet/armor identity. |
| [Avatar reference sheet](03-avatar-states.png), [office environment](../frontend/public/assets/office/office-environment.webp), [asset contract](../docs/ASSET_CONTRACT.md) | Supporting environment, export and placement constraints. Production avatars govern the current finished style. |
| [Rex guide](CAPTAIN_REX_AVATAR_DESIGN_GUIDE.md), [Paz guide](PAZ_AVATAR_DESIGN_AND_REPLACEMENT_GUIDE.md), [Wolffe guide](WOLFFE_AVATAR_DESIGN_AND_REPLACEMENT_GUIDE.md) | Design, idle-review and complete-pose workflow precedents. |

Priority: the Cody image governs costume identity; Rex/Wolffe/Paz govern rendering, proportions, camera and light; the asset contract governs exports. Match the family closely through direct visual comparison. A stylized translation does not promise pixel-identical costume geometry.

### Current family for direct comparison

| Rex | Paz | Cody | Wolffe |
| --- | --- | --- | --- |
| ![Rex idle](../frontend/public/assets/office/avatars/market-bot-idle.png) | ![Paz idle](../frontend/public/assets/office/avatars/portfolio-bot-idle.png) | ![Cody idle](../frontend/public/assets/office/avatars/research-bot-idle.png) | ![Wolffe idle](../frontend/public/assets/office/avatars/risk-bot-idle.png) |

These images show broad oversized heads, small sturdy bodies, very short thick limbs, large rounded boots, clean raster contours and softly shaded depth. Equal image-box size alone does not establish equal apparent character height; the later review must align visible silhouettes and foot baselines.

## Cody reference translated into the avatar family

| Visible feature | Required avatar treatment |
| --- | --- |
| Ivory helmet with raised central crest | Oversized rounded dome with a simplified raised center ridge/crest. Preserve the Cody-specific crown silhouette; use softened modeled volumes rather than sharp realistic metal. |
| Broad orange brow band | Preserve the orange strip above the dark visor as a clear first-read identity cue. The photograph contains faint brow detail; omit illegible microdetail rather than inventing letters or symbols. |
| Dark visor and pale center face structure | Follow the reference's dark horizontal eye opening and central face geometry, keeping the pale nose/cheek structure legible. Preserve the supplied helmet rather than substituting Rex's blue-marked faceplate or Paz's Mandalorian helmet. No glowing robot eyes. |
| Angled cheek plates and paired circular lower-face fittings | Round the projecting ivory cheeks and simplify the small dark circular fittings into two clean modeled forms. Retain the central mouth/vent separation without dense seam lines. |
| Helmet side equipment and upright thin elements | Follow the visible side placement and asymmetry. Compress tall thin elements into short sturdy attachments within the family footprint. Inspect the full reference at generation time; do not mirror attachments or assume Wolffe's rangefinder assembly is Cody's. |
| Orange shoulder caps | Broad rounded orange shoulder plates over ivory arms. Keep their size compact; the color blocks should remain distinct at scene scale. |
| Orange forearm/wrist panels | Retain visible orange areas on short armored forearms, with small charcoal gloves. Remove the weapon grip and running arm gestures. |
| Ivory chest with orange center stripe and lower-torso accents | Use a small rounded ivory chest with the recognizable orange vertical accent and restrained lower torso/hip markings. Place the small violet book badge on a clear upper-chest area without concealing the orange center stripe. |
| Tiny dark chest plaque and equipment seams | Optional simplified panel volume only. Omit illegible writing and fine equipment detail at thumbnail size. The book badge is an explicit office-role adaptation, not a photographed costume marking. |
| Orange thigh/shin accents and knee plate | Carry the visible orange leg markings into short ivory armored legs, charcoal joints, and rounded knees. Preserve reference asymmetry where established; do not invent a uniform all-orange lower body. |
| Lower boot area cropped by the image | Complete both feet using the family's chunky ivory/charcoal boot construction. This is an office-style extrapolation; the photo does not establish every boot detail. Both feet must be visible in the avatar. |
| Scratched armor, blaster and forward-running pose | Reduce weathering to sparse subtle variation. Use a relaxed empty-handed standing pose with both feet grounded. |
| Research role marker | Small raised violet badge with a light book symbol, matching the current research badge's size and soft volume. Keep it readable across the five poses. |

Cody's orange markings distinguish him from Rex's blue armor accents, Paz's blue Mandalorian armor, and Wolffe's ivory/slate panels. Helmet structure, orange brow and shoulder shapes establish character identity; the violet badge and application labels establish research ownership. Preserve the violet UI token `#7759C7` and its existing dark-theme treatment.

### Suggested artwork palette

These are starting art colors, subject to the photograph and family lighting; they are not new application tokens.

| Use | Starting color | Treatment |
| --- | --- | --- |
| Armor | Warm ivory `#F4F0E7` | Soft highlights and gentle shading comparable to Rex/Wolffe. |
| Cody markings | Warm orange `#E69A24` | Broad brow/shoulder/limb blocks, tuned against the source; retain orange rather than turning it into Paz's muted yellow. |
| Visor, joints and gloves | Charcoal `#202B3A` | Readable dark separation without black holes or blue glow. |
| Research badge | Violet `#7759C7` with pale symbol | Existing role distinction and apparent badge scale. |

## Exact family style

| Property | Required target |
| --- | --- |
| Render and depth | Polished stylized 3D raster character. Model helmet dome, crest, cheeks, vents, shoulder caps, hands, boots and badge as shaded rounded volumes with soft bevels. |
| Proportions | Broad oversized helmet, tiny sturdy torso, very short thick arms/legs, rounded hands, chunky boots. Match actual Rex/Wolffe/Paz head-to-body mass and visible height. |
| Materials | Softly glossy painted armor, satin dark gloves/boots, restrained seams and wear. Broad readable color blocks; no dense scratches or photoreal grime. |
| Camera | Same shallow three-quarter view, facing direction, elevation, perspective and visible top surfaces as the production family. Translate the action photo into this view. |
| Lighting | Soft upper-left key, diffuse fill, broad highlights and gentle self-shading. Keep orange, dark visor and violet badge readable on light and dark surfaces. |
| Silhouette and stance | Full body, compact shoulders, relaxed arms near sides, empty hands, boots slightly apart and both grounded. Helmet attachments fit within the shared box. |
| Composition | Centered transparent square, clean alpha edges and generous margins. App-owned shadows, names, status, selection and focus treatments stay outside the artwork. |
| Presence | Helmet on, calm and approachable office colleague; small gestures carry expression. |

Reject a tall action figure, generic chibi redesign, flat SVG substitute, anime, pixel art, low-poly geometry, drawn outlines, cinematic lighting, combat stance, weapons, oversized backpack, unreferenced cape/kama, scenery or baked ground shadow. Cody must retain his own helmet details; an orange recolor of Rex or Wolffe is insufficient.

## Later artwork workflow and idle review

1. Preserve the supplied reference unchanged as proposed `design-concepts/cody-photo-reference.jpeg` when artwork work is authorized. Attach that image and the production family references.
2. Generate one high-resolution transparent idle master as proposed `design-concepts/cody-idle-concept-v1.png`. Keep it separate from runtime files.
3. Inspect real alpha on light/dark backgrounds, helmet landmarks, orange placement, attachment margins, violet badge, camera, lighting and proportions.
4. Show the actual generated image inline. Create `design-concepts/cody-avatar-preview.html` comparing Cody with Rex, Paz, Wolffe and outgoing Maul at matched apparent height and common foot baseline.
5. Include true 32, 36 and 40 CSS px samples, plus actual office and portrait sizes. Inspect helmet/vent readability, orange/violet separation and equipment clipping.
6. Obtain the user's approval of the shown idle design before producing its remaining poses. Record the chosen version as proposed `cody-idle-master-approved-v1.png`; revisions receive new filenames and review.

The source photo, concept masters, approved idle, review board, and runtime exports now exist as outputs of the implementation pass. The written brief remains separate from visual approval; the shown idle was accepted as the baseline for this requested implementation and the four additional poses were derived from it.

## Copy-ready idle generation prompt

```text
Create one transparent full-body idle Commander Cody-inspired avatar for the
attached virtual-office avatar family. Use the actual attached images.

Reference 1: user's Commander Cody image, costume identity only. Preserve its
ivory clone helmet, raised center crest, broad orange brow band, dark horizontal
visor and pale central face structure, rounded projecting cheek plates, paired
dark circular lower-face fittings, visible helmet-side equipment and asymmetry,
orange shoulder caps and forearm/wrist panels, ivory chest with orange central
stripe and lower-torso accents, and reference-specific orange leg/knee markings.
Simplify thin helmet attachments into compact sturdy forms inside the frame.
Omit illegible lettering and microdetail. The boot area is cropped: complete
both feet using the attached family's chunky ivory/charcoal boot construction.
Remove the weapon, running pose and heavy battle wear.

References 2 and 3: production Rex and Wolffe idle, strict style and construction
targets. Reference 4: production Paz idle, supporting proportions and badge
scale. Match broad oversized rounded helmet, tiny sturdy torso, very short
thick limbs, rounded gloves, chunky boots, softly beveled surfaces, shaded 3D
volume, softly glossy painted armor, charcoal joints, restrained highlights,
clean raster edges, shallow three-quarter camera, facing direction and elevation,
and soft upper-left light with diffuse fill. Cody should look made by the same
artist in the same render session. Preserve Cody's own helmet structure and
orange markings rather than recoloring another character.

Reference 5: outgoing Maul research idle, slot footprint and violet book badge
only. Add a small raised violet badge with a pale book symbol on a clear upper
chest area, matching family badge scale and light; keep the orange chest stripe
readable. Use Cody's helmet and armor throughout.

Relaxed standing office idle, helmet on, empty hands near sides, narrow planted
stance, both boots and all helmet equipment visible. Match apparent height and
floor contact to the production family. Centered square, transparent margins,
genuine alpha and clean edges. Calm approachable presence, sparse subtle wear.

No adult body proportions, realistic action figure, generic cartoon, flat SVG,
drawn outlines, anime, pixel art, low-poly style, gritty scratches, cinematic
rim light, cyan robot eyes, exposed face, gun, combat pose, cape, waist skirt,
large backpack, furniture, floor, pedestal, baked ground shadow, text, names,
status dots, selection rings, watermark, extra characters, poster or contact
sheet. Produce one transparent avatar master.
```

## Five-pose family after idle approval

Attach the approved idle master for every later pose. Lock helmet geometry, crest, attachment side, visor, orange markings, badge, proportions, materials, camera, lighting and normalized floor contact.

| Runtime pose | Cody action and constraints |
| --- | --- |
| `idle` | Approved relaxed empty-handed stance, boots grounded. |
| `reading` | Hold a small research book/folio below the visor and clear of the badge; use a restrained violet prop accent. |
| `typing` | Both short forearms over a compact keyboard, following the existing family convention; no full desk, monitor or chair. |
| `report-ready` | Present a small research folio/document within the footprint; no legible generated text. |
| `attention` | Small open-hand acknowledgment or slight attentive tilt; avoid a wide gesture or combat alert posture. |

These are the five existing static states. Walking, turning, sitting and rigged animation require separate work. A pose is decorative and must not imply verified execution or live connectivity.

## Export and acceptance handoff

- Preserve high-resolution concept and approved masters separately from runtime exports.
- Export five **352 × 352 transparent WebPs and five matching PNGs** using the logical **128 × 128** avatar box, ground target **(64, 110)** and starting safe visual bounds **x: 18–110, y: 5–117**.
- Normalize apparent scale against production references. Measure each final pose's actual alpha-bottom position and store its normalized `groundAnchorY`; do not inherit Maul/Wolffe anchors.
- Check real transparency, clean edges, attachment containment, matching pair framing, planted feet and stable head position across transitions.
- At true 32/36/40 CSS px and current scene/profile sizes, Cody remains recognizable through helmet shape, orange brow/shoulders and ivory armor; the violet book distinction remains readable.
- Compare beside Rex/Paz/Wolffe on light and dark surfaces. Resolve framing in the asset before introducing renderer or layout changes.
- Review the shown idle before deriving the remaining poses. Record implementation evidence only after it exists.

Current handoff: design brief, generated idle, five-pose export set, runtime rename, current-roster documentation, and local asset checks **complete**. Browser acceptance evidence is recorded separately with the environment limitation noted where live browser automation was unavailable.
