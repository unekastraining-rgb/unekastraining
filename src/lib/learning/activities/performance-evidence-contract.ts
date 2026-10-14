/**
 * 2P-45 — Universal performance evidence contract (documentation + invariants).
 * PERFORM is a mastery facet, not a PerformanceEngine.
 */

export const PERFORMANCE_EVIDENCE_CONTRACT = {
  facet: "PERFORM" as const,
  /** Open / view / hint / start never create PERFORM evidence. */
  openIsNotEvidence: true,
  /** Adaptive/activity completion gate ≠ automatic PERFORM mastery. */
  completionIsNotEvidence: true,
  /** Hands-on Practice SIX maps to APPLY, not PERFORM. */
  handsOnPracticeIsNotPerform: true,
  inventsPerformGap: false,
  inventsPerformanceEngine: false,
  inventsMasteryDecay: false,
  usesExistingLearningAttempt: true,
  usesExistingConceptMastery: true,
} as const;

export function performanceEvidenceTruthSummary(): typeof PERFORMANCE_EVIDENCE_CONTRACT {
  return PERFORMANCE_EVIDENCE_CONTRACT;
}
