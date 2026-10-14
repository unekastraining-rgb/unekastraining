import { Suspense } from "react";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { withReadableCourse } from "@/lib/courses/display-name";
import { db } from "@/lib/db";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { resolveUrlCourseId } from "@/lib/study/resolve-url-course-id";
import { getOrCreateDefaultUser } from "@/lib/user";

import { QuizzesView } from "./quizzes-view";

export const dynamic = "force-dynamic";

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const params = await searchParams;
  const user = await getOrCreateDefaultUser();

  await backfillUserCourseTopicsIfEmpty(user.id);

  const courses = await db.course.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
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
  });

  const mapped = courses.map((course) => ({
    ...withReadableCourse(course),
    topics: course.topics
      .map((topic) => topic.name)
      .filter((name) => !isMetaSyllabusTopic(name)),
  }));
  const initialCourseId = resolveUrlCourseId(
    params.courseId ?? null,
    mapped.map((course) => course.id),
  ) || null;

  return (
    <>
      <HubBackBar title="Quizzes" />
      <Suspense fallback={<div className="px-6 py-12 text-stone-500">Loading quizzes...</div>}>
        <QuizzesView initialCourses={mapped} initialCourseId={initialCourseId} />
      </Suspense>
    </>
  );
}
