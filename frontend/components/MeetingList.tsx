"use client";

import Link from "next/link";
import { useState } from "react";

import { DeleteMeetingDialog, EditMeetingModal } from "@/components/CreateMeetingModal";
import { api } from "@/lib/api";
import { avatarColor, formatClock, formatDate, formatDuration, formatTimeOfDay, initials } from "@/lib/formatTime";
import type { MeetingCard, MeetingDetail } from "@/lib/types";

export function MeetingList({
  meetings,
  filtered,
  onClear,
  onChanged,
}: {
  meetings: MeetingCard[];
  filtered: boolean;
  onClear: () => void;
  onChanged: () => void;
}) {
  const [menuId, setMenuId] = useState<number | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<MeetingCard | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<MeetingCard | null>(null);

  if (meetings.length === 0) {
    return (
      <div className="px-8 py-16 text-center">
        <p className="text-sm text-[#d4d4d8]">{filtered ? "No meetings match this search." : "No meetings yet."}</p>
        {filtered ? (
          <button type="button" onClick={onClear} className="mt-3 text-sm font-medium text-[#6c4dff]">
            Clear filters
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {meetings.map((meeting) => {
        const host = meeting.participants[0]?.name ?? "Maya Chen";
        return (
          <div key={meeting.id} className="group relative flex items-center gap-4 border-b border-white/5 px-6 py-3.5 hover:bg-white/5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#6d4aff] text-xs font-semibold text-white">
              {initials(host).slice(0, 1)}
            </span>
            <Link href={`/meetings/${meeting.id}`} className="block min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{meeting.title}</span>
              <span className="mt-0.5 block truncate text-xs text-[#6b7080]">
                {formatDate(meeting.started_at)} · {formatTimeOfDay(meeting.started_at)} · {formatDuration(meeting.duration_seconds)}
                {meeting.participants.length > 0 ? ` · ${meeting.participants.map((person) => person.name).join(", ")}` : ""}
              </span>
            </Link>
            <span className="hidden items-center -space-x-2 sm:flex">
              {meeting.participants.slice(0, 4).map((person) => (
                <span
                  key={person.id}
                  title={person.name}
                  className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#121214] text-[10px] font-semibold text-white"
                  style={{ background: avatarColor(person.name) }}
                >
                  {initials(person.name)}
                </span>
              ))}
            </span>
            <button
              type="button"
              aria-label="Meeting actions"
              onClick={() => setMenuId(menuId === meeting.id ? null : meeting.id)}
              className="rounded-md px-2 py-1 text-sm text-[#a1a1aa] opacity-0 hover:bg-white/10 group-hover:opacity-100"
            >
              ···
            </button>
            {menuId === meeting.id ? (
              <div className="absolute right-6 top-12 z-20 w-44 rounded-xl border border-white/10 bg-[#242428] py-1 text-sm shadow-lg">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left hover:bg-white/5"
                  onClick={() => {
                    setMenuId(null);
                    setEditingMeeting(meeting);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left hover:bg-white/5"
                  onClick={() => {
                    setMenuId(null);
                    void downloadNotes(meeting.id);
                  }}
                >
                  Download
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[#f87171] hover:bg-white/5"
                  onClick={() => {
                    setMenuId(null);
                    setDeletingMeeting(meeting);
                  }}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
      {editingMeeting ? (
        <EditMeetingModal
          meeting={editingMeeting}
          onClose={() => setEditingMeeting(null)}
          onSaved={() => {
            setEditingMeeting(null);
            onChanged();
          }}
        />
      ) : null}
      {deletingMeeting ? (
        <DeleteMeetingDialog
          title={deletingMeeting.title}
          onClose={() => setDeletingMeeting(null)}
          onConfirm={async () => {
            await api(`/meetings/${deletingMeeting.id}`, { method: "DELETE" });
            setDeletingMeeting(null);
            onChanged();
          }}
        />
      ) : null}
    </div>
  );
}

async function downloadNotes(id: number) {
  const meeting = await api<MeetingDetail>(`/meetings/${id}`);
  const lines = [
    meeting.title,
    "",
    meeting.summary?.body ?? "",
    "",
    ...meeting.segments.map((segment) => `[${formatClock(segment.start_seconds)}] ${segment.speaker_name}: ${segment.text}`),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${meeting.title}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}
