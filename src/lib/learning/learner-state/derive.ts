/**
 * Phase 4A — Derive LearnerConceptState from LearningEvidence (deterministic).
 * No mastery thresholds; counts only.
 */

import type {
  LearningEvidence,
  LearningEvidenceOutcome,
  LearnerConceptState,
} from "@/lib/learning/learner-state/types";

const ATTEMPT_TYPES = new Set([
  "practice_attempt",
  "check_attempt",
  "recall_result",
  "explanation_attempt",
  "visualization_attempt",
  "application_attempt",
]);

export function emptyLearnerConceptState(
  userId: string,
  conceptId: string,
): LearnerConceptState {
  return {
    userId,
    conceptId,
    exposureCount: 0,
    attemptCount: 0,
    correctCount: 0,
    incorrectCount: 0,
  };
}

/**
 * Fold evidence chronologically into concept state.
 * Only evidence with matching conceptId is considered.
 */
export function deriveLearnerConceptState(
  userId: string,
  conceptId: string,
  evidence: readonly LearningEvidence[],
): LearnerConceptState {
  const relevant = evidence
    .filter((e) => e.userId === userId && e.conceptId === conceptId)
    .slice()
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  const state = emptyLearnerConceptState(userId, conceptId);
  if (relevant.length === 0) return state;

  for (const e of relevant) {
    applyEvidenceToState(state, e);
  }
  return state;
}

/** Mutate state by applying one evidence event (deterministic). */
export function applyEvidenceToState(
  state: LearnerConceptState,
  evidence: LearningEvidence,
): void {
  if (evidence.conceptId && evidence.conceptId !== state.conceptId) return;
  if (evidence.userId !== state.userId) return;

  state.lastSeenAt = evidence.occurredAt;
  if (evidence.outcome) {
    state.lastOutcome = evidence.outcome;
  }

  if (evidence.type === "lesson_exposure") {
    state.exposureCount += 1;
    return;
  }

  if (!ATTEMPT_TYPES.has(evidence.type)) return;

  const outcome = evidence.outcome;
  if (outcome === "correct" || outcome === "incorrect") {
    state.attemptCount += 1;
    if (outcome === "correct") state.correctCount += 1;
    else state.incorrectCount += 1;
    return;
  }

  // attempted / completed on attempt types: count as attempt without correct/incorrect
  if (outcome === "attempted" || outcome === "completed" || !outcome) {
    state.attemptCount += 1;
  }
}

export function outcomeFromScoreRatio(
  scoreRatio: number,
): LearningEvidenceOutcome {
  return scoreRatio >= 0.5 ? "correct" : "incorrect";
}
