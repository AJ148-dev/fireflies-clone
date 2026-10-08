"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import { fromDateTimeInput, toLocalInput } from "@/lib/formatTime";
import type { MeetingCard, MeetingDetail } from "@/lib/types";
import { ParticipantField } from "@/components/ParticipantField";

const HINT =
  "txt: [mm:ss] Name: text · vtt: WEBVTT cues, optional Name: prefix · json: [{\"speaker\",\"start\",\"text\"}]";

export function CreateMeetingModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (meeting: MeetingDetail) => void;
}) {
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState(toLocalInput(new Date().toISOString()));
  const [names, setNames] = useState<string[]>([]);
  const [mode, setMode] = useState<"blank" | "paste" | "upload">("paste");
  const [format, setFormat] = useState<"txt" | "vtt" | "json">("txt");
  const [transcript, setTranscript] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (mode === "upload") {
        if (!file) throw new Error("Choose a .txt, .vtt, or .json file");
        const body = new FormData();
        body.set("file", file);
        body.set("title", title.trim());
        body.set("started_at", fromDateTimeInput(when));
        body.set("participant_names", names.join(", "));
        onCreated(await api<MeetingDetail>("/meetings/import", { method: "POST", body }));
        return;
      }
      onCreated(
        await api<MeetingDetail>("/meetings", {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            started_at: fromDateTimeInput(when),
            participant_names: names,
            transcript_format: mode === "paste" ? format : null,
            transcript_text: mode === "paste" ? transcript : null,
          }),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the meeting");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add meeting" onClose={() => {
      if (!saving) onClose();
    }}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Title">
          <input required value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
        </Field>
        <Field label="Date">
          <input required type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} className={inputClass} />
        </Field>
        <ParticipantField names={names} onChange={setNames} />
        <div className="flex gap-2">
          {(["paste", "upload", "blank"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                mode === option ? "bg-[#6c4dff] text-white" : "bg-[#2a2a2e] text-[#d4d4d8] hover:bg-[#34343a]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        {mode === "paste" ? (
          <>
            <Field label="Format">
              <select value={format} onChange={(event) => setFormat(event.target.value as typeof format)} className={inputClass}>
                <option value="txt">txt</option>
                <option value="vtt">vtt</option>
                <option value="json">json</option>
              </select>
            </Field>
            <Field label="Transcript">
              <textarea required value={transcript} onChange={(event) => setTranscript(event.target.value)} rows={6} className={inputClass} />
            </Field>
            <p className="text-xs text-[#a1a1aa]">{HINT}</p>
          </>
        ) : null}
        {mode === "upload" ? (
          <>
            <Field label="Transcript file">
              <input
                required
                type="file"
                accept=".txt,.vtt,.json,text/plain"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </Field>
            <p className="text-xs text-[#a1a1aa]">{HINT}</p>
          </>
        ) : null}
        {error ? <p className="text-sm text-[#f87171]">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" disabled={saving} onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-[#d4d4d8] hover:bg-white/5 disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#6c4dff] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {saving ? "Saving…" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function EditMeetingModal({
  meeting,
  onClose,
  onSaved,
}: {
  meeting: MeetingCard;
  onClose: () => void;
  onSaved: (meeting: MeetingDetail) => void;
}) {
  const [title, setTitle] = useState(meeting.title);
  const [names, setNames] = useState(meeting.participants.map((person) => person.name));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      onSaved(
        await api<MeetingDetail>(`/meetings/${meeting.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: title.trim(),
            participant_names: names,
          }),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit meeting" onClose={() => {
      if (!saving) onClose();
    }}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Title">
          <input required value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
        </Field>
        <ParticipantField names={names} onChange={setNames} />
        {error ? <p className="text-sm text-[#f87171]">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" disabled={saving} onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-[#d4d4d8] hover:bg-white/5 disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#6c4dff] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DeleteMeetingDialog({
  title,
  onClose,
  onConfirm,
}: {
  title: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal title="Delete meeting" onClose={() => {
      if (!saving) onClose();
    }}>
      <p className="text-sm text-[#d4d4d8]">
        Delete “{title}” and its transcript, summary, topics, and action items?
      </p>
      {error ? <p className="mt-3 text-sm text-[#f87171]">{error}</p> : null}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" disabled={saving} onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-[#d4d4d8] hover:bg-white/5 disabled:opacity-60">
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            setError("");
            try {
              await onConfirm();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not delete the meeting");
              setSaving(false);
            }
          }}
          className="rounded-lg bg-[#b42318] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cardRef.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#1c1c20] p-5 text-[#f4f4f5] shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-base font-semibold">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-md text-lg leading-none text-[#a1a1aa] hover:bg-white/5 hover:text-white">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#121214] px-3 py-2 text-sm outline-none focus:border-[#6d4aff]";
