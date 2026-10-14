import { Suspense } from "react";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { LearningHabitsWorkspace } from "@/components/study/LearningHabitsWorkspace";

export const dynamic = "force-dynamic";

export default function LearningHabitsPage() {
  return (
    <>
      <HubBackBar title="Learning & Habits" />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<p className="text-sm text-stone-500">Loading workspace…</p>}>
          <LearningHabitsWorkspace />
        </Suspense>
      </div>
    </>
  );
}
