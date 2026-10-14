/**
 * Phase 2G-22 — Universal Learning Intent contract (non-persistent).
 *
 * Intent = why the learner is engaging now.
 * Not activity, intervention, evidence, mastery, or goal.
 * System intervention is never a learner intent source.
 */

export const LEARNING_INTENT_PURPOSES = [
  "UNDERSTAND",
  "PRACTICE",
  "ASSESS",
  "CREATE",
] as const;

export type LearningIntentPurpose =
  (typeof LEARNING_INTENT_PURPOSES)[number];

export const LEARNING_INTENT_SOURCES = ["EXPLICIT", "INFERRED"] as const;

export type LearningIntentSource =
  (typeof LEARNING_INTENT_SOURCES)[number];

export const LEARNING_INTENT_PROVENANCES = [
  "user_utterance",
  "user_selection",
  "tutor_mode",
  "context",
] as const;

export type LearningIntentProvenance =
  (typeof LEARNING_INTENT_PROVENANCES)[number];

export const LEARNING_INTENT_SCOPES = [
  "request",
  "activity",
  "session_hold",
] as const;

export type LearningIntentScope = (typeof LEARNING_INTENT_SCOPES)[number];

/**
 * Canonical ephemeral learner intent.
 * Optional bindings must never be required for validity.
 * Course membership is never part of this contract.
 */
export interface LearningIntent {
  purpose: LearningIntentPurpose;
  source: LearningIntentSource;
  scope: LearningIntentScope;
  provenance?: LearningIntentProvenance;
  conceptId?: string;
  learningSpaceId?: string;
}
