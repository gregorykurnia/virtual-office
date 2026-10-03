# Captain Rex avatar design guide

## Goal and scope

Create one Captain Rex-inspired idle avatar as a visual experiment for the virtual office. It should be recognizable as Rex while looking like it belongs beside the existing small, rounded, softly rendered office avatars. Start with a single transparent image; develop the other poses only after the idle design is approved.

This document is an art brief and handoff for another image-generation model. It does not replace any runtime artwork or assign the character to an analyst.

## Reference images

Supply both images to the generator, with these distinct roles:

1. **Character identity:** the user-provided Captain Rex poster, currently at `/Users/gregorykurnia/Downloads/Captain Rex Ahsoka Character Poster.webp`. Use its helmet markings, armor colors, shoulder treatment, and waist garment. This local reference must be attached separately when handing this guide to another model.
2. **Style and proportions:** [`market-bot-idle.png`](../frontend/public/assets/office/avatars/market-bot-idle.png). Match its compact silhouette, oversized head, short limbs, rounded construction, surface finish, camera, and lighting.

Additional context: [office environment](../frontend/public/assets/office/office-environment.webp), [avatar reference sheet](../design-concepts/03-avatar-states.png), and [production asset contract](ASSET_CONTRACT.md).

The Rex poster governs identity. The office avatar governs how that identity is rendered. Do not copy the poster's realistic adult proportions or gritty presentation.

## Character identity

Prioritize the features that survive at small display sizes:

| Feature | Avatar treatment |
| --- | --- |
| White clone helmet | Oversized, rounded helmet with a simplified but recognizable Rex faceplate |
| Blue forehead markings | Preserve the paired jaig-eye shapes and blue central/brow accents from the supplied reference; make their shapes clear rather than finely etched |
| Dark visor | Retain the recognizable angular clone visor silhouette; soften its edges to suit the office style |
| Blue armor accents | Use broad blue shoulder and forearm areas visible at thumbnail size |
| Shoulder pauldron | Keep the asymmetric blue shoulder piece with a dark underlayer; follow the reference rather than inventing extra armor |
| Dark waist kama | Shorten and simplify the split waist garment so the feet remain visible |
| Helmet side attachment | If visible in the supplied reference, simplify it into a small sturdy shape that stays inside the frame |

Keep the helmet on for this first test. Favor the forehead markings and visor over tiny armor seams, tally marks, or battle damage. Hands should be empty in the office idle pose.

## Office style translation

Use a polished stylized 3D render with warm ivory armor, gently rounded edges, a compact torso, short arms and legs, and chunky boots. Match the existing avatar's head-to-body ratio visually; avoid a tall action-figure silhouette.

The helmet can carry Rex's identity without using the office robot's two oval eyes. Preserve the clone visor; an optional restrained cyan reflection inside the dark visor can echo the office's face panels, but must not obscure the visor or become a pair of large robot eyes.

Use softly glossy shell surfaces, subdued dark joints, and broad readable color blocks. Keep weathering minimal: a few subtle hints at larger preview size are sufficient. Strong scratches, distressed paint, sharp metal, and photoreal skin would clash with the existing artwork.

Lighting should come softly from the upper left with diffuse fill and gentle shading under the helmet, arms, and armor. Match the office reference's shallow three-quarter/isometric view and facing direction. Avoid dramatic rim lighting, hard spotlights, or deep cinematic shadows.

### Suggested palette

These are proposed art colors, not new application tokens or canonical costume specifications.

| Use | Starting color | Guidance |
| --- | --- | --- |
| Main armor | Warm ivory `#F4F0E7` | Preserve subtle highlights and shading; avoid a flat white silhouette |
| Rex blue accents | Cobalt `#3867E8` | Starts from the office's existing blue; tune toward the poster while keeping it cohesive |
| Visor and underlayer | Charcoal `#202B3A` | Dark enough for readable helmet features |
| Optional visor reflection | Cyan `#43D8F5` | Small, restrained accent only |

## First deliverable: idle pose

Produce one full-body character on a genuinely transparent square background. Use a relaxed standing pose with both feet grounded, arms comfortably at the sides, and a confident but approachable stance. The character should read as an office colleague in Rex-inspired armor.

Center the body horizontally and match the scale and margins of the supplied office avatar. Include the entire helmet, shoulder piece, hands, waist garment, and feet. Avoid strong foreshortening, wide gestures, cropped accessories, or additional objects.

Do not include weapons, a desk, a room, a pedestal, text, names, status dots, selection rings, or watermarks. The application supplies interface labels and ground shadows separately.

## Copy-ready generation prompt

```text
Create a single Captain Rex-inspired avatar for a stylized virtual office.

Reference image 1 is the Captain Rex poster. Use it for character identity:
the white clone helmet and armor, distinctive paired blue forehead markings,
blue central and brow accents, dark angular clone visor, blue armor accents,
asymmetric blue shoulder pauldron, and simplified dark split waist kama.
Follow the supplied costume reference for the placement of these details.

Reference image 2 is the existing office avatar. Use it for style and
proportions: an oversized rounded head, compact torso, short limbs, chunky
feet, softly beveled surfaces, polished warm ivory materials, and gentle
upper-left lighting with diffuse fill. Match its camera, facing direction,
subject scale, and overall silhouette proportions closely.

Translate Rex's helmet into this rounded 3D style while preserving the
recognizable clone visor and blue forehead markings. Keep the helmet on.
The visor should stay dark and clearly shaped; a subtle cyan reflection is
acceptable but should not turn it into two large oval robot eyes. Use broad,
readable blue color blocks. Keep armor seams and weathering restrained.

One full-body character in a relaxed idle standing pose, arms by the sides,
empty hands, both boots visible and grounded. Friendly, confident presence.
Centered square composition with clear margins around all accessories.
Genuinely transparent background and clean alpha edges.

No realistic adult body proportions, gritty textures, cinematic lighting,
weapons, extra characters, room, desk, pedestal, floor, baked ground shadow,
text, labels, status icons, selection rings, or watermark. Produce one avatar,
not a contact sheet, poster, or user-interface mockup.
```

## Export and integration handoff

For the initial preview, keep a high-resolution transparent PNG master. Suggested name: `captain-rex-idle-concept-v1.png`. Preserve the existing avatar files.

If the design proceeds to runtime, follow [ASSET_CONTRACT.md](ASSET_CONTRACT.md):

- Export transparent **352 × 352 WebP and matching PNG** files, using the existing logical **128 × 128** avatar box.
- Use the logical ground target **(64, 110)**. Nominal safe visual bounds are **x: 18–110, y: 5–117**. Keep the helmet and accessories comfortably inside the image.
- Measure each exported pose's actual alpha-bottom position for `groundAnchorY`; do not assume the existing avatar's value. The renderer compensates for pose padding using the manifest.
- Check readability at the contract's **32–36 CSS px desktop** and **40 CSS px phone** reference sizes, as well as the actual current scene and profile sizes before integrating.
- Keep names, roles, status, interaction targets, and selection treatments in HTML. They must not be painted into the image.

The current manifest keys are tied to analyst IDs. A future implementation should deliberately choose an analyst or add a supported cosmetic variant; merely naming a file `captain-rex-*` will not make it appear in the application. If replacing an analyst's artwork, retain that analyst's role accessory or another non-color role distinction across all poses, as required by the asset contract.

## Later pose set

After the idle silhouette and helmet are approved, reuse that exact design as the identity reference for each pose. Keep the camera, lighting, armor colors, head size, accessory placement, and framing consistent.

| Runtime pose | Suggested action |
| --- | --- |
| `idle` | Relaxed stance, arms at sides |
| `reading` | Hold a small office tablet or folio; keep the helmet markings visible |
| `typing` | Small typing gesture with the same office prop convention as the existing set; avoid generating a full desk |
| `report-ready` | Hold a simple document or tablet outward without widening the silhouette excessively |
| `attention` | Slight attentive lean or small raised-hand gesture; actual execution status remains in HTML |

Walking frames are outside this first static-image experiment. If the project later adopts rigged 3D avatars, this artwork can guide the character's silhouette and materials; a PNG does not provide a rig or animation-ready model.

## Acceptance checklist

- Recognizable as Rex through the helmet markings, visor, white armor, and blue accents.
- Looks like the same rendered family as the supplied office avatar when shown side by side at equal size.
- Compact proportions and rounded forms; no realistic action-figure body.
- Helmet details and blue accents remain readable at small scene sizes.
- Feet and all accessories are visible, with adequate transparent margins.
- Alpha is real transparency, not a painted checkerboard or white background.
- No text, interface indicators, scenery, weapons, or baked floor shadow.
- Before integration, inspect in the actual office scene and profile view on desktop and phone for alignment, clipping, contrast, and pose stability.
