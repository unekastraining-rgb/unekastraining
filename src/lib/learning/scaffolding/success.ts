/**
 * 2P-12 — Project "what success looks like" from existing evaluation metadata.
 * Pure. Never promises a score the evaluator does not calculate.
 */

import type { UniversalContentActivityKind } from "@/lib/learning/activities/content-contract";
import type { LearningExperienceActivityKind } from "@/lib/learning/experience/types";

export type SuccessLooksLikeSource = {
  activityKind: LearningExperienceActivityKind;
  objective?: string | null;
  evaluationMode?: "execution" | "structural" | "sqljs" | "rubric" | "math_steps" | "network_state" | "language_match" | null;
  rubricLabels?: readonly string[] | null;
  entryFunction?: string | null;
  minChars?: number | null;
  /** Optional authored learner-facing success line from content. */
  authoredSuccessLooksLike?: string | null;
};

/**
 * Concise learner-facing success description from existing metadata.
 * Returns null when nothing truthful can be said beyond generic completion copy.
 */
export function projectSuccessLooksLike(
  source: SuccessLooksLikeSource,
): string | null {
  const authored = source.authoredSuccessLooksLike?.trim();
  if (authored) return authored;

  const objective = source.objective?.trim() || null;
  const kind = source.activityKind;

  if (kind === "six") {
    return objective
      ? `Success means your guided response demonstrates: ${objective}`
      : "Success means you demonstrated understanding through the guided technique.";
  }

  if (kind === "coding") {
    const entry = source.entryFunction?.trim();
    if (!objective && !entry) return null;
    if (source.evaluationMode === "execution") {
      return entry
        ? `Your code should run correctly through \`${entry}\` and demonstrate the required behavior${objective ? `: ${objective}` : "."}`
        : `Your solution should run correctly and demonstrate the required behavior: ${objective}`;
    }
    return entry
      ? `Your sketch should include \`${entry}\` and the required structure${objective ? ` — ${objective}` : "."}`
      : `Your solution should demonstrate the required structure and behavior: ${objective}`;
  }

  if (kind === "sql") {
    if (!objective) {
      return "Your query should return the requested records without using destructive operations.";
    }
    return `Your SELECT query should return the requested records for: ${objective}`;
  }

  const labels = (source.rubricLabels ?? [])
    .map((l) => l.trim())
    .filter(Boolean);
  if (labels.length > 0) {
    const list = labels.slice(0, 5).join("; ");
    const lengthNote =
      source.minChars != null && source.minChars > 0
        ? ` Write at least ${source.minChars} characters.`
        : "";
    return `Your response should address: ${list}.${lengthNote}`;
  }

  if (objective) {
    return `Your submission should demonstrate: ${objective}`;
  }

  // No truthful criteria available — caller may use completionDescription only.
  void (kind as UniversalContentActivityKind | "six");
  return null;
}
