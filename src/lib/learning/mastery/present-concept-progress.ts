/**
 * Learner-facing Concept Progress — presentation only (2G-70 WS1).
 *
 * ConceptMastery → resolveLearnerFacingUleMastery → this view model.
 * Never reads TopicMastery. Never invents mastery math. Never exposes
 * raw thresholds, attempt IDs, or evidence payloads.
 *
 * Viewing this model must not write evidence or mastery (pure function).
 */

import type { FacetedMasteryScores, MasteryFacetName } from "@/lib/learning/types";
import { MASTERY_FACETS } from "@/lib/learning/types";
import {
  ORCHESTRATOR_FACET_STRONG,
  ORCHESTRATOR_FACET_WEAK,
} from "@/lib/learning/orchestrator/diagnose";
import {
  calibrateFacetLearnerLine,
  calibrateFacetStatus,
  resolveSufficiencyForMasterySnapshot,
} from "@/lib/learning/mastery/mastery-calibration";
import {
  CANONICAL_ULE_MASTERY_SOURCE,
  resolveLearnerFacingUleMastery,
  resolveLearnerFacingUleMasteryIgnoringTopicProgress,
  type ConceptMasterySnapshot,
  type LearnerFacingUleMastery,
} from "./mastery-truth";

/** Learner-safe dimension status — no numeric thresholds exposed. */
export type ConceptProgressDimensionStatus =
  | "not_yet_evidenced"
  | "needs_more_practice"
  | "developing"
  | "demonstrated";

export type ConceptProgressDimension = {
  facet: MasteryFacetName;
  label: string;
  status: ConceptProgressDimensionStatus;
  /** Short learner-safe line — no scores, no internal band names required. */
  learnerLine: string;
};

export type ConceptProgressView =
  | {
      status: "available";
      source: typeof CANONICAL_ULE_MASTERY_SOURCE;
      conceptId: string;
      conceptTitle: string | null;
      headline: string;
      supportingLine: string;
      dimensions: ConceptProgressDimension[];
      unknownYet: string[];
      mayNeedPractice: string[];
      demonstrated: string[];
    }
  | {
      status: "insufficient_evidence";
      source: typeof CANONICAL_ULE_MASTERY_SOURCE;
      conceptId: string;
      conceptTitle: string | null;
      headline: string;
      supportingLine: string;
      dimensions: ConceptProgressDimension[];
      unknownYet: string[];
      mayNeedPractice: string[];
      demonstrated: string[];
    }
  | {
      status: "unavailable";
      source: typeof CANONICAL_ULE_MASTERY_SOURCE;
      conceptId: string | null;
      conceptTitle: string | null;
      headline: string;
      supportingLine: string;
      dimensions: [];
      unknownYet: [];
      mayNeedPractice: [];
      demonstrated: [];
    };

const FACET_LABELS: Record<MasteryFacetName, string> = {
  RECOGNIZE: "Recognition",
  EXPLAIN: "Explanation",
  APPLY: "Application",
  SOLVE: "Problem solving",
  PERFORM: "Performance",
  RETAIN: "Retention",
};

const FACET_SCORE_KEY: Record<MasteryFacetName, keyof FacetedMasteryScores> = {
  RECOGNIZE: "recognize",
  EXPLAIN: "explain",
  APPLY: "apply",
  SOLVE: "solve",
  PERFORM: "perform",
  RETAIN: "retain",
};

/**
 * Classify using the same Orchestrator WEAK/STRONG constants as
 * present-mastery-summary — never invent new mastery math.
 * Scores at empty (0) with no reviews are "not yet evidenced".
 */
function statusForFacetScore(
  score: number,
  hasReviews: boolean,
): ConceptProgressDimensionStatus {
  if (!hasReviews || score <= 0) return "not_yet_evidenced";
  if (score < ORCHESTRATOR_FACET_WEAK) return "needs_more_practice";
  if (score >= ORCHESTRATOR_FACET_STRONG) return "demonstrated";
  return "developing";
}

function dimensionLearnerLine(
  facet: MasteryFacetName,
  status: ConceptProgressDimensionStatus,
  sufficiency: ReturnType<typeof resolveSufficiencyForMasterySnapshot>,
): string {
  return calibrateFacetLearnerLine(FACET_LABELS[facet], status, sufficiency);
}

function buildDimensions(
  facets: FacetedMasteryScores,
  hasReviews: boolean,
  reviewCount: number,
): ConceptProgressDimension[] {
  const sufficiency = resolveSufficiencyForMasterySnapshot({ reviewCount });
  return MASTERY_FACETS.map((facet) => {
    const score = facets[FACET_SCORE_KEY[facet]];
    const raw = statusForFacetScore(score, hasReviews);
    const status = calibrateFacetStatus(raw, sufficiency);
    return {
      facet,
      label: FACET_LABELS[facet],
      status,
      learnerLine: dimensionLearnerLine(facet, status, sufficiency),
    };
  });
}

function emptyDimensions(): ConceptProgressDimension[] {
  const sufficiency = resolveSufficiencyForMasterySnapshot({ reviewCount: 0 });
  return MASTERY_FACETS.map((facet) => ({
    facet,
    label: FACET_LABELS[facet],
    status: "not_yet_evidenced" as const,
    learnerLine: dimensionLearnerLine(facet, "not_yet_evidenced", sufficiency),
  }));
}

function partitionLabels(dimensions: ConceptProgressDimension[]): {
  unknownYet: string[];
  mayNeedPractice: string[];
  demonstrated: string[];
} {
  const unknownYet: string[] = [];
  const mayNeedPractice: string[] = [];
  const demonstrated: string[] = [];
  for (const d of dimensions) {
    if (d.status === "not_yet_evidenced") unknownYet.push(d.label);
    else if (d.status === "needs_more_practice" || d.status === "developing") {
      mayNeedPractice.push(d.label);
    } else if (d.status === "demonstrated") demonstrated.push(d.label);
  }
  return { unknownYet, mayNeedPractice, demonstrated };
}

export type PresentConceptProgressInput = {
  conceptId: string | null | undefined;
  conceptTitle?: string | null;
  conceptMastery: ConceptMasterySnapshot | null | undefined;
  /**
   * Accepted only to prove TopicMastery is ignored — never used for claims.
   */
  topicMastery?: unknown;
};

/**
 * Small reusable Concept Progress view model for learner surfaces.
 * Pure — no DB, no evidence writes, no mastery writes.
 */
export function presentConceptProgress(
  input: PresentConceptProgressInput,
): ConceptProgressView {
  const conceptId = input.conceptId?.trim() || null;
  const conceptTitle = input.conceptTitle?.trim() || null;

  const ule = resolveLearnerFacingUleMasteryIgnoringTopicProgress({
    conceptMastery: input.conceptMastery,
    topicMastery: input.topicMastery,
  });

  if (ule.status === "unavailable") {
    if (ule.reason === "no_ule_reviews" && conceptId) {
      const dimensions = emptyDimensions();
      const parts = partitionLabels(dimensions);
      return {
        status: "insufficient_evidence",
        source: CANONICAL_ULE_MASTERY_SOURCE,
        conceptId,
        conceptTitle,
        headline: conceptTitle
          ? `Progress on ${conceptTitle}`
          : "Concept progress",
        supportingLine:
          "We have not recorded learning evidence for this concept yet. That is not the same as a score of zero — we simply do not know yet.",
        dimensions,
        ...parts,
      };
    }

    return {
      status: "unavailable",
      source: CANONICAL_ULE_MASTERY_SOURCE,
      conceptId,
      conceptTitle,
      headline: "Concept progress unavailable",
      supportingLine:
        "Learning progress for this concept is not available yet. Continue studying to build evidence.",
      dimensions: [],
      unknownYet: [],
      mayNeedPractice: [],
      demonstrated: [],
    };
  }

  const dimensions = buildDimensions(
    ule.facets,
    ule.reviewCount > 0,
    ule.reviewCount,
  );
  const parts = partitionLabels(dimensions);

  const supportingParts: string[] = [];
  if (parts.demonstrated.length > 0) {
    supportingParts.push(`Demonstrated: ${parts.demonstrated.join(", ")}.`);
  }
  if (parts.mayNeedPractice.length > 0) {
    supportingParts.push(
      `More practice may help with: ${parts.mayNeedPractice.join(", ")}.`,
    );
  }
  if (parts.unknownYet.length > 0) {
    supportingParts.push(
      `Not yet evidenced: ${parts.unknownYet.join(", ")}.`,
    );
  }

  return {
    status: "available",
    source: CANONICAL_ULE_MASTERY_SOURCE,
    conceptId: conceptId ?? "unknown",
    conceptTitle,
    headline: conceptTitle
      ? `Progress on ${conceptTitle}`
      : "Concept progress",
    supportingLine:
      supportingParts.join(" ") ||
      "Your learning evidence for this concept is recorded.",
    dimensions,
    ...parts,
  };
}

/** Prove presentation never reads TopicMastery APIs / invents math. */
export function conceptProgressTruthSummary(): {
  authority: typeof CANONICAL_ULE_MASTERY_SOURCE;
  usesTopicMastery: false;
  inventsMasteryMath: false;
  exposesRawThresholds: false;
  exposesAttemptIds: false;
  exposesEvidencePayloads: false;
  viewingWritesEvidence: false;
  viewingWritesMastery: false;
  reusesOrchestratorBands: true;
} {
  return {
    authority: CANONICAL_ULE_MASTERY_SOURCE,
    usesTopicMastery: false,
    inventsMasteryMath: false,
    exposesRawThresholds: false,
    exposesAttemptIds: false,
    exposesEvidencePayloads: false,
    viewingWritesEvidence: false,
    viewingWritesMastery: false,
    reusesOrchestratorBands: true,
  };
}

export function assertPresentConceptProgressUsesUleOnly(
  view: ConceptProgressView,
): void {
  if (view.source !== CANONICAL_ULE_MASTERY_SOURCE) {
    throw new Error("Concept Progress must use ConceptMastery ULE source only");
  }
}

/** Sanity: resolveLearnerFacingUleMastery is the only mastery resolver used upstream. */
export function resolveUleForConceptProgress(
  conceptMastery: ConceptMasterySnapshot | null | undefined,
): LearnerFacingUleMastery {
  return resolveLearnerFacingUleMastery(conceptMastery);
}
