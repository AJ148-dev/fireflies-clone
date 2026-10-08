# What the app does now

The other files in `docs/` are the assignment plan. This file is the product as it stands on `main`. Where they disagree, this file wins.

The product is named **Scaler Flies**. It is a Fireflies-style workspace. The signed-in user is **Maya Chen** (`maya@example.com`). The sidebar and the profile menu say Maya Chen, and the avatar is **MC**. There is no password.

## Screens

- **Home** (`/`) greets Maya Chen, shows recent meetings, and has a welcome card. The card shows a YouTube thumbnail. Clicking it opens that video in a large pop-up (`uZuFXgNfZmI`, starting one second in). Escape, the close button, or a click outside closes it.
- **Meetings** (`/meetings`) is the library: title, date, duration, participants, search, date range, and newest/oldest sort.
- **Meeting** (`/meetings/[id]`) is two columns on a wide screen. The left column is one scroll: the player, then action items, then the summary and topics. The right column is Transcript and AskFred, and only the transcript scrolls there. On a phone the player stays on top and a Summary / Transcript switch sits at the bottom.
- **AskFred, Tasks, Analytics, Upgrade, Settings** exist as pages. Settings, integrations, live capture, and voice agents are placeholders.

## Player

Most meetings play `/sample.wav`. A meeting can store `youtube_video_id`. Only **How the Scaler ecosystem is going global** has one (`JH2lZdxS59c`). That meeting shows the YouTube player and has no audio toggle. Its transcript is the video's own captions, stored in `backend/app/data/scaler_youtube_lines.json` and written on startup. Clicking a line seeks that video.

## Search

The header search (and Cmd+K) matches a meeting's title, participant, transcript line, summary, topic, or action item. Search inside one transcript still runs on the lines already loaded.

## Notes

Seeded meetings keep their stored summary, topics, and action items. A pasted or uploaded transcript with no summary is sent to Groq when `GROQ_API_KEY` is set (`GROQ_MODEL`, default `openai/gpt-oss-20b`). If Groq is missing or fails, Gemini is the fallback (`GEMINI_API_KEY`, `GEMINI_MODEL`, default `gemini-flash-latest`). A missing key leaves the notes empty. The meeting is still saved.

Action items can be added, edited, completed, and deleted. Summary and transcript export to txt, Markdown, and PDF.

## Theme

Light and dark. The choice is stored in the browser. Dark is the default.

## Not built

A bot that joins calls, speech-to-text, calendar or CRM integrations, teams, and real login. Comments, highlights, and asking a question about one meeting are not on `main`.
