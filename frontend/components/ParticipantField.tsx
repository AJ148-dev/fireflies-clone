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
      <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">Participants</label>
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#121214] px-3 py-2">
        {names.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(names.filter((item) => item !== name))}
            className="rounded-full bg-[#2a2a2e] px-2.5 py-1 text-xs font-medium text-[#e4e4e7] hover:bg-[#34343a]"
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
          className="min-w-[120px] flex-1 bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}
