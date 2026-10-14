import { db } from "@/lib/db";
import {
  applyFacetDelta,
  emptyFacetScores,
  reviewIntervalHours,
} from "@/lib/learning/mastery/facets";
import type { EvidenceEnvelope, FacetedMasteryScores } from "@/lib/learning/types";

function toScores(row: {
  recognize: number;
  explain: number;
  apply: number;
  solve: number;
  perform: number;
  retain: number;
  confidence: number;
} | null): FacetedMasteryScores {
  if (!row) return emptyFacetScores();
  return {
    recognize: row.recognize,
    explain: row.explain,
    apply: row.apply,
    solve: row.solve,
    perform: row.perform,
    retain: row.retain,
    confidence: row.confidence,
  };
}

/**
 * Evidence → ConceptMastery facet update.
 * Does not replace TopicMastery (dual-write left to callers / existing quiz path).
 */
export async function applyEvidenceToMastery(envelope: EvidenceEnvelope) {
  if (!envelope.conceptId) return null;

  const existing = await db.conceptMastery.findUnique({
    where: {
      userId_conceptId: {
        userId: envelope.learnerId,
        conceptId: envelope.conceptId,
      },
    },
  });

  const next = applyFacetDelta(
    toScores(existing),
    envelope.skillFacet,
    envelope.outcome,
  );
  const hours = reviewIntervalHours(envelope.outcome);
  const nextReviewAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  const now = new Date();

  return db.conceptMastery.upsert({
    where: {
      userId_conceptId: {
        userId: envelope.learnerId,
        conceptId: envelope.conceptId,
      },
    },
    update: {
      ...next,
      reviewCount: { increment: 1 },
      lastReviewedAt: now,
      nextReviewAt,
    },
    create: {
      userId: envelope.learnerId,
      conceptId: envelope.conceptId,
      ...next,
      reviewCount: 1,
      lastReviewedAt: now,
      nextReviewAt,
    },
  }).then(async (row) => {
    try {
      const { syncWeakMasteryRetentionItem } = await import(
        "@/lib/learning/retention"
      );
      await syncWeakMasteryRetentionItem({
        userId: envelope.learnerId,
        conceptId: envelope.conceptId!,
        retain: row.retain,
        reviewCount: row.reviewCount,
        nextReviewAt: row.nextReviewAt,
      });
    } catch (retentionError) {
      console.error(
        "ULE weak-mastery retention bridge failed (mastery still saved):",
        retentionError,
      );
    }
    return row;
  });
}
