"use client";

import Link from "next/link";

const ROWS = ["Acme discovery", "Q4 roadmap", "Sprint retro", "Design critique", "Pipeline review", "Customer sync"];

export default function AnalyticsPage() {

  return (
    <div className="relative h-full overflow-hidden bg-[#121214]">
      <div className="pointer-events-none select-none p-8 blur-[6px]" aria-hidden="true">
        <div className="grid gap-4 md:grid-cols-3">
          {["Talk time", "Questions", "Sentiment"].map((label) => (
            <div key={label} className="h-28 rounded-xl border border-white/10 bg-[#1c1c20] p-4">
              <p className="text-xs text-[#a1a1aa]">{label}</p>
              <div className="mt-4 h-2 w-2/3 rounded bg-[#3b2f66]" />
            </div>
          ))}
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          {ROWS.map((row) => (
            <div key={row} className="flex items-center gap-4 border-b border-white/5 px-4 py-3">
              <span className="w-40 text-sm">{row}</span>
              <span className="h-2 flex-1 rounded bg-[#243056]" />
              <span className="h-2 w-16 rounded bg-[#2a2150]" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 grid place-items-center bg-black/40 p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1e] px-8 py-10 text-center shadow-2xl">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#3a2a10] text-xl text-[#f5c14a]">★</span>
          <h1 className="mt-5 text-2xl font-semibold leading-snug">Unlock Deal Intelligence & Team Analytics</h1>
          <p className="mt-3 text-sm text-[#a1a1aa]">Upgrade to business plan or above to access it.</p>
          <Link href="/upgrade" className="mt-6 inline-block rounded-lg bg-[#6d4aff] px-5 py-2 text-sm font-medium">
            Upgrade now
          </Link>
        </div>
      </div>
    </div>
  );
}
