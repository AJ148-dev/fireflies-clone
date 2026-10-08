"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CreateMeetingModal } from "@/components/CreateMeetingModal";
import { MeetingList } from "@/components/MeetingList";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api";
import type { MeetingCard, MeetingDetail } from "@/lib/types";

const INTRO_VIDEO_ID = "uZuFXgNfZmI";

export function HomeDashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const q = params.get("q") ?? "";
  const [tab, setTab] = useState<"recent" | "upcoming" | "feed">("recent");
  const [meetings, setMeetings] = useState<MeetingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [name, setName] = useState("Maya Chen");
  const [playingIntro, setPlayingIntro] = useState(false);

  useEffect(() => {
    api<{ name: string }>("/me")
      .then((user) => setName(user.name))
      .catch(() => setName("Maya Chen"));
  }, []);

  useEffect(() => {
    if (params.get("upload") === "1") setCreating(true);
  }, [params]);

  useEffect(() => {
    if (!playingIntro) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPlayingIntro(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playingIntro]);

  useEffect(() => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    query.set("sort", "recent");
    setLoading(true);
    api<MeetingCard[]>(`/meetings?${query.toString()}`)
      .then(setMeetings)
      .catch((err: Error) => toast(err.message, "err"))
      .finally(() => setLoading(false));
  }, [q, toast, reloadKey]);

  function closeCreate() {
    setCreating(false);
    if (params.get("upload") === "1") router.replace("/");
  }

  return (
    <div className="h-full overflow-y-auto bg-ff-bg px-6 py-6 text-ff-text">
      <section className="home-hero mx-auto flex max-w-3xl items-center justify-between gap-8 rounded-2xl px-8 py-8">
        <div>
          <h1 className="text-2xl font-semibold">Welcome Aboard, {name}!</h1>
          <p className="home-hero-sub mt-2 max-w-md text-sm leading-6">
            Fireflies is now ready to automate your meetings and streamline your workflows.
          </p>
        </div>
        <div className="home-hero-video relative hidden h-36 w-56 shrink-0 overflow-hidden rounded-xl border sm:block">
          <button
            type="button"
            onClick={() => setPlayingIntro(true)}
            aria-label="Play intro video"
            className="group absolute inset-0 grid place-items-center"
          >
            <img src={`https://i.ytimg.com/vi/${INTRO_VIDEO_ID}/hqdefault.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="home-hero-play relative grid h-10 w-10 place-items-center rounded-full shadow-md transition-transform group-hover:scale-110">▶</span>
          </button>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-3xl">
        <h2 className="text-base font-semibold">Quick Start</h2>
        <p className="mt-1 text-sm text-ff-text-muted">Capture your first meeting or upload a recording to see Fireflies in action.</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <button type="button" onClick={() => toast("Scheduling a live meeting is coming soon")} className="qs-schedule flex items-center justify-between rounded-xl px-4 py-4 text-sm font-medium">
            Schedule Meeting <span>›</span>
          </button>
          <button type="button" onClick={() => setCreating(true)} className="qs-upload flex items-center justify-between rounded-xl px-4 py-4 text-sm font-medium">
            Upload File <span>›</span>
          </button>
          <button type="button" onClick={() => toast("Live capture is coming soon")} className="qs-capture flex items-center justify-between rounded-xl px-4 py-4 text-sm font-medium">
            Capture Meeting <span>›</span>
          </button>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-3xl">
        <div className="flex items-center gap-2">
          {(["recent", "upcoming", "feed"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                tab === item ? "bg-ff-tab-active-bg text-ff-tab-active-text" : "text-ff-text-muted"
              }`}
            >
              {item === "feed" ? "AI Feed" : item}
            </button>
          ))}
        </div>
        <div className="mt-4">
          {tab === "recent" ? (
            loading ? (
              <p className="text-sm text-ff-text-muted">Loading meetings…</p>
            ) : (
              <MeetingList meetings={meetings} filtered={Boolean(q)} onClear={() => router.replace("/")} onChanged={() => setReloadKey((key) => key + 1)} />
            )
          ) : (
            <p className="py-8 text-sm text-ff-text-muted">
              {tab === "upcoming" ? "No upcoming meetings. A live bot is out of scope for this build." : "AI Feed is coming soon."}
            </p>
          )}
        </div>
        <h2 className="mt-10 text-base font-semibold">Try More</h2>
        <p className="mt-2 text-sm text-ff-text-muted">AskFred, analytics, and voice agents are placeholders in this workspace.</p>
      </section>

      {creating ? (
        <CreateMeetingModal
          onClose={closeCreate}
          onCreated={(meeting: MeetingDetail) => {
            if (meeting.notes_status === "generated") toast("Summary generated from the transcript");
            else if (meeting.notes_status === "failed") toast("Meeting saved. The summary could not be generated.", "err");
            else toast("Meeting created");
            router.push(`/meetings/${meeting.id}`);
          }}
        />
      ) : null}
      {playingIntro ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Fireflies intro video"
          onClick={() => setPlayingIntro(false)}
          className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4"
        >
          <div onClick={(event) => event.stopPropagation()} className="relative w-full max-w-4xl">
            <button
              type="button"
              onClick={() => setPlayingIntro(false)}
              aria-label="Close video"
              className="absolute -top-10 right-0 grid h-8 w-8 place-items-center rounded-full bg-white/15 text-lg text-white hover:bg-white/25"
            >
              ×
            </button>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${INTRO_VIDEO_ID}?autoplay=1&start=1&rel=0`}
                title="Fireflies intro video"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
