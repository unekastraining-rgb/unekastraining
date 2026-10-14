/**
 * 2P-11 — Resolve experience from kind + concept using existing coverage/progression/catalog.
 * Still a projection helper — does not invent content or write mastery.
 * 2P-46 — Soft transfer filters (avoidContextVariant / excludeContentKeys) when alternatives exist.
 * 2P-48 — Soft preferredDifficulty / interventionPreference (age never overrides mastery).
 */

import {
  getActivityContentDescriptor,
  selectActivityContent,
  type UniversalContentActivityKind,
} from "@/lib/learning/activities/content-contract";
import { evaluateContentCoverage } from "@/lib/learning/content-coverage";
import {
  getProgressionEntry,
  normalizeConceptKey,
  selectProgressionContent,
} from "@/lib/learning/content-progression";
import type {
  ContentDifficulty,
  ContentInterventionPreference,
} from "@/lib/learning/content-progression/types";
import { interventionPreferenceFromDifficulty } from "@/lib/learning/content-level";
import { projectLearningExperience } from "./project";
import type { LearningExperienceView } from "./types";
import type { ContentCoverageStatus } from "@/lib/learning/content-coverage/types";

export type ResolveLearningExperienceInput = {
  conceptId: string;
  conceptTitle?: string | null;
  activityKind: UniversalContentActivityKind;
  /** Explicit content id when known. */
  contentId?: string | null;
  /** Explicit progression contentKey when known. */
  contentKey?: string | null;
  whyReason?: string | null;
  adaptiveContext?: boolean;
  excludeContentKeys?: readonly string[] | null;
  /** Soft-prefer a different scenario when alternatives exist (2P-46). */
  avoidContextVariant?: string | null;
  /** Soft preferred difficulty 1–5 from evidence/style (2P-48). */
  preferredDifficulty?: ContentDifficulty | null;
  /** Soft stage preference after intervention known. */
  interventionPreference?: ContentInterventionPreference | null;
  learnerId?: string | null;
};

export type ResolveLearningExperienceResult = {
  experience: LearningExperienceView | null;
  coverageStatus: ContentCoverageStatus;
  recommendedContentId: string | null;
};

/**
 * Combine coverage + progression + catalog into one experience projection.
 * Returns experience null when coverage is not AVAILABLE (no fabricate).
 */
export function resolveLearningExperience(
  input: ResolveLearningExperienceInput,
): ResolveLearningExperienceResult {
  const conceptKey = normalizeConceptKey(input.conceptTitle || "");
  const interventionPreference =
    input.interventionPreference ??
    interventionPreferenceFromDifficulty(input.preferredDifficulty);

  const coverage = evaluateContentCoverage({
    conceptKey: conceptKey || "unkeyed",
    conceptId: input.conceptId,
    learnerId: input.learnerId,
    activityKind: input.activityKind,
    excludeContentKeys: input.excludeContentKeys,
    contextVariant: input.avoidContextVariant,
    difficulty: input.preferredDifficulty,
    interventionPreference,
  });

  // Catalog soft-excludes practiced contentIds when alternatives remain.
  const catalogExcludeIds = [
    ...(input.excludeContentKeys ?? []),
  ].filter(Boolean);

  // If concept title unknown, still allow catalog recommendation (standalone).
  const catalogPick = selectActivityContent({
    activityKind: input.activityKind,
    contentId: input.contentId,
    conceptTitle: input.conceptTitle,
    excludeContentIds: catalogExcludeIds,
  });

  let progression = input.contentKey
    ? getProgressionEntry(input.contentKey)
    : null;

  if (!progression && conceptKey) {
    const selected = selectProgressionContent({
      conceptKey,
      eligibleActivityKinds: [input.activityKind],
      excludeContentKeys: input.excludeContentKeys,
      avoidContextVariant: input.avoidContextVariant,
      preferredDifficulty: input.preferredDifficulty,
      interventionPreference,
      learnerId: input.learnerId,
    });
    if (selected.ok) progression = selected.entry;
  }

  const contentId =
    input.contentId ||
    progression?.contentId ||
    catalogPick?.contentId ||
    null;

  const descriptor =
    contentId != null
      ? getActivityContentDescriptor(input.activityKind, contentId)
      : catalogPick?.descriptor ?? null;

  // Coverage for keyed concepts. Catalog-only standalone allowed when MISSING
  // (concept not in progression catalog) but never when INCOMPATIBLE/UNAVAILABLE.
  let coverageStatus = coverage.status;
  if (!conceptKey && descriptor) {
    coverageStatus = "AVAILABLE";
  } else if (conceptKey && coverage.status === "MISSING" && descriptor) {
    coverageStatus = "AVAILABLE";
  }

  if (coverageStatus !== "AVAILABLE" || !descriptor) {
    return {
      experience: null,
      coverageStatus:
        coverageStatus === "AVAILABLE" ? "MISSING" : coverageStatus,
      recommendedContentId: null,
    };
  }

  const experience = projectLearningExperience({
    conceptId: input.conceptId,
    conceptTitle: input.conceptTitle,
    activityKind: input.activityKind,
    descriptor,
    progression,
    whyReason: input.whyReason,
    adaptiveContext: input.adaptiveContext,
    coverageStatus,
  });

  return {
    experience,
    coverageStatus,
    recommendedContentId: descriptor.contentId,
  };
}
