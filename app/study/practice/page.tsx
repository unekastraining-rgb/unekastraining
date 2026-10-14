import { Suspense } from "react";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { CodePracticeWorkspace } from "@/components/study/CodePracticeWorkspace";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import { withReadableCourse } from "@/lib/courses/display-name";
import { db } from "@/lib/db";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { getOrCreateDefaultUser } from "@/lib/user";

export const dynamic = "force-dynamic";

/**
 * Bundle M — Specialized coding practice workspace (not Practice Hub).
 * Canonical "choose practice" destination: /study/practice-hub
 */
export default async function CodingPracticePage() {
  const user = await getOrCreateDefaultUser();
  await backfillUserCourseTopicsIfEmpty(user.id);
  const courses = await db.course.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      title: true,
      code: true,
      topics: {
        orderBy: { sortOrder: "asc" },
        take: 24,
        select: { name: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <HubBackBar title="Coding practice" planningActive="study" />
      <Suspense fallback={<div className="px-6 py-10 text-sm text-stone-500">Loading coding practice…</div>}>
        <CodePracticeWorkspace
          initialCourses={courses.map((course) => ({
            id: course.id,
            title: withReadableCourse(course).title,
            topics: course.topics
              .map((topic) => topic.name)
              .filter((name) => !isMetaSyllabusTopic(name)),
          }))}
        />
      </Suspense>
    </>
  );
}
