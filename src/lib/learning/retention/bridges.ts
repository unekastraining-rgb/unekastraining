import { db } from "@/lib/db";
import { ensureConceptForTopic } from "@/lib/learning/knowledge/concept";
import { upsertRetentionItem } from "@/lib/learning/retention/service";
import { statusForDueAt } from "@/lib/learning/retention/schedule";

/** Bridge a MissedQuestion into RetentionItem (idempotent). */
export async function syncMissedQuestionRetentionItem(input: {
  userId: string;
  missedQuestionId: string;
  topicId?: string | null;
  nextReviewAt?: Date | null;
}) {
  let conceptId: string | null = null;
  if (input.topicId) {
    try {
      conceptId = (await ensureConceptForTopic(input.userId, input.topicId)).id;
    } catch {
      conceptId = null;
    }
  }

  const dueAt = input.nextReviewAt ?? new Date();
  return upsertRetentionItem({
    userId: input.userId,
    sourceType: "MISSED_QUESTION",
    sourceRef: input.missedQuestionId,
    conceptId,
    dueAt,
    status: statusForDueAt(dueAt),
    priority: 0.85,
    metadata: { topicId: input.topicId ?? null },
  });
}

/**
 * Mirror a flashcard's existing SM-2 schedule into RetentionItem.
 * Flashcard SM-2 fields remain authoritative — this does not recalculate SM-2.
 */
export async function syncFlashcardRetentionItem(input: {
  userId: string;
  flashcardId: string;
  topicId: string;
  nextReviewAt?: Date | null;
}) {
  let conceptId: string | null = null;
  try {
    conceptId = (await ensureConceptForTopic(input.userId, input.topicId)).id;
  } catch {
    conceptId = null;
  }

  const dueAt = input.nextReviewAt ?? new Date();
  return upsertRetentionItem({
    userId: input.userId,
    sourceType: "FLASHCARD",
    sourceRef: input.flashcardId,
    conceptId,
    dueAt,
    status: statusForDueAt(dueAt),
    priority: 0.6,
    metadata: { topicId: input.topicId, scheduleAuthority: "flashcard_sm2" },
  });
}

/** Weak ConceptMastery (retain) → RetentionItem when enough evidence exists. */
export async function syncWeakMasteryRetentionItem(input: {
  userId: string;
  conceptId: string;
  retain: number;
  reviewCount: number;
  nextReviewAt?: Date | null;
  /** Soft tag when Adaptive COMPLETED handoff created/refreshed this item. */
  fromAdaptiveCompletion?: boolean;
  misconceptionSignals?: string[];
  conceptKey?: string | null;
}) {
  // Require enough evidence; do not invent retention from empty mastery.
  if (input.reviewCount < 1) return null;
  if (input.retain >= 0.45) {
    // Not weak — complete any existing item for this concept source.
    const existing = await db.retentionItem.findUnique({
      where: {
        userId_sourceType_sourceRef: {
          userId: input.userId,
          sourceType: "WEAK_MASTERY",
          sourceRef: input.conceptId,
        },
      },
    });
    if (existing && existing.status !== "COMPLETED") {
      return db.retentionItem.update({
        where: { id: existing.id },
        data: { status: "COMPLETED" },
      });
    }
    return null;
  }

  const dueAt = input.nextReviewAt ?? new Date();
  return upsertRetentionItem({
    userId: input.userId,
    sourceType: "WEAK_MASTERY",
    sourceRef: input.conceptId,
    conceptId: input.conceptId,
    dueAt,
    status: statusForDueAt(dueAt),
    priority: input.fromAdaptiveCompletion ? 0.78 : 0.7,
    metadata: {
      retain: input.retain,
      reviewCount: input.reviewCount,
      ...(input.fromAdaptiveCompletion
        ? { fromAdaptiveCompletion: true, retentionReason: "ADAPTIVE_COMPLETION" }
        : { retentionReason: "WEAK_MASTERY" }),
      ...(input.misconceptionSignals?.length
        ? {
            misconceptionSignals: input.misconceptionSignals,
            retentionReason: "MISCONCEPTION",
          }
        : {}),
      ...(input.conceptKey ? { conceptKey: input.conceptKey } : {}),
    },
  });
}

/**
 * Best-effort sync of due flashcards, open missed questions, and weak mastery
 * into RetentionItem. Used by Lucky read path — never throws to callers.
 */
export async function syncRetentionSourcesForUser(userId: string) {
  const now = new Date();
  let synced = 0;

  const missed = await db.missedQuestion.findMany({
    where: { userId, mastered: false },
    take: 50,
    orderBy: { updatedAt: "desc" },
  });
  for (const row of missed) {
    await syncMissedQuestionRetentionItem({
      userId,
      missedQuestionId: row.id,
      topicId: row.topicId,
      nextReviewAt: row.nextReviewAt,
    });
    synced += 1;
  }

  const dueCards = await db.flashcard.findMany({
    where: {
      userId,
      OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
    },
    take: 50,
    orderBy: { nextReviewAt: "asc" },
  });
  for (const card of dueCards) {
    await syncFlashcardRetentionItem({
      userId,
      flashcardId: card.id,
      topicId: card.topicId,
      nextReviewAt: card.nextReviewAt,
    });
    synced += 1;
  }

  const weak = await db.conceptMastery.findMany({
    where: {
      userId,
      retain: { lt: 0.45 },
      reviewCount: { gte: 1 },
    },
    take: 40,
    orderBy: { retain: "asc" },
  });
  for (const row of weak) {
    await syncWeakMasteryRetentionItem({
      userId,
      conceptId: row.conceptId,
      retain: row.retain,
      reviewCount: row.reviewCount,
      nextReviewAt: row.nextReviewAt,
    });
    synced += 1;
  }

  return { synced };
}
