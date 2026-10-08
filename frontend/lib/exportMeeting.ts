import { formatClock, formatDate, formatDuration } from "./formatTime";
import type { MeetingDetail } from "./types";

export type ExportKind = "summary" | "transcript";
export type ExportFormat = "txt" | "md" | "pdf";

function meta(meeting: MeetingDetail) {
  const people = meeting.participants.map((person) => person.name).join(", ");
  return `${formatDate(meeting.started_at)} · ${formatDuration(meeting.duration_seconds)}${people ? ` · ${people}` : ""}`;
}

function fileSlug(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "meeting";
}

export function summaryText(meeting: MeetingDetail) {
  const lines = [meeting.title, meta(meeting), "", "Summary", meeting.summary?.body.trim() || "No summary.", "", "Topics"];
  if (meeting.topics.length === 0) lines.push("No topics.");
  for (const topic of meeting.topics) {
    const stamp = topic.start_seconds == null ? "" : ` (${formatClock(topic.start_seconds)})`;
    lines.push(`- ${topic.title}${stamp}`);
  }
  lines.push("", "Action items");
  if (meeting.action_items.length === 0) lines.push("No action items.");
  for (const item of meeting.action_items) {
    lines.push(`- [${item.is_done ? "x" : " "}] ${item.text}${item.owner ? ` (${item.owner})` : ""}`);
  }
  return `${lines.join("\n")}\n`;
}

export function summaryMarkdown(meeting: MeetingDetail) {
  const lines = [`# ${meeting.title}`, "", meta(meeting), "", "## Summary", "", meeting.summary?.body.trim() || "No summary.", "", "## Topics", ""];
  if (meeting.topics.length === 0) lines.push("No topics.");
  for (const topic of meeting.topics) {
    const stamp = topic.start_seconds == null ? "" : ` (${formatClock(topic.start_seconds)})`;
    lines.push(`- **${topic.title}**${stamp}`);
  }
  lines.push("", "## Action items", "");
  if (meeting.action_items.length === 0) lines.push("No action items.");
  for (const item of meeting.action_items) {
    lines.push(`- [${item.is_done ? "x" : " "}] ${item.text}${item.owner ? ` (${item.owner})` : ""}`);
  }
  return `${lines.join("\n")}\n`;
}

export function transcriptText(meeting: MeetingDetail) {
  const lines = [meeting.title, meta(meeting), "", "Transcript"];
  if (meeting.segments.length === 0) lines.push("No transcript.");
  for (const segment of meeting.segments) {
    lines.push(`[${formatClock(segment.start_seconds)}] ${segment.speaker_name}: ${segment.text}`);
  }
  return `${lines.join("\n")}\n`;
}

export function transcriptMarkdown(meeting: MeetingDetail) {
  const lines = [`# ${meeting.title}`, "", meta(meeting), "", "## Transcript", ""];
  if (meeting.segments.length === 0) lines.push("No transcript.");
  for (const segment of meeting.segments) {
    lines.push(`- **${formatClock(segment.start_seconds)} ${segment.speaker_name}:** ${segment.text}`);
  }
  return `${lines.join("\n")}\n`;
}

function toAscii(value: string) {
  return value
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replaceAll("’", "'")
    .replaceAll("‘", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("…", "...")
    .replace(/[^\x20-\x7E]/g, "");
}

function wrapLine(value: string, width: number) {
  if (value.length <= width) return [value];
  const words = value.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function pdfEscape(value: string) {
  return toAscii(value).replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

export function buildPdf(text: string) {
  const lines = text.split("\n").flatMap((line) => wrapLine(toAscii(line), 90));
  const chunks: string[][] = [];
  for (let index = 0; index < lines.length; index += 46) chunks.push(lines.slice(index, index + 46));
  if (chunks.length === 0) chunks.push([""]);

  const objects = new Map<number, string>();
  const pageIds = chunks.map((_, index) => 4 + index * 2);
  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objects.set(2, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);
  objects.set(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  chunks.forEach((chunk, index) => {
    const commands = ["BT", "/F1 11 Tf", "14 TL", "54 742 Td"];
    chunk.forEach((line, lineIndex) => {
      if (lineIndex > 0) commands.push("T*");
      commands.push(`(${pdfEscape(line)}) Tj`);
    });
    commands.push("ET");
    const stream = commands.join("\n");
    const contentId = 5 + index * 2;
    objects.set(contentId, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    objects.set(
      pageIds[index],
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`,
    );
  });

  let body = "%PDF-1.4\n";
  const maxId = Math.max(...objects.keys());
  const offsets = new Array<number>(maxId + 1).fill(0);
  for (let id = 1; id <= maxId; id += 1) {
    offsets[id] = body.length;
    body += `${id} 0 obj\n${objects.get(id)}\nendobj\n`;
  }
  const xrefAt = body.length;
  body += `xref\n0 ${maxId + 1}\n`;
  body += "0000000000 65535 f \n";
  for (let id = 1; id <= maxId; id += 1) {
    body += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return new TextEncoder().encode(body);
}

export function renderExport(meeting: MeetingDetail, kind: ExportKind, format: ExportFormat) {
  const text =
    kind === "summary"
      ? format === "md"
        ? summaryMarkdown(meeting)
        : summaryText(meeting)
      : format === "md"
        ? transcriptMarkdown(meeting)
        : transcriptText(meeting);
  const slug = fileSlug(meeting.title);
  if (format === "pdf") {
    return {
      filename: `${slug}.${kind}.pdf`,
      mime: "application/pdf",
      bytes: buildPdf(text),
    };
  }
  return {
    filename: `${slug}.${kind}.${format}`,
    mime: format === "md" ? "text/markdown" : "text/plain",
    bytes: new TextEncoder().encode(text),
  };
}

export function downloadMeetingExport(meeting: MeetingDetail, kind: ExportKind, format: ExportFormat) {
  const file = renderExport(meeting, kind, format);
  const blob = new Blob([file.bytes], { type: file.mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
