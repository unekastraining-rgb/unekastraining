/**
 * 2P-11 — Universal Learning Experience view model.
 *
 * Learner-facing projection of already-selected learning content and activity
 * context. It does not become another learning decision engine.
 */

import type { LearningContentStage } from "@/lib/learning/content-progression/types";
import type { ContentCoverageStatus } from "@/lib/learning/content-coverage/types";
import type { UniversalContentActivityKind } from "@/lib/learning/activities/content-contract";
import type { LearningScaffold } from "@/lib/learning/scaffolding/types";

export type LearningExperienceActivityKind =
  | UniversalContentActivityKind
  | "six";

/** Soft stage labels for learners — not diagnoses. */
export type LearningExperienceStageLabel =
  | "Introduction"
  | "Understand"
  | "Practice"
  | "Apply"
  | "Challenge"
  | "Review";

export type LearningExperienceView = {
  conceptId: string;
  conceptTitle: string | null;
  activityKind: LearningExperienceActivityKind;
  /** Learner-facing activity title. */
  title: string;
  /** What the learner will demonstrate. */
  objective: string;
  /** Concrete task / instructions. */
  instructions: string;
  /** Optional context / scenario. */
  context: string | null;
  /**
   * First light hint (compat). Prefer `scaffolds` with progressive disclosure.
   * Null when no scaffold exists — do not fabricate.
   */
  hint: string | null;
  /** Optional short example cue (not an answer key). */
  example: string | null;
  /** What the learner is expected to produce/do. */
  expectedAction: string;
  /** Soft purpose line (not Orchestrator diagnosis). */
  purpose: string;
  /** Optional why from existing intervention reason — never invented diagnosis. */
  whyReason: string | null;
  stage: LearningContentStage | null;
  stageLabel: LearningExperienceStageLabel | null;
  difficulty: number | null;
  contentKey: string | null;
  contentId: string | null;
  contentVersion: string | null;
  completionDescription: string;
  /** What success looks like — from rubric/eval metadata (2P-12). */
  successLooksLike: string | null;
  /** Progressive scaffolding — content-derived (2P-12). */
  scaffolds: LearningScaffold[];
  coverageStatus: ContentCoverageStatus | null;
  /** True when Adaptive context is present. */
  adaptiveContext: boolean;
};

export type LearningExperienceTruthSummary = {
  isProjectionOnly: true;
  doesNotDiagnose: true;
  doesNotSelectIntervention: true;
  doesNotWriteEvidence: true;
  doesNotWriteMastery: true;
  doesNotCreateLucky: true;
  doesNotReplaceSix: true;
  doesNotCollapseAssessment: true;
  doesNotFabricateContent: true;
};
