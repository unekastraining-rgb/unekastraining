import { Suspense } from "react";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { GradeSchoolLessonView } from "@/components/grade-school/GradeSchoolLessonView";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function GradeSchoolStudyPage() {
  const user = await getOrCreateDefaultUser();
  await backfillUserCourseTopicsIfEmpty(user.id);

  const courses = await db.course.findMany({
    where: { userId: user.id },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <HubBackBar title="Guided lesson" planningActive="study" />
      <div className="px-4 py-8 md:px-6">
        <Suspense fallback={<p className="text-sm text-stone-500">Loading lesson…</p>}>
          <GradeSchoolLessonView courseIds={courses.map((course) => course.id)} />
        </Suspense>
      </div>
    </>
  );
}
