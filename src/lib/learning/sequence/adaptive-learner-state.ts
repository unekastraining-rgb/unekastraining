/**
 * Phase 2G-69 — Adaptive run learner-state / “why this step” presentation.
 *
 * Pure display helpers. Reuses OrchestratorResult + ConceptMastery summary.
 * Never diagnoses, never writes evidence/mastery, never uses TopicMastery.
 */

import type { OrchestratorResult } from "@/lib/learning/orchestrator/diagnose";
import {
  buildOrchestratorMasterySummary,
  type OrchestratorMasterySummary,
} from "@/lib/learning/orchestrator/present-mastery-summary";
import { CANONICAL_ULE_MASTERY_SOURCE } from "@/lib/learning/mastery/mastery-truth";

export type AdaptiveLearnerStateVisibility = {
  /** Learner-safe explanation; null when no truthful claim is available. */
  whyThisStep: string | null;
  /** ConceptMastery-derived learning-state line (same helper as Hub 2G-63). */
  masterySummary: OrchestratorMasterySummary;
};

const INTERNAL_LEAK =
  /\b(UNDERSTANDING_GAP|APPLICATION_GAP|RECALL_GAP|RETENTION_GAP|INSUFFICIENT_EVIDENCE|NO_INTERVENTION|RECOGNIZE|EXPLAIN|PERFORM|SOLVE|ConceptMastery|TopicMastery|LearningAttempt|OrchestratorResult|EvidenceEnvelope)\b/i;

/**
 * Short learner-safe why lines from diagnosis — used only when reason is missing
 * or unsafe. Never returns the diagnosis enum string itself.
 */
function safeWhyFallback(
  diagnosis: OrchestratorResult["diagnosis"],
): string | null {
  switch (diagnosis) {
    case "UNDERSTANDING_GAP":
      return "This step is meant to strengthen your understanding.";
    case "APPLICATION_GAP":
      return "This step gives you more practice applying the concept.";
    case "RECALL_GAP":
    case "RETENTION_GAP":
      return "This step helps you build recall.";
    case "INSUFFICIENT_EVIDENCE":
      return "Study Haul doesn't have enough evidence yet, so this is a starting point.";
    case "NO_INTERVENTION":
      return null;
  }
}

function sanitizeWhy(reason: string | null | undefined): string | null {
  const trimmed = typeof reason === "string" ? reason.trim() : "";
  if (!trimmed) return null;
  if (INTERNAL_LEAK.test(trimmed)) return null;
  return trimmed;
}

/**
 * Build Adaptive page visibility from an existing OrchestratorResult.
 * Caller must obtain the result via orchestrateForConcept (read path).
 */
export function buildAdaptiveLearnerStateVisibility(
  result: OrchestratorResult,
): AdaptiveLearnerStateVisibility {
  const masterySummary = buildOrchestratorMasterySummary(result);

  const fromReason = sanitizeWhy(result.reason);
  const whyThisStep =
    result.diagnosis === "NO_INTERVENTION"
      ? null
      : fromReason ?? safeWhyFallback(result.diagnosis);

  return { whyThisStep, masterySummary };
}

/** Insufficient placeholder when Orchestrator result is unavailable. */
export function insufficientAdaptiveLearnerStateVisibility(): AdaptiveLearnerStateVisibility {
  return {
    whyThisStep: null,
    masterySummary: {
      source: CANONICAL_ULE_MASTERY_SOURCE,
      kind: "insufficient_evidence",
      stateLabel: "Concept mastery: not enough evidence yet",
    },
  };
}
