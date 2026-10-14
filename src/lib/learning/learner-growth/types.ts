/**
 * 2P-43 — Longitudinal learner growth types (read-side only).
 * Not a GrowthEngine / JourneyEngine / second mastery store.
 */

import type { GrowthCenterView } from "@/lib/learning/learner-model/present-growth-center";
import type { LearningActionKind } from "@/lib/learning/experience/learning-action";
import { CANONICAL_ULE_MASTERY_SOURCE } from "@/lib/learning/mastery/mastery-truth";

export type TemporalTruthKind =
  | "recently_demonstrated"
  | "historically_demonstrated"
  | "currently_weak"
  | "needs_more_evidence";

export type TemporalTruthItem = {
  kind: TemporalTruthKind;
  conceptId: string;
  conceptTitle: string | null;
  /** Learner-safe label — never “mastered forever”. */
  learnerLabel: string;
};

export type TemporalTruthBuckets = {
  recentlyDemonstrated: TemporalTruthItem[];
  historicallyDemonstrated: TemporalTruthItem[];
  currentlyWeak: TemporalTruthItem[];
  needsMoreEvidence: TemporalTruthItem[];
};

/**
 * Canonical next-action presentation derived from existing contracts.
 * Never persists AI recommendations as truth.
 */
export type LearnerNextAction = {
  kind: LearningActionKind;
  label: string;
  href?: string;
  conceptId?: string;
  adaptiveRunId?: string;
  /** Learner-safe why — from Orchestrator reason or continuity copy. */
  reason: string | null;
  source:
    | "adaptive_resume"
    | "orchestrator"
    | "growth_focus"
    | "lucky"
    | "none";
};

export type LearnerGrowthContinuityView = {
  source: typeof CANONICAL_ULE_MASTERY_SOURCE;
  growth: GrowthCenterView;
  temporal: TemporalTruthBuckets;
  nextAction: LearnerNextAction;
  /** ACTIVE Adaptive runs indexed by concept (owned learner only). */
  activeRunByConceptId: Record<string, string>;
  /** Convenience: first ACTIVE run id if any. */
  primaryResumeRunId: string | null;
  continuityNotes: string[];
};
