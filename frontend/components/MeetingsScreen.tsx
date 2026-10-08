"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MeetingList } from "@/components/MeetingList";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api";
import type { MeetingCard } from "@/lib/types";

const CHANNELS = [
  { id: "mine", label: "My Meetings" },
  { id: "all", label: "All Meetings" },
  { id: "voice", label: "Voice Agent Meetings" },
  { id: "uploads", label: "Uploads" },
];

export function MeetingsScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const q = params.get("q") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const sort = params.get("sort") === "oldest" ? "oldest" : "recent";
  const queryRef = useRef(params.toString());
  const [channel, setChannel] = useState("mine");
  const [channelQuery, setChannelQuery] = useState("");
  const [meetings, setMeetings] = useState<MeetingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [firstName, setFirstName] = useState("Maya");
  const [ask, setAsk] = useState("");

  useEffect(() => {
    api<{ name: string }>("/me")
      .then((user) => setFirstName(user.name.split(" ")[0] || user.name))
      .catch(() => setFirstName("Maya"));
  }, []);

  useEffect(() => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    query.set("sort", sort);
    setLoading(true);
    api<MeetingCard[]>(`/meetings?${query.toString()}`)
      .then(setMeetings)
      .catch((err: Error) => toast(err.message, "err"))
      .finally(() => setLoading(false));
  }, [q, from, to, sort, toast, reloadKey]);

  function update(next: Record<string, string>) {
    const query = new URLSearchParams(queryRef.current);
    for (const [key, value] of Object.entries(next)) {
      if (value) query.set(key, value);
      else query.delete(key);
    }
    const text = query.toString();
    queryRef.current = text;
    router.replace(text ? `/meetings?${text}` : "/meetings");
  }

  useEffect(() => {
    queryRef.current = params.toString();
  }, [params]);

  const visibleChannels = CHANNELS.filter((item) => item.label.toLowerCase().includes(channelQuery.trim().toLowerCase()));

  return (
    <div className="flex h-full min-h-0 bg-ff-bg text-ff-text">
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-ff bg-ff-sidebar px-3 py-3 lg:flex">
        <input
          value={channelQuery}
          onChange={(event) => setChannelQuery(event.target.value)}
          placeholder="Search channels"
          className="rounded-lg border border-ff-strong bg-ff-elevated px-3 py-1.5 text-[13px] text-ff-text outline-none placeholder:text-ff-text-faint"
        />
        <div className="mt-3 flex flex-col gap-0.5">
          {visibleChannels.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === "voice" || item.id === "uploads") {
                  toast(`${item.label} are coming soon`);
                  return;
                }
                setChannel(item.id);
              }}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] ${channel === item.id ? "bg-ff-channel-active font-medium text-ff-channel-active-text" : "text-ff-text-secondary hover-ff"}`}
            >
              <ChannelMark id={item.id} active={channel === item.id} />
              {item.label}
              {item.id === "uploads" ? <span className="ml-auto rounded bg-ff-deal-bg px-1 py-0.5 text-[9px] font-semibold text-ff-deal-text">NEW</span> : null}
            </button>
          ))}
        </div>
        <div className="mt-4 border-t border-ff-strong pt-4">
          <p className="px-2 text-[13px] text-ff-text-muted">All channels</p>
          <p className="mt-4 text-center text-lg text-[#e879f9]">#</p>
          <p className="mt-3 px-2 text-center text-[13px] leading-5 text-ff-text-muted">Create channels to organize your conversations</p>
          <button type="button" onClick={() => toast("Channels are coming soon")} className="mx-auto mt-3 block rounded-lg border border-ff-strong px-4 py-1.5 text-[13px] text-ff-text-secondary">
            + Channel
          </button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-ff bg-ff-bg px-4 py-2.5">
          <button type="button" className="rounded-lg bg-ff-tab-active-bg px-3 py-1 text-[13px] text-ff-tab-active-text">
            Hosted by me
          </button>
          <button type="button" onClick={() => toast("Shared meetings are coming soon")} className="rounded-lg px-3 py-1 text-[13px] text-ff-text-muted">
            Shared with me
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-ff bg-ff-bg px-4 py-2">
          <input
            aria-label="Search meetings"
            value={q}
            placeholder="Search by title or participant"
            onChange={(event) => update({ q: event.target.value })}
            className="min-w-[12rem] flex-1 rounded-lg border border-ff-strong bg-ff-elevated px-2 py-1 text-[13px] text-ff-text outline-none placeholder:text-ff-text-faint"
          />
          <input type="date" value={from} aria-label="From date" suppressHydrationWarning onChange={(event) => update({ from: event.target.value })} className="rounded-lg border border-ff-strong bg-ff-elevated px-2 py-1 text-[13px] text-ff-text" />
          <input type="date" value={to} aria-label="To date" suppressHydrationWarning onChange={(event) => update({ to: event.target.value })} className="rounded-lg border border-ff-strong bg-ff-elevated px-2 py-1 text-[13px] text-ff-text" />
          <select value={sort} aria-label="Sort" onChange={(event) => update({ sort: event.target.value })} className="rounded-lg border border-ff-strong bg-ff-elevated px-2 py-1 text-[13px] text-ff-text">
            <option value="recent">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="px-6 py-8 text-sm text-ff-text-muted">Loading meetings…</p>
          ) : (
            <MeetingList
              meetings={meetings}
              filtered={Boolean(q || from || to)}
              onClear={() => router.replace("/meetings")}
              onChanged={() => setReloadKey((key) => key + 1)}
            />
          )}
        </div>
      </section>

      <aside className="hidden w-[300px] shrink-0 flex-col border-l border-ff bg-ff-sidebar lg:flex">
        <div className="flex items-center gap-2 border-b border-ff px-3 py-2.5 text-[13px] font-medium">
          <span className="text-ff-link">✦</span> Ask Fred
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="rounded-xl bg-ff-ask-card p-3 text-ff-text">
            <p className="text-[13px] leading-5">Connect Slack and Gmail — get answers with full context.</p>
            <button type="button" onClick={() => toast("Connectors are coming soon")} className="mt-2 text-[13px] font-medium text-ff-link">
              Connect
            </button>
          </div>
          <p className="mt-5 text-sm font-semibold">Hi {firstName}!</p>
          <p className="text-sm font-semibold">Get ready for your meeting</p>
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" onClick={() => router.push("/tasks")} className="rounded-lg border border-ff-strong px-3 py-2 text-left text-[13px] text-ff-text">
              My action items
            </button>
            <button type="button" onClick={() => toast("Key decisions live on each meeting summary")} className="rounded-lg border border-ff-strong px-3 py-2 text-left text-[13px] text-ff-text-secondary">
              Key decisions
            </button>
            <button type="button" onClick={() => toast("Key initiatives live on each meeting summary")} className="rounded-lg border border-ff-strong px-3 py-2 text-left text-[13px] text-ff-text-secondary">
              Key initiatives
            </button>
          </div>
        </div>
        <form
          className="m-3 rounded-xl border border-ff-strong bg-ff-elevated p-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!ask.trim()) return;
            setAsk("");
            toast("Ask Fred answers from a meeting summary in this build");
          }}
        >
          <p className="px-1 text-[11px] text-ff-link"># My Meetings</p>
          <input
            value={ask}
            onChange={(event) => setAsk(event.target.value)}
            placeholder="Ask anything. Type / to run AI skills."
            className="w-full bg-transparent px-1 py-1.5 text-[13px] text-ff-text outline-none placeholder:text-ff-text-faint"
          />
          <div className="flex justify-end">
            <button type="submit" className="grid h-7 w-7 place-items-center rounded-md bg-[#6d4aff] text-sm text-on-accent">↑</button>
          </div>
        </form>
      </aside>

    </div>
  );
}

function ChannelMark({ id, active }: { id: string; active: boolean }) {
  const props = {
    width: 14,
    height: 14,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    className: active ? "text-[#e9d5ff]" : "text-[#a1a1aa]",
  };
  if (id === "mine") return <span className={`w-3.5 text-center text-[13px] ${active ? "text-[#e9d5ff]" : "text-[#c4b5fd]"}`}>#</span>;
  if (id === "all") {
    return (
      <svg {...props}>
        <rect x="5.2" y="5.2" width="8" height="8" rx="1.2" />
        <path d="M3.2 10.8V3.6A1.2 1.2 0 0 1 4.4 2.4h7.2" />
      </svg>
    );
  }
  if (id === "voice") {
    return (
      <svg {...props}>
        <rect x="2.2" y="5.2" width="8.2" height="8" rx="1.2" />
        <path d="M8.2 2.4h5.2v5.2" />
        <path d="M13.2 2.6 7.4 8.4" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M8 11.2V3.2" />
      <path d="M5.2 5.6 8 2.8l2.8 2.8" />
      <path d="M3 13.2h10" />
    </svg>
  );
}
