"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import type { AiSourceMode } from "@/lib/settings/app-settings";
import { defaultCourseMaterialsOnly } from "@/lib/settings/app-settings";

interface CourseOption {
  id: string;
  title: string;
}

interface Evaluation {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  misconceptions: string[];
  nextSteps: string[];
}

export function GuidedStudyActivity({
  mode,
  title,
  subtitle,
  placeholder,
  initialCourses,
  initialCourseId,
  initialTopic,
}: {
  mode: "blurting" | "teach-me";
  title: string;
  subtitle: string;
  placeholder: string;
  initialCourses: CourseOption[];
  initialCourseId?: string;
  initialTopic?: string;
}) {
  const [courses] = useState(initialCourses);
  const [courseId, setCourseId] = useState(
    initialCourseId && initialCourses.some((course) => course.id === initialCourseId)
      ? initialCourseId
      : (courses[0]?.id ?? ""),
  );
  const [topic, setTopic] = useState(initialTopic ?? "");
  const [response, setResponse] = useState("");
  const [courseOnly, setCourseOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Evaluation | null>(null);
  const sessionStart = useRef(Date.now());

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
          topic,
          userResponse: response,
          useCourseMaterialsOnly: courseOnly,
          durationSeconds: Math.max(
            60,
            Math.round((Date.now() - sessionStart.current) / 1000),
          ),
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

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
          Lucky · {mode === "blurting" ? "Blurting" : "Teach Me"}
        </p>
        <h1 className="mt-1 text-3xl font-black text-stone-900">{title}</h1>
        <p className="mt-2 text-stone-600">{subtitle}</p>
      </div>

      <div className="card-soft space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Course
            </label>
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-orange-200 px-3 py-2.5 text-sm"
            >
              <option value="">General</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Topic (optional)
            </label>
            <input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. Binary search trees"
              className="mt-1 w-full rounded-xl border border-orange-200 px-3 py-2.5 text-sm"
            />
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
          onClick={() => void evaluate()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
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
