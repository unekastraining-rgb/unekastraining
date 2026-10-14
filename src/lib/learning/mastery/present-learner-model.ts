/**
 * 2G-70 WS8 — Learner Model visibility (presentation only).
 *
 * Strengths / developing / needs practice / insufficient evidence /
 * recent demonstrated learning — from ConceptMastery + existing helpers.
 * Not a new Learner Model table. No raw evidence, no fake precision.
 */

import type { ConceptMasterySnapshot } from "@/lib/learning/mastery/mastery-truth";
import {
  presentConceptProgress,
  type ConceptProgressView,
} from "@/lib/learning/mastery/present-concept-progress";
import { CANONICAL_ULE_MASTERY_SOURCE } from "@/lib/learning/mastery/mastery-truth";

export type LearnerModelVisibilityItem = {
  conceptId: string;
  conceptTitle: string | null;
  progress: ConceptProgressView;
};

export type LearnerModelVisibility = {
  source: typeof CANONICAL_ULE_MASTERY_SOURCE;
  strengths: LearnerModelVisibilityItem[];
  developing: LearnerModelVisibilityItem[];
  needsMorePractice: LearnerModelVisibilityItem[];
  insufficientEvidence: LearnerModelVisibilityItem[];
  /** Soft recent list — titles only; no attempt IDs. */
  recentDemonstrated: Array<{ conceptId: string; conceptTitle: string | null }>;
};

export type LearnerModelConceptInput = {
  conceptId: string;
  conceptTitle?: string | null;
  conceptMastery: ConceptMasterySnapshot | null | undefined;
  /** Optional recency hint from caller (e.g. updatedAt) — not exposed as precision. */
  recentlyUpdated?: boolean;
};

/**
 * Build reusable learner-facing Learner Model view from ConceptMastery rows.
 * Pure — no DB, no evidence writes.
 */
export function presentLearnerModelVisibility(
  concepts: LearnerModelConceptInput[],
): LearnerModelVisibility {
  const strengths: LearnerModelVisibilityItem[] = [];
  const developing: LearnerModelVisibilityItem[] = [];
  const needsMorePractice: LearnerModelVisibilityItem[] = [];
  const insufficientEvidence: LearnerModelVisibilityItem[] = [];
  const recentDemonstrated: LearnerModelVisibility["recentDemonstrated"] = [];

  for (const row of concepts) {
    const progress = presentConceptProgress({
      conceptId: row.conceptId,
      conceptTitle: row.conceptTitle,
      conceptMastery: row.conceptMastery,
    });

    const item: LearnerModelVisibilityItem = {
      conceptId: row.conceptId,
      conceptTitle: row.conceptTitle ?? null,
      progress,
    };

    if (progress.status === "unavailable" || progress.status === "insufficient_evidence") {
      insufficientEvidence.push(item);
      continue;
    }

    const hasDemonstrated = progress.demonstrated.length > 0;
    const hasDeveloping = progress.dimensions.some((d) => d.status === "developing");
    const hasNeeds = progress.dimensions.some(
      (d) => d.status === "needs_more_practice",
    );

    if (hasDemonstrated && !hasNeeds && progress.mayNeedPractice.length === 0) {
      strengths.push(item);
    } else if (hasNeeds) {
      needsMorePractice.push(item);
    } else if (hasDeveloping || progress.mayNeedPractice.length > 0) {
      developing.push(item);
    } else if (hasDemonstrated) {
      strengths.push(item);
    } else {
      insufficientEvidence.push(item);
    }

    if (row.recentlyUpdated && hasDemonstrated) {
      recentDemonstrated.push({
        conceptId: row.conceptId,
        conceptTitle: row.conceptTitle ?? null,
      });
    }
  }

  return {
    source: CANONICAL_ULE_MASTERY_SOURCE,
    strengths,
    developing,
    needsMorePractice,
    insufficientEvidence,
    recentDemonstrated,
  };
}

/**
 * Focus concept for Adaptive CTA — prefer gaps, then developing, then strengths.
 * Never invents concept IDs. Presentation/navigation helper only.
 */
export function pickLearnerModelFocusConceptId(
  visibility: LearnerModelVisibility,
): string | null {
  const ordered = [
    ...visibility.needsMorePractice,
    ...visibility.developing,
    ...visibility.strengths,
    ...visibility.insufficientEvidence,
  ];
  for (const item of ordered) {
    const id = item.conceptId?.trim();
    if (id) return id;
  }
  return null;
}

/** True when there is no ConceptMastery-backed visibility to show. */
export function learnerModelIsColdStart(
  visibility: LearnerModelVisibility,
): boolean {
  return (
    visibility.strengths.length === 0 &&
    visibility.developing.length === 0 &&
    visibility.needsMorePractice.length === 0 &&
    visibility.insufficientEvidence.length === 0
  );
}

export function learnerModelVisibilityTruthSummary(): {
  createsNewLearnerModelTable: false;
  usesConceptMastery: true;
  exposesRawEvidence: false;
  exposesInternalThresholds: false;
  inventsFakePrecision: false;
} {
  return {
    createsNewLearnerModelTable: false,
    usesConceptMastery: true,
    exposesRawEvidence: false,
    exposesInternalThresholds: false,
    inventsFakePrecision: false,
  };
}
