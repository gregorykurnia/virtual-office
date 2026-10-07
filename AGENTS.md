# Agent Instructions

## UI and Visual Consistency

Before changing a screen or component:

1. Inspect the affected UI and its source files. When available, view the running screen at the relevant viewport. Review the shared styles, components, design tokens, and references. For this project, start with `frontend/src/styles.css`, `design-concepts/step-4-wireframes.html`, and `design-concepts/step-4-tokens.css`; use `docs/ASSET_CONTRACT.md` for office artwork.

2. Reuse existing patterns, components, and tokens. Keep the change visually consistent with the current UI. Introduce a new style, pattern, component, or layout when requested or needed for the feature, accessibility, or responsive behavior; briefly explain the reason.

3. Before editing, consider visual regressions such as misalignment, inconsistent spacing or sizing, poor contrast, overflow, and missing hover, focus, loading, empty, or error states.

4. If the proposed approach conflicts with the established design or risks a clear visual regression, explain the specific issue and suggest an alternative that fits the existing system. Ask for input when the choice cannot be inferred safely.

5. After changing the UI, run it and inspect the affected screen at relevant viewport sizes and states. Fix visible regressions. If browser-based visual inspection is unavailable, say so and describe what you were able to verify.

## Git Workflow

1. After completing a requested change, review the diff and perform the relevant verification. Commit the files changed for that task without asking for separate confirmation.

2. Push the commit to the current branch's configured upstream after committing. This repository's `main` branch tracks `origin/main`.

3. Keep unrelated existing changes out of the commit. Stage only the files belonging to the current task. Never amend or force-push. If committing or pushing is blocked, explain what prevented it.

## Four-agent workflow requirements

Before implementing research workflows, read `docs/FOUR_AGENT_WORKFLOW_SPEC.md`, the product plan, technical guide and `docs/PROGRESS.md`. The specification supersedes old role/schedule defaults. Keep exactly four existing identities: Adrian/portfolio owns portfolio and digest assembly; Rex/market owns global markets; Clara/research owns opportunities; Theo/risk owns AI and technology. Preserve stable IDs, names and artwork. Implement risk analysis within these roles.

Never treat watchlists as holdings, invent allocation inputs, or describe demo/configured work as live. Use dated portfolio inputs, approved targets, primary sources and Asia/Jakarta schedules displayed in WIB. Verify installed OpenClaw interfaces before configuring jobs; reconcile existing jobs and uncertain dispatches without blind retries. Shared app storage is the coordination boundary until native messaging is verified. Keep documentation and acceptance evidence current as each workflow is implemented.
