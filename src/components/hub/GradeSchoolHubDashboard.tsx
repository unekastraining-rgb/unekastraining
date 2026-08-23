"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles, Trophy, Users } from "lucide-react";

import { AiCourseBuilder } from "@/components/courses/AiCourseBuilder";
import { learningStepHref } from "@/lib/grade-school/learning-plan";
import { subjectEmoji, detectSubjectKind } from "@/lib/grade-school/subjects";
import type { HubGradeSchoolPlan } from "./types";
import type { HubTelemetrySnapshot } from "@/lib/csl/study-sessions";

export function GradeSchoolHubDashboard({
  plans,
  telemetry,
  onPlanSaved,
}: {
  plans: HubGradeSchoolPlan[];
  telemetry: HubTelemetrySnapshot;
  onPlanSaved: () => void;
}) {
  const primaryPlan = plans[0] ?? null;
  const totalLessons = plans.reduce(
    (sum, plan) => sum + plan.curriculum.learningSteps.length,
    0,
  );
  const completedLessons = plans.reduce(
    (sum, plan) => sum + (plan.completedSteps?.length ?? 0),
    0,
  );
  const overallPct =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const nextLesson =
    primaryPlan &&
    primaryPlan.curriculum.learningSteps.findIndex(
      (_, index) => !primaryPlan.completedSteps?.includes(index),
    );

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">
          Grade school hub
        </p>
        <h1 className="mt-1 text-3xl font-black text-stone-900">Learning dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Parent view on the left, learner view on the right — progress, next lesson,
          and growth plans in one place.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col rounded-3xl border border-teal-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-teal-700">
            <Users className="h-5 w-5" />
            <h2 className="text-lg font-bold text-stone-900">Parent view</h2>
          </div>
          <p className="mt-2 text-sm text-stone-600">
            Track plans, lesson completion, and study time at a glance.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-teal-50 px-4 py-3">
              <p className="text-2xl font-black text-teal-800">{plans.length}</p>
              <p className="text-xs font-semibold text-stone-500">Active plans</p>
            </div>
            <div className="rounded-xl bg-teal-50 px-4 py-3">
              <p className="text-2xl font-black text-teal-800">
                {telemetry.weekTotalMinutes}m
              </p>
              <p className="text-xs font-semibold text-stone-500">This week</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-stone-700">Overall progress</span>
              <span className="font-bold text-teal-700">
                {completedLessons}/{totalLessons} lessons
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-brand-soft">
              <div
                className="h-full rounded-full bg-teal-500 transition-all"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>

          {plans.length > 0 ? (
            <ul className="mt-5 flex-1 space-y-2">
              {plans.map((plan) => {
                const total = plan.curriculum.learningSteps.length;
                const done = plan.completedSteps?.length ?? 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const subjectKind = detectSubjectKind(plan.curriculum.subject);

                return (
                  <li
                    key={plan.courseId}
                    className="rounded-xl border border-teal-100 bg-teal-50/40 px-4 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-stone-900">
                        {subjectEmoji(subjectKind)} {plan.courseTitle}
                      </p>
                      <span className="font-bold text-teal-700">{pct}%</span>
                    </div>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {done}/{total} lessons · {plan.flashcardCount ?? 0} flashcards
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-5 flex-1 rounded-xl border border-dashed border-teal-200 px-4 py-6 text-center text-sm text-stone-500">
              No growth plans yet. Build one below.
            </p>
          )}

          <Link
            href="/dashboard/parent"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-teal-300 bg-teal-50 px-4 py-2.5 text-sm font-bold text-teal-800 hover:bg-teal-100"
          >
            Open full parent dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="flex flex-col rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-violet-700">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-lg font-bold text-stone-900">Learner view</h2>
          </div>
          <p className="mt-2 text-sm text-stone-600">
            Pick up where you left off — guided lessons, not homework lists.
          </p>

          {primaryPlan && typeof nextLesson === "number" && nextLesson >= 0 ? (
            <div className="mt-5 flex-1 rounded-2xl border border-violet-100 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                Up next
              </p>
              <h3 className="mt-2 text-xl font-black text-stone-900">
                {primaryPlan.curriculum.learningSteps[nextLesson]?.title}
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                {primaryPlan.curriculum.learningSteps[nextLesson]?.goal}
              </p>
              <Link
                href={learningStepHref(primaryPlan.courseId, nextLesson)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-500"
              >
                <BookOpen className="h-4 w-4" />
                Start lesson {nextLesson + 1}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : primaryPlan ? (
            <div className="mt-5 flex-1 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <Trophy className="mx-auto h-10 w-10 text-emerald-600" />
              <p className="mt-3 font-bold text-stone-900">Plan complete!</p>
              <p className="mt-1 text-sm text-stone-600">
                Review flashcards or replan for the next growth phase.
              </p>
              <Link
                href={`/flashcards?courseId=${encodeURIComponent(primaryPlan.courseId)}`}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500"
              >
                Review flashcards
              </Link>
            </div>
          ) : (
            <div className="mt-5 flex-1 rounded-2xl border border-dashed border-violet-200 px-4 py-10 text-center text-sm text-stone-500">
              Build a growth plan to see your next lesson here.
            </div>
          )}

          {plans.length > 1 ? (
            <ul className="mt-4 space-y-2 text-sm">
              {plans.slice(1, 3).map((plan) => {
                const next = plan.curriculum.learningSteps.findIndex(
                  (_, i) => !plan.completedSteps?.includes(i),
                );
                if (next < 0) return null;
                return (
                  <li key={plan.courseId}>
                    <Link
                      href={learningStepHref(plan.courseId, next)}
                      className="block rounded-xl border border-violet-100 bg-white px-4 py-3 font-semibold text-violet-800 hover:bg-violet-50"
                    >
                      Continue {plan.courseTitle}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      </div>

      <AiCourseBuilder onSaved={onPlanSaved} onError={() => {}} />
    </div>
  );
}
