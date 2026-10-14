import { db } from "@/lib/db";

import { resolveUrlCourseId } from "@/lib/study/resolve-url-course-id";

/** Load course ids for cold-start URL resolution on API routes. */
export async function loadUserCourseIds(userId: string): Promise<string[]> {
  const courses = await db.course.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  return courses.map((course) => course.id);
}

/** Resolve URL courseId against the user's classes (demo-cs201 → first loaded). */
export async function resolveUserUrlCourseId(
  userId: string,
  pendingCourseId?: string | null,
): Promise<string | undefined> {
  const courseIds = await loadUserCourseIds(userId);
  const resolved = resolveUrlCourseId(pendingCourseId, courseIds);
  return resolved || undefined;
}
