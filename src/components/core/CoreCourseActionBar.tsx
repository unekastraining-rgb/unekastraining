"use client";

import Link from "next/link";
import { Loader2, MessageCircle, Play, Sparkles } from "lucide-react";

import { useTapHandler } from "@/hooks/useTapHandler";
import { hubChatHref } from "@/lib/hub/tabs";
import {
  blurtingHref,
  coreStudyPackHref,
  luckyQuizHref,
  sixChunkingHref,
  teachMeHref,
} from "@/lib/study/loop-hrefs";

/**
 * Course-scoped Core → Six → Lucky launches from notes (not a Quizlet shortcut bar).
 */
export function CoreCourseActionBar({
  courseId,
  courseTitle,
  focusTopic,
  onStartSession,
  sessionLoading,
}: {
  courseId: string;
  courseTitle?: string;
  /** LMS/syllabus content topic for cold-start Six / Blurt (not the course title). */
  focusTopic?: string | null;
  onStartSession?: () => void;
  sessionLoading?: boolean;
}) {
  const topic = focusTopic?.trim() || courseTitle?.trim() || "this class";
  const tapStartSession = useTapHandler(() => onStartSession?.());

  return (
    <div
      data-core-selection-loop
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50/80 via-white to-violet-50/70 px-4 py-3 touch-manipulation"
    >
      <div className="mr-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
          Core → Six → Lucky
        </p>
        <p className="truncate text-xs font-semibold text-stone-800">
          {focusTopic?.trim()
            ? focusTopic.trim()
            : (courseTitle ?? "This class")}
        </p>
      </div>
      <Link
        href={coreStudyPackHref(courseId, focusTopic?.trim() || null)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-teal-400 bg-white px-3 py-2 text-xs font-bold text-teal-900 hover:bg-teal-50 touch-manipulation"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Study pack
      </Link>
      <Link
        href={sixChunkingHref(courseId, topic)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-600 touch-manipulation"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Chunk in Six
      </Link>
      <Link
        href={luckyQuizHref(courseId, null, focusTopic?.trim() || null)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-500 touch-manipulation"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Lucky quiz
      </Link>
      <Link
        href={blurtingHref(courseId, null, topic)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-bold text-orange-900 hover:bg-orange-50 touch-manipulation"
      >
        Blurt
      </Link>
      {onStartSession ? (
        <button
          type="button"
          disabled={sessionLoading}
          {...tapStartSession}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-800 hover:bg-stone-50 disabled:opacity-60 touch-manipulation"
        >
          {sessionLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Study Now
        </button>
      ) : null}
      <Link
        href={teachMeHref(courseId, null, focusTopic?.trim() || null)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-900 hover:bg-violet-50 touch-manipulation"
      >
        Teach it back
      </Link>
      <Link
        href={hubChatHref({ courseId, topic: focusTopic?.trim() || undefined })}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 touch-manipulation"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Chat
      </Link>
    </div>
  );
}
