import { HubSubpageShell } from "@/components/hub/HubSubpageShell";
import { HubBackBar } from "@/components/hub/HubBackBar";
import { GuidedStudyActivity } from "@/components/study/GuidedStudyActivity";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import { withReadableCourse } from "@/lib/courses/display-name";
import { resolveLoopFocusTopic } from "@/lib/study/resolve-loop-focus-topic";
import { resolveUrlCourseId } from "@/lib/study/resolve-url-course-id";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function BlurtingPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; topic?: string; materialId?: string }>;
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
        take: 40,
        select: { id: true, name: true },
      },
    },
  });

  const readableCourses = courses.map((course) => ({
    id: course.id,
    title: withReadableCourse(course).title,
    topics: course.topics.filter((topic) => !isMetaSyllabusTopic(topic.name)),
  }));

  const courseIds = readableCourses.map((course) => course.id);
  const initialCourseId = resolveUrlCourseId(params.courseId, courseIds);
  const initialTopic =
    resolveLoopFocusTopic(
      params.topic,
      readableCourses.find((course) => course.id === initialCourseId)?.topics.map((topic) => topic.name) ?? [],
    ) ?? undefined;

  let initialMaterialId: string | undefined;
  if (params.materialId?.trim() && initialCourseId) {
    const material = await db.courseMaterial.findFirst({
      where: {
        id: params.materialId.trim(),
        courseId: initialCourseId,
        course: { userId: user.id },
      },
      select: { id: true },
    });
    initialMaterialId = material?.id;
  }

  return (
    <HubSubpageShell>
      <HubBackBar title="Blurting" planningActive="study" />
      <GuidedStudyActivity
        mode="blurting"
        title="Blurting"
        subtitle="Write everything you remember without looking at your notes. We'll compare it to your course material and show gaps."
        placeholder="Start writing everything you remember about the topic..."
        initialCourses={readableCourses}
        initialCourseId={initialCourseId || undefined}
        initialTopic={initialTopic}
        initialMaterialId={initialMaterialId}
      />
    </HubSubpageShell>
  );
}
