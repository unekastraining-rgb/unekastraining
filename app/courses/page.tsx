import { redirect } from "next/navigation";

import { HubSubpageShell } from "@/components/hub/HubSubpageShell";
import { HubBackBar } from "@/components/hub/HubBackBar";
import { withReadableCourse } from "@/lib/courses/display-name";
import { db } from "@/lib/db";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { courseMaterialUploadHref } from "@/lib/study/loop-hrefs";
import { getOrCreateDefaultUser } from "@/lib/user";

import { CoursesView } from "./courses-view";

export const dynamic = "force-dynamic";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ scan?: string; courseId?: string }>;
}) {
  const user = await getOrCreateDefaultUser();
  await backfillUserCourseTopicsIfEmpty(user.id);
  const params = await searchParams;

  if (params.scan === "1" && params.courseId?.trim()) {
    redirect(courseMaterialUploadHref(params.courseId.trim()));
  }

  const courses = await db.course.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { assignments: true, materials: true },
      },
    },
  });

  return (
    <HubSubpageShell>
      <HubBackBar title="Add class / Scan syllabus" />
      <CoursesView
        initialCourses={courses.map((course) => withReadableCourse(course))}
        highlightUpload={params.scan === "1"}
      />
    </HubSubpageShell>
  );
}
