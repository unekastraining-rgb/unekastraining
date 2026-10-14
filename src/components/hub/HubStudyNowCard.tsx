"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Loader2, Play, Sparkles } from "lucide-react";

import { launchStudyNowSession } from "@/lib/study/client-launch";
import { useTapHandler } from "@/hooks/useTapHandler";
import { coursesScanLandingHref } from "@/lib/study/loop-hrefs";
import type { StudyMinutes } from "@/lib/csl/study-now";
import { hubAssignmentsHref, hubChatHref } from "@/lib/hub/tabs";

const TIME_OPTIONS = [10, 20, 30, 45] as const satisfies readonly StudyMinutes[];

export function HubStudyNowCard({
  courseId,
  courseTitle,
  focusTopic,
  overdueCount = 0,
  variant = "banner",
}: {
  courseId?: string | null;
  courseTitle?: string | null;
  /** LMS/syllabus topic for Six / Lucky / Blurt cold start (not the course title). */
  focusTopic?: string | null;
  overdueCount?: number;
  variant?: "banner" | "card";
}) {
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);
  const [minutes, setMinutes] = useState<StudyMinutes>(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSession(length: StudyMinutes = 20) {
    setLoading(true);
    setError(null);
    try {
      const launched = await launchStudyNowSession({
        minutes: length,
        ...(courseId ? { courseId } : {}),
      });
      const query = new URLSearchParams({ minutes: String(length) });
      const resolvedCourseId = launched.courseId ?? courseId;
      if (resolvedCourseId) query.set("courseId", resolvedCourseId);
      router.push(`/study/session?${query.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
    } finally {
      setLoading(false);
    }
  }

  const isBanner = variant === "banner";

  const tapStudy20 = useTapHandler(() => void startSession(20));
  const tapToggleOptions = useTapHandler(() => setShowOptions((value) => !value));
  const tap10 = useTapHandler(() => {
    setMinutes(10);
    void startSession(10);
  });
  const tap20 = useTapHandler(() => {
    setMinutes(20);
    void startSession(20);
  });
  const tap30 = useTapHandler(() => {
    setMinutes(30);
    void startSession(30);
  });
  const tap45 = useTapHandler(() => {
    setMinutes(45);
    void startSession(45);
  });
  const lengthTaps: Record<(typeof TIME_OPTIONS)[number], ReturnType<typeof useTapHandler>> = {
    10: tap10,
    20: tap20,
    30: tap30,
    45: tap45,
  };

  return (
    <section
      data-hub-chrome
      suppressHydrationWarning
      className={
        isBanner
          ? "overflow-hidden rounded-3xl border border-brand bg-white p-5 shadow-sm"
          : "rounded-2xl border border-brand bg-brand-soft/40 p-5 shadow-sm"
      }
      style={
        isBanner
          ? {
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--sh-primary-soft) 70%, white) 0%, white 55%, color-mix(in srgb, var(--sh-accent-soft) 50%, white) 100%)",
            }
          : undefined
      }
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className={`flex items-center gap-2 ${isBanner ? "text-brand" : "text-brand"}`}>
            <span className="shrink-0" suppressHydrationWarning aria-hidden>
              <Sparkles className="h-5 w-5" />
            </span>
            <h2
              suppressHydrationWarning
              className={`text-xl font-black ${isBanner ? "text-stone-900" : "text-stone-900"}`}
            >
              Study Now
            </h2>
          </div>
          <p
            suppressHydrationWarning
            className={`mt-1 text-sm ${isBanner ? "text-stone-600" : "text-stone-600"}`}
          >
            {courseTitle
              ? `Core notes → Six techniques → Lucky quiz for ${courseTitle} — one session from weak topics and due work.`
              : "We build a short session from your weak topics, due work, and flashcards."}
          </p>
          {isBanner ? (
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
              <span className="rounded-full bg-brand-soft px-3 py-1 text-stone-700">20 min session</span>
              {overdueCount > 0 ? (
                <Link
                  href={hubAssignmentsHref()}
                  className="rounded-full bg-rose-100 px-3 py-1 text-rose-700 hover:bg-rose-200"
                >
                  {overdueCount} overdue task{overdueCount === 1 ? "" : "s"}
                </Link>
              ) : (
                <span
                  className="rounded-full px-3 py-1"
                  style={{
                    backgroundColor: "var(--sh-accent-soft)",
                    color: "var(--sh-accent)",
                  }}
                >
                  Ready when you are
                </span>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <button
            type="button"
            {...tapStudy20}
            disabled={loading}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-base font-bold transition disabled:opacity-60 touch-manipulation ${
              isBanner ? "btn-primary" : "bg-stone-900 text-white hover:bg-stone-800"
            }`}
          >
            {loading ? (
              <span className="shrink-0" suppressHydrationWarning aria-hidden>
                <Loader2 className="h-5 w-5 animate-spin" />
              </span>
            ) : (
              <span className="shrink-0" suppressHydrationWarning aria-hidden>
                <Play className="h-5 w-5" />
              </span>
            )}
            Study for 20 minutes
          </button>
          <button
            type="button"
            {...tapToggleOptions}
            className="inline-flex min-h-11 items-center justify-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-800 touch-manipulation"
          >
            Different length
            <span className="shrink-0" suppressHydrationWarning aria-hidden>
              <ChevronDown className={`h-3.5 w-3.5 transition ${showOptions ? "rotate-180" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {showOptions ? (
        <div
          className={`mt-3 flex flex-wrap gap-2 border-t border-brand pt-3`}
        >
          {TIME_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              {...lengthTaps[option]}
              disabled={loading}
              className={`min-h-10 rounded-full px-3 py-1.5 text-sm font-semibold transition touch-manipulation ${
                minutes === option
                  ? "btn-primary text-white"
                  : "border border-brand bg-white text-stone-700 hover:bg-brand-soft"
              }`}
            >
              {option} min
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className={`mt-3 text-sm ${isBanner ? "text-rose-300" : "text-rose-700"}`}>{error}</p>
      ) : null}

      <div
        data-hub-chrome
        className={`mt-4 flex flex-wrap gap-2 border-t border-brand pt-4 text-xs font-semibold`}
      >
        <span className={`w-full ${isBanner ? "text-stone-500" : "text-stone-500"}`}>Also:</span>
        <Link
          href={coursesScanLandingHref(courseId)}
          className="inline-flex min-h-11 items-center rounded-full border border-brand bg-white px-3 py-1.5 text-stone-700 hover:bg-brand-soft touch-manipulation"
        >
          Upload syllabus
        </Link>
        <Link
          href={courseId ? `/core?courseId=${encodeURIComponent(courseId)}` : "/core"}
          className="inline-flex min-h-11 items-center rounded-full border px-3 py-1.5 hover:brightness-95 touch-manipulation"
          style={{
            borderColor: "color-mix(in srgb, var(--sh-accent) 28%, transparent)",
            backgroundColor: "var(--sh-accent-soft)",
            color: "var(--sh-accent)",
          }}
        >
          Core notes
        </Link>
        {courseId ? (
          <Link
            href={hubChatHref({ courseId, topic: focusTopic ?? undefined })}
            className="inline-flex min-h-11 items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-violet-800 hover:bg-violet-100 touch-manipulation"
          >
            Chat with class
          </Link>
        ) : null}
      </div>
    </section>
  );
}
