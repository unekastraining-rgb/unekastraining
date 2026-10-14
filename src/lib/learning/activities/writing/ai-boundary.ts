/**
 * 2P-18 — AI assistance boundary for Writing.
 * AI may scaffold/coach; must not become authoritative learner evidence.
 * No AI detector; no academic-integrity evasion tooling.
 */

export const WRITING_AI_ALLOWED_USES = [
  "explanations",
  "brainstorming_prompts",
  "socratic_questioning",
  "scaffolding",
  "structural_issue_hints",
  "revision_area_suggestions",
  "citation_explanations",
  "teaching_writing_concepts",
] as const;

export const WRITING_AI_FORBIDDEN_USES = [
  "silent_promotion_of_ai_text_to_learner_evidence",
  "ai_detector",
  "academic_integrity_evasion",
  "forging_SUCCESS_outcome",
] as const;

/**
 * Keep AI help out of the evidence artifact string.
 * If the client only sent aiAssistance, evidence text is empty (FAIL).
 */
export function separateAiAssistanceFromEvidence(input: {
  learnerText: string;
  aiAssistance: string | null;
}): { evidenceText: string; aiAssistance: string | null } {
  const learner = input.learnerText.trim();
  const ai = input.aiAssistance?.trim() || null;
  // Never substitute AI text when learner text is empty.
  if (!learner) {
    return { evidenceText: "", aiAssistance: ai };
  }
  return { evidenceText: learner, aiAssistance: ai };
}

export function writingAiAssistanceBoundaryTruthSummary(): {
  aiMayAssistLearning: true;
  aiTextIsNotAuthoritativeEvidence: true;
  noAiDetector: true;
  noIntegrityEvasion: true;
} {
  return {
    aiMayAssistLearning: true,
    aiTextIsNotAuthoritativeEvidence: true,
    noAiDetector: true,
    noIntegrityEvasion: true,
  };
}
