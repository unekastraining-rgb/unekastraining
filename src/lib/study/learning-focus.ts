/**
 * Learner-facing focus intents for Study Hub / Learn / SIX entry.
 * These are UX query params — not a new recommendation engine.
 */

export type LearningFocus =
  | "teach"
  | "study"
  | "practice"
  | "test"
  | "remember"
  | "tutor"
  | "explain";

const FOCUS_VALUES: readonly LearningFocus[] = [
  "teach",
  "study",
  "practice",
  "test",
  "remember",
  "tutor",
  "explain",
] as const;

export function parseLearningFocus(
  value: string | null | undefined,
): LearningFocus | null {
  const v = value?.trim().toLowerCase();
  if (!v) return null;
  return (FOCUS_VALUES as readonly string[]).includes(v)
    ? (v as LearningFocus)
    : null;
}

/** Cold / Learn entry should teach before the first required recall. */
export function shouldTeachBeforePractice(input: {
  focus: LearningFocus | null;
  /** active-recall / blurting-style entries may practice first when focus allows */
  techniquePrefersRecallFirst?: boolean;
}): boolean {
  const { focus, techniquePrefersRecallFirst } = input;
  if (focus === "practice" || focus === "explain" || focus === "test") {
    return false;
  }
  if (focus === "teach" || focus === "tutor" || focus === "study") {
    return true;
  }
  // Default Hub / deep links with no focus: teach-first unless technique is recall-native
  if (techniquePrefersRecallFirst) return false;
  return true;
}

export function withLearningFocus(
  href: string,
  focus: LearningFocus,
): string {
  if (!href) return href;
  if (href.includes("focus=")) return href;
  return `${href}${href.includes("?") ? "&" : "?"}focus=${focus}`;
}
