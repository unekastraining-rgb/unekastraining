/**
 * 2P-44 — Evidence sufficiency (read-side only).
 *
 * Answers how much meaningful LearningAttempt-backed evidence supports
 * mastery claims. Does not write evidence, change ConceptMastery math,
 * or introduce mastery decay.
 */

/**
 * Ladder (conceptual):
 * none → thin → emerging → adequate → rich
 */
export type EvidenceSufficiencyLevel =
  | "none"
  | "thin"
  | "emerging"
  | "adequate"
  | "rich";

/**
 * Thresholds aligned with existing Orchestrator confidence knobs
 * (`computeOrchestratorConfidence`) — not arbitrary new mastery bands.
 */
export const EVIDENCE_SUFFICIENCY_POLICY = {
  emergingMinReviews: 2,
  emergingMinEvents: 2,
  emergingMinSourceKinds: 2,
  adequateMinReviews: 3,
  adequateMinEvents: 4,
  adequateMinSourceKinds: 2,
  richMinReviews: 5,
  richMinEvents: 6,
  richMinSourceKinds: 3,
} as const;

export type EvidenceSufficiencyInput = {
  reviewCount: number;
  /** Total LearningAttempt events when known; defaults to reviewCount. */
  evidenceEvents?: number;
  /** Distinct producer/source kinds when known. */
  sourceKinds?: number;
};

/**
 * Classify how much evidence supports mastery/Orchestrator conclusions.
 * Deterministic. Pure — no DB.
 */
export function classifyEvidenceSufficiency(
  input: EvidenceSufficiencyInput,
): EvidenceSufficiencyLevel {
  const reviews = Math.max(0, Math.floor(Number(input.reviewCount) || 0));
  const events = Math.max(
    0,
    Math.floor(
      Number(
        input.evidenceEvents !== undefined
          ? input.evidenceEvents
          : input.reviewCount,
      ) || 0,
    ),
  );
  const kinds = Math.max(0, Math.floor(Number(input.sourceKinds) || 0));

  if (reviews === 0 && events === 0) return "none";

  const p = EVIDENCE_SUFFICIENCY_POLICY;

  if (
    reviews >= p.richMinReviews &&
    (kinds >= p.richMinSourceKinds || events >= p.richMinEvents)
  ) {
    return "rich";
  }

  if (
    reviews >= p.adequateMinReviews &&
    (kinds >= p.adequateMinSourceKinds || events >= p.adequateMinEvents)
  ) {
    return "adequate";
  }

  if (
    reviews >= p.emergingMinReviews ||
    events >= p.emergingMinEvents ||
    kinds >= p.emergingMinSourceKinds
  ) {
    return "emerging";
  }

  return "thin";
}

/** True when claims of “demonstrated / strong” should be softened. */
export function evidenceSufficiencyIsThin(
  level: EvidenceSufficiencyLevel,
): boolean {
  return level === "none" || level === "thin";
}

/** True when Orchestrator HIGH-confidence style claims are unsupported. */
export function evidenceSufficiencySupportsStrongClaims(
  level: EvidenceSufficiencyLevel,
): boolean {
  return level === "adequate" || level === "rich";
}

export function evidenceSufficiencyLearnerLabel(
  level: EvidenceSufficiencyLevel,
): string {
  switch (level) {
    case "none":
      return "No meaningful evidence yet";
    case "thin":
      return "Still building evidence";
    case "emerging":
      return "Emerging evidence";
    case "adequate":
      return "Repeated demonstrated evidence";
    case "rich":
      return "Strong demonstrated evidence";
  }
}

export function evidenceSufficiencyTruthSummary(): {
  createsSecondMasteryEngine: false;
  createsScoringEngine: false;
  inventsMasteryDecay: false;
  writesEvidence: false;
  usesLearningAttemptAsAuthority: true;
  alignsWithOrchestratorConfidence: true;
  deterministic: true;
} {
  return {
    createsSecondMasteryEngine: false,
    createsScoringEngine: false,
    inventsMasteryDecay: false,
    writesEvidence: false,
    usesLearningAttemptAsAuthority: true,
    alignsWithOrchestratorConfidence: true,
    deterministic: true,
  };
}
