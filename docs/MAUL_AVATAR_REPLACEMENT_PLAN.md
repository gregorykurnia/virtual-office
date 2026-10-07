# Clara → Maul avatar replacement plan

Status: planned, 7 October 2026. Design guide and visual reference board complete; a hand-authored vector direction study is now visible in the folder. Actual generated idle, user design acceptance, runtime replacement, and name migration remain pending. The built-in image generator rejected the idle request at the output stage (`moderation_blocked`); no Maul render was returned.

## Intended result

The existing `research` analyst displays **Maul** throughout the office, sidebar, profile, reports, accessible labels, asset gallery, and current identity documentation. Its five poses share the supplied Maul photograph's recognizable face in the same soft 3D style as Rex and Paz.

Keep exactly four agents: Paz/portfolio, Rex/market, Maul/research, Theo/risk. Preserve ID and role `research`, avatar key `research-bot`, desk key `research-library`, violet accent, Opportunity Scout responsibilities, report/task ownership, verified external IDs, and current schedules. This cosmetic change does not recreate an agent, change routing, or configure research workflows.

The user's requested Clara → Maul display replacement supersedes earlier name-preservation wording for this slot. The [four-agent specification](FOUR_AGENT_WORKFLOW_SPEC.md) continues to govern ownership and research behavior. Current demo title `Investment Research Analyst` differs from the planned role label `Opportunity Scout`; preserve current titles in this cosmetic rollout rather than silently implementing a role migration.

## Design references

- [Maul design guide](../design-concepts/MAUL_AVATAR_DESIGN_GUIDE.md): precise photo translation, style constraints, prompt, and five-pose brief.
- [Visual reference board](../design-concepts/maul-avatar-preview.html): source photo beside actual Rex, Paz, and research art. **Not a generated Maul preview.**
- [Vector design exploration](../design-concepts/maul-avatar-concept.svg): hand-authored direction aid for review; **not a generated or approved runtime asset.**
- [Portable source photograph](../design-concepts/maul-photo-reference.jpeg): unchanged copy of the user's input.
- [Asset contract](ASSET_CONTRACT.md), [shared styles](../frontend/src/styles.css), [wireframes](../design-concepts/step-4-wireframes.html), and [tokens](../design-concepts/step-4-tokens.css).
- [Rex replacement precedent](REX_AVATAR_REPLACEMENT_PLAN.md) and [Paz guide](../design-concepts/PAZ_AVATAR_DESIGN_AND_REPLACEMENT_GUIDE.md).

## 1. Review an actual idle candidate

Generate and inspect a transparent Maul idle master following the design guide. The vector direction study in the reference board is available for discussion while generation is blocked, but it cannot satisfy the approval gate. Show the actual candidate inline and in the reference board on light and dark surfaces, beside Rex/Paz/current research at matched apparent height and shared floor contact. Include true 32/36/40 CSS px samples. Inspect reference-specific tattoos, amber eyes, horn placement, black clothing, violet book badge, camera, proportions, alpha edges, and small-size readability.

Obtain acceptance of that concrete shown design before generating the remaining poses or changing runtime art/names, matching the staged Paz workflow. No design approval is requested from a text description or a source photograph. A blocked generation remains pending, with no fabricated concept file or accepted preview record.

## 2. Normalize and create five poses

Preserve the approved master separately. Normalize to 352 × 352 transparent PNG/WebP pairs using the logical 128 × 128 box, ground target `(64, 110)`, and starting safe bounds `x: 18–110, y: 5–117`. Horns must stay inside bounds. Match apparent height and floor contact to production references; avoid compensating for a badly framed asset with global CSS changes.

Create `idle`, `reading`, `typing`, `report-ready`, and `attention`. Lock facial markings, horns, outfit, badge, camera, lighting, and proportions. Measure actual alpha-bottom position per pose and update `groundAnchorY` with the corresponding normalized measurement. Compare transitions at equal scale for head drift, horn clipping, and floor jitter. Deliver ten runtime files together so states cannot revert to the old robot. Walking/rigged animation is separate work.

## 3. Replace display identity and artwork together

Inspect the running affected screens before editing, then reuse the shared renderer, role tokens, loading states, shadows, responsive controls, and fallback system. Maul's red face is character art; the research interface accent remains violet.

| Surface | Required change |
| --- | --- |
| `frontend/public/assets/office/avatars/research-bot-{pose}.{png,webp}` | Replace all five approved pose pairs together; retain keys. |
| `frontend/src/assets/officeAssets.ts` | `accessibleName: "Maul, Investment Research Analyst"`; describe horned red/black head, dark tunic and violet book badge; record all measured pose anchors. |
| `frontend/src/demo/fixtures.ts` | Change only research `displayName` to `Maul`; keep IDs, role, title, responsibility, task links and asset/desk keys. |
| `frontend/src/components/ReportListPage.tsx` | Research fallback `Maul · Investment Research Analyst`. |
| `frontend/src/components/ReportDetailPage.tsx` | Same research fallback label. |
| `frontend/public/assets/office/index.html` | Research row captions, alt text, identity summary, and all five previews say Maul. |
| Shared avatar/office/sidebar/profile/search/tooltip/report labels | Verify `agent.displayName` propagation; total image failure initial becomes M, not C. Avoid duplicate hardcoded labels. |
| Persisted agent records and stored display-only metadata | Inspect actual supported owner-scoped storage path and update research display name where present. Fixtures alone cannot rename live backend responses. Preserve relationships and immutable IDs; no blind reseeding. |
| Verified external display labels | Inventory before rollout; update only supported, authorized cosmetic labels. Do not guess IDs, recreate agents, dispatch jobs, or send messages. |

## 4. Complete the Clara → Maul mention audit

The user requests **all mentions** changed later. Complete this as an explicit audited migration, including active documentation and visible reference captions; do not stop after the fixture rename.

1. Search repository text with `rg -n -i -w 'clara' --glob '!package-lock.json'`. Use a whole-word search to avoid changing `declaration` or other unrelated substrings. Include tracked filenames, SVG/HTML labels, alt text, fallback strings, examples, and any identity-bearing test data. Re-run at rollout time, as files may have changed since this plan.
2. Update `AGENTS.md` and `docs/FOUR_AGENT_WORKFLOW_SPEC.md`: identity table, Opportunity Scout heading, collaboration names, routing examples, and schedule owner labels. Keep the same ID/role ownership and four-agent count.
3. Update current sections in `Investment Office Implementation Plan.md`, `Investment Office Technical Implementation Guide.md`, `README.md`, and `docs/{ASSET_CONTRACT,DECISIONS,AVATAR_NPC_BEHAVIOR_PLAN,AVATAR_3D_IMPLEMENTATION_PLAN,ISOMETRIC_3D_VISUAL_PLAN,VISUAL_REFINEMENT_PLAN,OFFICE_OVERLAY_REFINEMENT_PLAN,INTERACTIONS,PROGRESS,API,DATA_MODEL,FIREBASE_SETUP}.md` wherever the old display name appears. Treat this list as the current inventory, not an exhaustive allowlist.
4. Reconcile Rex/Paz guide statements naming Clara as an identity to preserve, plus this guide/plan and review-page captions. After rollout they refer to Maul. Do not accidentally imply that prior screenshots already showed Maul.
5. For dated historical prose, preserve facts while removing the visible old name, for example “the research analyst's former display identity,” with an explicit dated Maul replacement note. Rename identity labels, not historical actor IDs or report provenance. Keep immutable original stored records and Git history intact; where old author names can appear in UI, resolve presentation through the stable `research` ID without modifying report content or ownership.
6. Historical screenshot pixels and original external records cannot be fixed by text substitution. Re-capture current acceptance screenshots with Maul and update visible links/captions. Classify archived evidence explicitly. Do not claim a literal zero-old-name guarantee across Git history or immutable outside records. If a served historical asset visibly contains the old label, remove it from current presentation or replace its current-view capture while retaining truthful archival evidence.
7. End with zero old-name occurrences in current runtime text and current identity documentation; report any deliberately retained historical/immutable matches by file or record and reason. Do not hide unresolved active matches behind a broad historical exception.

No rename is performed in this planning pass; current documentation and fixtures still describe the current Clara runtime identity. This plan records the user's intended future Maul display identity and prevents name/artwork drift during rollout.

## 5. Verify and deliver the rollout

- Validate every export's dimensions, real alpha, safe bounds, matching pair framing, anchors, file availability, and total size.
- Run `npm run typecheck`, `npm run lint`, and `npm run build`; run existing relevant tests if behavior changes. Pure art/name swaps do not need tests duplicating implementation.
- Run and inspect office, sidebar, profile, report list/detail, and asset gallery at 1440, 360, and 320 px in supported light/dark themes. Compare all four avatars at scene scale.
- Exercise five poses and transitions; check horn/robe clipping, floor alignment, apparent height, face/badge readability, label overlap, hover, selection, keyboard focus, loading, WebP→PNG fallback, total-image-failure initial M, and reduced motion. Mobile controls stay at least 44 × 44 CSS px.
- Check demo and actual configured data sources separately. Confirm Maul everywhere in current display surfaces; verify exactly four stable IDs, unchanged roles/tasks/reports, no invented live connectivity or schedule changes.
- Record concrete acceptance evidence, candidate approval, verified data-source coverage, and retained historical exceptions in `docs/verification/maul-avatar-replacement.md` and `docs/PROGRESS.md` when implemented.
- Review diff, stage only task files, commit, and push to configured upstream without amendment or force push. Keep the existing unrelated Rex guide move out of the commit.

## Current handoff acceptance

- [x] Design guide and replacement plan saved with portable source photo, visible style reference board, and a clearly labeled vector direction study.
- [x] Complete active-name audit and historical evidence treatment specified.
- [ ] Real Maul idle generated, shown, and accepted.
- [ ] Five matching runtime poses integrated.
- [ ] Display data and all current mentions migrated to Maul.
- [ ] Runtime/browser checks and acceptance evidence complete.
