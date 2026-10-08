import { Suspense } from "react";

import { TasksScreen } from "@/components/TasksScreen";

export default function TasksPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-[#a1a1aa]">Loading tasks…</p>}>
      <TasksScreen />
    </Suspense>
  );
}
