/**
 * 2G-72 / 2G-74 — Activity intervention policy (post-diagnosis).
 *
 * Layers (never collapsed):
 *   diagnosis → capability → compatibility → availability → ranking
 *   → optional activityIntervention metadata
 *
 * Never mutates diagnosis. Never creates LearningAttempt / ConceptMastery.
 * Never selects assessment-only or CREATE-only activities as generic interventions.
 * Insufficient / NO_MATCH / unavailable → SIX-first (no activityIntervention).
 */

import type { LearningIntentPurpose } from "@/lib/learning/intent/types";
import type {
  OrchestratorDiagnosis,
  OrchestratorResult,
} from "@/lib/learning/orchestrator/diagnose";
import {
  ACTIVITY_INTERVENTION_CAPABILITIES,
  type ActivityInterventionCapability,
} from "@/lib/learning/orchestrator/activity-intervention-capability";
import {
  evaluateActivityCompatibility,
  type ActivityCompatibilityResult,
  type ActivitySelectionContext,
} from "@/lib/learning/orchestrator/activity-intervention-compatibility";
import {
  pickTopRankedActivityCandidate,
  rankActivityInterventionCandidates,
} from "@/lib/learning/orchestrator/activity-intervention-ranking";

/** Additive Orchestrator suggestion — does not replace SIX `intervention`. */
export type OrchestratorActivityIntervention = {
  kind: "activity";
  activityType: ActivityInterventionCapability["activityType"];
  adapterKey: string;
  title: string;
  /** Deep link into existing activity surface (owned conceptId required). */
  href: string;
  /** Grounded in diagnosis — not “because available”. */
  reason: string;
  evidenceFacet: ActivityInterventionCapability["evidenceFacetsProduced"][number];
};

export type ActivityInterventionPolicyInput = {
  diagnosis: OrchestratorDiagnosis;
  conceptId: string;
  conceptTitle: string;
  topicName?: string | null;
  subjectDomain?: string | null;
  /** Soft preference only — never overrides diagnosis legality. */
  intentPurpose?: LearningIntentPurpose | null;
  /**
   * 2P-42 — Soft-demote recently used Adaptive activity adapter keys.
   * Never removes a sole legal match (variety is not forced).
   */
  recentAdapterKeys?: readonly string[] | null;
  /**
   * 2P-42 — Soft-prefer SOLVE-producing adapters under APPLICATION_GAP
   * when solve facet is weak. Does not invent a SOLVE diagnosis.
   */
  preferSolveProducers?: boolean;
  /**
   * 2P-45 — Soft-prefer performCapable adapters under APPLICATION_GAP
   * when perform facet is weak. Does not invent PERFORM_GAP.
   */
  preferPerformProducers?: boolean;
  /**
   * 2P-47 — Soft-prefer creation-characteristic adapters (writing/project)
   * under APPLICATION_GAP when apply is weak. Does not invent CREATION_GAP.
   */
  preferCreationProducers?: boolean;
  /**
   * 2P-42 — Hard-exclude adapter keys when picking an immediate-repeat alternate.
   */
  excludeAdapterKeys?: readonly string[] | null;
};

function selectionContextFromInput(
  input: ActivityInterventionPolicyInput,
): ActivitySelectionContext {
  return {
    conceptTitle: input.conceptTitle,
    topicName: input.topicName,
    subjectDomain: input.subjectDomain,
  };
}

/**
 * Boolean shim over compatibility MATCH.
 * Prefer evaluateCapabilityCompatibilityForSituation for status detail.
 */
export function conceptContextMatchesCapability(
  capability: ActivityInterventionCapability,
  input: ActivityInterventionPolicyInput,
): boolean {
  return (
    evaluateActivityCompatibility(capability, selectionContextFromInput(input))
      .status === "MATCH"
  );
}

/**
 * Capability alone — theoretical fitness (not availability, not compatibility).
 */
export function isCapabilityLegalForSituation(
  capability: ActivityInterventionCapability,
  input: ActivityInterventionPolicyInput,
): boolean {
  if (!capability.interventionEligible) return false;
  if (capability.assessmentOnly) return false;
  if (capability.createOnly) return false;
  if (capability.role === "foundation_not_selectable") return false;
  if (capability.role === "assessment_only") return false;
  if (capability.role === "create_only") return false;

  // Diagnoses that must stay conservative / specialized.
  if (
    input.diagnosis === "INSUFFICIENT_EVIDENCE" ||
    input.diagnosis === "NO_INTERVENTION" ||
    input.diagnosis === "UNDERSTANDING_GAP" ||
    input.diagnosis === "RECALL_GAP" ||
    input.diagnosis === "RETENTION_GAP"
  ) {
    return false;
  }

  if (!capability.supportedDiagnoses.includes(input.diagnosis)) {
    return false;
  }

  // Intent soft preference: when requiresExplicitIntent, PRACTICE/CREATE must match.
  // ASSESS never unlocks generic intervention selection (Assessment workflow owns ASSESS).
  if (input.intentPurpose === "ASSESS") {
    return false;
  }
  if (input.intentPurpose === "CREATE") {
    return false;
  }
  if (capability.requiresExplicitIntent) {
    const purpose = input.intentPurpose ?? null;
    if (!purpose || !capability.supportedIntents.includes(purpose)) {
      return false;
    }
  }

  return true;
}

/**
 * Compatibility — does the activity fit the concept/context?
 * Separate from capability and availability.
 */
export function evaluateCapabilityCompatibilityForSituation(
  capability: ActivityInterventionCapability,
  input: ActivityInterventionPolicyInput,
): ActivityCompatibilityResult {
  return evaluateActivityCompatibility(
    capability,
    selectionContextFromInput(input),
  );
}

/**
 * Availability — learner can actually use this activity for this concept now.
 * Does not invent activity IDs; uses integrated launch path + owned conceptId.
 * Does NOT check compatibility (that is a separate layer).
 * Adaptive-ready required for Orchestrator auto-select (2G-73/2G-74).
 */
export function isCapabilityAvailableForSituation(
  capability: ActivityInterventionCapability,
  input: ActivityInterventionPolicyInput,
): boolean {
  if (!input.conceptId.trim()) return false;
  if (!capability.launchIntegrated) return false;
  if (!capability.evidenceIntegrated) return false;
  if (!capability.adaptiveBindIntegrated) return false;
  return true;
}

export function reasonForActivityIntervention(
  capability: ActivityInterventionCapability,
  diagnosis: OrchestratorDiagnosis,
  varietyNote?: "alternate" | "fresh" | null,
): string {
  const variety =
    varietyNote === "alternate"
      ? " Let's try this idea in a different practice format."
      : varietyNote === "fresh"
        ? " Now try using this idea in practice."
        : "";
  switch (diagnosis) {
    case "APPLICATION_GAP":
      return `Your recent evidence suggests an application gap. ${capability.learnerTitle} can give objective practice on this concept when it fits the subject.${variety}`;
    default:
      return `${capability.learnerTitle} is a possible practice option for this diagnosis when it fits the concept.${variety}`;
  }
}

export function buildActivityInterventionHref(
  capability: ActivityInterventionCapability,
  conceptId: string,
): string {
  return `/study/activities/${capability.pathKind}?conceptId=${encodeURIComponent(conceptId)}`;
}

export type ResolvedActivityInterventionCandidate = {
  capability: ActivityInterventionCapability;
  compatibility: ActivityCompatibilityResult;
};

/**
 * Ranked candidate pipeline:
 * capability legal → compatibility MATCH → available → deterministic rank.
 */
export function resolveRankedActivityInterventionCandidates(
  input: ActivityInterventionPolicyInput,
): ResolvedActivityInterventionCandidate[] {
  const hardExclude = new Set(
    (input.excludeAdapterKeys ?? []).map((k) => k.trim()).filter(Boolean),
  );
  const matched: ResolvedActivityInterventionCandidate[] = [];
  for (const capability of ACTIVITY_INTERVENTION_CAPABILITIES) {
    if (hardExclude.has(capability.adapterKey)) continue;
    if (!isCapabilityLegalForSituation(capability, input)) continue;
    const compatibility = evaluateCapabilityCompatibilityForSituation(
      capability,
      input,
    );
    if (compatibility.status !== "MATCH") continue;
    if (!isCapabilityAvailableForSituation(capability, input)) continue;
    matched.push({ capability, compatibility });
  }

  return rankActivityInterventionCandidates(matched, {
    demoteAdapterKeys: input.recentAdapterKeys ?? undefined,
    preferSolveProducers: input.preferSolveProducers,
    preferPerformProducers: input.preferPerformProducers,
    preferCreationProducers: input.preferCreationProducers,
  }).map((r) => ({
    capability: r.capability,
    compatibility: r.compatibility,
  }));
}

/**
 * Deterministic candidate filter — capabilities only (ranked order).
 */
export function resolveLegalActivityInterventionCandidates(
  input: ActivityInterventionPolicyInput,
): ActivityInterventionCapability[] {
  return resolveRankedActivityInterventionCandidates(input).map(
    (c) => c.capability,
  );
}

/**
 * Pick at most one additive activity suggestion (top ranked).
 * SIX primary intervention is never replaced here.
 */
export function selectActivityIntervention(
  input: ActivityInterventionPolicyInput,
): OrchestratorActivityIntervention | null {
  const ranked = resolveRankedActivityInterventionCandidates(input);
  const top = pickTopRankedActivityCandidate(ranked, {
    demoteAdapterKeys: input.recentAdapterKeys ?? undefined,
    preferSolveProducers: input.preferSolveProducers,
    preferPerformProducers: input.preferPerformProducers,
    preferCreationProducers: input.preferCreationProducers,
  });
  if (!top) return null;

  const chosen = top.capability;
  const facet = chosen.evidenceFacetsProduced[0] ?? "APPLY";
  const excluded = new Set(
    (input.excludeAdapterKeys ?? []).map((k) => k.trim()).filter(Boolean),
  );
  const varietyNote =
    excluded.size > 0
      ? ("alternate" as const)
      : (input.recentAdapterKeys?.length ?? 0) > 0 &&
          !(input.recentAdapterKeys ?? []).includes(chosen.adapterKey)
        ? ("fresh" as const)
        : null;
  return {
    kind: "activity",
    activityType: chosen.activityType,
    adapterKey: chosen.adapterKey,
    title: chosen.learnerTitle,
    href: buildActivityInterventionHref(chosen, input.conceptId),
    reason: reasonForActivityIntervention(
      chosen,
      input.diagnosis,
      varietyNote,
    ),
    evidenceFacet: facet,
  };
}

/**
 * Attach optional activityIntervention without changing diagnosis or SIX intervention.
 */
export function withActivityInterventionSuggestion<
  T extends Pick<
    OrchestratorResult,
    "diagnosis" | "conceptId" | "conceptTitle" | "decisionContext"
  > & {
    activityIntervention?: OrchestratorActivityIntervention | null;
  },
>(
  result: T,
  extras?: {
    topicName?: string | null;
    subjectDomain?: string | null;
    recentAdapterKeys?: readonly string[] | null;
    preferSolveProducers?: boolean;
    preferPerformProducers?: boolean;
    preferCreationProducers?: boolean;
    excludeAdapterKeys?: readonly string[] | null;
  },
): T {
  const purpose = result.decisionContext?.intent?.purpose ?? null;
  const selected = selectActivityIntervention({
    diagnosis: result.diagnosis,
    conceptId: result.conceptId,
    conceptTitle: result.conceptTitle,
    topicName: extras?.topicName,
    subjectDomain: extras?.subjectDomain,
    intentPurpose: purpose,
    recentAdapterKeys: extras?.recentAdapterKeys,
    preferSolveProducers: extras?.preferSolveProducers,
    preferPerformProducers: extras?.preferPerformProducers,
    preferCreationProducers: extras?.preferCreationProducers,
    excludeAdapterKeys: extras?.excludeAdapterKeys,
  });

  if (!selected) {
    if ("activityIntervention" in result && result.activityIntervention == null) {
      return result;
    }
    const { activityIntervention: _drop, ...rest } = result as T & {
      activityIntervention?: unknown;
    };
    void _drop;
    return rest as T;
  }

  return { ...result, activityIntervention: selected };
}

export function activityInterventionPolicyTruthSummary(): {
  mutatesDiagnosis: false;
  replacesSixIntervention: false;
  createsLearningAttempt: false;
  createsConceptMastery: false;
  selectsAssessmentOnlyAsGeneric: false;
  selectsCreateOnlyAsGeneric: false;
  understandingGapAutoSelectsCoding: false;
  insufficientEvidenceSelectsActivity: false;
  noInterventionSelectsActivity: false;
  performGapAdded: false;
  layersSeparated: true;
  insufficientContextAutoSelects: false;
} {
  return {
    mutatesDiagnosis: false,
    replacesSixIntervention: false,
    createsLearningAttempt: false,
    createsConceptMastery: false,
    selectsAssessmentOnlyAsGeneric: false,
    selectsCreateOnlyAsGeneric: false,
    understandingGapAutoSelectsCoding: false,
    insufficientEvidenceSelectsActivity: false,
    noInterventionSelectsActivity: false,
    performGapAdded: false,
    layersSeparated: true,
    insufficientContextAutoSelects: false,
  };
}
