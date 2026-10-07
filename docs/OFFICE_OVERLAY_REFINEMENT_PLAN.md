# Office overlay refinement plan

> Requirements update — 7 October 2026: [Four-agent workflow specification](./FOUR_AGENT_WORKFLOW_SPEC.md) is authoritative for the revised roles, investor context, watchlists, reporting, coordination, editable WIB schedules, UI controls, and acceptance checks. Conflicting historical defaults below are superseded. Preserve Rex (`market`), Adrian (`portfolio`), Clara (`research`), and Theo (`risk`) and their artwork. This update records requirements; it does not claim implementation or live connectivity.

Status: implemented on 4 October 2026. The office scene now uses the recommended
compact identity and report overlays described below.

Date: 4 October 2026

## Goal

Make the office scene calmer and keep the avatars visible while preserving clear identification, discoverable actions, and accessible navigation.

This plan follows the visual audit of the supplied office screenshot and the current `OfficeScene.tsx` and scene styles. It covers analyst names and statuses, report shortcuts, room labels, and the shared briefing action.

## Current issues

- Name/status bubbles overlap the avatars' heads, especially Maya and Clara. Their visual weight exceeds that of the characters.
- Four floating “New”/“Read” buttons compete with the desks and characters. “Read” is ambiguous between an action and a report state, and shortcut ownership is not immediately obvious.
- Five persistent room labels make decorative areas compete with interactive controls.
- Room subtitles repeat information already visible in the artwork, such as “Office entrance” and “Four analyst stations.”
- The large shared briefing control floats outside the meeting room and repeats the meeting label's subtitle.
- The default scene contains 14 separate overlays: five room labels, four name/status labels, four report buttons, and one briefing button.

The main issue is the number, hierarchy, and placement of overlays. Reducing font sizes alone will not resolve it.

## Recommended direction

Keep identity visible, reveal detail during interaction, and move general navigation outside the artwork.

| Element | Default appearance | Interaction behavior |
| --- | --- | --- |
| Analyst | Unobstructed avatar with a small name beneath its feet | Hover or keyboard focus reveals status; selection opens the existing profile panel |
| Analyst selection | Subtle ground ring | Remains visible for the selected analyst without covering the character |
| Latest report | Compact document shortcut consistently associated with its workstation | Hover/focus identifies the analyst and action; activation opens the latest report |
| Unread report | Small unread indicator on the document shortcut | Accessible name and tooltip include unread state |
| Read report | Neutral document shortcut, without a persistent “Read” label | Report state remains available in details |
| Room labels | Hidden by default | Optional “Show labels” control reveals concise room names |
| All reports | Clearly labeled action in the scene header | Navigates to the reports list |
| Meeting table | Optional secondary shortcut with a subtle interaction affordance | Opens all reports; hover/focus explains the action |

Use the existing colors, spacing, typography, focus treatment, and profile components. The compact names and report controls are needed to reduce occlusion and clarify ownership.

## Proposed changes

### 1. Analyst names and statuses

- Replace the two-line floating bubbles with compact name-only labels beneath the avatars.
- Position each name relative to the avatar's ground anchor and visible bounds. Reserve explicit clearance between the feet and label.
- Ensure names do not cover nearby desk controls or report shortcuts.
- Show status in a tooltip on hover and keyboard focus, and in the selected analyst's profile panel.
- Keep the character button's accessible name descriptive, including analyst name, role, status, and action.
- Treat any small status dot as supplementary. Status must also be available as text; color alone must not carry the meaning.
- On touch devices, use selection and the profile panel to expose details. Essential information must not depend on hover.

Current implementation concern: the avatar and label use separate fixed offsets in CSS. Their placement does not reliably reserve clearance around the rendered avatar. Review these offsets together rather than adjusting the bubble in isolation.

### 2. Report shortcuts

- Replace persistent “New” and “Read” text buttons with compact document icons.
- Use a consistent position at each analyst's workstation, measured against the actual artwork.
- Identify ownership explicitly in tooltip and accessible text, for example “Open Maya's latest report · Unread.”
- Show an unread dot only when the report is unread. Avoid a persistent animated pulse for routine unread state.
- Keep the actual interaction target large enough for touch: at least 44 × 44 CSS pixels, even if the visible icon is smaller.
- Check invisible hit areas for overlap with adjacent controls.
- Handle loading, no report, and report-fetch failure distinctly. Do not leave an unexplained document icon that looks actionable when no report can be opened.
- Retain an explanation of unavailable reports through accessible text and the existing scene notice or analyst list.

### 3. Room labels

- Hide the five persistent room labels by default.
- Remove descriptive subtitles from the scene labels.
- Add an optional “Show labels” toggle if orientation remains useful. Revealed labels should use concise room names and a subdued treatment.
- Keep decorative room labels visually distinct from buttons and out of the keyboard tab order.
- Do not imply that lounge, reception, or server areas are interactive unless they have an implemented action.

### 4. All reports and meeting area

- Move the primary reports navigation into the scene header and label it “All reports.”
- Remove the large floating shared briefing card from the artwork.
- If retaining the meeting table shortcut, position its semantic control over the table and give it a clear hover/focus treatment and accessible action name.
- Make the meeting shortcut secondary; the header action provides reliable discovery on desktop and touch devices.
- Update scene instructions to describe the final controls accurately.

## Alternatives considered

| Direction | Benefit | Tradeoff |
| --- | --- | --- |
| Small persistent names with contextual details — recommended | Balances visual calm with immediate identification | Requires careful name placement and responsive clearance |
| Names visible only on interaction | Cleanest artwork | First-time users have to explore to identify analysts; touch needs another clear route |
| Names, statuses, and actions in an adjacent roster | Strong scanning and accessibility | Scene becomes mainly a selection surface and needs additional surrounding space |

Start with the recommended direction. If names still crowd the scene at narrow widths, use the existing analyst list as the primary identification route and show the selected analyst's name in the scene.

## Implementation sequence

1. Inspect the running scene at desktop and phone sizes, including the profile-open layout. Review the current analyst list and report navigation for reusable behavior.
2. Remove default room labels and relocate the primary all-reports action.
3. Rework analyst labels with explicit avatar clearance and selected/focus states.
4. Replace report buttons with compact shortcuts and review ownership and hit areas.
5. Add contextual details and optional room-label visibility.
6. Update instructions and relevant interaction/asset documentation to match the final behavior.
7. Run relevant verification and visually inspect all affected states before committing and pushing the implementation.

## Likely files

- `frontend/src/components/OfficeScene.tsx`: scene controls, labels, accessible names, report state handling, and optional labels toggle.
- `frontend/src/styles.css`: label placement, compact report controls, tooltips, selection treatment, and responsive rules.
- `frontend/src/components/AnalystAvatar.tsx` and `frontend/src/assets/officeAssets.ts`: inspect ground anchors and visible bounds; change only if required for correct placement.
- `docs/INTERACTIONS.md` and `docs/ASSET_CONTRACT.md`: update if interaction behavior or label-placement guidance changes.

References: `design-concepts/step-4-wireframes.html`, `design-concepts/step-4-tokens.css`, and `docs/ASSET_CONTRACT.md`. No artwork regeneration is required for this plan.

## Acceptance checks

- All four avatars' heads and bodies remain unobstructed by labels and controls.
- Names are readable, consistently positioned, and clearly associated with their avatars.
- Report shortcuts clearly belong to the correct analyst and cannot accidentally trigger an adjacent control.
- Decorative rooms no longer compete with analyst actions in the default scene.
- All reports remains easy to find without exploring the artwork.
- Status and unread information remain available as text, including for keyboard and touch users.
- Tooltips appear on keyboard focus as well as hover, do not cover their triggering avatar, and stay within the available viewport. If custom tooltips are used, support dismissal and keep them available while hovered.
- Keyboard focus and selection remain clearly visible; interactive controls have descriptive accessible names.
- Review desktop, tablet, and phone layouts, plus the narrower profile-open scene, for overlap, clipping, and overflow.
- Inspect idle, working, waiting, offline, selected, unread, read, loading, empty, and report-unavailable states.
- Respect reduced-motion preferences and avoid adding attention-grabbing animation for routine state.
- Verify navigation to overview, assignment, latest report, and all reports still works.

## Implementation notes

The implementation keeps the analyst name inside the avatar's positioned button, so
future scene movement carries the identity label with the character. The name sits
close to the measured ground anchor, while status remains available through the
accessible character label, profile panel, and hover/focus detail.

Follow-up correction: report controls now share the avatar's positioned group,
so the report badge, name, and character move together. The name has a 5 px ground
gap and the document tile is approximately 23 px inside its 44 px interaction
target. On scenes narrower than 500 px, report actions move into labeled controls
below the artwork and only the selected character displays a name in the scene.
This avoids crowding while preserving report access on phones and narrow panels.
