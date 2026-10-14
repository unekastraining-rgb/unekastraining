/**
 * Bundle E — Unified Learning Experience public surface.
 * Presentation only — does not create intelligence layers.
 */

export type {
  LearningExperienceContext,
  LearningExperienceTarget,
  LearningExperienceCurrentConcept,
  LearningExperiencePathPosition,
  LearningExperienceNextAction,
} from "@/lib/learning/unified-experience/types";

export {
  buildLearningExperienceContext,
  learningExperienceStatusLines,
  type BuildLearningExperienceInput,
  type UiOrchestrationView,
} from "@/lib/learning/unified-experience/present";

export {
  sixHowMessageForLearner,
  activityDoingLabel,
  continueLabelForAction,
  PATH_POSITION_DISCLAIMER,
} from "@/lib/learning/unified-experience/copy";

export {
  coreLearningActionLinks,
  type CoreLearningActionLink,
} from "@/lib/learning/unified-experience/core-actions";
