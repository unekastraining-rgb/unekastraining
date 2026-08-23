"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, Loader2, Play, Sparkles } from "lucide-react";

import { GradeSchoolLearningPlan } from "@/components/grade-school/GradeSchoolLearningPlan";
import type { HubGradeSchoolPlan } from "@/components/hub/types";
import { SixRecommendationsPanel } from "@/components/study/SixRecommendationsPanel";
import { saveStudySession } from "@/components/study/StudySessionRunner";

import { LUCKY_ACTIVITIES, LUCKY_PROCESS } from "@/lib/csl/lucky";
import { SIX_ACTIVITIES } from "@/lib/csl/six";
import { sixGuideHref } from "@/lib/csl/six-guides";
import type { StudyBlock, StudyMinutes, StudyNowTopicPick } from "@/lib/csl/study-now";

const TIME_OPTIONS: StudyMinutes[] = [5, 10, 20, 30, 45, 60];

export function StudyHubView({
  courses,
  elementaryMode = false,
  gradeSchoolPlans = [],
}: {
  courses: Array<{ id: string; title: string }>;
  elementaryMode?: boolean;
  gradeSchoolPlans?: Array<
    Pick<HubGradeSchoolPlan, "courseId" | "courseTitle" | "curriculum"> & {
      courseColor?: string | null;
    }
  >;
}) {
  return (
    <Suspense fallback={<div className="px-6 py-10 text-sm text-stone-500">Loading study hub…</div>}>
      <StudyHubViewContent
        courses={courses}
        elementaryMode={elementaryMode}
        gradeSchoolPlans={gradeSchoolPlans.map((plan) => ({
          ...plan,
          courseColor: plan.courseColor ?? null,
        }))}
      />
    </Suspense>
  );
}

function StudyHubViewContent({
  courses,
  elementaryMode,
  gradeSchoolPlans,
}: {
  courses: Array<{ id: string; title: string }>;
  elementaryMode: boolean;
  gradeSchoolPlans: HubGradeSchoolPlan[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id ?? "");
  const [minutes, setMinutes] = useState<StudyMinutes>(30);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<{
    summary: string;
    totalMinutes: StudyMinutes;
    blocks: StudyBlock[];
    focusTopics?: StudyNowTopicPick[];
    context: {
      missedQuestions: number;
      dueFlashcards: number;
      weakTopics: number;
    };
  } | null>(null);

  useEffect(() => {
    const courseId = searchParams.get("courseId");
    if (courseId && courses.some((course) => course.id === courseId)) {
      setSelectedCourseId(courseId);
    }
  }, [searchParams, courses]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId],
  );

  function startSession() {
    if (!plan) return;
    saveStudySession({
      summary: plan.summary,
      totalMinutes: plan.totalMinutes,
      blocks: plan.blocks,
      context: plan.context,
    });
    router.push("/study/session");
  }

  async function buildPlan() {
    setLoading(true);
    try {
      const response = await fetch("/api/study-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minutes,
          ...(selectedCourseId ? { courseId: selectedCourseId } : {}),
        }),
      });
      const data = await response.json();
      if (data.success) setPlan(data.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hub-shell space-y-10 py-6 lg:py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
          {elementaryMode ? "Grade school study" : "CSL Learning System"}
        </p>
        <h1 className="mt-1 text-3xl font-black text-stone-900">Study Hub</h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          {elementaryMode ? (
            "Guided lessons that build skills step by step — like a tutor in the browser."
          ) : (
            <>
              <strong>Core</strong> organizes it. <strong>Six</strong> teaches you to understand it.{" "}
              <strong>Lucky</strong> makes you retain it. AI recommends — you decide.
            </>
          )}
        </p>
      </div>

      {elementaryMode ? (
        <>
          <GradeSchoolLearningPlan plans={gradeSchoolPlans} />
          <section className="rounded-3xl border border-teal-200 bg-teal-50/50 p-6">
            <h2 className="text-lg font-bold text-stone-900">Explain it back</h2>
            <p className="mt-2 text-sm text-stone-600">
              After a guided lesson, practice teaching what you learned in your own words.
            </p>
            <Link
              href="/study/teach-me"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-500"
            >
              Open teach-me practice
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </>
      ) : (
        <>
      <section className="card-soft p-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-brand" />
          <h2 className="text-xl font-bold text-stone-900">Study Now</h2>
        </div>
        <p className="mt-2 text-sm text-stone-600">
          {selectedCourse
            ? `How much time do you have for ${selectedCourse.title}? We'll recommend a focused session.`
            : "How much time do you have? We'll recommend a session — you can change any block."}
        </p>
        {courses.length > 0 ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-sm font-semibold text-stone-700" htmlFor="study-course">
              Class
            </label>
            <select
              id="study-course"
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
              className="max-w-md flex-1 rounded-xl border border-brand bg-white px-3 py-2 text-sm"
            >
              <option value="">All classes</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {TIME_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMinutes(option)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                minutes === option
                  ? "btn-primary text-white"
                  : "border border-brand bg-white text-stone-700"
              }`}
            >
              {option === 60 ? "60+ min" : `${option} min`}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void buildPlan()}
          disabled={loading}
          className="btn-primary mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Build my session
        </button>

        {plan ? (
          <div className="mt-6 space-y-3 rounded-2xl border border-brand bg-white p-5">
            <p className="font-semibold text-stone-900">{plan.summary}</p>
            {plan.focusTopics && plan.focusTopics.length > 0 ? (
              <p className="text-sm text-brand-muted" style={{ color: "var(--sh-accent)" }}>
                Mastery focus:{" "}
                {plan.focusTopics
                  .map((topic) => `${topic.topicName} (${topic.proficiency}%)`)
                  .join(" · ")}
              </p>
            ) : null}
            {plan.blocks.map((block, index) => (
              <div
                key={`${block.id}-${index}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-brand bg-brand-soft/40 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-stone-900">{block.label}</p>
                  {block.subtitle ? (
                    <p className="text-xs" style={{ color: "var(--sh-accent)" }}>{block.subtitle}</p>
                  ) : null}
                  <p className="text-xs text-stone-500">{block.minutes} minutes</p>
                </div>
                {block.href ? (
                  <Link
                    href={block.href}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
                  >
                    Start <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            ))}
            <p className="text-xs text-stone-500">
              {plan.context.missedQuestions} missed · {plan.context.dueFlashcards} cards due ·{" "}
              {plan.context.weakTopics} weak topics
            </p>
            <button
              type="button"
              onClick={startSession}
              className="btn-accent mt-4 inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm"
            >
              <Play className="h-4 w-4" />
              Start guided session
            </button>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-600">Core · Organize</p>
            <h2 className="text-xl font-bold text-stone-900">Intelligent note-taking</h2>
            <p className="mt-1 text-sm text-stone-600">
              Outline, Cornell, sketch, speak, and annotate course PDFs.
            </p>
          </div>
          <Link
            href={selectedCourseId ? `/core?courseId=${selectedCourseId}` : "/core"}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500"
          >
            Open Core Notes
          </Link>
        </div>
      </section>

      <SixRecommendationsPanel courseId={selectedCourseId || undefined} />

      <section className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-600">Six · Understand</p>
          <h2 className="text-xl font-bold text-stone-900">Six Technique</h2>
          <p className="mt-1 text-sm text-stone-600">
            Chunking, explanation, Feynman, visualization, hands-on practice, and active recall.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {SIX_ACTIVITIES.map((activity) => (
            <Link
              key={activity.id}
              href={sixGuideHref(activity.id)}
              className="card-interactive block p-5"
            >
              <div className="text-2xl">{activity.emoji}</div>
              <p className="mt-2 font-bold text-stone-900">{activity.title}</p>
              <p className="mt-1 text-sm text-stone-600">{activity.description}</p>
              <p className="mt-2 text-xs text-stone-500">Use when: {activity.whenToUse}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-teal-600">
                Start guided session →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Lucky · Retain</p>
            <h2 className="text-xl font-bold text-stone-900">Lucky Technique</h2>
            <p className="mt-1 text-sm text-stone-600">
              {LUCKY_PROCESS.join(" → ")}
            </p>
          </div>
          <Link
            href="/study/lucky"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            <Sparkles className="h-4 w-4" />
            Start Lucky Engine
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LUCKY_ACTIVITIES.map((activity) => (
            <Link
              key={activity.id}
              href={activity.href}
              className="card-interactive flex flex-col p-5"
            >
              <div className="text-2xl">{activity.emoji}</div>
              <p className="mt-2 font-bold text-stone-900">{activity.title}</p>
              <p className="mt-1 flex-1 text-sm text-stone-600">{activity.description}</p>
              <span className="mt-3 text-sm font-semibold text-violet-600">Open →</span>
            </Link>
          ))}
        </div>
      </section>
        </>
      )}
    </div>
  );
}
