"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, Sparkles } from "lucide-react";

import { StudyLoopStrip } from "@/components/study/StudyLoopStrip";
import {
  TeachingStyleSelector,
  useSessionTeachingStyle,
} from "@/components/study/TeachingStyleSelector";
import { useTapHandler } from "@/hooks/useTapHandler";
import type { AiSourceMode } from "@/lib/settings/app-settings";
import { defaultCourseMaterialsOnly } from "@/lib/settings/app-settings";
import { readableCourseTitle } from "@/lib/courses/display-name";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import { sixChunkingHref, sixFeynmanHref } from "@/lib/study/loop-hrefs";
import { resolveLoopFocusTopic } from "@/lib/study/resolve-loop-focus-topic";
import { resolveUrlCourseId } from "@/lib/study/resolve-url-course-id";
import { useCourseTopics } from "@/hooks/useCourseTopics";

interface CourseOption {
  id: string;
  title: string;
  topics?: { id: string; name: string }[];
}

interface Evaluation {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  misconceptions: string[];
  nextSteps: string[];
}

function usableTopics(course: CourseOption | undefined) {
  return (course?.topics ?? []).filter(
    (topic) =>
      topic.name.trim() &&
      !/^general$/i.test(topic.name) &&
      !isMetaSyllabusTopic(topic.name),
  );
}

export function GuidedStudyActivity({
  mode,
  title,
  subtitle,
  placeholder,
  initialCourses,
  initialCourseId,
  initialTopic,
  initialMaterialId,
}: {
  mode: "blurting" | "teach-me";
  title: string;
  subtitle: string;
  placeholder: string;
  initialCourses: CourseOption[];
  initialCourseId?: string;
  initialTopic?: string;
  /** When set, evaluate against this chapter/material (Core → Blurt grounding). */
  initialMaterialId?: string;
}) {
  const router = useRouter();
  const [courses] = useState(initialCourses);
  const courseIds = courses.map((course) => course.id);
  const [courseId, setCourseId] = useState(() =>
    resolveUrlCourseId(initialCourseId, courseIds),
  );
  const [topic, setTopic] = useState(initialTopic ?? "");
  const [topicCustom, setTopicCustom] = useState(false);
  const [materialId] = useState(initialMaterialId?.trim() || "");
  const [response, setResponse] = useState("");
  const [courseOnly, setCourseOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [makingQuiz, setMakingQuiz] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Evaluation | null>(null);
  const sessionStart = useRef<number | null>(null);
  const topicInitRef = useRef(false);
  /** 2P-20 — Teach Me feedback phrasing only; does not alter score/evidence bridges. */
  const [teachingStyle, setTeachingStyle] = useSessionTeachingStyle("");

  const selectedCourse = courses.find((course) => course.id === courseId);
  const seededTopics = (selectedCourse?.topics ?? []).filter(
    (topic) =>
      topic.name.trim() &&
      !/^general$/i.test(topic.name) &&
      !isMetaSyllabusTopic(topic.name),
  );
  const { topics: liveTopics, loading: topicsLoading } = useCourseTopics(
    courseId,
    seededTopics,
  );
  const courseTopics =
    liveTopics.length > 0
      ? liveTopics
      : usableTopics(selectedCourse);

  useEffect(() => {
    void fetch("/api/preferences")
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.appSettings) {
          setCourseOnly(
            defaultCourseMaterialsOnly(data.appSettings.aiSourceMode as AiSourceMode),
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setCourseId(resolveUrlCourseId(initialCourseId, courseIds));
  }, [initialCourseId, courseIds]);

  // Cold start: pick a syllabus/LMS topic when the course changes (no paste required).
  useEffect(() => {
    if (!topicInitRef.current) {
      topicInitRef.current = true;
      if (initialTopic?.trim() && !isMetaSyllabusTopic(initialTopic)) {
        const match = courseTopics.some((item) => item.name === initialTopic.trim());
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
        setTopicCustom(!match);
        setTopic(initialTopic.trim());
        return;
      }
    }
    if (courseTopics.length > 0) {
      setTopicCustom(false);
      setTopic(courseTopics[0]!.name);
    } else {
      setTopicCustom(true);
      setTopic("");
    }
    // Only re-seed when the selected course changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- courseTopics derived from courseId
  }, [courseId]);

  async function evaluate() {
    if (!response.trim()) {
      setError("Write your response first.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/study/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          courseId: courseId || undefined,
          materialId: materialId || undefined,
          topic,
          userResponse: response,
          useCourseMaterialsOnly: courseOnly,
          durationSeconds: Math.max(
            60,
            Math.round(
              (Date.now() - (sessionStart.current ??= Date.now())) / 1000,
            ),
          ),
          ...(mode === "teach-me" && teachingStyle
            ? { teachingStyle }
            : {}),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Evaluation failed.");
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function makeLuckyQuizFromGaps() {
    if (!courseId) {
      setError("Pick a course first so Lucky can build a quiz.");
      return;
    }
    setMakingQuiz(true);
    setError(null);
    try {
      const gapBlock = [
        topic ? `Focus topic: ${topic}` : "",
        result?.gaps?.length ? `Gaps to drill:\n- ${result.gaps.join("\n- ")}` : "",
        result?.misconceptions?.length
          ? `Misconceptions to correct:\n- ${result.misconceptions.join("\n- ")}`
          : "",
        response.trim()
          ? `Student blurt (for context):\n${response.trim().slice(0, 6000)}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          topicName: topic || undefined,
          questionCount: 20,
          sourceText: gapBlock || undefined,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: { id?: string };
      };
      if (!data.success || !data.data?.id) {
        throw new Error(data.error ?? "Could not build a Lucky quiz from this session.");
      }
      router.push(`/quizzes/${data.data.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not build a Lucky quiz from this session.",
      );
    } finally {
      setMakingQuiz(false);
    }
  }

  const tapEvaluate = useTapHandler(() => void evaluate());
  const tapMakeQuiz = useTapHandler(() => void makeLuckyQuizFromGaps());
  const tapBackToTopics = useTapHandler(() => {
    setTopicCustom(false);
    setTopic(courseTopics[0]?.name ?? "");
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
          Lucky · {mode === "blurting" ? "Blurting" : "Teach Me"}
        </p>
        <h1 className="mt-1 text-3xl font-black text-stone-900">{title}</h1>
        <p className="mt-2 text-stone-600">{subtitle}</p>
      </div>

      {courseId && selectedCourse ? (
        <StudyLoopStrip
          courseId={courseId}
          courseTitle={readableCourseTitle(selectedCourse.title)}
          topics={courseTopics.map((item) => item.name)}
          focusTopic={resolveLoopFocusTopic(topic || initialTopic, courseTopics.map((item) => item.name))}
        />
      ) : null}

      {mode === "teach-me" ? (
        <div className="card-soft p-4">
          <TeachingStyleSelector
            value={teachingStyle}
            onChange={setTeachingStyle}
            id="teach-me-teaching-style"
          />
        </div>
      ) : null}

      <div className="card-soft space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Course
            </label>
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-orange-200 px-3 py-2.5 text-sm touch-manipulation"
            >
              <option value="">General</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {readableCourseTitle(course.title)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Topic {courseTopics.length > 0 ? "" : "(optional)"}
            </label>
            {courseTopics.length > 0 && !topicCustom ? (
              <select
                value={topic}
                onChange={(event) => {
                  if (event.target.value === "__custom__") {
                    setTopicCustom(true);
                    setTopic("");
                    return;
                  }
                  setTopic(event.target.value);
                }}
                className="mt-1 min-h-11 w-full rounded-xl border border-orange-200 px-3 py-2.5 text-sm touch-manipulation"
              >
                {courseTopics.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
                <option value="__custom__">Other / type your own…</option>
              </select>
            ) : (
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder={
                  courseTopics.length > 0
                    ? "Type a topic"
                    : "e.g. Binary search trees — or sync Canvas / add syllabus topics"
                }
                className="mt-1 w-full rounded-xl border border-orange-200 px-3 py-2.5 text-sm touch-manipulation"
              />
            )}
            {topicsLoading && courseTopics.length === 0 ? (
              <p className="mt-1 text-[11px] text-stone-500">Loading topics…</p>
            ) : null}
            {courseId && courseTopics.length === 0 && !topicsLoading ? (
              <p className="mt-1 text-[11px] text-stone-500">
                No topics yet — sync Canvas, photo a syllabus (OCR), or Study from topics in Core.
              </p>
            ) : null}
            {courseTopics.length > 0 && topicCustom ? (
              <button
                type="button"
                className="mt-1 text-[11px] font-semibold text-violet-700 hover:underline touch-manipulation"
                {...tapBackToTopics}
              >
                Back to course topics
              </button>
            ) : null}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={courseOnly}
            onChange={(event) => setCourseOnly(event.target.checked)}
          />
          Use my course materials only (professor terminology)
        </label>

        <textarea
          value={response}
          onChange={(event) => setResponse(event.target.value)}
          rows={12}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-violet-300"
        />

        <button
          type="button"
          {...tapEvaluate}
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 touch-manipulation"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "Analyzing..." : "Check my work"}
        </button>

        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </div>

      {result ? (
        <div className="space-y-4">
          <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-violet-600">
              Recall score
            </p>
            <p className="mt-1 text-4xl font-black text-stone-900">{result.score}%</p>
            <p className="mt-2 text-stone-600">{result.summary}</p>
          </div>

          <ResultSection title="What you got right" items={result.strengths} tone="emerald" />
          <ResultSection title="Gaps to fill" items={result.gaps} tone="amber" />
          <ResultSection title="Misconceptions" items={result.misconceptions} tone="rose" />
          <ResultSection title="Next steps" items={result.nextSteps} tone="teal" />

          {courseId ? (
            <div
              data-hub-chrome
              data-study-gap-loop
              className="rounded-2xl border border-violet-200 bg-white p-5"
            >
              <p className="text-sm font-bold text-stone-900">Core → Six → Lucky</p>
              <p className="mt-1 text-sm text-stone-600">
                Turn gaps from this {mode === "blurting" ? "blurt" : "teach-back"} into Six
                chunking or a Lucky quiz — no upload required.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={makingQuiz}
                  {...tapMakeQuiz}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-60 touch-manipulation"
                >
                  {makingQuiz ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ClipboardList className="h-4 w-4" />
                  )}
                  {makingQuiz ? "Making quiz…" : "Make Lucky quiz from gaps"}
                </button>
                <Link
                  href={sixChunkingHref(courseId, topic || "notes", materialId || null)}
                  className="inline-flex min-h-11 items-center rounded-xl border border-teal-300 bg-teal-50 px-4 py-2.5 text-sm font-bold text-teal-900 hover:bg-teal-100 touch-manipulation"
                >
                  Chunk gaps in Six
                </Link>
                <Link
                  href={sixFeynmanHref(courseId, topic || "notes", materialId || null)}
                  className="inline-flex min-h-11 items-center rounded-xl border border-violet-300 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-900 hover:bg-violet-100 touch-manipulation"
                >
                  Teach back (Feynman)
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ResultSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "emerald" | "amber" | "rose" | "teal";
}) {
  if (items.length === 0) return null;
  const colors = {
    emerald: "border-emerald-200 bg-emerald-50/50",
    amber: "border-amber-200 bg-amber-50/50",
    rose: "border-rose-200 bg-rose-50/50",
    teal: "border-teal-200 bg-teal-50/50",
  };

  return (
    <div className={`rounded-2xl border p-5 ${colors[tone]}`}>
      <p className="font-bold text-stone-900">{title}</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-stone-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
