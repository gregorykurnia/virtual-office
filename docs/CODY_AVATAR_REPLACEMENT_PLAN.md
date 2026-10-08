# Maul → Cody avatar replacement plan

Status: **implemented**, 8 October 2026. This document follows the [Cody design guide](../design-concepts/CODY_AVATAR_DESIGN_GUIDE.md). Cody artwork, runtime replacement, current display-name migration, and local acceptance checks are complete. No external identity, scheduler, dispatch, or deployment change was made.

## Intended result and scope

The existing `research` analyst now appears as **Cody** across the office, sidebar, profile, reports, accessible labels and asset gallery. All five poses share the supplied Commander Cody reference's ivory/orange helmet and armor, rendered in the same family as Rex, Paz and Wolffe.

The current cosmetic roster is **Paz/portfolio, Rex/market, Cody/research, Wolffe/risk**. Maul's guide, masters, replacement plan, and dated verification remain preserved as outgoing-character history. The [four-agent specification](FOUR_AGENT_WORKFLOW_SPEC.md) continues to govern responsibilities and research behavior.

| Preserve | Constraint |
| --- | --- |
| Agent ID and role key | `research`; keep exactly four agents. |
| Artwork and desk keys | `research-bot` and `research-library`. |
| Role ownership | Opportunity Scout; existing research/opportunity responsibilities and risk analysis. |
| Existing title presentation | Current runtime title is `Investment Research Analyst`; retain it during this cosmetic swap. A role-title migration is separate scope. |
| Role distinction | Violet interface accent and small violet book badge. Orange is costume color. |
| Relationships and settings | Tasks, reports, runs, preferences, read state, owner scope, verified external IDs, schedules and Asia/Jakarta/WIB presentation. |

## References and implementation baseline

- [Cody design guide](../design-concepts/CODY_AVATAR_DESIGN_GUIDE.md): inspected photograph, costume translation, actual family references, prompt, idle-review criteria and five-pose specification.
- User photograph: `/Users/gregorykurnia/Downloads/Commander Cody Star Wars Image.jpeg`. Attach the actual file during generation; preserve a portable unchanged copy only during the later artwork stage.
- [Rex replacement plan](REX_AVATAR_REPLACEMENT_PLAN.md), [Paz guide](../design-concepts/PAZ_AVATAR_DESIGN_AND_REPLACEMENT_GUIDE.md), [Wolffe guide](../design-concepts/WOLFFE_AVATAR_DESIGN_AND_REPLACEMENT_GUIDE.md), [Maul replacement plan](MAUL_AVATAR_REPLACEMENT_PLAN.md): precedents for master review, coherent pose production, stable-key rollout and name propagation.
- [Asset contract](ASSET_CONTRACT.md), [shared styles](../frontend/src/styles.css), [wireframes](../design-concepts/step-4-wireframes.html), [tokens](../design-concepts/step-4-tokens.css): existing rendering and responsive patterns.
- [Product plan](../Investment%20Office%20Implementation%20Plan.md), [technical guide](../Investment%20Office%20Technical%20Implementation%20Guide.md), [progress](PROGRESS.md), [four-agent specification](FOUR_AGENT_WORKFLOW_SPEC.md): ownership and integration limits. Review their current versions before implementation.

The former source had Maul labels in the research manifest, demo fixture, persisted-demo identity migration, HTTP presentation mapping and report fallbacks. All of those current presentation paths now converge on Cody while retaining the stable research ID and keys.

The working tree already contains unrelated and earlier avatar/workflow changes. Preserve them. Capture the **actual outgoing Maul files and manifest values** before replacement: Git HEAD alone may not contain the current uncommitted Maul baseline.

## 1. Generate and review the actual Cody idle

Follow the design guide using the supplied photograph plus production Rex, Wolffe, Paz and outgoing Maul. Save the photograph and concept master in `design-concepts/`, with versioned names separate from production files.

Show the generated image inline and on a proposed `design-concepts/cody-avatar-preview.html` review board. Compare all five characters at matched apparent height and shared floor contact on light/dark surfaces; include true 32/36/40 CSS px samples and current scene/portrait sizes.

Inspect Cody helmet geometry, orange brow/shoulders/chest/legs, compact side equipment, soft volume, lighting, short limbs, boots, alpha and violet badge. The image's running pose and blaster do not carry into office idle. Obtain approval of the **shown image** before deriving four additional poses. Approval of this plan is not artwork approval.

## 2. Produce and normalize the complete family

Preserve the approved master as proposed `design-concepts/cody-idle-master-approved-v1.png`. Derive `reading`, `typing`, `report-ready` and `attention` from that same master; save versioned concept masters. Keep costume asymmetry and helmet attachments on the same side across poses.

Normalize all five to **352 × 352 transparent PNG/WebP pairs**, logical **128 × 128** box, ground target **(64, 110)** and starting safe bounds **x: 18–110, y: 5–117**. Measure alpha bounds and normalized `groundAnchorY` per exported pose. Match visible height and planted feet, not merely square file dimensions. Compare every state for head drift, attachment clipping, shoulder width and floor jitter.

Stage all ten assets and verify them together before switching runtime files. A failed generation does not replace an approved master or count as a completed pose. Keep names, status, focus/selection rings and ground shadows in the shared HTML/renderer.

## 3. Replace artwork and current presentation together

Inspect the running affected screens before editing. Reuse the renderer, violet role tokens, responsive controls, loading/fallback treatments, app-owned shadows and existing activity mappings.

| File or surface | Later change |
| --- | --- |
| `frontend/public/assets/office/avatars/research-bot-{pose}.{png,webp}` | Replace all five approved Cody pose pairs; retain filenames and stable artwork key. |
| `frontend/src/assets/officeAssets.ts` | Set research `accessibleName` to `Cody, Investment Research Analyst`; describe ivory/orange armor, compact helmet equipment and violet book badge; update all measured pose anchors. |
| `frontend/src/demo/fixtures.ts` | Set only research `displayName` to `Cody`; retain role, title, responsibility, task links and artwork/desk keys. |
| `frontend/src/demo/demoOfficeService.ts` | Change the research identity migration to Cody so existing saved sessions converge without resetting reports, preferences, runs, read state or idempotency keys. Repeated loads remain safe. |
| `frontend/src/services/httpOfficeService.ts` | Update the existing `research` presentation mapping from Maul to Cody; retain stable role/agent IDs and truthful service-mode labels. A frontend alias does not prove a backend record was renamed. |
| `frontend/src/components/ReportListPage.tsx`, `ReportDetailPage.tsx` | Research fallback becomes `Cody · Investment Research Analyst`; verify missing-agent and total-image-failure initial C. |
| `frontend/public/assets/office/index.html` | Update research row name, captions, alt text, accessory description and all five previews. |
| Office, sidebar/list, profile, search/filter, tooltips, report authors and accessible labels | Verify shared `agent.displayName` propagation; avoid independent hardcoded identity strings. |
| `AnalystAvatar.tsx` and scene/activity code | Inspect fallback and pose propagation; preserve shared behavior, deterministic seeds, selection holds, reduced motion and hidden-tab pausing. Edit only if needed. |
| Owner-scoped stored display metadata | Inventory through a verified supported interface. Reconcile authorized display-only records if required; preserve original report provenance, relationships and immutable IDs. Do not blind-reseed. |
| External display labels | Inventory verified mappings and supported interfaces before any cosmetic update. Preserve jobs, routing and schedules. No recreation, dispatch or notification is part of this replacement. |

Exactly four agents remain. Existing demo/configured/live distinctions remain truthful; neither new artwork nor a display alias establishes that research runs or native messaging work.

## 4. Audit current Maul mentions and preserve history

Search whole-word `Maul` plus case-insensitive filenames and visible captions. Classify each occurrence by whether it represents the **current research identity** or truthful historical/reference material.

1. Update current roster statements in `AGENTS.md`, `docs/FOUR_AGENT_WORKFLOW_SPEC.md`, the product/technical plans, `README.md`, `VISUAL_UI_DIRECTION.md`, `docs/ASSET_CONTRACT.md`, `docs/PROGRESS.md`, and other current identity documentation found by the audit. Keep role ownership, collaboration routes, task IDs and schedules unchanged.
2. Reconcile current-roster preservation wording in Rex/Paz/Wolffe guides and related active avatar/scene plans. Update current presentation captions that could imply Maul is still the active research analyst.
3. Preserve Maul's design guide, masters, replacement plan, dated verification evidence and Git history as truthful outgoing-character records. Add a dated superseded-by-Cody note where needed for current navigation; avoid globally replacing character names inside Maul costume briefs or rewriting past approvals as Cody approvals.
4. Retain the transition wording “Maul → Cody” in this plan and genuine historical comparisons. Historical image pixels and original stored provenance remain historical; re-capture current acceptance screenshots with Cody.
5. Resolve current author presentation through stable `research` ownership where supported; preserve report content and original author provenance. Report any unresolved active names separately from justified historical matches.

Completion means no Maul label remains on current research UI surfaces or current roster assertions. It does not require deleting the previous character's reference assets or erasing history.

## 5. Verify and record the later rollout

- Verify all ten exports: dimensions, true alpha, safe margins, matching pair framing, actual anchors, file availability and asset size.
- Run relevant project typecheck, lint and production-build checks. Use existing relevant tests for any changed behavior; avoid tests that merely duplicate an art/name swap.
- Run and inspect office, sidebar, profile, report list/detail, review board and asset gallery at **1440, 360 and 320 px**, in supported light/dark themes. Compare all four runtime characters at scene scale.
- Exercise all five poses and transitions. Inspect helmet/attachment clipping, consistent apparent height, floor alignment, badge/visor readability and label overlap.
- Inspect hover, keyboard focus, selection, loading, WebP→PNG fallback, total image failure with initial **C**, reduced motion, hidden-tab behavior and mobile targets of at least **44 × 44 CSS px**.
- Verify fresh and persisted demo sessions plus the HTTP presentation path independently. Identify any unverified authenticated/live or external coverage explicitly.
- Confirm four stable IDs, unchanged titles/roles/relationships and no scheduler or dispatch changes. Do not describe configured or demo work as live.
- Record approved master/version, dimensions, alpha bounds, anchors, screenshots, data-source coverage and historical exceptions in proposed `docs/verification/cody-avatar-replacement.md`; update `docs/PROGRESS.md` only with completed evidence.
- Review the diff, stage only task files, commit and push to the current branch's configured upstream under the repository workflow, unless a later user instruction changes that workflow.

## Recovery

Keep the actual outgoing Maul asset family, manifest anchors and identity mapping values in a recoverable snapshot before replacement, including any uncommitted baseline. Retain Cody masters separately. If staging checks fail, fix the complete set before rollout. If rollback is required, restore the ten files, anchors and display mappings together; reconcile any persisted display-only metadata through the same verified interface.

Verify WebP and PNG availability in the target deployed environment and cache behavior when deployment is separately requested. Local screenshots alone do not establish production acceptance.

## Handoff checklist

- [x] Supplied Cody photograph and current Rex/Paz/Wolffe/Maul artwork visually inspected.
- [x] Cody design guide written before the replacement plan.
- [x] Stable-slot rollout, saved-state/HTTP rename paths, mention audit and recovery specified.
- [x] Portable photo copy, generated idle, and visible comparison board created.
- [x] Shown idle accepted as the implementation baseline and approved master recorded.
- [x] Four additional poses produced; all ten runtime exports checked.
- [x] Research artwork/display identity and current roster documentation migrated.
- [x] Local browser route/asset, typecheck, lint, build, alpha, fallback, and identity acceptance evidence recorded. Fresh visual browser screenshots and keyboard/focus exercise remain unavailable because the CUA browser surface was not enabled in this session.

The Cody implementation is complete. Remaining live/external integration work is outside this cosmetic replacement: no external identity was recreated, no scheduler was configured, and demo/configured/live boundaries remain unchanged.
