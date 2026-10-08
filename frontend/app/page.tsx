import { Suspense } from "react";

import { HomeDashboard } from "@/components/HomeDashboard";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-[#a1a1aa]">Loading…</p>}>
      <HomeDashboard />
    </Suspense>
  );
}
