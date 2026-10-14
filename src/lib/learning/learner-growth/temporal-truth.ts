/**
 * 2P-43 — Temporal truth buckets from existing visibility (no mastery decay).
 */

import type { LearnerModelVisibility } from "@/lib/learning/mastery/present-learner-model";
import type {
  TemporalTruthBuckets,
  TemporalTruthItem,
} from "./types";

const RECENT_LABEL = "Recently demonstrated";
const HISTORICAL_LABEL = "Previously demonstrated";
const WEAK_LABEL = "Needs more practice";
const INSUFFICIENT_LABEL = "Needs more evidence";

/**
 * Partition existing Learner Model visibility into longitudinal temporal buckets.
 * Pure — does not invent decay or historical transition tables.
 */
export function presentTemporalTruthBuckets(
  visibility: LearnerModelVisibility,
): TemporalTruthBuckets {
  const recentIds = new Set(
    visibility.recentDemonstrated.map((r) => r.conceptId),
  );

  const recentlyDemonstrated: TemporalTruthItem[] =
    visibility.recentDemonstrated.map((r) => ({
      kind: "recently_demonstrated",
      conceptId: r.conceptId,
      conceptTitle: r.conceptTitle,
      learnerLabel: RECENT_LABEL,
    }));

  const historicallyDemonstrated: TemporalTruthItem[] = visibility.strengths
    .filter((s) => !recentIds.has(s.conceptId))
    .map((s) => ({
      kind: "historically_demonstrated",
      conceptId: s.conceptId,
      conceptTitle: s.conceptTitle,
      learnerLabel: HISTORICAL_LABEL,
    }));

  const currentlyWeak: TemporalTruthItem[] = visibility.needsMorePractice.map(
    (s) => ({
      kind: "currently_weak",
      conceptId: s.conceptId,
      conceptTitle: s.conceptTitle,
      learnerLabel: WEAK_LABEL,
    }),
  );

  const needsMoreEvidence: TemporalTruthItem[] =
    visibility.insufficientEvidence.map((s) => ({
      kind: "needs_more_evidence",
      conceptId: s.conceptId,
      conceptTitle: s.conceptTitle,
      learnerLabel: INSUFFICIENT_LABEL,
    }));

  return {
    recentlyDemonstrated,
    historicallyDemonstrated,
    currentlyWeak,
    needsMoreEvidence,
  };
}

export function temporalTruthTruthSummary(): {
  inventsMasteryDecay: false;
  inventsHistoricalTransitionStore: false;
  usesExistingVisibility: true;
  claimsForeverMastery: false;
} {
  return {
    inventsMasteryDecay: false,
    inventsHistoricalTransitionStore: false,
    usesExistingVisibility: true,
    claimsForeverMastery: false,
  };
}
