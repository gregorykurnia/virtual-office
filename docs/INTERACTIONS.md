# Routes and interaction contract

This document specifies destinations and return behavior for the prototype and later live surfaces. Office and Reports are the primary destinations. The route shell currently implements `/office`, `/reports`, and `/reports/:reportId`; the remaining routes are reserved for later milestones.

## Routes

| Route | Surface | State and behavior |
| --- | --- | --- |
| `/office` | Office overview | Show the room overview and accessible analyst cards. With no selection, show all analysts and the next scheduled demo run. |
| `/office?agent=market&tab=overview` | Analyst profile | Select the stable agent ID and open the shared profile on Overview. A character/card selects Overview. |
| `/office?agent=market&tab=assignment` | Analyst assignment | Open the same profile on Assignment. A desk selects Assignment. |
| `/reports` | Reports list | Show all agents. Search/filter state is encoded in query parameters. |
| `/reports?agent=market&unread=true&q=...` | Filtered report list | Preserve agent, unread, and query filters while opening a report and returning to the list. |
| `/reports/:reportId` | Report detail | Stable URL supports direct load and refresh. When opened from a profile, retain the originating agent/tab in navigation state. A direct link returns to `/reports`. |
| `/runs` | Run history | Reserved for the live run-history surface. A run detail returns to its filtered history context. |
| `/holdings` | Holdings and watchlist | Reserved for owner-entered, dated live inputs; never seed it with assumed personal holdings. |
| `/settings` | Preferences and connections | Reserved for theme, timezone, reduced motion, and live connection status. |
| `/conversations/:conversationId` | Contextual thread | Reserved for a later report-specific conversation. Refresh retains the thread identity. |

Unknown agent IDs are ignored and resolve to the unselected Office route. Unknown report IDs show a not-found state. Query strings must be URL-encoded by navigation helpers; report list search/filter parameters remain shareable.

## Interaction and return behavior

| Trigger | Result | Close/back behavior | Mobile behavior |
| --- | --- | --- | --- |
| Select an analyst character/card | Open that analyst's profile on Overview | Closing restores focus to the initiating character/card | Analyst card is a full-size touch target |
| Select an analyst desk | Open the same profile on Assignment | Return to the prior Office position | Provide an explicit Assignment action on the card |
| Select an analyst's report indicator | Open that report with profile origin retained | Back returns to the originating profile/tab | Use a separate labeled report control so it does not also select the character |
| Select the shared briefing area | Open Reports with all agents selected | Back returns to Office | Use a labeled button/card |
| Select a report row | Open stable report detail; mark read only after detail content loads | Back restores query, filters, useful scroll position, and originating profile when present | Use full-page report detail with a visible back action |
| Change search/filter | Update the URL and matching report rows | Keep query and filters on back | Keep search and filter controls visible without horizontal scrolling |
| Run now (demo phase) | Queue one bounded simulated run and expose its state | Leaving a panel does not cancel or restart it | Same state is visible from the profile/run history |
| Escape or close a profile panel | Close the topmost dismissible surface | Return focus to the initiating control; preserve selected agent in Office URL where useful | Always provide a visible back/close button |

Use one shared analyst profile with Overview, Assignment, and Reports sections. Do not stack separate panels. On desktop the profile may be a nonmodal side panel; on mobile use a readable full-page view or a properly sized sheet. If the panel is modal, manage focus and restore it on close. If nonmodal, do not trap focus.

## Loading, empty, and error states

| Surface | Loading | Empty | Error/unavailable |
| --- | --- | --- | --- |
| Office | Room/card skeleton; label status as loading | Explain that no analysts are configured in a genuine live empty state | Keep last-known information readable and show stale/unknown status with last observation time |
| Analyst profile | Keep identity shell and show section placeholders | Explain missing assignment or report history | Show the failed section and a retry action without changing verified execution status |
| Reports list | Keep search/filter controls visible and show row skeletons | Distinguish no reports from no filter matches; provide Clear filters | Keep current query visible and provide retry; do not silently fall back to demo reports |
| Report detail | Preserve back destination and show content skeleton | Show not found for unknown IDs | Do not mark the report read until content is actually displayed |
| Runs | Show pending status distinctly from running | Explain that no runs have been observed | Show stale/unknown and last observation time; execution and delivery errors remain separate |
| Holdings/watchlist | Load the last saved, dated input snapshot | Explain that no holdings/watchlist inputs exist | Identify unavailable fields and skip calculations that lack required inputs |
| Settings/connections | Show which setting is being loaded | Show unset optional preferences as defaults | Preserve saved preference state and explain connection status separately |

## Accessibility and responsive rules

- Keep Office and Reports as the primary navigation destinations.
- Use semantic links for routes and buttons for actions; give icon-only controls accessible names.
- Support keyboard navigation, visible focus, and Escape for dismissible profile surfaces.
- Restore focus when closing an overlay and announce meaningful run/report status changes.
- Make essential information available without hover, color, sound, or character movement.
- Target touch controls around 44 px; phone profile and report content must fit without horizontal scrolling.
- Respect `prefers-reduced-motion` and a stored motion preference.
- Test layouts at 360, 390, 768, and 1440 px during the frontend demonstration milestone.
