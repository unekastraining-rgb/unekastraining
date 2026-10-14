"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Play, Sparkles } from "lucide-react";

import {
  LUCKY_STORAGE_KEY,
  saveStudySession,
} from "@/components/study/StudySessionRunner";
import { StudyLoopStrip } from "@/components/study/StudyLoopStrip";
import { useTapHandler } from "@/hooks/useTapHandler";
import { LUCKY_PROCESS } from "@/lib/csl/lucky";
import type { StudyBlock } from "@/lib/csl/study-now";
import { coreCourseHref } from "@/lib/study/core-href";
import { blurtingHref, luckyQuizHref, sixChunkingHref } from "@/lib/study/loop-hrefs";
import { resolveLoopFocusTopic } from "@/lib/study/resolve-loop-focus-topic";

export function LuckyEngineView() {
  const searchParams = useSearchParams();
  const queryCourseId = searchParams.get("courseId")?.trim() || "";
  const urlTopic = searchParams.get("topic")?.trim() || null;
  const [courseId, setCourseId] = useState(queryCourseId);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [blocks, setBlocks] = useState<Array<StudyBlock & { phase?: string }>>([]);
  const [coldStartTopic, setColdStartTopic] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState<string | null>(null);
  const [topicNames, setTopicNames] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setCourseId(queryCourseId);
  }, [queryCourseId]);

  useEffect(() => {
    const query = queryCourseId ? `?courseId=${encodeURIComponent(queryCourseId)}` : "";
    void fetch(`/api/study/lucky${query}`, { credentials: "same-origin" })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setSummary(data.data.summary);
          setBlocks(data.data.blocks);
          if (typeof data.data.courseId === "string" && data.data.courseId.trim()) {
            setCourseId(data.data.courseId.trim());
          }
          setColdStartTopic(
            typeof data.data.coldStartTopic === "string"
              ? data.data.coldStartTopic
              : null,
          );
          setCourseTitle(
            typeof data.data.courseTitle === "string" ? data.data.courseTitle : null,
          );
          setTopicNames(
            Array.isArray(data.data.topicNames)
              ? data.data.topicNames.filter(
                  (name: unknown): name is string => typeof name === "string",
                )
              : [],
          );
        }
      })
      .finally(() => setLoading(false));
  }, [queryCourseId]);

  function startSession() {
    saveStudySession(
      {
        summary,
        totalMinutes: 45,
        blocks,
        courseId: courseId || null,
      },
      LUCKY_STORAGE_KEY,
    );
    const sessionHref = courseId
      ? `/study/lucky/session?courseId=${encodeURIComponent(courseId)}`
      : "/study/lucky/session";
    window.location.href = sessionHref;
  }

  const tapStartSession = useTapHandler(startSession);

  const loopTopic = resolveLoopFocusTopic(urlTopic, topicNames) || coldStartTopic;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-6xl space-y-6 px-4 py-8"
      data-lucky-workspace
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
              Lucky · Retain
            </p>
            <h1 className="mt-1 text-3xl font-black text-stone-900">
              Lucky Engine
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Retention that closes the Study Haul loop — after Core notes and
              Six understanding — not a standalone Quizlet dump.
            </p>
            <p className="mt-3 text-xs font-medium text-violet-700">
              Core → Six → Lucky · {LUCKY_PROCESS.join(" → ")}
            </p>
          </div>
          {courseId && courseTitle ? (
            <StudyLoopStrip
              courseId={courseId}
              courseTitle={courseTitle}
              topics={topicNames}
              focusTopic={loopTopic}
            />
          ) : null}
        </aside>
        <div className="min-w-0 space-y-6">

      {courseId ? (
        <div
          data-hub-chrome
          className="flex flex-wrap gap-2 rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3 touch-manipulation"
        >
          <Link
            href={coreCourseHref({ courseId })}
            className="inline-flex min-h-11 items-center rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-teal-50 touch-manipulation"
          >
            Core notes
          </Link>
          <Link
            href={sixChunkingHref(courseId, loopTopic || "this class")}
            className="inline-flex min-h-11 items-center rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-teal-50 touch-manipulation"
          >
            Chunk in Six
            {loopTopic ? ` · ${loopTopic}` : ""}
          </Link>
          <Link
            href={luckyQuizHref(courseId, null, loopTopic)}
            className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500 touch-manipulation"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Make quiz from topics
          </Link>
          <Link
            href={blurtingHref(courseId, null, loopTopic)}
            className="inline-flex min-h-11 items-center rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-bold text-orange-900 hover:bg-orange-50 touch-manipulation"
          >
            Blurt gaps
          </Link>
        </div>
      ) : (
        <p className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-950">
          Pick a class from Study Hub for cold-start quizzes from LMS/syllabus topics (no upload
          required).
        </p>
      )}

      <p className="rounded-2xl border border-violet-100 bg-violet-50/50 px-4 py-3 text-sm text-stone-700">
        {summary}
      </p>

      <ul className="space-y-2">
        {blocks.map((block) => (
          <li
            key={block.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-violet-100 bg-white px-4 py-3"
          >
            <div>
              {"phase" in block && block.phase ? (
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                  {block.phase}
                </p>
              ) : null}
              <p className="font-semibold text-stone-900">{block.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500">{block.minutes} min</p>
              {block.href ? (
                <Link
                  href={block.href}
                  className="inline-flex min-h-11 items-center text-xs font-semibold text-violet-600 hover:underline touch-manipulation"
                >
                  Open →
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        {...tapStartSession}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 touch-manipulation"
      >
        <Play className="h-4 w-4" />
        Start Lucky session
      </button>

      <Link
        href={courseId ? `/study?courseId=${encodeURIComponent(courseId)}` : "/study"}
        className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-stone-500 hover:text-violet-600 touch-manipulation"
      >
        ← Back to Study Hub
      </Link>
        </div>
      </div>
    </div>
  );
}
