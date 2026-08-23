"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, Loader2, Sparkles } from "lucide-react";

import { readJsonResponse } from "@/lib/api-json";

export function StudyAnythingCard({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [focus, setFocus] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/courses/study-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          focus: focus.trim() || null,
          subject: subject.trim() || null,
        }),
      });

      const data = await readJsonResponse<{
        success?: boolean;
        course?: { id: string };
        error?: string;
      }>(response);

      if (!response.ok || !data.course?.id) {
        throw new Error(data.error ?? "Could not start this topic.");
      }

      setTitle("");
      setFocus("");
      setSubject("");
      router.push(`/courses/${data.course.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start this topic.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={`rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-teal-50/40 shadow-sm ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-stone-900">Study anything</h2>
          <p className="mt-1 text-sm text-stone-600">
            No syllabus needed — a class topic, stocks, electrical circuits, or anything
            you&apos;re trying to understand. We&apos;ll break it down and hook up notes,
            flashcards, and study sessions.
          </p>
        </div>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        <label className="block text-sm sm:col-span-2">
          <span className="font-semibold text-stone-700">What do you want to study?</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Stock market basics, Ohm's law, Chapter 7 mitosis"
            className="mt-1.5 w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-stone-800"
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-stone-700">Subject (optional)</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Finance, Physics, Bio…"
            className="mt-1.5 w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-stone-800"
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-stone-700">Stuck on / goal (optional)</span>
          <input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="What should click?"
            className="mt-1.5 w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-stone-800"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={!title.trim() || loading}
        onClick={() => void handleSubmit()}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
        {loading ? "Building your study plan…" : "Start studying this"}
      </button>

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
    </section>
  );
}
