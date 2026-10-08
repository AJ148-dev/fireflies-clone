# Feature 4 — Meeting Management (CRUD)

Meeting Management covers the complete persisted lifecycle of a meeting and the content owned by that meeting: create it, read it, edit its metadata, delete it, and manage its action items.

This feature spans the Home capture modal, the meetings library, the meeting detail page, the FastAPI meeting and action-item endpoints, and SQLite.

## Goal

A reviewer can create a meeting from a form, pasted transcript, or transcript file; find and open it; edit its title and participants; manage its action items; refresh without losing changes; and delete the meeting and all child content.

The assignment does not require speech-to-text. An uploaded or pasted transcript is parsed into persisted transcript segments. Summary, topics, and action items may be seeded or supplied as structured data.

## Required user flows

### Create

The product must support all three entry paths:

1. **Blank form** — create meeting metadata without a transcript.
2. **Paste transcript** — paste supported transcript text and select its format.
3. **Upload transcript** — upload a `.txt`, `.vtt`, or `.json` transcript.

Every path requires:

- title;
- meeting date and time;
- zero or more participants.

Paste additionally requires:

- transcript format: `txt`, `vtt`, or `json`;
- transcript text containing at least one valid segment.

Upload additionally requires:

- a file with a supported extension;
- valid content for that extension.

On success:

- the meeting and all parsed transcript segments are committed to SQLite;
- inferred duration is used when the submitted duration is zero and the transcript contains timing;
- the UI opens the newly created meeting;
- the new meeting appears in the library after returning or refreshing;
- success is communicated clearly.

On failure:

- no partial meeting is left behind;
- the form remains open with the user’s input;
- the UI shows a useful validation or server error;
- the submit button returns from its saving state.

### Read

The library returns lightweight meeting cards. A detail request returns one meeting and all content needed by the meeting page:

- metadata and participants;
- transcript segments;
- summary;
- topics;
- action items;
- audio path.

A missing meeting returns `404`. The UI shows a clear “meeting is gone” state instead of crashing.

### Edit metadata

From the meeting detail page, the user can edit:

- title;
- participants.

The current product also allows editing the meeting date. That is useful but is beyond the minimum requirement.

Editing must:

- prefill the current values;
- reject a blank title;
- preserve transcript, summary, topics, action items, and audio;
- save participant order;
- update the detail page immediately after the API confirms success;
- remain correct after refresh;
- report failure without closing the form or pretending to save.

The library’s quick **Rename** action may remain as a shortcut, but the detail edit form is the complete metadata editor.

### Delete

The user can delete a meeting from its detail page.

Deletion must:

- show a confirmation naming the meeting;
- warn that transcript, summary, topics, and action items will also be deleted;
- prevent duplicate submission while deletion is running;
- remove the meeting and its owned records in one operation;
- return the user to the library or Home;
- ensure the meeting no longer appears after refresh;
- return `404` if the deleted detail URL is opened again.

The library currently has a direct Delete row action. Before this feature is considered polished, that action must use the same confirmation instead of deleting immediately.

Participant records are shared reference data and do not need to be deleted when one meeting is deleted. Only the meeting-participant links are deleted.

### Manage action items

On the selected meeting, the user can:

- add an action item;
- edit its text;
- mark it complete;
- mark it incomplete again;
- delete it.

Requirements:

- whitespace-only text is rejected;
- completion is a persisted boolean;
- new items are appended in stable order;
- every successful mutation updates the meeting’s `updated_at`;
- the refreshed meeting detail reflects the change;
- failures show an error and retain a recoverable UI state;
- deleting an item does not affect the meeting or other items.

Action items are also documented in Feature 3. In this feature they are part of the broader CRUD and persistence contract.

## Accepted transcript formats

Parsing is strict. Invalid input must return a helpful `400` response for parser errors rather than silently dropping lines.

### Plain text (`txt`)

One segment per non-empty line:

```text
[00:04] Maya Chen: Let's lock the roadmap.
[01:12] Ava Shah: I will confirm the design capacity.
```

Accepted timestamps:

- `[mm:ss]`
- `[hh:mm:ss]`

Each line requires a speaker name and non-empty text.

### WebVTT (`vtt`)

```text
WEBVTT

00:00:04.000 --> 00:00:10.000
Maya Chen: Let's lock the roadmap.
```

Requirements:

- each included cue has a valid start and end time;
- each cue has non-empty text;
- a leading `Name:` becomes the speaker;
- a cue without that prefix uses `Speaker`;
- cue identifiers and `NOTE` blocks may be ignored.

### JSON (`json`)

```json
[
  {
    "speaker": "Maya Chen",
    "start": 4,
    "end": 10,
    "text": "Let's lock the roadmap."
  }
]
```

Accepted aliases:

- `speaker` or `speaker_name`;
- `start` or `start_seconds`;
- `end` or `end_seconds`.

Each cue must be an object with:

- non-negative numeric start time;
- non-empty text;
- optional speaker, defaulting to `Speaker`;
- optional end time.

The top-level JSON value must be an array with at least one valid cue.

## Metadata and validation

### Meeting

- Title: required, trimmed, 1–200 characters.
- Start date/time: required and parseable.
- Duration: zero or greater.
- Participants: ordered list of names; blank names are discarded.
- Transcript: optional for a blank form, required and valid for paste/upload modes.

The browser’s `datetime-local` value is stored as the same clock time in UTC. This is an explicit project assumption so the entered library date remains stable.

### Participant behavior

- Participants are normalized from trimmed names.
- Existing participant rows are reused by exact name.
- Duplicate names within one meeting should resolve to one participant link.
- Editing participants replaces that meeting’s ordered links.
- A participant can remain in the database after being removed from a meeting because another meeting may reference the same person.

### Child ordering

The following retain a numeric `position`:

- participants on a meeting;
- transcript segments;
- topics;
- action items.

Reads return them in display order.

## Persistence and transaction rules

SQLite is the source of truth. Browser state alone does not satisfy this feature.

Persisted entities:

- meeting metadata;
- meeting-participant links;
- transcript segments;
- one optional summary;
- ordered topics;
- ordered action items and completion state.

Creation must commit the meeting and children together. If transcript parsing or validation fails, the backend must not commit a partial meeting.

Deletion cascades from the meeting to:

- meeting-participant links;
- transcript segments;
- summary;
- topics;
- action items.

SQLite foreign-key enforcement must be enabled for every connection. ORM relationships also use delete-orphan cascading.

The deployed API must use durable disk for the SQLite file. A serverless ephemeral filesystem will lose user-created meetings after process replacement and therefore does not satisfy persistence.

## API contract

### Create from JSON

`POST /api/meetings`

```json
{
  "title": "Customer call",
  "started_at": "2026-10-08T11:00:00Z",
  "duration_seconds": 0,
  "participant_names": ["Maya Chen", "Priya Nair"],
  "transcript_format": "txt",
  "transcript_text": "[00:01] Priya Nair: We need invoice export.",
  "summary": "Invoice export is the procurement blocker.",
  "topics": [
    {"title": "Invoice export", "start_seconds": 1}
  ],
  "action_items": [
    {"text": "Send a sample export", "is_done": false}
  ]
}
```

Response: `201` with complete meeting detail.

`transcript_format` is required when non-empty `transcript_text` is provided. Summary, topics, and action items are optional.

### Create from upload

`POST /api/meetings/import`

Multipart fields:

- `file`;
- `title`;
- `started_at`;
- `participant_names` as comma-separated names;
- `duration_seconds`, optional.

Response: `201` with complete meeting detail.

Only `.txt`, `.vtt`, and `.json` are accepted. The current upload endpoint creates empty summary, topic, and action-item collections; seeded or later-created notes remain valid under the assignment.

### Read

- `GET /api/meetings` — cards for the library.
- `GET /api/meetings/{id}` — full meeting detail.

### Update metadata

`PATCH /api/meetings/{id}`

Supported fields:

- `title`;
- `started_at`;
- `duration_seconds`;
- `participant_names`.

Only supplied fields change. Response: `200` with refreshed full detail.

### Delete

`DELETE /api/meetings/{id}`

Response: `204` with no body.

### Action items

- `POST /api/meetings/{id}/action-items`
- `PATCH /api/action-items/{id}`
- `DELETE /api/action-items/{id}`

Create accepts `text`. Patch accepts `text`, `is_done`, or both. Delete returns `204`.

## Current implementation status

### Already implemented

- Blank, paste, and upload modes in the Add meeting modal.
- Strict parsing for TXT, VTT, and JSON.
- SQLite persistence for all meeting entities.
- Full meeting detail response.
- Detail edit modal for title, date, and participants.
- Library quick rename.
- Detail delete confirmation and cascade deletion.
- Library row deletion.
- Action-item add, edit, complete/incomplete, and delete.
- Error messages for create/edit and action-item failures.
- Loading and missing-meeting states.
- API tests for create/read, edit, delete, filters, action-item CRUD, invalid action-item text, missing IDs, and cascade cleanup.

### Required gaps closed

- Library deletion now uses the same named confirmation as detail deletion.
- The delete dialog reports API failures and restores its controls for retry.
- Meeting create and update reject whitespace-only titles after trimming.

### Remaining optional hardening

- Add a file-size limit and a specific message for non-UTF-8 uploads.
- Disable each action-item row while its individual mutation is pending.
- Add background import jobs if large transcripts become part of the product.

These are production robustness improvements, not assignment requirements.

## UI locations

- Open capture: Home quick-start Upload/Capture actions or the top-bar Capture action.
- Library row actions: `/meetings`.
- Full edit and delete: `/meetings/{id}` → `···` menu.
- Action items: `/meetings/{id}` → **Notes**.

After creation, the user should land on `/meetings/{new_id}`.

## Error and edge states

Required:

- Empty library after deleting the last meeting.
- Meeting with no transcript.
- Meeting with no participants.
- Missing meeting ID.
- Invalid transcript shape.
- Unsupported upload extension.
- Blank title.
- Blank action-item text.
- API unavailable during create, edit, delete, or action mutation.
- A refresh immediately after each successful operation.

Expected responses:

- `400` for a malformed or unsupported transcript.
- `404` for a missing meeting or action item.
- `422` for request-schema validation errors.
- `204` for successful deletion.

Do not expose Python stack traces or database internals in the UI.

## Acceptance criteria

### Create: blank

1. Open Add meeting.
2. Choose Blank.
3. Enter title, date, and participants.
4. Create the meeting.
5. Confirm detail loads with an empty transcript state.
6. Refresh and confirm metadata remains.
7. Return to the library and confirm the row exists.

### Create: paste

Repeat for valid TXT, VTT, and JSON examples:

1. Choose Paste and the matching format.
2. Enter at least two timestamped speakers.
3. Create.
4. Confirm segment speaker, timestamp, text, and order.
5. Refresh and confirm all segments remain.

Submit one invalid example for each format and confirm no meeting is created.

### Create: upload

Repeat the paste checks with `.txt`, `.vtt`, and `.json` files. Also attempt an unsupported extension and malformed UTF-8 or malformed content.

### Edit

1. Change the title and participants.
2. Save and verify the meeting header updates.
3. Refresh and verify the values remain.
4. Return to the library and verify the row and participant names update.
5. Confirm transcript, summary, topics, and action items are unchanged.

### Action items

1. Add an item and refresh.
2. Edit it and refresh.
3. Complete it and refresh.
4. Reopen it and refresh.
5. Delete it and refresh.
6. Submit whitespace-only text and confirm rejection.

### Delete

1. Open the delete confirmation.
2. Cancel and confirm nothing changes.
3. Open it again and confirm deletion.
4. Confirm the meeting disappears from the library.
5. Refresh the former detail URL and confirm the missing state.
6. Verify its transcript, summary, topics, action items, and participant links no longer exist.
7. Verify shared participant records used by other meetings still exist.

## Minimum automated coverage

- Parse valid TXT, VTT, and JSON.
- Reject malformed and empty transcripts.
- Create with metadata and transcript; read it back.
- Create with summary, topics, and action items; read them back.
- Patch title and participants without changing child content.
- Add, edit, complete, reopen, and delete an action item.
- Reject whitespace-only titles, topic titles, and action-item text.
- Return `404` for missing meeting and action-item IDs.
- Delete a meeting and prove its child action item can no longer be addressed.
- Verify participant/date search and sorting still work after CRUD operations.

## Later additions

Do not include these in the required CRUD scope:

- Real authentication or per-user authorization.
- Team roles, shared ownership, and concurrent editing.
- Live meeting bot or audio/video upload with speech-to-text.
- Editing transcript segments.
- Replacing an existing transcript.
- Editing summaries and topics.
- Attachment storage.
- Undo or soft delete.
- Meeting archive or trash.
- Bulk edit or bulk delete.
- Optimistic updates and offline support.
- Version history or audit log.
- Idempotency keys and conflict detection.
- Background import jobs for large files.
- Virus scanning and object storage.
- External calendar, CRM, email, or task integrations.

These are useful production capabilities, but they do not improve the assignment score until the required CRUD and persistence checks pass.
