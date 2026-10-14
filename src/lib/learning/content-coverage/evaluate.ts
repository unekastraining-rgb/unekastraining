/**
 * 2P-10 — evaluateContentCoverage
 *
 * Pure, deterministic, side-effect free.
 * Coverage asks: is there usable content?
 * Progression selection asks: which usable content?
 * Orchestrator asks: what does the learner need?
 */

import { getActivityContentDescriptor } from "@/lib/learning/activities/content-contract";
import {
  listProgressionEntriesForConcept,
  selectProgressionContent,
} from "@/lib/learning/content-progression";
import {
  preferredStagesForIntervention,
  normalizeConceptKey,
} from "@/lib/learning/content-progression/stages";
import type { ContentProgressionEntry } from "@/lib/learning/content-progression/types";
import { evaluateContentAvailability } from "./availability";
import type {
  ContentCoverageActivityKind,
  ContentCoverageRequest,
  ContentCoverageResult,
  ContentCoverageTruthSummary,
} from "./types";

function ownershipOk(
  entry: ContentProgressionEntry,
  learnerId: string | null | undefined,
  includeSystem: boolean,
): boolean {
  if (entry.authorship === "system") return includeSystem;
  const owner = entry.ownerLearnerId?.trim();
  if (!owner || !learnerId?.trim()) return false;
  return owner === learnerId.trim();
}

/** System catalog entries are treated READY; explicit DRAFT/ARCHIVED excluded. */
function isReady(entry: ContentProgressionEntry): boolean {
  const readiness = entry.readiness ?? "READY";
  if (readiness === "DRAFT" || readiness === "ARCHIVED") return false;
  return true;
}

function resolveEligibleKinds(
  input: ContentCoverageRequest,
): ContentCoverageActivityKind[] | null {
  if (input.eligibleActivityKinds && input.eligibleActivityKinds.length > 0) {
    return [...input.eligibleActivityKinds];
  }
  if (input.activityKind) return [input.activityKind];
  return null;
}

/**
 * Deterministic content coverage evaluation.
 * Creates no LearningAttempt / ConceptMastery / diagnosis changes.
 */
export function evaluateContentCoverage(
  input: ContentCoverageRequest,
): ContentCoverageResult {
  const conceptKey = normalizeConceptKey(input.conceptKey || "");
  if (!conceptKey) {
    return {
      status: "MISSING",
      candidateCount: 0,
      compatibleCount: 0,
      availableCount: 0,
      fallbackEligible: false,
      reason: "invalid_concept",
    };
  }

  const includeSystem = input.includeSystemAuthored !== false;
  const allForConcept = listProgressionEntriesForConcept(conceptKey);

  // 1–3: concept + ownership + readiness
  const candidates = allForConcept.filter(
    (e) => ownershipOk(e, input.learnerId, includeSystem) && isReady(e),
  );
  const candidateCount = candidates.length;

  const sixExists = allForConcept.some(
    (e) =>
      e.activityKind === "six" &&
      ownershipOk(e, input.learnerId, includeSystem) &&
      isReady(e),
  );

  if (candidateCount === 0) {
    return {
      status: "MISSING",
      candidateCount: 0,
      compatibleCount: 0,
      availableCount: 0,
      fallbackEligible: sixExists,
      reason: "no_content_for_concept",
    };
  }

  const eligibleKinds = resolveEligibleKinds(input);
  const preferredStages =
    input.stage != null
      ? [input.stage]
      : preferredStagesForIntervention(input.interventionPreference);

  // 4–6: activity / stage / difficulty compatibility
  let compatible = candidates.filter((e) => {
    if (eligibleKinds && !eligibleKinds.includes(e.activityKind)) return false;

    if (input.requireExactStage && input.stage && e.stage !== input.stage) {
      return false;
    }

    if (
      input.requireExactDifficulty &&
      input.difficulty != null &&
      e.difficulty !== input.difficulty
    ) {
      return false;
    }

    // Soft stage: always compatible if kinds match; selection ranks later.
    // Soft difficulty: same.
    void preferredStages;
    return true;
  });

  // When soft stage preference and eligible kinds unset, keep all candidates as compatible.
  if (!eligibleKinds && !input.requireExactStage && !input.requireExactDifficulty) {
    compatible = candidates;
  }

  const compatibleCount = compatible.length;

  if (compatibleCount === 0) {
    return {
      status: "INCOMPATIBLE",
      candidateCount,
      compatibleCount: 0,
      availableCount: 0,
      fallbackEligible: sixExists || candidates.some((e) => e.activityKind === "six"),
      reason: "no_compatible_mechanism",
    };
  }

  // 7: availability
  const available = compatible.filter(
    (e) =>
      evaluateContentAvailability(e, {
        unavailableActivityKinds: input.unavailableActivityKinds,
        unavailableContentKeys: input.unavailableContentKeys,
      }).available,
  );
  const availableCount = available.length;

  if (availableCount === 0) {
    return {
      status: "UNAVAILABLE",
      candidateCount,
      compatibleCount,
      availableCount: 0,
      fallbackEligible: sixExists,
      reason: "compatible_but_unavailable",
    };
  }

  // 8–10: preference + variation via existing selector (deterministic)
  const selection = selectProgressionContent({
    conceptKey,
    interventionPreference: input.interventionPreference,
    preferredStages: input.stage ? [input.stage] : null,
    preferredDifficulty: input.difficulty ?? null,
    eligibleActivityKinds: eligibleKinds,
    excludeContentKeys: [
      ...(input.excludeContentKeys ?? []),
      ...(input.unavailableContentKeys ?? []),
    ],
    avoidContextVariant: input.contextVariant ?? null,
    learnerId: input.learnerId,
    includeSystemAuthored: includeSystem,
  });

  // Prefer an available entry from selection; if selected is unavailable, pick first available by key order.
  let selected = selection.ok ? selection.entry : null;
  if (
    selected &&
    !evaluateContentAvailability(selected, {
      unavailableActivityKinds: input.unavailableActivityKinds,
      unavailableContentKeys: input.unavailableContentKeys,
    }).available
  ) {
    selected = null;
  }
  if (!selected) {
    selected = [...available].sort((a, b) =>
      a.contentKey.localeCompare(b.contentKey),
    )[0]!;
  }

  // Prefer alternate context when request asks to avoid a just-used context.
  if (input.contextVariant) {
    const alt = available
      .filter((e) => e.contextVariant !== input.contextVariant)
      .sort((a, b) => a.contentKey.localeCompare(b.contentKey));
    if (alt.length > 0) {
      // Prefer selected if already different; else take alt.
      if (selected.contextVariant === input.contextVariant) {
        selected = alt[0]!;
      }
    }
  }

  return {
    status: "AVAILABLE",
    candidateCount,
    compatibleCount,
    availableCount,
    selectedContentKey: selected.contentKey,
    selectedContentId: selected.contentId,
    selectedActivityKind: selected.activityKind,
    fallbackEligible: sixExists || availableCount > 1,
    reason: selection.ok ? selection.reason : "deterministic_available",
  };
}

export function contentCoverageTruthSummary(): ContentCoverageTruthSummary {
  return {
    coverageIsNotMastery: true,
    coverageDoesNotChangeDiagnosis: true,
    coverageCreatesNoEvidence: true,
    coverageCreatesNoMastery: true,
    noFabricatedContent: true,
    missingIsNotZeroMastery: true,
    unavailableIsNotAvailable: true,
    noLlmGeneration: true,
    sixRemainsSafeFallback: true,
    assessmentRemainsSeparate: true,
    luckyNotCreatedByCoverage: true,
  };
}

export function coverageModuleDoesNotWriteMastery(sourceText: string): boolean {
  const stripped = sourceText
    .replace(/export function coverageModuleDoesNotWriteMastery[\s\S]*$/m, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  const banned = [
    'from "@/lib/learning/mastery/apply"',
    "from '@/lib/learning/mastery/apply'",
    'from "@/lib/learning/evidence/record"',
    "from '@/lib/learning/evidence/record'",
    "applyEvidenceToMastery(",
    "recordEvidence(",
    "recordAuthoritativeActivityEvidence(",
  ];
  return banned.every((b) => !stripped.includes(b));
}

/** Sanity: selected UA contentId (if any) resolves in catalog — no fabricate. */
export function selectedContentResolvesInCatalog(
  result: ContentCoverageResult,
): boolean {
  if (result.status !== "AVAILABLE") return true;
  if (!result.selectedActivityKind || result.selectedActivityKind === "six") {
    return true;
  }
  if (!result.selectedContentId) return false;
  return (
    getActivityContentDescriptor(
      result.selectedActivityKind,
      result.selectedContentId,
    ) != null
  );
}
