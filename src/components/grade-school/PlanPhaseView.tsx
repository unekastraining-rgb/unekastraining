import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import {
  ACTIVITY_EMOJI,
  ACTIVITY_LABELS,
  learningStepHref,
} from "@/lib/grade-school/learning-plan";
import { phaseProgress, resolvePlanPhases } from "@/lib/grade-school/plan-utils";
import type { GeneratedCurriculum } from "@/lib/syllabus/types";

export function PlanPhaseView({
  courseId,
  curriculum,
  completedSteps = [],
  preview = false,
}: {
  courseId: string;
  curriculum: GeneratedCurriculum;
  completedSteps?: number[];
  preview?: boolean;
}) {
  const phases = resolvePlanPhases(curriculum.learningSteps, curriculum.planPhases);

  return (
    <div className="space-y-6">
      {phases.map((phase) => {
        const progress = phaseProgress(phase, completedSteps);
        return (
          <section
            key={`${phase.weekNumber}-${phase.title}`}
            className="rounded-2xl border border-orange-100 bg-orange-50/30 p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                  Week {phase.weekNumber}
                </p>
                <h4 className="text-lg font-bold text-stone-900">{phase.title}</h4>
                {phase.focus ? (
                  <p className="mt-1 text-sm text-stone-600">{phase.focus}</p>
                ) : null}
              </div>
              <p className="text-xs font-bold text-teal-700">
                {progress.done}/{progress.total} done
              </p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-teal-100">
              <div
                className="h-full rounded-full bg-teal-500 transition-all"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {phase.stepIndices.map((index) => {
                const step = curriculum.learningSteps[index];
                if (!step) return null;
                const complete = completedSteps.includes(index);
                const cardClass = `group rounded-2xl border p-4 transition ${
                  complete
                    ? "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300"
                    : "border-white bg-white hover:border-teal-200 hover:bg-teal-50/60"
                }`;
                const inner = (
                  <div className="flex items-start gap-3">
                    <span aria-hidden>
                      {complete ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      ) : (
                        <span className="text-2xl">
                          {ACTIVITY_EMOJI[step.activityType] ?? "📖"}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                        {step.skillTrack ?? step.skillFocus} · {step.durationMinutes} min
                      </p>
                      <p className="font-bold text-stone-900">{step.title}</p>
                      <p className="mt-1 text-sm text-stone-600">{step.goal}</p>
                      {!preview ? (
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal-700 group-hover:text-teal-800">
                          {ACTIVITY_LABELS[step.activityType]}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </div>
                  </div>
                );

                if (preview) {
                  return (
                    <div key={`${step.title}-${index}`} className={cardClass}>
                      {inner}
                    </div>
                  );
                }

                return (
                  <Link
                    key={`${step.title}-${index}`}
                    href={learningStepHref(courseId, index)}
                    className={cardClass}
                  >
                    {inner}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
