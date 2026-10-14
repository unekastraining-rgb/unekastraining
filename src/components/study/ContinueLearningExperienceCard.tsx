"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import type { OrchestratorSuggestionView } from "@/lib/learning/orchestrator/present";
import {
  resolveHubAdaptivePrimaryCta,
} from "@/lib/learning/orchestrator/hub-adaptive-bridge";

/**
 * Bundle E — Continue Learning card for Study Haul welcome / Hub.
 * Consumes existing orchestrator-suggestion API — does not re-decide.
 * Distinct from OrchestratorSuggestionCard (Growth Center) and front-door IA.
 */
export function ContinueLearningExperienceCard({
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

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
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

  async function continueLearning() {
    if (!suggestion || starting) return;
    const primary = resolveHubAdaptivePrimaryCta({
      conceptId: suggestion.conceptId,
      activeRunId: suggestion.activeRunId,
    });
    if (primary.kind === "none") {
      if (suggestion.href) router.push(suggestion.href);
      return;
    }
    setStarting(true);
    try {
      if (primary.kind === "resume") {
        router.push(primary.href);
        return;
      }
      const response = await fetch("/api/study/adaptive/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ conceptId: primary.conceptId }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        runId?: string;
      };
      if (response.ok && data.success && data.runId) {
        router.push(`/study/adaptive/${data.runId}`);
        return;
      }
      if (suggestion.href) router.push(suggestion.href);
    } catch {
      if (suggestion.href) router.push(suggestion.href);
    } finally {
      setStarting(false);
    }
  }

  if (loading && !suggestion) {
    return (
      <div
        data-continue-learning-experience
        data-continue-learning-loading
        className="flex min-h-11 items-center gap-2 rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-sm text-stone-500"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Checking what to continue…
      </div>
    );
  }

  if (!suggestion || suggestion.state === "none") {
    return null;
  }

  const needsPractice =
    suggestion.recommendationLabel?.toLowerCase().includes("practice") ||
    suggestion.notice?.toLowerCase().includes("practice");
  const needsRecall =
    suggestion.recommendationLabel?.toLowerCase().includes("recall") ||
    suggestion.notice?.toLowerCase().includes("remember");

  const sectionLabel = needsRecall
    ? "Ready for recall"
    : needsPractice
      ? "Needs practice"
      : "Continue learning";

  return (
    <section
      data-continue-learning-experience
      data-continue-section={
        needsRecall ? "recall" : needsPractice ? "practice" : "continue"
      }
      className="rounded-2xl border border-teal-300/80 bg-gradient-to-br from-teal-50 via-white to-stone-50 p-4 shadow-sm sm:p-5"
      aria-label={sectionLabel}
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-800">
        {sectionLabel}
      </p>
      <p className="mt-1 text-base font-bold text-stone-900">
        {suggestion.conceptTitle}
      </p>
      {suggestion.notice ? (
        <p className="mt-1 text-sm text-stone-600">{suggestion.notice}</p>
      ) : null}
      {suggestion.recommendationLabel ? (
        <p className="mt-1 text-sm font-medium text-teal-900">
          {suggestion.recommendationLabel}
        </p>
      ) : null}
      {/* Path/progress if present — never labeled as mastery. */}
      {suggestion.conceptProgress ? (
        <p
          data-path-position
          className="mt-2 text-xs text-stone-500"
          title="Path position — not concepts mastered"
        >
          Learning progress for this concept (evidence-based, not a mastery score).
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => void continueLearning()}
          disabled={starting}
          data-continue-learning-primary
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 text-sm font-semibold text-white touch-manipulation hover:bg-teal-700 disabled:opacity-60"
        >
          {starting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ArrowRight className="h-4 w-4" aria-hidden />
          )}
          {suggestion.actionLabel ?? "Continue"}
        </button>
        {suggestion.href ? (
          <Link
            href={suggestion.href}
            data-continue-learning-secondary
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 touch-manipulation hover:bg-stone-50"
          >
            Open activity
          </Link>
        ) : null}
      </div>
    </section>
  );
}
