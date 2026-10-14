"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ArrowRight, Loader2, Play } from "lucide-react";

import { GradeSchoolLearningPlan } from "@/components/grade-school/GradeSchoolLearningPlan";
import type { HubGradeSchoolPlan } from "@/components/hub/types";
import { AddCourseMaterialButton } from "@/components/materials/AddCourseMaterialModal";
import { LearnerGrowthContinuityStrip } from "@/components/study/LearnerGrowthContinuityStrip";
import { StudyHaulLearningCenter } from "@/components/study/StudyHaulLearningCenter";
import { StudyHubLearnerContext } from "@/components/study/StudyHubLearnerContext";
import { BetaFeedbackWidget } from "@/components/study/BetaFeedbackWidget";
import { TopicStudyHaul } from "@/components/study/TopicStudyHaul";
import { saveStudySession } from "@/components/study/StudySessionRunner";
import { useTapHandler } from "@/hooks/useTapHandler";
import type { LearnerGrowthHubTeaser } from "@/lib/learning/learner-growth";
import { hubTabPath } from "@/lib/hub/tabs";

import type { StudyBlock, StudyMinutes, StudyNowTopicPick } from "@/lib/csl/study-now";
import { readableCourseTitle } from "@/lib/courses/display-name";
import type { CourseLearningBucket } from "@/lib/study/course-learning-bucket";
import {
  coursesScanLandingHref,
  teachMeHref,
} from "@/lib/study/loop-hrefs";
import { resolveUrlCourseId } from "@/lib/study/resolve-url-course-id";
import { resolveLoopFocusTopic } from "@/lib/study/resolve-loop-focus-topic";

const TIME_OPTIONS: StudyMinutes[] = [5, 10, 20, 30, 45, 60];

type HubCourse = {
  id: string;
  title: string;
  focusTopic?: string | null;
  topics?: string[];
  learningBucket?: CourseLearningBucket;
};

export type UpcomingSchoolWorkItem = {
  id: string;
  title: string;
  dueDate: string | null;
  courseId: string;
  courseTitle: string;
  status: string;
  conceptId: string | null;
  alignmentState?: "confirmed" | "inferred" | "unaligned";
};

export function StudyHubView({
  courses,
  elementaryMode = false,
  gradeSchoolPlans = [],
  growthContinuityTeaser = null,
  upcomingSchoolWork = [],
}: {
  courses: HubCourse[];
  elementaryMode?: boolean;
  gradeSchoolPlans?: Array<
    Pick<HubGradeSchoolPlan, "courseId" | "courseTitle" | "curriculum"> & {
      courseColor?: string | null;
    }
  >;
  /** 2P-43 — SSR continuity teaser from the same Growth Center resolve. */
  growthContinuityTeaser?: LearnerGrowthHubTeaser | null;
  /** 2P-49 — upcoming school deadlines (logistics; learning CTAs reuse ContinueLearningButton). */
  upcomingSchoolWork?: UpcomingSchoolWorkItem[];
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
        growthContinuityTeaser={growthContinuityTeaser}
        upcomingSchoolWork={upcomingSchoolWork}
      />
    </Suspense>
  );
}

function StudyHubViewContent({
  courses,
  elementaryMode,
  gradeSchoolPlans,
  growthContinuityTeaser,
  upcomingSchoolWork,
}: {
  courses: HubCourse[];
  elementaryMode: boolean;
  gradeSchoolPlans: HubGradeSchoolPlan[];
  growthContinuityTeaser: LearnerGrowthHubTeaser | null;
  upcomingSchoolWork: UpcomingSchoolWorkItem[];
}) {
  // Schoolwork stays in courses/planner — intentionally not rendered on Study Haul.
  void upcomingSchoolWork;

  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCourseId = resolveUrlCourseId(
    searchParams.get("courseId"),
    courses.map((course) => course.id),
  );
  const urlTopic = searchParams.get("topic")?.trim() || null;
  const urlMaterialId = searchParams.get("materialId")?.trim() || null;
  const [topicPick, setTopicPick] = useState<{ courseId: string; topic: string } | null>(null);
  const [minutes, setMinutes] = useState<StudyMinutes>(30);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<{
    summary: string;
    totalMinutes: StudyMinutes;
    blocks: StudyBlock[];
    focusTopics?: StudyNowTopicPick[];
    courseId?: string | null;
    courseTitle?: string | null;
    context: {
      missedQuestions: number;
      dueFlashcards: number;
      weakTopics: number;
    };
  } | null>(null);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId],
  );

  // A topic picked for one class shouldn't leak into the next one.
  const topicChoice = topicPick?.courseId === selectedCourseId ? topicPick.topic : "";

  const coldStartTopic = useMemo(
    () => resolveLoopFocusTopic(topicChoice || urlTopic, selectedCourse?.topics ?? []),
    [topicChoice, urlTopic, selectedCourse?.topics],
  );

  function startSession() {
    if (!plan) return;
    const effectiveCourseId =
      plan.courseId?.trim() || selectedCourseId.trim() || null;
    const effectiveCourse =
      courses.find((course) => course.id === effectiveCourseId) ?? selectedCourse;
    saveStudySession({
      summary: plan.summary,
      totalMinutes: plan.totalMinutes,
      blocks: plan.blocks,
      context: plan.context,
      courseId: effectiveCourseId,
      courseTitle: plan.courseTitle ?? effectiveCourse?.title ?? null,
    });
    const query = new URLSearchParams({ minutes: String(plan.totalMinutes) });
    if (effectiveCourseId) query.set("courseId", effectiveCourseId);
    router.push(`/study/session?${query.toString()}`);
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
      if (data.success) {
        setPlan(data.data);
        if (typeof data.data.courseId === "string" && data.data.courseId.trim()) {
          selectCourse(data.data.courseId.trim());
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const tap5 = useTapHandler(() => setMinutes(5));
  const tap10 = useTapHandler(() => setMinutes(10));
  const tap20 = useTapHandler(() => setMinutes(20));
  const tap30 = useTapHandler(() => setMinutes(30));
  const tap45 = useTapHandler(() => setMinutes(45));
  const tap60 = useTapHandler(() => setMinutes(60));
  const minuteTaps: Record<StudyMinutes, ReturnType<typeof useTapHandler>> = {
    5: tap5,
    10: tap10,
    20: tap20,
    30: tap30,
    45: tap45,
    60: tap60,
  };
  const tapBuildPlan = useTapHandler(() => void buildPlan());
  const tapStartSession = useTapHandler(() => startSession());

  const courseTopics = selectedCourse?.topics ?? [];


  function selectCourse(courseId: string, topicOverride?: string) {
    const course = courses.find((c) => c.id === courseId);
    const nextTopic =
      topicOverride !== undefined
        ? topicOverride.trim()
        : course?.focusTopic?.trim() || course?.topics?.[0] || "";
    if (nextTopic) {
      setTopicPick({ courseId, topic: nextTopic });
    } else {
      setTopicPick(null);
    }
    // Shareable HOW context — clear portal so journey advances.
    const params = new URLSearchParams();
    if (courseId) params.set("courseId", courseId);
    if (nextTopic) params.set("topic", nextTopic);
    router.replace(params.toString() ? `/study?${params.toString()}` : "/study", {
      scroll: false,
    });
  }

  const sessionBuilder = (
    <section
      data-hub-chrome
      data-study-session-builder
      className="card-soft scroll-mt-24 p-5 sm:p-6 touch-manipulation"
    >
      <h2 className="text-xl font-bold text-stone-900">Start Studying</h2>
      <p className="mt-1 text-sm text-stone-600">
        {selectedCourse
          ? `Sitting down for a study session? Build a timed plan for ${readableCourseTitle(selectedCourse.title)}${
              coldStartTopic ? ` — starting with ${coldStartTopic}` : ""
            }. This is a session builder — not another home screen.`
          : "Sitting down for a study session? Choose what you're studying and how long you have — this builds a timed plan, not a second home screen."}
      </p>

      {courses.length > 0 ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              What you&apos;re studying
            </span>
            <select
              id="study-course"
              value={selectedCourseId}
              onChange={(event) => selectCourse(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-brand bg-white px-3 py-2 text-sm font-semibold text-stone-800"
            >
              <option value="">Pick a subject</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {readableCourseTitle(course.title)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Topic
            </span>
            <select
              id="study-topic"
              value={topicChoice}
              onChange={(event) =>
                setTopicPick({
                  courseId: selectedCourseId,
                  topic: event.target.value,
                })
              }
              disabled={courseTopics.length === 0}
              className="mt-1 min-h-11 w-full rounded-xl border border-brand bg-white px-3 py-2 text-sm font-semibold text-stone-800 disabled:bg-stone-50 disabled:text-stone-400"
            >
              <option value="">
                {!selectedCourseId
                  ? "Pick a class first"
                  : courseTopics.length === 0
                    ? "No topics yet"
                    : coldStartTopic
                      ? `Suggested — ${coldStartTopic}`
                      : "Suggested topic"}
              </option>
              {courseTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <Link
          href="/courses"
          className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand hover:underline touch-manipulation"
        >
          Add a class to get started <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      <div className="mt-5">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
          How long do you have?
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {TIME_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              {...minuteTaps[option]}
              className={`min-h-10 rounded-full px-4 py-2 text-sm font-semibold touch-manipulation ${
                minutes === option
                  ? "btn-primary text-white"
                  : "border border-brand bg-white text-stone-700"
              }`}
            >
              {option === 60 ? "60+ min" : `${option} min`}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        id="study-now"
        {...tapBuildPlan}
        disabled={loading}
        className="btn-primary mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 px-6 py-4 text-base font-bold disabled:opacity-60 touch-manipulation sm:text-lg"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Play className="h-5 w-5" />
        )}
        {loading ? "Building your session…" : `Study now · ${minutes} min`}
      </button>

      {plan ? (
        <div className="mt-6 space-y-3 rounded-2xl border border-brand bg-white p-5">
          <p className="font-semibold text-stone-900">{plan.summary}</p>
          {plan.focusTopics && plan.focusTopics.length > 0 ? (
            <p className="text-sm text-brand-muted" style={{ color: "var(--sh-accent)" }}>
              Topic progress focus:{" "}
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
                  data-hub-chrome
                  className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand hover:underline touch-manipulation"
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
            {...tapStartSession}
            className="btn-accent mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 px-5 py-3 text-sm font-bold touch-manipulation"
          >
            <Play className="h-4 w-4" />
            Start guided session
          </button>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-200/80 pt-4 text-xs text-stone-500">
        <span className="font-semibold text-stone-600">No topics yet?</span>
        <AddCourseMaterialButton
          courseId={selectedCourseId || null}
          courses={courses}
          label="Add course material"
          compact
          onAdded={() => router.refresh()}
        />
        <Link
          href={coursesScanLandingHref(selectedCourseId || null)}
          className="inline-flex min-h-9 items-center rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 font-semibold text-stone-700 hover:bg-stone-50 touch-manipulation"
        >
          Photo syllabus (OCR)
        </Link>
        <Link
          href={hubTabPath("settings")}
          className="inline-flex min-h-9 items-center rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 font-semibold text-stone-700 hover:bg-stone-50 touch-manipulation"
        >
          Sync Canvas / LMS
        </Link>
      </div>
    </section>
  );

  return (
    <div className="hub-shell space-y-8 py-6 lg:py-8">
      {elementaryMode ? (
        <>
          <header>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
              Grade school study
            </p>
            <h1 className="mt-1 text-3xl font-black text-stone-900">Study Hub</h1>
            <p className="mt-2 max-w-2xl text-stone-600">
              Pick a class → follow the guided lesson → explain it back in your own words.
            </p>
          </header>
          <StudyHubLearnerContext />
          <div data-study-primary-actions className="space-y-3">
            <LearnerGrowthContinuityStrip teaser={growthContinuityTeaser} />
          </div>
          <GradeSchoolLearningPlan plans={gradeSchoolPlans} />
          {selectedCourse && selectedCourseId ? (
            <TopicStudyHaul
              courseId={selectedCourseId}
              courseTitle={readableCourseTitle(selectedCourse.title)}
              topic={coldStartTopic}
              materialId={urlMaterialId}
            />
          ) : null}
          <section className="rounded-3xl border border-teal-200 bg-teal-50/50 p-6">
            <h2 className="text-lg font-bold text-stone-900">Explain it back</h2>
            <p className="mt-2 text-sm text-stone-600">
              After a guided lesson, practice teaching what you learned in your own words.
            </p>
            <Link
              href={teachMeHref(selectedCourseId || null, null, coldStartTopic)}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 touch-manipulation"
            >
              Open teach-me practice
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
          <div id="start-studying" className="scroll-mt-24">
            {sessionBuilder}
          </div>
        </>
      ) : (
        <StudyHaulLearningCenter
          courses={courses}
          selectedCourseId={selectedCourseId}
          selectedCourse={selectedCourse}
          coldStartTopic={coldStartTopic}
          materialId={urlMaterialId}
          growthContinuityTeaser={growthContinuityTeaser}
          onSelectCourse={selectCourse}
          sessionBuilder={sessionBuilder}
        />
      )}

      <BetaFeedbackWidget surface="study-hub" />
    </div>
  );
}

