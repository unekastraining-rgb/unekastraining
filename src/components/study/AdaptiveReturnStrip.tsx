"use client";

import Link from "next/link";

import { presentActivityCompletion } from "@/lib/learning/experience/activity-completion-present";

/**
 * Shared Adaptive return strip after an authoritative activity/quiz/flashcard
 * evaluation. Presentation only — does not write evidence or mastery.
 */
export function AdaptiveReturnStrip({
  runId,
  notice = null,
  outcomeLabel = null,
}: {
  runId: string;
  notice?: string | null;
  outcomeLabel?: string | null;
}) {
  const presentation = presentActivityCompletion({
    adaptiveRunId: runId,
    notice,
    outcomeLabel,
  });
  if (!presentation.continueAdaptiveHref) return null;

  return (
    <div className="mt-4" data-adaptive-return-strip>
      <p className="text-sm text-stone-700">{presentation.body}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={presentation.continueAdaptiveHref}
          data-adaptive-return
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          {presentation.continueAdaptiveLabel}
        </Link>
        <Link
          href={presentation.growthCenterHref}
          data-adaptive-return-growth
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500"
        >
          Learner Growth Center
        </Link>
        <Link
          href={presentation.hubHref}
          data-adaptive-return-hub
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500"
        >
          Study Hub
        </Link>
      </div>
    </div>
  );
}
