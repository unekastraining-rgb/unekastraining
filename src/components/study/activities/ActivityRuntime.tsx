"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { InteractiveFormControls } from "@/components/study/activities/InteractiveFormControls";
import type {
  InteractiveActivity,
  InteractiveFeedback,
  InteractiveSubmission,
} from "@/lib/learning/activity/runtime";
import { evaluateInteractiveSubmission } from "@/lib/learning/activity/runtime";

/**
 * Bundle I/J — In-stage interactive activity runtime.
 * Renders LAF-backed forms in the Learning Stage (not a side questionnaire).
 */
export function ActivityRuntime({
  activity,
  onComplete,
  loading,
  externalFeedback,
}: {
  activity: InteractiveActivity;
  onComplete: (
    submission: InteractiveSubmission,
    feedback: InteractiveFeedback,
  ) => void;
  loading?: boolean;
  externalFeedback?: InteractiveFeedback | null;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [textAnswer, setTextAnswer] = useState("");
  const [orderedItems, setOrderedItems] = useState<string[]>(
    () => activity.orderItems ?? [],
  );
  const [localFeedback, setLocalFeedback] = useState<InteractiveFeedback | null>(
    null,
  );

  const feedback = externalFeedback ?? localFeedback;
  /** Bundle L — single MC/TF/multi/match presentation via InteractiveFormControls. */
  const usesFormControls =
    activity.form === "true_false" ||
    activity.form === "multi_select" ||
    activity.form === "matching" ||
    activity.form === "multiple_choice" ||
    Boolean(
      activity.choices &&
        activity.choices.length >= 2 &&
        typeof activity.correctIndex === "number",
    );

  const canSubmit = useMemo(() => {
    if (activity.form === "multi_select") return selectedIndices.length > 0;
    if (activity.form === "matching") {
      return (activity.matchLeft ?? []).every((l) => Boolean(matches[l]));
    }
    if (usesFormControls) return selectedIndex != null;
    if (activity.form === "ordering") return orderedItems.length > 0;
    return textAnswer.trim().length >= 1;
  }, [
    activity.form,
    activity.matchLeft,
    usesFormControls,
    selectedIndex,
    selectedIndices.length,
    matches,
    orderedItems.length,
    textAnswer,
  ]);

  function moveOrder(index: number, dir: -1 | 1) {
    setOrderedItems((items) => {
      const next = [...items];
      const j = index + dir;
      if (j < 0 || j >= next.length) return items;
      const tmp = next[index]!;
      next[index] = next[j]!;
      next[j] = tmp;
      return next;
    });
  }

  function handleSubmit() {
    const submission: InteractiveSubmission = {
      activityId: activity.id,
      form: activity.form,
      selectedIndex: selectedIndex ?? undefined,
      selectedIndices:
        activity.form === "multi_select" ? selectedIndices : undefined,
      matches: activity.form === "matching" ? matches : undefined,
      textAnswer: textAnswer || undefined,
      orderedItems: activity.form === "ordering" ? orderedItems : undefined,
    };
    const fb = evaluateInteractiveSubmission(activity, submission);
    setLocalFeedback(fb);
    onComplete(submission, fb);
  }

  return (
    <div
      data-activity-runtime
      data-activity-form={activity.form}
      data-concept-id={activity.conceptId}
      className="mt-8 border-t border-stone-800/10 pt-8"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-900">
        {activity.label ?? "Your turn"}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-lg font-medium leading-snug text-stone-950">
        {activity.prompt}
      </p>

      {activity.codeSnippet ? (
        <pre
          data-activity-code
          className="mt-4 overflow-x-auto border border-stone-800/20 bg-stone-950 px-4 py-3 font-mono text-sm text-teal-100"
        >
          {activity.codeSnippet}
        </pre>
      ) : null}

      {activity.tablesPreview ? (
        <pre
          data-activity-tables
          className="mt-4 whitespace-pre-wrap border border-stone-800/15 bg-white px-4 py-3 font-mono text-xs text-stone-800"
        >
          {activity.tablesPreview}
        </pre>
      ) : null}

      {activity.diagramHint ? (
        <pre
          data-activity-diagram
          className="mt-4 whitespace-pre-wrap border border-stone-800/10 bg-white px-4 py-6 font-mono text-sm text-stone-800"
        >
          {activity.diagramHint}
        </pre>
      ) : null}

      {activity.graphHint ? (
        <pre
          data-activity-graph
          className="mt-4 whitespace-pre-wrap border border-stone-800/10 bg-white px-4 py-6 font-mono text-sm text-stone-800"
        >
          {activity.graphHint}
        </pre>
      ) : null}

      {usesFormControls ? (
        <InteractiveFormControls
          activity={activity}
          selectedIndex={selectedIndex}
          onSelectIndex={setSelectedIndex}
          selectedIndices={selectedIndices}
          onToggleIndex={(index) => {
            setSelectedIndices((prev) =>
              prev.includes(index)
                ? prev.filter((i) => i !== index)
                : [...prev, index],
            );
          }}
          matches={matches}
          onMatch={(left, right) =>
            setMatches((prev) => ({ ...prev, [left]: right }))
          }
          disabled={Boolean(feedback)}
        />
      ) : null}

      {activity.form === "ordering" ? (
        <ol className="mt-5 space-y-2" aria-label="Reorder steps">
          {orderedItems.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex min-h-12 items-center gap-2 border border-stone-300 bg-white px-3"
            >
              <span className="flex-1 text-sm text-stone-900">{item}</span>
              <button
                type="button"
                aria-label={`Move ${item} up`}
                disabled={index === 0 || Boolean(feedback)}
                onClick={() => moveOrder(index, -1)}
                className="min-h-11 min-w-11 text-sm font-semibold text-stone-700 touch-manipulation disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move ${item} down`}
                disabled={
                  index === orderedItems.length - 1 || Boolean(feedback)
                }
                onClick={() => moveOrder(index, 1)}
                className="min-h-11 min-w-11 text-sm font-semibold text-stone-700 touch-manipulation disabled:opacity-30"
              >
                ↓
              </button>
            </li>
          ))}
        </ol>
      ) : null}

      {!usesFormControls && activity.form !== "ordering" ? (
        <div className="mt-5 space-y-2">
          {activity.form === "sql_write" ? (
            <p
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
              data-sql-honesty
            >
              Write a SQL query — results are checked on submit (no live database
              engine in this studio step).
            </p>
          ) : null}
          {activity.form === "code_write" || activity.form === "code_predict" ? (
            <p
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
              data-coding-honesty
            >
              {activity.form === "code_predict"
                ? "Predict from the authored example — not a full IDE run."
                : "Guided code write — structural check on submit, not arbitrary execution."}
            </p>
          ) : null}
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            disabled={Boolean(feedback)}
            rows={
              activity.form === "equation_solve" || activity.form === "fill_in"
                ? 2
                : 5
            }
            placeholder={
              activity.form === "equation_solve"
                ? "x = …"
                : activity.form === "sql_write"
                  ? "SELECT …"
                  : "Write your response…"
            }
            aria-label="Your answer"
            className="w-full resize-y border border-stone-300 bg-white px-4 py-3 font-mono text-sm text-stone-900 focus:border-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 disabled:opacity-70"
          />
        </div>
      ) : null}

      {!feedback ? (
        <button
          type="button"
          data-activity-submit
          onClick={handleSubmit}
          disabled={loading || !canSubmit}
          className="mt-4 inline-flex min-h-12 min-w-[8rem] items-center justify-center gap-2 bg-stone-900 px-6 text-sm font-semibold text-white touch-manipulation hover:bg-stone-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          {loading ? "Checking…" : "Check"}
        </button>
      ) : null}

      {feedback ? (
        <div
          data-activity-feedback
          data-feedback-outcome={feedback.outcome}
          className="mt-6 border border-stone-800/15 bg-white px-4 py-4"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-bold text-stone-900">Result</p>
          <p className="mt-1 text-sm text-stone-800">{feedback.summary}</p>
          {feedback.relatedConceptTitles.length > 0 ? (
            <p className="mt-2 text-xs text-stone-600">
              Related: {feedback.relatedConceptTitles.join(" · ")}
            </p>
          ) : null}
          {feedback.correctionNote ? (
            <p className="mt-2 text-sm text-amber-950">{feedback.correctionNote}</p>
          ) : null}
          {feedback.contrastNote ? (
            <p className="mt-1 text-xs text-stone-600">
              Contrast: {feedback.contrastNote}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
