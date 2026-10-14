/**
 * 2P-28 — Material context display creates no evidence.
 */

export const MATERIAL_CONTEXT_EVIDENCE_BOUNDARY = {
  resolveCreatesLearningAttempt: false,
  displayCreatesLearningAttempt: false,
  viewSourceCreatesLearningAttempt: false,
  openMaterialCreatesLearningAttempt: false,
  tutorSourceChipCreatesLearningAttempt: false,
  adaptiveCitationCreatesLearningAttempt: false,
  activitySourceStripCreatesLearningAttempt: false,
  /** Only real activity interaction uses existing evidence spine. */
  activityInteractionMayCreateEvidence: true,
} as const;

export function materialContextCreatesEvidence(
  action: keyof typeof MATERIAL_CONTEXT_EVIDENCE_BOUNDARY,
): boolean {
  return MATERIAL_CONTEXT_EVIDENCE_BOUNDARY[action] === true;
}
