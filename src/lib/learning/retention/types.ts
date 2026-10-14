/**
 * 2P-38 — Universal retention contract (Lucky consumes existing truth).
 * Not a second mastery/evidence engine.
 */

import type { RetentionSourceType } from "@/generated/prisma";

/** Why an item is eligible for Lucky retention — never shown raw to learners. */
export type RetentionReason =
  | "WEAK_MASTERY"
  | "RETENTION_GAP"
  | "RECALL_GAP"
  | "RECENT_FAILURE"
  | "MISCONCEPTION"
  | "DUE_REVIEW"
  | "ADAPTIVE_COMPLETION"
  | "MANUAL_REVIEW"
  | "MISSED_QUESTION"
  | "FLASHCARD_DUE";

export type RetentionDifficulty = 1 | 2 | 3 | 4 | 5;

/**
 * Selection-facing candidate derived from an existing RetentionItem.
 * Does not invent mastery or create parallel stores.
 */
export type RetentionCandidate = {
  retentionItemId: string;
  conceptId: string | null;
  reason: RetentionReason;
  difficulty: RetentionDifficulty;
  stage: "RETAIN";
  source: RetentionSourceType;
  sourceRef: string;
  contextVariant?: string;
  misconceptionSignals?: string[];
  /** Queue priority (higher first). */
  priority: number;
  lastOutcome?: string | null;
  reviewCount: number;
};

/** Soft session cap — avoid candidate spam. */
export const RETENTION_CANDIDATE_CAP = 12;
