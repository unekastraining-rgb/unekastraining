"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { GuidedStudyActivity } from "@/components/study/GuidedStudyActivity";
import { TeachFirstLearnActivity } from "@/components/study/TeachFirstLearnActivity";
import { parseLearningFocus } from "@/lib/study/learning-focus";
import { resolveLoopFocusTopic } from "@/lib/study/resolve-loop-focus-topic";
import { resolveUrlCourseId } from "@/lib/study/resolve-url-course-id";

/**
 * /study/teach-me — default is teach-first Learn.
 * `?focus=explain` keeps the legacy explain/teach-back surface for warm learners.
 */
export function TeachMeClient({
  courses,
}: {
  courses: Array<{
    id: string;
    title: string;
    topics?: Array<{ id: string; name: string }>;
  }>;
}) {
  const searchParams = useSearchParams();
  const focus = parseLearningFocus(searchParams.get("focus"));
  const courseIds = useMemo(() => courses.map((course) => course.id), [courses]);
  const resolvedCourseId = resolveUrlCourseId(
    searchParams.get("courseId"),
    courseIds,
  );
  const resolvedTopic = resolveLoopFocusTopic(
    searchParams.get("topic"),
    courses
      .find((course) => course.id === resolvedCourseId)
      ?.topics?.map((topic) => topic.name) ?? [],
  );
  const materialId = searchParams.get("materialId") ?? undefined;

  if (focus === "explain") {
    return (
      <GuidedStudyActivity
        mode="teach-me"
        title="Explain it"
        subtitle="You already studied this — explain it in your own words so we can check understanding."
        placeholder="Explain the concept in your own words..."
        initialCourses={courses}
        initialCourseId={resolvedCourseId || undefined}
        initialTopic={resolvedTopic ?? undefined}
        initialMaterialId={materialId}
      />
    );
  }

  return (
    <TeachFirstLearnActivity
      initialCourses={courses}
      initialCourseId={resolvedCourseId || undefined}
      initialTopic={resolvedTopic ?? undefined}
      initialMaterialId={materialId}
    />
  );
}
