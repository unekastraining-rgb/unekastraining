/**
 * 2G-73 — Universal Activity Adaptive completion contracts.
 *
 * Declares when an ACTIVITY Adaptive step is complete.
 * Launch/open alone never completes. Adaptive never fabricates LearningAttempts.
 *
 * PRODUCT-READY ≠ ADAPTIVE-READY.
 */

import type { EvidenceOutcomeName, MasteryFacetName } from "@/lib/learning/types";
import {
  getActivityInterventionCapability,
  type ActivityInterventionCapability,
} from "@/lib/learning/orchestrator/activity-intervention-capability";

export type ActivityAdaptiveCompletionContract = {
  adapterKey: string;
  activityType: ActivityInterventionCapability["activityType"];
  /** All lifecycle pieces exist for Adaptive step use. */
  adaptiveReady: true;
  /** sourceRef.kind values produced by the activity evidence bridge. */
  sourceRefKinds: readonly string[];
  requiredSkillFacets: readonly MasteryFacetName[];
  /**
   * Outcomes that satisfy the Adaptive completion gate.
   * Failed evaluations still count as completed *attempts* (like Quiz),
   * but ABANDONED never completes.
   */
  acceptOutcomes: readonly EvidenceOutcomeName[];
};

/**
 * Only activities with full launch → evidence → bind integration.
 * Writing Adaptive-ready in 2P-18; Game / Project Adaptive-ready in 2P-30.
 */
export const ACTIVITY_ADAPTIVE_COMPLETION_CONTRACTS: readonly ActivityAdaptiveCompletionContract[] =
  [
    {
      adapterKey: "coding",
      activityType: "CODING_CHALLENGE",
      adaptiveReady: true,
      sourceRefKinds: ["coding_challenge_submit"],
      requiredSkillFacets: ["PERFORM"],
      acceptOutcomes: ["SUCCESS", "PARTIAL", "FAIL"],
    },
    {
      adapterKey: "sql",
      activityType: "SQL_CHALLENGE",
      adaptiveReady: true,
      sourceRefKinds: ["sql_challenge_submit"],
      requiredSkillFacets: ["PERFORM"],
      acceptOutcomes: ["SUCCESS", "PARTIAL", "FAIL"],
    },
    {
      adapterKey: "math",
      activityType: "LAB",
      adaptiveReady: true,
      sourceRefKinds: ["math_workspace_submit"],
      requiredSkillFacets: ["SOLVE"],
      acceptOutcomes: ["SUCCESS", "PARTIAL", "FAIL"],
    },
    {
      adapterKey: "networking",
      activityType: "SIMULATION",
      adaptiveReady: true,
      sourceRefKinds: ["network_workspace_submit"],
      requiredSkillFacets: ["APPLY", "SOLVE", "PERFORM", "RETAIN"],
      acceptOutcomes: ["SUCCESS", "PARTIAL", "FAIL"],
    },
    {
      adapterKey: "language",
      activityType: "LAB",
      adaptiveReady: true,
      sourceRefKinds: ["language_workspace_submit"],
      requiredSkillFacets: ["RECOGNIZE", "APPLY", "SOLVE", "PERFORM", "RETAIN"],
      acceptOutcomes: ["SUCCESS", "PARTIAL", "FAIL"],
    },
    {
      adapterKey: "lab",
      activityType: "LAB",
      adaptiveReady: true,
      sourceRefKinds: ["lab_challenge_submit"],
      requiredSkillFacets: ["PERFORM"],
      acceptOutcomes: ["SUCCESS", "PARTIAL", "FAIL"],
    },
    {
      adapterKey: "simulation",
      activityType: "SIMULATION",
      adaptiveReady: true,
      sourceRefKinds: ["simulation_challenge_submit"],
      // Catalog includes APPLY (scenario) and SOLVE (diagnostic) sims — both
      // are valid evaluated attempts for Adaptive completion (2P-13 GAP-1).
      requiredSkillFacets: ["APPLY", "SOLVE"],
      acceptOutcomes: ["SUCCESS", "PARTIAL", "FAIL"],
    },
    {
      adapterKey: "presentation",
      activityType: "PRESENTATION_PRACTICE",
      adaptiveReady: true,
      sourceRefKinds: ["presentation_challenge_submit"],
      // Outline/explanation practice may be EXPLAIN; delivery-oriented rows PERFORM.
      requiredSkillFacets: ["PERFORM", "EXPLAIN"],
      acceptOutcomes: ["SUCCESS", "PARTIAL", "FAIL"],
    },
    {
      adapterKey: "writing",
      activityType: "WRITING_EXERCISE",
      adaptiveReady: true,
      sourceRefKinds: ["writing_challenge_submit"],
      // Catalog includes EXPLAIN/APPLY/SOLVE/RETAIN writing — Adaptive must accept authored facets.
      requiredSkillFacets: ["EXPLAIN", "APPLY", "SOLVE", "RETAIN"],
      acceptOutcomes: ["SUCCESS", "PARTIAL", "FAIL"],
    },
    {
      adapterKey: "game",
      activityType: "GAME",
      adaptiveReady: true,
      sourceRefKinds: ["game_challenge_submit"],
      // Vocab/term match games demonstrate recognition — points alone ≠ mastery.
      requiredSkillFacets: ["RECOGNIZE"],
      acceptOutcomes: ["SUCCESS", "PARTIAL", "FAIL"],
    },
    {
      adapterKey: "project",
      activityType: "PROJECT_TASK",
      adaptiveReady: true,
      sourceRefKinds: ["project_challenge_submit"],
      // Project outlines demonstrate application of planning/criteria.
      requiredSkillFacets: ["APPLY"],
      acceptOutcomes: ["SUCCESS", "PARTIAL", "FAIL"],
    },
  ];

export function getActivityAdaptiveCompletionContract(
  adapterKey: string,
): ActivityAdaptiveCompletionContract | null {
  const key = adapterKey.trim().toLowerCase();
  return (
    ACTIVITY_ADAPTIVE_COMPLETION_CONTRACTS.find((c) => c.adapterKey === key) ??
    null
  );
}

export function isAdaptiveReadyActivityAdapterKey(
  adapterKey: string | null | undefined,
): boolean {
  if (!adapterKey) return false;
  return getActivityAdaptiveCompletionContract(adapterKey) != null;
}

/** Intervention strings stored on AdaptiveSequenceStep.intervention */
export function normalizeUniversalActivityIntervention(
  raw: string | null | undefined,
): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase().replace(/_/g, "-");
  if (!trimmed) return null;
  // pathKind / adapterKey alignment (coding, sql, lab, …)
  const contract = getActivityAdaptiveCompletionContract(trimmed);
  if (contract) return contract.adapterKey;
  // Also accept capability pathKind aliases
  const capability = getActivityInterventionCapability(trimmed);
  if (
    capability &&
    isAdaptiveReadyActivityAdapterKey(capability.adapterKey)
  ) {
    return capability.adapterKey;
  }
  return null;
}

export function isSupportedUniversalActivityIntervention(
  raw: string | null | undefined,
): boolean {
  return normalizeUniversalActivityIntervention(raw) != null;
}

export function activityAdaptiveCompletionTruthSummary(): {
  launchCompletesStep: false;
  openCompletesStep: false;
  adaptiveCreatesLearningAttempt: false;
  fabricationAllowed: false;
  productReadyMeansAdaptiveReady: false;
} {
  return {
    launchCompletesStep: false,
    openCompletesStep: false,
    adaptiveCreatesLearningAttempt: false,
    fabricationAllowed: false,
    productReadyMeansAdaptiveReady: false,
  };
}
