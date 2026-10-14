"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Compass, Loader2 } from "lucide-react";

import type { OrchestratorSuggestionView } from "@/lib/learning/orchestrator/present";
import {
  resolveHubAdaptivePrimaryCta,
  resolveHubDirectSixSecondaryCta,
} from "@/lib/learning/orchestrator/hub-adaptive-bridge";
import { HUB_ORCHESTRATOR_EMPTY_COPY } from "@/lib/learning/orchestrator/hub-empty-copy";
import { ULE_MASTERY_LEARNER_COPY } from "@/lib/learning/mastery/mastery-truth";

/**
 * Thin Study-hub surface for Orchestrator suggestions (Phase 2G-59 / 2G-63 / 2P-3).
 * PRIMARY CTA enters Adaptive start/resume (closed loop).
 * SECONDARY CTA keeps the existing direct SIX deep link when present.
 * Optional masterySummary is ConceptMastery presentation only (2G-63).
 * Optional conceptProgress is additive Concept Progress (2G-70 WS1).
 * Hub does not write evidence, mastery, or re-orchestration.
 */
export function OrchestratorSuggestionCard({
  courseId,
}: {
  courseId?: string;
}) {
  const router = useRouter();
  const [suggestion, setSuggestion] = useState<OrchestratorSuggestionView | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      // Keep prior suggestion visible while refetching (avoid empty flicker).
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (courseId) params.set("courseId", courseId);
        const qs = params.toString();
        const response = await fetch(
          `/api/study/orchestrator-suggestion${qs ? `?${qs}` : ""}`,
          { signal: controller.signal, credentials: "same-origin" },
        );
        const data = (await response.json()) as {
          success?: boolean;
          suggestion?: OrchestratorSuggestionView | null;
        };
        if (!controller.signal.aborted) {
          setSuggestion(data.success ? (data.suggestion ?? null) : null);
        }
      } catch {
        if (!controller.signal.aborted) setSuggestion(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [courseId]);

  async function enterAdaptiveClosedLoop() {
    if (!suggestion || starting) return;

    const primary = resolveHubAdaptivePrimaryCta({
      conceptId: suggestion.conceptId,
      activeRunId: suggestion.activeRunId,
    });

    if (primary.kind === "none") return;

    setStarting(true);
    setStartError(null);

    try {
      if (primary.kind === "resume") {
        router.push(primary.href);
        return;
      }

      // primary.kind === "start"
      const response = await fetch("/api/study/adaptive/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ conceptId: primary.conceptId }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        runId?: string;
        error?: string;
      };
      if (!response.ok || !data.success || !data.runId) {
        setStartError(data.error ?? "Could not start adaptive study.");
        return;
      }
      router.push(`/study/adaptive/${data.runId}`);
    } catch {
      setStartError("Could not start adaptive study.");
    } finally {
      setStarting(false);
    }
  }

  // First load only — keep prior card while refreshing courseId.
  if (loading && !suggestion) {
    return (
      <div
        data-orchestrator-suggestion
        data-hub-chrome
        data-hub-suggestion-loading
        className="mb-4 flex min-h-11 items-center gap-2 rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-sm text-stone-500"
      >
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        {HUB_ORCHESTRATOR_EMPTY_COPY.loadingLabel}
      </div>
    );
  }

  if (!suggestion) {
    return (
      <section
        data-orchestrator-suggestion
        data-hub-chrome
        data-hub-suggestion-empty
        className="mb-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-4 sm:p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          {HUB_ORCHESTRATOR_EMPTY_COPY.whatNowEyebrow}
        </p>
        <p className="mt-1 text-sm font-medium text-stone-900">
          {HUB_ORCHESTRATOR_EMPTY_COPY.noSuggestionTitle}
        </p>
        <p className="mt-2 text-sm text-stone-600">
          {HUB_ORCHESTRATOR_EMPTY_COPY.noSuggestionBody}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/core"
            data-hub-chrome
            data-hub-empty-fallback="core"
            className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 touch-manipulation"
          >
            Open Workspace
          </Link>
          <Link
            href="/study#start-studying"
            data-hub-chrome
            data-hub-empty-fallback="study-now"
            className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 touch-manipulation"
          >
            Start Studying
          </Link>
          <Link
            href="/study/learner-model"
            data-hub-chrome
            data-hub-empty-fallback="learner-model"
            className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 touch-manipulation"
          >
            Progress
          </Link>
        </div>
      </section>
    );
  }

  const primary = resolveHubAdaptivePrimaryCta({
    conceptId: suggestion.conceptId,
    activeRunId: suggestion.activeRunId,
  });
  const secondarySix = resolveHubDirectSixSecondaryCta({
    href: suggestion.href,
    actionLabel: suggestion.actionLabel,
  });

  const showPrimaryAdaptive = primary.kind !== "none";
  // Fallback: when Adaptive cannot start (no conceptId), keep direct SIX as the
  // available action — same safe behavior as before for that edge case.
  const showSixAsFallbackOnly = !showPrimaryAdaptive && secondarySix != null;
  const showSixSecondary = showPrimaryAdaptive && secondarySix != null;

  return (
    <section
      data-orchestrator-suggestion
      data-orchestrator-state={suggestion.state}
      data-hub-concept-id={suggestion.conceptId || undefined}
      data-hub-chrome
      aria-busy={loading || undefined}
      className="mb-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-start gap-3">
        <Compass
          className="mt-0.5 h-5 w-5 shrink-0 text-teal-700"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            {HUB_ORCHESTRATOR_EMPTY_COPY.whatNowEyebrow}
          </p>
          <p className="mt-1 text-sm font-medium text-stone-900">
            {suggestion.notice}
          </p>
          {suggestion.recommendationLabel ? (
            <p className="mt-2 text-sm font-semibold text-teal-800">
              {suggestion.recommendationLabel}
            </p>
          ) : null}
          {suggestion.masterySummary ? (
            <div
              data-hub-mastery-summary
              data-mastery-source={suggestion.masterySummary.source}
              data-mastery-kind={suggestion.masterySummary.kind}
              className="mt-2 space-y-0.5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                {ULE_MASTERY_LEARNER_COPY.shortLabel}
              </p>
              <p className="text-xs font-medium text-stone-500">
                {suggestion.masterySummary.stateLabel}
              </p>
              {suggestion.masterySummary.focusHint ? (
                <p className="text-xs text-stone-500">
                  {suggestion.masterySummary.focusHint}
                </p>
              ) : null}
            </div>
          ) : null}
          {suggestion.conceptProgress &&
          suggestion.conceptProgress.status !== "unavailable" ? (
            <div
              data-hub-concept-progress
              data-progress-source={suggestion.conceptProgress.source}
              data-progress-status={suggestion.conceptProgress.status}
              className="mt-2 space-y-1"
            >
              <p className="text-xs font-medium text-stone-500">
                {suggestion.conceptProgress.headline}
              </p>
              <p className="text-xs text-stone-500">
                {suggestion.conceptProgress.supportingLine}
              </p>
              {suggestion.conceptProgress.status === "available" ? (
                <ul className="mt-1 space-y-0.5">
                  {suggestion.conceptProgress.dimensions
                    .filter((d) => d.status !== "not_yet_evidenced")
                    .slice(0, 4)
                    .map((d) => (
                      <li key={d.facet} className="text-xs text-stone-500">
                        {d.learnerLine}
                      </li>
                    ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {suggestion.activityIntervention ? (
            <div
              data-hub-activity-intervention
              data-entry-kind="direct-activity"
              data-activity-adapter={suggestion.activityIntervention.adapterKey}
              className="mt-3 rounded-xl border border-teal-100 bg-teal-50/40 p-3"
            >
              <p className="text-xs font-semibold text-teal-900">
                Practice this concept with{" "}
                {suggestion.activityIntervention.title.toLowerCase()}
              </p>
              <p className="mt-1 text-xs text-stone-600">
                {suggestion.activityIntervention.reason}
              </p>
              <Link
                href={suggestion.activityIntervention.href}
                data-hub-chrome
                data-entry-kind="direct-activity"
                data-hub-secondary-cta="direct-activity"
                className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-teal-800 hover:underline"
              >
                Open {suggestion.activityIntervention.title}
              </Link>
            </div>
          ) : null}
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
            {HUB_ORCHESTRATOR_EMPTY_COPY.whyEyebrow}
          </p>
          <p className="mt-0.5 text-sm text-stone-600">{suggestion.reason}</p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {showPrimaryAdaptive ? (
              <button
                type="button"
                data-hub-chrome
                data-orchestrator-adaptive-study
                data-adaptive-action={primary.kind}
                data-hub-primary-cta="adaptive"
                data-entry-kind="adaptive-learning"
                disabled={starting}
                onClick={() => void enterAdaptiveClosedLoop()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white touch-manipulation hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-60"
              >
                {starting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Opening…
                  </>
                ) : (
                  <>
                    {primary.label}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
            ) : null}

            {showSixSecondary && secondarySix ? (
              <Link
                href={secondarySix.href}
                data-hub-chrome
                data-orchestrator-try-it
                data-hub-secondary-cta="direct-six"
                data-entry-kind="direct-activity"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-teal-700 bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 touch-manipulation hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                {secondarySix.label}
              </Link>
            ) : null}

            {showSixAsFallbackOnly && secondarySix ? (
              <Link
                href={secondarySix.href}
                data-hub-chrome
                data-orchestrator-try-it
                data-hub-primary-cta="direct-six-fallback"
                data-entry-kind="direct-activity"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white touch-manipulation hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                {secondarySix.label}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
          </div>

          {startError ? (
            <div className="mt-3 space-y-1" role="alert">
              <p className="text-sm text-rose-700">{startError}</p>
              <p
                data-hub-start-error-fallback
                className="text-xs text-stone-600"
              >
                {HUB_ORCHESTRATOR_EMPTY_COPY.startErrorFallback}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
