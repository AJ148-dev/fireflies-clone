"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import { formatClock } from "@/lib/formatTime";
import type { ActionItem, MeetingDetail } from "@/lib/types";

export function SummaryRail({
  meeting,
  onChange,
  onSeek,
  onError,
  onCopied,
}: {
  meeting: MeetingDetail;
  onChange: (meeting: MeetingDetail) => void;
  onSeek: (seconds: number) => void;
  onError: (message: string) => void;
  onCopied: () => void;
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
    <aside className="flex h-full min-h-0 min-w-0 flex-col bg-[#121214]">
      <div className="flex justify-end px-8 pt-3">
        <button type="button" onClick={() => void copySummary()} className="text-[12px] text-[#a1a1aa] hover:text-white">
          Copy
        </button>
      </div>
      <div id="outline" className="mx-auto flex w-full max-w-3xl flex-col gap-8 overflow-y-auto px-8 py-4">
        {sections.map((section, index) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#d4d4d8]">{index === 0 ? meeting.summary?.body || section.lead : section.lead}</p>
            {section.bullets.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#e4e4e7]">
                {section.bullets.map((bullet) => (
                  <li key={`${bullet.start}-${bullet.text}`}>
                    {bullet.text}{" "}
                    <button type="button" onClick={() => onSeek(bullet.start)} className="text-[#a78bfa]">
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
            {meeting.action_items.length === 0 ? <li className="text-sm text-[#a1a1aa]">No action items yet.</li> : null}
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
                onSave={() =>
                  run(async () => {
                    await api(`/action-items/${item.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ text: editingText.trim() }),
                    });
                    setEditingId(null);
                  })
                }
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
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#1c1c20] px-3 py-2 text-sm outline-none focus:border-[#6d4aff]"
            />
            <button type="submit" className="rounded-md bg-[#6d4aff] px-3 text-[13px] font-medium">
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
    return [{ title: meeting.title, lead: meeting.summary?.body || "No summary for this meeting.", bullets: [] }];
  }
  return topics.map((topic, index) => {
    const start = topic.start_seconds ?? 0;
    const end = topics[index + 1]?.start_seconds ?? Number.POSITIVE_INFINITY;
    const lines = meeting.segments.filter((segment) => segment.start_seconds >= start && segment.start_seconds < end);
    const [first, ...rest] = lines;
    const shown = index === 0 ? lines : rest;
    return {
      title: topic.title,
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
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#121214] px-2 py-1 text-sm"
          autoFocus
        />
      ) : (
        <button type="button" onClick={onEdit} className={`flex-1 text-left text-sm ${item.is_done ? "text-[#98a0b3] line-through" : ""}`}>
          {item.text}
        </button>
      )}
      <button type="button" onClick={onDelete} className="text-xs text-[#98a0b3]" aria-label="Delete action item">
        ×
      </button>
    </li>
  );
}
