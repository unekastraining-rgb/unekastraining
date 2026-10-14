"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Flame, TrendingUp } from "lucide-react";

import { teachMeHref } from "@/lib/study/loop-hrefs";

export interface CourseProgressData {
  courseId: string;
  courseTitle: string;
  overallMastery: number;
  topicsTracked: number;
  minutesThisWeek: number;
  pendingAssignments: number;
  dueFlashcards: number;
  weakTopics: Array<{ id: string; name: string; proficiency: number }>;
}

export function CourseProgressStory({
  courseId,
  compact = false,
}: {
  courseId: string;
  compact?: boolean;
}) {
  const [data, setData] = useState<CourseProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setLoading(true);
    setLoadError(null);
    setData(null);

    void fetch(`/api/courses/${courseId}/progress`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setData(result.data as CourseProgressData);
        } else {
          setLoadError(result.error ?? "Could not load progress.");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error && err.name === "AbortError"
            ? "Progress took too long to load."
            : "Could not load progress.",
        );
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [courseId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-orange-100 bg-white p-4 text-sm text-stone-500">
        Loading progress…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-orange-100 bg-white p-4 text-sm text-stone-600">
        {loadError}
      </div>
    );
  }

  if (!data) return null;

  return (
    <section
      className={`rounded-2xl border border-orange-100 bg-white shadow-sm ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-teal-600" />
        <h2 className="text-lg font-bold text-stone-900">Progress story</h2>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
        <Stat label="Topic progress" value={`${data.overallMastery}%`} />
        <Stat label="This week" value={`${data.minutesThisWeek}m`} />
        <Stat label="Open tasks" value={String(data.pendingAssignments)} />
        <Stat label="Cards due" value={String(data.dueFlashcards)} />
      </div>

      {data.weakTopics.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Needs teach-back
          </p>
          <ul className="mt-2 space-y-1.5">
            {data.weakTopics.map((topic) => (
              <li key={topic.id}>
                <Link
                  href={teachMeHref(courseId, null, topic.name)}
                  className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2 text-sm transition hover:bg-violet-50 touch-manipulation"
                >
                  <span className="font-semibold text-stone-900">{topic.name}</span>
                  <span className="text-xs font-bold text-violet-700">{topic.proficiency}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone-500">
          No weak topics flagged — keep studying to build your topic progress story.
        </p>
      )}

      {!compact ? (
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link
            href={`/dashboard/telemetry?courseId=${courseId}`}
            className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline"
          >
            Full topic progress tree <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="inline-flex items-center gap-1 text-stone-500">
            <Flame className="h-4 w-4 text-orange-500" />
            {data.minutesThisWeek > 0
              ? `${data.minutesThisWeek} min studied this week`
              : "Start a session to build your streak"}
          </span>
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-orange-50/60 px-3 py-2">
      <p className="text-lg font-black text-stone-900">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  );
}
