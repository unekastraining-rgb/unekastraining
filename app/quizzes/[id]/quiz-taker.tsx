"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { StudyLoopStrip } from "@/components/study/StudyLoopStrip";
import { AdaptiveReturnStrip } from "@/components/study/AdaptiveReturnStrip";
import { StudyHubLearnerContext } from "@/components/study/StudyHubLearnerContext";
import { QuizSourceBadge } from "@/components/quizzes/QuizSourceBadge";
import { QuizGenerationError } from "@/components/quizzes/QuizGenerationError";
import { useTapHandler } from "@/hooks/useTapHandler";
import { pickColdStartTopic } from "@/lib/study/cold-start-topic";
import { blurtingHref, sixChunkingHref } from "@/lib/study/loop-hrefs";
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
  course: { id: string; title: string; color: string | null; topics?: string[] } | null;
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
  const searchParams = useSearchParams();
  const adaptiveRunId = searchParams.get("adaptiveRunId")?.trim() || "";
  const adaptiveStepRaw = searchParams.get("adaptiveStep");
  const conceptIdParam = searchParams.get("conceptId")?.trim() || "";
  const adaptiveStep =
    adaptiveStepRaw != null && adaptiveStepRaw !== ""
      ? Number(adaptiveStepRaw)
      : null;
  const hasAdaptiveContext =
    Boolean(adaptiveRunId) &&
    adaptiveStep != null &&
    Number.isFinite(adaptiveStep) &&
    adaptiveStep >= 0;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adaptiveReturn, setAdaptiveReturn] = useState<{
    runId: string;
    notice?: string;
  } | null>(null);
  const [answers, setAnswers] = useState<
    Record<string, string | string[] | boolean>
  >({});
  const [results, setResults] = useState<{
    score: number;
    maxScore: number;
    percent: number;
    items: GradedResult[];
  } | null>(null);
  const sessionStart = useRef(0);

  useEffect(() => {
    sessionStart.current = Date.now();
  }, []);

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
          ...(hasAdaptiveContext
            ? {
                adaptiveRunId,
                adaptiveStep,
              }
            : {}),
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Failed to submit quiz.");
      setResults(data.data);

      // Preserve results view; offer Adaptive return when bind succeeded.
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
        setAdaptiveReturn({ runId: adaptive.runId, notice });
      } else if (hasAdaptiveContext && adaptive?.outcome === "error") {
        setError(
          adaptive.reason ??
            "Adaptive study could not update from this quiz. Your score was still saved.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  const tapMakeAnotherQuiz = useTapHandler(() => {
    const courseId = quiz?.course?.id;
    if (!courseId) return;
    void (async () => {
      setSubmitting(true);
      setError(null);
      try {
        const response = await fetch("/api/quizzes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            questionCount: 30,
          }),
        });
        const data = await response.json();
        if (!data.success || !data.data?.id) {
          throw new Error(data.error ?? "Could not create the next quiz.");
        }
        window.location.href = `/quizzes/${data.data.id}`;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create the next quiz.");
        setSubmitting(false);
      }
    })();
  });

  const quizzesBackHref = quiz?.course?.id
    ? `/quizzes?courseId=${encodeURIComponent(quiz.course.id)}`
    : "/quizzes";
  const studyHubHref = quiz?.course?.id
    ? `/study?courseId=${encodeURIComponent(quiz.course.id)}`
    : "/study";

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
        <QuizGenerationError error={error} className="text-left" />
        <Link
          href={quizzesBackHref}
          className="mt-4 inline-flex min-h-11 items-center text-orange-600 hover:underline touch-manipulation"
        >
          Back to quizzes
        </Link>
      </div>
    );
  }

  if (!quiz) return null;

  if (results) {
    const focusTopic = pickColdStartTopic(quiz.course?.topics ?? []);
    const missedCount = results.items.filter((item) => !item.isCorrect).length;

    return (
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-6">
        {hasAdaptiveContext || conceptIdParam ? (
          <StudyHubLearnerContext conceptId={conceptIdParam || null} />
        ) : null}
        <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-violet-600">
            Quiz complete
          </p>
          <p className="mt-2 text-5xl font-black text-stone-900">{results.percent}%</p>
          <p className="mt-2 text-stone-600">
            {results.score} of {results.maxScore} correct
          </p>
          {adaptiveReturn ? (
            <p className="mt-3 text-sm font-medium text-teal-800">
              Adaptive study updated — continue when you are ready.
            </p>
          ) : null}
        </div>

        {quiz.course?.id ? (
          <StudyLoopStrip
            courseId={quiz.course.id}
            courseTitle={quiz.course.title}
            topics={quiz.course.topics ?? []}
          />
        ) : null}

        {quiz.course?.id && missedCount > 0 ? (
          <div
            data-hub-chrome
            data-quiz-chrome
            className="rounded-2xl border border-orange-200 bg-orange-50/50 p-5"
          >
            <p className="text-sm font-bold text-stone-900">
              {missedCount} missed — keep the Core → Six → Lucky loop going
            </p>
            <p className="mt-1 text-sm text-stone-600">
              Blurt what slipped, then chunk gaps in Six before your next Lucky quiz.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={blurtingHref(quiz.course.id, null, focusTopic)}
                className="inline-flex min-h-11 items-center rounded-xl border border-orange-300 bg-white px-4 py-2.5 text-sm font-bold text-orange-900 hover:bg-orange-100 touch-manipulation"
              >
                Blurt gaps
              </Link>
              <Link
                href={sixChunkingHref(quiz.course.id, focusTopic ?? "notes")}
                className="inline-flex min-h-11 items-center rounded-xl border border-teal-300 bg-white px-4 py-2.5 text-sm font-bold text-teal-900 hover:bg-teal-50 touch-manipulation"
              >
                Six chunking
              </Link>
            </div>
          </div>
        ) : null}

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

        {error ? <QuizGenerationError error={error} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" /> : null}

        <div className="flex flex-wrap gap-3" data-quiz-chrome>
          {adaptiveReturn ? (
            <AdaptiveReturnStrip
              runId={adaptiveReturn.runId}
              notice={adaptiveReturn.notice ?? null}
            />
          ) : null}
          {quiz.course?.id ? (
            <button
              type="button"
              disabled={submitting}
              {...tapMakeAnotherQuiz}
              className="inline-flex min-h-11 items-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 touch-manipulation"
            >
              {submitting ? "Making next quiz…" : "Make another quiz"}
            </button>
          ) : null}
          <Link
            href={quizzesBackHref}
            className="inline-flex min-h-11 items-center rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 touch-manipulation"
          >
            Back to quizzes
          </Link>
          <Link
            href={studyHubHref}
            className="inline-flex min-h-11 items-center rounded-xl border border-orange-200 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-orange-50 touch-manipulation"
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
        <QuizSourceBadge description={quiz.description} variant="detail" />
      </div>

      {quiz.course?.id ? (
        <StudyLoopStrip
          courseId={quiz.course.id}
          courseTitle={quiz.course.title}
          topics={quiz.course.topics ?? []}
        />
      ) : null}

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
              ) : question.type === "MULTIPLE_RESPONSE" && question.options ? (
                question.options.map((option) => {
                  const selected = Array.isArray(answers[question.id])
                    ? (answers[question.id] as string[])
                    : [];
                  const checked = selected.includes(option);
                  return (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-orange-100 px-4 py-3 hover:bg-orange-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? selected.filter((item) => item !== option)
                            : [...selected, option];
                          setAnswer(question.id, next);
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  );
                })
              ) : question.type === "FILL_IN_BLANK" ? (
                <input
                  type="text"
                  value={String(answers[question.id] ?? "")}
                  onChange={(event) => setAnswer(question.id, event.target.value)}
                  placeholder="Fill in the blank"
                  className="w-full rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm"
                />
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
                  rows={question.type === "SCENARIO" ? 4 : 2}
                  placeholder="Type your answer..."
                  className="w-full rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {error ? <QuizGenerationError error={error} /> : null}

      <div data-quiz-chrome>
        <button
          type="button"
          onClick={() => void submitQuiz()}
          disabled={submitting}
          className="w-full rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 touch-manipulation sm:w-auto min-h-11 inline-flex items-center justify-center"
        >
          {submitting ? "Grading..." : "Submit quiz"}
        </button>
      </div>
    </div>
  );
}

function formatAnswer(answer: string | string[] | boolean) {
  if (Array.isArray(answer)) return answer.join(", ");
  if (typeof answer === "boolean") return answer ? "True" : "False";
  return String(answer);
}
