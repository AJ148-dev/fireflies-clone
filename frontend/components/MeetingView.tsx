"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { DeleteMeetingDialog, EditMeetingModal } from "@/components/CreateMeetingModal";
import { ExportMenu } from "@/components/ExportMenu";
import { Player, type PlayerHandle } from "@/components/Player";
import { VideoPlayer } from "@/components/VideoPlayer";
import { SummaryRail } from "@/components/SummaryRail";
import { countMatches, Transcript } from "@/components/Transcript";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api";
import { downloadMeetingExport, type ExportFormat, type ExportKind } from "@/lib/exportMeeting";
import { activeSegmentIndex } from "@/lib/activeSegment";
import { avatarColor, formatDate, formatDuration, formatTimeOfDay, initials } from "@/lib/formatTime";
import type { MeetingDetail } from "@/lib/types";

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
  const [sideTab, setSideTab] = useState<"transcript" | "ask">("transcript");
  const onTime = useCallback((seconds: number) => setTime(seconds), []);

  useEffect(() => {
    api<MeetingDetail>(`/meetings/${params.id}`)
      .then((data) => {
        setMeeting(data);
        setMissing(false);
        const term = new URLSearchParams(window.location.search).get("q")?.trim() ?? "";
        if (!term) return;
        setQuery(term);
        const lower = term.toLowerCase();
        const inTranscript = data.segments.some(
          (segment) => segment.text.toLowerCase().includes(lower) || segment.speaker_name.toLowerCase().includes(lower),
        );
        if (inTranscript) setPane("transcript");
      })
      .catch(() => setMissing(true));
  }, [params.id]);

  if (missing) {
    return <p className="p-8 text-sm text-ff-text-muted">This meeting is gone.</p>;
  }
  if (!meeting) {
    return <p className="p-8 text-sm text-ff-text-muted">Loading meeting…</p>;
  }

  const matches = countMatches(meeting.segments, query);
  const activeIndex = activeSegmentIndex(meeting.segments, time);

  function step(direction: number) {
    if (matches === 0) return;
    setMatchCursor((current) => (current + direction + matches) % matches);
  }

  function exportFile(kind: ExportKind, format: ExportFormat) {
    downloadMeetingExport(meeting!, kind, format);
    setMenuOpen(false);
    const label = kind === "summary" ? "Summary" : "Transcript";
    const extension = format === "md" ? "Markdown" : format.toUpperCase();
    toast(`${label} downloaded as ${extension}`);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-ff-bg text-ff-text">
      <header className="flex shrink-0 items-center gap-3 border-b border-ff bg-ff-bg px-3 py-2">
        <Link href="/meetings" className="rounded-md px-2 py-1 text-[13px] text-ff-text-muted hover-ff">
          Meetings
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{meeting.title}</h1>
          <p className="truncate text-[11px] text-ff-text-muted">
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
        <button type="button" onClick={() => setEditing(true)} className="rounded-md border border-ff-strong px-2.5 py-1 text-[13px] font-medium text-ff-text hover-ff">
          Edit
        </button>
        <Link href="/ask" className="rounded-md px-2 py-1 text-[13px] font-medium text-ff-link hover-ff">
          AskFred
        </Link>
        <button type="button" onClick={() => toast("Sharing is coming soon")} className="rounded-md bg-[#6d4aff] px-2.5 py-1 text-[13px] font-medium text-on-accent">
          Share
        </button>
        <div className="relative">
          <button type="button" onClick={() => setMenuOpen((open) => !open)} className="rounded-lg px-2 py-1.5 text-sm text-ff-text-secondary hover-ff" aria-label="Meeting menu">
            ···
          </button>
          {menuOpen ? (
            <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-ff-strong bg-ff-panel py-1 text-sm shadow-lg">
              <button type="button" className="block w-full px-3 py-2 text-left hover-ff" onClick={() => { setMenuOpen(false); setEditing(true); }}>
                Edit meeting
              </button>
              <button type="button" className="block w-full px-3 py-2 text-left hover-ff" onClick={() => { setMenuOpen(false); toast(`${meeting.participants.length} participants · ${formatDuration(meeting.duration_seconds)}`); }}>
                Meeting info
              </button>
              <button type="button" className="block w-full px-3 py-2 text-left text-[#f87171] hover-ff" onClick={() => { setMenuOpen(false); setDeleting(true); }}>
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div
          className={`min-w-0 overflow-y-auto lg:min-h-0 lg:flex-1 lg:border-r lg:border-ff ${pane === "notes" ? "min-h-0 flex-1" : "shrink-0"}`}
        >
          <div className="mx-auto w-full max-w-4xl">
            <div className="px-4 pt-4 lg:px-8 lg:pt-6">
              {meeting.youtube_video_id ? (
                <VideoPlayer videoId={meeting.youtube_video_id} playerRef={playerRef} onTime={onTime} startAt={time} />
              ) : (
                <Player src={meeting.audio_path} playerRef={playerRef} onTime={onTime} />
              )}
            </div>
            <div className={pane === "notes" ? "block" : "hidden lg:block"}>
              <SummaryRail
                meeting={meeting}
                onChange={setMeeting}
                onSeek={(seconds) => playerRef.current?.seek(seconds)}
                onError={(message) => toast(message, "err")}
                onCopied={() => toast("Summary copied")}
                onExport={(format) => exportFile("summary", format)}
              />
            </div>
          </div>
        </div>
        <aside
          className={`${pane === "transcript" ? "flex" : "hidden"} min-h-0 w-full min-w-0 flex-col bg-ff-bg lg:flex lg:w-[min(100%,420px)] lg:shrink-0 xl:w-[440px]`}
        >
          <div className="flex shrink-0 border-b border-ff px-2 pt-1">
            <button
              type="button"
              onClick={() => setSideTab("transcript")}
              className={`border-b-2 px-3 py-2.5 text-[13px] font-medium ${sideTab === "transcript" ? "border-[#6d4aff] text-ff-text" : "border-transparent text-ff-text-muted"}`}
            >
              Transcript
            </button>
            <button
              type="button"
              onClick={() => setSideTab("ask")}
              className={`border-b-2 px-3 py-2.5 text-[13px] font-medium ${sideTab === "ask" ? "border-[#6d4aff] text-ff-text" : "border-transparent text-ff-text-muted"}`}
            >
              AskFred
            </button>
          </div>
          {sideTab === "transcript" ? (
            <>
              <div className="flex shrink-0 items-center gap-2 border-b border-ff px-3 py-2">
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setMatchCursor(0);
                  }}
                  placeholder="Search transcript"
                  className="min-w-0 flex-1 rounded-md border border-ff-strong bg-ff-elevated px-2.5 py-1.5 text-[13px] text-ff-text outline-none focus:border-[#6d4aff]"
                />
                <span className="shrink-0 text-[11px] text-ff-text-muted">{query.trim() ? `${matches}` : ""}</span>
                <button type="button" onClick={() => step(-1)} disabled={!matches} className="shrink-0 text-[11px] text-ff-text-secondary disabled:text-ff-text-faint">
                  ↑
                </button>
                <button type="button" onClick={() => step(1)} disabled={!matches} className="shrink-0 text-[11px] text-ff-text-secondary disabled:text-ff-text-faint">
                  ↓
                </button>
                <ExportMenu kind="transcript" onExport={(format) => exportFile("transcript", format)} />
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
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
              <p className="text-sm text-ff-text-secondary">
                Ask questions about this meeting. Full chat lives on the AskFred page for now.
              </p>
              <Link
                href="/ask"
                className="mt-4 inline-flex w-fit rounded-lg bg-[#6d4aff] px-4 py-2 text-[13px] font-medium text-on-accent"
              >
                Open AskFred
              </Link>
            </div>
          )}
        </aside>
      </div>
      <div className="flex shrink-0 items-center justify-center gap-1 border-t border-ff bg-ff-bg px-3 py-1 lg:hidden">
        <button type="button" onClick={() => setPane("notes")} className={`flex-1 rounded-md py-2 text-[13px] ${pane === "notes" ? "bg-ff-active font-medium" : "text-ff-text-muted"}`}>
          Summary
        </button>
        <button type="button" onClick={() => setPane("transcript")} className={`flex-1 rounded-md py-2 text-[13px] ${pane === "transcript" ? "bg-ff-active font-medium" : "text-ff-text-muted"}`}>
          Transcript
        </button>
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
