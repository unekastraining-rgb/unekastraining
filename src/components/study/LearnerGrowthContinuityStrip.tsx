"use client";

import Link from "next/link";

import { ContinueLearningButton } from "@/components/study/ContinueLearningButton";
import type { LearnerGrowthHubTeaser } from "@/lib/learning/learner-growth";

/**
 * 2P-43 — Study Hub longitudinal continuity strip.
 * Presentation only — same truth as Growth Center continuity (not a planner).
 * Resume learning should feel prominent; never invents a continuation state.
 */
export function LearnerGrowthContinuityStrip({
  teaser,
}: {
  teaser: LearnerGrowthHubTeaser | null;
}) {
  if (!teaser) return null;

  const hasBody =
    teaser.recentlyDemonstratedLine ||
    teaser.historicallyDemonstratedLine ||
    teaser.needsWorkLine ||
    teaser.needsMoreEvidenceLine ||
    teaser.nextAction.kind !== "NONE" ||
    teaser.hasActiveAdaptive;

  if (!hasBody) {
    // No empty Continue dashboard — only render when there is something to resume.
    return null;
  }

  const next = teaser.nextAction;
  const isResume =
    teaser.hasActiveAdaptive || next.kind === "CONTINUE_ADAPTIVE";

  return (
    <section
      data-learner-growth-continuity-strip
      data-mastery-source={teaser.source}
      data-has-active-adaptive={teaser.hasActiveAdaptive ? "true" : "false"}
      data-next-action-kind={next.kind}
      className="rounded-2xl border border-teal-300/80 bg-gradient-to-br from-teal-100/50 via-white to-stone-50 p-4 shadow-sm sm:p-5"
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-800">
        Continue
      </p>
      <p className="mt-1 text-sm font-medium text-stone-800">
        {isResume
          ? "Continue where you left off"
          : "Resume something you already started"}
      </p>
      <p className="mt-0.5 text-xs text-stone-500">
        Suggestions never replace Learn / Practice / Check / Remember in Study
        Haul.
      </p>

      <ul className="mt-3 space-y-2 text-sm text-stone-700">
        {teaser.recentlyDemonstratedLine ? (
          <li data-continuity-card="recently-demonstrated">
            <span className="font-medium text-stone-900">What you demonstrated — </span>
            {teaser.recentlyDemonstratedLine}
          </li>
        ) : null}
        {teaser.historicallyDemonstratedLine ? (
          <li data-continuity-card="historically-demonstrated">
            <span className="font-medium text-stone-900">Previously demonstrated — </span>
            {teaser.historicallyDemonstratedLine}
          </li>
        ) : null}
        {teaser.needsWorkLine ? (
          <li data-continuity-card="needs-work">
            <span className="font-medium text-stone-900">What to review — </span>
            {teaser.needsWorkLine}
          </li>
        ) : null}
        {teaser.needsMoreEvidenceLine ? (
          <li data-continuity-card="needs-more-evidence">
            <span className="font-medium text-stone-900">Needs more practice — </span>
            {teaser.needsMoreEvidenceLine}
          </li>
        ) : null}
      </ul>

      {next.kind !== "NONE" ? (
        <div
          data-continuity-card="next-action"
          className="mt-4 flex flex-col gap-3 rounded-xl border border-teal-200 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
              {isResume ? "Continue where you left off" : "Optional next step"}
            </p>
            <p className="mt-1 text-base font-bold text-stone-900">{next.label}</p>
            {teaser.why ? (
              <p data-continuity-why className="mt-1 text-xs text-stone-500">
                Why: {teaser.why}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {next.kind === "CONTINUE_ADAPTIVE" && next.href ? (
              <Link
                href={next.href}
                data-continuity-cta="resume"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-5 py-2 text-sm font-bold text-white hover:bg-teal-800 touch-manipulation"
              >
                Continue
              </Link>
            ) : null}
            {next.kind === "START_ADAPTIVE" && next.conceptId ? (
              <ContinueLearningButton
                conceptId={next.conceptId}
                label={next.label}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-5 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60 touch-manipulation"
              />
            ) : null}
            {next.kind === "OPEN_LUCKY" && next.href ? (
              <Link
                href={next.href}
                data-continuity-cta="lucky"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-5 py-2 text-sm font-bold text-white hover:bg-teal-800 touch-manipulation"
              >
                {next.label}
              </Link>
            ) : null}
            <Link
              href={teaser.growthCenterHref}
              data-continuity-cta="growth-center"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50 touch-manipulation"
            >
              Progress
            </Link>
          </div>
        </div>
      ) : (
        <Link
          href={teaser.growthCenterHref}
          data-continuity-cta="growth-center"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-teal-800 underline-offset-2 hover:underline touch-manipulation"
        >
          Open Progress
        </Link>
      )}
    </section>
  );
}
