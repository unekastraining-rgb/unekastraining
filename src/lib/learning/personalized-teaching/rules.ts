/**
 * Phase 4B — Deterministic familiarity & presentation rules.
 *
 * Labels describe interaction history, not mastery or ability.
 *
 * Rules (minimal, explicit, testable):
 *
 *   unseen      — exposureCount === 0 && attemptCount === 0
 *   introduced  — exposureCount > 0 && attemptCount === 0
 *   practiced   — attemptCount > 0 && (exposureCount + attemptCount) < REPEATED_INTERACTION_THRESHOLD
 *   repeated    — (exposureCount + attemptCount) >= REPEATED_INTERACTION_THRESHOLD
 *
 * REPEATED_INTERACTION_THRESHOLD = 4 (sum of exposures + attempts).
 * Chosen as the smallest integer that means "multiple learning interactions"
 * without inventing a mastery bar.
 */

import type { LearnerConceptState } from "@/lib/learning/learner-state/types";
import type {
  TeachingFamiliarity,
  TeachingPersonalization,
  TeachingPresentationHint,
} from "@/lib/learning/personalized-teaching/types";

/** Sum of exposures + attempts at/above this → "repeated" familiarity. */
export const REPEATED_INTERACTION_THRESHOLD = 4;

export function deriveFamiliarity(input: {
  exposureCount: number;
  attemptCount: number;
}): TeachingFamiliarity {
  const exposure = Math.max(0, input.exposureCount);
  const attempts = Math.max(0, input.attemptCount);
  if (exposure === 0 && attempts === 0) return "unseen";
  if (attempts === 0) return "introduced";
  if (exposure + attempts >= REPEATED_INTERACTION_THRESHOLD) return "repeated";
  return "practiced";
}

export function presentationHintsFor(input: {
  familiarity: TeachingFamiliarity;
  incorrectCount: number;
  correctCount: number;
}): TeachingPresentationHint[] {
  const hints: TeachingPresentationHint[] = [];

  switch (input.familiarity) {
    case "unseen":
      hints.push("foundational_definition");
      break;
    case "introduced":
      hints.push("concise_recap");
      break;
    case "practiced":
      hints.push("application_emphasis");
      break;
    case "repeated":
      hints.push("application_emphasis", "reduce_redundancy");
      break;
  }

  // Incorrect evidence may emphasize clarification — never "weak".
  if (input.incorrectCount > 0) {
    hints.push("misconception_contrast", "contrasting_examples");
  }

  // Correct evidence may support less repetition — never "mastered".
  if (input.correctCount > 0 && input.familiarity !== "unseen") {
    if (!hints.includes("reduce_redundancy")) {
      hints.push("reduce_redundancy");
    }
  }

  return hints;
}

/** Build personalization from a concept state (or empty → unseen). */
export function personalizationFromState(
  conceptId: string,
  state: LearnerConceptState | null | undefined,
): TeachingPersonalization {
  const exposureCount = state?.exposureCount ?? 0;
  const attemptCount = state?.attemptCount ?? 0;
  const correctCount = state?.correctCount ?? 0;
  const incorrectCount = state?.incorrectCount ?? 0;
  const familiarity = deriveFamiliarity({ exposureCount, attemptCount });

  return {
    conceptId,
    priorExposure: exposureCount,
    priorAttempts: attemptCount,
    correctAttempts: correctCount,
    incorrectAttempts: incorrectCount,
    familiarity,
    lastOutcome: state?.lastOutcome,
    presentationHints: presentationHintsFor({
      familiarity,
      incorrectCount,
      correctCount,
    }),
  };
}

/** True when personalization text must not claim mastery/weakness. */
export const FORBIDDEN_LEARNER_JUDGMENT_RE =
  /\b(you are weak|you'?re weak|you have mastered|you'?ve mastered|mastered this|you are (an? )?(advanced|beginner|struggling)|you cannot learn|weak at|smart at this)\b/i;
