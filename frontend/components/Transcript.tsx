"use client";

import { useEffect, useRef } from "react";

import { formatClock } from "@/lib/formatTime";
import type { Segment } from "@/lib/types";

export function Transcript({
  segments,
  activeIndex,
  query,
  matchCursor,
  followSearch,
  onSeek,
}: {
  segments: Segment[];
  activeIndex: number;
  query: string;
  matchCursor: number;
  followSearch: boolean;
  onSeek: (seconds: number) => void;
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
    return <p className="px-6 py-10 text-sm text-[#6b7080]">This meeting has no transcript yet.</p>;
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
          <button
            key={segment.id}
            type="button"
            ref={(node) => {
              rowRefs.current[index] = node;
            }}
            onClick={() => onSeek(segment.start_seconds)}
            className={`flex gap-3 px-3 py-2 text-left ${
              active ? "bg-[#241c3d]" : "hover:bg-white/5"
            }`}
          >
            <span className="w-10 shrink-0 pt-0.5 text-xs tabular-nums text-[#98a0b3]">
              {formatClock(segment.start_seconds)}
            </span>
            <span className="min-w-0 border-l-2 pl-3" style={{ borderColor: active ? "#6d4aff" : "#2a2a2e" }}>
              <span className="block text-xs font-semibold text-[#d4d4d8]">{segment.speaker_name}</span>
              <span className="mt-0.5 block text-[13px] leading-5 text-[#e4e4e7]">
                <Highlight
                  text={segment.text}
                  needle={needle}
                  startIndex={startIndex}
                  activeMatch={followSearch ? matchCursor : -1}
                />
              </span>
            </span>
          </button>
        );
      })}
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
