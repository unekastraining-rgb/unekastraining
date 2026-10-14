/**
 * 2P-25 — Universal activity lifecycle states (presentation semantics).
 * Does not replace activity-specific internal state machines.
 */

export const UNIVERSAL_ACTIVITY_STATES = [
  "LOADING",
  "READY",
  "IN_PROGRESS",
  "SUBMITTING",
  "COMPLETED",
  "FAILED_VALIDATION",
  "ABANDONED",
  "UNAVAILABLE",
] as const;

export type UniversalActivityState = (typeof UNIVERSAL_ACTIVITY_STATES)[number];

export function resolveUniversalActivityState(input: {
  loading?: boolean;
  unavailable?: boolean;
  submitting?: boolean;
  completed?: boolean;
  failedValidation?: boolean;
  abandoned?: boolean;
  hasWork?: boolean;
}): UniversalActivityState {
  if (input.unavailable) return "UNAVAILABLE";
  if (input.abandoned) return "ABANDONED";
  if (input.loading) return "LOADING";
  if (input.submitting) return "SUBMITTING";
  if (input.completed) return "COMPLETED";
  if (input.failedValidation) return "FAILED_VALIDATION";
  if (input.hasWork) return "IN_PROGRESS";
  return "READY";
}

/** Learner-safe short status line — never exposes internal enums as raw codes. */
export function universalActivityStateLearnerLine(
  state: UniversalActivityState,
): string {
  switch (state) {
    case "LOADING":
      return "Loading activity…";
    case "READY":
      return "Ready when you are";
    case "IN_PROGRESS":
      return "In progress";
    case "SUBMITTING":
      return "Checking your work…";
    case "COMPLETED":
      return "Activity complete";
    case "FAILED_VALIDATION":
      return "Needs a clearer response before we can check it";
    case "ABANDONED":
      return "Left without finishing";
    case "UNAVAILABLE":
      return "This activity isn’t available right now";
  }
}
