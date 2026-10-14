/**
 * 2P-11 — Universal Learning Experience.
 */

export type {
  LearningExperienceView,
  LearningExperienceActivityKind,
  LearningExperienceStageLabel,
  LearningExperienceTruthSummary,
} from "./types";

export {
  projectLearningExperience,
  learningExperienceTruthSummary,
  experienceModuleDoesNotWriteMastery,
  type ProjectLearningExperienceInput,
} from "./project";

export {
  resolveLearningExperience,
  type ResolveLearningExperienceInput,
  type ResolveLearningExperienceResult,
} from "./resolve";

export {
  resolveUniversalAdaptiveLearningAction,
  learningActionFromHubCta,
  openActivityLearningAction,
  openCoreLearningAction,
  openHubLearningAction,
  openLuckyLearningAction,
  openTutorLearningAction,
  resolveSixSecondaryAction,
  containsInternalLearningIdLeak,
  LEARNING_ACTION_START_LABEL,
  LEARNING_ACTION_CONTINUE_LABEL,
  type LearningAction,
  type LearningActionKind,
} from "./learning-action";

export {
  resolveUniversalActivityState,
  universalActivityStateLearnerLine,
  UNIVERSAL_ACTIVITY_STATES,
  type UniversalActivityState,
} from "./activity-lifecycle-state";

export {
  presentActivityCompletion,
  presentWhyThisActivity,
  type ActivityCompletionPresentation,
} from "./activity-completion-present";
