/**
 * 2P-21 — Learner Growth Center projection (read-only product layer).
 *
 * Window into existing ULE truth — not a second Learner Model, mastery,
 * evidence, recommendation, or Adaptive engine.
 *
 * Evidence ← LearningAttempt (via presentRecentEvidence*)
 * Mastery ← ConceptMastery (via presentLearnerModelVisibility)
 * Recommendation ← Orchestrator (UI consumes existing card; not computed here)
 */

import {
  learnerModelIsColdStart,
  pickLearnerModelFocusConceptId,
  type LearnerModelVisibility,
} from "@/lib/learning/mastery/present-learner-model";
import { CANONICAL_ULE_MASTERY_SOURCE } from "@/lib/learning/mastery/mastery-truth";
import type { RecentEvidenceItem } from "@/lib/learning/learner-model/present-recent-evidence";

export type GrowthSnapshotKind =
  | "cold_start"
  | "insufficient_evidence"
  | "building"
  | "developing"
  | "needs_practice"
  | "demonstrated"
  | "recently_practiced";

export type GrowthCenterSnapshot = {
  kind: GrowthSnapshotKind;
  /** Short learner-safe headline — no fake % mastery. */
  headline: string;
  supportingLine: string;
};

export type GrowthCenterView = {
  source: typeof CANONICAL_ULE_MASTERY_SOURCE;
  snapshot: GrowthCenterSnapshot;
  visibility: LearnerModelVisibility;
  /** Actual LearningAttempt-backed timeline (may be empty). */
  recentEvidence: RecentEvidenceItem[];
  /**
   * Soft qualitative progress lines from existing mastery/evidence counts.
   * Never invents historical state transitions without data.
   */
  progressNotes: string[];
  focusConceptId: string | null;
  coldStart: boolean;
};

function buildSnapshot(
  visibility: LearnerModelVisibility,
  recentEvidenceCount: number,
): GrowthCenterSnapshot {
  if (learnerModelIsColdStart(visibility) && recentEvidenceCount === 0) {
    return {
      kind: "cold_start",
      headline: "Your learning profile is just getting started",
      supportingLine:
        "Complete a learning activity and Study Haul will begin building your learning model from real practice evidence.",
    };
  }

  if (learnerModelIsColdStart(visibility)) {
    return {
      kind: "building",
      headline: "Building understanding",
      supportingLine:
        "You have recent practice evidence. Concept mastery will fill in as Study Haul connects that evidence to concepts.",
    };
  }

  if (visibility.needsMorePractice.length > 0) {
    return {
      kind: "needs_practice",
      headline: "Some concepts need more practice",
      supportingLine:
        "Based on your concept mastery, a few areas would benefit from another round of practice — not a single score.",
    };
  }

  if (visibility.developing.length > 0) {
    return {
      kind: "developing",
      headline: "You are developing several concepts",
      supportingLine:
        "You have meaningful evidence, and these concepts are still building toward demonstrated mastery.",
    };
  }

  if (visibility.recentDemonstrated.length > 0) {
    return {
      kind: "recently_practiced",
      headline: "Recently practiced",
      supportingLine:
        "You have demonstrated learning on concepts updated in the last week — from recorded practice evidence, not page opens.",
    };
  }

  if (visibility.strengths.length > 0) {
    return {
      kind: "demonstrated",
      headline: "Strong evidence on several concepts",
      supportingLine:
        "Repeated practice evidence supports progress here. That is not the same as permanent mastery.",
    };
  }

  return {
    kind: "insufficient_evidence",
    headline: "Not enough evidence yet",
    supportingLine:
      "Study Haul does not invent zeros. Practice a concept and your learning model will grow from real attempts.",
  };
}

function buildProgressNotes(
  visibility: LearnerModelVisibility,
  recentEvidence: RecentEvidenceItem[],
): string[] {
  const notes: string[] = [];
  const demonstratedCount = visibility.strengths.length;
  const developingCount = visibility.developing.length;
  const successEvidence = recentEvidence.filter(
    (e) => e.outcomeLabel === "Success",
  ).length;

  if (demonstratedCount > 0) {
    notes.push(
      demonstratedCount === 1
        ? "You have demonstrated mastery on 1 concept."
        : `You have demonstrated mastery on ${demonstratedCount} concepts.`,
    );
  }
  if (developingCount > 0) {
    notes.push(
      developingCount === 1
        ? "1 concept is still developing."
        : `${developingCount} concepts are still developing.`,
    );
  }
  if (successEvidence >= 3) {
    notes.push(
      `Your recent attempts include ${successEvidence} successful practices.`,
    );
  }
  if (notes.length === 0) {
    notes.push("Keep practicing to build a learning trend.");
  }
  return notes;
}

/**
 * Compose Growth Center view from existing visibility + optional evidence timeline.
 * Pure — no diagnosis, no recommendation math, no Adaptive sequencing.
 */
export function presentGrowthCenter(input: {
  visibility: LearnerModelVisibility;
  recentEvidence?: RecentEvidenceItem[];
}): GrowthCenterView {
  const recentEvidence = input.recentEvidence ?? [];
  const coldStart = learnerModelIsColdStart(input.visibility);
  return {
    source: CANONICAL_ULE_MASTERY_SOURCE,
    snapshot: buildSnapshot(input.visibility, recentEvidence.length),
    visibility: input.visibility,
    recentEvidence,
    progressNotes: buildProgressNotes(input.visibility, recentEvidence),
    focusConceptId: pickLearnerModelFocusConceptId(input.visibility),
    coldStart,
  };
}

export function growthCenterTruthSummary(): {
  createsGrowthEngine: false;
  createsSecondLearnerModel: false;
  usesConceptMastery: true;
  usesLearningAttemptForEvidence: true;
  computesRecommendations: false;
  computesAdaptiveSequences: false;
  usesTopicMasteryAsUle: false;
  inventsFakePrecision: false;
} {
  return {
    createsGrowthEngine: false,
    createsSecondLearnerModel: false,
    usesConceptMastery: true,
    usesLearningAttemptForEvidence: true,
    computesRecommendations: false,
    computesAdaptiveSequences: false,
    usesTopicMasteryAsUle: false,
    inventsFakePrecision: false,
  };
}
