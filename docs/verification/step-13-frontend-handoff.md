# Step 13 frontend handoff verification

Date: 7 October 2026
Preview: `http://127.0.0.1:4174/`
Mode: local demo data only; no model, market-data, or OpenClaw calls

## Automated checks

- PASS — `npm run typecheck`
- PASS — `npm run lint`
- PASS — `npm run build`
- PASS — `git diff --check`
- PASS — local route and asset smoke checks returned HTTP 200 for `/`, `/office`, `/reports`, `/assets/office/index.html`, the rendered office environment, and the Rex avatar asset.

## Browser captures

Screenshots were captured with Chrome DevTools Protocol device metrics so the CSS viewport matches the required target width. The office shell was checked at 360, 390, 768, and 1440 px widths; the profile, Reports, and report-detail surfaces were also captured.

| Surface | Capture |
| --- | --- |
| Office, 360 px | [office-360.png](./step-13/office-360.png) |
| Office, 390 px | [office-390.png](./step-13/office-390.png) |
| Office, 768 px | [office-768.png](./step-13/office-768.png) |
| Office, 1440 px | [office-1440.png](./step-13/office-1440.png) |
| Rex profile, 390 px | [profile-rex-390.png](./step-13/profile-rex-390.png) |
| Rex profile, 1440 px | [profile-rex-1440.png](./step-13/profile-rex-1440.png) |
| Reports, 1440 px | [reports-1440.png](./step-13/reports-1440.png) |
| Report detail, 1440 px | [detail-1440.png](./step-13/detail-1440.png) |

The responsive pass found a compact-header and demo-control wrapping issue at phone widths. The shared responsive styles now allow the banner text to wrap, stack the demo actions, preserve full-width Reset demo access, and hide only the nonessential text labels in the compact header. The 360 and 390 px captures show no horizontal overflow.

## Acceptance evidence

| Requirement | Evidence |
| --- | --- |
| Four character/desk mappings | `officeAssets.ts`, `fixtures.ts`, and `officeSceneMap.ts` map Rex/market, Paz/portfolio, Clara/research, and Theo/risk. The office captures show all four anchors and the Rex production avatar. |
| Profile tabs | The Rex profile capture shows Overview, Assignment, and Reports tabs; tab state is URL-backed as `?agent=market&tab=...`. |
| Search, analyst/date filters, unread state | The Reports capture shows the search, analyst, date, and Unread only controls; `ReportListPage` preserves them in URL parameters and report rows render unread markers. |
| Detail and back context | The detail capture shows the report metadata/context panel and `Back to Reports`; the route derives its return path from navigation state or the current list query. |
| Duplicate run prevention | `demoOfficeService.requestRun` reuses the active task for the same task/idempotency key and the profile Run now control observes the service-owned lifecycle. |
| Failure and offline scenarios | The scenario selector exposes the fixed demo scenarios and the app has explicit unavailable, empty, failed-run, and no-report states. |
| Reset demo | The demo controls include Reset demo; the service cancels active timers before clearing demo storage. |
| Demo chat labelling | Report follow-up actions are labelled as canned responses and the UI states that no model or network request is made. |
| Browser traffic | The demo service uses local fixtures and timers; source/runtime checks found no model/OpenClaw transport call in the frontend. |

## Visual-fidelity comparison

The implementation preserves the reference system's warm shallow-isometric office, readable room zones, illustrated analyst treatment, restrained status colours, selected-state ring, semantic HTML controls, and responsive desktop/phone composition. The Rex replacement is carried through the fixture, avatar manifest, scene mapping, profile, and report surfaces.

The production scene intentionally uses a bot-free rendered environment with accessible HTML/SVG interaction overlays instead of reproducing every decorative concept panel as pixels. The richer side-panel/dashboard treatment in the desktop reference is represented by the native profile, analyst-card, report shortcut, and Reports surfaces. These are recorded as deliberate implementation differences rather than unresolved rendering failures.

## Handoff limits

This is the completed frontend demonstration milestone. It has no live agents, backend, database, real holdings, market feed, model provider, or OpenClaw connection; the reports and run lifecycle remain local illustrative fixtures until Phase C1/C2.
