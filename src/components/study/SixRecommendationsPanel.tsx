"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Sparkles, Target } from "lucide-react";

import type { SixRecommendation } from "@/lib/csl/six-recommendations";

export function SixRecommendationsPanel({ courseId }: { courseId?: string }) {
  const [recommendations, setRecommendations] = useState<SixRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ limit: "6" });
        if (courseId) params.set("courseId", courseId);
        const response = await fetch(`/api/study/six-recommendations?${params}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.error ?? "Failed to load");
        setRecommendations(data.recommendations ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recommendations.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [courseId]);

  return (
    <section className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50/80 to-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-teal-600" />
            <h2 className="text-xl font-bold text-stone-900">Recommended for you</h2>
          </div>
          <p className="mt-2 text-sm text-stone-600">
            Based on weak mastery — each topic gets a matched Six technique with AI coaching.
          </p>
        </div>
        <Sparkles className="hidden h-6 w-6 shrink-0 text-teal-500 sm:block" />
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing mastery gaps…
        </div>
      ) : error ? (
        <p className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : recommendations.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-teal-100 bg-white/80 p-5 text-sm text-stone-600">
          <p className="font-semibold text-stone-800">You&apos;re in good shape!</p>
          <p className="mt-1">
            No weak topics detected. Add courses with topics, or take a quiz to build mastery data.
          </p>
          <Link
            href={courseId ? `/quizzes?courseId=${courseId}` : "/quizzes"}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal-600 hover:underline"
          >
            Take a quiz <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {recommendations.map((item) => (
            <Link
              key={item.topicId}
              href={item.href}
              className="group block rounded-2xl border border-teal-100 bg-white p-4 transition hover:border-teal-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-stone-900">{item.topicName}</p>
                  <p className="truncate text-xs text-stone-500">{item.courseTitle}</p>
                </div>
                <span className="shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800">
                  {item.proficiency}%
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg">{item.componentEmoji}</span>
                <span className="text-sm font-semibold text-teal-700">
                  {item.componentTitle}
                </span>
              </div>
              <p className="mt-2 text-sm text-stone-600">{item.reason}</p>

              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                <span>Understand {item.understanding}%</span>
                <span>·</span>
                <span>Recall {item.recall}%</span>
                <span>·</span>
                <span>Apply {item.application}%</span>
              </div>

              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal-600 group-hover:underline">
                Start guided session <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
