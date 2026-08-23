"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Play, Sparkles } from "lucide-react";

interface CourseOption {
  id: string;
  title: string;
}

interface Problem {
  language: string;
  title: string;
  prompt: string;
  starter: string;
}

interface CodeEvaluation {
  score: number;
  summary: string;
  correctness: string;
  edgeCases: string[];
  improvements: string[];
  complexity: string;
}

export function CodePracticeWorkspace({
  initialCourses,
}: {
  initialCourses: CourseOption[];
}) {
  const [courses] = useState(initialCourses);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [language, setLanguage] = useState("javascript");
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CodeEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionStart = useRef(Date.now());

  const activeProblem =
    problems.find((problem) => problem.language === language) ?? problems[0];

  useEffect(() => {
    void fetch("/api/study/code-evaluate")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setProblems(data.data);
          setCode(data.data[0]?.starter ?? "");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeProblem) setCode(activeProblem.starter);
    setResult(null);
  }, [language, activeProblem?.language]);

  async function evaluate() {
    if (!code.trim()) {
      setError("Write some code first.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/study/code-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: courseId || undefined,
          language,
          code,
          problemTitle: activeProblem?.title,
          problemPrompt: activeProblem?.prompt,
          durationSeconds: Math.max(
            120,
            Math.round((Date.now() - sessionStart.current) / 1000),
          ),
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Evaluation failed.");
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
          Six · Hands-on Practice
        </p>
        <h1 className="mt-1 text-3xl font-black text-stone-900">CS Code Lab</h1>
        <p className="mt-2 text-stone-600">
          Solve problems in the editor, submit for AI feedback, and build application mastery.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-orange-100 bg-white p-5">
            <p className="font-bold text-stone-900">{activeProblem?.title}</p>
            <p className="mt-2 text-sm text-stone-600">{activeProblem?.prompt}</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-950">
            <div className="border-b border-stone-800 px-3 py-2 text-xs text-stone-400">
              {language}
            </div>
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              spellCheck={false}
              className="min-h-[320px] w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-emerald-300 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => void evaluate()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Submit for review
          </button>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-orange-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Language
            </p>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="mt-2 w-full rounded-xl border border-orange-200 px-3 py-2 text-sm"
            >
              {problems.map((problem) => (
                <option key={problem.language} value={problem.language}>
                  {problem.language}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Course context
            </p>
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-orange-200 px-3 py-2 text-sm"
            >
              <option value="">No course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/quizzes"
            className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800 hover:bg-violet-100"
          >
            <Play className="h-4 w-4" /> Practice quiz instead
          </Link>
        </aside>
      </div>

      {result ? (
        <div className="space-y-4 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-amber-700">
              Application score
            </p>
            <p className="text-4xl font-black text-stone-900">{result.score}%</p>
            <p className="mt-2 text-stone-600">{result.summary}</p>
          </div>
          <DetailBlock title="Correctness" body={result.correctness} />
          <DetailBlock title="Complexity" body={result.complexity} />
          {result.edgeCases.length > 0 ? (
            <ListBlock title="Edge cases" items={result.edgeCases} />
          ) : null}
          {result.improvements.length > 0 ? (
            <ListBlock title="Improvements" items={result.improvements} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DetailBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-amber-100 bg-white/80 p-4">
      <p className="font-semibold text-stone-900">{title}</p>
      <p className="mt-1 text-sm text-stone-700">{body}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-amber-100 bg-white/80 p-4">
      <p className="font-semibold text-stone-900">{title}</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-stone-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
