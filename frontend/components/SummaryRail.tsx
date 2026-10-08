"use client";

import { useState } from "react";

import { ExportMenu } from "@/components/ExportMenu";
import { api } from "@/lib/api";
import type { ExportFormat } from "@/lib/exportMeeting";
import { formatClock } from "@/lib/formatTime";
import type { ActionItem, MeetingDetail } from "@/lib/types";

export function SummaryRail({
  meeting,
  onChange,
  onSeek,
  onError,
  onCopied,
  onExport,
}: {
  meeting: MeetingDetail;
  onChange: (meeting: MeetingDetail) => void;
  onSeek: (seconds: number) => void;
  onError: (message: string) => void;
  onCopied: () => void;
  onExport: (format: ExportFormat) => void;
}) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  async function refresh() {
    onChange(await api<MeetingDetail>(`/meetings/${meeting.id}`));
  }

  async function run(task: () => Promise<void>) {
    try {
      await task();
      await refresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not update the action item");
    }
  }

  async function copySummary() {
    const text = meeting.summary?.body || "";
    try {
      await navigator.clipboard.writeText(text || "No summary for this meeting.");
      onCopied();
    } catch {
      onError("Could not copy the summary");
    }
  }

  const sections = noteSections(meeting);
  const owner = meeting.participants[0]?.name ?? "Notes";

  return (
    <aside className="flex min-w-0 flex-col bg-ff-bg text-ff-text">
      <div className="flex items-center gap-2 px-8 pt-3">
        <span className="text-[13px] font-medium">Summary</span>
        <div className="ml-auto flex items-center gap-2">
          <ExportMenu kind="summary" onExport={onExport} />
          <button type="button" onClick={() => void copySummary()} className="text-[12px] text-ff-text-muted hover-ff-text">
            Copy
          </button>
        </div>
      </div>
      <div id="outline" className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-8 py-4 pb-16">
        {sections.map((section, index) => (
          <section key={section.title}>
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              {section.start !== null ? (
                <button type="button" onClick={() => onSeek(section.start!)} className="text-xs text-ff-link">
                  {formatStamp(section.start)}
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-ff-text-secondary">{index === 0 ? meeting.summary?.body || section.lead : section.lead}</p>
            {section.bullets.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ff-text-secondary">
                {section.bullets.map((bullet) => (
                  <li key={`${bullet.start}-${bullet.text}`}>
                    {bullet.text}{" "}
                    <button type="button" onClick={() => onSeek(bullet.start)} className="text-ff-link">
                      ({formatStamp(bullet.start)})
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
        <section id="actions">
          <h2 className="text-base font-semibold">{owner}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {meeting.action_items.length === 0 ? <li className="text-sm text-ff-text-muted">No action items yet.</li> : null}
            {meeting.action_items.map((item) => (
              <ActionRow
                key={item.id}
                item={item}
                editing={editingId === item.id}
                editingText={editingText}
                onEdit={() => {
                  setEditingId(item.id);
                  setEditingText(item.text);
                }}
                onEditingText={setEditingText}
                onToggle={() => run(() => api(`/action-items/${item.id}`, { method: "PATCH", body: JSON.stringify({ is_done: !item.is_done }) }))}
                onSave={() => {
                  if (!editingText.trim()) {
                    onError("Action item text cannot be blank");
                    return;
                  }
                  void run(async () => {
                    await api(`/action-items/${item.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ text: editingText.trim() }),
                    });
                    setEditingId(null);
                  });
                }}
                onDelete={() => run(() => api(`/action-items/${item.id}`, { method: "DELETE" }))}
              />
            ))}
          </ul>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const text = draft.trim();
              if (!text) return;
              setDraft("");
              void run(() => api(`/meetings/${meeting.id}/action-items`, { method: "POST", body: JSON.stringify({ text }) }));
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add an action item"
              className="min-w-0 flex-1 rounded-lg border border-ff-strong bg-ff-elevated px-3 py-2 text-sm text-ff-text outline-none focus:border-[#6d4aff]"
            />
            <button type="submit" className="rounded-md bg-[#6d4aff] px-3 text-[13px] font-medium text-on-accent">
              Add
            </button>
          </form>
        </section>
      </div>
    </aside>
  );
}

function noteSections(meeting: MeetingDetail) {
  const topics = [...meeting.topics].sort((a, b) => (a.start_seconds ?? 0) - (b.start_seconds ?? 0));
  if (topics.length === 0) {
    return [{ title: meeting.title, start: null, lead: meeting.summary?.body || "No summary for this meeting.", bullets: [] }];
  }
  return topics.map((topic, index) => {
    const start = topic.start_seconds ?? 0;
    const end = topics[index + 1]?.start_seconds ?? Number.POSITIVE_INFINITY;
    const lines = meeting.segments.filter((segment) => segment.start_seconds >= start && segment.start_seconds < end);
    const [first, ...rest] = lines;
    const shown = index === 0 ? lines : rest;
    return {
      title: topic.title,
      start: topic.start_seconds,
      lead: first?.text || "No notes in this section.",
      bullets: shown.map((segment) => ({ start: segment.start_seconds, text: segment.text })),
    };
  });
}

function formatStamp(seconds: number) {
  const clock = formatClock(seconds);
  const [minutes, remain] = clock.split(":");
  return `${minutes.padStart(2, "0")}:${remain}`;
}

function ActionRow({
  item,
  editing,
  editingText,
  onEdit,
  onEditingText,
  onToggle,
  onSave,
  onDelete,
}: {
  item: ActionItem;
  editing: boolean;
  editingText: string;
  onEdit: () => void;
  onEditingText: (value: string) => void;
  onToggle: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-start gap-2">
      <input type="checkbox" checked={item.is_done} onChange={onToggle} className="mt-1 accent-[#6c4dff]" aria-label="Complete" />
      {editing ? (
        <input
          value={editingText}
          onChange={(event) => onEditingText(event.target.value)}
          onBlur={onSave}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSave();
          }}
          className="min-w-0 flex-1 rounded-md border border-ff-strong bg-ff-bg px-2 py-1 text-sm text-ff-text"
          autoFocus
        />
      ) : (
        <button type="button" onClick={onEdit} className={`flex-1 text-left text-sm text-ff-text ${item.is_done ? "text-ff-text-muted line-through" : ""}`}>
          {item.text}
        </button>
      )}
      <button type="button" onClick={onDelete} className="text-xs text-ff-text-muted" aria-label="Delete action item">
        ×
      </button>
    </li>
  );
}
