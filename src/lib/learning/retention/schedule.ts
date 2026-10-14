/**
 * 2P-52 — Long-horizon retention schedule (enhances existing RetentionItem dueAt).
 * Deterministic, AI-independent, not FSRS / not a second retention engine.
 * Flashcard SM-2 remains authoritative for FLASHCARD sources.
 */

import type {
  RetentionOutcome,
  RetentionSourceType,
  RetentionStatus,
} from "@/generated/prisma";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * Coarse next-review from outcome + prior consecutive SUCCESS streak.
 * SUCCESS spacing widens: 3d → 7d → 14d → 30d.
 * FAIL/PARTIAL stay short so rechecks remain relevant.
 * Not permanent mastery — only schedule.
 *
 * @param options.priorSuccessStreak consecutive SUCCESS outcomes before this attempt (0 after a fail/new item)
 */
export function nextReviewAtForOutcome(
  outcome: RetentionOutcome,
  from: Date = new Date(),
  options?: { priorSuccessStreak?: number; priorReviewCount?: number },
): Date {
  // priorReviewCount kept for callers that still pass it; prefer priorSuccessStreak.
  const prior =
    typeof options?.priorSuccessStreak === "number"
      ? Math.max(0, options.priorSuccessStreak)
      : Math.max(0, options?.priorReviewCount ?? 0);
  let ms: number;
  if (outcome === "SUCCESS") {
    const streak = prior + 1;
    if (streak >= 4) ms = 30 * DAY;
    else if (streak === 3) ms = 14 * DAY;
    else if (streak === 2) ms = 7 * DAY;
    else ms = 3 * DAY; // 72h — first success
  } else if (outcome === "PARTIAL") {
    ms = 24 * HOUR;
  } else {
    // FAIL / SKIPPED
    ms = 12 * HOUR;
  }
  return new Date(from.getTime() + ms);
}

export function statusForDueAt(
  dueAt: Date | null | undefined,
  now: Date = new Date(),
): RetentionStatus {
  if (!dueAt || dueAt.getTime() <= now.getTime()) return "DUE";
  return "ACTIVE";
}

export function defaultPriorityForSource(sourceType: RetentionSourceType): number {
  switch (sourceType) {
    case "MISSED_QUESTION":
      return 0.85;
    case "WEAK_MASTERY":
      return 0.7;
    case "FLASHCARD":
      return 0.6;
    case "TUTOR_FLAG":
      return 0.75;
    case "MASTERY_DECAY":
      return 0.65;
  }
}

/**
 * Soft over-review guard: do not pull a future dueAt earlier on sync
 * unless flashcard SM-2 is the schedule authority.
 */
export function resolveSyncedDueAt(input: {
  proposedDueAt: Date;
  existingDueAt: Date | null | undefined;
  existingLastOutcome?: string | null;
  existingReviewCount?: number;
  scheduleAuthority?: string | null;
  now?: Date;
}): Date {
  const now = input.now ?? new Date();
  const existing = input.existingDueAt;
  if (!existing || existing.getTime() <= now.getTime()) {
    return input.proposedDueAt;
  }
  if (input.scheduleAuthority === "flashcard_sm2") {
    return input.proposedDueAt;
  }
  // Protect spaced SUCCESS schedules from lazy sync pulling them due early.
  if (
    input.existingLastOutcome === "SUCCESS" &&
    input.proposedDueAt.getTime() < existing.getTime()
  ) {
    return existing;
  }
  return input.proposedDueAt;
}

export type UpsertRetentionInput = {
  userId: string;
  sourceType: RetentionSourceType;
  sourceRef: string;
  conceptId?: string | null;
  dueAt?: Date | null;
  priority?: number;
  status?: RetentionStatus;
  metadata?: Record<string, unknown>;
  /** Injectable clock for tests / deterministic sync. */
  now?: Date;
};

export function longHorizonScheduleTruthSummary(): {
  inventsFSRS: false;
  inventsDecayEngine: false;
  inventsSecondRetentionEngine: false;
  flashcardSm2RemainsAuthoritative: true;
  successSpacingWidens: true;
  failureSpacingShort: true;
  noPermanentMasteryFromSpacing: true;
  noCronRequired: true;
} {
  return {
    inventsFSRS: false,
    inventsDecayEngine: false,
    inventsSecondRetentionEngine: false,
    flashcardSm2RemainsAuthoritative: true,
    successSpacingWidens: true,
    failureSpacingShort: true,
    noPermanentMasteryFromSpacing: true,
    noCronRequired: true,
  };
}
