"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";

import { ClientIcon } from "@/components/ui/ClientIcon";
import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import { StudyLoopStrip } from "@/components/study/StudyLoopStrip";
import { QuizSourceBadge } from "@/components/quizzes/QuizSourceBadge";
import { QuizGenerationError } from "@/components/quizzes/QuizGenerationError";
import { useTapHandler } from "@/hooks/useTapHandler";
import { confirmDelete, confirmDeleteMany } from "@/lib/confirm-delete";
import { useSelectableIds } from "@/lib/selection/use-selectable-ids";
import { resolveLoopFocusTopic } from "@/lib/study/resolve-loop-focus-topic";
import { resolveUrlCourseId } from "@/lib/study/resolve-url-course-id";

interface QuizSummary {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  source: string;
  course: { id: string; title: string; color: string | null } | null;
  questionCount: number;
  attemptCount: number;
  lastAttempt: {
    score: number | null;
    maxScore: number | null;
    completedAt: string | null;
  } | null;
  createdAt: string;
}

interface CourseOption {
  id: string;
  title: string;
  topics?: string[];
}

export function QuizzesView({
  initialCourses,
  initialCourseId = null,
}: {
  initialCourses: CourseOption[];
  initialCourseId?: string | null;
}) {
  const searchParams = useSearchParams();
  const urlTopic = searchParams.get("topic")?.trim() || null;
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [missedCount, setMissedCount] = useState(0);
  const [courses] = useState(initialCourses);
  const courseIds = useMemo(() => courses.map((course) => course.id), [courses]);
  const [selectedCourseId, setSelectedCourseId] = useState(() =>
    resolveUrlCourseId(initialCourseId, courseIds),
  );
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/quizzes", { credentials: "same-origin" });
      const data = await response.json();
      if (data.success) {
        setQuizzes(data.data);
        setMissedCount(data.missedCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load on mount or dependency change
    void refresh();
  }, [refresh]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setSelectedCourseId(resolveUrlCourseId(searchParams.get("courseId"), courseIds));
  }, [searchParams, courseIds]);

  const loopFocusTopic = useMemo(
    () =>
      resolveLoopFocusTopic(
        urlTopic,
        courses.find((course) => course.id === selectedCourseId)?.topics ?? [],
      ),
    [urlTopic, courses, selectedCourseId],
  );

  const autoMakeStarted = useRef(false);

  async function generateQuiz() {
    if (!selectedCourseId) {
      setError("Add a course first.");
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      const materialId = searchParams.get("materialId") || undefined;
      const topicName = searchParams.get("topic")?.trim() || undefined;
      const response = await fetch("/api/quizzes", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          materialId,
          topicName,
          questionCount: 30,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Failed to generate quiz.");
      window.location.href = `/quizzes/${data.data.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate quiz.");
    } finally {
      setGenerating(false);
    }
  }

  async function generateMissedQuiz() {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "missed",
          courseId: selectedCourseId || undefined,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Failed to create review.");
      window.location.href = `/quizzes/${data.data.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create review.");
    } finally {
      setGenerating(false);
    }
  }

  const tapGenerate = useTapHandler(() => void generateQuiz());
  const tapMissed = useTapHandler(() => void generateMissedQuiz());

  // Study Now / cold-start deep link: build a quiz immediately for the course.
  useEffect(() => {
    const shouldMake = searchParams.get("make") === "1";
    const resolvedCourseId = resolveUrlCourseId(searchParams.get("courseId"), courseIds);
    if (!shouldMake || !resolvedCourseId || autoMakeStarted.current) return;

    setSelectedCourseId(resolvedCourseId);

    const makeKey = `quiz-auto-make:${resolvedCourseId}:${searchParams.get("topic") ?? ""}`;
    try {
      if (sessionStorage.getItem(makeKey) === "pending") return;
      sessionStorage.setItem(makeKey, "pending");
    } catch {
      // sessionStorage unavailable — rely on ref guard only.
    }

    autoMakeStarted.current = true;
    let cancelled = false;
    void (async () => {
      setGenerating(true);
      setError(null);
      try {
        const materialId = searchParams.get("materialId") || undefined;
        const topicName = searchParams.get("topic")?.trim() || undefined;
      const response = await fetch("/api/quizzes", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: resolvedCourseId,
            materialId,
            topicName,
            questionCount: 30,
          }),
        });
        const data = await response.json();
        if (cancelled) return;
        if (!data.success) throw new Error(data.error ?? "Failed to generate quiz.");
        try {
          sessionStorage.setItem(makeKey, data.data.id);
        } catch {
          // ignore
        }
        window.location.href = `/quizzes/${data.data.id}`;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to generate quiz.");
          setGenerating(false);
          autoMakeStarted.current = false;
          try {
            sessionStorage.removeItem(makeKey);
          } catch {
            // ignore
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, courseIds]);

  async function deleteQuiz(quiz: QuizSummary) {
    if (!confirmDelete(quiz.title)) return;
    await fetch(`/api/quizzes/${quiz.id}`, { method: "DELETE" });
    await refresh();
  }

  const visibleQuizzes = useMemo(() => {
    if (!selectedCourseId) return quizzes;
    return quizzes.filter((quiz) => quiz.course?.id === selectedCourseId);
  }, [quizzes, selectedCourseId]);

  const visibleQuizIds = useMemo(
    () => visibleQuizzes.map((quiz) => quiz.id),
    [visibleQuizzes],
  );
  const quizSelection = useSelectableIds(visibleQuizIds);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    quizSelection.pruneTo(visibleQuizIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleQuizIds.join("|")]);

  async function deleteSelectedQuizzes() {
    const ids = quizSelection.selectedIds;
    if (ids.length === 0) return;
    if (!confirmDeleteMany(ids.length, { noun: "quiz", nounPlural: "quizzes" })) {
      return;
    }
    setBulkDeleting(true);
    try {
      await Promise.all(
        ids.map((id) => fetch(`/api/quizzes/${id}`, { method: "DELETE" })),
      );
      quizSelection.clear();
      await refresh();
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
          Lucky · Retention
        </p>
        <h1 className="mt-1 text-3xl font-black text-stone-900">Quizzes</h1>
        <p className="mt-2 text-stone-600">
          Take quizzes from your topics and materials — Study Now can auto-build one. Get instant
          feedback and recycle missed questions later.
        </p>
        {generating && searchParams.get("make") === "1" ? (
          <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
            <ClientIcon icon={Loader2} className="h-4 w-4 animate-spin" />
            Building your Lucky quiz (Gemini → Groq → OpenRouter) — topic bank if quota is out…
          </p>
        ) : null}
      </div>

      {selectedCourseId ? (
        <StudyLoopStrip
          courseId={selectedCourseId}
          courseTitle={
            courses.find((course) => course.id === selectedCourseId)?.title ?? "this course"
          }
          topics={
            courses.find((course) => course.id === selectedCourseId)?.topics ?? []
          }
          focusTopic={loopFocusTopic}
        />
      ) : null}

      <div className="card-soft space-y-4 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900">
          <ClientIcon icon={Sparkles} className="h-5 w-5 text-violet-600" />
          Generate a new quiz
        </h2>
        {courses.length > 0 ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
              className="flex-1 rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              {...tapGenerate}
              disabled={generating}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 touch-manipulation"
            >
              {generating ? (
                <ClientIcon icon={Loader2} className="h-4 w-4 animate-spin" />
              ) : (
                <ClientIcon icon={Plus} className="h-4 w-4" />
              )}
              {generating ? "Generating..." : "Generate 30-question chapter quiz"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-stone-600">
            <Link href="/courses" className="font-semibold text-orange-600 hover:underline">
              Add a course
            </Link>{" "}
            with syllabus material first.
          </p>
        )}
        <p className="text-xs text-stone-500">
          Free tier uses Gemini → Groq → OpenRouter (OpenAI optional in Settings). When AI quota
          runs out, Lucky still builds from your syllabus topics (offline bank). Quiz cards show
          which provider built each set.
        </p>
        {missedCount > 0 || searchParams.get("filter") === "missed" ? (
          <button
            type="button"
            {...tapMissed}
            disabled={generating}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60 touch-manipulation"
          >
            Review {missedCount} missed question{missedCount === 1 ? "" : "s"}
          </button>
        ) : null}
        {error ? <QuizGenerationError error={error} /> : null}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-stone-900">Your quizzes</h2>
        {loading ? (
          <p className="text-sm text-stone-500">Loading quizzes...</p>
        ) : visibleQuizzes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 px-6 py-10 text-center text-sm text-stone-600">
            No quizzes for this class yet. Generate one from your course material above.
          </p>
        ) : (
          <>
            <BulkSelectionBar
              totalCount={visibleQuizzes.length}
              selectedCount={quizSelection.selectedCount}
              allSelected={quizSelection.allSelected}
              someSelected={quizSelection.someSelected}
              onToggleAll={quizSelection.toggleAll}
              onClear={quizSelection.clear}
              onDeleteSelected={() => void deleteSelectedQuizzes()}
              deleting={bulkDeleting}
              noun="quiz"
              nounPlural="quizzes"
            />
            {visibleQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className={`card-interactive flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between ${
                quizSelection.isSelected(quiz.id) ? "ring-2 ring-violet-400" : ""
              }`}
            >
              <div className="flex min-w-0 items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-violet-600"
                  checked={quizSelection.isSelected(quiz.id)}
                  onChange={() => quizSelection.toggle(quiz.id)}
                  aria-label={`Select ${quiz.title}`}
                />
                <div className="min-w-0">
                <p className="font-bold text-stone-900">{quiz.title}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {quiz.course?.title ?? "General"} · {quiz.questionCount} questions ·{" "}
                  {quiz.difficulty}
                </p>
                {quiz.description ? (
                  <p className="mt-1 text-xs font-medium text-violet-700">
                    {quiz.description}
                  </p>
                ) : null}
                <QuizSourceBadge description={quiz.description} variant="list" />
                {quiz.lastAttempt?.completedAt ? (
                  <p className="mt-1 text-xs text-emerald-700">
                    Last score: {quiz.lastAttempt.score}/{quiz.lastAttempt.maxScore}
                  </p>
                ) : null}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/quizzes/${quiz.id}`}
                  data-hub-chrome
                  className="inline-flex min-h-11 items-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 touch-manipulation"
                >
                  {quiz.lastAttempt ? "Retake" : "Take quiz"}
                </Link>
                <button
                  type="button"
                  onClick={() => void deleteQuiz(quiz)}
                  data-hub-chrome
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 touch-manipulation"
                  aria-label={`Delete ${quiz.title}`}
                >
                  <ClientIcon icon={Trash2} className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          </>
        )}
      </div>
    </div>
  );
}
