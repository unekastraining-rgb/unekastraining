/**
 * 2P-47 — Creation authorship / artifact-vs-evidence contract (read-side + shared strip).
 * Creation is a learning activity, not a separate learning engine.
 * Artifact completion ≠ mastery.
 */

export {
  separateAiAssistanceFromEvidence,
  writingAiAssistanceBoundaryTruthSummary,
  WRITING_AI_ALLOWED_USES,
  WRITING_AI_FORBIDDEN_USES,
} from "@/lib/learning/activities/writing/ai-boundary";

/** Structured creation kinds that share the rubric textarea path. */
export const CREATION_ACTIVITY_KINDS = [
  "writing",
  "project",
  "presentation",
] as const;

export type CreationActivityKind = (typeof CREATION_ACTIVITY_KINDS)[number];

export function isCreationActivityKind(
  kind: string | null | undefined,
): kind is CreationActivityKind {
  return (
    typeof kind === "string" &&
    (CREATION_ACTIVITY_KINDS as readonly string[]).includes(kind)
  );
}

/**
 * Open / type / AI suggestion / save draft — not evidence.
 * Only meaningful learner submit may produce LearningAttempt.
 */
export function artifactVsEvidenceTruthSummary(): {
  openIsNotEvidence: true;
  typingIsNotMastery: true;
  aiSuggestionIsNotLearnerEvidence: true;
  saveDraftIsNotMastery: true;
  meaningfulSubmitMayProduceEvidence: true;
  artifactCompletionEqualsMastery: false;
  inventsWritingEngine: false;
  inventsProjectEngine: false;
  inventsPresentationEngine: false;
  inventsCreationGap: false;
  inventsSeventhFacet: false;
} {
  return {
    openIsNotEvidence: true,
    typingIsNotMastery: true,
    aiSuggestionIsNotLearnerEvidence: true,
    saveDraftIsNotMastery: true,
    meaningfulSubmitMayProduceEvidence: true,
    artifactCompletionEqualsMastery: false,
    inventsWritingEngine: false,
    inventsProjectEngine: false,
    inventsPresentationEngine: false,
    inventsCreationGap: false,
    inventsSeventhFacet: false,
  };
}

/**
 * Presentation honesty: slide/outline text ≠ speaking performance.
 * PERFORM only when the activity truly demonstrates delivery (or typed fallback
 * that is authored as demonstration practice — still not speech-quality scoring).
 */
export function presentationDemonstrationHonesty(): {
  outlineTextIsNotSpeakingEvidence: true;
  noSpeechQualityScoring: true;
  typedFallbackAllowed: true;
  slideCreationDistinctFromDemonstration: true;
} {
  return {
    outlineTextIsNotSpeakingEvidence: true,
    noSpeechQualityScoring: true,
    typedFallbackAllowed: true,
    slideCreationDistinctFromDemonstration: true,
  };
}

/**
 * Learner-safe Growth lines from creation evidence (read-side).
 * Does not invent an artifact growth store.
 */
export function interpretCreationEvidenceNote(input: {
  sourceKind?: string | null;
  outcome?: string | null;
  requiresRevision?: boolean | null;
}): string | null {
  const kind = (input.sourceKind ?? "").toLowerCase();
  const outcome = (input.outcome ?? "").toUpperCase();
  const ok = outcome === "SUCCESS" || outcome === "PARTIAL";

  if (kind.includes("writing")) {
    if (input.requiresRevision && ok) {
      return "You revised your work after feedback and submitted a writing demonstration.";
    }
    if (ok) {
      return "You demonstrated this skill through a written explanation.";
    }
    return "More evidence is needed before treating this writing skill as demonstrated.";
  }
  if (kind.includes("project")) {
    if (ok) {
      return "You demonstrated this concept in a project plan or build outline.";
    }
    return "More evidence is needed before treating this project skill as demonstrated.";
  }
  if (kind.includes("presentation")) {
    if (ok) {
      return "You practiced presenting the concept (outline / explanation practice — not a scored speech recording).";
    }
    return "More evidence is needed before treating this presentation skill as demonstrated.";
  }
  return null;
}

export function creationActivityTruthSummary(): {
  usesExistingStructuredPath: true;
  usesExistingLearningAttempt: true;
  usesExistingRubric: true;
  usesExistingAdaptiveContracts: true;
  coreNotesRemainOutsideEvidence: true;
  luckyUnchanged: true;
} {
  return {
    usesExistingStructuredPath: true,
    usesExistingLearningAttempt: true,
    usesExistingRubric: true,
    usesExistingAdaptiveContracts: true,
    coreNotesRemainOutsideEvidence: true,
    luckyUnchanged: true,
  };
}
