"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

import { readJsonResponse } from "@/lib/api-json";
import { domainEmoji, summarizeTrackProgress } from "@/lib/grade-school/plan-utils";
import type { GeneratedCurriculum } from "@/lib/syllabus/types";

export function ReplanGrowthPlan({
  courseId,
  curriculum,
  completedSteps,
  onReplanned,
}: {
  courseId: string;
  curriculum: GeneratedCurriculum;
  completedSteps: number[];
  onReplanned?: () => void;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const trackSummary = useMemo(
    () => summarizeTrackProgress(curriculum.learningSteps, completedSteps, curriculum.skillTracks),
    [curriculum, completedSteps],
  );

  const canReplan = completedSteps.length > 0;

  async function handleReplan() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/courses/${courseId}/replan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentNotes: notes.trim() || null }),
      });

      const data = await readJsonResponse<{
        success: boolean;
        message?: string;
        error?: string;
      }>(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Could not update the plan.");
      }

      setSuccess(data.message ?? "Growth plan updated.");
      setOpen(false);
      setNotes("");
      onReplanned?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the plan.");
    } finally {
      setLoading(false);
    }
  }

  if (!canReplan) return null;

  return (
    <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
            Adapt the plan
          </p>
          <p className="mt-1 text-sm text-stone-700">
            {completedSteps.length} lesson{completedSteps.length === 1 ? "" : "s"} done — shift
            focus to what still needs growth.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-white px-4 py-2 text-sm font-bold text-violet-800 hover:bg-violet-100"
        >
          <RefreshCw className="h-4 w-4" />
          Update plan
        </button>
      </div>

      {trackSummary.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-xs">
          {trackSummary.map((track) => (
            <li key={track.track} className="flex items-center justify-between gap-2 text-stone-600">
              <span>
                {domainEmoji(track.domain)} {track.track}
              </span>
              <span
                className={
                  track.status === "strong"
                    ? "font-semibold text-emerald-700"
                    : track.status === "in_progress"
                      ? "font-semibold text-amber-700"
                      : "text-stone-500"
                }
              >
                {track.done}/{track.total}
                {track.status === "strong" ? " · going well" : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <div className="mt-4 space-y-3 border-t border-violet-200 pt-4">
          <label className="block text-sm font-semibold text-stone-700">
            Notes for the update (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Decoding is much better — push harder on inference and summarizing now."
            className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm"
          />
          <p className="text-xs text-stone-500">
            We&apos;ll generate fresh activities for weaker areas. Completed lesson progress resets
            for the new plan, but your history is saved in the plan.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleReplan()}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? "Updating plan…" : "Generate updated plan"}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </p>
      ) : null}

      {curriculum.replanHistory && curriculum.replanHistory.length > 0 ? (
        <p className="mt-3 text-xs text-stone-500">
          Plan version {curriculum.planVersion ?? 1} · {curriculum.replanHistory.length} prior
          update{curriculum.replanHistory.length === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}
