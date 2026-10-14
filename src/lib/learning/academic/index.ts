/**
 * Phase 14 — Normalized Academic Model (LMS + local).
 * Additive over existing LMS sync / school-lms bridges.
 */

export type {
  AcademicSource,
  AcademicItemType,
  AcademicLearningTargetRef,
  AcademicCourse,
  AcademicItem,
  AcademicDeadline,
  AcademicMaterial,
  AcademicSyncFailure,
} from "@/lib/learning/academic/types";

export { academicSourceKey } from "@/lib/learning/academic/types";

export {
  inferAcademicItemType,
  urgencyFromDueAt,
} from "@/lib/learning/academic/infer";

export {
  normalizeAcademicCourse,
  normalizeAcademicItem,
  fromCanvasCourse,
  fromCanvasAssignment,
  fromBlackboardCourse,
  fromBlackboardColumn,
  fromMoodleCourse,
  fromMoodleEvent,
  fromGoogleClassroomCourse,
  fromGoogleClassroomCourseWork,
  fromLocalAssignment,
  dedupeAcademicItems,
  filterAcademicItemsForUser,
  filterAcademicCoursesForUser,
} from "@/lib/learning/academic/normalize";

export {
  resolveLearningTargetsForAcademicItem,
  attachLearningTargets,
  academicDeadlinesFromItems,
} from "@/lib/learning/academic/learning-targets";

export {
  academicMaterialFromCourseMaterial,
  filterAcademicMaterialsForUser,
} from "@/lib/learning/academic/materials";

export {
  academicSyncFailure,
  mergeAcademicItemsAfterSyncFailure,
} from "@/lib/learning/academic/sync-failure";
