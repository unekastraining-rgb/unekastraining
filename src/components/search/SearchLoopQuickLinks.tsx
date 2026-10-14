"use client";

import Link from "next/link";

import {
  blurtingHref,
  coreStudyPackHref,
  luckyQuizHref,
  sixChunkingHref,
} from "@/lib/study/loop-hrefs";

export function SearchLoopQuickLinks({
  courseId,
  topic,
  compact = false,
  onNavigate,
}: {
  courseId: string;
  topic?: string | null;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const loopTopic = topic?.trim() || undefined;

  const chipClass = compact
    ? "inline-flex min-h-9 items-center rounded-lg px-2.5 py-1 text-[11px] font-bold touch-manipulation"
    : "inline-flex min-h-11 items-center rounded-lg px-3 py-1.5 text-xs font-bold touch-manipulation";

  return (
    <div
      data-hub-chrome
      className={`flex flex-wrap gap-1.5 ${compact ? "px-2 pb-2" : ""}`}
      onClick={(event) => event.stopPropagation()}
    >
      <Link
        href={coreStudyPackHref(courseId, loopTopic)}
        onClick={onNavigate}
        className={`${chipClass} bg-teal-700 text-white hover:bg-teal-600`}
      >
        Study pack
      </Link>
      <Link
        href={sixChunkingHref(courseId, loopTopic ?? "notes")}
        onClick={onNavigate}
        className={`${chipClass} border border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100`}
      >
        Six
      </Link>
      <Link
        href={luckyQuizHref(courseId, null, loopTopic)}
        onClick={onNavigate}
        className={`${chipClass} bg-violet-600 text-white hover:bg-violet-500`}
      >
        Lucky
      </Link>
      <Link
        href={blurtingHref(courseId, null, loopTopic)}
        onClick={onNavigate}
        className={`${chipClass} border border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100`}
      >
        Blurt
      </Link>
    </div>
  );
}
