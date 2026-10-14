/**
 * Phase 17 — Learning Activity framework (additive over existing activities/*).
 * Orchestrator = WHAT, Six = HOW, Planner = WHEN, Activity = DO.
 */

export type {
  LearningActivityType,
  LearningActivityStatus,
  LearningActivitySource,
  LearningActivityDescriptor,
  LearningActivityEvaluationOutcome,
  LearningActivityEvaluation,
  LearningActivityRegistryEntry,
} from "@/lib/learning/activity/framework/types";

export {
  LEARNING_ACTIVITY_REGISTRY,
  getActivityRegistryEntry,
  listSupportedActivityTypes,
} from "@/lib/learning/activity/framework/registry";

export {
  activityTypeForOrchestratorAction,
  resolveLearningActivity,
  learningActivityFromPlanned,
  learningActivityFromNeed,
  learningActivitiesFromCore,
  preferCodingActivity,
} from "@/lib/learning/activity/framework/resolve";

export {
  evidenceTypeForActivity,
  mapUniversalOutcomeToLearningOutcome,
  buildActivityEvaluation,
} from "@/lib/learning/activity/framework/evaluate";

export { recordActivityEvaluationEvidence } from "@/lib/learning/activity/framework/evidence";

/** Bundle I runtime re-exports — still one Activity Framework. */
export {
  buildInteractiveActivityForConcept,
  selectInteractiveActivityForConcept,
  evaluateInteractiveSubmission,
  completeInteractiveActivity,
  feedbackUsesOnlyAuthoredMisconceptions,
} from "@/lib/learning/activity/runtime";
