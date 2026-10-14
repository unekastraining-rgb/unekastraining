"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import type { RetentionReviewItemView } from "@/lib/learning/retention/review";
import { useTapHandler } from "@/hooks/useTapHandler";
import { LuckyContinuityStrip } from "@/components/study/LuckyContinuityStrip";

/**
 * Additive Lucky item-level retention review (one question at a time).
 * Preserves Lucky violet styling; does not replace the session planner/runner.
 */
export function LuckyRetentionReview() {
  const [item, setItem] = useState<RetentionReviewItemView | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [resultLabel, setResultLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadNext = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResultLabel(null);
    setAnswer("");
    setSelectedOption(null);
    try {
      const response = await fetch("/api/study/lucky/retention-item", {
        credentials: "same-origin",
      });
      const data = (await response.json()) as {
        success?: boolean;
        item?: RetentionReviewItemView | null;
        error?: string;
      };
      if (!data.success) {
        setItem(null);
        setError(data.error ?? null);
      } else {
        setItem(data.item ?? null);
      }
    } catch {
      setItem(null);
      setError("Could not load a retention item.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch for one-at-a-time review (existing Lucky mount pattern).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount load
    void loadNext();
  }, [loadNext]);

  async function submit(payloadAnswer: string | string[] | boolean) {
    if (!item || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/study/lucky/retention-item/submit", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          retentionItemId: item.retentionItemId,
          answer: payloadAnswer,
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        data?: {
          resultLabel?: string;
          next?: RetentionReviewItemView | null;
        };
        error?: string;
      };
      if (!data.success || !data.data) {
        setError(data.error ?? "Could not submit review.");
        return;
      }
      setResultLabel(data.data.resultLabel ?? "Recorded.");
      setItem(data.data.next ?? null);
      setAnswer("");
      setSelectedOption(null);
    } catch {
      setError("Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  const tapSubmitText = useTapHandler(() => {
    void submit(answer);
  });
  const tapAgain = useTapHandler(() => {
    void submit("AGAIN");
  });
  const tapGood = useTapHandler(() => {
    void submit("GOOD");
  });
  const tapEasy = useTapHandler(() => {
    void submit("EASY");
  });
  const tapNext = useTapHandler(() => {
    void loadNext();
  });

  if (loading) {
    return (
      <section
        data-lucky-retention-review
        className="mx-auto mb-6 max-w-lg rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-4"
      >
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading retention review…
        </div>
      </section>
    );
  }

  if (!item && !resultLabel) {
    return (
      <section
        data-lucky-retention-review
        data-lucky-retention-empty
        role="status"
        aria-live="polite"
        className="mx-auto mb-6 max-w-lg rounded-2xl border border-violet-100 bg-white px-4 py-4 text-sm text-stone-600"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
          Retention review
        </p>
        <p className="mt-1">
          No due retention items right now. Continue your Lucky session plan below,
          or return to Adaptive / Growth when ready.
        </p>
        <LuckyContinuityStrip />
        {error ? (
          <p className="mt-2 text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section
      data-lucky-retention-review
      className="mx-auto mb-6 max-w-lg space-y-4 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm sm:p-5"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
          Retention review · one at a time
        </p>
        <LuckyContinuityStrip />
        {item ? (
          <div className="mt-1 space-y-0.5 text-xs font-medium text-stone-500">
            {item.reasonLabel ? (
              <p className="text-violet-700/90">{item.reasonLabel}</p>
            ) : null}
            <p>
              {item.sourceLabel}
              {item.conceptTitle ? ` · ${item.conceptTitle}` : ""}
            </p>
          </div>
        ) : null}
      </div>

      {resultLabel ? (
        <p
          data-lucky-retention-result
          className="rounded-xl border border-violet-100 bg-white px-3 py-2 text-sm font-semibold text-stone-800"
        >
          {resultLabel}
        </p>
      ) : null}

      {item ? (
        <>
          <p className="text-base font-semibold text-stone-900">{item.prompt}</p>

          {item.inputMode === "choice" && item.options ? (
            <div className="space-y-2">
              {item.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setSelectedOption(option);
                    void submit(option);
                  }}
                  className={`flex min-h-11 w-full items-center rounded-xl border px-3 py-2 text-left text-sm touch-manipulation ${
                    selectedOption === option
                      ? "border-violet-400 bg-violet-100 font-semibold"
                      : "border-violet-100 bg-white hover:border-violet-200"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}

          {item.inputMode === "text" ? (
            <div className="space-y-3">
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                rows={3}
                placeholder="Your answer"
                className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-violet-400 focus:outline-none"
              />
              <button
                type="button"
                disabled={submitting || !answer.trim()}
                {...tapSubmitText}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 touch-manipulation"
              >
                {submitting ? "Checking…" : "Submit"}
              </button>
            </div>
          ) : null}

          {item.inputMode === "self_rate" ? (
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["AGAIN", tapAgain, "border-rose-200 bg-rose-50 text-rose-900"],
                  ["GOOD", tapGood, "border-amber-200 bg-amber-50 text-amber-950"],
                  ["EASY", tapEasy, "border-emerald-200 bg-emerald-50 text-emerald-900"],
                ] as const
              ).map(([label, handlers, className]) => (
                <button
                  key={label}
                  type="button"
                  disabled={submitting}
                  {...handlers}
                  className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-2 text-xs font-bold touch-manipulation ${className}`}
                >
                  {label.charAt(0) + label.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <button
          type="button"
          {...tapNext}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-violet-200 bg-white px-4 text-sm font-semibold text-violet-700 touch-manipulation"
        >
          Check for more items
        </button>
      )}

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
