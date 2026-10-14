/**
 * Phase 2G-7 — Adaptive sequence COMPLETE → existing weak-mastery retention bridge.
 * Soft-fail only: never rolls back COMPLETED; never creates mastery or RetentionItem itself.
 */
import { getLearnerConceptMastery } from "@/lib/learning/learner-model/read";
import { syncWeakMasteryRetentionItem } from "@/lib/learning/retention";

/**
 * After ACTIVE → COMPLETED, read current ConceptMastery and invoke the existing
 * WEAK_MASTERY retention bridge. Isolated from sequence lifecycle failures.
 */
export async function syncLuckyRetentionAfterSequenceComplete(input: {
  userId: string;
  conceptId: string;
  runId: string;
}): Promise<void> {
  try {
    const mastery = await getLearnerConceptMastery(
      input.userId,
      input.conceptId,
    );

    if (!mastery) {
      console.warn(
        "ULE adaptive sequence Lucky handoff skipped (no owned ConceptMastery summary):",
        {
          runId: input.runId,
          conceptId: input.conceptId,
        },
      );
      return;
    }

    await syncWeakMasteryRetentionItem({
      userId: input.userId,
      conceptId: input.conceptId,
      retain: mastery.facets.retain,
      reviewCount: mastery.reviewCount,
      nextReviewAt: mastery.nextReviewAt,
      fromAdaptiveCompletion: true,
    });
  } catch (error) {
    console.error(
      "ULE adaptive sequence Lucky handoff failed (sequence still COMPLETED):",
      error,
    );
  }
}
