/**
 * Bundle I — Contextual activity feedback from authored KL fields.
 * Never fabricates misconceptions or answers for richness.
 */

import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import type {
  InteractiveActivity,
  InteractiveFeedback,
  InteractiveSubmission,
} from "@/lib/learning/activity/runtime/types";

function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function answersMatch(
  given: string,
  expected: string | undefined,
  aliases?: string[],
): boolean {
  if (!expected) return false;
  const g = normalizeAnswer(given);
  const pool = [expected, ...(aliases ?? [])].map(normalizeAnswer);
  return pool.some((p) => p === g || g.includes(p) || p.includes(g));
}

function relatedTitles(activity: InteractiveActivity): string[] {
  const titles: string[] = [];
  for (const id of activity.relatedConceptIds ?? []) {
    const t = findInstructionalConceptById(id)?.concept.title;
    if (t) titles.push(t);
  }
  return titles.slice(0, 4);
}

function baseFeedback(
  activity: InteractiveActivity,
  outcome: InteractiveFeedback["outcome"],
  scored: boolean,
  opts?: { summary?: string; reveal?: boolean },
): InteractiveFeedback {
  const related = relatedTitles(activity);
  const relatedLine =
    related.length > 0
      ? `This concept connects to: ${related.join(", ")}.`
      : "Continue when you are ready.";

  const summary =
    opts?.summary ??
    (outcome === "correct" || outcome === "completed"
      ? `Your response has been recorded. ${relatedLine}`
      : outcome === "incorrect"
        ? `Your response has been recorded. Revisit the idea, then continue.`
        : `Your response has been recorded. ${relatedLine}`);

  const feedback: InteractiveFeedback = {
    outcome,
    summary,
    relatedConceptTitles: related,
    scored,
  };

  if (outcome === "incorrect" && activity.authoredMisconception) {
    feedback.misconceptionNote = activity.authoredMisconception.misconception;
    if (activity.authoredMisconception.correction) {
      feedback.correctionNote = activity.authoredMisconception.correction;
    }
    if (activity.authoredMisconception.contrast) {
      feedback.contrastNote = activity.authoredMisconception.contrast;
    }
    // Enrich summary only with authored material
    if (activity.authoredMisconception.correction) {
      feedback.summary = `Your response has been recorded. ${activity.authoredMisconception.correction} ${relatedLine}`;
    }
  }

  if (
    opts?.reveal &&
    activity.revealAnswerPolicy === "on_request" &&
    activity.expectedAnswer
  ) {
    feedback.revealedAnswer = activity.expectedAnswer;
  }

  return feedback;
}

/**
 * Evaluate a submission against an interactive activity.
 * Open forms (explain, sql_write, code_write, scenario) record as completed/attempted.
 * Does not auto-reveal correct answers.
 */
export function evaluateInteractiveSubmission(
  activity: InteractiveActivity,
  submission: InteractiveSubmission,
  options?: { revealAnswer?: boolean },
): InteractiveFeedback {
  switch (activity.form) {
    case "multiple_choice":
    case "true_false":
    case "code_predict":
    case "prediction":
    case "classification": {
      if (
        typeof activity.correctIndex === "number" &&
        typeof submission.selectedIndex === "number"
      ) {
        const ok = submission.selectedIndex === activity.correctIndex;
        return baseFeedback(activity, ok ? "correct" : "incorrect", true, {
          reveal: options?.revealAnswer,
        });
      }
      return baseFeedback(activity, "attempted", false);
    }
    case "multi_select": {
      const expected = new Set(activity.correctIndices ?? []);
      const given = new Set(submission.selectedIndices ?? []);
      if (expected.size === 0) return baseFeedback(activity, "attempted", false);
      const same =
        expected.size === given.size &&
        [...expected].every((i) => given.has(i));
      return baseFeedback(activity, same ? "correct" : "incorrect", true);
    }
    case "fill_in":
    case "equation_solve":
    case "diagram_label": {
      const text = submission.textAnswer ?? "";
      if (!text.trim()) return baseFeedback(activity, "attempted", false);
      if (!activity.expectedAnswer) {
        return baseFeedback(activity, "completed", false);
      }
      const ok = answersMatch(
        text,
        activity.expectedAnswer,
        activity.answerAliases,
      );
      return baseFeedback(activity, ok ? "correct" : "incorrect", true, {
        reveal: options?.revealAnswer,
      });
    }
    case "ordering": {
      const given = submission.orderedItems ?? [];
      const expected = activity.correctOrder ?? [];
      if (expected.length === 0 || given.length === 0) {
        return baseFeedback(activity, "attempted", false);
      }
      const ok =
        given.length === expected.length &&
        given.every((item, i) => item === expected[i]);
      return baseFeedback(activity, ok ? "correct" : "incorrect", true);
    }
    case "matching": {
      const given = submission.matches ?? {};
      const expected = activity.matchAnswer ?? {};
      const keys = Object.keys(expected);
      if (keys.length === 0) return baseFeedback(activity, "attempted", false);
      const hits = keys.filter((k) => given[k] === expected[k]).length;
      if (hits === keys.length) {
        return baseFeedback(activity, "correct", true);
      }
      if (hits > 0) return baseFeedback(activity, "partial", true);
      return baseFeedback(activity, "incorrect", true);
    }
    case "explain":
    case "short_answer":
    case "code_write":
    case "code_trace":
    case "sql_write":
    case "scenario": {
      const text = submission.textAnswer?.trim() ?? "";
      if (text.length < 2) return baseFeedback(activity, "attempted", false);
      return baseFeedback(activity, "completed", false, {
        summary: `Your response has been recorded. ${
          relatedTitles(activity).length
            ? `This concept connects to: ${relatedTitles(activity).join(", ")}.`
            : "Continue when you are ready."
        }`,
      });
    }
    default:
      return baseFeedback(activity, "attempted", false);
  }
}

/**
 * Honesty guard: feedback must not invent misconception text absent from activity.
 */
export function feedbackUsesOnlyAuthoredMisconceptions(
  activity: InteractiveActivity,
  feedback: InteractiveFeedback,
): boolean {
  if (!feedback.misconceptionNote) return true;
  const authored = activity.authoredMisconception?.misconception;
  return Boolean(authored && feedback.misconceptionNote === authored);
}
