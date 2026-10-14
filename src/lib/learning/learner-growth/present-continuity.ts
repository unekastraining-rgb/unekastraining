/**
 * 2P-43 — Longitudinal continuity composer (read-side only).
 * Wraps existing Growth Center + LearningAction — not a GrowthEngine.
 */

import { CANONICAL_ULE_MASTERY_SOURCE } from "@/lib/learning/mastery/mastery-truth";
import type { GrowthCenterView } from "@/lib/learning/learner-model/present-growth-center";
import { presentTemporalTruthBuckets } from "./temporal-truth";
import { resolveLearnerNextAction } from "./next-action";
import type {
  LearnerGrowthContinuityView,
  LearnerNextAction,
  TemporalTruthBuckets,
} from "./types";

/** Slim Hub teaser — same truth as Growth Center continuity. */
export type LearnerGrowthHubTeaser = {
  source: typeof CANONICAL_ULE_MASTERY_SOURCE;
  recentlyDemonstratedLine: string | null;
  historicallyDemonstratedLine: string | null;
  needsWorkLine: string | null;
  needsMoreEvidenceLine: string | null;
  nextAction: LearnerNextAction;
  continueHref: string | null;
  why: string | null;
  hasActiveAdaptive: boolean;
  growthCenterHref: "/study/learner-model";
};

function titleOf(
  item: { conceptTitle: string | null },
  fallback = "a concept",
): string {
  const t = item.conceptTitle?.trim();
  return t || fallback;
}

function pickPrimaryResume(input: {
  focusConceptId: string | null;
  activeRunByConceptId: Record<string, string>;
}): { conceptId: string | null; runId: string | null } {
  const focus = input.focusConceptId?.trim() || null;
  if (focus && input.activeRunByConceptId[focus]) {
    return { conceptId: focus, runId: input.activeRunByConceptId[focus]! };
  }
  const keys = Object.keys(input.activeRunByConceptId).sort();
  if (keys.length === 0) return { conceptId: null, runId: null };
  const conceptId = keys[0]!;
  return { conceptId, runId: input.activeRunByConceptId[conceptId]! };
}

function buildContinuityNotes(
  temporal: TemporalTruthBuckets,
  nextAction: LearnerNextAction,
  hasActive: boolean,
  transferNote?: string | null,
  creationNote?: string | null,
  dueRetentionAvailable?: boolean,
): string[] {
  const notes: string[] = [];
  if (hasActive) {
    notes.push("You have Adaptive study in progress you can continue.");
  }
  if (temporal.recentlyDemonstrated.length > 0) {
    notes.push(
      `Recently demonstrated: ${titleOf(temporal.recentlyDemonstrated[0]!)}.`,
    );
  }
  if (temporal.currentlyWeak.length > 0) {
    notes.push(
      `Needs more practice: ${titleOf(temporal.currentlyWeak[0]!)}.`,
    );
  }
  if (temporal.historicallyDemonstrated.length > 0) {
    notes.push(
      `Previously demonstrated (not recent): ${titleOf(temporal.historicallyDemonstrated[0]!)}.`,
    );
  }
  if (dueRetentionAvailable === true && nextAction.kind !== "OPEN_LUCKY") {
    notes.push("A concept is ready for a retention check.");
  }
  const transfer = typeof transferNote === "string" ? transferNote.trim() : "";
  if (transfer) {
    notes.push(transfer);
  }
  const creation = typeof creationNote === "string" ? creationNote.trim() : "";
  if (creation) {
    notes.push(creation);
  }
  if (nextAction.reason) {
    notes.push(nextAction.reason);
  }
  return notes;
}

/**
 * Compose longitudinal continuity from existing Growth Center truth.
 * Deterministic for equivalent inputs. Pure — no DB, no AI persistence.
 */
export function presentLearnerGrowthContinuity(input: {
  growth: GrowthCenterView;
  activeRunByConceptId?: Record<string, string>;
  orchestratorReason?: string | null;
  dueRetentionAvailable?: boolean;
  /** Optional 2P-46 mixed-context transfer note (learner-safe). */
  transferContinuityNote?: string | null;
  /** Optional 2P-47 creation evidence note (learner-safe). */
  creationContinuityNote?: string | null;
}): LearnerGrowthContinuityView {
  const activeRunByConceptId = input.activeRunByConceptId ?? {};
  const temporal = presentTemporalTruthBuckets(input.growth.visibility);
  const primary = pickPrimaryResume({
    focusConceptId: input.growth.focusConceptId,
    activeRunByConceptId,
  });

  const nextAction = resolveLearnerNextAction({
    conceptId: primary.runId
      ? primary.conceptId
      : input.growth.focusConceptId,
    activeRunId: primary.runId,
    orchestratorReason: input.orchestratorReason,
    dueRetentionAvailable: input.dueRetentionAvailable === true,
  });

  return {
    source: CANONICAL_ULE_MASTERY_SOURCE,
    growth: input.growth,
    temporal,
    nextAction,
    activeRunByConceptId,
    primaryResumeRunId: primary.runId,
    continuityNotes: buildContinuityNotes(
      temporal,
      nextAction,
      primary.runId != null,
      input.transferContinuityNote,
      input.creationContinuityNote,
      input.dueRetentionAvailable === true,
    ),
  };
}

export function presentLearnerGrowthHubTeaser(
  continuity: LearnerGrowthContinuityView,
): LearnerGrowthHubTeaser {
  const { temporal, nextAction } = continuity;
  const recent = temporal.recentlyDemonstrated[0];
  const historical = temporal.historicallyDemonstrated[0];
  const weak = temporal.currentlyWeak[0];
  const insufficient = temporal.needsMoreEvidence[0];

  return {
    source: CANONICAL_ULE_MASTERY_SOURCE,
    recentlyDemonstratedLine: recent
      ? `You recently demonstrated progress on ${titleOf(recent)}.`
      : null,
    historicallyDemonstratedLine: historical
      ? `You previously demonstrated progress on ${titleOf(historical)}.`
      : null,
    needsWorkLine: weak
      ? `Recent evidence shows you need more practice with ${titleOf(weak)}.`
      : null,
    needsMoreEvidenceLine: insufficient
      ? `${titleOf(insufficient)} still needs more evidence.`
      : null,
    nextAction,
    continueHref:
      nextAction.kind === "CONTINUE_ADAPTIVE" && nextAction.href
        ? nextAction.href
        : null,
    why: nextAction.reason,
    hasActiveAdaptive: continuity.primaryResumeRunId != null,
    growthCenterHref: "/study/learner-model",
  };
}

export function learnerGrowthContinuityTruthSummary(): {
  createsGrowthEngine: false;
  createsJourneyEngine: false;
  createsPlanningEngine: false;
  createsProgressEngine: false;
  createsSecondMasteryStore: false;
  createsSecondPlanner: false;
  createsSecondRetention: false;
  usesExistingGrowthCenter: true;
  usesExistingLearningAction: true;
  usesAdaptiveSequenceRun: true;
  deterministic: true;
} {
  return {
    createsGrowthEngine: false,
    createsJourneyEngine: false,
    createsPlanningEngine: false,
    createsProgressEngine: false,
    createsSecondMasteryStore: false,
    createsSecondPlanner: false,
    createsSecondRetention: false,
    usesExistingGrowthCenter: true,
    usesExistingLearningAction: true,
    usesAdaptiveSequenceRun: true,
    deterministic: true,
  };
}
