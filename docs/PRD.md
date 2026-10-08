# PRD — Meeting Notes Platform (Fireflies-style)

**Status:** Assignment plan. What shipped is in [STATUS.md](./STATUS.md).  
**Source:** [assignment doc](https://docs.google.com/document/d/1G0OGs33Izknq7K2O2bkXhykaN0AMZwbFX-5n0QeFzKk/edit)  
**Effort:** about 24 hours  
**User:** one default logged-in user (no real auth)

## 1. Problem

People leave meetings with a recording and no usable notes. Fireflies solves that by turning a meeting into a searchable transcript, a short summary, and a list of action items, inside a library of past meetings.

This product must feel like that workspace. It does not need to transcribe audio. Transcripts, summaries, and action items are seeded, pasted, uploaded, or generated from transcript text.

## 2. Goal

A reviewer can open a hosted app, browse seeded meetings, open one, click a transcript line and see the player jump to that time, read the summary and action items, search, and create, edit, and delete a meeting — and the data is still there after a refresh.

Success is all of the following:

- Every must-have in section 4 works against persisted data.
- The library and meeting page look and behave like Fireflies (sidebar, meeting list, transcript, summary rail, player, search, toasts), not a generic notes app.
- Schema, API, and README are clear enough to defend in an interview.
- Public GitHub repo (`frontend/` and `backend/`) plus a live URL.

## 3. Users and assumptions

- One implicit user is already signed in. Profile and settings are placeholders.
- Meetings belong to that user. No teams, sharing, or permissions.
- A meeting always has metadata. Transcript, summary, topics, and action items may be empty until the user adds them.
- Timestamps in the transcript are seconds from the start of the meeting, so the player and the transcript share one clock.

## 4. Must-have scope

### 4.1 Meetings library

Home view of past meetings.

- Each row shows title, date, duration, and participants.
- Search by title or participant. Filter by date. Sort by recency (newest first by default).
- Navbar includes profile and settings placeholders.
- Empty search shows a clear empty state, not a blank page.

### 4.2 Meeting detail

- Transcript lines show speaker, timestamp, and text.
- A player with a seek bar. Audio or video may be a sample file or a visual placeholder; the seek bar must still move and report a current time.
- Clicking a line seeks the player to that timestamp. Moving the player highlights the line for the current time and keeps it in view.
- Search inside the transcript highlights matches and can step between them.

### 4.3 Summary and notes

On the same meeting page:

- A short meeting summary.
- Action items, each with text and a complete/incomplete state.
- Key topics or chapters (title, and a timestamp when one exists).
- Content may be seeded or produced from the transcript text. The UI does not depend on a live model.

### 4.4 Meeting management

All of this persists in the database:

- Create a meeting by form, pasted transcript, or uploaded `.txt`, `.vtt`, or `.json`.
- Edit title and participants.
- Delete a meeting (with confirmation) and its transcript, summary, topics, and action items.
- Add, edit, and complete action items.

### 4.5 Fireflies experience

- Library and detail are the two primary screens, with the same navigation chrome.
- Transcript and summary sit in separate panels.
- Create/edit uses a form or modal.
- Search and filters are always visible on the library.
- Success and failure use toasts.
- Settings is a placeholder page.

## 5. Explicitly not built

These may appear in the nav as “Coming soon”:

- A bot that joins live calls
- Real speech-to-text
- Zoom, Google Meet, calendar, or CRM integrations
- Team sharing
- Real authentication

Bonus, only if the must-haves are done: comments or highlights on a line, export (PDF, Markdown, or TXT), global search, tags, “ask about this meeting,” dark mode.

Shipped after this plan was written: light and dark themes, export, library search across transcript text, Groq summaries with a Gemini fallback, and a YouTube player on the one meeting that has a video. See [STATUS.md](./STATUS.md). Comments and “ask about this meeting” are not on `main`.

## 6. Primary flows

1. **Browse.** Land on the library, see seeded meetings, sort by date, filter, open one.
2. **Review.** Read the summary, scan topics, play or scrub, click a line, watch the matching line highlight as time moves, search a phrase in the transcript.
3. **Capture.** Create a meeting from pasted text or an upload, land on its detail page, edit the title, add an action item, mark it done, refresh, and see the same state.
4. **Remove.** Delete a meeting, return to the library, confirm it is gone.

## 7. Screens

| Screen | Purpose |
|---|---|
| Library | Search, filter, sort, open, create |
| Meeting | Player, transcript, in-transcript search, summary, topics, action items, edit, delete |
| Create / edit | Title, date, duration, participants, transcript input |
| Settings | Placeholder |
| Profile menu | Placeholder for the logged-in user |

Layout target: left navigation, main column for the list or transcript, right rail on the meeting page for summary, topics, and action items, player anchored so scrubbing does not cover the transcript.

## 8. Information the product stores

The schema is part of the grade. The product needs these relationships:

- **Meeting** — title, date, duration, participants
- **Transcript segment** — meeting, speaker, start time, text, order
- **Summary** — meeting, body text
- **Topic** — meeting, title, optional start time, order
- **Action item** — meeting, text, done state

Deleting a meeting removes its children. Seed at least several meetings with full transcripts, summaries, topics, and action items so the app is usable on first run.

## 9. Constraints from the assignment

- Frontend: Next.js, TypeScript
- Backend: Python, FastAPI or Django
- Database: SQLite, your schema
- Repo layout: `frontend/` and `backend/`
- README: setup, stack, architecture, schema, API, assumptions
- Demo: a public deployed URL
- Original work. You must be able to explain every line.
- AI coding tools are allowed.

## 10. Acceptance checks

- Seeded library loads with title, date, duration, participants.
- Search, date filter, and recency sort change the list correctly.
- Opening a meeting shows transcript, summary, topics, and action items together.
- Clicking a segment seeks the player; scrubbing highlights the active segment.
- Transcript search highlights matches.
- Create, edit metadata, add/edit/complete action items, and delete all survive a reload.
- Upload or paste accepts `.txt`, `.vtt`, or `.json` and creates segments.
- Placeholder areas do not pretend to join a call or transcribe audio.
- README matches what is actually deployed.

## 11. Out of scope for the PRD

API shape, component breakdown, and deployment steps are the technical plan, not this document.
