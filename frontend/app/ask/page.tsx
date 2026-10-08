import { Suspense } from "react";

import { AskFred } from "@/components/AskFred";

export default function AskPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-[#a1a1aa]">Loading…</p>}>
      <AskFred />
    </Suspense>
  );
}
