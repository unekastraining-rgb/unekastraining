import { Suspense } from "react";
import { notFound } from "next/navigation";

import { HubSubpageShell } from "@/components/hub/HubSubpageShell";
import { HubBackBar } from "@/components/hub/HubBackBar";
import { SixGuidedSession } from "@/components/study/SixGuidedSession";
import { SIX_GUIDES } from "@/lib/csl/six-guides";
import type { SixComponent } from "@/lib/csl/six";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import { withReadableCourse } from "@/lib/courses/display-name";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

const VALID = Object.keys(SIX_GUIDES) as SixComponent[];

export default async function SixGuidePage({
  params,
}: {
  params: Promise<{ component: string }>;
}) {
  const { component } = await params;
  if (!VALID.includes(component as SixComponent)) {
    notFound();
  }

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

  const initialCourseTopics = Object.fromEntries(
    courses.map((course) => [
      course.id,
      course.topics
        .filter((topic) => !isMetaSyllabusTopic(topic.name))
        .map((topic) => ({ id: topic.id, name: topic.name })),
    ]),
  );

  return (
    <HubSubpageShell>
      <HubBackBar title="Six Technique" planningActive="study" />
      <Suspense fallback={<div className="px-6 py-12 text-stone-500">Loading session…</div>}>
        <SixGuidedSession
          component={component as SixComponent}
          initialCourses={courses.map((course) => ({
            id: course.id,
            title: withReadableCourse(course).title,
          }))}
          initialCourseTopics={initialCourseTopics}
        />
      </Suspense>
    </HubSubpageShell>
  );
}
