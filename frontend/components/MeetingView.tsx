"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { DeleteMeetingDialog, EditMeetingModal } from "@/components/CreateMeetingModal";
import { Player, type PlayerHandle } from "@/components/Player";
import { SummaryRail } from "@/components/SummaryRail";
import { countMatches, Transcript } from "@/components/Transcript";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api";
import { activeSegmentIndex } from "@/lib/activeSegment";
import { avatarColor, formatClock, formatDate, formatDuration, formatTimeOfDay, initials } from "@/lib/formatTime";
import type { MeetingDetail } from "@/lib/types";

const TOOLS = [
  { id: "search", label: "Smart Search", icon: "search" },
  { id: "index", label: "Index", icon: "index" },
  { id: "soundbites", label: "Soundbites", icon: "mic" },
  { id: "comments", label: "Comments", icon: "chat" },
  { id: "bookmarks", label: "Bookmarks", icon: "mark" },
] as const;

export function MeetingView() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const playerRef = useRef<PlayerHandle>(null);
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [time, setTime] = useState(0);
  const [query, setQuery] = useState("");
  const [matchCursor, setMatchCursor] = useState(0);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pane, setPane] = useState<"notes" | "transcript">("notes");
  const onTime = useCallback((seconds: number) => setTime(seconds), []);

  useEffect(() => {
    api<MeetingDetail>(`/meetings/${params.id}`)
      .then((data) => {
        setMeeting(data);
        setMissing(false);
      })
      .catch(() => setMissing(true));
  }, [params.id]);

  if (missing) {
    return <p className="p-8 text-sm text-[#6b7080]">This meeting is gone.</p>;
  }
  if (!meeting) {
    return <p className="p-8 text-sm text-[#6b7080]">Loading meeting…</p>;
  }

  const matches = countMatches(meeting.segments, query);
  const activeIndex = activeSegmentIndex(meeting.segments, time);

  function ToolIcon({ name }: { name: (typeof TOOLS)[number]["icon"] }) {
  const common = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", "aria-hidden": true as const };
  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10.2 10.2 13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "index") {
    return (
      <svg {...common}>
        <path d="M3 4h10M3 8h10M3 12h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "mic") {
    return (
      <svg {...common}>
        <rect x="6" y="2" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M4 8a4 4 0 0 0 8 0M8 12v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "chat") {
    return (
      <svg {...common}>
        <path d="M3 4.5h10v6H6l-3 2.2V4.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 2.5h8v11l-4-2.2-4 2.2v-11Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

  function step(direction: number) {
    if (matches === 0) return;
    setMatchCursor((current) => (current + direction + matches) % matches);
  }

  function downloadNotes() {
    const lines = [
      meeting!.title,
      `${formatDate(meeting!.started_at)} · ${formatDuration(meeting!.duration_seconds)}`,
      "",
      "Summary",
      meeting!.summary?.body ?? "No summary.",
      "",
      "Action items",
      ...meeting!.action_items.map((item) => `- [${item.is_done ? "x" : " "}] ${item.text}`),
      "",
      "Transcript",
      ...meeting!.segments.map(
        (segment) => `[${formatClock(segment.start_seconds)}] ${segment.speaker_name}: ${segment.text}`,
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${meeting!.title}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#121214]">
      <header className="flex items-center gap-3 border-b border-white/5 px-3 py-2">
        <Link href="/meetings" className="rounded-md px-2 py-1 text-[13px] text-[#a1a1aa] hover:bg-white/5">
          Meetings
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{meeting.title}</h1>
          <p className="truncate text-[11px] text-[#a1a1aa]">
            {formatDate(meeting.started_at)} · {formatTimeOfDay(meeting.started_at)} · {formatDuration(meeting.duration_seconds)}
            {meeting.participants.length > 0 ? ` · ${meeting.participants.map((person) => person.name).join(", ")}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {meeting.participants.slice(0, 3).map((person) => (
            <span
              key={person.id}
              title={person.name}
              className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold text-white"
              style={{ background: avatarColor(person.name) }}
            >
              {initials(person.name)}
            </span>
          ))}
        </div>
        <Link href="/ask" className="rounded-md px-2 py-1 text-[13px] font-medium text-[#c4b5fd] hover:bg-white/5">
          AskFred
        </Link>
        <button type="button" onClick={() => toast("Sharing is coming soon")} className="rounded-md bg-[#6d4aff] px-2.5 py-1 text-[13px] font-medium text-white">
          Share
        </button>
        <div className="relative">
          <button type="button" onClick={() => setMenuOpen((open) => !open)} className="rounded-lg px-2 py-1.5 text-sm text-[#d4d4d8] hover:bg-white/5" aria-label="Meeting menu">
            ···
          </button>
          {menuOpen ? (
            <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-white/10 bg-[#242428] py-1 text-sm shadow-lg">
              <button type="button" className="block w-full px-3 py-2 text-left hover:bg-white/5" onClick={() => { setMenuOpen(false); setEditing(true); }}>
                Rename
              </button>
              <button type="button" className="block w-full px-3 py-2 text-left hover:bg-white/5" onClick={() => { setMenuOpen(false); downloadNotes(); toast("Notes downloaded"); }}>
                Download notes
              </button>
              <button type="button" className="block w-full px-3 py-2 text-left hover:bg-white/5" onClick={() => { setMenuOpen(false); toast(`${meeting.participants.length} participants · ${formatDuration(meeting.duration_seconds)}`); }}>
                Meeting info
              </button>
              <button type="button" className="block w-full px-3 py-2 text-left text-[#f87171] hover:bg-white/5" onClick={() => { setMenuOpen(false); setDeleting(true); }}>
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </header>
      <Player src={meeting.audio_path} playerRef={playerRef} onTime={onTime} />
      <div className="flex items-center gap-1 border-b border-white/5 px-3">
        <button type="button" onClick={() => setPane("notes")} className={`border-b-2 px-3 py-2 text-[13px] ${pane === "notes" ? "border-[#6d4aff] font-medium" : "border-transparent text-[#a1a1aa]"}`}>
          Notes
        </button>
        <button type="button" onClick={() => setPane("transcript")} className={`border-b-2 px-3 py-2 text-[13px] ${pane === "transcript" ? "border-[#6d4aff] font-medium" : "border-transparent text-[#a1a1aa]"}`}>
          Transcript
        </button>
      </div>
      <div className="flex min-h-0 flex-1">
        <nav className="flex w-11 shrink-0 flex-col items-center gap-0.5 border-r border-white/5 py-2">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              title={tool.label}
              onClick={() => {
                if (tool.id === "search") {
                  setPane("transcript");
                  return;
                }
                if (tool.id === "index") {
                  setPane("notes");
                  setTimeout(() => document.getElementById("outline")?.scrollIntoView({ block: "start" }), 0);
                  return;
                }
                toast(`${tool.label} is coming soon`);
              }}
              className="grid h-8 w-8 place-items-center rounded-md text-[#a1a1aa] hover:bg-white/5 hover:text-white"
            >
              <ToolIcon name={tool.icon} />
            </button>
          ))}
        </nav>
        {pane === "notes" ? (
          <div className="min-h-0 min-w-0 flex-1">
            <SummaryRail
              meeting={meeting}
              onChange={setMeeting}
              onSeek={(seconds) => playerRef.current?.seek(seconds)}
              onError={(message) => toast(message, "err")}
              onCopied={() => toast("Summary copied")}
            />
          </div>
        ) : (
          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setMatchCursor(0);
                }}
                placeholder="Find"
                className="w-[180px] rounded-md border border-white/10 bg-[#1c1c20] px-2.5 py-1 text-[13px] outline-none focus:border-[#6d4aff]"
              />
              <span className="text-[11px] text-[#a1a1aa]">{query.trim() ? `${matches} found` : ""}</span>
              <button type="button" onClick={() => step(-1)} disabled={!matches} className="text-[11px] text-[#d4d4d8] disabled:text-[#3f3f46]">
                Prev
              </button>
              <button type="button" onClick={() => step(1)} disabled={!matches} className="text-[11px] text-[#d4d4d8] disabled:text-[#3f3f46]">
                Next
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Transcript
                segments={meeting.segments}
                activeIndex={activeIndex}
                query={query}
                matchCursor={matchCursor}
                followSearch={Boolean(query.trim())}
                onSeek={(seconds) => playerRef.current?.seek(seconds)}
              />
            </div>
          </section>
        )}
      </div>
      {editing ? (
        <EditMeetingModal
          meeting={meeting}
          onClose={() => setEditing(false)}
          onSaved={(saved) => {
            setMeeting(saved);
            setEditing(false);
            toast("Meeting updated");
          }}
        />
      ) : null}
      {deleting ? (
        <DeleteMeetingDialog
          title={meeting.title}
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            await api(`/meetings/${meeting.id}`, { method: "DELETE" });
            toast("Meeting deleted");
            router.push("/");
          }}
        />
      ) : null}
    </div>
  );
}
