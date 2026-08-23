import { db } from "@/lib/db";
import { resolveMoodleCredentials } from "@/lib/lms/moodle-env";

import { buildCourseInfoPortal } from "./build-course-info";
import type { CourseInfoPortal } from "./types";
import { parseCourseInfoPortal } from "./types";

export function parseMoodleCourseIdFromDescription(description: string | null | undefined): number | null {
  const match = description?.match(/Imported from Moodle \((\d+)\)/);
  if (!match?.[1]) return null;
  const id = Number.parseInt(match[1], 10);
  return Number.isFinite(id) ? id : null;
}

export async function syncCourseInfoForCourse(
  userId: string,
  courseId: string,
  options?: { force?: boolean },
): Promise<CourseInfoPortal | null> {
  const course = await db.course.findFirst({
    where: { id: courseId, userId },
  });

  if (!course) return null;

  const moodleCourseId =
    course.moodleCourseId ?? parseMoodleCourseIdFromDescription(course.description);

  if (!moodleCourseId) return null;

  if (!options?.force && course.courseInfoJson) {
    const cached = parseCourseInfoPortal(course.courseInfoJson);
    if (cached) return cached;
  }

  const credentials = await resolveMoodleCredentials(userId);
  if (!credentials) return null;

  const portal = await buildCourseInfoPortal({
    studyHaulCourseId: course.id,
    moodleCourseId,
    baseUrl: credentials.baseUrl,
    token: credentials.accessToken,
  });

  await db.course.update({
    where: { id: course.id },
    data: {
      moodleCourseId,
      courseInfoSyncedAt: new Date(),
      courseInfoJson: JSON.stringify(portal),
    },
  });

  return portal;
}

export async function syncCourseInfoAfterMoodleImport(
  userId: string,
  courseId: string,
  moodleCourseId: number,
): Promise<void> {
  try {
    await db.course.update({
      where: { id: courseId },
      data: { moodleCourseId },
    });
    await syncCourseInfoForCourse(userId, courseId, { force: true });
  } catch (error) {
    console.warn("Course Info sync failed for course", courseId, error);
  }
}
