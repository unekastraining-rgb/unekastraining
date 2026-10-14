/**
 * 2P-19 — Universal Teaching Style (presentation layer only).
 *
 * Intent = WHY · TutorMode = WHAT · TeachingStyle = HOW
 * Soft preference — never diagnosis, evidence, mastery, or Adaptive completion.
 */

export const TEACHING_STYLES = [
  "SIMPLIFIED",
  "BEGINNER",
  "STANDARD",
  "DETAILED",
  "SOCRATIC",
  "FEYNMAN",
  "HANDS_ON",
  "CHALLENGE",
  "EXAM",
] as const;

export type TeachingStyle = (typeof TEACHING_STYLES)[number];

/**
 * User-facing "Teach Me Like I'm 5" maps to SIMPLIFIED.
 * Not an age, grade, intelligence, or persona signal.
 */
export const TEACH_ME_LIKE_IM_5_STYLE: TeachingStyle = "SIMPLIFIED";

export type TeachingStyleResolutionSource =
  | "explicit"
  | "session"
  | "preference"
  | "default_absent";

export type TeachingStyleResolution = {
  style: TeachingStyle | undefined;
  source: TeachingStyleResolutionSource;
};

export type TeachingStyleBoundarySummary = {
  optional: true;
  doesNotAlterDiagnosis: true;
  doesNotAlterMastery: true;
  doesNotAlterEvidence: true;
  doesNotAlterLearningAttemptOutcome: true;
  doesNotAlterAdaptiveCompletion: true;
  doesNotAlterLearningIntent: true;
  doesNotInferAge: true;
  doesNotInferIntelligence: true;
  isNotLearnerPersona: true;
  isNotGradeLevel: true;
  aiTextIsNotLearnerEvidence: true;
  noSeparateTeachingStyleEngine: true;
  teachMeLikeIm5IsNotAge: true;
};
