# Natural avatar behavior plan

> Requirements update — 7 October 2026: [Four-agent workflow specification](./FOUR_AGENT_WORKFLOW_SPEC.md) is authoritative for the revised roles, investor context, watchlists, reporting, coordination, editable WIB schedules, UI controls, and acceptance checks. Conflicting historical defaults below are superseded. Preserve Rex (`market`), Adrian (`portfolio`), Clara (`research`), and Theo (`risk`) and their artwork. This update records requirements; it does not claim implementation or live connectivity.

Status: foundation implemented, 4 October 2026. The first runtime slice adds deterministic stationary ambient behavior; walking, chair compositing, and social sessions remain pending the required artwork and measured scene geometry.

The current implementation is intentionally limited to supported artwork. `frontend/src/scene/avatarBehavior.ts` contains the pure status-aware transition rules, `frontend/src/scene/officeActivityController.ts` owns one shared timer and per-agent seeded rhythms, and `frontend/src/scene/useOfficeActivity.ts` connects visibility, reduced-motion, selection, and interaction holds to the React scene. Existing static poses remain the fallback while the walking, sit/stand, facing, and furniture-occlusion clips are produced.

## Goal

Make the four analysts feel like inhabitants of a calm, living office. They should occasionally shift posture, look around, walk with visible steps, sit in the chairs at their assigned desks, work or read, and briefly acknowledge another avatar. Movement should feel intentional and varied, with plenty of quiet time.

**Sitting means sitting in a desk chair, never on the tabletop.** The robot approaches the chair, faces the workstation, lowers onto the seat, and later stands before walking away.

Example: Maya finishes a seated work interval, stands, takes a few steps into the aisle, pauses and looks toward Clara. Clara turns and gives a small wave. They return to their own routines after a short exchange. Adrian keeps reading while Theo shifts his weight. Everyone has a different rhythm.

## Current project constraints

- `frontend/src/components/OfficeScene.tsx` places four clickable avatars at fixed normalized coordinates through `SCENE_LAYOUT`; desk and report shortcuts are separate controls.
- `frontend/src/components/AnalystAvatar.tsx` renders one transparent image per pose, with loading and image-failure fallbacks. It serves both scene and portrait contexts.
- `frontend/src/assets/officeAssets.ts` defines four identities and five static poses: `idle`, `reading`, `typing`, `report-ready`, and `attention`. The existing typing image is not a complete seated animation.
- The office is one 1536 × 1024 image displayed in a 3:2 frame. Desks, chairs, plants, and glass are baked into that image; they are not individually movable objects.
- `frontend/src/styles.css` supplies floor shadows, selection rings, responsive controls, and motion preferences. Ambient behavior must respect both the app preference and the system reduced-motion preference.
- Real agent statuses are `idle`, `working`, `waiting`, `offline`, and `unknown`. Animation must not change those statuses or create task/report events.

This proposal extends the earlier [avatar implementation plan](AVATAR_3D_IMPLEMENTATION_PLAN.md), which intentionally deferred walking and roaming. Preserve the robot family, camera, lighting, and fallbacks described in the [asset contract](ASSET_CONTRACT.md).

## Behavior direction and initial timing

Use a small state machine with weighted choices and cooldowns. A scripted patrol repeated by all four avatars will still look mechanical. Sample durations when an activity begins; do not reroll a decision every frame.

The following are starting values for visual tuning, not fixed product requirements:

| Activity | Visible behavior | Initial duration / frequency |
| --- | --- | --- |
| Relaxed standing | Soft blink, small head glance, restrained arm or weight shift | Stay 20–60 seconds; a small gesture every 8–20 seconds |
| Sitting at desk | Robot supported by the chair, facing its workstation | 45–120 seconds for idle/waiting routines; working stays here while work continues |
| Seated work/read | Hands move subtly; occasional head tilt or glance | Short irregular clips with quiet holds between them |
| Short walk | Stand first, face route, step along a clear aisle, settle at destination | Usually 3–8 seconds; tune distance and speed together |
| Pause or stretch | Brief rest at a reachable floor waypoint | 5–15 seconds |
| Social acknowledgment | Two avatars face each other, small wave/nod, brief pause | 4–8 seconds; each participant has a 60–120 second cooldown |

Initial crowd limits: at most one social pair and two walking avatars at once. Give all four different start delays and per-agent seeds. Avoid repeated waves, large bounces, constant pacing, and synchronized movement.

Small personality weights can distinguish them without changing their identity: Maya glances toward colleagues a little more, Adrian favors desk time, Clara favors reading, and Theo takes shorter breaks. These are decorative preferences, not claims about their capabilities or real work.

## Keep real work and ambient activity separate

Maintain a frontend-only `activity` independently of the existing `Agent.status`. The roster, profile, labels, report badges, and accessible names continue to use verified application data.

| Real status | Allowed ambient behavior |
| --- | --- |
| `working` | Prefer seated work and restrained gestures; decline social invitations and optional roaming |
| `waiting` | Seated reading, standing pauses, occasional short walk or acknowledgment |
| `idle` | Full calm routine: desk time, standing, walking, short social exchange |
| `offline` | Static attention pose at a safe home location; no autonomous social activity |
| `unknown` | Static neutral pose; preserve the unknown status treatment |

If a working status arrives while an avatar is away, end the optional activity and route it safely back to its chair. Update the actual status label immediately; do not wait for animation to finish. If offline/unknown arrives, cancel reservations and ambient behavior and settle to a static safe pose. Avoid normal-operation teleporting; reserve a static home-position reset for missing geometry/assets or an unrecoverable scene state.

Unread report badges follow their owning avatar. Compact scenes provide labeled report actions below the artwork. A wave or visual conversation never creates a message, shared report, backend collaboration, or fake chat transcript. A real collaboration feature would require a separate data-backed design.

## Animation and artwork approach

Retain the current React scene and fixed office camera for the first release. Add short transparent animation sequences, authored from a consistent robot rig and fixed camera where feasible. This gives matching steps and seated poses without immediately rebuilding the office in a realtime 3D engine.

Use existing static assets for quiet holds and fallbacks. Whole-image CSS transforms can support very small secondary motion, but cannot produce convincing walking legs, a blink, turning limbs, or sitting. Do not slide a standing image across the floor and call it a walk.

Prove one avatar before producing the full set. The initial clip set should include:

- Relaxed idle variation and a glance/blink.
- Walking loops for the approved route directions, with matching arrival/departure poses.
- Turning or facing changes for the actual desk and social positions.
- Sit-down, seated idle, seated work/read, and stand-up.
- A small wave and a nod for social acknowledgment.

Begin with the facing directions required by the selected routes rather than a full 360-degree library. Render identities from a shared model/rig or a validated consistent master. Check foot contact, silhouette, accent, accessories, lighting, and camera across every clip.

Extend the typed asset manifest with clip duration, frame count/rate, loop behavior, facing, frame dimensions, and standing/seated anchors. Use a measured sprite-atlas layout or frame sequence after the single-avatar prototype establishes memory and download costs. Prefer a modest starting frame rate such as 10–12 fps, then tune in the actual scene.

Keep root movement in the scene controller; walk frames should animate in place. Match playback cadence to route speed so feet do not skid. Sitting uses a seat/pelvis anchor, not the standing alpha-bottom anchor, and must transition between the two without jumping in size or position.

Preload a transition's required assets before starting it. If they fail or are unavailable, stay in a supported static pose and skip that activity. Record new artwork provenance and export settings in the asset contract when implemented.

## Scene geometry, chairs, and depth

Create a small hand-authored scene map measured against the production image. Coordinates stay normalized to its artwork rectangle so paths scale with the office.

For each analyst, define an assigned physical chair, workstation facing, seat anchor, standing approach point, exit point, and home standing point. The artwork contains more workstation chairs than analysts, so explicitly map the four assignments; existing desk click coordinates are not reliable seat coordinates.

Also define walkable aisle waypoints, connecting route edges, quiet standing spots, paired social spots, and blocked furniture regions. Start with short routes around the central workstation area. Lounge visits and meeting-room entry can follow after their paths and glass occlusion are verified.

Movement rules:

1. Reserve the destination chair or standing slot before moving.
2. Pick a connected route that avoids desk footprints, chairs, plants, reception, servers, and walls. Account for avatar width rather than treating the robot as a dimensionless point.
3. Reserve narrow route segments where two robots cannot comfortably pass; wait briefly or choose another eligible activity when blocked.
4. Follow route distance at a consistent apparent floor speed, allowing for the fixed camera projection. Use gentle starts/stops and actual turns at corners.
5. Release reservations on arrival, cancellation, status change, and scene unmount. Use a timeout so a failed transition cannot lock a chair or route forever.

The single background image cannot automatically cover the correct parts of an avatar. For convincing sitting, extract or author aligned foreground overlays/masks for relevant desk edges and chair parts, preserving the existing background registration. A seated torso may appear in front of a chair back while the desk edge covers the appropriate hands/lower body. Do not duplicate a complete chair on top of the baked chair.

Use floor-depth ordering for avatars and region-specific furniture occlusion; one fixed avatar z-index or sorting only by screen `y` is insufficient for all furniture. Keep decorative masks from intercepting clicks. Validate each chair's composite in standing, lowering, seated, and rising poses before enabling it.

If clean masks cannot be produced, create registered furniture layers for the affected workstation or limit the prototype to proven positions while preparing those layers. Seated behavior is not complete until the robot visibly occupies the existing chair correctly.

## Frontend architecture

Suggested module boundaries; final names can follow project conventions:

| Module | Responsibility |
| --- | --- |
| `frontend/src/scene/officeSceneMap.ts` | Normalized workstation/seat geometry, route graph, obstacles, social slots, and occlusion references |
| `frontend/src/scene/avatarBehavior.ts` | Pure state transitions, eligibility, weighted choices, sampled durations, and interruption rules |
| `frontend/src/scene/officeActivityController.ts` | Shared chair/path reservations, crowd limits, and paired social sessions |
| `frontend/src/scene/useOfficeActivity.ts` | React lifecycle, application-status input, visibility/motion settings, and controller clock |
| `frontend/src/components/SceneAvatar.tsx` | Animated scene artwork, position, facing, depth, and anchored overlays |
| Existing `AnalystAvatar.tsx` / `officeAssets.ts` | Reuse static identity rendering/fallbacks and extend the typed clip manifest |

Main state progression: `standing-idle → walking-to-chair → turning-to-desk → sitting-down → seated → standing-up → standing-idle`. Optional excursions use `walking-to-spot → pausing` or `socializing`, then return. Guards check status, asset readiness, destination availability, and motion preferences before transitions.

A social session owns both participants: invite an eligible nearby avatar, reserve two separated spots, approach if necessary, face each other, play complementary gestures, then release both. Cancel cleanly if either participant becomes busy, disappears, or loses required assets. Independent random wave timers would not create a believable interaction.

Use one scene animation clock with elapsed time, not a separate frame loop per robot. Keep high-frequency position updates out of whole-page React renders. React state should mainly change at activity boundaries. Inject a clock and seeded random source for deterministic behavior checks.

## Interaction, accessibility, and performance

- Keep avatar → Overview, desk → Assignment, report → latest report, and the roster/profile navigation intact.
- Move the avatar's name, status, report badge, and selection indicator with its scene position, keeping labels clear of nearby controls. Desk targets stay at their workstations.
- Hold movement while the avatar is hovered, keyboard focused, or being pressed so its target does not escape. Safely finish a sit/stand transition if freezing halfway would leave an invalid pose. Selected avatars can use only restrained stationary behavior while the profile is open.
- Preserve keyboard order by agent identity, not current position. Keep adequate touch targets and use the roster as the precise fallback on compact screens.
- Treat ambient motion as decorative: no screen-reader announcements for waves, steps, or every activity change.
- Reduced motion provides static seated/standing poses with no autonomous traversal or looping animation. Honor the existing app motion control and the system preference; CSS alone is insufficient if JavaScript keeps moving coordinates.
- Pause scene timing when the tab is hidden or the office unmounts. On return, resume calmly without replaying missed activities or fast-forwarding robots across the floor.
- On small screens, shorten or disable traversal where hit areas overlap; retain the roster and occasional supported stationary behavior when motion is allowed.
- Lazy-load nonessential clips after the initial office is usable. Measure compressed transfer, decoded texture memory, and frame time separately. Retain the current initial scene transfer goal in the prior plan; record a measured deferred-animation budget before producing the full library.

## Delivery phases

### Phase 1 — Prove movement and chair compositing with one robot

Inspect the running office, shared styles, wireframes, tokens, and artwork. Measure one assigned chair and a short clear aisle route. Produce one idle variation, a walk loop, and the sit/seated/stand sequence. Build an isolated in-context preview with the necessary furniture masks.

Exit criterion: Maya visibly steps along the floor and sits in her desk chair without sliding, clipping through furniture, duplicating a chair, or changing scale. Check desktop and phone size. If this fails, resolve the art/geometry approach before expanding.

### Phase 2 — Ship calm desk routines for all four

Implement the state machine and shared controller. Add all four identities, distinct timing, chair reservations, standing/seated anchors, and status-aware desk behavior. Implement interruption, loading/failure fallback, reduced motion, focus/hover holds, and hidden-tab cleanup at this stage.

Exit criterion: all four independently stand, sit in their assigned chairs, and work/read naturally; real statuses and navigation remain accurate. Basic inactivity relief is useful even before roaming is expanded.

### Phase 3 — Add short walks and paired interactions

Expand the proven route graph around the workstations. Add route reservations, collision spacing, facing changes, and coordinated nod/wave sessions. Tune quiet intervals and concurrency so activity remains occasional.

Exit criterion: two robots can acknowledge each other without overlapping or walking through furniture, release the session, and return to ordinary routines. Working avatars decline invitations and return to work when interrupted.

### Phase 4 — Tune, verify, and document

Inspect at 1440 px desktop, 1024 px with profile open, 768 px tablet, and 390/360 px phone widths. Review light/dark themes, selection, labels, touch controls, focus, and reduced motion. Observe several minutes to catch repeated loops, stalled reservations, and crowding.

Run project typecheck, lint, and build for the implementation. Add meaningful deterministic tests for transition guards, interruption, paired-session cancellation, reservation cleanup, reduced-motion behavior, and route safety. Use controlled scenarios to exercise rare states rather than waiting for random events.

Update the asset contract with delivered clips, anchors, masks, measured budgets, and fallback behavior. Record browser inspection results and remaining limitations, review the scoped diff, then commit and push task files under the repository workflow.

## Acceptance checklist

- [ ] Each robot shows restrained natural movement and an independent rhythm.
- [ ] Walking has visible steps, correct facing, stable floor contact, and safe routes.
- [ ] Every robot sits on its assigned chair seat, facing the desk; no tabletop sitting.
- [ ] Sit/stand transitions and furniture occlusion hold up at actual display size.
- [ ] Social gestures involve coordinated participants and never imply real data exchange.
- [ ] Verified work/status/report data stays authoritative throughout activities.
- [ ] Status changes, missing assets, blocked routes, and cancellations recover cleanly.
- [ ] Selection, hover, focus, touch targets, and existing navigation remain usable.
- [ ] Reduced motion stops ambient movement; hidden tabs and unmounted scenes stop scheduling.
- [ ] Performance and several-minute observation pass on relevant viewport sizes.

Recommended first implementation: Phase 1, followed by the four-avatar desk routines. Expand social behavior once walking and chair compositing are visually convincing.
