"use client";

import { useToast } from "@/components/Toast";

export default function UpgradePage() {
  const toast = useToast();
  return (
    <div className="grid h-full place-items-center bg-[#121214] px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-semibold text-[#86efac]">40% OFF</p>
        <h1 className="mt-3 text-2xl font-semibold">Upgrade to Business</h1>
        <p className="mt-2 text-sm text-[#a1a1aa]">Unlock analytics, voice agents, and unlimited meeting capture.</p>
        <button type="button" onClick={() => toast("Checkout is coming soon")} className="mt-6 rounded-lg bg-[#6d4aff] px-5 py-2 text-sm font-medium">
          Upgrade now
        </button>
      </div>
    </div>
  );
}
