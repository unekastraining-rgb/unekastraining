/**
 * 2P-15 — Content lifecycle projection helper.
 *
 * Maps existing pipeline + progression + coverage signals onto a conceptual
 * DRAFT → VALIDATE → READY → AVAILABLE → RETIRED flow.
 * Does not introduce CMS tables or mutate catalogs.
 */

import type { ContentLifecycleInput, ContentLifecyclePhase } from "./types";

/**
 * Resolve conceptual lifecycle phase from existing readiness signals.
 *
 * VALIDATE is an in-flight phase (validation running / issues present) —
 * not persisted as a separate catalog status.
 */
export function resolveContentLifecyclePhase(
  input: ContentLifecycleInput,
): ContentLifecyclePhase {
  const readiness = input.progressionReadiness ?? "READY";
  const pipeline = input.pipelineStatus ?? "DRAFT";

  if (readiness === "ARCHIVED" || pipeline === "ARCHIVED") {
    return "RETIRED";
  }

  if (readiness === "DRAFT" || pipeline === "DRAFT") {
    return "DRAFT";
  }

  if (input.catalogResolvable === false) {
    return "VALIDATE";
  }

  if (
    input.coverageAvailable === true &&
    (readiness === "PUBLISHED" || readiness === "READY") &&
    (pipeline === "PUBLISHED" || pipeline === "READY")
  ) {
    return "AVAILABLE";
  }

  if (pipeline === "READY" || pipeline === "PUBLISHED" || readiness === "READY") {
    return "READY";
  }

  return "DRAFT";
}

/** True when content may be shown to learners (matches 2P-10 AVAILABLE semantics). */
export function isLearnerFacingLifecyclePhase(
  phase: ContentLifecyclePhase,
): boolean {
  return phase === "AVAILABLE";
}

export function contentLifecycleTruthSummary(): {
  validateIsNotPersistedStatus: true;
  reusesPipelineStatuses: true;
  doesNotWriteMastery: true;
  retiredMapsToArchived: true;
} {
  return {
    validateIsNotPersistedStatus: true,
    reusesPipelineStatuses: true,
    doesNotWriteMastery: true,
    retiredMapsToArchived: true,
  };
}
