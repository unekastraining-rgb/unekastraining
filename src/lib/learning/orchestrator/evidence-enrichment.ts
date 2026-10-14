import type {
  OrchestratorDiagnosis,
  OrchestratorResult,
} from "@/lib/learning/orchestrator/diagnose";
import { isEvidenceIntelligenceEnabled } from "@/lib/learning/evidence/intelligence-flag";
import type { EvidenceSignals } from "@/lib/learning/evidence/aggregation-types";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";

export type EvidenceHint = {
  kind: "repeated_failure" | "misconception" | "facet_failure";
  reason: string;
};

const GAP_DIAGNOSES: ReadonlySet<OrchestratorDiagnosis> = new Set([
  "UNDERSTANDING_GAP",
  "APPLICATION_GAP",
  "RECALL_GAP",
  "RETENTION_GAP",
]);

/**
 * Secondary evidence hints after primary diagnosis (Phase 2F-2).
 * Never changes diagnosis enum or SIX intervention kind.
 */
export function enrichOrchestratorWithEvidenceSignals(
  result: OrchestratorResult,
  summary: LearnerConceptMasterySummary,
): OrchestratorResult {
  if (!isEvidenceIntelligenceEnabled()) {
    return result;
  }

  if (!GAP_DIAGNOSES.has(result.diagnosis)) {
    return result;
  }

  const signals = summary.evidenceSignals;
  if (!signals || signals.totalAttempts === 0) {
    return result;
  }

  try {
    const hints = buildEvidenceHints(result.diagnosis, signals);
    if (hints.length === 0) {
      return result;
    }

    const hintReasons = hints.map((hint) => hint.reason).join(" ");
    return {
      ...result,
      reason: `${result.reason} ${hintReasons}`,
      evidenceHints: hints,
    };
  } catch (error) {
    console.error("Orchestrator evidence enrichment failed:", error);
    return result;
  }
}

function buildEvidenceHints(
  diagnosis: OrchestratorDiagnosis,
  signals: EvidenceSignals,
): EvidenceHint[] {
  const hints: EvidenceHint[] = [];

  if (signals.repeatedFailure === "strong") {
    hints.push({
      kind: "repeated_failure",
      reason:
        "Recent attempts also show repeated difficulty on this concept, so another careful pass may help.",
    });
  } else if (signals.repeatedFailure === "possible") {
    hints.push({
      kind: "repeated_failure",
      reason:
        "Recent attempts include more than one miss on this concept, so it may be worth slowing down on the next try.",
    });
  }

  const topMisconception = signals.misconceptionSignals.find(
    (item) => item.count >= 2,
  );
  if (topMisconception) {
    const cleaned = topMisconception.signal
      .replace(/^misconception:/i, "")
      .replace(/^gap:/i, "")
      .replace(/^quiz_miss:/i, "quiz type ")
      .trim();
    hints.push({
      kind: "misconception",
      reason: `A repeated error pattern has appeared in recent evidence around “${cleaned}.”`,
    });
  }

  // Facet-specific soft note aligned with existing diagnosis — do not override.
  if (diagnosis === "APPLICATION_GAP") {
    const apply = signals.facetOutcomes.APPLY;
    if (apply.failCount >= 2 && apply.failCount > apply.successCount) {
      hints.push({
        kind: "facet_failure",
        reason:
          "Recent practice attempts on applying this concept have often been incomplete, so Hands-on Practice remains a useful next step.",
      });
    }
  }

  if (diagnosis === "UNDERSTANDING_GAP") {
    const explain = signals.facetOutcomes.EXPLAIN;
    if (explain.failCount >= 2 && explain.failCount > explain.successCount) {
      hints.push({
        kind: "facet_failure",
        reason:
          "Recent attempts suggest this concept may need another explanation before moving on.",
      });
    }
  }

  // Cap soft hints to avoid noisy reasons.
  return hints.slice(0, 2);
}
