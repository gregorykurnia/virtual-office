# Virtual Office — Visual and UI Direction

> Requirements update — 8 October 2026: [Four-agent workflow specification](./docs/FOUR_AGENT_WORKFLOW_SPEC.md) is authoritative for the revised roles, investor context, watchlists, reporting, coordination, editable WIB schedules, UI controls, and acceptance checks. Conflicting historical defaults below are superseded. Preserve Rex (`market`), Paz (`portfolio`), Cody (`research`), and Wolffe (`risk`) and their stable artwork keys. Paz, Cody, and Wolffe are approved cosmetic replacements for prior display identities; linked responsibilities and records remain unchanged. This update records requirements; it does not claim implementation or live connectivity.

## 1. Art direction

### Option A — Soft 2D Isometric

- Simplified isometric office with flat shapes and light depth.
- Rounded furniture, soft shadows, and restrained detail.
- Friendly, game-like character without looking childish.
- Clear room zones created through flooring and color blocks.
- Best for making bot movement feel spatial and engaging.

### Option B — Top-Down Workspace Map

- Clean overhead floor plan with geometric furniture.
- Minimal icons, flat colors, and almost no perspective.
- Highly readable, responsive, and inexpensive to render.
- Feels closer to an operations dashboard than a small world.

### Recommendation

- Choose **Soft 2D Isometric**.
- Keep the perspective shallow and the assets intentionally simple.
- Use a fixed tile/grid system so the scene stays orderly.
- Avoid textures, complex lighting, realistic proportions, and decorative clutter.

## 2. Office layout

- Use one compact floor with four immediately recognizable zones.
- **Work area:** central desk clusters where active bots spend most of their time.
- **Meeting zone:** one table or two small rooms for collaboration states.
- **Lounge:** sofa, plants, and a coffee point for idle bots.
- **Server area:** small technical corner for maintenance, processing, or error states.
- Add a reception or spawn point near the entrance for newly connected bots.
- Separate zones with flooring, rugs, low dividers, or color—not walls everywhere.
- Use wide, visible walkways that form a simple loop around the office.
- Place destinations on a hidden grid; avatars follow short predefined paths.
- Prevent overlap by assigning standing spots at desks, tables, and lounge seats.
- Keep decorative objects near edges so the center remains readable.

## 3. Avatar design

- Use compact rounded bot characters: capsule body, simple face, short feet.
- Target size: about 28–36 px on desktop and at least 36–44 px touch area on mobile.
- Give each bot one strong base color plus a neutral face and outline.
- Add one small role accessory: headset, terminal badge, wrench, chart, or shield.
- Differentiate roles with both color and icon; never rely on color alone.
- Use subtle personality traits such as eye shape, antenna, or idle pose.
- Show the name in a short pill above the avatar when space allows.
- Show role and full status in the hover card and details panel.
- Truncate long names; reveal the full name on hover, focus, or tap.

### Avatar states

- **Active:** solid green status dot; gentle breathing animation.
- **Idle:** amber or neutral dot; relaxed pose in the lounge or at a desk.
- **Thinking:** blue dot; small looping ellipsis or soft head pulse.
- **Moving:** walking cycle with a faint directional shadow.
- **Error:** red icon and short attention pulse; no constant flashing.
- **Offline:** desaturated avatar, hollow gray dot, and stationary pose.
- Pair every state color with a label, icon, or motion cue.

## 4. Motion design

- Move avatars at a calm, consistent speed along grid-based paths.
- Use short 150–250 ms UI transitions and 300–700 ms scene transitions.
- Ease movement in and out; avoid bouncing or abrupt direction changes.
- Use a two- or four-frame walk cycle to keep animation lightweight.
- Pause briefly at corners or destinations so movement feels intentional.
- Stagger ambient animations to prevent the office from moving in unison.
- **Hover:** brighten the avatar, lift it 1–2 px, and reveal a compact info card.
- **Click/tap:** add a selection ring and open the details panel.
- **Selected:** keep a persistent ring and softly highlight the bot's current zone.
- Respect `prefers-reduced-motion` with fades and instant position changes.

## 5. UI plan

### Main screen layout

- **Header:** product name, connection health, notifications, and user/settings menu.
- **Left sidebar:** search, status filters, role filters, and bot list.
- **Office canvas:** primary focus; centered, spacious, and visually dominant.
- **Right details panel:** selected bot information and recent activity.
- **Bottom controls:** zoom, reset view, fit-to-screen, and optional pause motion.
- **Status legend:** compact, collapsible, and near the canvas controls.

### Key components

- Global search.
- Bot list with avatar, name, role, status, and last activity.
- Status and role filter chips.
- Office canvas with pan, zoom, and fit controls.
- Avatar label, status dot, hover card, and selection ring.
- Bot details panel.
- Connection indicator and last-updated timestamp.
- Status legend.
- Notification/toast system.
- Empty, loading, disconnected, and error states.

### Avatar interactions

- **Hover/focus:** show name, role, current task, status, and last update.
- **Click/tap:** select the bot, center it if needed, and open its details.
- Keep selection visible while the details panel is open.
- Clicking empty canvas clears selection; Escape closes the panel.
- Selecting a bot in the sidebar selects the same avatar on the canvas.

### Details panel

- Show avatar, name, role, status, and connection health first.
- Show current task, location, last active time, and recent events below.
- Keep actions limited to clearly safe controls such as focus or follow.
- Separate any future destructive or operational actions from basic details.

### System states

- **Loading:** office skeleton plus muted avatar placeholders.
- **Empty filter:** “No bots match these filters” with a clear reset action.
- **No bots:** friendly illustration, connection guidance, and add/connect action.
- **Error:** preserve the office if possible and show a concise retry message.
- **Disconnected:** persistent banner with reconnection status and last known update.

## 6. Desktop and mobile behavior

### Desktop

- Use a three-part layout: 240–280 px sidebar, flexible canvas, 320–360 px details panel.
- Allow the details panel to overlay the canvas on smaller laptops.
- Keep canvas controls fixed within the viewport.
- Support mouse, keyboard, trackpad pan, and wheel/pinch zoom.

### Mobile

- Make the canvas full-screen below a compact header.
- Replace the sidebar with a bottom sheet for search, bot list, and filters.
- Open bot details in a draggable bottom sheet.
- Use large tap targets of at least 44 × 44 px.
- Hide persistent name labels at low zoom; reveal them on tap or selection.
- Default to fit-to-office and limit zoom levels to keep navigation simple.
- Avoid hover-only information; every hover action must work by tap and focus.

## 7. Visual clarity

- Use warm off-white surfaces, cool gray structure, and restrained accent colors.
- Suggested base: `#F7F8FA`, `#FFFFFF`, `#DDE3EA`, `#263244`.
- Suggested accents: blue `#4F7DF3`, green `#35A66F`, amber `#D58B27`, red `#D94B55`.
- Use one modern sans serif such as Inter, Geist, or system UI.
- Use 12–14 px labels, 14–16 px body text, and 20–24 px primary headings.
- Use medium weight for names; regular weight for roles and metadata.
- Keep text on solid or softly blurred surfaces, never directly on busy scenery.
- Maintain WCAG AA contrast for essential text and controls.
- Limit each zone to one identifying hue and keep furniture mostly neutral.
- Reserve saturated color for selected items, statuses, and important feedback.

## 8. Missing considerations

- Provide keyboard navigation, visible focus states, and screen-reader labels.
- Announce meaningful status changes without announcing constant movement.
- Save zoom, panel, filter, and motion preferences locally.
- Define viewport boundaries so avatars never disappear under panels.
- Cluster or hide labels when bots overlap or the canvas is zoomed out.
- Use sprite sheets or CSS transforms; avoid layout-heavy animation.
- Cap update frequency and interpolate movement between server events.
- Handle stale presence data and clearly show the last synchronized time.
- Add optional follow mode for tracking one bot without manual panning.
- Use notification priorities so routine movement never creates alerts.
- Plan for more floors, rooms, and bots without enlarging the initial map.
- Make zone and avatar definitions data-driven for future customization.
- Track basic usability metrics: bot selection, search usage, zoom, and errors.
- Define privacy rules before showing task content or activity history.

## Final recommended direction

- Use a shallow, soft 2D isometric office with simple geometric assets.
- Build one compact floor around work, meeting, lounge, and server zones.
- Use colorful rounded bots with icon-plus-label status communication.
- Keep the office canvas primary, with collapsible side and bottom panels.
- Favor calm motion, strong accessibility, fast rendering, and easy expansion.
