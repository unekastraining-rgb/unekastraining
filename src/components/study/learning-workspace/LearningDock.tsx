"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

/**
 * Bundle G UX — Minimal room dock.
 * Preserves Practice / Check / Remember / Tutor deep links without
 * visually defining the product as a pill bar.
 */
export function LearningDock({
  active,
  practiceHref,
  checkHref,
  rememberHref,
  onTutor,
  tutorOpen,
  orchestratedNext,
  onCurriculum,
}: {
  active: "learn" | "practice" | "check" | "remember" | "tutor";
  practiceHref: string;
  checkHref: string;
  rememberHref: string;
  onTutor: () => void;
  tutorOpen: boolean;
  orchestratedNext?: {
    href: string;
    label: string;
    hint?: string | null;
  } | null;
  onCurriculum?: () => void;
}) {
  return (
    <nav
      data-learning-dock
      data-learn-next-actions
      data-learn-continue-compact
      data-learn-bottom-nav
      data-dock-minimal="true"
      aria-label="Study rooms"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-800/10 bg-[#f7f5f1]/95 backdrop-blur"
    >
      {orchestratedNext ? (
        <div
          data-learn-orchestrated-next
          className="mx-auto flex max-w-5xl flex-col items-stretch gap-1 border-b border-stone-800/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-xs text-stone-600">
            {orchestratedNext.hint ?? "Suggested next step"}
          </p>
          <Link
            href={orchestratedNext.href}
            className="inline-flex min-h-10 items-center justify-center bg-teal-800 px-4 text-sm font-semibold text-white touch-manipulation hover:bg-teal-700"
          >
            {orchestratedNext.label}
          </Link>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto text-[11px] font-medium text-stone-500">
          <span
            aria-current="page"
            data-dock-mode="learn"
            className={
              active === "learn" ? "text-stone-900" : "hover:text-stone-700"
            }
          >
            Studio
          </span>
          <span aria-hidden className="text-stone-300">
            ·
          </span>
          <Link
            href={practiceHref}
            data-dock-mode="practice"
            className="min-h-10 inline-flex items-center touch-manipulation hover:text-stone-800"
          >
            Practice
          </Link>
          <Link
            href={checkHref}
            data-dock-mode="check"
            className="min-h-10 inline-flex items-center touch-manipulation hover:text-stone-800"
          >
            Check
          </Link>
          <Link
            href={rememberHref}
            data-dock-mode="remember"
            className="min-h-10 inline-flex items-center touch-manipulation hover:text-stone-800"
          >
            Remember
          </Link>
          {onCurriculum ? (
            <button
              type="button"
              data-dock-mode="curriculum"
              onClick={onCurriculum}
              className="min-h-10 inline-flex items-center touch-manipulation hover:text-stone-800 lg:hidden"
            >
              Journey
            </button>
          ) : null}
        </div>
        <button
          type="button"
          data-dock-mode="tutor"
          onClick={onTutor}
          className={`inline-flex min-h-10 items-center gap-1.5 px-2 text-xs font-semibold touch-manipulation ${
            tutorOpen || active === "tutor"
              ? "text-teal-900"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          Tutor
        </button>
      </div>
    </nav>
  );
}
