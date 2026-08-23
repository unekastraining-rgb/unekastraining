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
import type { StudyTopicProfile } from "@/lib/study-topic/types";

export function StudyTopicToolkit({
  courseId,
  studyTopic,
}: {
  courseId: string;
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
      router.push("/study/session");
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : "Failed to start session");
    } finally {
      setLoadingSession(false);
    }
  }

  const actions = [
    {
      label: "Core notes",
      description: "Read, annotate, chat with sources",
      href: `/core?courseId=${courseId}`,
      icon: FileText,
      tone: "teal",
    },
    {
      label: "Teach it back",
      description: "Explain in simple terms",
      href: `/study/teach-me?courseId=${courseId}`,
      icon: MessageCircle,
      tone: "violet",
    },
    {
      label: "Blurting",
      description: "Recall without looking",
      href: `/study/blurting?courseId=${courseId}`,
      icon: Brain,
      tone: "orange",
    },
    {
      label: "Flashcards",
      description: "Review and generate cards",
      href: `/flashcards?courseId=${courseId}`,
      icon: Layers,
      tone: "amber",
    },
    {
      label: "Quizzes",
      description: "Test what you know",
      href: `/quizzes?courseId=${courseId}`,
      icon: ClipboardList,
      tone: "stone",
    },
    {
      label: "Full study hub",
      description: "Six, Lucky, mixed review",
      href: `/study?courseId=${courseId}`,
      icon: Sparkles,
      tone: "violet",
    },
  ] as const;

  return (
    <section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-white p-6 shadow-sm">
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
          onClick={() => void startStudyNow()}
          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-60"
        >
          {loadingSession ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Study Now (20 min)
        </button>
        <Link
          href={`/core?courseId=${courseId}`}
          className="inline-flex items-center gap-2 rounded-xl border border-teal-300 bg-teal-50 px-4 py-2.5 text-sm font-bold text-teal-800 hover:bg-teal-100"
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
            className="group rounded-2xl border border-orange-100 bg-white p-4 transition hover:border-violet-200 hover:shadow-sm"
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
