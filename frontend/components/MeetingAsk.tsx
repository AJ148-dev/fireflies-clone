"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";

type MeetingQuestion = { id: number; question: string; answer: string; provider: string; created_at: string };

const SUGGESTIONS = ["What were the main points?", "What decisions were made?", "What are the next steps?"];
const STAMP = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;

function toSeconds(stamp: string) {
  return stamp.split(":").reduce((total, part) => total * 60 + Number(part), 0);
}

function Answer({ text, onSeek }: { text: string; onSeek: (seconds: number) => void }) {
  const parts = text.split(STAMP);
  return (
    <p className="whitespace-pre-wrap text-[13px] leading-6 text-ff-text">
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <button
            key={index}
            type="button"
            onClick={() => onSeek(toSeconds(part))}
            className="rounded px-0.5 font-medium text-ff-link hover-ff"
          >
            {part}
          </button>
        ) : (
          part
        ),
      )}
    </p>
  );
}

export function MeetingAsk({
  meetingId,
  onSeek,
  onError,
}: {
  meetingId: number;
  onSeek: (seconds: number) => void;
  onError: (message: string) => void;
}) {
  const [items, setItems] = useState<MeetingQuestion[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<MeetingQuestion[]>(`/meetings/${meetingId}/questions`)
      .then(setItems)
      .catch(() => setLoadFailed(true));
  }, [meetingId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [items, pending]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || pending) return;
    setPending(text);
    setDraft("");
    try {
      const item = await api<MeetingQuestion>(`/meetings/${meetingId}/questions`, {
        method: "POST",
        body: JSON.stringify({ question: text }),
      });
      setItems((current) => [...current, item]);
    } catch (error) {
      setDraft(text);
      onError(error instanceof Error ? error.message : "Could not get an answer");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {loadFailed ? <p className="text-[12px] text-[#f87171]">Could not load past questions.</p> : null}
        {items.length === 0 && !pending ? (
          <div>
            <p className="text-sm text-ff-text-secondary">Ask anything about this meeting. Answers come only from its transcript.</p>
            <div className="mt-3 flex flex-col items-start gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => ask(suggestion)}
                  className="rounded-full border border-ff-strong px-3 py-1.5 text-[12px] text-ff-text-secondary hover-ff"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {items.map((item) => (
          <div key={item.id} className="space-y-2">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl bg-ff-active px-3 py-2 text-[13px] text-ff-text">{item.question}</p>
            <Answer text={item.answer} onSeek={onSeek} />
            <p className="text-[11px] text-ff-text-faint">Answered by {item.provider === "groq" ? "Groq" : "Gemini"}</p>
          </div>
        ))}
        {pending ? (
          <div className="space-y-2">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl bg-ff-active px-3 py-2 text-[13px] text-ff-text">{pending}</p>
            <p className="text-[13px] text-ff-text-muted" role="status">Reading the transcript…</p>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
      <form
        className="flex shrink-0 gap-2 border-t border-ff px-3 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          ask(draft);
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={1000}
          placeholder="Ask about this meeting"
          aria-label="Ask about this meeting"
          className="min-w-0 flex-1 rounded-md border border-ff-strong bg-ff-elevated px-2.5 py-1.5 text-[13px] text-ff-text outline-none focus:border-[#6d4aff]"
        />
        <button
          type="submit"
          disabled={!draft.trim() || Boolean(pending)}
          className="shrink-0 rounded-md bg-[#6d4aff] px-3 py-1.5 text-[13px] font-medium text-on-accent disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
