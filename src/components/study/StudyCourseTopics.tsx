"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

import { LmsSyncNowButton } from "@/components/hub/LmsSyncNowButton";
import { useCourseTopics } from "@/hooks/useCourseTopics";
import { useTapHandler } from "@/hooks/useTapHandler";
import {
  courseMaterialUploadHref,
  coursesScanLandingHref,
} from "@/lib/study/loop-hrefs";

export function StudyCourseTopics({
  courseId,
  courseTitle,
  topics: initialTopicNames,
}: {
  courseId: string;
  courseTitle: string;
  topics: string[];
}) {
  const seeded = initialTopicNames.map((name, index) => ({
    id: `${courseId}-${index}`,
    name,
  }));
  const { topics, loading, error, refresh } = useCourseTopics(courseId, seeded);
  const topicNames = topics.map((topic) => topic.name);
  const tapRefresh = useTapHandler(() => void refresh());

  if (loading && topicNames.length === 0) {
    return (
      <section className="rounded-3xl border border-teal-200/80 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading topics for {courseTitle}…
        </div>
      </section>
    );
  }

  if (topicNames.length === 0) {
    return (
      <section
        data-hub-chrome
        className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6 touch-manipulation"
      >
        <h2 className="text-lg font-bold text-stone-900">Study from topics</h2>
        <p className="mt-2 text-sm text-stone-700">
          No topics yet for <strong>{courseTitle}</strong>. Your LMS connection follows this login
          on web, iPad, and phone — sync once on campus Wi‑Fi to pull module topics.
        </p>
        {error ? (
          <p className="mt-2 text-sm font-medium text-rose-700">{error}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <LmsSyncNowButton className="" onSynced={() => void refresh()} />
          <button
            type="button"
            {...tapRefresh}
            className="min-h-10 rounded-xl border border-brand bg-white px-3 py-2 text-sm font-semibold text-stone-700 touch-manipulation hover:bg-brand-soft"
          >
            Retry topics
          </button>
        </div>
        <Link
          href={courseMaterialUploadHref(courseId)}
          className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-orange-800 hover:underline touch-manipulation"
        >
          Photo syllabus (OCR) on this class <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={coursesScanLandingHref()}
          className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-stone-700 hover:underline touch-manipulation"
        >
          Or scan a new syllabus <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/dashboard?tab=settings"
          className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-teal-700 hover:underline touch-manipulation"
        >
          Open LMS settings <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  return (
    <section
      data-hub-chrome
      className="rounded-3xl border border-teal-200/80 bg-white p-5 sm:p-6 touch-manipulation"
    >
      <h2 className="text-lg font-bold text-stone-900">Study from topics</h2>
      <p className="mt-1 text-sm text-stone-600">
        LMS modules and syllabus outline for <strong>{courseTitle}</strong>. Open Study to
        practice any topic.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {topicNames.map((topic) => (
          <li
            key={topic}
            className="rounded-2xl border border-teal-100 bg-teal-50/40 p-3"
          >
            <p className="text-sm font-semibold text-stone-900">{topic}</p>
            <Link
              href={`/study?courseId=${encodeURIComponent(courseId)}&topic=${encodeURIComponent(topic)}`}
              className="mt-2 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-teal-800 hover:underline touch-manipulation"
            >
              Open in Study <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
