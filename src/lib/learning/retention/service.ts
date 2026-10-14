import type { RetentionOutcome } from "@/generated/prisma";

import { db } from "@/lib/db";
import {
  defaultPriorityForSource,
  nextReviewAtForOutcome,
  resolveSyncedDueAt,
  statusForDueAt,
  type UpsertRetentionInput,
} from "@/lib/learning/retention/schedule";

function parseMetadata(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/**
 * Create or update a RetentionItem idempotently by (userId, sourceType, sourceRef).
 * Soft over-review guard: does not pull future SUCCESS schedules earlier on sync
 * unless flashcard SM-2 is the schedule authority.
 */
export async function upsertRetentionItem(input: UpsertRetentionInput) {
  const existing = await db.retentionItem.findUnique({
    where: {
      userId_sourceType_sourceRef: {
        userId: input.userId,
        sourceType: input.sourceType,
        sourceRef: input.sourceRef,
      },
    },
  });

  const proposed = input.dueAt ?? new Date();
  const authority =
    typeof input.metadata?.scheduleAuthority === "string"
      ? input.metadata.scheduleAuthority
      : null;
  const dueAt = resolveSyncedDueAt({
    proposedDueAt: proposed,
    existingDueAt: existing?.dueAt ?? null,
    existingLastOutcome: existing?.lastOutcome ?? null,
    existingReviewCount: existing?.reviewCount ?? 0,
    scheduleAuthority: authority,
    now: input.now,
  });
  const status = input.status ?? statusForDueAt(dueAt, input.now);
  const priority = input.priority ?? defaultPriorityForSource(input.sourceType);
  const metadataJson = JSON.stringify(input.metadata ?? {});

  return db.retentionItem.upsert({
    where: {
      userId_sourceType_sourceRef: {
        userId: input.userId,
        sourceType: input.sourceType,
        sourceRef: input.sourceRef,
      },
    },
    create: {
      userId: input.userId,
      sourceType: input.sourceType,
      sourceRef: input.sourceRef,
      conceptId: input.conceptId ?? null,
      dueAt,
      status,
      priority,
      metadataJson,
    },
    update: {
      conceptId: input.conceptId ?? undefined,
      dueAt,
      status,
      priority,
      metadataJson,
    },
  });
}

export async function findDueRetentionItems(
  userId: string,
  options?: { limit?: number; now?: Date },
) {
  const now = options?.now ?? new Date();
  const limit = options?.limit ?? 50;

  return db.retentionItem.findMany({
    where: {
      userId,
      status: { not: "COMPLETED" },
      OR: [{ dueAt: null }, { dueAt: { lte: now } }, { status: "DUE" }],
    },
    orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
    take: limit,
  });
}

export async function findPriorityRetentionItems(
  userId: string,
  options?: { limit?: number },
) {
  return db.retentionItem.findMany({
    where: {
      userId,
      status: { in: ["ACTIVE", "DUE"] },
    },
    orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
    take: options?.limit ?? 20,
  });
}

/**
 * Record a retention outcome and schedule the next review.
 * Does not mutate flashcard SM-2 fields (those remain authoritative for cards).
 * Optional metadataMerge stores variant / misconception / successStreak context.
 */
export async function recordRetentionOutcome(input: {
  userId: string;
  retentionItemId: string;
  outcome: RetentionOutcome;
  metadataMerge?: Record<string, unknown>;
  now?: Date;
}) {
  const item = await db.retentionItem.findFirst({
    where: { id: input.retentionItemId, userId: input.userId },
  });
  if (!item) return null;

  const now = input.now ?? new Date();
  const meta = parseMetadata(item.metadataJson);
  const priorSuccessStreak =
    item.lastOutcome === "SUCCESS"
      ? typeof meta.successStreak === "number" &&
        Number.isFinite(meta.successStreak)
        ? Math.max(0, meta.successStreak)
        : 1
      : 0;
  const successStreak =
    input.outcome === "SUCCESS" ? priorSuccessStreak + 1 : 0;

  const dueAt = nextReviewAtForOutcome(input.outcome, now, {
    priorSuccessStreak,
  });
  const status =
    input.outcome === "SUCCESS" && successStreak >= 2
      ? ("ACTIVE" as const)
      : statusForDueAt(dueAt, now);

  let base = meta;
  if (input.metadataMerge && Object.keys(input.metadataMerge).length > 0) {
    base = { ...base, ...input.metadataMerge };
  }
  const metadataJson = JSON.stringify({
    ...base,
    successStreak,
  });

  return db.retentionItem.update({
    where: { id: item.id },
    data: {
      lastOutcome: input.outcome,
      lastReviewedAt: now,
      reviewCount: { increment: 1 },
      dueAt,
      status,
      metadataJson,
    },
  });
}

export async function countDueRetentionItems(
  userId: string,
  now: Date = new Date(),
) {
  return db.retentionItem.count({
    where: {
      userId,
      status: { not: "COMPLETED" },
      OR: [{ dueAt: null }, { dueAt: { lte: now } }, { status: "DUE" }],
    },
  });
}

export async function countDueBySource(
  userId: string,
  now: Date = new Date(),
) {
  const due = await findDueRetentionItems(userId, { limit: 200, now });
  const counts = {
    missedQuestions: 0,
    dueFlashcards: 0,
    weakMastery: 0,
    other: 0,
    total: due.length,
  };
  for (const item of due) {
    if (item.sourceType === "MISSED_QUESTION") counts.missedQuestions += 1;
    else if (item.sourceType === "FLASHCARD") counts.dueFlashcards += 1;
    else if (item.sourceType === "WEAK_MASTERY") counts.weakMastery += 1;
    else counts.other += 1;
  }
  return counts;
}
