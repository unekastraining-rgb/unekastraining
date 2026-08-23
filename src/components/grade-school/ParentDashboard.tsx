"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Layers, Sparkles, Trophy } from "lucide-react";

import {
  ACTIVITY_EMOJI,
  ACTIVITY_LABELS,
  learningStepHref,
} from "@/lib/grade-school/learning-plan";
import { subjectEmoji, subjectLabel, detectSubjectKind } from "@/lib/grade-school/subjects";
import { ReplanGrowthPlan } from "@/components/grade-school/ReplanGrowthPlan";
import type { HubGradeSchoolPlan } from "@/components/hub/types";

export interface ParentDashboardData {
  plans: HubGradeSchoolPlan[];
  progressByCourse: Record<
    string,
    { completedSteps: number[]; flashcards: number }
  >;
  totalMinutesThisWeek: number;
}

export function ParentDashboard({
  data,
}: {
  data: ParentDashboardData;
}) {
  const { plans, progressByCourse, totalMinutesThisWeek } = data;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">
          Parent dashboard
        </p>
        <h1 className="mt-2 text-3xl font-black text-stone-900">Learning at a glance</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Track guided lesson progress, flashcards created, and what to work on next.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
            <p className="font-bold text-stone-900">{plans.length}</p>
            <p className="text-stone-500">Active plans</p>
          </div>
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
            <p className="font-bold text-stone-900">{totalMinutesThisWeek} min</p>
            <p className="text-stone-500">This week</p>
          </div>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-teal-300 px-6 py-10 text-center text-sm text-stone-600">
          No learning plans yet.{" "}
          <Link href="/dashboard" className="font-semibold text-teal-700 underline">
            Build one on the hub
          </Link>
          .
        </div>
      ) : (
        plans.map((plan) => {
          const progress = progressByCourse[plan.courseId] ?? {
            completedSteps: [],
            flashcards: 0,
          };
          const total = plan.curriculum.learningSteps.length;
          const done = progress.completedSteps.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const subjectKind = detectSubjectKind(plan.curriculum.subject);
          const nextIndex = plan.curriculum.learningSteps.findIndex(
            (_, i) => !progress.completedSteps.includes(i),
          );

          return (
            <div
              key={plan.courseId}
              className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                    {subjectEmoji(subjectKind)} {subjectLabel(subjectKind)} ·{" "}
                    {plan.curriculum.gradeLevel}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-stone-900">
                    {plan.curriculum.courseName}
                  </h2>
                  {plan.curriculum.strugglingWith ? (
                    <p className="mt-1 text-sm text-teal-800">
                      Focus: {plan.curriculum.strugglingWith}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-teal-700">
                    {done}/{total}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    lessons done
                  </p>
                </div>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-orange-100">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 font-semibold text-violet-800">
                  <Layers className="h-3.5 w-3.5" />
                  {progress.flashcards} flashcards saved
                </span>
                {done === total && total > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-800">
                    <Trophy className="h-3.5 w-3.5" />
                    Plan complete!
                  </span>
                ) : null}
              </div>

              <ReplanGrowthPlan
                courseId={plan.courseId}
                curriculum={plan.curriculum}
                completedSteps={progress.completedSteps}
              />

              <div className="mt-6 space-y-2">
                {plan.curriculum.learningSteps.map((step, index) => {
                  const complete = progress.completedSteps.includes(index);
                  return (
                    <div
                      key={`${step.title}-${index}`}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                        complete
                          ? "border-emerald-200 bg-emerald-50/60"
                          : "border-stone-200 bg-stone-50/50"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span>{ACTIVITY_EMOJI[step.activityType]}</span>
                        <div>
                          <p className="font-semibold text-stone-900">
                            {complete ? "✓ " : ""}
                            {step.title}
                          </p>
                          <p className="text-xs text-stone-500">
                            {ACTIVITY_LABELS[step.activityType]} · {step.durationMinutes} min
                          </p>
                        </div>
                      </div>
                      {!complete ? (
                        <Link
                          href={learningStepHref(plan.courseId, index)}
                          className="shrink-0 font-semibold text-teal-700 hover:underline"
                        >
                          Start
                        </Link>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {nextIndex >= 0 ? (
                <Link
                  href={learningStepHref(plan.courseId, nextIndex)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-500"
                >
                  <Sparkles className="h-4 w-4" />
                  Continue lesson {nextIndex + 1}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href={`/flashcards?courseId=${encodeURIComponent(plan.courseId)}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
                >
                  <BookOpen className="h-4 w-4" />
                  Review flashcards
                </Link>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
