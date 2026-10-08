import assert from "node:assert/strict";
import test from "node:test";

import { buildPdf, renderExport, summaryMarkdown, transcriptText } from "./exportMeeting.ts";
import type { MeetingDetail } from "./types.ts";

const meeting: MeetingDetail = {
  id: 1,
  title: "Q4 roadmap review",
  started_at: "2026-10-01T15:00:00Z",
  duration_seconds: 75,
  participants: [
    { id: 1, name: "Maya Chen" },
    { id: 2, name: "Ava Shah" },
  ],
  audio_path: "/sample.wav",
  summary: { body: "The group locked October scope." },
  topics: [{ id: 1, title: "October scope", start_seconds: 4, position: 0 }],
  action_items: [{ id: 1, text: "Send the revised Q4 dates", is_done: true, position: 0 }],
  segments: [{ id: 1, speaker_name: "Maya Chen", start_seconds: 4, end_seconds: 12, text: "Let's lock the roadmap.", position: 0 }],
};

test("summary markdown includes the notes and a completed action item", () => {
  const markdown = summaryMarkdown(meeting);
  assert.match(markdown, /^# Q4 roadmap review/);
  assert.match(markdown, /The group locked October scope/);
  assert.match(markdown, /\*\*October scope\*\* \(00:04\)/);
  assert.match(markdown, /- \[x\] Send the revised Q4 dates/);
});

test("transcript text keeps the speaker timestamp", () => {
  const text = transcriptText(meeting);
  assert.match(text, /\[00:04\] Maya Chen: Let's lock the roadmap\./);
});

test("pdf export is a readable document for the chosen section", () => {
  const file = renderExport(meeting, "transcript", "pdf");
  assert.equal(file.filename, "q4-roadmap-review.transcript.pdf");
  const pdf = new TextDecoder().decode(file.bytes);
  assert.match(pdf, /^%PDF-1\.4/);
  assert.match(pdf, /\[00:04\] Maya Chen/);
  const start = Number(pdf.match(/startxref\n(\d+)/)?.[1]);
  assert.equal(pdf.slice(start, start + 4), "xref");
  assert.equal(new TextDecoder().decode(buildPdf("Hello (world)")).includes("Hello \\(world\\)"), true);
});
