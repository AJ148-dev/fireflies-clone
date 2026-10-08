"use client";

import { useEffect, useState } from "react";

import { useToast } from "@/components/Toast";
import { api } from "@/lib/api";

const PROMPTS = [
  "List action items & todos for this week",
  "Summarize my last meeting",
  "Prepare me for the upcoming meeting",
  "Connect Gmail, Notion, and 30+ sources for richer insights.",
  "Prepare weekly digest, based on my meetings",
];

export function AskFred() {
  const toast = useToast();
  const [name, setName] = useState("Maya");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    api<{ name: string }>("/me")
      .then((user) => setName(user.name.split(" ")[0] ?? user.name))
      .catch(() => setName("Maya"));
  }, []);

  function ask(text: string) {
    if (!text.trim()) return;
    toast("AskFred needs a live model. Open a meeting to read its summary.", "ok");
  }

  return (
    <div className="flex h-full bg-ff-bg text-ff-text">
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-ff bg-ff-sidebar px-3 py-4 sm:flex">
        <button type="button" onClick={() => toast("Saved chats are coming soon")} className="rounded-lg px-3 py-2 text-left text-sm hover-ff">
          + New Chat
        </button>
        <button type="button" onClick={() => toast("Search across chats is coming soon")} className="rounded-lg px-3 py-2 text-left text-sm text-ff-text-secondary hover-ff">
          Search
        </button>
        <button type="button" onClick={() => toast("Connectors are coming soon")} className="rounded-lg px-3 py-2 text-left text-sm text-ff-text-secondary hover-ff">
          Connectors
        </button>
        <p className="mt-8 px-3 text-sm text-ff-text-muted">No chats yet</p>
        <p className="px-3 text-xs leading-5 text-ff-text-faint">Your chats will appear here once you start one.</p>
      </aside>
      <div className="mx-auto flex w-full max-w-2xl flex-col px-6 py-16">
        <h1 className="text-center text-2xl font-semibold">Hi {name}, how can I help today?</h1>
        <form
          className="mt-8 rounded-2xl border border-ff-ask bg-ff-ask-panel p-3 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            ask(draft);
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask anything, @ for context and / for skills"
            className="w-full bg-transparent px-2 py-2 text-sm text-ff-text outline-none placeholder:text-ff-text-faint"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <span className="text-xs text-ff-text-muted">Notes only</span>
            <button type="submit" className="grid h-8 w-8 place-items-center rounded-lg bg-[#6d4aff] text-sm text-on-accent">
              ↑
            </button>
          </div>
        </form>
        <div className="mt-6 flex flex-col gap-2">
          {PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => ask(prompt)}
              className="rounded-xl border border-ff-strong bg-ff-elevated px-4 py-3 text-left text-sm text-ff-text-secondary hover-ff"
            >
              {prompt}
            </button>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-ff-text-faint">Consumes AI credits</p>
      </div>
    </div>
  );
}
