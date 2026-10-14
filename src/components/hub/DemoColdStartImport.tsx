"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { useTapHandler } from "@/hooks/useTapHandler";

export function DemoColdStartImport({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<
    Array<{ id: string; title: string; focusTopic: string | null }>
  >([]);

  async function importDemo() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/onboarding/demo", { method: "POST" });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Demo import failed.");
      setMessage(
        data.result?.message ?? "Demo courses added — open Study to start a session.",
      );
      setCourses(
        Array.isArray(data.result?.coldStartCourses)
          ? data.result.coldStartCourses.filter(
              (course: { id?: string; title?: string }) =>
                typeof course?.id === "string" && typeof course?.title === "string",
            )
          : [],
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo import failed.");
    } finally {
      setLoading(false);
    }
  }

  const tapImport = useTapHandler(() => void importDemo());

  return (
    <div
      data-hub-onboarding
      className={
        className ||
        (compact
          ? "rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-4"
          : "rounded-3xl border border-dashed border-brand bg-brand-soft/30 p-6 text-center")
      }
    >
      {!compact ? (
        <>
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "var(--sh-accent-soft)", color: "var(--sh-accent)" }}
          >
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="mt-4 font-bold text-stone-900">Just exploring?</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
            Load sample CS and English courses with assignments so you can try Study
            Now and the calendar right away.
          </p>
        </>
      ) : (
        <p className="text-sm font-semibold text-stone-800">
          No syllabus yet? Import demo courses with topics ready for Study Now.
        </p>
      )}
      <button
        type="button"
        {...tapImport}
        disabled={loading}
        className={`btn-accent inline-flex min-h-11 items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-60 touch-manipulation ${
          compact ? "mt-3" : "mt-4"
        }`}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Import demo courses
      </button>
      {message ? (
        <p className="mt-3 text-sm font-medium text-emerald-700">{message}</p>
      ) : null}
      {courses.length > 0 ? (
        <div className={`space-y-2 ${compact ? "mt-3" : "mt-4"}`}>
          {courses.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl border border-violet-200 bg-white/80 px-3 py-3"
            >
              <span className="text-xs font-semibold text-stone-700">{course.title}</span>
            </div>
          ))}
          <Link
            href="/study"
            className="inline-flex min-h-11 items-center rounded-full border border-violet-200 bg-white px-4 py-2 text-xs font-semibold text-violet-800 hover:bg-violet-50 touch-manipulation"
          >
            Open Study
          </Link>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
