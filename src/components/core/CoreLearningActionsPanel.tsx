"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, BookOpen, Loader2 } from "lucide-react";

import type { CoreLearningActionLink } from "@/lib/learning/unified-experience";

/**
 * Bundle E — Core → Learning actions (Learn / Practice / Recall / Explain).
 * Read-only with respect to note content. Uses existing Study rooms.
 */
export function CoreLearningActionsPanel({
  noteId,
  courseId,
  materialId,
}: {
  noteId?: string | null;
  courseId?: string | null;
  materialId?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<CoreLearningActionLink[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!noteId?.trim()) {
      setActions([]);
      setEmptyMessage(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/core/learning-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          noteId,
          courseId: courseId || null,
          materialId: materialId || null,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        actions?: CoreLearningActionLink[];
        error?: string;
      };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Could not load learning actions.");
        setActions([]);
        return;
      }
      const next = data.actions ?? [];
      setActions(next);
      const onlyConnect =
        next.length === 1 && next[0]?.action === "connect-concept";
      setEmptyMessage(
        onlyConnect
          ? next[0]?.disabledReason ??
              "I couldn't identify a specific topic from this note yet."
          : null,
      );
    } catch {
      setError("Could not load learning actions.");
      setActions([]);
    } finally {
      setLoading(false);
    }
  }, [noteId, courseId, materialId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load on mount or dependency change
    void load();
  }, [load]);

  if (!noteId?.trim()) return null;

  const actionable = actions.filter((a) => a.href);

  return (
    <section
      data-core-learning-actions
      className="rounded-2xl border border-teal-100 bg-white p-4"
      aria-label="Learn from this note"
    >
      <div className="flex items-start gap-2">
        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-stone-900">Learn from this note</p>
          <p className="mt-0.5 text-[11px] text-stone-600">
            Jump into Study Haul without retyping. Your note stays unchanged.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="mt-3 flex min-h-11 items-center gap-2 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Finding topics…
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-700">
          {error}
        </p>
      ) : null}

      {!loading && emptyMessage ? (
        <p
          data-core-learning-low-info
          className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600"
        >
          {emptyMessage}
        </p>
      ) : null}

      {!loading && actionable.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {actionable.map((action) => (
            <Link
              key={action.action}
              href={action.href!}
              data-core-learn-action={action.action}
              title={action.reason}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white touch-manipulation hover:bg-teal-600 sm:flex-none"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
