/**
 * 2P-27 — Evidence / mastery boundary for material ingestion.
 * Upload, open, extract, and concept confirm must NOT create LearningAttempt.
 */

export const MATERIAL_INGESTION_EVIDENCE_BOUNDARY = {
  uploadCreatesLearningAttempt: false,
  openCreatesLearningAttempt: false,
  extractCreatesLearningAttempt: false,
  conceptConfirmCreatesLearningAttempt: false,
  ordinaryTutorQaCreatesEvidence: false,
  activityInteractionMayCreateEvidence: true,
  readingCreatesConceptMastery: false,
} as const;

export function materialIngestionCreatesEvidence(action: keyof typeof MATERIAL_INGESTION_EVIDENCE_BOUNDARY): boolean {
  return MATERIAL_INGESTION_EVIDENCE_BOUNDARY[action] === true;
}
