import { Suspense } from "react";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { getOrCreateDefaultUser } from "@/lib/user";

import { SearchView } from "./search-view";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const user = await getOrCreateDefaultUser();
  await backfillUserCourseTopicsIfEmpty(user.id);

  return (
    <div className="min-h-screen bg-[#fff8f1] text-stone-900">
      <HubBackBar title="Search" />
      <Suspense fallback={<div className="px-6 py-12 text-stone-500">Loading search…</div>}>
        <SearchView />
      </Suspense>
    </div>
  );
}
