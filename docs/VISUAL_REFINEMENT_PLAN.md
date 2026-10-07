# Visual refinement checkpoint

> Requirements update — 7 October 2026: [Four-agent workflow specification](./FOUR_AGENT_WORKFLOW_SPEC.md) is authoritative for the revised roles, investor context, watchlists, reporting, coordination, editable WIB schedules, UI controls, and acceptance checks. Conflicting historical defaults below are superseded. Preserve Rex (`market`), Adrian (`portfolio`), Clara (`research`), and Theo (`risk`) and their artwork. This update records requirements; it does not claim implementation or live connectivity.

## Objective

Bring the frontend demo up to the visual quality described by the design concepts while preserving the existing technical implementation: React + TypeScript + Vite, accessible HTML controls, native SVG office assets, demo fixtures, profile/report routes, and reduced-motion behavior.

The acceptance bar comes from:

- `design-concepts/04-desktop-ui.png`
- `design-concepts/05-mobile-ui.png`
- `design-concepts/02-office-layout.png`
- `design-concepts/03-avatar-states.png`
- `design-concepts/07-visual-clarity-system.png`
- `design-concepts/step-4-wireframes.html`
- `design-concepts/step-4-tokens.css`
- `docs/ASSET_CONTRACT.md`

## Context

The existing app already has the interaction/data foundation and reusable SVG sprites, but the live office scene still reads as a basic scaffold: flat colored zones, a generic card shell, minimal depth, and low-salience selection/status treatment. The refinement should make the office feel like a warm, shallow-isometric workspace rather than replacing it with concept PNGs or a game engine.

## Scope

1. Refine the global shell and surfaces with warm neutral depth, stronger elevation, a more intentional brand mark, and a persistent but clearly bounded demo treatment.
2. Upgrade the native SVG office background with:
   - warm floor and isometric grid treatment;
   - four readable analyst zones;
   - glass meeting nook;
   - lounge furniture;
   - server racks;
   - plants and reception/briefing furniture;
   - restrained shadows and depth.
3. Improve scene controls without changing their routes or semantics:
   - larger, clearer desk and character targets;
   - pill labels and report badges;
   - stronger selected/focus states;
   - calm working/unread motion with reduced-motion support;
   - legend/help chips below the scene.
4. Give analyst roster cards stable role accents and richer surface treatment.
5. Keep Reports and report detail visually consistent with the refined surfaces without changing their data behavior.
6. Verify the build, lint, diff, responsive CSS, and live route availability. Use browser screenshots if a browser automation surface becomes available; otherwise record that limitation in the handoff.
7. Review the scoped diff, commit only task files, and push the commit to the configured upstream branch as required by `AGENTS.md`.

## Non-goals

- Do not ship or embed the concept PNGs as product UI.
- Do not replace the SVG asset contract or change agent IDs, anchors, routes, demo fixtures, or report semantics.
- Do not add pan/zoom, live infrastructure, OpenClaw integration, or new product behavior as part of this visual pass.
- Do not alter unrelated existing changes.

## Work completed before this checkpoint

- Read `AGENTS.md`, the technical implementation guide, visual direction, design concepts, tokens, and asset contract.
- Inspected the current implementation and confirmed the worktree was clean before editing.
- Compared the existing office implementation with the available concept references and prior local screenshots.
- Updated `frontend/src/App.tsx` to add role-specific roster classes and an icon wrapper in the demo banner.
- Updated `frontend/src/components/OfficeScene.tsx` with richer native SVG room artwork while retaining the existing interactive layers and coordinates.
- Updated `frontend/src/styles.css` with warmer surfaces, deeper elevation, refined office-scene controls, role accents, and restrained status/report motion.
- Ran `npm run build`, `npm run lint`, and `git diff --check` successfully after the implementation pass.

## Remaining work

- Inspect the final diff and responsive rules for regressions.
- Re-run build/lint/diff checks after this checkpoint file is added.
- Attempt final live/browser verification; note that the CUA browser surface was unavailable and local Playwright was not installed if that remains true.
- Commit the visual refinement files and push to `origin/main`.

## Expected task files

- `frontend/src/App.tsx`
- `frontend/src/components/OfficeScene.tsx`
- `frontend/src/styles.css`
- `docs/VISUAL_REFINEMENT_PLAN.md`

## Handoff criteria

The task is complete when the final checks pass, the diff contains only the scoped visual refinement and this checkpoint, the commit exists on `main`, and the push result is reported.
