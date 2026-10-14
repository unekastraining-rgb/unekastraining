/**
 * Bundle J — Product completion surface re-exports.
 * Extends existing systems; does not create parallel engines.
 */

export {
  buildTrueFalseFromConcept,
  buildMultiSelectFromConcept,
  buildMatchingFromConcept,
  completeInteractiveActivityForStudio,
} from "@/lib/learning/activity/runtime";

export { buildCourseOverviewFromPath } from "@/lib/learning/studio/course-overview";

export {
  HAUL_WRITING_PHASES,
  inferHaulWritingPhase,
  nextSuggestedHaulPhase,
} from "@/lib/haul/writing/loop-phases";

export { summarizeCoreSourceHonesty } from "@/lib/learning/core/source-honesty";

export { listRetentionVariantsForKnowledgeConcept } from "@/lib/learning/retention/knowledge-library-variants";

export {
  planPreviewFromAcademicItems,
  emptyPlannerProductPreview,
} from "@/lib/learning/adaptive-planner/product-hooks";

export { schoolLmsProductTruthSummary } from "@/lib/learning/school-lms/product-connectors";

export { buildTutorFocusContext } from "@/lib/learning/tutor/contextual-focus";

export { assessmentProductSurfaces } from "@/lib/learning/assessment/product-completion";

export {
  structuredChallengeIdsForConcept,
  conceptIdForStructuredChallenge,
} from "@/lib/learning/activities/structured/kl-concept-bridge";
