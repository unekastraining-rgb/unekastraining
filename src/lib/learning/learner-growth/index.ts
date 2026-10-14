/**
 * 2P-43 — Longitudinal learner growth (read-side continuity).
 * Not a GrowthEngine / JourneyEngine / PlanningEngine / ProgressEngine.
 */

export type {
  TemporalTruthKind,
  TemporalTruthItem,
  TemporalTruthBuckets,
  LearnerNextAction,
  LearnerGrowthContinuityView,
} from "./types";

export {
  presentTemporalTruthBuckets,
  temporalTruthTruthSummary,
} from "./temporal-truth";

export {
  learningActionToNextAction,
  resolveLearnerNextAction,
  learnerNextActionTruthSummary,
} from "./next-action";

export {
  presentLearnerGrowthContinuity,
  presentLearnerGrowthHubTeaser,
  learnerGrowthContinuityTruthSummary,
  type LearnerGrowthHubTeaser,
} from "./present-continuity";

export {
  resolveLearnerGrowthContinuityForUser,
  type ResolveLearnerGrowthContinuityResult,
} from "./resolve";
