"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, Sparkles } from "lucide-react";

import { useCourseTopics } from "@/hooks/useCourseTopics";
import { useTapHandler } from "@/hooks/useTapHandler";
import { SIX_STAGE_PASS_SCORE } from "@/lib/csl/six-completion";
import { personalizeSixGuide, resolveSixActivityHref } from "@/lib/csl/six-guides";
import type { SixComponent } from "@/lib/csl/six";
import {
  isMetaSyllabusTopic,
  type SixWorkedLesson,
} from "@/lib/csl/six-worked-lesson";
import { readableCourseTitle } from "@/lib/courses/display-name";
import { blurtingHref, luckyQuizHref } from "@/lib/study/loop-hrefs";
import { coreCourseHref } from "@/lib/study/core-href";
import {
  parseLearningFocus,
  shouldTeachBeforePractice,
} from "@/lib/study/learning-focus";
import { resolveLoopFocusTopic } from "@/lib/study/resolve-loop-focus-topic";
import { resolveUrlCourseId } from "@/lib/study/resolve-url-course-id";
import { StudyLoopStrip } from "@/components/study/StudyLoopStrip";
import { SixTutorChat } from "@/components/study/SixTutorChat";
import { useSessionTeachingStyle } from "@/components/study/TeachingStyleSelector";

interface CourseOption {
  id: string;
  title: string;
}

interface TopicOption {
  id: string;
  name: string;
}

interface StepEvaluation {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  misconceptions: string[];
  nextSteps: string[];
}

export function SixGuidedSession({
  component,
  initialCourses,
  initialCourseTopics = {},
}: {
  component: SixComponent;
  initialCourses: CourseOption[];
  initialCourseTopics?: Record<string, TopicOption[]>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCourseId = searchParams.get("courseId") ?? "";
  const urlTopic = searchParams.get("topic") ?? searchParams.get("topicName") ?? "";
  const urlMaterialId = searchParams.get("materialId") ?? "";
  const adaptiveRunId = searchParams.get("adaptiveRunId")?.trim() || "";
  const adaptiveStepRaw = searchParams.get("adaptiveStep");
  const focus = parseLearningFocus(searchParams.get("focus"));
  const openTutor = searchParams.get("tutor") === "1" || focus === "tutor";
  const teachBeforePractice = shouldTeachBeforePractice({
    focus,
    techniquePrefersRecallFirst: component === "active-recall",
  });
  const adaptiveStep =
    adaptiveStepRaw != null && adaptiveStepRaw !== ""
      ? Number(adaptiveStepRaw)
      : null;
  const hasAdaptiveContext =
    Boolean(adaptiveRunId) &&
    adaptiveStep != null &&
    Number.isFinite(adaptiveStep) &&
    adaptiveStep >= 0;

  const [courseId, setCourseId] = useState(() =>
    resolveUrlCourseId(urlCourseId, initialCourses.map((course) => course.id)),
  );
  const [topic, setTopic] = useState(urlTopic);
  const [materialId] = useState(urlMaterialId);
  const seededTopics = initialCourseTopics[courseId] ?? [];
  const {
    topics,
    loading: topicsLoading,
    error: topicsError,
  } = useCourseTopics(courseId, seededTopics);
  const [lesson, setLesson] = useState<SixWorkedLesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonWarning, setLessonWarning] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, StepEvaluation>>({});
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [makingQuiz, setMakingQuiz] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Cold learners unlock practice after reading the taught map. */
  const [practiceUnlocked, setPracticeUnlocked] = useState(() => !teachBeforePractice);
  const [teachingStyle] = useSessionTeachingStyle("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setCourseId(
      resolveUrlCourseId(urlCourseId, initialCourses.map((course) => course.id)),
    );
    if (urlTopic) setTopic(urlTopic);
  }, [urlCourseId, urlTopic, initialCourses]);

  useEffect(() => {
    if (!courseId || topicsLoading) return;
    if (!topic.trim() && topics[0]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
      setTopic(topics[0].name);
    } else if (topic.trim() && isMetaSyllabusTopic(topic) && topics[0]) {
      setTopic(topics[0].name);
    }
  }, [courseId, topic, topics, topicsLoading]);

  const courseTitle =
    initialCourses.find((course) => course.id === courseId)?.title ?? "";
  const guide = personalizeSixGuide(component, {
    topicName: topic || undefined,
    courseTitle: courseTitle || undefined,
  });

  const practiceSteps = useMemo(() => {
    if (lesson?.practicePrompts?.length) {
      return lesson.practicePrompts;
    }
    return guide.steps.map((step) => ({
      title: step.title,
      prompt: step.prompt,
      tip: step.tip,
    }));
  }, [lesson, guide.steps]);

  const step = practiceSteps[activeStep] ?? practiceSteps[0];
  const allDone = completed.size === practiceSteps.length && practiceSteps.length > 0;
  const groundedInMaterial = Boolean(materialId);
  const topicLooksMeta = Boolean(topic.trim() && isMetaSyllabusTopic(topic));

  async function buildWorkedLesson() {
    if (!topic.trim()) {
      setError("Enter a real topic first — e.g. Object-Oriented Design, not a blank field.");
      return;
    }
    if (topicLooksMeta) {
      setError(
        "That looks like a syllabus admin heading. Pick a real content topic from the list (or type one).",
      );
      return;
    }

    setLessonLoading(true);
    setError(null);
    setLessonWarning(null);
    setLesson(null);
    setActiveStep(0);
    setResponses({});
    setFeedback({});
    setCompleted(new Set());
    try {
      const response = await fetch("/api/study/six-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          component,
          topic: topic.trim(),
          courseId: courseId || undefined,
          materialId: materialId || undefined,
          ...(teachingStyle ? { teachingStyle } : {}),
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        warning?: string;
        lesson?: SixWorkedLesson;
      };
      if (!data.success || !data.lesson) {
        throw new Error(data.error ?? "Could not build a worked example.");
      }
      setLesson(data.lesson);
      if (data.warning) setLessonWarning(data.warning);
      // New lesson for teach-first: keep practice locked until learner opts in
      if (teachBeforePractice) setPracticeUnlocked(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build a worked example.");
    } finally {
      setLessonLoading(false);
    }
  }

  useEffect(() => {
    if (!topic.trim() || topicLooksMeta) return;
    if (lesson?.topic === topic.trim()) return;
    const handle = window.setTimeout(() => {
      void buildWorkedLesson();
    }, 400);
    return () => window.clearTimeout(handle);
    // Auto-build when arriving with a course topic from Study Hub / Core.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [component, topic, courseId, materialId]);

  async function evaluateStep() {
    if (!step) return;
    const response = responses[activeStep]?.trim();
    if (!response) {
      setError("Write your response before asking for coaching.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const lessonContext = lesson
        ? `\nWORKED ${component.toUpperCase()} LESSON (student should match this map):\n${lesson.chunks
            .map(
              (chunk, index) =>
                `${index + 1}. ${chunk.title}: ${chunk.explanation.slice(0, 180)}`,
            )
            .join("\n")}`
        : "";
      const res = await fetch("/api/study/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "six",
          component,
          stepIndex: activeStep,
          stepTitle: step.title,
          stepPrompt: `${step.prompt}${lessonContext}`,
          courseId: courseId || undefined,
          materialId: materialId || undefined,
          topic,
          userResponse: response,
          // Live practice stage count (validated server-side 2–4 / guide fallback).
          sixStageCount: practiceSteps.length,
          ...(hasAdaptiveContext
            ? {
                adaptiveRunId,
                adaptiveStep,
              }
            : {}),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Coaching failed.");
      setFeedback((prev) => ({ ...prev, [activeStep]: data.data }));
      if (data.data.score >= SIX_STAGE_PASS_SCORE) {
        setCompleted((prev) => new Set([...prev, activeStep]));
      }

      // Phase 2G-10/2G-12 — return only when adaptive bind succeeded (final stage).
      // Intermediate evaluates omit `adaptive` so the learner stays in SIX.
      const adaptive = data.adaptive as
        | { runId?: string; outcome?: string; reason?: string }
        | undefined;
      if (
        hasAdaptiveContext &&
        adaptive?.runId &&
        adaptive.outcome &&
        adaptive.outcome !== "error"
      ) {
        const notice =
          adaptive.outcome.startsWith("STOP_") ||
          adaptive.outcome === "ALREADY_PROCESSED"
            ? adaptive.outcome
            : undefined;
        const qs = notice
          ? `?notice=${encodeURIComponent(notice)}`
          : "";
        router.push(`/study/adaptive/${adaptive.runId}${qs}`);
        return;
      }
      if (hasAdaptiveContext && adaptive?.outcome === "error") {
        setError(
          adaptive.reason ??
            "Adaptive study could not update from this activity. Your coaching feedback was still saved.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coaching failed.");
    } finally {
      setLoading(false);
    }
  }

  async function makeLuckyQuiz() {
    if (!courseId) {
      setError("Select a course first, then make a Lucky quiz.");
      return;
    }
    setMakingQuiz(true);
    setError(null);
    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          materialId: materialId || undefined,
          topicName: topic || guide.title || undefined,
          questionCount: 30,
          sourceText: lesson
            ? lesson.chunks
                .map(
                  (chunk) =>
                    `## ${chunk.title}\n${chunk.explanation}\nExample: ${chunk.example}`,
                )
                .join("\n\n")
            : undefined,
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        data?: { id?: string };
      };
      if (!data.success || !data.data?.id) {
        throw new Error(data.error ?? "Could not build a quiz from this topic.");
      }
      window.location.href = `/quizzes/${data.data.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build a quiz.");
      setMakingQuiz(false);
    }
  }

  const tapEvaluateStep = useTapHandler(() => void evaluateStep());
  const tapNextStep = useTapHandler(() => setActiveStep((prev) => prev + 1));
  const tapBuildLesson = useTapHandler(() => void buildWorkedLesson());
  const tapMakeQuiz = useTapHandler(() => void makeLuckyQuiz());
  const tapUnlockPractice = useTapHandler(() => setPracticeUnlocked(true));

  const showPractice = Boolean(lesson) && practiceUnlocked;

  const topicFromList = topics.some((item) => item.name === topic);
  const lessonSummary = lesson
    ? [
        lesson.learningFrame,
        `Map: ${lesson.roadmap.join(" → ")}`,
        ...lesson.chunks.map(
          (chunk, index) =>
            `Chunk ${index + 1} ${chunk.title}: ${chunk.explanation.slice(0, 220)}`,
        ),
        `Cheat sheet: ${lesson.cheatSheet}`,
      ].join("\n")
    : undefined;

  const topicFields = (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Course
        </label>
        <select
          value={courseId}
          onChange={(event) => {
            setCourseId(event.target.value);
            setLesson(null);
          }}
          className="mt-1 w-full rounded-xl border border-orange-200 px-3 py-2.5 text-sm touch-manipulation"
        >
          <option value="">General</option>
          {initialCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {readableCourseTitle(course.title)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
          {topics.length > 0 ? "Topic from your class" : "Topic"}
        </label>
        {topics.length > 0 ? (
          <>
            <select
              value={topicFromList ? topic : ""}
              onChange={(event) => {
                setTopic(event.target.value);
                setLesson(null);
              }}
              className="mt-1 w-full rounded-xl border border-orange-200 px-3 py-2.5 text-sm touch-manipulation"
            >
              <option value="">Choose a module / topic…</option>
              {topics.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Or type your own
            </label>
            <input
              value={topicFromList ? "" : topic}
              onChange={(event) => {
                setTopic(event.target.value);
                setLesson(null);
              }}
              placeholder="e.g. polymorphism, recursion…"
              className="mt-1 w-full rounded-xl border border-dashed border-orange-200 bg-orange-50/30 px-3 py-2 text-sm touch-manipulation"
            />
          </>
        ) : (
          <input
            value={topic}
            onChange={(event) => {
              setTopic(event.target.value);
              setLesson(null);
            }}
            placeholder="e.g. Object-Oriented Design, Binary Search Trees"
            className="mt-1 w-full rounded-xl border border-orange-200 px-3 py-2.5 text-sm touch-manipulation"
          />
        )}
        {topicLooksMeta ? (
          <p className="mt-1 text-xs font-medium text-amber-700">
            That heading is syllabus admin text. Pick a content topic so chunking has something real to teach.
          </p>
        ) : null}
        {topicsLoading ? (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading topics from your class…
          </p>
        ) : null}
        {topicsError && topics.length === 0 ? (
          <p className="mt-1 text-xs font-medium text-rose-700">{topicsError}</p>
        ) : null}
      </div>
    </div>
  );

  const practiceStepsHeader =
    lesson && step ? (
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Now practice — cover the map and example
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {practiceSteps.map((item, index) => {
            const done = completed.has(index);
            const current = index === activeStep;
            return (
              <StepPill
                key={`${item.title}-${index}`}
                index={index}
                current={current}
                done={done}
                onSelect={setActiveStep}
              />
            );
          })}
        </div>
      </div>
    ) : null;

  const practiceStepCard =
    lesson && step ? (
      <div className="space-y-3">
        <div
          className={`rounded-2xl border p-4 ${
            completed.has(activeStep)
              ? "border-emerald-200 bg-emerald-50/50"
              : "border-orange-100 bg-white"
          }`}
        >
          <p className="font-bold text-stone-900">
            Step {activeStep + 1}: {step.title}
          </p>
          <p className="mt-2 text-sm text-stone-700">{step.prompt}</p>
          <p className="mt-2 text-xs text-teal-700">{step.tip}</p>

          <textarea
            value={responses[activeStep] ?? ""}
            onChange={(event) =>
              setResponses((prev) => ({ ...prev, [activeStep]: event.target.value }))
            }
            rows={7}
            placeholder="Type from memory — AI coaches against the taught chunks…"
            className="mt-3 w-full resize-none rounded-xl border border-orange-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200"
          />

          <button
            type="button"
            {...tapEvaluateStep}
            disabled={loading}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-60 touch-manipulation"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Get AI coaching
          </button>

          {error ? (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          {feedback[activeStep] ? (
            <div className="mt-4 space-y-3 rounded-xl border border-teal-100 bg-teal-50/50 p-4 text-sm">
              <p className="font-semibold text-teal-900">
                Coach · {feedback[activeStep].score}/100 — {feedback[activeStep].summary}
              </p>
              {feedback[activeStep].strengths.length > 0 ? (
                <div>
                  <p className="text-xs font-bold uppercase text-emerald-700">Strengths</p>
                  <ul className="mt-1 list-disc pl-5 text-stone-700">
                    {feedback[activeStep].strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {feedback[activeStep].gaps.length > 0 ? (
                <div>
                  <p className="text-xs font-bold uppercase text-amber-700">Gaps</p>
                  <ul className="mt-1 list-disc pl-5 text-stone-700">
                    {feedback[activeStep].gaps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {feedback[activeStep].nextSteps.length > 0 ? (
                <div>
                  <p className="text-xs font-bold uppercase text-teal-700">Next</p>
                  <ul className="mt-1 list-disc pl-5 text-stone-700">
                    {feedback[activeStep].nextSteps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {activeStep < practiceSteps.length - 1 ? (
            <button
              type="button"
              {...tapNextStep}
              className="min-h-10 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white touch-manipulation"
            >
              Next step
            </button>
          ) : null}
          <Link
            href={resolveSixActivityHref(guide, {
              courseId: courseId || undefined,
              materialId,
              topicName: topic || undefined,
            })}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500"
          >
            {guide.activityLabel} <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    ) : (
      <p className="rounded-xl border border-dashed border-orange-200 bg-orange-50/40 px-3 py-3 text-sm text-stone-600">
        Pick a topic so the worked example can load — practice unlocks right under it.
      </p>
    );

  const taughtMapPanel = lesson ? (
    <div className="space-y-4 rounded-2xl border border-teal-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
          Taught map
        </p>
        <p className="mt-1 text-[11px] font-medium text-stone-500">
          Your example skeleton — cover this when you practice
        </p>
        <p className="mt-2 text-sm font-semibold text-stone-900">
          {lesson.learningFrame}
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-stone-700">
          {lesson.roadmap.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>
      <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-800">
          Cheat sheet
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-stone-800">
          {lesson.cheatSheet}
        </p>
      </div>
    </div>
  ) : (
    <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
        Taught map
      </p>
      <p className="mt-1 text-sm text-stone-600">
        How {guide.title.toLowerCase()} works — your map appears here once a topic loads.
      </p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-stone-800">
        {guide.howTo.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </div>
  );

  const workedExamplePanel = (
    <div className="max-h-[min(70vh,40rem)] space-y-3 overflow-y-auto rounded-2xl border border-violet-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-violet-800">
          Worked example
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-stone-500">
          AI · {guide.title.toLowerCase()} on your topic
        </p>
      </div>
      {lesson ? (
        <div className="space-y-3">
          {lesson.chunks.map((chunk, index) => (
            <article
              key={`${chunk.title}-${index}`}
              className="rounded-xl border border-orange-100 bg-orange-50/30 px-3 py-3"
            >
              <p className="text-sm font-bold text-stone-900">
                Chunk {index + 1} — {chunk.title}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
                {chunk.explanation}
              </p>
              <p className="mt-2 rounded-lg bg-white/80 px-3 py-2 text-xs text-stone-600">
                <span className="font-bold text-teal-800">Example: </span>
                {chunk.example}
              </p>
              {chunk.memoryTrick ? (
                <p className="mt-2 text-xs font-medium text-violet-800">
                  Memory trick: {chunk.memoryTrick}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-600">
          {lessonLoading
            ? "Building the worked example…"
            : "Choose a topic above — the AI example lands here."}
        </p>
      )}
    </div>
  );

  return (
    <div className="relative mx-auto max-w-[90rem] space-y-5 px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav className="flex flex-wrap gap-2" aria-label="Study navigation">
          {hasAdaptiveContext ? (
            <Link
              href={`/study/adaptive/${encodeURIComponent(adaptiveRunId)}`}
              data-six-adaptive-return
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-teal-700 px-3 py-2 text-xs font-semibold text-white shadow-sm touch-manipulation hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Continue learning
            </Link>
          ) : null}
          {courseId ? (
            <Link
              href={coreCourseHref({ courseId, materialId: materialId || null })}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-900 shadow-sm touch-manipulation hover:bg-teal-50"
            >
              Back to Core
            </Link>
          ) : null}
          <Link
            href={courseId ? `/study?courseId=${encodeURIComponent(courseId)}` : "/study"}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm touch-manipulation hover:bg-orange-50"
          >
            Study Hub
          </Link>
          {hasAdaptiveContext ? (
            <Link
              href="/study/learner-model"
              data-six-return-growth
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm touch-manipulation hover:bg-stone-50"
            >
              View progress
            </Link>
          ) : null}
        </nav>
        <SixTutorChat
          component={component}
          techniqueTitle={guide.title}
          topic={topic}
          courseId={courseId || undefined}
          materialId={materialId || undefined}
          lessonSummary={lessonSummary}
          defaultOpen={openTutor}
          openLabel="Tutor Me"
        />
      </div>

      {/* Title alone, centered */}
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">
          Ways to Study
        </p>
        <h1 className="mt-1 text-3xl font-black text-stone-900">{guide.title}</h1>
        <p className="mt-2 text-stone-700">{guide.whatItMeans}</p>
        {topic.trim() ? (
          <p className="mt-3 text-sm font-semibold text-stone-900">
            Learning <span className="text-teal-800">{topic.trim()}</span> via{" "}
            {guide.title.toLowerCase()}
            {courseTitle ? (
              <span className="ml-1 text-xs font-medium text-stone-500">
                · {courseTitle}
              </span>
            ) : null}
          </p>
        ) : (
          <p className="mt-2 text-sm text-stone-600">{guide.intro}</p>
        )}
        {groundedInMaterial ? (
          <p className="mt-2 text-xs font-semibold text-teal-800">
            Coaching uses the chapter/material you opened from Core.
          </p>
        ) : null}
      </header>

      {courseId ? (
        <StudyLoopStrip
          courseId={courseId}
          courseTitle={courseTitle || "this class"}
          topics={topics.map((item) => item.name)}
          focusTopic={resolveLoopFocusTopic(urlTopic, topics.map((item) => item.name)) || topic || null}
        />
      ) : null}

      {/* Topic fields alone — nothing beside */}
      <div className="mx-auto max-w-2xl">{topicFields}</div>

      {/* Chunking cue alone — nothing beside */}
      <div className="mx-auto max-w-2xl rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-800">
              See chunking applied to your topic
            </p>
            <p className="mt-1 text-sm text-stone-700">
              {teachBeforePractice
                ? "Read the taught map first. Practice unlocks when you are ready — recall is still available, just not first."
                : "Then practice below — map left, AI example right, aligned with your step."}
            </p>
          </div>
          <button
            type="button"
            {...tapBuildLesson}
            disabled={lessonLoading || !topic.trim()}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2.5 text-sm font-semibold text-white touch-manipulation hover:bg-violet-500 disabled:opacity-60"
          >
            {lessonLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {lesson ? "Rebuild" : "Teach me"}
          </button>
        </div>
        {lessonWarning ? (
          <p className="mt-3 text-xs text-amber-800">{lessonWarning}</p>
        ) : null}
        {error && !lesson ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </div>

      {/* Practice header only after unlock for teach-first */}
      {showPractice ? practiceStepsHeader : null}

      {lesson && teachBeforePractice && !practiceUnlocked ? (
        <div
          data-six-teach-first-gate
          className="mx-auto max-w-2xl rounded-2xl border border-teal-200 bg-teal-50/50 p-4"
        >
          <p className="text-sm font-semibold text-teal-900">
            Teaching first — read the map and examples below before recalling.
          </p>
          <p className="mt-1 text-xs text-teal-800">
            &quot;Recall the map&quot; and other practice steps stay available; they
            unlock when you choose.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              {...tapUnlockPractice}
              className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 touch-manipulation"
            >
              I&apos;m ready to practice
            </button>
          </div>
        </div>
      ) : null}

      {/* Taught map before practice on mobile when teach-first */}
      <div
        data-six-session-layout
        data-six-teach-first={teachBeforePractice ? "true" : "false"}
        className="grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-[minmax(16rem,0.9fr)_minmax(0,1.2fr)_minmax(18rem,0.95fr)]"
      >
        <section
          className={`min-w-0 xl:sticky xl:top-4 ${
            teachBeforePractice
              ? "order-1 xl:order-1"
              : "order-2 xl:order-1"
          }`}
        >
          {taughtMapPanel}
        </section>

        <section
          className={`min-w-0 space-y-4 lg:col-span-2 xl:col-span-1 ${
            teachBeforePractice
              ? "order-2 xl:order-2"
              : "order-1 xl:order-2"
          }`}
        >
          {showPractice ? practiceStepCard : null}

          {showPractice && allDone ? (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-900">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Session complete — test what stuck with Lucky.
              </p>
              <button
                type="button"
                disabled={makingQuiz || !courseId}
                {...tapMakeQuiz}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 touch-manipulation"
              >
                {makingQuiz ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {makingQuiz ? "Making quiz…" : "Make Lucky quiz on this topic"}
              </button>
              {courseId ? (
                <div
                  data-hub-chrome
                  className="flex flex-wrap gap-2"
                >
                  <Link
                    href={luckyQuizHref(courseId, materialId || null, topic || undefined)}
                    className="inline-flex min-h-11 items-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white touch-manipulation hover:bg-violet-500"
                  >
                    Open Lucky
                  </Link>
                  <Link
                    href={blurtingHref(courseId, materialId || null, topic || undefined)}
                    className="inline-flex min-h-11 items-center rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-800 touch-manipulation hover:bg-orange-100"
                  >
                    Blurt gaps
                  </Link>
                </div>
              ) : (
                <p className="text-xs font-normal text-emerald-800">
                  Select a course above to generate a quiz.
                </p>
              )}
            </div>
          ) : null}
        </section>

        <aside className="min-w-0 order-3 lg:col-span-2 xl:order-3 xl:col-span-1 xl:sticky xl:top-4">
          {workedExamplePanel}
        </aside>
      </div>
    </div>
  );
}

function StepPill({
  index,
  current,
  done,
  onSelect,
}: {
  index: number;
  current: boolean;
  done: boolean;
  onSelect: (index: number) => void;
}) {
  const tap = useTapHandler(() => onSelect(index));
  return (
    <button
      type="button"
      {...tap}
      className={`min-h-9 rounded-full px-3 py-1.5 text-xs font-semibold touch-manipulation ${
        current
          ? "bg-teal-600 text-white"
          : done
            ? "bg-emerald-100 text-emerald-800"
            : "bg-white text-stone-600 ring-1 ring-orange-100"
      }`}
    >
      {done ? "✓ " : ""}
      Step {index + 1}
    </button>
  );
}
