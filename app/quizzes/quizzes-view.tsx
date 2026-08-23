"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";

import { confirmDelete } from "@/lib/confirm-delete";

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
}

export function QuizzesView({
  initialCourses,
}: {
  initialCourses: CourseOption[];
}) {
  const searchParams = useSearchParams();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [missedCount, setMissedCount] = useState(0);
  const [courses] = useState(initialCourses);
  const [selectedCourseId, setSelectedCourseId] = useState(
    initialCourses[0]?.id ?? "",
  );
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/quizzes");
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
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const courseId = searchParams.get("courseId");
    if (courseId && courses.some((course) => course.id === courseId)) {
      setSelectedCourseId(courseId);
    }
  }, [searchParams, courses]);

  async function generateQuiz() {
    if (!selectedCourseId) {
      setError("Add a course first.");
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourseId, questionCount: 6 }),
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

  async function deleteQuiz(quiz: QuizSummary) {
    if (!confirmDelete(quiz.title)) return;
    await fetch(`/api/quizzes/${quiz.id}`, { method: "DELETE" });
    await refresh();
  }

  const visibleQuizzes = useMemo(() => {
    if (!selectedCourseId) return quizzes;
    return quizzes.filter((quiz) => quiz.course?.id === selectedCourseId);
  }, [quizzes, selectedCourseId]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
          Lucky · Retention
        </p>
        <h1 className="mt-1 text-3xl font-black text-stone-900">Quizzes</h1>
        <p className="mt-2 text-stone-600">
          Take AI-generated quizzes, get instant feedback, and recycle missed questions later.
        </p>
      </div>

      <div className="card-soft space-y-4 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900">
          <Sparkles className="h-5 w-5 text-violet-600" />
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
              onClick={() => void generateQuiz()}
              disabled={generating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {generating ? "Generating..." : "Generate quiz"}
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
        {missedCount > 0 || searchParams.get("filter") === "missed" ? (
          <button
            type="button"
            onClick={() => void generateMissedQuiz()}
            disabled={generating}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
          >
            Review {missedCount} missed question{missedCount === 1 ? "" : "s"}
          </button>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
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
          visibleQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="card-interactive flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-bold text-stone-900">{quiz.title}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {quiz.course?.title ?? "General"} · {quiz.questionCount} questions ·{" "}
                  {quiz.difficulty}
                </p>
                {quiz.lastAttempt?.completedAt ? (
                  <p className="mt-1 text-xs text-emerald-700">
                    Last score: {quiz.lastAttempt.score}/{quiz.lastAttempt.maxScore}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/quizzes/${quiz.id}`}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
                >
                  {quiz.lastAttempt ? "Retake" : "Take quiz"}
                </Link>
                <button
                  type="button"
                  onClick={() => void deleteQuiz(quiz)}
                  className="rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                  aria-label={`Delete ${quiz.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
