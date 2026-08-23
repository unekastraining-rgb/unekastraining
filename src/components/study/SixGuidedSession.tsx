"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, Sparkles } from "lucide-react";

import { SIX_GUIDES } from "@/lib/csl/six-guides";
import type { SixComponent } from "@/lib/csl/six";

interface CourseOption {
  id: string;
  title: string;
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
}: {
  component: SixComponent;
  initialCourses: CourseOption[];
}) {
  const guide = SIX_GUIDES[component];
  const searchParams = useSearchParams();
  const urlCourseId = searchParams.get("courseId") ?? "";
  const urlTopic = searchParams.get("topic") ?? searchParams.get("topicName") ?? "";

  const [courseId, setCourseId] = useState(
    urlCourseId || initialCourses[0]?.id || "",
  );
  const [topic, setTopic] = useState(urlTopic);
  const [activeStep, setActiveStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, StepEvaluation>>({});
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (urlCourseId) setCourseId(urlCourseId);
    if (urlTopic) setTopic(urlTopic);
  }, [urlCourseId, urlTopic]);

  const step = guide.steps[activeStep];
  const allDone = completed.size === guide.steps.length;

  async function evaluateStep() {
    const response = responses[activeStep]?.trim();
    if (!response) {
      setError("Write your response before asking for coaching.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/study/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "six",
          component,
          stepIndex: activeStep,
          stepTitle: step.title,
          stepPrompt: step.prompt,
          courseId: courseId || undefined,
          topic,
          userResponse: response,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Coaching failed.");
      setFeedback((prev) => ({ ...prev, [activeStep]: data.data }));
      if (data.data.score >= 65) {
        setCompleted((prev) => new Set([...prev, activeStep]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coaching failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">Six · Understand</p>
        <h1 className="mt-1 text-3xl font-black capitalize text-stone-900">
          {component.replace(/-/g, " ")}
        </h1>
        <p className="mt-2 text-stone-600">{guide.intro}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Course</label>
          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            className="mt-1 w-full rounded-xl border border-orange-200 px-3 py-2.5 text-sm"
          >
            <option value="">General</option>
            {initialCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Topic</label>
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="e.g. Binary trees"
            className="mt-1 w-full rounded-xl border border-orange-200 px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {guide.steps.map((item, index) => {
          const done = completed.has(index);
          const current = index === activeStep;
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
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
        })}
      </div>

      <div
        className={`rounded-2xl border p-5 ${
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
          rows={6}
          placeholder="Type your work here — AI will coach you on this step..."
          className="mt-4 w-full resize-none rounded-xl border border-orange-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-200"
        />

        <button
          type="button"
          onClick={() => void evaluateStep()}
          disabled={loading}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
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

      <div className="flex flex-wrap gap-3">
        {activeStep < guide.steps.length - 1 ? (
          <button
            type="button"
            onClick={() => setActiveStep((prev) => prev + 1)}
            className="rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Next step
          </button>
        ) : null}
        <Link
          href={guide.activityHref}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-500"
        >
          {guide.activityLabel} <ExternalLink className="h-4 w-4" />
        </Link>
        <Link
          href="/study"
          className="inline-flex items-center gap-2 rounded-xl border border-orange-200 px-5 py-3 text-sm font-semibold text-stone-700 hover:bg-orange-50"
        >
          Back to Study Hub
        </Link>
      </div>

      {allDone ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Session complete — nice work. Move to Lucky to test what stuck.
          </p>
        </div>
      ) : null}
    </div>
  );
}
