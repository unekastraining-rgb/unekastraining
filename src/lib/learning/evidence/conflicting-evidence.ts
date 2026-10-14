/**
 * 2P-44 — Conflicting / mixed evidence interpretation (read-side).
 * Uses existing aggregation signals — does not invent a statistical model
 * or rewrite ConceptMastery.
 */

import type { EvidenceSignals } from "@/lib/learning/evidence/aggregation-types";
import type { EvidenceSufficiencyLevel } from "@/lib/learning/evidence/evidence-sufficiency";

export type ConflictingEvidenceReading =
  | "none"
  | "recent_failure_streak"
  | "recent_recovery"
  | "mixed_recent"
  | "historical_support_thin_recent";

/**
 * Interpret mixed outcomes using existing evidence-intelligence signals.
 * Presentation / soft guidance only.
 */
export function interpretConflictingEvidence(input: {
  signals?: EvidenceSignals | null;
  sufficiency: EvidenceSufficiencyLevel;
}): {
  reading: ConflictingEvidenceReading;
  learnerSafeLine: string | null;
} {
  const signals = input.signals;
  if (!signals) {
    return { reading: "none", learnerSafeLine: null };
  }

  const recentFails = signals.recentFailCount ?? 0;
  const recentSuccess = signals.recentSuccessCount ?? 0;
  const streak = signals.repeatedFailure;

  if (streak === "strong" || (streak === "possible" && recentFails >= 2)) {
    return {
      reading: "recent_failure_streak",
      learnerSafeLine:
        "Recent attempts show repeated difficulty — more practice is warranted even if older evidence looked stronger.",
    };
  }

  if (recentFails > 0 && recentSuccess > recentFails) {
    return {
      reading: "recent_recovery",
      learnerSafeLine:
        "Recent successful attempts follow earlier difficulty — progress is emerging, not permanent mastery.",
    };
  }

  if (recentFails > 0 && recentSuccess > 0) {
    return {
      reading: "mixed_recent",
      learnerSafeLine:
        "Recent evidence is mixed — Study Haul will not treat a single outcome as the whole story.",
    };
  }

  if (
    input.sufficiency === "thin" &&
    (signals.totalAttempts ?? 0) > 0 &&
    recentFails === 0 &&
    recentSuccess === 0
  ) {
    return {
      reading: "historical_support_thin_recent",
      learnerSafeLine:
        "Older evidence exists, but recent practice is limited — keep building evidence before strong claims.",
    };
  }

  return { reading: "none", learnerSafeLine: null };
}

export function conflictingEvidenceTruthSummary(): {
  inventsStatisticalModel: false;
  rewritesMastery: false;
  inventsMasteryDecay: false;
  usesExistingIntelligenceSignals: true;
} {
  return {
    inventsStatisticalModel: false,
    rewritesMastery: false,
    inventsMasteryDecay: false,
    usesExistingIntelligenceSignals: true,
  };
}
