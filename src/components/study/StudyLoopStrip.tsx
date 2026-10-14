"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Sparkles } from "lucide-react";

import {
  blurtingHref,
  coreStudyPackHref,
  luckyQuizHref,
  sixChunkingHref,
} from "@/lib/study/loop-hrefs";
import { resolveLoopFocusTopic } from "@/lib/study/resolve-loop-focus-topic";

/**
 * Soft links to workspace, teach, and review — not a mandatory stage ladder.
 * Visible on Study hub so iPad/mobile users see helpful paths without hunting menus.
 */
export function StudyLoopStrip({
  courseId,
  courseTitle,
  topics = [],
  focusTopic: focusTopicOverride,
}: {
  courseId: string;
  courseTitle: string;
  topics?: string[];
  /** URL or session topic — wins over syllabus topic pick. */
  focusTopic?: string | null;
}) {
  const focusTopic = resolveLoopFocusTopic(focusTopicOverride, topics);

  return (
    <section
      data-hub-chrome
      data-hub-how-study-haul-helps
      className="rounded-3xl border border-stone-200 bg-stone-50/80 p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-800 text-white shadow-md">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
            How Study Haul helps you learn
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-stone-900">
            Tools for {courseTitle}
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Workspace, teaching, and review work together — pick what you need
            {focusTopic ? (
              <>
                {" "}
                (focus: <strong className="text-stone-800">{focusTopic}</strong>)
              </>
            ) : (
              "."
            )}
          </p>
        </div>
      </div>

      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        <LoopStep
          step={1}
          label="Open Workspace"
          detail="Notes, ink, and study packs in CORE"
          href={coreStudyPackHref(courseId, focusTopic)}
          icon={BookOpen}
          tone="teal"
        />
        <LoopStep
          step={2}
          label="Learn & Practice"
          detail="Taught lessons and practice on your topic"
          href={sixChunkingHref(courseId, focusTopic ?? "notes")}
          icon={Brain}
          tone="violet"
        />
        <LoopStep
          step={3}
          label="Review & Remember"
          detail="Quiz and review what you want to keep"
          href={luckyQuizHref(courseId, null, focusTopic)}
          icon={Sparkles}
          tone="orange"
        />
      </ol>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={blurtingHref(courseId, null, focusTopic)}
          className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-orange-900 touch-manipulation hover:bg-orange-50"
        >
          Blurt gaps <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href={`/core?courseId=${encodeURIComponent(courseId)}`}
          className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-900 touch-manipulation hover:bg-teal-50"
        >
          Open notebook <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

function LoopStep({
  step,
  label,
  detail,
  href,
  icon: Icon,
  tone,
}: {
  step: number;
  label: string;
  detail: string;
  href: string;
  icon: typeof BookOpen;
  tone: "teal" | "violet" | "orange";
}) {
  const ring =
    tone === "teal"
      ? "border-teal-200 hover:border-teal-300 hover:bg-teal-50/50"
      : tone === "violet"
        ? "border-violet-200 hover:border-violet-300 hover:bg-violet-50/50"
        : "border-orange-200 hover:border-orange-300 hover:bg-orange-50/50";

  return (
    <li>
      <Link
        href={href}
        className={`flex min-h-11 flex-col rounded-2xl border bg-white/90 p-4 transition touch-manipulation ${ring}`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Option {step}
        </span>
        <span className="mt-1 flex items-center gap-2 text-sm font-bold text-stone-900">
          <Icon className="h-4 w-4 shrink-0 opacity-80" />
          {label}
        </span>
        <span className="mt-1 flex-1 text-xs leading-relaxed text-stone-600">{detail}</span>
        <span className="mt-3 text-xs font-semibold text-brand">Start →</span>
      </Link>
    </li>
  );
}
