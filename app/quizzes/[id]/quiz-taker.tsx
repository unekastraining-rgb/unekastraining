"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import type { QuizQuestionType } from "@/generated/prisma";

interface QuizQuestion {
  id: string;
  sortOrder: number;
  type: QuizQuestionType;
  prompt: string;
  options: string[] | null;
}

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  course: { id: string; title: string; color: string | null } | null;
  questions: QuizQuestion[];
}

interface GradedResult {
  questionId: string;
  prompt?: string;
  type?: QuizQuestionType;
  isCorrect: boolean;
  feedback?: string;
  correctAnswer: string | string[] | boolean;
  explanation?: string | null;
  userAnswer?: string | string[] | boolean;
}

export function QuizTaker({ quizId }: { quizId: string }) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<
    Record<string, string | string[] | boolean>
  >({});
  const [results, setResults] = useState<{
    score: number;
    maxScore: number;
    percent: number;
    items: GradedResult[];
  } | null>(null);
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/quizzes/${quizId}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.error ?? "Failed to load quiz.");
        setQuiz(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [quizId]);

  function setAnswer(
    questionId: string,
    value: string | string[] | boolean,
  ) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  async function submitQuiz() {
    if (!quiz) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = quiz.questions.map((question) => ({
        questionId: question.id,
        answer: answers[question.id] ?? "",
      }));

      const response = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: payload,
          durationSeconds: Math.max(
            60,
            Math.round((Date.now() - sessionStart.current) / 1000),
          ),
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Failed to submit quiz.");
      setResults(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-stone-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading quiz...
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-rose-700">{error}</p>
        <Link href="/quizzes" className="mt-4 inline-block text-orange-600 hover:underline">
          Back to quizzes
        </Link>
      </div>
    );
  }

  if (!quiz) return null;

  if (results) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-6">
        <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-violet-600">
            Quiz complete
          </p>
          <p className="mt-2 text-5xl font-black text-stone-900">{results.percent}%</p>
          <p className="mt-2 text-stone-600">
            {results.score} of {results.maxScore} correct
          </p>
        </div>

        <div className="space-y-4">
          {results.items.map((item) => (
            <div
              key={item.questionId}
              className={`rounded-2xl border p-5 ${
                item.isCorrect
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-rose-200 bg-rose-50/50"
              }`}
            >
              <div className="flex items-start gap-3">
                {item.isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                )}
                <div>
                  <p className="font-semibold text-stone-900">{item.prompt}</p>
                  <p className="mt-2 text-sm text-stone-600">{item.feedback}</p>
                  {!item.isCorrect ? (
                    <p className="mt-2 text-sm text-stone-700">
                      <span className="font-semibold">Correct answer:</span>{" "}
                      {formatAnswer(item.correctAnswer)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/quizzes"
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Back to quizzes
          </Link>
          <Link
            href="/study"
            className="rounded-xl border border-orange-200 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-orange-50"
          >
            Study hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
          {quiz.course?.title ?? "Lucky quiz"}
        </p>
        <h1 className="mt-1 text-3xl font-black text-stone-900">{quiz.title}</h1>
        {quiz.description ? (
          <p className="mt-2 text-stone-600">{quiz.description}</p>
        ) : null}
      </div>

      <div className="space-y-6">
        {quiz.questions.map((question, index) => (
          <div key={question.id} className="card-soft p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Question {index + 1} · {question.type.replaceAll("_", " ")}
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-900">
              {question.prompt}
            </p>

            <div className="mt-4 space-y-2">
              {question.type === "TRUE_FALSE" ? (
                <>
                  {[true, false].map((value) => (
                    <label
                      key={String(value)}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-orange-100 px-4 py-3 hover:bg-orange-50"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        checked={answers[question.id] === value}
                        onChange={() => setAnswer(question.id, value)}
                      />
                      <span>{value ? "True" : "False"}</span>
                    </label>
                  ))}
                </>
              ) : question.options ? (
                question.options.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-orange-100 px-4 py-3 hover:bg-orange-50"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={answers[question.id] === option}
                      onChange={() => setAnswer(question.id, option)}
                    />
                    <span>{option}</span>
                  </label>
                ))
              ) : (
                <textarea
                  value={String(answers[question.id] ?? "")}
                  onChange={(event) => setAnswer(question.id, event.target.value)}
                  rows={4}
                  placeholder="Type your answer..."
                  className="w-full rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void submitQuiz()}
        disabled={submitting}
        className="w-full rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Grading..." : "Submit quiz"}
      </button>
    </div>
  );
}

function formatAnswer(answer: string | string[] | boolean) {
  if (Array.isArray(answer)) return answer.join(", ");
  if (typeof answer === "boolean") return answer ? "True" : "False";
  return String(answer);
}
