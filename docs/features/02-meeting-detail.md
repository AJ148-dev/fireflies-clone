# Meeting page — transcript and player

This is feature 2. It is the page you get after you open one meeting.

The high-level design says what the page is for and which pieces exist. The low-level design says how those pieces store time, talk to each other, and decide which line is active. This doc uses the words from [HLD.md](./HLD.md) and [PRD.md](./PRD.md), then names the files that already do the work.

## What the page must do

A reviewer opens a seeded meeting and can do all of this without a live speech model:

1. Read the transcript. Every line shows who spoke, when they spoke, and what they said.
2. See a player with play, pause, a seek bar, the current time, and the length of the clip.
3. Click a line and have the player jump to that line’s time.
4. Move the seek bar and have the matching line light up and stay in view.
5. Type a word, see every match highlighted, and step to the next and previous match.

The audio can be one shared sample file. The timestamps in the transcript have to fall inside that file, so the jump is real.

## What can wait

These are visible on the real Fireflies page. They are not required for this feature:

- A real video of the call. A sample audio file is enough.
- Soundbites, comments, bookmarks, and share.
- Searching the audio itself, or searching across every meeting from this page.
- A waveform computed from the file. A decorative bar is enough.
- Editing the transcript text.
- Asking a model about the meeting.

Summary, topics, and action items sit on the same page (the Notes tab) because one request loads the whole meeting. Editing those items is a later feature. This feature only needs the transcript, the player, and search.

## High-level design

One browser page. One API call. The clock stays in the browser.

```text
Browser
  Meeting page
    Player          holds the current time
    Transcript      draws the lines
    Search box      marks words already on the page
        |
        |  one GET when the page opens
        v
FastAPI
  GET /api/meetings/{id}
        |
        v
SQLite
  meetings, transcript_segments, and the rest of the meeting
```

The server stores each line’s start time in seconds. It does not play audio and it does not answer “which line is active?” on every tick. The page already has the lines, and a demo meeting is short, so the browser can answer that itself.

Participants and speakers are different. A participant is a person on the meeting (the faces in the header). A line has its own speaker name. They often match in the seed data. They are not the same table, so an upload can say “Speaker 2” without creating a person.

The meeting list does not download the transcript. Only this page does.

## Low-level design

### What is stored

Each line is one row in `transcript_segments`:

| Field | Meaning |
|---|---|
| `speaker_name` | The name printed on the line |
| `start_seconds` | When this line starts, counted from the beginning of the meeting |
| `end_seconds` | When it ends. Optional. The active-line rule does not need it |
| `text` | What was said |
| `position` | The order on the page |

The meeting row has `audio_path`. Every seeded meeting uses `/sample.wav`, which is a file in `frontend/public`. `duration_seconds` is what the library shows. The seek bar’s length comes from the audio file itself.

### What the page loads

`GET /api/meetings/{id}` returns the meeting, participants, summary, topics, action items, and `segments` together. A missing id is 404. The page then says the meeting is gone.

A segment in that response looks like this:

```json
{
  "id": 1,
  "speaker_name": "Ava Shah",
  "start_seconds": 12,
  "end_seconds": 28,
  "text": "We should move the launch.",
  "position": 0
}
```

No second request is made while the audio plays.

### How the page is split

Route: `/meetings/[id]`. The screen is `MeetingView`.

```text
header          title, date, duration, people, back to Meetings
player          play, time, seek bar, length
tabs            Notes | Transcript
left tools      search opens the Transcript tab
main area       either notes, or the find box plus the lines
```

On a wide screen the left column is one scroll: the player, then action items, then the summary. The transcript is a column on the right with its own scroll. Below that width the player stays on top and a Summary / Transcript switch sits at the bottom. The clock is the same either way.

A meeting with `youtube_video_id` shows that YouTube video instead of the audio player. Only the San Francisco Scalar meeting has one, and its lines use the video's caption times. Other meetings play `/sample.wav`.

### The clock rule

`activeSegmentIndex` in `frontend/lib/activeSegment.ts` is a plain function:

- Walk the lines in display order.
- Keep the last line whose `start_seconds` is less than or equal to the player time.
- If the playhead is before the first line, return `-1`. No line is active.

Example. Lines start at 0s, 12s, and 40s. At 20s the active line is the one that starts at 12s.

The player reports time in two ways:

- While audio plays, the `timeupdate` event calls `onTime`.
- When the user drags the seek bar, the same `onTime` runs immediately, so the highlight does not wait for the next audio tick.

`MeetingView` stores that number in `time` and passes the index into `Transcript`. The active line gets a purple background. When the index changes, that line scrolls into view.

### Clicking a line

Each line is a button. The click calls `player.seek(start_seconds)`.

`Player` sets `audio.currentTime`, tells the page the new time, and starts playback. If the browser blocks autoplay, the time still moves and the line still highlights. Play can fail quietly.

Topics on the Notes tab use the same `seek` call. That is extra. The required path is the transcript line.

### Search

Search does not call the API. The lines are already on the page.

- The box is on the Transcript tab. The search icon in the tool rail switches to that tab.
- The match is a case-insensitive substring of the line text. “Road” matches “roadmap”.
- Every hit is wrapped in a `<mark>`. The current hit is a stronger yellow.
- Prev and Next walk a match index and wrap around.
- While a query is typed, the page scrolls to the current hit, not to the playing line. Clearing the box returns scroll to the playhead.
- The count is “N found”. An empty transcript says there is no transcript yet.

Speaker names are not part of the search. The assignment asks for search inside the transcript text.

### Files

| Piece | File |
|---|---|
| Page | `frontend/app/meetings/[id]/page.tsx` |
| Layout, time, search index | `frontend/components/MeetingView.tsx` |
| Lines and highlights | `frontend/components/Transcript.tsx` |
| Audio and seek bar | `frontend/components/Player.tsx` |
| Active-line rule | `frontend/lib/activeSegment.ts` |
| Sample clip | `frontend/public/sample.wav` |
| Detail route | `backend/app/routers/meetings.py` |
| Line rows | `backend/app/models.py` (`transcript_segments`) |

## How to build it

Do these in order. Later steps are useless if the clock rule is wrong.

1. Store lines with `speaker_name`, `start_seconds`, and `text`, ordered by `position`.
2. Return those lines on `GET /api/meetings/{id}` and point `audio_path` at the sample file. Keep every seed timestamp inside the length of that file.
3. Render the header and one row per line: time, speaker, text. A line with no transcript shows an empty message.
4. Add the audio element and a range input. Wire play, pause, and drag so the page holds one `time` number.
5. Highlight the line from `activeSegmentIndex`. Scroll it into view when it changes.
6. On click, set `audio.currentTime` to that line’s `start_seconds`.
7. Add the find box, marks, count, and prev/next. While a query is active, scroll follows the hit.

The only test this feature needs is the clock rule: a few times in, the right index out. Parser tests belong to the create-meeting feature, not this page.

## How to check it

Open a seeded meeting, switch to Transcript, and do these:

- Each line shows a speaker, a `mm:ss` time, and text.
- Play moves the seek bar. Dragging the bar moves the highlight.
- Click a line. The bar jumps to that time and that line stays highlighted.
- Search a word that appears twice. Both are marked. Next and Prev move between them.
- Clear the search. Marks disappear and the playing line can scroll again.
- Refresh. The same transcript is still there.

## Already in this repo

Steps 1–7 are already in the files above. `frontend/lib/activeSegment.test.ts` covers the clock rule. This doc is the spec for that behavior, not a list of new work. Later UI passes can change spacing and color. They should not change the clock rule or move search onto the server.
