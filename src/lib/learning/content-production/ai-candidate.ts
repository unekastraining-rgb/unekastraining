/**
 * 2P-15 — Safe AI-generated content candidate entry point.
 *
 * AI (future) produces candidate PreparedLearningContent only.
 * Validation reuses 2P-8 pipeline — never writes mastery, evidence, or attempts.
 */

import {
  runContentPipeline,
  type ContentPreparationInput,
} from "@/lib/learning/content-pipeline";
import type { AiContentCandidateResult } from "./types";

export type ValidateAiContentCandidateInput = ContentPreparationInput & {
  learnerId?: string | null;
  /** Require owned Concept when conceptId is present. */
  requireOwnedConcept?: boolean;
  /** When true, promote to PUBLISHED after validation (still not learner evidence). */
  publish?: boolean;
};

/**
 * Validate an AI-generated (or human) content candidate through the existing pipeline.
 *
 * Flow:
 * candidate → prepare → validate schema/contract → optional publish
 *
 * Does NOT create ConceptMastery, LearningAttempt, evidence, or mastery scores.
 */
export async function validateAiContentCandidate(
  input: ValidateAiContentCandidateInput,
): Promise<AiContentCandidateResult> {
  const result = await runContentPipeline({
    ...input,
    confirmed: input.confirmed ?? false,
    learnerId: input.learnerId,
    requireOwnedConcept: input.requireOwnedConcept,
    publish: input.publish,
  });

  if (!result.ok) {
    return {
      ok: false,
      candidate: true,
      doesNotWriteMastery: true,
      issues: result.issues,
    };
  }

  return {
    ok: true,
    candidate: true,
    doesNotWriteMastery: true,
    doesNotWriteEvidence: true,
    preparationId: result.content.preparationId,
    contentId: result.content.contentId,
    activityKind: result.content.activityKind,
  };
}

export function aiContentCandidateTruthSummary(): {
  candidateIsNotEvidence: true;
  candidateIsNotMastery: true;
  usesExistingPipeline: true;
  noSecondContentSystem: true;
} {
  return {
    candidateIsNotEvidence: true,
    candidateIsNotMastery: true,
    usesExistingPipeline: true,
    noSecondContentSystem: true,
  };
}
