/**
 * Phase 14 — Normalized Academic Model types.
 * Adapters map LMS / local data into these shapes.
 * Does not become a second assignment database — source identity stays external.
 */

export type AcademicSource =
  | "canvas"
  | "blackboard"
  | "moodle"
  | "google-classroom"
  | "local";

export type AcademicItemType =
  | "assignment"
  | "quiz"
  | "exam"
  | "discussion"
  | "project"
  | "reading"
  | "other";

export type AcademicLearningTargetRef = {
  conceptId: string;
  title?: string;
  /** confirmed = owned topic link; inferred = title match; unaligned = none */
  alignment: "confirmed" | "inferred" | "unaligned";
  source?: "knowledge-library" | "general" | "topic-bridge";
};

export type AcademicCourse = {
  id: string;
  source: AcademicSource;
  externalId?: string;
  /** Linked internal Course.id when known. */
  internalCourseId?: string;
  userId: string;
  title: string;
  code?: string | null;
  instructor?: string | null;
  term?: string | null;
  active?: boolean;
  metadata?: Record<string, unknown>;
};

export type AcademicItem = {
  id: string;
  source: AcademicSource;
  externalId?: string;
  /** Linked internal Assignment.id when known. */
  internalAssignmentId?: string;
  courseId: string;
  userId: string;
  title: string;
  description?: string | null;
  dueAt?: Date | null;
  itemType: AcademicItemType;
  status?: string | null;
  learningTargets?: AcademicLearningTargetRef[];
  sourceUrl?: string | null;
  metadata?: Record<string, unknown>;
};

export type AcademicDeadline = {
  id: string;
  itemId: string;
  courseId: string;
  userId: string;
  dueAt: Date;
  title: string;
  urgency: "low" | "medium" | "high";
  source: AcademicSource;
};

export type AcademicMaterial = {
  id: string;
  source: AcademicSource;
  courseId: string;
  userId: string;
  title: string;
  materialId?: string;
  excerpt?: string | null;
  url?: string | null;
};

export type AcademicSyncFailure = {
  source: AcademicSource;
  message: string;
  recoverable: true;
  /** Local/normalized data remains usable. */
  localDataPreserved: true;
};

/** Stable composite key — prevents duplicate normalized items. */
export function academicSourceKey(
  source: AcademicSource,
  externalId: string,
): string {
  return `${source}:${externalId.trim()}`;
}
