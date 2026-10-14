"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import {
  GROWTH_NO_SEQUENCE_FALLBACK_HREF,
  GROWTH_NO_SEQUENCE_FALLBACK_LABEL,
  resolveGrowthAdaptivePrimaryCta,
} from "@/lib/learning/learner-model/growth-action-continuity";

/**
 * Additive Adaptive entry — does not diagnose or write evidence.
 * 2P-22: Start vs Continue via existing Hub Adaptive contract when activeRunId known.
 * 2P-33: optional materialId / fromNote for Material → Adaptive continuity (same API).
 * 2P-49: optional assignmentId for school workflow continuity (display context only).
 * Server start API remains authoritative for ownership + resume-if-ACTIVE.
 */
export function ContinueLearningButton({
  conceptId,
  activeRunId = null,
  materialId = null,
  assignmentId = null,
  fromNote = null,
  label,
  className,
  sixFallbackHref = null,
  sixFallbackLabel = null,
  secondaryHint = null,
}: {
  conceptId: string;
  /** Opaque ACTIVE AdaptiveSequenceRun id when known — resume without restart. */
  activeRunId?: string | null;
  /** Optional material context for Adaptive start (Materials / LMS entry). */
  materialId?: string | null;
  /** Optional assignment school context (display only — never mastery). */
  assignmentId?: string | null;
  /** Optional CORE note return handle (opaque). */
  fromNote?: string | null;
  /** Override CTA label; default derived from Start vs Continue continuity. */
  label?: string;
  className?: string;
  /** Existing Orchestrator SIX deep link only — never invents interventions. */
  sixFallbackHref?: string | null;
  sixFallbackLabel?: string | null;
  /** Optional secondary line (e.g. topic name) — not a second CTA system. */
  secondaryHint?: string | null;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSoftFallback, setShowSoftFallback] = useState(false);

  const primary = resolveGrowthAdaptivePrimaryCta({ conceptId, activeRunId });
  const resolvedLabel =
    label ??
    (primary.kind === "none" ? "Continue learning" : primary.label);

  function appendContextQuery(href: string): string {
    const params = new URLSearchParams();
    const mid = typeof materialId === "string" ? materialId.trim() : "";
    const aid = typeof assignmentId === "string" ? assignmentId.trim() : "";
    const note = typeof fromNote === "string" ? fromNote.trim() : "";
    if (mid) params.set("materialId", mid);
    if (aid) params.set("assignmentId", aid);
    if (note) params.set("fromNote", note);
    const q = params.toString();
    if (!q) return href;
    return href.includes("?") ? `${href}&${q}` : `${href}?${q}`;
  }

  async function start() {
    if (primary.kind === "none" || starting) return;

    setStarting(true);
    setError(null);
    setShowSoftFallback(false);

    try {
      if (primary.kind === "resume") {
        router.push(appendContextQuery(primary.href));
        return;
      }

      const body: Record<string, string> = { conceptId: primary.conceptId };
      const mid = typeof materialId === "string" ? materialId.trim() : "";
      if (mid) body.materialId = mid;
      const aid = typeof assignmentId === "string" ? assignmentId.trim() : "";
      if (aid) body.assignmentId = aid;

      const res = await fetch("/api/study/adaptive/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        success?: boolean;
        runId?: string;
        data?: { runId?: string };
        error?: string;
        resumed?: boolean;
        materialId?: string | null;
        assignmentId?: string | null;
      };
      if (!res.ok || !data.success) {
        const message = data.error ?? "Could not start adaptive study.";
        setError(message);
        // no_sequence / soft Adaptive refusal → existing Hub fallback, optional SIX
        setShowSoftFallback(true);
        return;
      }
      const runId = data.runId ?? data.data?.runId;
      if (typeof runId === "string" && runId) {
        router.push(appendContextQuery(`/study/adaptive/${runId}`));
        return;
      }
      setError("Adaptive run unavailable.");
      setShowSoftFallback(true);
    } catch {
      setError("Could not start adaptive study.");
      setShowSoftFallback(true);
    } finally {
      setStarting(false);
    }
  }

  const sixHref =
    typeof sixFallbackHref === "string" ? sixFallbackHref.trim() : "";
  const sixLabel =
    typeof sixFallbackLabel === "string" ? sixFallbackLabel.trim() : "";
  const hint =
    typeof secondaryHint === "string" ? secondaryHint.trim() : "";

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        data-continue-learning
        data-concept-linked
        data-entry-kind="adaptive-learning"
        data-growth-cta-kind={primary.kind}
        disabled={starting || primary.kind === "none"}
        onClick={() => void start()}
        title={hint || undefined}
        className={
          className ??
          "inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-700 bg-white px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-60 touch-manipulation"
        }
      >
        {starting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Opening…
          </>
        ) : (
          resolvedLabel
        )}
      </button>
      {hint ? (
        <p className="max-w-[14rem] text-[11px] text-stone-500" data-learning-action-hint>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      {showSoftFallback ? (
        <div
          data-growth-adaptive-fallback
          className="flex flex-wrap gap-2 pt-1"
        >
          {sixHref && sixLabel ? (
            <Link
              href={sixHref}
              data-entry-kind="direct-six"
              className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 touch-manipulation"
            >
              {sixLabel}
            </Link>
          ) : null}
          <Link
            href={GROWTH_NO_SEQUENCE_FALLBACK_HREF}
            data-growth-fallback="study-hub"
            className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 touch-manipulation"
          >
            {GROWTH_NO_SEQUENCE_FALLBACK_LABEL}
          </Link>
          <Link
            href="/study#study-now"
            data-growth-fallback="study-now"
            className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 touch-manipulation"
          >
            Study Now
          </Link>
        </div>
      ) : null}
    </div>
  );
}
