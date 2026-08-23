"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";

import { SubjectInteractive } from "@/components/grade-school/SubjectInteractive";
import type { InteractiveLesson } from "@/lib/grade-school/generate-lesson";
import { subjectEmoji, subjectLabel } from "@/lib/grade-school/subjects";
import type { GeneratedCurriculum } from "@/lib/syllabus/types";

function GradeSchoolLessonContent({
  courseId,
  initialStep,
}: {
  courseId: string;
  initialStep: number;
}) {
  const router = useRouter();
  const [curriculum, setCurriculum] = useState<GeneratedCurriculum | null>(null);
  const [lesson, setLesson] = useState<InteractiveLesson | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepIndex, setStepIndex] = useState(initialStep);
  const [screenIndex, setScreenIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeResult, setCompleteResult] = useState<{
    flashcardCount: number;
    flashcardsHref: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const learningStep = curriculum?.learningSteps[stepIndex] ?? null;

  useEffect(() => {
    setLoadingPlan(true);
    setError(null);
    Promise.all([
      fetch(`/api/courses/${courseId}/learning-plan`).then((r) => r.json()),
      fetch(`/api/grade-school/progress?courseId=${encodeURIComponent(courseId)}`).then(
        (r) => r.json(),
      ),
    ])
      .then(([planData, progressData]) => {
        if (!planData.success) throw new Error(planData.error ?? "Could not load plan.");
        setCurriculum(planData.curriculum);
        if (progressData.success) {
          setCompletedSteps(
            progressData.progress.map((p: { stepIndex: number }) => p.stepIndex),
          );
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load plan.");
      })
      .finally(() => setLoadingPlan(false));
  }, [courseId]);

  useEffect(() => {
    if (!learningStep) return;

    setLoadingLesson(true);
    setLesson(null);
    setScreenIndex(0);
    setResponse("");
    setCompleteResult(null);
    setError(null);

    void fetch("/api/study/grade-school/lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, stepIndex }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error ?? "Could not load lesson.");
        setLesson(data.lesson);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load lesson.");
      })
      .finally(() => setLoadingLesson(false));
  }, [courseId, stepIndex, learningStep]);

  async function finishLesson() {
    if (!lesson || !learningStep) return;
    setCompleting(true);
    setError(null);
    try {
      const res = await fetch("/api/grade-school/complete-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          stepIndex,
          lessonTitle: learningStep.title,
          lesson,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Could not save progress.");
      setCompleteResult({
        flashcardCount: data.flashcardCount,
        flashcardsHref: data.flashcardsHref,
      });
      setCompletedSteps((prev) =>
        prev.includes(stepIndex) ? prev : [...prev, stepIndex],
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete lesson.");
    } finally {
      setCompleting(false);
    }
  }

  if (loadingPlan) {
    return (
      <p className="flex items-center gap-2 text-sm text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your learning plan…
      </p>
    );
  }

  if (!curriculum || !learningStep) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {error ?? "This learning step was not found."}
      </div>
    );
  }

  const screens = lesson?.steps ?? [];
  const current = screens[screenIndex];
  const isLastScreen = screenIndex >= screens.length - 1;
  const hasNextStep = stepIndex < curriculum.learningSteps.length - 1;
  const totalSteps = curriculum.learningSteps.length;
  const doneCount = completedSteps.length;
  const subjectKind = lesson?.subjectKind ?? "general";

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">
            {subjectEmoji(subjectKind)} {subjectLabel(subjectKind)} · Step {stepIndex + 1} of{" "}
            {totalSteps}
          </p>
          <p className="text-xs font-bold text-teal-800">
            {doneCount}/{totalSteps} complete
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-teal-100">
          <div
            className="h-full rounded-full bg-teal-500"
            style={{ width: `${totalSteps ? (doneCount / totalSteps) * 100 : 0}%` }}
          />
        </div>
        <h1 className="mt-3 text-3xl font-black text-stone-900">{learningStep.title}</h1>
        <p className="mt-2 text-stone-600">{learningStep.goal}</p>
        {completedSteps.includes(stepIndex) ? (
          <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            You already finished this lesson — review or continue below
          </p>
        ) : null}
        {learningStep.parentTip ? (
          <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm text-teal-900">
            <span className="font-semibold">Parent tip:</span> {learningStep.parentTip}
          </p>
        ) : null}
      </div>

      {loadingLesson ? (
        <p className="flex items-center gap-2 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Building your guided lesson…
        </p>
      ) : null}

      {error && !loadingLesson ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {lesson && current ? (
        <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          {screenIndex === 0 ? (
            <p className="mb-4 text-lg font-medium text-stone-800">{lesson.greeting}</p>
          ) : null}

          <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
            Part {screenIndex + 1} of {screens.length}
          </p>
          <h2 className="mt-1 text-xl font-bold text-stone-900">{current.title}</h2>
          <p className="mt-3 leading-relaxed text-stone-700">{current.instruction}</p>

          {current.example ? (
            <div className="mt-4 rounded-2xl bg-orange-50 px-4 py-3 text-sm text-stone-700">
              <p className="font-semibold text-orange-800">Example</p>
              <p className="mt-1">{current.example}</p>
            </div>
          ) : null}

          {current.widget ? (
            <SubjectInteractive
              widget={current.widget}
              gradeLevel={curriculum.gradeLevel}
              subject={curriculum.subject}
            />
          ) : null}

          {current.prompt && !current.widget ? (
            <div className="mt-5">
              <label className="text-sm font-semibold text-stone-700">Your turn</label>
              <textarea
                value={response}
                onChange={(event) => setResponse(event.target.value)}
                placeholder={current.prompt}
                rows={4}
                className="mt-2 w-full rounded-xl border border-orange-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-300"
              />
              {current.hint ? (
                <p className="mt-2 text-xs text-stone-500">
                  <span className="font-semibold">Hint:</span> {current.hint}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={screenIndex === 0}
              onClick={() => setScreenIndex((value) => Math.max(0, value - 1))}
              className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-orange-50 disabled:opacity-40"
            >
              Back
            </button>

            {!isLastScreen ? (
              <button
                type="button"
                onClick={() => setScreenIndex((value) => value + 1)}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white hover:bg-teal-500"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex w-full flex-col gap-3">
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  {lesson.encouragement}
                </p>

                {completeResult ? (
                  <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
                    <p className="font-semibold">
                      {completeResult.flashcardCount} flashcards saved for review!
                    </p>
                    <Link
                      href={completeResult.flashcardsHref}
                      className="mt-2 inline-block font-bold text-violet-700 underline"
                    >
                      Practice flashcards now
                    </Link>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={completing}
                    onClick={() => void finishLesson()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-60"
                  >
                    {completing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Finish &amp; save flashcards
                  </button>
                )}

                {hasNextStep ? (
                  <button
                    type="button"
                    onClick={() => {
                      const next = stepIndex + 1;
                      setStepIndex(next);
                      router.replace(
                        `/study/grade-school?courseId=${encodeURIComponent(courseId)}&step=${next}`,
                      );
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-sm font-bold text-white hover:bg-orange-600"
                  >
                    Next activity
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <Link
                    href="/dashboard/parent"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-5 py-2 text-sm font-bold text-teal-800 hover:bg-teal-100"
                  >
                    View parent dashboard
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function GradeSchoolLessonView() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") ?? "";
  const step = Number.parseInt(searchParams.get("step") ?? "0", 10);

  if (!courseId) {
    return (
      <p className="text-sm text-stone-600">
        Pick a learning activity from your{" "}
        <Link href="/dashboard" className="font-semibold text-teal-700 underline">
          grade school hub
        </Link>
        .
      </p>
    );
  }

  return (
    <Suspense fallback={<p className="text-sm text-stone-500">Loading lesson…</p>}>
      <GradeSchoolLessonContent courseId={courseId} initialStep={Number.isNaN(step) ? 0 : step} />
    </Suspense>
  );
}
