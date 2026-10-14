/** Match URL courseId to a loaded class, or fall back for cold-start deep links. */
export function resolveUrlCourseId(
  pendingCourseId: string | null | undefined,
  courseIds: readonly string[],
): string {
  const id = pendingCourseId?.trim();
  if (id && courseIds.includes(id)) return id;
  return courseIds[0] ?? "";
}

/** @deprecated Use resolveUrlCourseId — kept for Core imports. */
export const resolveCoreCourseId = resolveUrlCourseId;
