/**
 * 2P-43 — Server resolve for longitudinal continuity (session-owned only).
 * Loads ConceptMastery + LearningAttempt + ACTIVE AdaptiveSequenceRun.
 * Never trusts client userId / mastery / completion.
 * 2P-46 — Optional mixed-context transfer note from existing sourceRefs.
 */

import { db } from "@/lib/db";
import { indexActiveRunIdByConcept } from "@/lib/learning/learner-model/growth-action-continuity";
import { presentGrowthCenter } from "@/lib/learning/learner-model/present-growth-center";
import { presentRecentEvidenceTimeline } from "@/lib/learning/learner-model/present-recent-evidence";
import { presentLearnerModelVisibility } from "@/lib/learning/mastery/present-learner-model";
import { findDueRetentionItems } from "@/lib/learning/retention";
import { listActiveAdaptiveSequenceRuns } from "@/lib/learning/sequence/coordinator";
import { interpretMixedContextEvidence } from "@/lib/learning/transfer";
import { interpretCreationEvidenceNote } from "@/lib/learning/creation";
import {
  presentLearnerGrowthContinuity,
  presentLearnerGrowthHubTeaser,
  type LearnerGrowthHubTeaser,
} from "./present-continuity";
import type { LearnerGrowthContinuityView } from "./types";

const CONCEPT_MASTERY_LIMIT = 40;
const RECENT_EVIDENCE_LIMIT = 12;

export type ResolveLearnerGrowthContinuityResult = {
  continuity: LearnerGrowthContinuityView;
  hubTeaser: LearnerGrowthHubTeaser;
  evidenceUnavailable: boolean;
  truncated: boolean;
};

/**
 * Resolve longitudinal continuity for an authenticated learner id.
 * Caller must pass session userId — never a client-supplied learnerId.
 */
export async function resolveLearnerGrowthContinuityForUser(
  userId: string,
  options?: {
    now?: Date;
    orchestratorReason?: string | null;
  },
): Promise<ResolveLearnerGrowthContinuityResult> {
  const uid = typeof userId === "string" ? userId.trim() : "";
  if (!uid) {
    throw new Error("resolveLearnerGrowthContinuityForUser requires userId");
  }

  const now = options?.now ?? new Date();
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  const masteryRows = await db.conceptMastery.findMany({
    where: { userId: uid },
    orderBy: { updatedAt: "desc" },
    take: CONCEPT_MASTERY_LIMIT,
    include: { concept: { select: { id: true, title: true } } },
  });

  const visibility = presentLearnerModelVisibility(
    masteryRows.map((row) => ({
      conceptId: row.conceptId,
      conceptTitle: row.concept.title,
      recentlyUpdated: row.updatedAt.getTime() >= weekAgo,
      conceptMastery: {
        recognize: row.recognize,
        explain: row.explain,
        apply: row.apply,
        solve: row.solve,
        perform: row.perform,
        retain: row.retain,
        confidence: row.confidence,
        reviewCount: row.reviewCount,
      },
    })),
  );

  let recentEvidence = presentRecentEvidenceTimeline([]);
  let evidenceUnavailable = false;
  let attemptRows: Array<{
    conceptId: string;
    sourceRefJson: string | null;
    outcome: string;
  }> = [];
  try {
    const attempts = await db.learningAttempt.findMany({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
      take: RECENT_EVIDENCE_LIMIT,
      select: {
        conceptId: true,
        skillFacet: true,
        outcome: true,
        createdAt: true,
        sourceRefJson: true,
        concept: { select: { title: true } },
      },
    });
    attemptRows = attempts
      .filter((a): a is typeof a & { conceptId: string } => Boolean(a.conceptId))
      .map((a) => ({
        conceptId: a.conceptId as string,
        sourceRefJson: a.sourceRefJson,
        outcome: String(a.outcome),
      }));
    recentEvidence = presentRecentEvidenceTimeline(
      attempts.map((a) => ({
        conceptId: a.conceptId,
        conceptTitle: a.concept?.title ?? null,
        skillFacet: a.skillFacet,
        outcome: a.outcome,
        createdAt: a.createdAt,
      })),
      { limit: RECENT_EVIDENCE_LIMIT, now },
    );
  } catch {
    evidenceUnavailable = true;
  }

  const growth = presentGrowthCenter({ visibility, recentEvidence });

  const focusId = growth.focusConceptId ?? attemptRows[0]?.conceptId ?? null;
  let transferContinuityNote: string | null = null;
  let creationContinuityNote: string | null = null;
  if (focusId && attemptRows.length > 0) {
    const forFocus = attemptRows.filter((a) => a.conceptId === focusId);
    transferContinuityNote =
      interpretMixedContextEvidence(forFocus).learnerSafeLine;
    const newest = forFocus[0];
    if (newest?.sourceRefJson) {
      try {
        const ref = JSON.parse(newest.sourceRefJson) as {
          kind?: string;
          requiresRevision?: boolean;
        };
        creationContinuityNote = interpretCreationEvidenceNote({
          sourceKind: ref.kind ?? null,
          outcome: newest.outcome,
          requiresRevision: ref.requiresRevision ?? null,
        });
      } catch {
        creationContinuityNote = null;
      }
    }
  }

  let activeRunByConceptId: Record<string, string> = {};
  try {
    const activeRuns = await listActiveAdaptiveSequenceRuns(uid);
    activeRunByConceptId = indexActiveRunIdByConcept(
      activeRuns.map((r) => ({ id: r.id, conceptId: r.conceptId })),
    );
  } catch {
    activeRunByConceptId = {};
  }

  let dueRetentionAvailable = false;
  try {
    const due = await findDueRetentionItems(uid, { limit: 1 });
    dueRetentionAvailable = due.length > 0;
  } catch {
    dueRetentionAvailable = false;
  }

  const continuity = presentLearnerGrowthContinuity({
    growth,
    activeRunByConceptId,
    orchestratorReason: options?.orchestratorReason,
    dueRetentionAvailable,
    transferContinuityNote,
    creationContinuityNote,
  });

  return {
    continuity,
    hubTeaser: presentLearnerGrowthHubTeaser(continuity),
    evidenceUnavailable,
    truncated: masteryRows.length >= CONCEPT_MASTERY_LIMIT,
  };
}
