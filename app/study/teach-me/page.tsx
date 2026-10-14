import { Suspense } from "react";

import { HubBackBar } from "@/components/hub/HubBackBar";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import { withReadableCourse } from "@/lib/courses/display-name";
import { db } from "@/lib/db";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { getOrCreateDefaultUser } from "@/lib/user";

import { TeachMeClient } from "./teach-me-client";

export const dynamic = "force-dynamic";

export default async function TeachMePage() {
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
        take: 40,
        select: { id: true, name: true },
      },
    },
  });

  return (
    <>
      <HubBackBar title="Learn" planningActive="study" compact />
      <Suspense fallback={<div className="px-6 py-12 text-stone-500">Loading…</div>}>
        <TeachMeClient
          courses={courses.map((course) => ({
            id: course.id,
            title: withReadableCourse(course).title,
            topics: course.topics.filter((topic) => !isMetaSyllabusTopic(topic.name)),
          }))}
        />
      </Suspense>
    </>
  );
}
