"use client";

import { useEffect, useRef, useState } from "react";

import type { ExportFormat, ExportKind } from "@/lib/exportMeeting";

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: "txt", label: "TXT" },
  { id: "md", label: "Markdown" },
  { id: "pdf", label: "PDF" },
];

export function ExportMenu({
  kind,
  onExport,
}: {
  kind: ExportKind;
  onExport: (format: ExportFormat) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const title = kind === "summary" ? "summary" : "transcript";

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Export ${title}`}
        onClick={() => setOpen((current) => !current)}
        className="rounded-md border border-ff-strong px-2.5 py-1 text-[12px] font-medium text-ff-text-secondary hover-ff"
      >
        Export
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-36 rounded-xl border border-ff-strong bg-ff-panel py-1 text-sm shadow-lg">
          {FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              role="menuitem"
              className="block w-full px-3 py-1.5 text-left text-ff-text-secondary hover-ff"
              onClick={() => {
                setOpen(false);
                onExport(format.id);
              }}
            >
              {format.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
