"use client";

/**
 * Bundle J/L — Canonical choice/match controls for InteractiveActivity.
 * ActivityRuntime owns state/submit; this owns presentation only.
 */

import type { InteractiveActivity } from "@/lib/learning/activity/runtime";

function ChoiceRadioGroup({
  form,
  choices,
  selectedIndex,
  onSelectIndex,
  disabled,
}: {
  form: string;
  choices: string[];
  selectedIndex: number | null;
  onSelectIndex: (index: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      data-interactive-form-controls={form}
      className="mt-5 grid gap-2"
      role="radiogroup"
      aria-label="Choose an answer"
    >
      {choices.map((choice, index) => {
        const selected = selectedIndex === index;
        return (
          <button
            key={`${choice}-${index}`}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onSelectIndex(index)}
            className={`min-h-12 border px-4 py-3 text-left text-sm touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-800 ${
              selected
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 bg-white text-stone-800 hover:border-stone-500"
            }`}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );
}

export function InteractiveFormControls({
  activity,
  selectedIndex,
  onSelectIndex,
  selectedIndices,
  onToggleIndex,
  matches,
  onMatch,
  disabled,
}: {
  activity: InteractiveActivity;
  selectedIndex: number | null;
  onSelectIndex: (index: number) => void;
  selectedIndices: number[];
  onToggleIndex: (index: number) => void;
  matches: Record<string, string>;
  onMatch: (left: string, right: string) => void;
  disabled?: boolean;
}) {
  if (
    (activity.form === "true_false" ||
      activity.form === "multiple_choice" ||
      activity.form === "classification") &&
    activity.choices
  ) {
    return (
      <ChoiceRadioGroup
        form={activity.form}
        choices={activity.choices}
        selectedIndex={selectedIndex}
        onSelectIndex={onSelectIndex}
        disabled={disabled}
      />
    );
  }

  if (activity.form === "multi_select" && activity.choices) {
    return (
      <div
        data-interactive-form-controls="multi_select"
        className="mt-5 grid gap-2"
        role="group"
        aria-label="Select all that apply"
      >
        {activity.choices.map((choice, index) => {
          const selected = selectedIndices.includes(index);
          return (
            <button
              key={`${choice}-${index}`}
              type="button"
              role="checkbox"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onToggleIndex(index)}
              className={`min-h-12 border px-4 py-3 text-left text-sm touch-manipulation ${
                selected
                  ? "border-teal-800 bg-teal-50 text-teal-950"
                  : "border-stone-300 bg-white text-stone-800"
              }`}
            >
              <span className="mr-2 font-mono text-xs" aria-hidden>
                {selected ? "☑" : "☐"}
              </span>
              {choice}
            </button>
          );
        })}
      </div>
    );
  }

  if (
    activity.form === "matching" &&
    activity.matchLeft &&
    activity.matchRight
  ) {
    return (
      <div
        data-interactive-form-controls="matching"
        className="mt-5 space-y-3"
        role="group"
        aria-label="Match items to definitions"
      >
        {activity.matchLeft.map((left) => (
          <label
            key={left}
            className="flex min-h-12 flex-col gap-1 border border-stone-300 bg-white px-3 py-2 sm:flex-row sm:items-center sm:gap-3"
          >
            <span className="min-w-[8rem] text-sm font-medium text-stone-900">
              {left}
            </span>
            <select
              value={matches[left] ?? ""}
              disabled={disabled}
              aria-label={`Match for ${left}`}
              onChange={(e) => onMatch(left, e.target.value)}
              className="min-h-11 flex-1 border border-stone-300 bg-white px-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
            >
              <option value="">Select definition…</option>
              {activity.matchRight!.map((right) => (
                <option key={right} value={right}>
                  {right}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    );
  }

  // Generic choice activities (e.g. prediction with choices) share MC presentation.
  if (
    activity.choices &&
    activity.choices.length >= 2 &&
    typeof activity.correctIndex === "number"
  ) {
    return (
      <ChoiceRadioGroup
        form={activity.form}
        choices={activity.choices}
        selectedIndex={selectedIndex}
        onSelectIndex={onSelectIndex}
        disabled={disabled}
      />
    );
  }

  return null;
}
