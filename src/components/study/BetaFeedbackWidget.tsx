"use client";

import { useState } from "react";

import {
  BETA_FEEDBACK_CATEGORIES,
  type BetaFeedbackCategoryName,
} from "@/lib/beta/feedback";

const LABELS: Record<BetaFeedbackCategoryName, string> = {
  CONFUSING: "Confusing",
  BROKEN: "Broken",
  TOO_EASY: "Too easy",
  TOO_HARD: "Too hard",
  NOT_RELEVANT: "Not relevant",
  GREAT: "Great",
  OTHER: "Other",
};

/**
 * Compact controlled-beta feedback form.
 * Submits to /api/beta/feedback — never mastery/evidence.
 */
export function BetaFeedbackWidget({
  surface = "study-hub",
  activityRef = null,
}: {
  surface?: string;
  activityRef?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] =
    useState<BetaFeedbackCategoryName>("OTHER");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/beta/feedback", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          comment,
          surface,
          activityRef,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Could not send feedback.");
        return;
      }
      setDone(true);
      setComment("");
    } catch {
      setError("Could not send feedback. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      data-beta-feedback
      className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Controlled beta
          </p>
          <p className="text-sm font-semibold text-stone-900">
            Send product feedback
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            Feedback helps improve Study Haul — it does not change your mastery.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setDone(false);
            setError(null);
          }}
          className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50 touch-manipulation"
        >
          {open ? "Close" : "Give feedback"}
        </button>
      </div>

      {open ? (
        <div className="mt-4 space-y-3">
          {done ? (
            <p role="status" className="text-sm text-teal-800">
              Thanks — feedback saved.
            </p>
          ) : (
            <>
              <label className="block text-sm text-stone-700">
                Category
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as BetaFeedbackCategoryName)
                  }
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
                >
                  {BETA_FEEDBACK_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {LABELS[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-stone-700">
                Short comment
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 800))}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                  placeholder="What happened? What did you expect?"
                />
              </label>
              {error ? (
                <p role="alert" className="text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                disabled={submitting || !comment.trim()}
                onClick={() => void submit()}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 touch-manipulation"
              >
                {submitting ? "Sending…" : "Send feedback"}
              </button>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
