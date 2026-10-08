"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CreateMeetingModal } from "@/components/CreateMeetingModal";
import { MeetingList } from "@/components/MeetingList";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api";
import type { MeetingCard, MeetingDetail } from "@/lib/types";

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
  const scope = params.get("scope") === "shared" ? "shared" : "hosted";
  const [channel, setChannel] = useState("mine");
  const [channelQuery, setChannelQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(Boolean(from || to));
  const [meetings, setMeetings] = useState<MeetingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
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
    const query = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) query.set(key, value);
      else query.delete(key);
    }
    const text = query.toString();
    router.replace(text ? `/meetings?${text}` : "/meetings");
  }

  const visibleChannels = CHANNELS.filter((item) => item.label.toLowerCase().includes(channelQuery.trim().toLowerCase()));
  const showList = (channel === "mine" || channel === "all") && scope === "hosted";

  return (
    <div className="flex h-full min-h-0 bg-[#121214]">
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-white/5 px-3 py-3 lg:flex">
        <input
          value={channelQuery}
          onChange={(event) => setChannelQuery(event.target.value)}
          placeholder="Search channels"
          className="rounded-lg border border-white/10 bg-[#1c1c20] px-3 py-1.5 text-[13px] outline-none placeholder:text-[#71717a]"
        />
        <div className="mt-3 flex flex-col gap-0.5">
          {visibleChannels.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setChannel(item.id)}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] ${channel === item.id ? "bg-[#3a246b] font-medium" : "text-[#d4d4d8] hover:bg-white/5"}`}
            >
              <span className="text-[#a78bfa]">#</span>
              {item.label}
              {item.id === "uploads" ? <span className="ml-auto rounded bg-[#14532d] px-1 py-0.5 text-[9px] font-semibold text-[#86efac]">NEW</span> : null}
            </button>
          ))}
        </div>
        <p className="mt-6 px-2 text-[11px] font-medium uppercase tracking-wide text-[#71717a]">All channels</p>
        <p className="mt-3 px-2 text-[13px] leading-5 text-[#a1a1aa]">Create channels to organize your conversations</p>
        <button type="button" onClick={() => toast("Channels are coming soon")} className="mx-2 mt-3 rounded-lg border border-white/10 py-1.5 text-[13px] text-[#d4d4d8]">
          + Channel
        </button>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
          <button type="button" onClick={() => update({ scope: "" })} className={`rounded-lg px-3 py-1 text-[13px] ${scope === "hosted" ? "bg-[#2a2a2e]" : "text-[#a1a1aa]"}`}>
            Hosted by me
          </button>
          <button type="button" onClick={() => update({ scope: "shared" })} className={`rounded-lg px-3 py-1 text-[13px] ${scope === "shared" ? "bg-[#2a2a2e]" : "text-[#a1a1aa]"}`}>
            Shared with me
          </button>
          <button type="button" onClick={() => setFiltersOpen((open) => !open)} className="rounded-lg border border-white/10 px-3 py-1 text-[13px] text-[#d4d4d8]">
            Filters
          </button>
          <button
            type="button"
            aria-label="Search meetings"
            onClick={() => document.querySelector<HTMLInputElement>('[aria-label="Search by title or keyword"]')?.focus()}
            className="ml-auto text-[#a1a1aa]"
          >
            ⌕
          </button>
        </div>
        {filtersOpen ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-4 py-2">
            <input type="date" value={from} aria-label="From date" suppressHydrationWarning onChange={(event) => update({ from: event.target.value })} className="rounded-lg border border-white/10 bg-[#1c1c20] px-2 py-1 text-[13px]" />
            <input type="date" value={to} aria-label="To date" suppressHydrationWarning onChange={(event) => update({ to: event.target.value })} className="rounded-lg border border-white/10 bg-[#1c1c20] px-2 py-1 text-[13px]" />
            <select value={sort} aria-label="Sort" onChange={(event) => update({ sort: event.target.value })} className="rounded-lg border border-white/10 bg-[#1c1c20] px-2 py-1 text-[13px]">
              <option value="recent">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="px-6 py-8 text-sm text-[#a1a1aa]">Loading meetings…</p>
          ) : showList ? (
            <MeetingList
              meetings={meetings}
              filtered={Boolean(q || from || to)}
              onClear={() => router.replace("/meetings")}
              onChanged={() => setReloadKey((key) => key + 1)}
            />
          ) : (
            <EmptyNotebook onCapture={() => setCreating(true)} />
          )}
        </div>
      </section>

      <aside className="hidden w-[300px] shrink-0 flex-col border-l border-white/5 lg:flex">
        <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2.5 text-[13px] font-medium">
          <span className="text-[#c4b5fd]">✦</span> Ask Fred
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="rounded-xl bg-[#2a1d55] p-3">
            <p className="text-[13px] leading-5">Connect Slack and Gmail — get answers with full context.</p>
            <button type="button" onClick={() => toast("Connectors are coming soon")} className="mt-2 text-[13px] font-medium text-[#c4b5fd]">
              Connect
            </button>
          </div>
          <p className="mt-5 text-sm font-semibold">Hi {firstName}!</p>
          <p className="text-sm font-semibold">Get ready for your meeting</p>
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" onClick={() => router.push("/tasks")} className="rounded-lg border border-white/10 px-3 py-2 text-left text-[13px]">
              My action items
            </button>
            <button type="button" onClick={() => toast("Key decisions live on each meeting summary")} className="rounded-lg border border-white/10 px-3 py-2 text-left text-[13px] text-[#d4d4d8]">
              Key decisions
            </button>
            <button type="button" onClick={() => toast("Key initiatives live on each meeting summary")} className="rounded-lg border border-white/10 px-3 py-2 text-left text-[13px] text-[#d4d4d8]">
              Key initiatives
            </button>
          </div>
        </div>
        <form
          className="m-3 rounded-xl border border-white/10 p-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!ask.trim()) return;
            setAsk("");
            toast("Ask Fred answers from a meeting summary in this build");
          }}
        >
          <p className="px-1 text-[11px] text-[#a78bfa]"># My Meetings</p>
          <input
            value={ask}
            onChange={(event) => setAsk(event.target.value)}
            placeholder="Ask anything. Type / to run AI skills."
            className="w-full bg-transparent px-1 py-1.5 text-[13px] outline-none placeholder:text-[#71717a]"
          />
          <div className="flex justify-end">
            <button type="submit" className="grid h-7 w-7 place-items-center rounded-md bg-[#6d4aff] text-sm">↑</button>
          </div>
        </form>
      </aside>

      {creating ? (
        <CreateMeetingModal
          onClose={() => setCreating(false)}
          onCreated={(meeting: MeetingDetail) => {
            toast("Meeting created");
            router.push(`/meetings/${meeting.id}`);
          }}
        />
      ) : null}
    </div>
  );
}

function EmptyNotebook({ onCapture }: { onCapture: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium">Looks like you haven&apos;t recorded a meeting yet</p>
      <p className="mt-2 max-w-xs text-[13px] leading-5 text-[#a1a1aa]">Once you record your first meeting with Fireflies, it&apos;ll show up right here.</p>
      <button type="button" onClick={onCapture} className="mt-5 rounded-lg bg-[#6d4aff] px-4 py-2 text-sm font-medium">
        + Capture
      </button>
    </div>
  );
}
