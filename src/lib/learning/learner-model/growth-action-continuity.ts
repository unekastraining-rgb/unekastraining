/**
 * 2P-22 — Learner Growth Center → existing ULE action continuity (pure helpers).
 *
 * Reuses Hub Adaptive CTA resolution. Does not diagnose, write evidence,
 * invent interventions, or create a GrowthOrchestrator / GrowthEngine.
 */

import {
  hubAdaptiveRunHref,
  resolveHubAdaptivePrimaryCta,
  resolveHubDirectSixSecondaryCta,
  type HubAdaptivePrimaryCta,
  type HubDirectSixSecondaryCta,
} from "@/lib/learning/orchestrator/hub-adaptive-bridge";

export type GrowthAdaptivePrimaryCta =
  | {
      kind: "resume";
      runId: string;
      label: "Continue learning";
      href: string;
    }
  | {
      kind: "start";
      conceptId: string;
      label: "Start learning";
    }
  | { kind: "none" };

/**
 * Growth Center Adaptive CTA — Start vs Continue over the same Hub contract.
 * Never fabricates conceptId or runId. Completed/abandoned runs are simply
 * absent from activeRunId (caller must only pass ACTIVE ids).
 */
export function resolveGrowthAdaptivePrimaryCta(input: {
  conceptId?: string | null;
  activeRunId?: string | null;
}): GrowthAdaptivePrimaryCta {
  const hub = resolveHubAdaptivePrimaryCta(input);
  if (hub.kind === "none") return { kind: "none" };
  if (hub.kind === "resume") {
    return {
      kind: "resume",
      runId: hub.runId,
      label: "Continue learning",
      href: hub.href,
    };
  }
  return {
    kind: "start",
    conceptId: hub.conceptId,
    label: "Start learning",
  };
}

/**
 * Map ACTIVE Adaptive runs → conceptId → runId (most recent first wins).
 * Ignores COMPLETED / ABANDONED — those must not appear in the input list.
 */
export function indexActiveRunIdByConcept(
  runs: Array<{ id: string; conceptId: string }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const run of runs) {
    const conceptId = typeof run.conceptId === "string" ? run.conceptId.trim() : "";
    const id = typeof run.id === "string" ? run.id.trim() : "";
    if (!conceptId || !id) continue;
    if (!out[conceptId]) out[conceptId] = id;
  }
  return out;
}

/** Existing soft fallback when Adaptive returns no_sequence — Study Hub, not a new engine. */
export const GROWTH_NO_SEQUENCE_FALLBACK_HREF = "/study" as const;
export const GROWTH_NO_SEQUENCE_FALLBACK_LABEL = "Open Study Hub" as const;

/**
 * Optional SIX secondary when Orchestrator already exposed a deep link.
 * Growth Center never invents SIX interventions.
 */
export function resolveGrowthSixFallback(input: {
  href?: string | null;
  actionLabel?: string | null;
}): HubDirectSixSecondaryCta | null {
  return resolveHubDirectSixSecondaryCta(input);
}

export function growthAdaptiveRunHref(runId: string): string {
  return hubAdaptiveRunHref(runId);
}

/** Section → action policy (documentation + tests). Presentation only. */
export const GROWTH_SECTION_ACTION_POLICY = {
  orchestratorRecommendation: "adaptive_primary_or_existing_orchestrator_card",
  needsPractice: "adaptive_via_continue_learning_button",
  developing: "adaptive_via_continue_learning_button_not_failure",
  insufficientEvidence: "informational_plus_orchestrator_when_available",
  whatIKnow: "informational_no_auto_launch",
  recentlyPracticed: "informational_learning_attempt_only",
} as const;

export function growthActionContinuityTruthSummary(): {
  createsGrowthEngine: false;
  createsRecommendationEngine: false;
  createsSecondAdaptive: false;
  createsGrowthTutor: false;
  createsGrowthLucky: false;
  createsGrowthCore: false;
  usesHubAdaptiveBridge: true;
  usesOrchestratorForRecommendation: true;
  inventsSixInterventions: false;
  resurrectsAbandonedRuns: false;
  autoRestartsCompletedRuns: false;
  trustsClientLearnerId: false;
} {
  return {
    createsGrowthEngine: false,
    createsRecommendationEngine: false,
    createsSecondAdaptive: false,
    createsGrowthTutor: false,
    createsGrowthLucky: false,
    createsGrowthCore: false,
    usesHubAdaptiveBridge: true,
    usesOrchestratorForRecommendation: true,
    inventsSixInterventions: false,
    resurrectsAbandonedRuns: false,
    autoRestartsCompletedRuns: false,
    trustsClientLearnerId: false,
  };
}

export type { HubAdaptivePrimaryCta, HubDirectSixSecondaryCta };
