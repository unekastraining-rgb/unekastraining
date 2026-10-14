/**
 * Presentation-only classification: My Courses vs My Learning.
 * Reuses existing Course fields — no schema / second learning system.
 */

export type CourseLearningBucket = "courses" | "learning";

export type CourseBucketSignals = {
  moodleCourseId?: number | null;
  courseInfoSyncedAt?: Date | string | null;
  semester?: string | null;
  code?: string | null;
  assignmentCount?: number;
};

/**
 * School / LMS-connected courses land in My Courses.
 * Independent StudyThis / free-topic courses (typically no LMS code) land in My Learning.
 */
export function resolveCourseLearningBucket(
  signals: CourseBucketSignals,
): CourseLearningBucket {
  if (signals.moodleCourseId != null) return "courses";
  if (signals.courseInfoSyncedAt) return "courses";
  if (signals.semester?.trim()) return "courses";
  if ((signals.assignmentCount ?? 0) > 0) return "courses";
  if (signals.code?.trim()) return "courses";
  return "learning";
}
