import { Suspense } from "react";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { getOrCreateDefaultUser } from "@/lib/user";

import { MixedReviewView } from "./mixed-review-view";

export const dynamic = "force-dynamic";

export default async function MixedReviewPage() {
  const user = await getOrCreateDefaultUser();
  await backfillUserCourseTopicsIfEmpty(user.id);

  return (
    <>
      <HubBackBar title="Mixed Review" planningActive="study" />
      <Suspense fallback={<div className="px-6 py-10 text-sm text-stone-500">Loading review…</div>}>
        <MixedReviewView />
      </Suspense>
    </>
  );
}
