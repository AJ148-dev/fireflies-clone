"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useToast } from "@/components/Toast";
import { api } from "@/lib/api";
import type { MeetingCard, MeetingDetail } from "@/lib/types";

type Row = { id: number; text: string; is_done: boolean; meetingId: number; meetingTitle: string };

export function TasksScreen() {
  const toast = useToast();
  const [tab, setTab] = useState<"mine" | "all">("mine");
  const [rows, setRows] = useState<Row[]>([]);
  const [meetings, setMeetings] = useState<MeetingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [meetingId, setMeetingId] = useState<number | "">("");

  function load() {
    setLoading(true);
    api<MeetingCard[]>("/meetings?sort=recent")
      .then(async (cards) => {
        setMeetings(cards);
        setMeetingId((current) => current || cards[0]?.id || "");
        const details = await Promise.all(cards.map((card) => api<MeetingDetail>(`/meetings/${card.id}`)));
        setRows(
          details.flatMap((detail) =>
            detail.action_items.map((item) => ({
              id: item.id,
              text: item.text,
              is_done: item.is_done,
              meetingId: detail.id,
              meetingTitle: detail.title,
            })),
          ),
        );
      })
      .catch((err: Error) => toast(err.message, "err"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = tab === "mine" ? rows.filter((row) => !row.is_done) : rows;

  return (
    <div className="h-full overflow-y-auto bg-[#121214] px-8 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center">
          <div className="flex gap-2">
            <button type="button" onClick={() => setTab("mine")} className={`rounded-lg px-3 py-1 text-[13px] ${tab === "mine" ? "bg-[#2a2a2e]" : "text-[#a1a1aa]"}`}>
              My Tasks
            </button>
            <button type="button" onClick={() => setTab("all")} className={`rounded-lg px-3 py-1 text-[13px] ${tab === "all" ? "bg-[#2a2a2e]" : "text-[#a1a1aa]"}`}>
              All Tasks
            </button>
          </div>
          <button type="button" onClick={() => toast("Feedback is coming soon")} className="ml-auto text-[13px] text-[#a1a1aa]">
            Share Feedback
          </button>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3">
          <span className="text-sm text-[#d4d4d8]">Automatically send all your tasks to your work apps.</span>
          <button type="button" onClick={() => toast("Connectors are coming soon")} className="ml-auto text-[13px] font-medium text-[#60a5fa]">
            Connect
          </button>
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-[#a1a1aa]">Loading tasks…</p>
        ) : visible.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm font-medium">All your meeting tasks in one place</p>
            <p className="mt-2 text-[13px] text-[#a1a1aa]">Manage, assign and update all your meeting tasks here.</p>
            <button type="button" onClick={() => setAdding(true)} className="mt-5 rounded-lg bg-[#6d4aff] px-4 py-2 text-sm font-medium">
              + Now
            </button>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col">
            {visible.map((row) => (
              <li key={row.id} className="flex items-center gap-3 border-b border-white/5 py-3">
                <input
                  type="checkbox"
                  checked={row.is_done}
                  aria-label="Complete"
                  className="accent-[#6d4aff]"
                  onChange={() => {
                    void api(`/action-items/${row.id}`, { method: "PATCH", body: JSON.stringify({ is_done: !row.is_done }) }).then(load);
                  }}
                />
                <span className={`min-w-0 flex-1 text-sm ${row.is_done ? "text-[#71717a] line-through" : ""}`}>{row.text}</span>
                <Link href={`/meetings/${row.meetingId}`} className="truncate text-xs text-[#a1a1aa]">
                  {row.meetingTitle}
                </Link>
              </li>
            ))}
            <li className="pt-4">
              <button type="button" onClick={() => setAdding(true)} className="rounded-lg bg-[#6d4aff] px-4 py-2 text-sm font-medium">
                + Now
              </button>
            </li>
          </ul>
        )}

        {adding ? (
          <form
            className="mt-4 flex flex-wrap items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const text = draft.trim();
              if (!text || meetingId === "") return;
              void api(`/meetings/${meetingId}/action-items`, { method: "POST", body: JSON.stringify({ text }) })
                .then(() => {
                  setDraft("");
                  setAdding(false);
                  load();
                })
                .catch((err: Error) => toast(err.message, "err"));
            }}
          >
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Task" className="min-w-[220px] flex-1 rounded-lg border border-white/10 bg-[#1c1c20] px-3 py-2 text-sm outline-none" />
            <select value={meetingId} aria-label="Meeting" onChange={(event) => setMeetingId(Number(event.target.value))} className="rounded-lg border border-white/10 bg-[#1c1c20] px-2 py-2 text-sm">
              {meetings.map((meeting) => (
                <option key={meeting.id} value={meeting.id}>{meeting.title}</option>
              ))}
            </select>
            <button type="submit" className="rounded-lg bg-[#6d4aff] px-3 py-2 text-sm">Add</button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
