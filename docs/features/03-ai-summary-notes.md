# Feature 3 — AI Summary & Notes

The Notes view turns a meeting transcript into something a user can scan and act on. It contains a short summary, timestamped topics or chapters, and a persistent action-item list.

This feature lives on `/meetings/[id]` under the **Notes** tab. It does not require a live language model. For this assignment, summaries, topics, and action items may be seeded or supplied when a meeting is created.

## Goal

A reviewer can open any seeded meeting and quickly understand:

1. What happened?
2. What subjects were discussed, and when?
3. What needs to happen next?

The reviewer must be able to use the notes without reading the entire transcript. Action-item changes must survive a refresh.

## Required scope

These are the assignment requirements for this feature.

### Meeting summary

- Show a concise summary for the selected meeting.
- The summary must describe the actual seeded transcript. It must not be generic placeholder text.
- Keep the summary separate from the raw transcript.
- Show a clear fallback such as “No summary for this meeting” when one is unavailable.
- A copy action may copy the summary to the clipboard.
- The UI must not claim that a live AI generated the summary when the content is seeded or mocked.

One paragraph is enough for the assignment. Editing, regenerating, and choosing a summary template are not required.

### Action items

- Show action items belonging to the selected meeting.
- Each action item contains text and a complete/incomplete state.
- The user can add an action item.
- The user can edit an action item’s text.
- The user can mark an item complete or incomplete.
- The user can delete an action item.
- Every mutation is persisted in SQLite and remains correct after refresh.
- A meeting with no action items shows “No action items yet,” not a blank section.
- Failed changes show an error toast and do not silently pretend to succeed.

Action-item creation and editing reject empty text. Reordering, assignees, due dates, and priorities are later work.

### Key topics, outline, or chapters

- Show an ordered list of the meeting’s main subjects.
- Each topic has a readable title.
- A topic may have a start timestamp.
- Clicking a timestamp seeks the meeting player to that point.
- Topics appear in meeting order.
- When no topics exist, the Notes view still shows the meeting summary or its empty fallback.

The assignment uses “key topics / outline / chapters” as alternatives. One consistent topic/chapter presentation satisfies it; three separate versions are unnecessary.

### Source of the notes

Any of the following is acceptable:

- seeded content stored with demo meetings;
- mocked content submitted when a meeting is created;
- deterministic content derived from transcript text;
- output from a real LLM.

Seeded meetings use stored notes. A pasted or uploaded transcript with no summary is sent to Groq, then to Gemini if Groq is missing or fails. See [STATUS.md](../STATUS.md).

## Current product behavior

### Notes UI

The meeting detail page defaults to **Notes** and also offers **Transcript**.

The Notes view:

- displays the stored summary in the first topic section;
- sorts topics by `start_seconds`;
- groups transcript segments into topic time ranges;
- uses grouped transcript lines as timestamped bullets;
- seeks the player when a bullet timestamp is clicked;
- displays the meeting’s action items below the notes;
- supports adding, editing, completing, reopening, and deleting action items;
- reloads the meeting detail after each action-item mutation;
- supports copying the summary body.

This presentation is a readable notes outline. It is not an LLM call.

### Seeded content

All four demo meetings already include:

- one summary paragraph;
- three timestamped topics;
- three action items;
- transcript segments whose content agrees with those notes.

At least some seeded tasks are complete so both task states are visible.

### Creation flow

The meeting creation API accepts optional:

- `summary`;
- `topics`, each with `title` and optional `start_seconds`;
- `action_items`, each with `text` and optional `is_done`.

These values are stored alongside the transcript. The backend does not currently synthesize missing notes from transcript text.

## Data model

All data belongs to one meeting and is deleted when that meeting is deleted.

### Summary

- `id`
- `meeting_id` — unique; at most one summary per meeting
- `body` — required text

### Topic

- `id`
- `meeting_id`
- `title`
- `start_seconds` — optional, non-negative
- `position` — stable display order

### Action item

- `id`
- `meeting_id`
- `text`
- `is_done`
- `position` — stable display order

The transcript remains the source material but is not duplicated into these records.

## API contract

`GET /api/meetings/{id}` returns the meeting and all Notes data in one response:

```json
{
  "summary": {
    "body": "The team agreed to move offline mode to November."
  },
  "topics": [
    {
      "id": 1,
      "title": "October scope",
      "start_seconds": 4,
      "position": 0
    }
  ],
  "action_items": [
    {
      "id": 1,
      "text": "Send the revised Q4 dates",
      "is_done": false,
      "position": 0
    }
  ]
}
```

Action-item mutations:

- `POST /api/meetings/{meeting_id}/action-items` — add an item;
- `PATCH /api/action-items/{item_id}` — edit text or completion state;
- `DELETE /api/action-items/{item_id}` — remove an item.

The existing create-meeting request accepts the initial summary, topics, and action items. Separate summary/topic mutation endpoints are not required for this feature.

## UI states

### Loading

The meeting detail owns the loading state. Notes should not briefly show missing-content messages while the detail request is pending.

### Complete data

Show the summary, ordered chapters with timestamped bullets, and action items.

### Partial data

Handle each part independently:

- no summary: show the summary fallback;
- no topics: show a single notes section using the meeting title;
- no action items: show the empty action-item message and the add form;
- topic without a timestamp: display its title without a seek action.

### Errors

- A failed detail request shows an error state for the meeting page.
- A failed action-item mutation shows an error toast.
- Do not remove or mark an item in the UI until the backend confirms the change, unless an optimistic update also includes rollback.
- Clipboard failure shows an error toast.

## Interaction details

- The summary and outline must be readable without opening another page.
- Topic timestamps use the same seconds-from-start clock as transcript segments and the player.
- Clicking a timestamp calls the same player seek operation used by the transcript.
- Completed tasks use both a checked control and a visual treatment such as strikethrough. Color alone is insufficient.
- Editing can be inline. Enter or losing focus saves valid text.
- Controls need accessible labels, especially completion and delete buttons.
- Notes must remain usable when the meeting has many transcript segments; the notes region scrolls independently.

## Verification and acceptance criteria

The feature is complete when all of these checks pass:

1. Open every seeded meeting and confirm its summary describes its transcript.
2. Confirm topics are in chronological order.
3. Click a chapter timestamp and verify the player seeks to that second.
4. Add an action item, refresh, and confirm it remains.
5. Edit that item, refresh, and confirm the new text remains.
6. Complete the item, refresh, and confirm it is still complete.
7. Reopen the item and confirm the incomplete state persists.
8. Delete the item, refresh, and confirm it does not return.
9. Open or create a meeting without a summary, topics, or action items and confirm all empty states are clear.
10. Simulate an API failure and confirm the UI reports it instead of showing a false success.
11. Delete a meeting and confirm its summary, topics, and action items are removed by cascade.

Backend coverage must at least verify:

- summary, topics, and action items survive create-and-read;
- action-item add, edit, completion toggle, and delete persist;
- missing meeting or action-item IDs return `404`;
- empty action-item text is rejected;
- deleting a meeting removes its child records.

## Later additions

Do not add these until the required behavior above is verified:

- Generate or regenerate notes with an LLM.
- Streaming generation, progress states, retries, or model selection.
- Summary templates such as sales, interview, stand-up, or legal intake.
- Edit summary and topic titles.
- Add, remove, merge, split, or reorder chapters.
- Assign action items to participants.
- Due dates, priorities, reminders, recurring tasks, and task integrations.
- Approval workflow for AI-generated tasks.
- Citations linking each summary sentence to transcript evidence.
- Confidence scores or “AI may be wrong” review markers.
- Multiple summary versions or revision history.
- Export to PDF, Markdown, Notion, CRM, email, or Slack.
- Ask Fred or question-answering over the meeting.
- Organization-wide analytics across summaries and tasks.

If a real LLM is added later, generated output must be treated as untrusted draft content: validate the response shape, persist the accepted result, identify its source in the UI, and never invent legal commitments, owners, or deadlines that are absent from the transcript.

## Explicitly out of scope

- Speech-to-text and speaker diarization.
- A bot joining live meetings.
- Real-time note generation during a call.
- Authentication, team permissions, and shared editing.
- External task, calendar, email, CRM, or messaging integrations.
- Legal conclusions or advice generated from a transcript.
