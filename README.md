# Meeting notes

A Fireflies-style workspace for browsing meetings, reading a transcript beside the player, and keeping the summary and action items. Speech-to-text is out of scope. Transcripts are seeded, pasted, or uploaded.

## Stack

- `frontend/` — Next.js, TypeScript, Tailwind
- `backend/` — FastAPI, SQLAlchemy, SQLite

The browser talks to the API directly. Playback time stays in the browser. The API stores transcript timestamps.

## Setup

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend, from `frontend/`:

```bash
npm install
npm run dev
```

Open http://localhost:3000. The API defaults to http://localhost:8000. Override it with `NEXT_PUBLIC_API_URL`.

On startup the API creates `backend/fireflies.db` and seeds four meetings when the table is empty. `frontend/public/sample.wav` is the shared clip. Segment times in the seed fall inside that file, so clicking a line seeks real audio.

Tests:

```bash
cd backend && .venv/bin/pytest
node --experimental-strip-types --test frontend/lib/activeSegment.test.ts
```

## Architecture

```text
Browser (Next.js) -- JSON --> FastAPI --> SQLite
```

One detail request loads a meeting with its participants, transcript, summary, topics, and action items. The library request does not include transcript lines.

The active transcript line is the last segment whose `start_seconds` is less than or equal to the player time. That rule lives in `frontend/lib/activeSegment.ts`. The page already has every line, so the playhead does not ask the server.

A participant is a person on the meeting. A speaker label is text on a transcript line. Search in the library matches title or participant name. Search in the transcript runs on the loaded lines.

There is one seeded user, Maya Chen. The API does not check a password. Settings and the extra nav items are placeholders.

## Schema

- `users` — the signed-in user
- `meetings` — title, start, duration, audio path, owner
- `participants` and `meeting_participants` — people on a meeting, with display order
- `transcript_segments` — speaker, start, end, text, order
- `summaries` — one body per meeting
- `topics` — title and optional start time
- `action_items` — text, done flag, order

Deleting a meeting deletes its segments, summary, topics, action items, and participant links. Participant rows stay, so the same person can appear on another meeting.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness |
| GET | `/api/me` | Default user |
| GET | `/api/meetings` | Library. Query: `q`, `from`, `to`, `sort=recent\|oldest` |
| POST | `/api/meetings` | Create from JSON, including optional pasted transcript |
| POST | `/api/meetings/import` | Create from a `.txt`, `.vtt`, or `.json` file |
| GET | `/api/meetings/{id}` | Meeting detail |
| PATCH | `/api/meetings/{id}` | Title, date, duration, participants |
| DELETE | `/api/meetings/{id}` | Delete the meeting and its children |
| POST | `/api/meetings/{id}/action-items` | Add an action item |
| PATCH | `/api/action-items/{id}` | Edit text or completion |
| DELETE | `/api/action-items/{id}` | Remove an action item |

Accepted transcript shapes:

- txt: `[mm:ss] Name: text` or `[hh:mm:ss] Name: text`
- vtt: `WEBVTT` cues. A leading `Name:` becomes the speaker. Otherwise the speaker is `Speaker`.
- json: `[{"speaker", "start", "text", "end"?}]`. `start_seconds` is also accepted.

Anything else returns 400 with the expected shape. Summaries in the seed are stored text. The app does not call a language model.

## Assumptions

- One user is already signed in.
- Date filters use UTC calendar days. The date and time typed in the form are stored as that clock time in UTC, so the library date matches what was entered.
- The hosted API needs a long-running disk for SQLite. A serverless filesystem will not keep new meetings. If the database file is missing, startup seeds the demo meetings again.
- `DATABASE_PATH` chooses the SQLite file. `CORS_ORIGINS` is a comma-separated list. `SEED=0` skips seeding.
- Uploads, integrations, analytics, live transcription, and real login are labeled coming soon.
