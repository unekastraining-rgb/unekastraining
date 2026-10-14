"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { readableCourseTitle } from "@/lib/courses/display-name";
import { pickColdStartTopic } from "@/lib/study/cold-start-topic";

import { SearchLoopQuickLinks } from "./SearchLoopQuickLinks";

interface CourseRow {
  id: string;
  title: string;
  topics?: string[];
}

export function SearchFocusLoopPanel({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const [course, setCourse] = useState<CourseRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/courses");
        const data = await response.json();
        if (!cancelled && data.success && Array.isArray(data.courses) && data.courses.length > 0) {
          const primary = data.courses[0] as CourseRow;
          setCourse(primary);
        }
      } catch {
        if (!cancelled) setCourse(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className={`text-stone-500 ${compact ? "px-3 py-3 text-xs" : "text-sm"}`}>
        Loading study shortcuts…
      </p>
    );
  }

  if (!course) {
    return (
      <div className={compact ? "px-3 py-3" : ""}>
        <p className={`text-stone-600 ${compact ? "text-xs" : "text-sm"}`}>
          Search classes, notes, and materials — or{" "}
          <Link
            href="/courses"
            onClick={onNavigate}
            className="font-semibold text-brand hover:underline"
          >
            add a class
          </Link>{" "}
          to unlock the Core → Six → Lucky loop.
        </p>
      </div>
    );
  }

  const focusTopic = pickColdStartTopic(course.topics ?? []);

  return (
    <div
      data-hub-chrome
      className={compact ? "border-b border-brand px-3 py-3" : "rounded-2xl border border-violet-100 bg-violet-50/40 p-4"}
    >
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">
            Core → Six → Lucky
          </p>
          <p className={`text-stone-700 ${compact ? "text-xs" : "text-sm"}`}>
            Jump into your study loop for{" "}
            <strong>{readableCourseTitle(course.title)}</strong>
            {focusTopic ? (
              <>
                {" "}
                — starting with <strong>{focusTopic}</strong>
              </>
            ) : null}
          </p>
        </div>
      </div>
      <div className={compact ? "mt-2" : "mt-3"}>
        <SearchLoopQuickLinks
          courseId={course.id}
          topic={focusTopic}
          compact={compact}
          onNavigate={onNavigate}
        />
      </div>
      {!compact ? (
        <p className="mt-3 text-xs text-stone-500">
          Type to search — course and topic hits include loop shortcuts too.
        </p>
      ) : null}
    </div>
  );
}
