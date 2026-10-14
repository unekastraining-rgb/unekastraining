/**
 * 2G-74 / 2P-42 / 2P-45 — Deterministic ranking among compatible + available activity candidates.
 *
 * Same inputs => same winner. No randomness, no LLM, no embeddings.
 *
 * Order (documented):
 * 1. Compatibility strength (subjectDomain match > title/topic cue)
 * 2. Number of matched context tokens (more specific beat vaguer)
 * 3. Soft prefer performCapable adapters when requested (2P-45)
 * 4. Soft prefer SOLVE-producing adapters when requested (2P-42)
 * 5. Soft demote recently used adapter keys (2P-42) — still selectable if sole match
 * 6. Stable registry declaration order (tie-break)
 *
 * Ranking never overrides diagnosis, capability legality, or ownership.
 */

import type { ActivityInterventionCapability } from "@/lib/learning/orchestrator/activity-intervention-capability";
import { ACTIVITY_INTERVENTION_CAPABILITIES } from "@/lib/learning/orchestrator/activity-intervention-capability";
import type { ActivityCompatibilityResult } from "@/lib/learning/orchestrator/activity-intervention-compatibility";

export type ActivityRankingOptions = {
  /** Soft-demote these adapter keys (recent Adaptive history). */
  demoteAdapterKeys?: readonly string[];
  /** Prefer adapters that produce SOLVE evidence (APPLICATION_GAP soft bias). */
  preferSolveProducers?: boolean;
  /**
   * Prefer adapters marked performCapable (APPLICATION_GAP soft bias when
   * ConceptMastery.perform is weak). Does not invent PERFORM_GAP.
   */
  preferPerformProducers?: boolean;
  /**
   * Prefer adapters with creation learning characteristic (writing/project)
   * when APPLICATION_GAP — soft only. Does not invent CREATION_GAP.
   */
  preferCreationProducers?: boolean;
};

export type RankedActivityCandidate = {
  capability: ActivityInterventionCapability;
  compatibility: ActivityCompatibilityResult;
  registryIndex: number;
};

function registryIndexOf(adapterKey: string): number {
  const idx = ACTIVITY_INTERVENTION_CAPABILITIES.findIndex(
    (c) => c.adapterKey === adapterKey,
  );
  return idx < 0 ? Number.MAX_SAFE_INTEGER : idx;
}

function producesSolve(capability: ActivityInterventionCapability): boolean {
  return capability.evidenceFacetsProduced.includes("SOLVE");
}

function producesCreation(capability: ActivityInterventionCapability): boolean {
  return capability.supportsLearningCharacteristics.includes("creation");
}

function demotionRank(
  adapterKey: string,
  demote: ReadonlySet<string>,
): number {
  return demote.has(adapterKey) ? 1 : 0;
}

/**
 * Sort candidates in place-stable deterministic order; returns a new array.
 */
export function rankActivityInterventionCandidates(
  candidates: readonly {
    capability: ActivityInterventionCapability;
    compatibility: ActivityCompatibilityResult;
  }[],
  options?: ActivityRankingOptions,
): RankedActivityCandidate[] {
  const demote = new Set(
    (options?.demoteAdapterKeys ?? []).map((k) => k.trim()).filter(Boolean),
  );
  const preferSolve = Boolean(options?.preferSolveProducers);
  const preferPerform = Boolean(options?.preferPerformProducers);
  const preferCreation = Boolean(options?.preferCreationProducers);

  const ranked: RankedActivityCandidate[] = candidates.map((c) => ({
    capability: c.capability,
    compatibility: c.compatibility,
    registryIndex: registryIndexOf(c.capability.adapterKey),
  }));

  ranked.sort((a, b) => {
    if (b.compatibility.strength !== a.compatibility.strength) {
      return b.compatibility.strength - a.compatibility.strength;
    }
    const tokenDelta =
      b.compatibility.matchedTokens.length -
      a.compatibility.matchedTokens.length;
    if (tokenDelta !== 0) return tokenDelta;

    if (preferPerform) {
      const aPerform = a.capability.performCapable ? 0 : 1;
      const bPerform = b.capability.performCapable ? 0 : 1;
      if (aPerform !== bPerform) return aPerform - bPerform;
    }

    if (preferCreation) {
      const aCreate = producesCreation(a.capability) ? 0 : 1;
      const bCreate = producesCreation(b.capability) ? 0 : 1;
      if (aCreate !== bCreate) return aCreate - bCreate;
    }

    if (preferSolve) {
      const aSolve = producesSolve(a.capability) ? 0 : 1;
      const bSolve = producesSolve(b.capability) ? 0 : 1;
      if (aSolve !== bSolve) return aSolve - bSolve;
    }

    const aDemote = demotionRank(a.capability.adapterKey, demote);
    const bDemote = demotionRank(b.capability.adapterKey, demote);
    if (aDemote !== bDemote) return aDemote - bDemote;

    return a.registryIndex - b.registryIndex;
  });

  return ranked;
}

export function pickTopRankedActivityCandidate(
  candidates: readonly {
    capability: ActivityInterventionCapability;
    compatibility: ActivityCompatibilityResult;
  }[],
  options?: ActivityRankingOptions,
): RankedActivityCandidate | null {
  const ranked = rankActivityInterventionCandidates(candidates, options);
  return ranked[0] ?? null;
}

export function activityRankingTruthSummary(): {
  randomSelection: false;
  llmSelection: false;
  embeddingSelection: false;
  deterministic: true;
  strengthBeforeRegistryOrder: true;
  softDemotesRecentKeys: true;
  softPrefersSolveProducers: true;
  softPrefersPerformCapable: true;
  softPrefersCreationProducers: true;
  inventsPerformGap: false;
  inventsCreationGap: false;
} {
  return {
    randomSelection: false,
    llmSelection: false,
    embeddingSelection: false,
    deterministic: true,
    strengthBeforeRegistryOrder: true,
    softDemotesRecentKeys: true,
    softPrefersSolveProducers: true,
    softPrefersPerformCapable: true,
    softPrefersCreationProducers: true,
    inventsPerformGap: false,
    inventsCreationGap: false,
  };
}
