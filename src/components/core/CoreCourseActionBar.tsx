"use client";

import Link from "next/link";
import { Layers, Loader2, MessageCircle, Play, Sparkles } from "lucide-react";

import { hubChatHref } from "@/lib/hub/tabs";

export function CoreCourseActionBar({
  courseId,
  courseTitle,
  onStartSession,
  sessionLoading,
}: {
  courseId: string;
  courseTitle?: string;
  onStartSession?: () => void;
  sessionLoading?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50/80 to-white px-4 py-3">
      <p className="mr-2 text-xs font-bold uppercase tracking-wider text-teal-700">
        {courseTitle ?? "This class"}
      </p>
      <Link
        href={hubChatHref({ courseId })}
        className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-800 hover:bg-violet-100"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Chat with class
      </Link>
      <Link
        href={`/flashcards?courseId=${courseId}`}
        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
      >
        <Layers className="h-3.5 w-3.5" />
        Flashcards
      </Link>
      {onStartSession ? (
        <button
          type="button"
          disabled={sessionLoading}
          onClick={onStartSession}
          className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-2 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-60"
        >
          {sessionLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Study Now (20 min)
        </button>
      ) : null}
      <Link
        href={`/study/six/chunking?courseId=${courseId}`}
        className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100"
      >
        <Sparkles className="h-3.5 w-3.5" />
        SIX study
      </Link>
      <Link
        href={`/study/lucky?courseId=${courseId}`}
        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100"
      >
        <Layers className="h-3.5 w-3.5" />
        Lucky quiz
      </Link>
      <Link
        href={`/study/teach-me?courseId=${courseId}`}
        className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-800 hover:bg-orange-100"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Teach it back
      </Link>
    </div>
  );
}
