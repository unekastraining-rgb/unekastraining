/**
 * 2P-48 — Learner level / content difficulty helpers (read-side).
 * All-ages learning is content/adaptation inside ULE — not a separate engine.
 * Age/grade never overrides demonstrated mastery.
 */

import type {
  ContentDifficulty,
  ContentInterventionPreference,
  ContentProgressionEntry,
  LearningContentStage,
} from "@/lib/learning/content-progression/types";
import {
  isContentDifficulty,
  preferredStagesForIntervention,
} from "@/lib/learning/content-progression/stages";
import { listProgressionEntriesForConcept } from "@/lib/learning/content-progression/catalog";
import { ORCHESTRATOR_FACET_WEAK } from "@/lib/learning/orchestrator/diagnose";

const WEAK = ORCHESTRATOR_FACET_WEAK;
const STRONG = 0.7;

export type FacetSignalSnapshot = {
  recognize?: number | null;
  explain?: number | null;
  apply?: number | null;
  solve?: number | null;
  perform?: number | null;
  retain?: number | null;
};

export type PreferredDifficultySignals = {
  facets?: FacetSignalSnapshot | null;
  /**
   * Teaching Style HOW (SIMPLIFIED / BEGINNER soft-prefer easier content).
   * Never a diagnosis and never age/intelligence.
   */
  teachingStyle?: string | null;
  interventionPreference?: ContentInterventionPreference | null;
  /**
   * Contextual only — NEVER used to override mastery evidence.
   * Accepted so callers cannot accidentally wire age as authority.
   */
  ageBand?: string | null;
  educationLevel?: string | null;
  /** Client-claimed level must be ignored if present. */
  clientClaimedDifficulty?: unknown;
};

/**
 * Soft preferred content difficulty from evidence + presentation style.
 * Deterministic. Pure. Age/grade/client claims never win over mastery.
 */
export function preferredDifficultyFromSignals(
  input: PreferredDifficultySignals,
): ContentDifficulty | null {
  // Explicitly discard age / education / client claims as authorities.
  void input.ageBand;
  void input.educationLevel;
  void input.clientClaimedDifficulty;

  const facets = input.facets;
  const style = (input.teachingStyle ?? "").toString().trim().toUpperCase();

  const hasFacetSnapshot = facets != null;
  const recognize = Number(facets?.recognize ?? 0);
  const explain = Number(facets?.explain ?? 0);
  const apply = Number(facets?.apply ?? 0);
  const solve = Number(facets?.solve ?? 0);
  const perform = Number(facets?.perform ?? 0);

  const understandMax = Math.max(recognize, explain);
  const applicationMax = Math.max(apply, solve, perform);

  // Strong demonstrated application → deeper content (age cannot block this).
  if (
    hasFacetSnapshot &&
    (applicationMax >= STRONG || (understandMax >= STRONG && apply >= WEAK))
  ) {
    if (solve >= STRONG || perform >= STRONG) return 4;
    return 3;
  }

  // Explicit thin / weak understanding snapshot → foundational difficulty.
  if (hasFacetSnapshot && understandMax < WEAK && applicationMax < WEAK) {
    if (style === "SIMPLIFIED" || style === "BEGINNER") return 1;
    return 2;
  }

  // Soft presentation preference only when evidence is mixed/emerging.
  if (style === "SIMPLIFIED" || style === "BEGINNER") {
    if (!hasFacetSnapshot || applicationMax < STRONG) return 2;
  }

  switch (input.interventionPreference) {
    case "understand":
    case "six":
      return 2;
    case "challenge":
      return 4;
    case "retain":
      return 3;
    case "apply":
    case "activity":
    case "practice":
      return 3;
    default:
      break;
  }

  return null;
}

/**
 * Soft intervention preference paired with preferred difficulty so stage
 * ranking does not ignore difficulty (PRACTICE-before-CHALLENGE default).
 */
export function interventionPreferenceFromDifficulty(
  difficulty: ContentDifficulty | null | undefined,
): ContentInterventionPreference | null {
  if (difficulty == null || !isContentDifficulty(difficulty)) return null;
  if (difficulty <= 2) return "understand";
  if (difficulty >= 4) return "challenge";
  return "practice";
}

/**
 * Soft preferred stages from intervention + weak understanding signal.
 * Does not invent GRADE_GAP / AGE_GAP.
 */
export function preferredStagesFromLevelSignals(input: {
  interventionPreference?: ContentInterventionPreference | null;
  facets?: FacetSignalSnapshot | null;
  prerequisiteHintPresent?: boolean;
}): LearningContentStage[] {
  const base = preferredStagesForIntervention(input.interventionPreference);
  const explain = Number(input.facets?.explain ?? 0);
  const recognize = Number(input.facets?.recognize ?? 0);
  const understandMax = Math.max(explain, recognize);

  if (
    input.prerequisiteHintPresent === true ||
    (understandMax > 0 && understandMax < WEAK)
  ) {
    const foundational: LearningContentStage[] = [
      "INTRODUCE",
      "UNDERSTAND",
      ...base,
    ];
    // Dedupe preserving order
    const seen = new Set<string>();
    return foundational.filter((s) => {
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    });
  }
  return base;
}

export type ConceptDepthLadderSummary = {
  conceptKey: string;
  entryCount: number;
  stages: LearningContentStage[];
  difficulties: ContentDifficulty[];
  contentIds: string[];
  contextVariants: string[];
  hasMultiDifficulty: boolean;
  hasMultiStage: boolean;
};

/**
 * Read-side depth ladder for a conceptKey (authoring / tests).
 */
export function listDepthLadder(conceptKey: string): ConceptDepthLadderSummary {
  const key = conceptKey.trim().toLowerCase();
  const entries = listProgressionEntriesForConcept(key);
  const stages = [
    ...new Set(entries.map((e) => e.stage)),
  ] as LearningContentStage[];
  const difficulties = [
    ...new Set(entries.map((e) => e.difficulty)),
  ].filter(isContentDifficulty) as ContentDifficulty[];
  const contentIds = [...new Set(entries.map((e) => e.contentId).filter(Boolean))];
  const contextVariants = [
    ...new Set(entries.map((e) => e.contextVariant).filter(Boolean)),
  ];
  return {
    conceptKey: key,
    entryCount: entries.length,
    stages,
    difficulties,
    contentIds: contentIds as string[],
    contextVariants,
    hasMultiDifficulty: difficulties.length >= 2,
    hasMultiStage: stages.length >= 2,
  };
}

export function pickSoftDifficultyEntry(
  entries: readonly ContentProgressionEntry[],
  preferred: ContentDifficulty | null | undefined,
): ContentProgressionEntry | null {
  if (entries.length === 0) return null;
  if (preferred == null || !isContentDifficulty(preferred)) {
    return [...entries].sort((a, b) =>
      a.contentKey.localeCompare(b.contentKey),
    )[0]!;
  }
  const ranked = [...entries].sort((a, b) => {
    const da = Math.abs(a.difficulty - preferred);
    const db = Math.abs(b.difficulty - preferred);
    if (da !== db) return da - db;
    return a.contentKey.localeCompare(b.contentKey);
  });
  return ranked[0]!;
}

export function contentLevelTruthSummary(): {
  inventsGradeSchoolEngine: false;
  inventsAdultLearningEngine: false;
  inventsGradeGap: false;
  inventsAgeGap: false;
  inventsSecondCurriculumGraph: false;
  inventsSecondMastery: false;
  ageOverridesMastery: false;
  difficultyIndependentOfMastery: true;
  usesExistingProgression: true;
  usesExistingFacets: true;
  deterministic: true;
} {
  return {
    inventsGradeSchoolEngine: false,
    inventsAdultLearningEngine: false,
    inventsGradeGap: false,
    inventsAgeGap: false,
    inventsSecondCurriculumGraph: false,
    inventsSecondMastery: false,
    ageOverridesMastery: false,
    difficultyIndependentOfMastery: true,
    usesExistingProgression: true,
    usesExistingFacets: true,
    deterministic: true,
  };
}
