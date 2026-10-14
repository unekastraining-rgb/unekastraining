/**
 * Phase 2G-23 — Explicit LearningIntent projection helpers.
 *
 * Pure mapping only. Does not change Tutor, CORE, SIX, Quiz, Orchestrator,
 * or Adaptive behavior. Callers must opt in; absent intent remains valid.
 *
 * TutorMode ≠ LearningIntent — projection is explicit and selective.
 * CoreStudyIntent ≠ LearningIntent — layout/generate signals map conservatively.
 * System interventions never become learner intent.
 */

import type { CoreStudyIntent } from "@/lib/core/study-intent";
import type { TutorMode } from "@/lib/learning/tutor/types";
import type {
  LearningIntent,
  LearningIntentPurpose,
  LearningIntentProvenance,
  LearningIntentScope,
} from "@/lib/learning/intent/types";

export type CreateExplicitLearningIntentInput = {
  purpose: LearningIntentPurpose;
  provenance?: LearningIntentProvenance;
  scope?: LearningIntentScope;
  conceptId?: string;
  learningSpaceId?: string;
};

/**
 * Build an EXPLICIT learner intent. Use only when the learner clearly selected
 * or stated a purpose — never for system interventions.
 */
export function createExplicitLearningIntent(
  input: CreateExplicitLearningIntentInput,
): LearningIntent {
  const intent: LearningIntent = {
    purpose: input.purpose,
    source: "EXPLICIT",
    scope: input.scope ?? "request",
  };
  if (input.provenance) intent.provenance = input.provenance;
  if (input.conceptId?.trim()) intent.conceptId = input.conceptId.trim();
  if (input.learningSpaceId?.trim()) {
    intent.learningSpaceId = input.learningSpaceId.trim();
  }
  return intent;
}

export type ProjectTutorModeOptions = {
  /**
   * True when the learner explicitly chose this Tutor mode in UI.
   * Today most surfaces hardcode modes → leave false (INFERRED).
   */
  learnerSelected?: boolean;
  conceptId?: string;
  learningSpaceId?: string;
  scope?: LearningIntentScope;
};

/**
 * Project TutorMode → LearningIntent only for safe alignments.
 * PRACTICE → PRACTICE, EXAM → ASSESS.
 * Teaching/register modes return null (policy ≠ why-opened).
 * Does not modify Tutor behavior.
 */
export function projectTutorModeToLearningIntent(
  mode: TutorMode,
  options?: ProjectTutorModeOptions,
): LearningIntent | null {
  let purpose: LearningIntentPurpose | null = null;
  if (mode === "PRACTICE") purpose = "PRACTICE";
  else if (mode === "EXAM") purpose = "ASSESS";
  else return null;

  const learnerSelected = options?.learnerSelected === true;
  const intent: LearningIntent = {
    purpose,
    source: learnerSelected ? "EXPLICIT" : "INFERRED",
    scope: options?.scope ?? "request",
    provenance: learnerSelected ? "user_selection" : "tutor_mode",
  };
  if (options?.conceptId?.trim()) intent.conceptId = options.conceptId.trim();
  if (options?.learningSpaceId?.trim()) {
    intent.learningSpaceId = options.learningSpaceId.trim();
  }
  return intent;
}

/**
 * Project Core notebook-layout intent → LearningIntent when unambiguous.
 * Conversational "quiz me" never sets CoreStudyIntent — stays null.
 * Overloaded "study-guide" (create guide vs help me study) → null.
 * Generating a quiz artifact is CREATE, not ASSESS.
 */
export function projectCoreStudyIntentToLearningIntent(
  core: CoreStudyIntent,
  options?: {
    conceptId?: string;
    learningSpaceId?: string;
    scope?: LearningIntentScope;
  },
): LearningIntent | null {
  if (!core) return null;

  let purpose: LearningIntentPurpose | null = null;
  if (core === "practice") purpose = "PRACTICE";
  else if (core === "explain") purpose = "UNDERSTAND";
  else if (
    core === "quiz" ||
    core === "flashcards" ||
    core === "learning-plan"
  ) {
    purpose = "CREATE";
  } else {
    // study-guide is overloaded in detectCoreStudyIntent — omit rather than guess
    return null;
  }

  return createExplicitLearningIntent({
    purpose,
    provenance: "user_utterance",
    scope: options?.scope ?? "request",
    conceptId: options?.conceptId,
    learningSpaceId: options?.learningSpaceId,
  });
}

/**
 * System-selected interventions (Orchestrator / Adaptive step) are never
 * learner intent. Always returns null.
 */
export function projectSystemInterventionToLearningIntent(
  // Kept for call-site clarity; value is intentionally unused.
  intervention: string,
): null {
  void intervention;
  return null;
}
