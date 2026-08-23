import Link from "next/link";
import { Suspense } from "react";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { CoreNotesWorkspace } from "@/components/core/CoreNotesWorkspace";
import { CustomizationProvider } from "@/components/customization/CustomizationProvider";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function CorePage() {
  const user = await getOrCreateDefaultUser();
  const courses = await db.course.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });

  return (
    <CustomizationProvider>
      <HubBackBar title="Core Notes" planningActive="core" />
      <div className="flex justify-end border-b border-brand bg-white px-3 py-2 sm:px-4">
        <Link
          href="/core/shelf"
          className="inline-flex min-h-[44px] items-center rounded-lg px-2 text-xs font-semibold text-brand hover:opacity-80 touch-manipulation"
        >
          Notebook shelf →
        </Link>
      </div>
      <Suspense fallback={<div className="px-6 py-12 text-stone-500">Loading notes...</div>}>
        <CoreNotesWorkspace initialCourses={courses} />
      </Suspense>
    </CustomizationProvider>
  );
}
