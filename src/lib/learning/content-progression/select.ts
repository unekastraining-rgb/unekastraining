/**
 * 2P-9 — Deterministic content progression selector.
 *
 * Answers: "Which valid content can implement this intervention?"
 * Does NOT answer: "What does the learner need?" (Orchestrator).
 * Creates no evidence / mastery / diagnosis changes.
 */

import { listProgressionEntriesForConcept } from "./catalog";
import {
  isContentDifficulty,
  isLearningContentStage,
  preferredStagesForIntervention,
} from "./stages";
import type {
  ContentProgressionEntry,
  ContentProgressionSelectionInput,
  ContentProgressionSelectionResult,
  LearningContentStage,
  ProgressionTruthSummary,
} from "./types";

function ownershipOk(
  entry: ContentProgressionEntry,
  learnerId: string | null | undefined,
  includeSystem: boolean,
): boolean {
  if (entry.authorship === "system") return includeSystem;
  const owner = entry.ownerLearnerId?.trim();
  if (!owner) return false;
  if (!learnerId?.trim()) return false;
  return owner === learnerId.trim();
}

function stageRank(
  stage: LearningContentStage,
  preferred: readonly LearningContentStage[],
): number {
  const idx = preferred.indexOf(stage);
  if (idx === -1) return 100 + preferred.length;
  return idx;
}

/**
 * Deterministic selection among eligible progression entries.
 * No randomness, no LLM, no fabricated entries.
 */
export function selectProgressionContent(
  input: ContentProgressionSelectionInput,
): ContentProgressionSelectionResult {
  const conceptKey = input.conceptKey?.trim().toLowerCase() ?? "";
  if (!conceptKey) {
    return {
      ok: false,
      reason: "invalid_concept",
      candidatesConsidered: 0,
    };
  }

  if (input.preferredStages) {
    for (const s of input.preferredStages) {
      if (!isLearningContentStage(s)) {
        return {
          ok: false,
          reason: "no_compatible_after_filters",
          candidatesConsidered: 0,
        };
      }
    }
  }
  if (
    input.preferredDifficulty != null &&
    !isContentDifficulty(input.preferredDifficulty)
  ) {
    return {
      ok: false,
      reason: "no_compatible_after_filters",
      candidatesConsidered: 0,
    };
  }

  const preferred =
    input.preferredStages && input.preferredStages.length > 0
      ? [...input.preferredStages]
      : preferredStagesForIntervention(input.interventionPreference);

  const includeSystem = input.includeSystemAuthored !== false;
  let pool = listProgressionEntriesForConcept(conceptKey).filter((e) =>
    ownershipOk(e, input.learnerId, includeSystem),
  );

  if (pool.length === 0) {
    return {
      ok: false,
      reason: "no_content_for_concept",
      candidatesConsidered: 0,
    };
  }

  const kinds = input.eligibleActivityKinds;
  if (kinds && kinds.length > 0) {
    pool = pool.filter((e) => kinds.includes(e.activityKind));
  }

  const exclude = new Set(
    (input.excludeContentKeys ?? []).map((k) => k.trim()).filter(Boolean),
  );
  let withExclusions = pool.filter((e) => !exclude.has(e.contentKey));
  // Failure variation: exclude failed keys only when alternatives remain.
  if (withExclusions.length === 0 && exclude.size > 0) {
    withExclusions = pool;
  }
  pool = withExclusions;

  if (pool.length === 0) {
    return {
      ok: false,
      reason: "no_compatible_after_filters",
      candidatesConsidered: listProgressionEntriesForConcept(conceptKey).length,
    };
  }

  const avoidCtx = input.avoidContextVariant?.trim() ?? "";
  let contextFiltered = pool;
  if (avoidCtx) {
    const alt = pool.filter((e) => e.contextVariant !== avoidCtx);
    if (alt.length > 0) contextFiltered = alt;
  }

  const preferredDiff = input.preferredDifficulty ?? null;

  const ranked = [...contextFiltered].sort((a, b) => {
    const sa = stageRank(a.stage, preferred);
    const sb = stageRank(b.stage, preferred);
    if (sa !== sb) return sa - sb;

    if (preferredDiff != null) {
      const da = Math.abs(a.difficulty - preferredDiff);
      const db = Math.abs(b.difficulty - preferredDiff);
      if (da !== db) return da - db;
    }

    if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
    return a.contentKey.localeCompare(b.contentKey);
  });

  const top = ranked[0]!;
  const preferredHit = preferred.includes(top.stage);
  const reason =
    ranked.length === 1
      ? ("only_candidate" as const)
      : preferredHit
        ? ("preferred_stage_match" as const)
        : ("fallback_stage" as const);

  return {
    ok: true,
    entry: top,
    reason,
    candidatesConsidered: ranked.length,
  };
}

export function contentProgressionTruthSummary(): ProgressionTruthSummary {
  return {
    stagesAreNotDiagnoses: true,
    stagesAreNotMasteryFacets: true,
    progressionIsNotMandatoryLadder: true,
    selectorIsNotOrchestrator: true,
    selectionCreatesNoEvidence: true,
    selectionCreatesNoMastery: true,
    noFabricatedContent: true,
    noLlmSelection: true,
    noUncontrolledRandomness: true,
    sixRemainsFallback: true,
    assessmentRemainsSeparate: true,
    retainStageIsNotLucky: true,
  };
}

/** Selector modules must not write mastery/evidence. */
export function progressionModuleDoesNotWriteMastery(
  sourceText: string,
): boolean {
  const stripped = sourceText
    .replace(
      /export function progressionModuleDoesNotWriteMastery[\s\S]*$/m,
      "",
    )
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
