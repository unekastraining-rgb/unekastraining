"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/**
 * Soft Lucky continuity links — presentation only.
 * Does not write LearningAttempt / ConceptMastery / RetentionItem.
 */
export function LuckyContinuityStrip() {
  const searchParams = useSearchParams();
  const adaptiveRunId = searchParams.get("adaptiveRunId")?.trim() || "";
  const courseId = searchParams.get("courseId")?.trim() || "";

  const adaptiveHref = adaptiveRunId
    ? `/study/adaptive/${encodeURIComponent(adaptiveRunId)}`
    : null;
  const hubHref = courseId
    ? `/study?courseId=${encodeURIComponent(courseId)}`
    : "/study";

  return (
    <nav
      data-lucky-continuity-strip
      aria-label="Lucky continuity"
      className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
    >
      {adaptiveHref ? (
        <Link
          href={adaptiveHref}
          data-lucky-return-adaptive
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Continue Adaptive
        </Link>
      ) : null}
      <Link
        href="/study/learner"
        data-lucky-return-growth
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-900 hover:bg-violet-50 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
      >
        Learner Growth Center
      </Link>
      <Link
        href={hubHref}
        data-lucky-return-hub
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-violet-50 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500"
      >
        Study Hub
      </Link>
    </nav>
  );
}
