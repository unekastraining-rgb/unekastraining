/**
 * 2G-70 WS6 — Study Now / Planner → ULE entry bridge (pure helpers).
 *
 * When a planner/Study Now topic already has an owned Concept link
 * (Topic.conceptId), expose an optional Adaptive entry CTA.
 *
 * Does NOT:
 * - replace buildStudyNowPlan / planner
 * - invent Concepts from topic names
 * - diagnose mastery
 * - write evidence or ConceptMastery
 */

import {
  resolveHubAdaptivePrimaryCta,
  type HubAdaptivePrimaryCta,
} from "@/lib/learning/orchestrator/hub-adaptive-bridge";
import type { StudyNowTopicPick } from "@/lib/csl/study-now";

export type StudyNowUleBridgePick = StudyNowTopicPick & {
  /** Opaque owned Concept id when Topic.conceptId is set — never invented. */
  conceptId: string | null;
  /**
   * Optional Adaptive entry — only when conceptId is present.
   * Viewing/planning never writes evidence.
   */
  adaptiveCta: HubAdaptivePrimaryCta;
};

/**
 * Attach Concept ids and Adaptive CTAs to existing Study Now topic picks.
 * Missing map entries → conceptId null → adaptiveCta none.
 */
export function enrichStudyNowFocusTopicsWithUleBridge(
  picks: StudyNowTopicPick[],
  conceptIdByTopicId: ReadonlyMap<string, string | null | undefined>,
): StudyNowUleBridgePick[] {
  return picks.map((pick) => {
    const raw = conceptIdByTopicId.get(pick.topicId);
    const conceptId =
      typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
    return {
      ...pick,
      conceptId,
      adaptiveCta: resolveHubAdaptivePrimaryCta({ conceptId }),
    };
  });
}

/** Planner assignment → Adaptive entry only when concept is already known. */
export function resolvePlannerAdaptiveEntry(input: {
  conceptId?: string | null;
  activeRunId?: string | null;
}): HubAdaptivePrimaryCta {
  return resolveHubAdaptivePrimaryCta({
    conceptId: input.conceptId,
    activeRunId: input.activeRunId,
  });
}

export function studyNowUleBridgeTruthSummary(): {
  replacesPlanner: false;
  inventsConcepts: false;
  diagnosesMastery: false;
  viewingWritesEvidence: false;
  viewingWritesMastery: false;
  usesExistingAdaptiveEntry: true;
} {
  return {
    replacesPlanner: false,
    inventsConcepts: false,
    diagnosesMastery: false,
    viewingWritesEvidence: false,
    viewingWritesMastery: false,
    usesExistingAdaptiveEntry: true,
  };
}
