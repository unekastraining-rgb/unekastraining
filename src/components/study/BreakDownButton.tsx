"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

export function BreakDownButton({
  courseId,
  focus,
  label = "Break this down",
}: {
  courseId: string;
  focus?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    outline: { title: string; summary: string; sections: Array<{ heading: string; bullets: string[] }> };
    flashcardsCreated: number;
    quizId: string;
    quizTitle: string;
    proposalCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBreakDown() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/study/break-down", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, focus: focus ?? null }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Break down failed.");
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Break down failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleBreakDown()}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? "Breaking it down…" : label}
      </button>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {result ? (
        <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 text-sm">
          <p className="font-bold text-stone-900">{result.outline.title}</p>
          <p className="mt-1 text-stone-600">{result.outline.summary}</p>
          <ul className="mt-3 space-y-2">
            {result.outline.sections.map((section) => (
              <li key={section.heading}>
                <p className="font-semibold text-stone-900">{section.heading}</p>
                <ul className="mt-0.5 list-disc pl-4 text-stone-600">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white px-3 py-1 text-violet-800">
              {result.flashcardsCreated} flashcards created
            </span>
            <Link
              href={`/quizzes/${result.quizId}`}
              className="rounded-full bg-white px-3 py-1 text-orange-800 hover:underline"
            >
              Take quiz: {result.quizTitle}
            </Link>
            {result.proposalCount > 0 ? (
              <Link
                href="/calendar"
                className="rounded-full bg-white px-3 py-1 text-teal-800 hover:underline"
              >
                {result.proposalCount} schedule blocks suggested → Calendar
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
