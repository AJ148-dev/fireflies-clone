import { Suspense } from "react";

import { MeetingsScreen } from "@/components/MeetingsScreen";

export default function MeetingsPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-[#a1a1aa]">Loading meetings…</p>}>
      <MeetingsScreen />
    </Suspense>
  );
}
