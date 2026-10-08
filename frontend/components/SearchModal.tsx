"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import { formatDate, formatTimeOfDay } from "@/lib/formatTime";
import type { MeetingCard } from "@/lib/types";

export function SearchModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ needle: string; cards: MeetingCard[] }>({ needle: "", cards: [] });
  const [cursor, setCursor] = useState(0);
  const needle = query.trim();
  const results = found.needle === needle ? found.cards : [];
  const loading = Boolean(needle) && found.needle !== needle;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!needle) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      api<MeetingCard[]>(`/meetings?${new URLSearchParams({ q: needle, sort: "recent" })}`)
        .then((cards) => {
          if (cancelled) return;
          setFound({ needle, cards: cards.slice(0, 8) });
          setCursor(0);
        })
        .catch(() => {
          if (!cancelled) setFound({ needle, cards: [] });
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [needle]);

  function open(meeting: MeetingCard) {
    onClose();
    router.push(`/meetings/${meeting.id}`);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      setCursor((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      setCursor((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && results[cursor]) {
      event.preventDefault();
      open(results[cursor]);
    }
  }

  const searching = needle.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 px-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search meetings"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-ff-strong bg-ff-panel text-ff-text shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-ff px-5 py-4">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or keyword.."
            aria-label="Search by title or keyword"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ff-text outline-none placeholder:text-ff-text-faint"
          />
          <button type="button" aria-label="Close search" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-md text-ff-text-muted hover-ff hover-ff-text">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
            </svg>
          </button>
        </div>

        {searching ? (
          <ul className="max-h-[50vh] overflow-y-auto py-2" role="listbox" aria-label="Meetings">
            {results.map((meeting, index) => (
              <li key={meeting.id} role="option" aria-selected={index === cursor}>
                <button
                  type="button"
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => open(meeting)}
                  className={`block w-full px-5 py-2.5 text-left ${index === cursor ? "bg-ff-active" : ""}`}
                >
                  <span className="block truncate text-sm font-medium">{meeting.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-ff-text-muted">
                    {formatDate(meeting.started_at)} · {formatTimeOfDay(meeting.started_at)}
                    {meeting.participants.length > 0 ? ` · ${meeting.participants.map((person) => person.name).join(", ")}` : ""}
                  </span>
                </button>
              </li>
            ))}
            {!loading && results.length === 0 ? <li className="px-5 py-3 text-sm text-ff-text-muted">No meetings match “{needle}”.</li> : null}
          </ul>
        ) : null}

        <div className="p-3">
          <Link
            href="/ask"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg bg-ff-promo-bg px-4 py-3 text-sm hover:opacity-90"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3.6" y="5.2" width="8.8" height="7" rx="2" />
              <path d="M8 5.2V3" />
              <circle cx="8" cy="2.4" r="0.7" fill="#a78bfa" stroke="none" />
              <circle cx="6.3" cy="8.2" r="0.5" fill="#a78bfa" stroke="none" />
              <circle cx="9.7" cy="8.2" r="0.5" fill="#a78bfa" stroke="none" />
            </svg>
            <span className="flex-1 text-ff-text-secondary">Ask Fred anything about your meetings</span>
            <span className="font-medium text-ff-link">Try AskFred</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
