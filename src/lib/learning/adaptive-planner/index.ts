/**
 * Phase 15 — Adaptive Planner (WHEN/sequence).
 * Orchestrator = WHAT, Six = HOW, Planner = WHEN.
 */

export type {
  LearningNeedUrgency,
  LearningNeed,
  StudyWindow,
  PlannedLearningActivity,
  AdaptivePlan,
} from "@/lib/learning/adaptive-planner/types";

export {
  findAvailableStudyWindows,
  type BusyInterval,
} from "@/lib/learning/adaptive-planner/study-windows";

export {
  buildLearningNeed,
  learningNeedsFromAcademicItems,
  sortLearningNeeds,
  roomForAction,
} from "@/lib/learning/adaptive-planner/learning-need";

export {
  scheduleLearningActivities,
  recalculateAdaptivePlan,
} from "@/lib/learning/adaptive-planner/schedule";

export { buildAdaptiveLearningPlan } from "@/lib/learning/adaptive-planner/plan";
