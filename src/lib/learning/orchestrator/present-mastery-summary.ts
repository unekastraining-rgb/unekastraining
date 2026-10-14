/**
 * Phase 2G-63 — Presentation-only ConceptMastery summary for Study Hub.
 *
 * Source of truth: ConceptMastery facets already on OrchestratorResult.signals.
 * Never reads TopicMastery. Never invents a second mastery algorithm —
 * reuses Orchestrator WEAK/STRONG bands only.
 */

import {
  ORCHESTRATOR_FACET_STRONG,
  ORCHESTRATOR_FACET_WEAK,
  type OrchestratorDiagnosis,
  type OrchestratorResult,
} from "@/lib/learning/orchestrator/diagnose";
import { CANONICAL_ULE_MASTERY_SOURCE } from "@/lib/learning/mastery/mastery-truth";
import type { FacetedMasteryScores, MasteryFacetName } from "@/lib/learning/types";

export type OrchestratorMasteryBand =
  | "needs_practice"
  | "developing"
  | "looking_strong";

export type OrchestratorMasteryFocusFacet =
  | "recognize"
  | "explain"
  | "apply"
  | "retain";

/**
 * Learner-facing mastery context on OrchestratorSuggestionView.
 * Presentation only — not a second mastery model.
 */
export type OrchestratorMasterySummary = {
  source: typeof CANONICAL_ULE_MASTERY_SOURCE;
  /** Insufficient ULE ConceptMastery evidence (or Topic-fallback blocked). */
  kind: "insufficient_evidence" | "meaningful";
  /** Full secondary line for the Hub card. */
  stateLabel: string;
  band?: OrchestratorMasteryBand;
  focusFacet?: OrchestratorMasteryFocusFacet;
  /** Soft facet hint — complements, does not replace, Orchestrator reason. */
  focusHint?: string | null;
};

const INSUFFICIENT_LABEL = "Concept mastery: not enough evidence yet";

function bandForScore(score: number): OrchestratorMasteryBand {
  if (score < ORCHESTRATOR_FACET_WEAK) return "needs_practice";
  if (score >= ORCHESTRATOR_FACET_STRONG) return "looking_strong";
  return "developing";
}

function stateLabelForBand(band: OrchestratorMasteryBand): string {
  switch (band) {
    case "needs_practice":
      return "Concept mastery: needs more practice";
    case "looking_strong":
      return "Concept mastery: looking strong";
    case "developing":
      return "Concept mastery: developing";
  }
}

function focusHintForFacet(facet: OrchestratorMasteryFocusFacet): string {
  switch (facet) {
    case "recognize":
      return "Your recent work suggests more recognition practice may help.";
    case "explain":
      return "Your recent work suggests more explanation may help.";
    case "apply":
      return "Your recent work suggests more application practice may help.";
    case "retain":
      return "Your recent work suggests more recall practice may help.";
  }
}

/**
 * Pick the facet most aligned with the existing diagnosis (already ConceptMastery-based).
 */
export function focusFacetForDiagnosis(
  diagnosis: OrchestratorDiagnosis,
  facets: FacetedMasteryScores,
): OrchestratorMasteryFocusFacet | null {
  switch (diagnosis) {
    case "UNDERSTANDING_GAP":
      if (facets.explain + 0.05 < facets.recognize) return "explain";
      if (facets.recognize + 0.05 < facets.explain) return "recognize";
      return facets.explain <= facets.recognize ? "explain" : "recognize";
    case "APPLICATION_GAP":
      return "apply";
    case "RECALL_GAP":
    case "RETENTION_GAP":
      return "retain";
    case "INSUFFICIENT_EVIDENCE":
    case "NO_INTERVENTION":
      return null;
  }
}

/**
 * Build learner-facing ConceptMastery summary from Orchestrator signals.
 * TopicMastery fallback → insufficient (never present legacy progress as ULE mastery).
 */
export function buildOrchestratorMasterySummary(
  result: Pick<
    OrchestratorResult,
    "diagnosis" | "signals"
  >,
): OrchestratorMasterySummary {
  const { diagnosis, signals } = result;
  const { facets, reviewCount, usedTopicMasteryFallback } = signals;

  // Block TopicMastery-derived facet projections from learner-facing mastery claims.
  if (
    diagnosis === "INSUFFICIENT_EVIDENCE" ||
    usedTopicMasteryFallback ||
    reviewCount <= 0
  ) {
    return {
      source: CANONICAL_ULE_MASTERY_SOURCE,
      kind: "insufficient_evidence",
      stateLabel: INSUFFICIENT_LABEL,
    };
  }

  const focusFacet = focusFacetForDiagnosis(diagnosis, facets);
  const score =
    focusFacet != null
      ? facets[focusFacet]
      : Math.min(
          facets.recognize,
          facets.explain,
          facets.apply,
          facets.retain,
        );

  const band = bandForScore(score);

  return {
    source: CANONICAL_ULE_MASTERY_SOURCE,
    kind: "meaningful",
    band,
    stateLabel: stateLabelForBand(band),
    focusFacet: focusFacet ?? undefined,
    focusHint: focusFacet ? focusHintForFacet(focusFacet) : null,
  };
}

/** Test/helper: ensure facet names stay within canonical MasteryFacet set. */
export function isCanonicalFocusFacet(
  facet: string,
): facet is OrchestratorMasteryFocusFacet {
  return (
    facet === "recognize" ||
    facet === "explain" ||
    facet === "apply" ||
    facet === "retain"
  );
}

export function masterySummaryUsesOnlyConceptMastery(
  summary: OrchestratorMasterySummary,
): boolean {
  return summary.source === CANONICAL_ULE_MASTERY_SOURCE;
}

/** Map MasteryFacetName enum-style to focus facet when applicable. */
export function focusFacetFromMasteryFacetName(
  name: MasteryFacetName,
): OrchestratorMasteryFocusFacet | null {
  switch (name) {
    case "RECOGNIZE":
      return "recognize";
    case "EXPLAIN":
      return "explain";
    case "APPLY":
      return "apply";
    case "RETAIN":
      return "retain";
    default:
      return null;
  }
}
