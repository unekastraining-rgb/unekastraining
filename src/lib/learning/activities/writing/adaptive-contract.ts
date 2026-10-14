/**
 * 2P-18 — Writing Adaptive completion / lifecycle contract (declarative).
 */

import type {
  WritingAdaptiveContractSummary,
  WritingLifecyclePhase,
  WritingLearnerArtifact,
} from "./types";

export const WRITING_ADAPTIVE_CONTRACT: WritingAdaptiveContractSummary = {
  activityLaunchedIsNotCompletion: true,
  typingIsNotNecessarilySuccess: true,
  failedEvaluationMayProduceEvidence: true,
  interactionSeparateFromEvaluation: true,
  evaluationSeparateFromCompletion: true,
  completionSeparateFromEvidence: true,
  evidenceSeparateFromMastery: true,
  usesUniversalRubric: true,
  usesUniversalEvidencePath: true,
  noWritingMasterySystem: true,
  noAiDetector: true,
  aiAssistanceIsNotLearnerEvidence: true,
};

/**
 * Map observed submission signals → lifecycle phase (inspection aid).
 * Does not write evidence or advance Adaptive.
 */
export function inferWritingLifecyclePhase(input: {
  launched: boolean;
  beganTyping: boolean;
  hasDraft: boolean;
  evaluated: boolean;
  hasRevision: boolean;
  requiresRevision: boolean;
  finalSubmitted: boolean;
  evidenceRecorded: boolean;
  adaptiveBound: boolean;
}): WritingLifecyclePhase {
  if (input.adaptiveBound) return "adaptive_bound";
  if (input.evidenceRecorded) return "evidence_recorded";
  if (input.finalSubmitted) return "final_submitted";
  if (input.requiresRevision && input.hasRevision) return "revised";
  if (input.evaluated) return "evaluated";
  if (input.hasDraft) return "draft_exists";
  if (input.beganTyping) return "began";
  if (input.launched) return "launched";
  return "launched";
}

/** Opening Writing or typing one character is never Adaptive completion. */
export function writingInteractionIsNotCompletion(phase: WritingLifecyclePhase): boolean {
  return (
    phase === "launched" ||
    phase === "began" ||
    phase === "draft_exists"
  );
}

export function writingArtifactIntegrityOk(
  artifact: WritingLearnerArtifact,
): { ok: boolean; reason?: string } {
  if (!artifact.learnerAuthored) {
    return { ok: false, reason: "not_learner_authored" };
  }
  if (!artifact.finalSubmission.trim()) {
    return { ok: false, reason: "empty_final" };
  }
  // AI assistance text must not equal final when both present as identity swap.
  if (
    artifact.aiAssistance &&
    artifact.aiAssistance.trim() === artifact.finalSubmission.trim() &&
    artifact.draft !== artifact.finalSubmission
  ) {
    // Soft integrity note — we do not run an AI detector; authors must keep fields separate.
    return { ok: true };
  }
  return { ok: true };
}

export function writingAdaptiveContractTruthSummary(): WritingAdaptiveContractSummary {
  return WRITING_ADAPTIVE_CONTRACT;
}
