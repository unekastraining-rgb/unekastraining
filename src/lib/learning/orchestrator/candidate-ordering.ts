/**
 * Phase 2G-65 — ConceptMastery-aware Hub candidate ordering.
 *
 * Pure ranking only: runs BEFORE Orchestrator diagnosis.
 * Does not diagnose, mutate mastery, create attempts, or start Adaptive runs.
 * Reuses Orchestrator WEAK/STRONG bands — no new mastery math.
 */

import {
  ORCHESTRATOR_FACET_STRONG,
  ORCHESTRATOR_FACET_WEAK,
} from "@/lib/learning/orchestrator/diagnose";

/** Internal ordering state — not a second mastery model / not learner-facing. */
export type CandidateMasteryPriority =
  | "NEEDS_ATTENTION"
  | "DEVELOPING"
  | "STRONG"
  | "INSUFFICIENT_EVIDENCE"
  | "NO_CONCEPT_MASTERY";

/** Minimal ConceptMastery fields needed for Hub candidate priority. */
export type ConceptMasteryOrderingRow = {
  conceptId: string;
  recognize: number;
  explain: number;
  apply: number;
  retain: number;
  reviewCount: number;
  lastReviewedAt: Date | null;
};

export type OrderedCandidateInput = {
  conceptId: string;
  /** Stable discovery index (Topic sortOrder / fetch position). */
  discoveryIndex: number;
};

export type OrderedCandidate = OrderedCandidateInput & {
  priority: CandidateMasteryPriority;
  /** Lower = weaker ULE facets; null when no meaningful ConceptMastery. */
  weaknessScore: number | null;
};

const PRIORITY_RANK: Record<CandidateMasteryPriority, number> = {
  NEEDS_ATTENTION: 0,
  DEVELOPING: 1,
  STRONG: 2,
  // Neutral / last-resort — after strong so diagnosis can skip NO_INTERVENTION first,
  // then fall back to insufficient (matches suggest.ts prefer-gaps-over-insufficient).
  INSUFFICIENT_EVIDENCE: 3,
  NO_CONCEPT_MASTERY: 3,
};

/**
 * Primary ULE facets used for Hub priority (same set as mastery-summary fallback).
 * Does not invent TopicMastery projections.
 */
export function primaryUleFacetMin(row: ConceptMasteryOrderingRow): number {
  return Math.min(row.recognize, row.explain, row.apply, row.retain);
}

function facetSignal(row: ConceptMasteryOrderingRow): number {
  return row.recognize + row.explain + row.apply + row.retain;
}

/**
 * Classify ConceptMastery for ordering. Missing row → NO_CONCEPT_MASTERY
 * (not fake zero weakness, not TopicMastery).
 */
export function classifyConceptMasteryForOrdering(
  row: ConceptMasteryOrderingRow | null | undefined,
): { priority: CandidateMasteryPriority; weaknessScore: number | null } {
  if (!row) {
    return { priority: "NO_CONCEPT_MASTERY", weaknessScore: null };
  }

  // Align with diagnose insufficient gate: no reviews and empty facets → insufficient.
  if (row.reviewCount === 0 && facetSignal(row) < 0.01) {
    return { priority: "INSUFFICIENT_EVIDENCE", weaknessScore: null };
  }

  const min = primaryUleFacetMin(row);
  if (min < ORCHESTRATOR_FACET_WEAK) {
    return { priority: "NEEDS_ATTENTION", weaknessScore: min };
  }
  if (min < ORCHESTRATOR_FACET_STRONG) {
    return { priority: "DEVELOPING", weaknessScore: min };
  }
  return { priority: "STRONG", weaknessScore: min };
}

/**
 * Order resolved concept candidates by ConceptMastery only.
 * TopicMastery must not be passed in or consulted.
 */
export function orderCandidatesByConceptMastery(
  candidates: OrderedCandidateInput[],
  masteryByConceptId: ReadonlyMap<string, ConceptMasteryOrderingRow>,
): OrderedCandidate[] {
  const decorated: OrderedCandidate[] = candidates.map((c) => {
    const row = masteryByConceptId.get(c.conceptId);
    const { priority, weaknessScore } = classifyConceptMasteryForOrdering(
      row ?? null,
    );
    return { ...c, priority, weaknessScore };
  });

  decorated.sort((a, b) => {
    const rankDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (rankDiff !== 0) return rankDiff;

    // Weaker ConceptMastery first within NEEDS_ATTENTION / DEVELOPING / STRONG.
    if (a.weaknessScore != null && b.weaknessScore != null) {
      if (a.weaknessScore !== b.weaknessScore) {
        return a.weaknessScore - b.weaknessScore;
      }
    }

    // Soft evidence recency: older lastReviewedAt first among equal scores
    // (staler meaningful mastery before fresher). Missing dates sort after dated.
    const aRow = masteryByConceptId.get(a.conceptId);
    const bRow = masteryByConceptId.get(b.conceptId);
    const aTime = aRow?.lastReviewedAt?.getTime() ?? Number.POSITIVE_INFINITY;
    const bTime = bRow?.lastReviewedAt?.getTime() ?? Number.POSITIVE_INFINITY;
    if (aTime !== bTime) return aTime - bTime;

    // Deterministic discovery tie-break (Topic sortOrder / fetch index).
    return a.discoveryIndex - b.discoveryIndex;
  });

  return decorated;
}
