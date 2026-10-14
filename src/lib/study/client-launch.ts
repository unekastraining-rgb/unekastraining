"use client";

import { saveStudySession } from "@/components/study/StudySessionRunner";
import type { StudyMinutes } from "@/lib/csl/study-now";

export { coreCourseHref } from "@/lib/study/core-href";

export async function launchStudyNowSession(options?: {
  minutes?: StudyMinutes;
  courseId?: string;
}): Promise<{ courseId: string | null; courseTitle: string | null }> {
  const minutes = options?.minutes ?? 20;
  const response = await fetch("/api/study-now", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      minutes,
      ...(options?.courseId ? { courseId: options.courseId } : {}),
    }),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error ?? "Failed to build session");
  }

  const resolvedCourseId = data.data.courseId ?? options?.courseId ?? null;
  const resolvedCourseTitle =
    typeof data.data.courseTitle === "string" ? data.data.courseTitle : null;

  saveStudySession({
    summary: data.data.summary,
    totalMinutes: data.data.totalMinutes,
    blocks: data.data.blocks,
    context: data.data.context,
    courseId: resolvedCourseId,
    courseTitle: resolvedCourseTitle,
  });

  return { courseId: resolvedCourseId, courseTitle: resolvedCourseTitle };
}
