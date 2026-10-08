"use client";

import { useState } from "react";

export function ParticipantField({
  names,
  onChange,
}: {
  names: string[];
  onChange: (names: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addName() {
    const value = draft.trim();
    if (!value) return;
    if (names.some((name) => name.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...names, value]);
    setDraft("");
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-ff-text-muted">Participants</label>
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-ff-strong bg-ff-elevated px-3 py-2">
        {names.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(names.filter((item) => item !== name))}
            className="rounded-full bg-ff-chip px-2.5 py-1 text-xs font-medium text-ff-text-secondary hover:bg-ff-chip-hover"
            title="Remove"
          >
            {name} ×
          </button>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addName();
            }
          }}
          onBlur={addName}
          placeholder="Add a name"
          className="min-w-[120px] flex-1 bg-transparent text-sm text-ff-text outline-none placeholder:text-ff-text-faint"
        />
      </div>
    </div>
  );
}
