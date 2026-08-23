"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

import type { CourseInfoPortal, CourseInfoSection } from "@/lib/lms/course-info/types";
import { formatDisplayDate } from "@/lib/lms/course-info/html";

function SectionCard({ section }: { section: CourseInfoSection }) {
  return (
    <section
      id={`course-info-${section.id}`}
      className="scroll-mt-24 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-bold text-stone-900">{section.title}</h2>
      <ul className="mt-4 space-y-4">
        {section.items.map((item, index) => (
          <li
            key={`${section.id}-${index}`}
            className="rounded-2xl border border-stone-100 bg-stone-50/80 px-4 py-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-semibold text-stone-900">{item.title}</p>
              {item.date ? (
                <time className="shrink-0 text-xs font-semibold text-teal-700">
                  {formatDisplayDate(item.date)}
                </time>
              ) : null}
            </div>
            {item.body ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">
                {item.body}
              </p>
            ) : item.source.url ? (
              <p className="mt-2 text-sm text-stone-500">
                Open in Moodle for the full content.
              </p>
            ) : null}
            <p className="mt-2 text-xs text-stone-400">
              Source: {item.source.label}
              {item.source.url ? (
                <>
                  {" · "}
                  <a
                    href={item.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-teal-700 hover:underline"
                  >
                    Open in Moodle
                  </a>
                </>
              ) : null}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CourseInfoView({
  courseId,
  moodleCourseId,
}: {
  courseId: string;
  moodleCourseId?: number | null;
}) {
  const [portal, setPortal] = useState<CourseInfoPortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/courses/${courseId}/course-info${refresh ? "?refresh=1" : ""}`,
        );
        const data = await response.json();
        if (!data.success) {
          setError(data.error ?? "Could not load course info.");
          setPortal(null);
          return;
        }
        setPortal(data.portal);
      } catch {
        setError("Could not load course info.");
        setPortal(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [courseId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center text-sm text-stone-500 shadow-sm">
        Loading course information from Moodle…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50 p-6 text-sm text-rose-800">
        <p>{error}</p>
        {!moodleCourseId ? (
          <p className="mt-2 text-rose-700">
            Sync your Moodle courses from Settings → LMS first.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => void load(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!portal || portal.sections.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-orange-200 bg-white p-8 text-center text-sm text-stone-500 shadow-sm">
        No structured course information found in Moodle for this class yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-sm text-teal-900">
        <div>
          <p className="font-semibold">Synced from Moodle</p>
          <p className="text-xs text-teal-800/80">
            Last updated {formatDisplayDate(portal.syncedAt)}
            {portal.course.moodleUrl ? (
              <>
                {" · "}
                <a
                  href={portal.course.moodleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold hover:underline"
                >
                  Open course
                  <ExternalLink className="h-3 w-3" />
                </a>
              </>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-800 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {portal.sections.length > 1 ? (
        <nav className="flex flex-wrap gap-2">
          {portal.sections.map((section) => (
            <a
              key={section.id}
              href={`#course-info-${section.id}`}
              className="rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-orange-50"
            >
              {section.title}
            </a>
          ))}
        </nav>
      ) : null}

      <div className="space-y-6">
        {portal.sections.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
