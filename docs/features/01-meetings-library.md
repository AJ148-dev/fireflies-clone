# Feature 1 — Meetings library

The meetings home. A reviewer lands here, sees past meetings, searches and filters them, sorts by date, and opens one. This is the browse step of the assignment. Meeting detail, transcript sync, summaries, and action items are later features.

The screen is `/meetings`. The same list also appears on Home under Recent. This doc covers the library behavior, not the rest of the Home dashboard.

## What this feature is

A persisted list of the signed-in user’s meetings.

Each row answers four questions: what the meeting was called, when it happened, how long it ran, and who was in it. The user can narrow that list by title, participant, or date, and can order it newest-first or oldest-first. The chrome around the list includes a settings entry and a profile placeholder. Neither one logs anyone in.

Data comes from SQLite through `GET /api/meetings`. The four seeded meetings are enough to demo the list before anyone creates a new one.

## Required

These are the assignment must-haves for this screen. The feature is done when a reviewer can do all of them on the hosted app and the result is still correct after a refresh.

### List

- Show every meeting that belongs to the seeded user.
- Each row shows title, date, duration, and participants.
- Participants are readable as names, not only as colored initials. The host can stay prominent. The other names still have to be visible on the row (text, or initials whose tooltip is the full name).
- A row opens that meeting.
- The first load shows the seeded meetings. An account with no meetings shows “No meetings yet,” not a blank page.
- Dates and durations match the stored values. Date filters use UTC calendar days, the same clock the API already uses.

### Search

- A search field is on the library, visible without opening a menu.
- Typing matches meeting title or participant name. Matching is case-insensitive and partial (`ava` matches Ava Shah).
- The query is in the URL (`q`) so a refresh keeps it.
- No matches shows “No meetings match this search” and a way to clear the query.

### Date filter

- A from date and a to date, both visible on the library without an extra click.
- From is inclusive. To is inclusive through the end of that UTC day.
- Either bound can be empty.
- The bounds are in the URL (`from`, `to`).
- Clearing filters returns the full list.

### Sort

- Newest first is the default (`sort=recent`), ordered by `started_at`.
- Oldest first is available (`sort=oldest`).
- Sort is visible with the filters and stays in the URL.
- Search, date, and sort combine. They do not reset each other.

### Navbar placeholders

- Settings is a link to a placeholder page. The page can say settings are not part of this build. It must not be a dead click.
- Profile is a visible placeholder for the current user: name or workspace label, and a menu or panel that does not authenticate. “Coming soon” is enough for account actions.
- The same chrome stays on the library and on the meeting page.

### Empty, loading, and failure

- Loading is a short status, not a flash of the empty state.
- A failed request shows an error toast. The previous list stays on screen if one was already loaded.
- Empty search is distinct from an empty library.

## Already in the app

This is the baseline. The feature work is the gap under it, not a new list from scratch.

| Piece | Where it stands |
|---|---|
| `GET /api/meetings?q&from&to&sort` | Done. Title, participant, transcript line, summary, topic, or action item. UTC date range, `recent` or `oldest`, cap 100. |
| Seeded meetings | Done. The original four, plus later demo meetings including the Scalar YouTube conversation. |
| Row content | Title, host, date, time, duration, and up to four participant initials. Names are tooltips on the initials, not written out. |
| Search | Header field, also opened with Cmd+K. It writes `q`. The API matches title, participant, transcript text, summary, topic, and action item. |
| Date and sort | Done in the API and in a Filters panel. The panel is closed until the user opens it, so filters are not always visible. |
| Empty state | Done, including clear. |
| Settings | Link in the sidebar footer. Placeholder page exists. |
| Profile | Maya Chen, avatar MC, in the wide sidebar and in the profile menu. The menu does not log anyone in. |
| Open a meeting | Row links to `/meetings/[id]`. |

Channels (“My Meetings”, “All Meetings”, “Voice Agent Meetings”, “Uploads”), “Hosted by me” / “Shared with me”, and the Ask Fred column are visual chrome. They are not part of this requirement. “Shared with me”, voice-agent meetings, and uploads currently show an empty notebook instead of the real list.

## What we can add later

Do not build these while closing the required list. Several already exist as non-working chrome. Leave them as placeholders.

- Channels and “+ Channel”. One user, one list. No sharing model.
- “Shared with me”, voice-agent meetings, and an uploads channel that hides the real list.
- Ask Fred on this page, Slack/Gmail connect, key decisions, key initiatives.
- Real login, teams, invite coworkers, and a profile that edits a name or avatar.
- Tags, folders, status (processed / live / failed), or meeting source (Zoom, Meet, upload).
- Pagination or infinite scroll past the 100-row cap.
- Saved views, column pickers, bulk select, or bulk delete.
- A calendar, upcoming meetings, or a live capture bot. Capture stays a form or file upload, owned by the create-meeting feature.
- Keyword highlighting inside the row, or relevance ranking. Search already matches action items.
- Notifications, the free-meetings counter, and the upgrade badge. Those are shell chrome, not library behavior.

Row actions that already work (rename, delete) can stay. They are meeting management, not a reason to expand this feature.

## Done when

1. Open `/meetings` and see the seeded rows with title, date, duration, and participant names.
2. Search a title and a participant. The list shrinks. Clear it and the full list returns.
3. Set a date range that keeps one seeded meeting and drops the others. Clear it.
4. Switch between newest and oldest and see the order change.
5. Refresh with search, dates, and sort in the URL and see the same list.
6. Search for a nonsense string and see the empty state, not a blank page.
7. Open Settings from the navbar. Open the profile placeholder. Neither one pretends to log in.
