"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";

import { useTapHandler } from "@/hooks/useTapHandler";
import {
  blurtingHref,
  luckyQuizHref,
  sixChunkingHref,
  sixFeynmanHref,
  teachMeHref,
} from "@/lib/study/loop-hrefs";

/**
 * Surfaces the last Selection → Lucky target so Core stays tied to study outcomes
 * (not a silent quiz detour) — own Core → Six → Lucky, not Quizlet.
 */
export function CoreLoopOutcomeStrip({
  courseId,
  materialId,
  target,
  onDismiss,
}: {
  courseId: string;
  materialId?: string | null;
  target: {
    kind?: "quiz" | "pack";
    quizId?: string;
    topic?: string;
    sourcePreview?: string;
    createdAt?: string;
  };
  onDismiss: () => void;
}) {
  const topic = target.topic?.trim() || "your selection";
  const isPack = target.kind === "pack";
  const tapDismiss = useTapHandler(onDismiss);

  return (
    <div
      data-core-selection-loop
      className="mx-3 mb-2 flex flex-wrap items-start gap-2 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-teal-50/70 px-3 py-2.5 touch-manipulation sm:mx-4"
    >
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-violet-800">
          Core → Six → Lucky
        </p>
        <p className="mt-0.5 text-xs font-semibold text-stone-800">
          {isPack ? "Study pack ready" : "Quizzed"}: {topic}
        </p>
        {target.sourcePreview ? (
          <p className="mt-0.5 line-clamp-2 text-[11px] text-stone-500">
            {target.sourcePreview}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2">
          {target.quizId ? (
            <Link
              href={`/quizzes/${target.quizId}`}
              className="inline-flex min-h-11 items-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white touch-manipulation hover:bg-violet-500"
            >
              Open Lucky quiz
            </Link>
          ) : isPack ? (
            <Link
              href={luckyQuizHref(courseId, materialId, topic)}
              className="inline-flex min-h-11 items-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white touch-manipulation hover:bg-violet-500"
            >
              Lucky quiz
            </Link>
          ) : null}
          <Link
            href={sixChunkingHref(courseId, topic, materialId)}
            className="inline-flex min-h-11 items-center rounded-lg border border-teal-300 bg-white/80 px-3 py-1.5 text-xs font-bold text-teal-900 touch-manipulation hover:bg-white"
          >
            Chunk misses in Six
          </Link>
          <Link
            href={sixFeynmanHref(courseId, topic, materialId)}
            className="inline-flex min-h-11 items-center rounded-lg border border-teal-300 bg-white/80 px-3 py-1.5 text-xs font-bold text-teal-900 touch-manipulation hover:bg-white"
          >
            Teach back (Feynman)
          </Link>
          <Link
            href={teachMeHref(courseId, materialId, topic)}
            className="inline-flex min-h-11 items-center rounded-lg border border-violet-300 bg-white/80 px-3 py-1.5 text-xs font-bold text-violet-900 touch-manipulation hover:bg-white"
          >
            Teach Me
          </Link>
          <Link
            href={blurtingHref(courseId, materialId, topic)}
            className="inline-flex min-h-11 items-center rounded-lg border border-orange-300 bg-white/80 px-3 py-1.5 text-xs font-bold text-orange-900 touch-manipulation hover:bg-white"
          >
            Blurt gaps
          </Link>
        </div>
      </div>
      <button
        type="button"
        {...tapDismiss}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-1 text-stone-400 touch-manipulation hover:bg-white/80 hover:text-stone-700"
        aria-label="Dismiss outcome"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
