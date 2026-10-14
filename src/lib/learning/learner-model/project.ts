/**
 * Phase 2G-79 — Cross-activity Learner Model projection (read-only).
 *
 * Not a second Learner Model. Not a second mastery store.
 * Projects existing canonical sources for ULE consumers and learner-facing surfaces.
 *
 * ConceptMastery = mastery truth
 * LearningAttempt = evidence
 * AdaptiveSequenceRun = progression (never mastery)
 * RetentionItem = retention scheduling (never mastery)
 * TopicMastery = legacy sidecar only
 */

import { db } from "@/lib/db";
import { classifyEvidenceSourceKind } from "@/lib/learning/evidence/aggregate";
import {
  CANONICAL_ULE_MASTERY_SOURCE,
  LEGACY_TOPIC_PROGRESS_SOURCE,
  resolveLearnerFacingUleMastery,
  type LearnerFacingUleMastery,
} from "@/lib/learning/mastery/mastery-truth";
import { getLearnerConceptMastery } from "@/lib/learning/learner-model/read";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";

export type LearnerConceptStateProjection = {
  conceptId: string;
  learnerId: string;
  conceptTitle: string;
  /** Canonical ULE mastery claim (ConceptMastery only). */
  mastery: LearnerFacingUleMastery;
  /** Full ConceptMastery-backed summary (includes optional evidenceSignals). */
  summary: LearnerConceptMasterySummary;
  /** Soft recent evidence counts by classified source (from LearningAttempt). */
  recentActivity: {
    totalAttempts: number;
    bySource: {
      quiz: number;
      flashcard: number;
      study_evaluate: number;
      tutor: number;
      lucky: number;
      activity: number;
      other: number;
    };
  };
  /** Progression cursor — not mastery. */
  activeAdaptiveRun: {
    runId: string;
    status: string;
    currentStepIndex: number;
  } | null;
  /** Retention scheduling — not mastery. */
  retentionState: {
    itemId: string;
    dueAt: Date | null;
    priority: number | null;
    status: string | null;
  } | null;
  /** Explicit legacy sidecar; never treated as ULE mastery. */
  topicProgressSidecar: {
    source: typeof LEGACY_TOPIC_PROGRESS_SOURCE;
    present: boolean;
  };
};

/**
 * Read-only projection of coherent learner state for one owned Concept.
 * Returns null when the Concept is missing or not owned by the learner.
 */
export async function projectLearnerConceptState(
  learnerId: string,
  conceptId: string,
): Promise<LearnerConceptStateProjection | null> {
  const summary = await getLearnerConceptMastery(learnerId, conceptId);
  if (!summary) return null;

  const mastery = resolveLearnerFacingUleMastery({
    recognize: summary.facets.recognize,
    explain: summary.facets.explain,
    apply: summary.facets.apply,
    solve: summary.facets.solve,
    perform: summary.facets.perform,
    retain: summary.facets.retain,
    confidence: summary.facets.confidence,
    reviewCount: summary.reviewCount,
  });

  const bySource = {
    quiz: 0,
    flashcard: 0,
    study_evaluate: 0,
    tutor: 0,
    lucky: 0,
    activity: 0,
    other: 0,
  };

  let totalAttempts = 0;
  try {
    const rows = await db.learningAttempt.findMany({
      where: { userId: learnerId, conceptId },
      select: { sourceRefJson: true },
      take: 200,
      orderBy: { createdAt: "desc" },
    });
    totalAttempts = rows.length;
    for (const row of rows) {
      bySource[classifyEvidenceSourceKind(row.sourceRefJson)] += 1;
    }
  } catch (error) {
    console.error(
      "Learner Model recentActivity read failed (projection still returned):",
      error,
    );
  }

  let activeAdaptiveRun: LearnerConceptStateProjection["activeAdaptiveRun"] =
    null;
  try {
    const run = await db.adaptiveSequenceRun.findFirst({
      where: { userId: learnerId, conceptId, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        status: true,
        currentStepIndex: true,
      },
    });
    if (run) {
      activeAdaptiveRun = {
        runId: run.id,
        status: run.status,
        currentStepIndex: run.currentStepIndex,
      };
    }
  } catch (error) {
    console.error(
      "Learner Model adaptive-run projection failed (ignored):",
      error,
    );
  }

  let retentionState: LearnerConceptStateProjection["retentionState"] = null;
  try {
    const item = await db.retentionItem.findFirst({
      where: { userId: learnerId, conceptId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        dueAt: true,
        priority: true,
        status: true,
      },
    });
    if (item) {
      retentionState = {
        itemId: item.id,
        dueAt: item.dueAt ?? null,
        priority: item.priority ?? null,
        status: item.status ?? null,
      };
    }
  } catch (error) {
    console.error(
      "Learner Model retention projection failed (ignored):",
      error,
    );
  }

  return {
    conceptId,
    learnerId,
    conceptTitle: summary.conceptTitle,
    mastery,
    summary,
    recentActivity: { totalAttempts, bySource },
    activeAdaptiveRun,
    retentionState,
    topicProgressSidecar: {
      source: LEGACY_TOPIC_PROGRESS_SOURCE,
      present: summary.topicMastery != null,
    },
  };
}

/** Hard invariants for tests / callers — projection is not a write path. */
export function learnerModelProjectionInvariants(): {
  canonicalMastery: typeof CANONICAL_ULE_MASTERY_SOURCE;
  projectionIsSourceOfTruth: false;
  adaptiveRunIsMastery: false;
  retentionIsMastery: false;
  topicMasteryIsUleMastery: false;
  evidenceSummaryIsMastery: false;
} {
  return {
    canonicalMastery: CANONICAL_ULE_MASTERY_SOURCE,
    projectionIsSourceOfTruth: false,
    adaptiveRunIsMastery: false,
    retentionIsMastery: false,
    topicMasteryIsUleMastery: false,
    evidenceSummaryIsMastery: false,
  };
}
