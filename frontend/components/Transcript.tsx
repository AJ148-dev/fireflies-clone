"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import { avatarColor, formatClock } from "@/lib/formatTime";
import type { Segment, SegmentComment } from "@/lib/types";

export function Transcript({
  segments,
  activeIndex,
  query,
  matchCursor,
  followSearch,
  onSeek,
  onComments,
  onHighlight,
  onError,
}: {
  segments: Segment[];
  activeIndex: number;
  query: string;
  matchCursor: number;
  followSearch: boolean;
  onSeek: (seconds: number) => void;
  onComments: (segmentId: number, comments: SegmentComment[]) => void;
  onHighlight: (segmentId: number, highlighted: boolean) => void;
  onError: (message: string) => void;
}) {
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const needle = query.trim().toLowerCase();

  useEffect(() => {
    if (!followSearch) return;
    document.querySelector(`[data-match="${matchCursor}"]`)?.scrollIntoView({ block: "center" });
  }, [followSearch, matchCursor, needle]);

  useEffect(() => {
    if (followSearch) return;
    rowRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, followSearch]);

  if (segments.length === 0) {
    return <p className="px-6 py-10 text-sm text-ff-text-muted">This meeting has no transcript yet.</p>;
  }

  const starts: number[] = [];
  segments.reduce((total, segment) => {
    starts.push(total);
    return total + matchesIn(segment.text, needle);
  }, 0);
  return (
    <div className="flex flex-col">
      {segments.map((segment, index) => {
        const active = index === activeIndex;
        const startIndex = starts[index];
        return (
          <div key={segment.id} className={`group relative px-4 py-3 ${active ? "bg-ff-transcript-active" : "hover-ff"}`}>
            <button
              type="button"
              ref={(node) => {
                rowRefs.current[index] = node;
              }}
              onClick={() => onSeek(segment.start_seconds)}
              className="block w-full text-left"
            >
              <span className="flex items-baseline gap-2">
                <span className="text-[11px] tabular-nums text-ff-text-muted">{formatClock(segment.start_seconds)}</span>
                <span className="text-[13px] font-semibold" style={{ color: avatarColor(segment.speaker_name) }}>
                  {segment.speaker_name}
                </span>
              </span>
              <span className={`mt-1 block text-sm leading-6 text-ff-text ${segment.highlighted ? "rounded-md bg-[#f5c14a]/30 px-1.5" : ""}`}>
                <Highlight
                  text={segment.text}
                  needle={needle}
                  startIndex={startIndex}
                  activeMatch={followSearch ? matchCursor : -1}
                />
              </span>
            </button>
            <CommentList
              segmentId={segment.id}
              comments={segment.comments ?? []}
              highlighted={Boolean(segment.highlighted)}
              onComments={onComments}
              onHighlight={onHighlight}
              onError={onError}
            />
          </div>
        );
      })}
    </div>
  );
}

function CommentList({
  segmentId,
  comments,
  highlighted,
  onComments,
  onHighlight,
  onError,
}: {
  segmentId: number;
  comments: SegmentComment[];
  highlighted: boolean;
  onComments: (segmentId: number, comments: SegmentComment[]) => void;
  onHighlight: (segmentId: number, highlighted: boolean) => void;
  onError: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function addComment() {
    const body = draft.trim();
    if (!body || saving) return;
    setSaving(true);
    try {
      const created = await api<SegmentComment>(`/segments/${segmentId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      onComments(segmentId, [...comments, created]);
      setDraft("");
      setOpen(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not save the comment");
    } finally {
      setSaving(false);
    }
  }

  async function removeComment(commentId: number) {
    try {
      await api(`/comments/${commentId}`, { method: "DELETE" });
      onComments(segmentId, comments.filter((comment) => comment.id !== commentId));
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not delete the comment");
    }
  }

  async function toggleHighlight() {
    try {
      if (highlighted) {
        await api(`/segments/${segmentId}/highlight`, { method: "DELETE" });
        onHighlight(segmentId, false);
      } else {
        await api(`/segments/${segmentId}/highlight`, { method: "PUT" });
        onHighlight(segmentId, true);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not update the highlight");
    }
  }

  const actionsVisible = open || comments.length > 0 || highlighted;

  return (
    <div>
      {comments.length > 0 ? (
        <div className="mt-1.5">
          {comments.map((comment) => (
            <p key={comment.id} className="mb-1 flex items-start gap-2 text-[12px] leading-5 text-ff-text">
              <span className="min-w-0 flex-1 rounded-md bg-ff-elevated px-2 py-1">{comment.body}</span>
              <button type="button" onClick={() => removeComment(comment.id)} className="shrink-0 text-ff-text-muted hover:text-ff-text" aria-label="Delete comment">
                ×
              </button>
            </p>
          ))}
        </div>
      ) : null}
      {open ? (
        <form
          className="mt-1.5 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void addComment();
          }}
        >
          <input
            value={draft}
            autoFocus
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a comment"
            className="min-w-0 flex-1 rounded-md border border-ff-strong bg-ff-elevated px-2 py-1 text-[12px] text-ff-text outline-none focus:border-[#6d4aff]"
          />
          <button type="submit" disabled={saving || !draft.trim()} className="text-[12px] font-medium text-[#c4b5fd] disabled:text-ff-text-faint">
            Save
          </button>
        </form>
      ) : (
        <span className={`absolute right-3 top-2.5 flex gap-3 rounded-md bg-ff-bg/90 px-1 ${actionsVisible ? "" : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"}`}>
          <button type="button" onClick={() => setOpen(true)} className="text-[11px] font-medium text-ff-text-muted hover:text-ff-text">
            {comments.length > 0 ? "Add comment" : "Comment"}
          </button>
          <button type="button" onClick={() => void toggleHighlight()} className={`text-[11px] font-medium ${highlighted ? "text-[#f5c14a]" : "text-ff-text-muted hover:text-ff-text"}`}>
            {highlighted ? "Highlighted" : "Highlight"}
          </button>
        </span>
      )}
    </div>
  );
}

function Highlight({
  text,
  needle,
  startIndex,
  activeMatch,
}: {
  text: string;
  needle: string;
  startIndex: number;
  activeMatch: number;
}) {
  if (!needle) return <>{text}</>;
  const lower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let local = startIndex;
  while (cursor < text.length) {
    const found = lower.indexOf(needle, cursor);
    if (found === -1) {
      parts.push(text.slice(cursor));
      break;
    }
    if (found > cursor) parts.push(text.slice(cursor, found));
    const current = local;
    local += 1;
    parts.push(
      <mark
        key={`${found}-${current}`}
        data-match={current}
        className={`rounded-sm px-0.5 text-inherit ${current === activeMatch ? "bg-[#f5c14a]" : "bg-[#ffe8a3]"}`}
      >
        {text.slice(found, found + needle.length)}
      </mark>,
    );
    cursor = found + needle.length;
  }
  return <>{parts}</>;
}

function matchesIn(text: string, needle: string) {
  if (!needle) return 0;
  let count = 0;
  let index = 0;
  const lower = text.toLowerCase();
  while (index < lower.length) {
    const found = lower.indexOf(needle, index);
    if (found === -1) break;
    count += 1;
    index = found + needle.length;
  }
  return count;
}

export function countMatches(segments: Segment[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return 0;
  return segments.reduce((total, segment) => {
    let count = 0;
    let index = 0;
    const lower = segment.text.toLowerCase();
    while (index < lower.length) {
      const found = lower.indexOf(needle, index);
      if (found === -1) break;
      count += 1;
      index = found + needle.length;
    }
    return total + count;
  }, 0);
}
