"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";

import { PlanPhaseView } from "@/components/grade-school/PlanPhaseView";
import { ReplanGrowthPlan } from "@/components/grade-school/ReplanGrowthPlan";
import { learningStepHref } from "@/lib/grade-school/learning-plan";
import { domainEmoji } from "@/lib/grade-school/plan-utils";
import { subjectEmoji, detectSubjectKind } from "@/lib/grade-school/subjects";
import type { HubGradeSchoolPlan } from "@/components/hub/types";

export function GradeSchoolLearningPlan({
  plans,
}: {
  plans: HubGradeSchoolPlan[];
}) {
  if (plans.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-teal-300 bg-gradient-to-br from-teal-50 to-white px-6 py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
          <BookOpen className="h-7 w-7" />
        </div>
        <h3 className="text-xl font-bold text-stone-900">Build a learner growth plan</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
          No syllabus needed — describe the learner and we&apos;ll scope skill tracks and a
          multi-week plan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600">Track progress and flashcards in one place.</p>
        <Link
          href="/dashboard/parent"
          className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800 hover:bg-teal-100"
        >
          Parent dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {plans.map((plan) => {
        const total = plan.curriculum.learningSteps.length;
        const done = plan.completedSteps?.length ?? 0;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const subjectKind = detectSubjectKind(plan.curriculum.subject);
        const nextIndex = plan.curriculum.learningSteps.findIndex(
          (_, i) => !plan.completedSteps?.includes(i),
        );

        return (
        <div
          key={plan.courseId}
          className="rounded-3xl border border-teal-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">
                {subjectEmoji(subjectKind)} Learning plan · {done}/{total} done
              </p>
              <h3 className="mt-1 text-2xl font-black text-stone-900">
                {plan.curriculum.courseName}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
                {plan.curriculum.summary}
              </p>
              {plan.curriculum.learnerSummary ? (
                <p className="mt-2 text-sm font-medium text-teal-800">
                  {plan.curriculum.learnerSummary}
                </p>
              ) : plan.curriculum.strugglingWith ? (
                <p className="mt-2 text-sm font-medium text-teal-800">
                  Building skills across: {plan.curriculum.strugglingWith.slice(0, 200)}
                  {plan.curriculum.strugglingWith.length > 200 ? "…" : ""}
                </p>
              ) : null}
            </div>
            <Link
              href={
                nextIndex >= 0
                  ? learningStepHref(plan.courseId, nextIndex)
                  : `/study/grade-school?courseId=${encodeURIComponent(plan.courseId)}&step=0`
              }
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-teal-500"
            >
              <Sparkles className="h-4 w-4" />
              {nextIndex >= 0 ? "Continue learning" : "Start first lesson"}
            </Link>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-teal-100">
            <div
              className="h-full rounded-full bg-teal-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>

          {(plan.flashcardCount ?? 0) > 0 ? (
            <p className="mt-2 text-xs font-semibold text-violet-700">
              {plan.flashcardCount} flashcards ready to review
            </p>
          ) : null}

          {plan.curriculum.skillTracks && plan.curriculum.skillTracks.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {plan.curriculum.skillTracks.map((track) => (
                <span
                  key={track.name}
                  className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800"
                  title={track.description}
                >
                  {domainEmoji(track.domain)} {track.name}
                </span>
              ))}
            </div>
          ) : null}

          <ReplanGrowthPlan
            courseId={plan.courseId}
            curriculum={plan.curriculum}
            completedSteps={plan.completedSteps ?? []}
          />

          <div className="mt-6">
            <PlanPhaseView
              courseId={plan.courseId}
              curriculum={plan.curriculum}
              completedSteps={plan.completedSteps ?? []}
            />
          </div>

          {plan.curriculum.studyTips.length > 0 ? (
            <div className="mt-5 rounded-2xl bg-teal-50 px-4 py-3 text-sm text-teal-900">
              <p className="font-semibold">Tips for today</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {plan.curriculum.studyTips.slice(0, 3).map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        );
      })}
    </div>
  );
}
