/**
 * 2P-52 — Read-side retention horizon (NOT_DUE / UPCOMING / DUE / OVERDUE).
 * Derived from dueAt + now — not a new persisted mastery/decay store.
 * Neutral learner language — no “you forgot” claims.
 */

export type RetentionHorizonState =
  | "NOT_DUE"
  | "UPCOMING"
  | "DUE"
  | "OVERDUE";

const HOUR = 60 * 60 * 1000;

/** Upcoming window: due within 48h but still in the future. */
export const RETENTION_UPCOMING_WINDOW_MS = 48 * HOUR;
/** Overdue: more than 24h past dueAt. */
export const RETENTION_OVERDUE_AFTER_MS = 24 * HOUR;

export function classifyRetentionHorizon(
  dueAt: Date | null | undefined,
  now: Date = new Date(),
): RetentionHorizonState {
  if (!dueAt) return "DUE";
  const t = dueAt.getTime();
  const n = now.getTime();
  if (t > n + RETENTION_UPCOMING_WINDOW_MS) return "NOT_DUE";
  if (t > n) return "UPCOMING";
  if (t <= n - RETENTION_OVERDUE_AFTER_MS) return "OVERDUE";
  return "DUE";
}

export function retentionHorizonLabel(state: RetentionHorizonState): string {
  switch (state) {
    case "OVERDUE":
      return "Worth revisiting";
    case "DUE":
      return "Ready for a retention check";
    case "UPCOMING":
      return "Coming up for another check";
    case "NOT_DUE":
      return "Not due yet";
  }
}

/** Soft Growth / NextAction line — factual, not alarming. */
export function retentionContinuityReason(state: RetentionHorizonState): string {
  switch (state) {
    case "OVERDUE":
      return "A retention check is overdue — Lucky can help you revisit it.";
    case "DUE":
      return "You have a retention check ready.";
    case "UPCOMING":
      return "A retention check is coming up soon.";
    case "NOT_DUE":
      return "No retention check is due right now.";
  }
}

export function longHorizonHorizonTruthSummary(): {
  inventsForgettingDiagnosis: false;
  inventsDecayGapEnum: false;
  readSideOnly: true;
  absenceOfActivityIsNotFailure: true;
  longGapIsNotProofOfForgetting: true;
} {
  return {
    inventsForgettingDiagnosis: false,
    inventsDecayGapEnum: false,
    readSideOnly: true,
    absenceOfActivityIsNotFailure: true,
    longGapIsNotProofOfForgetting: true,
  };
}
