"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Loader2, Play, Sparkles } from "lucide-react";

import { launchStudyNowSession } from "@/lib/study/client-launch";
import type { StudyMinutes } from "@/lib/csl/study-now";
import { hubAssignmentsHref, hubChatHref } from "@/lib/hub/tabs";

const TIME_OPTIONS: StudyMinutes[] = [10, 20, 30, 45];

export function HubStudyNowCard({
  courseId,
  courseTitle,
  overdueCount = 0,
  variant = "banner",
}: {
  courseId?: string | null;
  courseTitle?: string | null;
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
      await launchStudyNowSession({
        minutes: length,
        ...(courseId ? { courseId } : {}),
      });
      router.push("/study/session");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
    } finally {
      setLoading(false);
    }
  }

  const isBanner = variant === "banner";

  return (
    <section
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
            <Sparkles className="h-5 w-5" />
            <h2 className={`text-xl font-black ${isBanner ? "text-stone-900" : "text-stone-900"}`}>
              Study Now
            </h2>
          </div>
          <p className={`mt-1 text-sm ${isBanner ? "text-stone-600" : "text-stone-600"}`}>
            {courseTitle
              ? `One tap — we'll pick the best 20 minutes for ${courseTitle} from weak topics, due work, and flashcards.`
              : "One tap — we'll pick your best 20 minutes from weak topics, due dates, missed questions, and flashcards. Techniques chosen automatically."}
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
            onClick={() => void startSession(20)}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-base font-bold transition disabled:opacity-60 ${
              isBanner ? "btn-primary" : "bg-stone-900 text-white hover:bg-stone-800"
            }`}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Play className="h-5 w-5" />
            )}
            Study for 20 minutes
          </button>
          <button
            type="button"
            onClick={() => setShowOptions((value) => !value)}
            className={`inline-flex items-center justify-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-800`}
          >
            Different length
            <ChevronDown className={`h-3.5 w-3.5 transition ${showOptions ? "rotate-180" : ""}`} />
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
              onClick={() => {
                setMinutes(option);
                void startSession(option);
              }}
              disabled={loading}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
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
        className={`mt-4 flex flex-wrap gap-2 border-t border-brand pt-4 text-xs font-semibold`}
      >
        <span className={`w-full ${isBanner ? "text-stone-500" : "text-stone-500"}`}>Also:</span>
        <Link
          href="/courses"
          className="rounded-full border border-brand bg-white px-3 py-1.5 text-stone-700 hover:bg-brand-soft"
        >
          Upload syllabus
        </Link>
        <Link
          href="/core"
          className="rounded-full border px-3 py-1.5 hover:brightness-95"
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
            href={hubChatHref({ courseId })}
            className={
              isBanner
                ? "rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1.5 text-violet-200 hover:bg-violet-500/25"
                : "rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-violet-800 hover:bg-violet-100"
            }
          >
            Chat with class
          </Link>
        ) : null}
      </div>
    </section>
  );
}
