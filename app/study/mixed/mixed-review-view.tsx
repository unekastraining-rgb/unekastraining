"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Play } from "lucide-react";

import { saveStudySession } from "@/components/study/StudySessionRunner";
import type { MixedReviewStep } from "@/lib/csl/mixed-review";

export function MixedReviewView() {
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<MixedReviewStep[]>([]);
  const [summary, setSummary] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/study/mixed-review");
      const data = await response.json();
      if (data.success) {
        setSteps(data.data.steps);
        setSummary(data.data.summary);
      }
      setLoading(false);
    }
    void load();
  }, []);

  function startAsSession() {
    saveStudySession({
      summary,
      totalMinutes: 30,
      activityType: "NOTES_REVIEW",
      blocks: steps.map((step) => ({
        id: step.id,
        minutes: step.minutes,
        label: step.label,
        activity: step.activity,
        href: step.href,
      })),
    });
    window.location.href = "/study/session";
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
          Lucky · Mixed Review
        </p>
        <h1 className="mt-1 text-3xl font-black text-stone-900">Your personalized review</h1>
        <p className="mt-2 text-stone-600">{summary}</p>
      </div>

      <ul className="space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-4"
          >
            <div>
              <p className="text-xs font-bold text-violet-600">Step {index + 1}</p>
              <p className="font-semibold text-stone-900">{step.label}</p>
              <p className="text-sm text-stone-600">{step.reason}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500">{step.minutes} min</p>
              <Link href={step.href} className="text-sm font-semibold text-violet-600 hover:underline">
                Open →
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={startAsSession}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500"
      >
        <Play className="h-4 w-4" /> Run as guided session
      </button>
    </div>
  );
}
