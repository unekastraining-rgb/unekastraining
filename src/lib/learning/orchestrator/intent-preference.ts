/**
 * Phase 2G-32 — Soft UNDERSTAND / PRACTICE preference within legal SIX candidates.
 *
 * Applied AFTER diagnosis. Never expands beyond the legal set for that state.
 * Never creates interventions. ASSESS / CREATE / absent → baseline unchanged.
 */

import type { SixComponent } from "@/lib/csl/six";
import type { LearningIntentPurpose } from "@/lib/learning/intent/types";
import type { OrchestratorDiagnosis } from "@/lib/learning/orchestrator/diagnose";

/** Understanding-family techniques unlocked UNDERSTANDING_GAP rule-3 may emit. */
const UNDERSTANDING_CO_ELIGIBLE: readonly SixComponent[] = [
  "detailed-explanation",
  "feynman",
  "visualization",
];

/** Soft UNDERSTAND preference among already-legal candidates. */
const UNDERSTAND_PREFERENCE: readonly SixComponent[] = [
  "detailed-explanation",
  "feynman",
  "visualization",
  "chunking",
  "active-recall",
];

/** Soft PRACTICE preference among already-legal candidates. */
const PRACTICE_PREFERENCE: readonly SixComponent[] = [
  "hands-on-practice",
  "active-recall",
];

/**
 * Legal SIX candidates for this diagnosis + baseline pick.
 * Facet-locked UNDERSTANDING_GAP → singleton (2G-18 rules 1–2).
 * Unlocked UNDERSTANDING_GAP → baseline ∪ understanding co-eligible family.
 * All other diagnoses → singleton baseline (cannot invent Hands-on, etc.).
 */
export function legalSixCandidates(
  diagnosis: OrchestratorDiagnosis,
  baseline: SixComponent | null,
  facetLocked: boolean,
): SixComponent[] {
  if (!baseline) return [];

  if (diagnosis === "UNDERSTANDING_GAP") {
    if (facetLocked) return [baseline];
    const set: SixComponent[] = [baseline];
    for (const component of UNDERSTANDING_CO_ELIGIBLE) {
      if (!set.includes(component)) set.push(component);
    }
    return set;
  }

  return [baseline];
}

/**
 * Soft preference among legal candidates only.
 */
export function applySoftIntentPreference(
  legalCandidates: readonly SixComponent[],
  baseline: SixComponent | null,
  purpose: LearningIntentPurpose | null | undefined,
): SixComponent | null {
  if (!baseline) return null;
  if (legalCandidates.length === 0) return baseline;
  if (!legalCandidates.includes(baseline)) return baseline;

  if (purpose !== "UNDERSTAND" && purpose !== "PRACTICE") {
    return baseline;
  }

  if (legalCandidates.length === 1) {
    return legalCandidates[0] ?? baseline;
  }

  const order =
    purpose === "UNDERSTAND" ? UNDERSTAND_PREFERENCE : PRACTICE_PREFERENCE;

  for (const preferred of order) {
    if (legalCandidates.includes(preferred)) {
      return preferred;
    }
  }

  return baseline;
}

/**
 * Resolve soft-preferred SIX component from diagnosis baseline + optional intent.
 */
export function preferSixWithIntent(input: {
  diagnosis: OrchestratorDiagnosis;
  baseline: SixComponent | null;
  facetLocked: boolean;
  purpose?: LearningIntentPurpose | null;
}): SixComponent | null {
  const legal = legalSixCandidates(
    input.diagnosis,
    input.baseline,
    input.facetLocked,
  );
  return applySoftIntentPreference(legal, input.baseline, input.purpose);
}
