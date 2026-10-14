/**
 * 2P-9 — Content progression & variation types.
 *
 * Content progression describes available learning experiences; it does not
 * decide what the learner needs.
 *
 * The Orchestrator decides the intervention. The content layer finds a valid
 * experience that can implement it.
 *
 * Content variation changes the experience, not the learner's canonical
 * knowledge identity.
 */

import type { UniversalContentActivityKind } from "@/lib/learning/activities/content-contract";

/**
 * Content-intent stages — NOT Orchestrator diagnoses, NOT mastery facets.
 * Metadata for filtering/ranking only. No mandatory ladder.
 */
export type LearningContentStage =
  | "INTRODUCE"
  | "UNDERSTAND"
  | "PRACTICE"
  | "APPLY"
  | "CHALLENGE"
  | "RETAIN";

export const LEARNING_CONTENT_STAGES: readonly LearningContentStage[] = [
  "INTRODUCE",
  "UNDERSTAND",
  "PRACTICE",
  "APPLY",
  "CHALLENGE",
  "RETAIN",
] as const;

/** Lightweight ordinal difficulty (1=introductory … 5=challenge). Not scientific. */
export type ContentDifficulty = 1 | 2 | 3 | 4 | 5;

/**
 * Soft preference derived from a known intervention — not a diagnosis mapping.
 * Orchestrator still chooses the intervention first.
 */
export type ContentInterventionPreference =
  | "understand"
  | "practice"
  | "apply"
  | "challenge"
  | "retain"
  | "six"
  | "activity"
  | "unspecified";

/**
 * One reusable content experience for a Concept.
 * contentKey is stable identity; contentId points at 2P-7 catalog challenge.
 */
export type ContentProgressionEntry = {
  /** Stable identity across launch / Adaptive / evidence / retries. */
  contentKey: string;
  /** Normalized concept grouping key (not a DB Concept id). */
  conceptKey: string;
  conceptTitle: string;
  stage: LearningContentStage;
  difficulty: ContentDifficulty;
  /** Free-form context variant (e.g. "coffee market", "housing market"). */
  contextVariant: string;
  activityKind: UniversalContentActivityKind | "six";
  /** 2P-7 catalog id when activityKind is a Universal Activity. */
  contentId: string | null;
  objective: string;
  domainContext: string | null;
  /** system | learner — ownership boundary for shared vs private. */
  authorship: "system" | "learner";
  ownerLearnerId?: string | null;
  /** Lightweight version token. */
  contentVersion: string;
  /** Optional readiness — DRAFT/ARCHIVED never count as AVAILABLE (2P-10). */
  readiness?: "DRAFT" | "READY" | "PUBLISHED" | "ARCHIVED";
};
export type ContentProgressionSelectionInput = {
  conceptKey: string;
  /** Optional explicit preferred stages (after intervention is known). */
  preferredStages?: readonly LearningContentStage[] | null;
  interventionPreference?: ContentInterventionPreference | null;
  preferredDifficulty?: ContentDifficulty | null;
  /** Restrict to these mechanisms when intervention already chose one. */
  eligibleActivityKinds?: readonly (UniversalContentActivityKind | "six")[] | null;
  /** Exclude recently failed content keys when alternatives exist. */
  excludeContentKeys?: readonly string[] | null;
  /** Prefer a different context than this (transfer / success variation). */
  avoidContextVariant?: string | null;
  /** Learner id for ownership filter (learner-authored only). */
  learnerId?: string | null;
  /** Allow system-authored shared content (default true). */
  includeSystemAuthored?: boolean;
};

export type ContentProgressionSelectionResult =
  | {
      ok: true;
      entry: ContentProgressionEntry;
      reason:
        | "preferred_stage_match"
        | "fallback_stage"
        | "only_candidate"
        | "deterministic_rank";
      candidatesConsidered: number;
    }
  | {
      ok: false;
      reason:
        | "no_content_for_concept"
        | "no_compatible_after_filters"
        | "invalid_concept";
      candidatesConsidered: number;
    };

export type ProgressionTruthSummary = {
  stagesAreNotDiagnoses: true;
  stagesAreNotMasteryFacets: true;
  progressionIsNotMandatoryLadder: true;
  selectorIsNotOrchestrator: true;
  selectionCreatesNoEvidence: true;
  selectionCreatesNoMastery: true;
  noFabricatedContent: true;
  noLlmSelection: true;
  noUncontrolledRandomness: true;
  sixRemainsFallback: true;
  assessmentRemainsSeparate: true;
  retainStageIsNotLucky: true;
};
