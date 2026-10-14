/**
 * 2P-16 — Adaptive-ready catalog depth contract.
 *
 * Evaluates whether a catalog + progression pairing is sufficiently complete
 * for Adaptive-ready Universal Activities. Does NOT invent Adaptive bind for
 * product-only activities.
 */

import {
  getActivityContentDescriptor,
  type UniversalContentActivityKind,
} from "@/lib/learning/activities/content-contract";
import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import { getSqlChallenge } from "@/lib/learning/activities/sql/challenges";
import { getStructuredChallenge } from "@/lib/learning/activities/structured/service";
import {
  CONTENT_PROGRESSION_CATALOG,
  getProgressionEntry,
} from "@/lib/learning/content-progression/catalog";
import { isAdaptiveReadyActivityAdapterKey } from "@/lib/learning/sequence/activity-adaptive-completion";
import { normalizeLearningScaffolds } from "@/lib/learning/scaffolding/normalize";

export type CatalogDepthFieldTier = {
  /** Required for universal pipeline selection + experience projection. */
  requiredUniversal: readonly string[];
  /** Required only when the activity mechanism needs them. */
  requiredByActivity: Record<string, readonly string[]>;
  /** Improves pack quality; not engine dependencies. */
  recommendedDomain: readonly string[];
  /** Optional enrichment (accessibility, misconceptions, references). */
  optionalEnrichment: readonly string[];
};

export function catalogDepthFieldTiers(): CatalogDepthFieldTier {
  return {
    requiredUniversal: [
      "contentId",
      "objective",
      "task",
      "activityKind",
      "evaluationMode",
      "conceptHints_or_explicit_contentId",
    ],
    requiredByActivity: {
      coding: ["starter", "entryFunction", "tests_or_requiredPatterns"],
      sql: ["seedSql", "expectedRows", "starter"],
      lab: ["criteria", "minChars"],
      simulation: ["criteria", "minChars"],
      presentation: ["criteria", "minChars"],
      writing: ["criteria", "minChars"],
      project: ["criteria", "minChars"],
      game: ["criteria", "minChars"],
    },
    recommendedDomain: [
      "domainTag",
      "stage",
      "difficulty",
      "contextVariant",
      "successLooksLike",
      "scaffolds",
    ],
    optionalEnrichment: [
      "misconceptionTargets",
      "accessibility",
      "sourceRef",
      "prerequisiteHints",
    ],
  };
}

export type AdaptiveReadyCatalogAssessment = {
  contentId: string;
  activityKind: UniversalContentActivityKind;
  /** Mechanism is Adaptive-bind ready (coding/sql/lab/simulation/presentation/writing). */
  mechanismAdaptiveReady: boolean;
  /** Catalog row has meaningful objective, task, evaluation. */
  contractComplete: boolean;
  /** Has at least one READY progression entry referencing this contentId. */
  progressionPresent: boolean;
  /** Has scaffolds and/or successLooksLike. */
  qualityEnriched: boolean;
  /** Optional misconception / accessibility enrichment. */
  optionalEnrichmentPresent: boolean;
  /**
   * True when mechanism Adaptive-ready AND contract complete AND progression present.
   * Quality enrichment is recommended but not required for this flag.
   */
  adaptiveReadySeed: boolean;
  gaps: string[];
};

function loadEnrichment(activityKind: UniversalContentActivityKind, contentId: string): {
  scaffolds?: unknown;
  successLooksLike?: string | null;
  misconceptionTargets?: readonly string[];
  accessibility?: unknown;
} {
  if (activityKind === "coding") {
    const c = getCodingChallenge(contentId);
    return {
      scaffolds: c?.scaffolds,
      successLooksLike: c?.successLooksLike ?? null,
      misconceptionTargets: c?.misconceptionTargets,
      accessibility: c?.accessibility,
    };
  }
  if (activityKind === "sql") {
    const c = getSqlChallenge(contentId);
    return {
      scaffolds: c?.scaffolds,
      successLooksLike: c?.successLooksLike ?? null,
      misconceptionTargets: c?.misconceptionTargets,
      accessibility: c?.accessibility,
    };
  }
  const c = getStructuredChallenge(contentId);
  return {
    scaffolds: c?.scaffolds,
    successLooksLike: c?.successLooksLike ?? null,
    misconceptionTargets: c?.misconceptionTargets,
    accessibility: c?.accessibility,
  };
}

/**
 * Assess whether a catalog contentId is an Adaptive-ready seed item.
 */
export function assessAdaptiveReadyCatalogItem(input: {
  activityKind: UniversalContentActivityKind;
  contentId: string;
  /** Optional progression contentKey that should reference this content. */
  contentKey?: string | null;
}): AdaptiveReadyCatalogAssessment {
  const gaps: string[] = [];
  const descriptor = getActivityContentDescriptor(
    input.activityKind,
    input.contentId,
  );
  const mechanismAdaptiveReady = isAdaptiveReadyActivityAdapterKey(
    input.activityKind,
  );

  if (!descriptor) {
    return {
      contentId: input.contentId,
      activityKind: input.activityKind,
      mechanismAdaptiveReady,
      contractComplete: false,
      progressionPresent: false,
      qualityEnriched: false,
      optionalEnrichmentPresent: false,
      adaptiveReadySeed: false,
      gaps: ["missing_catalog_content"],
    };
  }

  if (!descriptor.objective.trim() || descriptor.objective.trim().length < 12) {
    gaps.push("weak_objective");
  }
  if (!descriptor.task.trim() || descriptor.task.trim().length < 20) {
    gaps.push("weak_task");
  }
  if (!descriptor.evaluationMode) {
    gaps.push("missing_evaluation");
  }

  const contractComplete = gaps.length === 0;

  let progressionPresent = false;
  if (input.contentKey) {
    const entry = getProgressionEntry(input.contentKey);
    progressionPresent =
      entry != null &&
      entry.contentId === input.contentId &&
      (entry.readiness ?? "READY") !== "DRAFT" &&
      (entry.readiness ?? "READY") !== "ARCHIVED";
    if (!progressionPresent) gaps.push("progression_missing_or_not_ready");
  } else {
    progressionPresent = CONTENT_PROGRESSION_CATALOG.some(
      (e) =>
        e.contentId === input.contentId &&
        (e.readiness ?? "READY") !== "DRAFT" &&
        (e.readiness ?? "READY") !== "ARCHIVED",
    );
    if (!progressionPresent) gaps.push("no_progression_entry");
  }

  const enrich = loadEnrichment(input.activityKind, input.contentId);
  const scaffolds = normalizeLearningScaffolds(
    (enrich.scaffolds as Parameters<typeof normalizeLearningScaffolds>[0]) ?? [],
  );
  const qualityEnriched =
    scaffolds.length > 0 || Boolean(enrich.successLooksLike?.trim());
  if (!qualityEnriched) gaps.push("missing_scaffolds_or_successLooksLike");

  const optionalEnrichmentPresent =
    Boolean(enrich.misconceptionTargets?.length) ||
    Boolean(enrich.accessibility);

  const adaptiveReadySeed =
    mechanismAdaptiveReady && contractComplete && progressionPresent;

  return {
    contentId: input.contentId,
    activityKind: input.activityKind,
    mechanismAdaptiveReady,
    contractComplete,
    progressionPresent,
    qualityEnriched,
    optionalEnrichmentPresent,
    adaptiveReadySeed,
    gaps,
  };
}

export function adaptiveReadyContractTruthSummary(): {
  doesNotForceProductOnlyIntoAdaptive: true;
  qualityEnrichmentRecommendedNotRequired: true;
  doesNotWriteMastery: true;
} {
  return {
    doesNotForceProductOnlyIntoAdaptive: true,
    qualityEnrichmentRecommendedNotRequired: true,
    doesNotWriteMastery: true,
  };
}
