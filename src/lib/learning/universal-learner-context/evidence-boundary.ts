/**
 * 2P-29 — Context projection creates no evidence / mastery.
 */

export const UNIVERSAL_LEARNER_CONTEXT_EVIDENCE_BOUNDARY = {
  resolveCreatesLearningAttempt: false,
  displayCreatesLearningAttempt: false,
  growthCenterViewCreatesLearningAttempt: false,
  hubViewCreatesLearningAttempt: false,
  tutorWithContextCreatesAutomaticEvidence: false,
  startAdaptiveCreatesLearningAttempt: false,
  activityInteractionMayCreateEvidence: true,
} as const;

export function universalLearnerContextCreatesEvidence(
  action: keyof typeof UNIVERSAL_LEARNER_CONTEXT_EVIDENCE_BOUNDARY,
): boolean {
  return UNIVERSAL_LEARNER_CONTEXT_EVIDENCE_BOUNDARY[action] === true;
}
