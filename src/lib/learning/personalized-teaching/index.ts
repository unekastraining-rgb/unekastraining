/**
 * Phase 4B — Personalized Teaching Context
 *
 * Knowledge Library + Learner State → presentation adaptation for Teaching Engine.
 * Does NOT decide next activity (Orchestrator) or invent mastery.
 */

export type {
  TeachingFamiliarity,
  TeachingPresentationHint,
  TeachingPersonalization,
  PersonalizedConceptBinding,
  PersonalizedTeachingContext,
} from "@/lib/learning/personalized-teaching/types";

export {
  REPEATED_INTERACTION_THRESHOLD,
  deriveFamiliarity,
  presentationHintsFor,
  personalizationFromState,
  FORBIDDEN_LEARNER_JUDGMENT_RE,
} from "@/lib/learning/personalized-teaching/rules";

export {
  buildPersonalizedTeachingContext,
  resolvePersonalizedTeachingContext,
} from "@/lib/learning/personalized-teaching/resolve";

export { formatLearnerContextPromptBlock } from "@/lib/learning/personalized-teaching/prompt";

export { applyPersonalizationToLibraryLesson } from "@/lib/learning/personalized-teaching/apply-deterministic";

export {
  lessonContainsUnsupportedLearnerJudgment,
  lessonLeaksLearnerStateMetadata,
} from "@/lib/learning/personalized-teaching/validate-personalization";
