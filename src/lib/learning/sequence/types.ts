/**
 * Phase 2G-2 — Adaptive sequence run step / history contracts.
 * Thin coordination state only; does not store evidence or mastery.
 */

export const ADAPTIVE_SEQUENCE_RUN_STATUSES = [
  "ACTIVE",
  "COMPLETED",
  "ABANDONED",
] as const;

export type AdaptiveSequenceRunStatusName =
  (typeof ADAPTIVE_SEQUENCE_RUN_STATUSES)[number];

/**
 * One ordered step in a run.
 * LearningObject remains activity identity; intervention is a descriptor
 * (typically a SIX slug such as "detailed-explanation").
 */
export type AdaptiveSequenceStep = {
  intervention: string;
  learningObjectId?: string | null;
};

/**
 * Lightweight intervention history entry for future loop safeguards.
 * Does not store answers, scores, or misconception payloads.
 */
export type AdaptiveSequenceHistoryEntry = {
  stepIndex: number;
  intervention: string;
  learningObjectId?: string | null;
  attemptId?: string | null;
};

export function isAdaptiveSequenceRunStatus(
  value: unknown,
): value is AdaptiveSequenceRunStatusName {
  return (
    typeof value === "string" &&
    (ADAPTIVE_SEQUENCE_RUN_STATUSES as readonly string[]).includes(value)
  );
}
