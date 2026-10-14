"use client";

import { useCallback, useEffect, useState } from "react";

import { useTapHandler } from "@/hooks/useTapHandler";

type MathChallengeView = {
  id: string;
  title: string;
  prompt: string;
  equation?: string;
  expectedX?: number;
  requireExplanation?: boolean;
  scaffolds?: Array<{
    kind: string;
    label: string;
    content: string;
    level?: number;
  }>;
};

/**
 * Smallest authentic math workspace — step entry + check + hint + submit.
 * Working edits never POST evidence; parent submit does.
 * Remount via parent `key={challenge.id}` when the challenge changes.
 */
export function MathWorkspacePanel(props: {
  challenge: MathChallengeView;
  onArtifactChange: (payload: string) => void;
  onExplanationChange?: (text: string) => void;
}) {
  const { challenge, onArtifactChange, onExplanationChange } = props;
  const [steps, setSteps] = useState<string[]>([challenge.equation ?? ""]);
  const [explanation, setExplanation] = useState("");
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [checkOk, setCheckOk] = useState<boolean | null>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);

  const publish = useCallback(
    (nextSteps: string[], nextExplanation: string) => {
      onArtifactChange(
        JSON.stringify({ steps: nextSteps, explanation: nextExplanation }),
      );
    },
    [onArtifactChange],
  );

  useEffect(() => {
    publish(steps, explanation);
  }, [steps, explanation, publish]);

  const updateStep = (index: number, value: string) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setCheckMessage(null);
    setCheckOk(null);
  };

  const addStep = () => {
    setSteps((prev) => [...prev, ""]);
    setCheckMessage(null);
  };

  const removeStep = (index: number) => {
    if (index === 0) return;
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const checkLast = useTapHandler(() => {
    if (steps.length < 2) {
      setCheckOk(null);
      setCheckMessage("Add a transformed equation as the next step, then check.");
      return;
    }
    const previous = steps[steps.length - 2] ?? "";
    const next = steps[steps.length - 1] ?? "";
    void fetch("/api/study/activities/math", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "checkStep",
        challengeId: challenge.id,
        previous,
        next,
      }),
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          success?: boolean;
          check?: { ok?: boolean; learnerMessage?: string };
          error?: string;
        };
        if (!data.success || !data.check) {
          setCheckOk(false);
          setCheckMessage(data.error ?? "Could not check this step.");
          return;
        }
        setCheckOk(Boolean(data.check.ok));
        setCheckMessage(data.check.learnerMessage ?? null);
      })
      .catch(() => {
        setCheckOk(false);
        setCheckMessage("Could not check this step.");
      });
  });

  const showHint = useTapHandler(() => {
    setHintVisible(true);
    setHintIndex((i) => {
      const max = Math.max(0, (challenge.scaffolds?.length ?? 1) - 1);
      return Math.min(i + 1, max);
    });
  });

  const hints = challenge.scaffolds ?? [];
  const activeHint = hintVisible
    ? hints[Math.min(hintIndex, Math.max(0, hints.length - 1))]
    : null;

  return (
    <div
      className="space-y-4 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/80 to-white p-4 sm:p-5"
      data-math-workspace
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
          Math workspace · linear equations
        </p>
        <p className="mt-1 text-sm text-stone-700">{challenge.prompt}</p>
        <p className="mt-3 font-mono text-lg font-semibold text-stone-900">
          {challenge.equation}
        </p>
      </div>

      <ol className="space-y-3" aria-label="Solution steps">
        {steps.map((step, index) => (
          <li key={`step-${index}`} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`math-step-${challenge.id}-${index}`}
                className="text-xs font-bold uppercase tracking-wide text-stone-500"
              >
                Step {index + 1}
              </label>
              {index > 0 ? (
                <button
                  type="button"
                  className="min-h-11 px-2 text-xs font-semibold text-stone-500 touch-manipulation hover:text-rose-700"
                  onClick={() => removeStep(index)}
                >
                  Remove
                </button>
              ) : null}
            </div>
            <input
              id={`math-step-${challenge.id}-${index}`}
              value={step}
              onChange={(e) => updateStep(index, e.target.value)}
              className="min-h-11 w-full rounded-xl border border-teal-200 bg-white px-3 py-2 font-mono text-sm text-stone-900 focus:border-teal-500 focus:outline-none"
              placeholder={index === 0 ? challenge.equation : "e.g. 2x = 6"}
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
            />
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addStep}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-200 bg-white px-4 text-sm font-semibold text-teal-900 touch-manipulation hover:border-teal-300"
        >
          Add step
        </button>
        <button
          type="button"
          {...checkLast}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-300 bg-teal-100 px-4 text-sm font-semibold text-teal-950 touch-manipulation"
        >
          Check step
        </button>
        <button
          type="button"
          {...showHint}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-950 touch-manipulation"
        >
          Hint
        </button>
      </div>

      {checkMessage ? (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-xl border px-3 py-2 text-sm ${
            checkOk
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          {checkMessage}
        </p>
      ) : null}

      {activeHint ? (
        <aside
          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800"
          aria-live="polite"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
            {activeHint.label}
          </p>
          <p className="mt-1">{activeHint.content}</p>
          <p className="mt-1 text-xs text-stone-500">
            Hints do not change your score.
          </p>
        </aside>
      ) : null}

      {challenge.requireExplanation ? (
        <label className="block text-sm font-medium text-stone-700">
          Why did your first transform keep both sides equal?
          <textarea
            value={explanation}
            onChange={(e) => {
              setExplanation(e.target.value);
              onExplanationChange?.(e.target.value);
            }}
            rows={3}
            className="mt-1 w-full rounded-xl border border-teal-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none"
            placeholder="Brief justification"
          />
        </label>
      ) : null}
    </div>
  );
}
