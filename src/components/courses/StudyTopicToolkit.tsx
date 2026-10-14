"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Brain,
  ClipboardList,
  FileText,
  Layers,
  Loader2,
  MessageCircle,
  Play,
  Sparkles,
} from "lucide-react";

import { launchStudyNowSession } from "@/lib/study/client-launch";
import { useTapHandler } from "@/hooks/useTapHandler";
import {
  blurtingHref,
  coreStudyPackHref,
  luckyQuizHref,
  sixChunkingHref,
  teachMeHref,
} from "@/lib/study/loop-hrefs";
import type { StudyTopicProfile } from "@/lib/study-topic/types";

export function StudyTopicToolkit({
  courseId,
  courseTitle,
  studyTopic,
}: {
  courseId: string;
  courseTitle: string;
  studyTopic: StudyTopicProfile;
}) {
  const router = useRouter();
  const [loadingSession, setLoadingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  async function startStudyNow() {
    setLoadingSession(true);
    setSessionError(null);
    try {
      await launchStudyNowSession({ minutes: 20, courseId });
      router.push(`/study/session?minutes=20&courseId=${encodeURIComponent(courseId)}`);
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : "Failed to start session");
    } finally {
      setLoadingSession(false);
    }
  }

  const topicFocus = studyTopic.title?.trim() || "notes";

  const actions = [
    {
      label: "Core notes",
      description: "Read, annotate, chat with sources",
      href: `/core?courseId=${encodeURIComponent(courseId)}`,
      icon: FileText,
    },
    {
      label: "Teach it back",
      description: "Explain in simple terms",
      href: teachMeHref(courseId, null, topicFocus),
      icon: MessageCircle,
    },
    {
      label: "Blurting",
      description: "Recall without looking",
      href: blurtingHref(courseId, null, topicFocus),
      icon: Brain,
    },
    {
      label: "Flashcards",
      description: "Review and generate cards",
      href: `/flashcards?courseId=${encodeURIComponent(courseId)}&topic=${encodeURIComponent(topicFocus)}`,
      icon: Layers,
    },
    {
      label: "Quizzes",
      description: "Browse saved quizzes",
      href: luckyQuizHref(courseId, null, topicFocus),
      icon: ClipboardList,
    },
    {
      label: "Full study hub",
      description: "Six, Lucky, mixed review",
      href: `/study?courseId=${encodeURIComponent(courseId)}`,
      icon: Sparkles,
    },
  ] as const;

  const tapStudyNow = useTapHandler(() => void startStudyNow());

  return (
    <section
      data-hub-chrome
      className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-white p-6 shadow-sm"
    >
      <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
        Study topic · no syllabus required
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        {studyTopic.summary}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={loadingSession}
          {...tapStudyNow}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-60 touch-manipulation"
        >
          {loadingSession ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Study Now (20 min)
        </button>
        <Link
          href={luckyQuizHref(courseId, null, topicFocus)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-500 touch-manipulation"
        >
          <ClipboardList className="h-4 w-4" />
          Make quiz from topics
        </Link>
        <Link
          href={coreStudyPackHref(courseId, studyTopic.title)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-violet-300 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-900 hover:bg-violet-100 touch-manipulation"
        >
          <Sparkles className="h-4 w-4" />
          Study pack in Core
        </Link>
        <Link
          href={sixChunkingHref(courseId, studyTopic.title || "topics")}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-teal-300 bg-teal-50 px-4 py-2.5 text-sm font-bold text-teal-900 hover:bg-teal-100 touch-manipulation"
        >
          <Layers className="h-4 w-4" />
          Chunk in Six
        </Link>
        <Link
          href={`/core?courseId=${courseId}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-teal-300 bg-teal-50 px-4 py-2.5 text-sm font-bold text-teal-800 hover:bg-teal-100 touch-manipulation"
        >
          <BookOpen className="h-4 w-4" />
          Open in Core
        </Link>
      </div>

      {sessionError ? (
        <p className="mt-3 text-sm text-rose-700">{sessionError}</p>
      ) : null}

      {studyTopic.subtopics.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Breakdown
          </p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {studyTopic.subtopics.map((subtopic) => (
              <li
                key={subtopic.name}
                className="rounded-xl border border-violet-100 bg-white px-4 py-3 text-sm"
              >
                <p className="font-semibold text-stone-900">{subtopic.name}</p>
                <p className="mt-0.5 text-stone-600">{subtopic.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group min-h-11 rounded-2xl border border-orange-100 bg-white p-4 transition touch-manipulation hover:border-violet-200 hover:shadow-sm"
          >
            <action.icon className="h-5 w-5 text-violet-600" />
            <p className="mt-2 font-bold text-stone-900">{action.label}</p>
            <p className="mt-0.5 text-xs text-stone-500">{action.description}</p>
          </Link>
        ))}
      </div>

      {studyTopic.suggestedTechniques.length > 0 ? (
        <p className="mt-4 text-xs text-stone-500">
          Suggested: {studyTopic.suggestedTechniques.join(" · ")}
        </p>
      ) : null}
    </section>
  );
}
