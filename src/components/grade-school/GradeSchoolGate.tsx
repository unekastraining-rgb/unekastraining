"use client";

import Link from "next/link";
import { GraduationCap, Sparkles } from "lucide-react";

import { useTheme } from "@/lib/theme/ThemeProvider";

export function GradeSchoolGate({
  children,
  compact = false,
}: {
  children?: React.ReactNode;
  compact?: boolean;
}) {
  const { settings, updateSettings } = useTheme();

  if (settings.elementaryMode) {
    return children ? <>{children}</> : null;
  }

  if (compact) {
    return (
      <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
        Turn on{" "}
        <button
          type="button"
          onClick={() => void updateSettings({ elementaryMode: true })}
          className="font-bold underline hover:text-teal-700"
        >
          Grade school planner
        </button>{" "}
        in Settings to build classes by grade &amp; subject.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-teal-300 bg-gradient-to-br from-teal-50 to-white px-8 py-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
        <GraduationCap className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-stone-900">Grade school planner is off</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-600">
        Turn this on to build growth plans from a learner profile — grade, subjects, and
        struggles — with guided lessons in the browser. No syllabus required.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void updateSettings({ elementaryMode: true })}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-500"
        >
          <Sparkles className="h-4 w-4" />
          Turn on grade school planner
        </button>
        <Link
          href="/dashboard"
          className="inline-flex rounded-xl border border-teal-200 bg-white px-6 py-3 text-sm font-semibold text-stone-700 hover:bg-teal-50"
        >
          Open hub settings
        </Link>
      </div>
    </div>
  );
}
