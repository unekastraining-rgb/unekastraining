"use client";

import { saveStudySession } from "@/components/study/StudySessionRunner";
import type { StudyMinutes } from "@/lib/csl/study-now";

export async function launchStudyNowSession(options?: {
  minutes?: StudyMinutes;
  courseId?: string;
}): Promise<void> {
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

  saveStudySession({
    summary: data.data.summary,
    totalMinutes: data.data.totalMinutes,
    blocks: data.data.blocks,
    context: data.data.context,
  });
}

export function coreCourseHref(options: {
  courseId: string;
  materialId?: string | null;
  noteId?: string | null;
  autoSession?: boolean;
}): string {
  const params = new URLSearchParams();
  params.set("courseId", options.courseId);
  if (options.noteId) params.set("noteId", options.noteId);
  else if (options.materialId) params.set("materialId", options.materialId);
  if (options.autoSession) params.set("session", "20");
  return `/core?${params.toString()}`;
}
