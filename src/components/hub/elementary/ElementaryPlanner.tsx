"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { learningStepHref } from "@/lib/grade-school/learning-plan";
import { ELEMENTARY_TECHNIQUES, getRecommendedSessions } from "@/lib/elementary/study-tips";

import type { HubGradeSchoolPlan } from "@/components/hub/types";

export function ElementaryPlanner({ plans = [] }: { plans?: HubGradeSchoolPlan[] }) {
  const sessions = getRecommendedSessions();
  const nextPlan = plans[0];
  const nextStep = nextPlan?.curriculum.learningSteps[0];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-600">
          Grade school planner
        </p>
        <h3 className="mt-2 text-2xl font-black text-stone-900">
          Your fun study plan for today
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          Short guided lessons that build real skills — not busywork.
        </p>
        {nextPlan && nextStep ? (
          <Link
            href={learningStepHref(nextPlan.courseId, 0)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-500"
          >
            Start: {nextStep.title}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {sessions.map((session) => (
          <Link
            key={session.id}
            href={
              nextPlan
                ? learningStepHref(nextPlan.courseId, 0)
                : session.href
            }
            className="group rounded-3xl border border-brand bg-white p-5 shadow-sm transition hover:border-brand hover:shadow-md"
          >
            <div className="text-3xl">{session.emoji}</div>
            <h4 className="mt-3 text-lg font-bold text-stone-900">{session.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              {session.description}
            </p>
            <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-500">
              <span>{session.timeOfDay}</span>
              <span className="inline-flex items-center gap-1 text-teal-700 group-hover:text-teal-800">
                {session.durationMinutes} min
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div>
        <h4 className="mb-4 text-lg font-bold text-stone-900">Study techniques to try</h4>
        <div className="grid gap-3 md:grid-cols-2">
          {ELEMENTARY_TECHNIQUES.map((technique) => (
            <TechniqueCard
              key={technique.id}
              technique={technique}
              href={
                nextPlan ? learningStepHref(nextPlan.courseId, 0) : technique.href
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TechniqueCard({
  technique,
  href,
}: {
  technique: (typeof ELEMENTARY_TECHNIQUES)[number];
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-brand bg-white p-4 transition hover:border-brand">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{technique.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-stone-900">{technique.title}</p>
          <p className="mt-1 text-sm text-stone-600">{technique.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href={href}
              className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700"
            >
              Try it
              <ArrowRight className="h-3 w-3" />
            </Link>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              {technique.durationMinutes} min
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
