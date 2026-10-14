/**
 * 2P-18 — Writing learner artifact helpers.
 * Distinguishes prompt / draft / evaluation / revision / final / AI assistance.
 */

import type { WritingLearnerArtifact } from "./types";

export type WritingSubmissionFields = {
  /** Final text used for rubric evaluation (authoritative). */
  finalText: string;
  draft: string | null;
  revision: string | null;
  /** Never used as evidence — scaffold/coaching only. */
  aiAssistance: string | null;
};

/**
 * Extract writing fields from sanitized client work.
 * Prefer explicit final/revision/draft; fall back to text for non-revision activities.
 */
export function extractWritingSubmissionFields(
  work: Record<string, unknown>,
): WritingSubmissionFields {
  const asString = (v: unknown): string | null =>
    typeof v === "string" && v.trim() ? v : null;

  const draft = asString(work.draft);
  const revision = asString(work.revision) ?? asString(work.final);
  const text = asString(work.text) ?? asString(work.artifact) ?? asString(work.response);
  const aiAssistance = asString(work.aiAssistance) ?? asString(work.aiHelp);

  // Authoritative final: revision/final when present, else text/draft.
  const finalText = (revision ?? text ?? draft ?? "").trim();

  return {
    finalText,
    draft: draft ?? (text && !revision ? text : null),
    revision,
    aiAssistance,
  };
}

export function buildWritingLearnerArtifact(input: {
  prompt: string;
  fields: WritingSubmissionFields;
  evaluation: WritingLearnerArtifact["evaluation"];
}): WritingLearnerArtifact {
  return {
    prompt: input.prompt,
    draft: input.fields.draft,
    evaluation: input.evaluation,
    revision: input.fields.revision,
    finalSubmission: input.fields.finalText,
    learnerAuthored: true,
    aiAssistance: input.fields.aiAssistance,
  };
}

/**
 * AI assistance must remain distinguishable from learner evidence.
 * We never auto-copy aiAssistance into finalSubmission.
 */
export function resolveLearnerAuthoredText(fields: WritingSubmissionFields): string {
  // Explicit: ignore aiAssistance when choosing evidence text.
  return fields.finalText;
}

export function writingArtifactTruthSummary(): {
  distinguishesDraftFromFinal: true;
  aiAssistanceNeverAutoPromotedToEvidence: true;
  noAiDetector: true;
} {
  return {
    distinguishesDraftFromFinal: true,
    aiAssistanceNeverAutoPromotedToEvidence: true,
    noAiDetector: true,
  };
}
