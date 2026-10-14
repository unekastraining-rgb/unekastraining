"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookMarked, Check, Loader2, X } from "lucide-react";

import type { KnowledgeConceptCandidate } from "@/lib/learning/knowledge/core-bridge-types";
import {
  coreAdaptiveRunHrefWithReturn,
  pickCoreBridgeFocusConceptId,
  resolveCoreAdaptivePrimaryCta,
} from "@/lib/learning/orchestrator/core-adaptive-bridge";

type PreviewPayload = {
  enabled: boolean;
  hasStudyExtract: boolean;
  linkedConceptIds: string[];
  candidates: KnowledgeConceptCandidate[];
  truncated: boolean;
  totalBeforeCap: number;
};

/**
 * Additive CORE Studio action: propose Concepts from the persisted study extract.
 * Explicit user request only — never runs on autosave.
 * Phase 2G-68: optional "Continue learning" CTA into existing Adaptive
 * (Orchestrator decides inside adaptive/start) — no CORE evidence/mastery writes.
 */
export function CoreKnowledgeBridgePanel({
  noteId,
  hasStudyExtract,
  onBeforeLeaveToAdaptive,
}: {
  noteId: string | null;
  hasStudyExtract: boolean;
  /** Flush in-memory notebook before navigating to Adaptive. */
  onBeforeLeaveToAdaptive?: () => Promise<void> | void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [disabledHint, setDisabledHint] = useState(false);
  const [confirmedConceptId, setConfirmedConceptId] = useState<string | null>(
    null,
  );
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    if (!noteId) {
      setError("Save or open a notebook first.");
      return;
    }
    setLoading(true);
    setError(null);
    setDisabledHint(false);
    try {
      const response = await fetch("/api/core/knowledge/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, action: "preview" }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        enabled?: boolean;
        error?: string;
        preview?: PreviewPayload;
      };
      if (!data.success) {
        throw new Error(data.error ?? "Could not load concept candidates.");
      }
      if (!data.enabled || !data.preview?.enabled) {
        setDisabledHint(true);
        setPreview(null);
        return;
      }
      setPreview(data.preview);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load candidates.");
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  async function confirm(candidateKey: string) {
    if (!noteId) return;
    setBusyKey(candidateKey);
    setError(null);
    setStartError(null);
    try {
      const response = await fetch("/api/core/knowledge/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, action: "confirm", candidateKey }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        conceptId?: string;
      };
      if (!data.success) {
        throw new Error(data.error ?? "Could not link concept.");
      }
      if (typeof data.conceptId === "string" && data.conceptId.trim()) {
        setConfirmedConceptId(data.conceptId.trim());
      }
      await loadPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not link concept.");
    } finally {
      setBusyKey(null);
    }
  }

  async function reject(candidateKey: string) {
    if (!noteId) return;
    setBusyKey(candidateKey);
    setError(null);
    try {
      const response = await fetch("/api/core/knowledge/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, action: "reject", candidateKey }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };
      if (!data.success) {
        throw new Error(data.error ?? "Could not dismiss candidate.");
      }
      await loadPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not dismiss candidate.");
    } finally {
      setBusyKey(null);
    }
  }

  async function enterAdaptiveClosedLoop() {
    const focusConceptId = pickCoreBridgeFocusConceptId({
      confirmedConceptId,
      linkedConceptIds: preview?.linkedConceptIds,
    });
    const primary = resolveCoreAdaptivePrimaryCta({
      conceptId: focusConceptId,
    });
    if (primary.kind === "none" || starting) return;

    setStarting(true);
    setStartError(null);

    try {
      // Persist in-memory notebook edits before leaving CORE.
      await onBeforeLeaveToAdaptive?.();
      if (noteId && typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(
            "studyhaul:coreReturnNoteId",
            noteId,
          );
        } catch {
          /* ignore */
        }
      }

      if (primary.kind === "resume") {
        router.push(
          coreAdaptiveRunHrefWithReturn(primary.runId, noteId),
        );
        return;
      }

      // Session identity is server-authoritative — never send client identity fields.
      const response = await fetch("/api/study/adaptive/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ conceptId: primary.conceptId }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        runId?: string;
        resumed?: boolean;
        error?: string;
      };
      if (!response.ok || !data.success || !data.runId) {
        setStartError(data.error ?? "Could not start adaptive study.");
        return;
      }
      router.push(coreAdaptiveRunHrefWithReturn(data.runId, noteId));
    } catch {
      setStartError("Could not start adaptive study.");
    } finally {
      setStarting(false);
    }
  }

  if (!hasStudyExtract) return null;

  const visible =
    preview?.candidates.filter((c) => c.status !== "rejected" && c.status !== "linked") ??
    [];

  const focusConceptId = pickCoreBridgeFocusConceptId({
    confirmedConceptId,
    linkedConceptIds: preview?.linkedConceptIds,
  });
  const adaptiveCta = resolveCoreAdaptivePrimaryCta({
    conceptId: focusConceptId,
  });
  const showContinueLearning = adaptiveCta.kind !== "none";

  return (
    <section
      className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4"
      data-core-knowledge-bridge
    >
      <div className="flex items-start gap-2">
        <BookMarked className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-stone-900">Knowledge concepts</p>
          <p className="mt-0.5 text-[11px] text-stone-600">
            Propose Concepts from your study extract. You confirm before anything is created.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void loadPreview()}
        disabled={loading || !noteId}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-3 py-2.5 text-sm font-semibold text-white touch-manipulation hover:bg-teal-600 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <BookMarked className="h-4 w-4" />
        )}
        {open ? "Refresh concept proposals" : "Propose concepts from extract"}
      </button>

      {!noteId ? (
        <p className="mt-2 text-[11px] text-amber-800">
          Open a saved notebook to link concepts.
        </p>
      ) : null}

      {disabledHint ? (
        <p className="mt-2 text-[11px] text-stone-500">
          Concept grounding is not enabled on this environment.
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-700">
          {error}
        </p>
      ) : null}

      {open && preview ? (
        <div className="mt-3 space-y-2">
          {preview.linkedConceptIds.length > 0 ? (
            <p className="text-[11px] font-medium text-teal-800">
              {preview.linkedConceptIds.length} concept
              {preview.linkedConceptIds.length === 1 ? "" : "s"} linked to this notebook.
            </p>
          ) : null}

          {showContinueLearning ? (
            <div
              className="rounded-xl border border-teal-200 bg-white px-3 py-2.5"
              data-core-continue-learning
              data-entry-kind="adaptive-learning"
              data-core-focus-concept-id={focusConceptId ?? undefined}
            >
              <p className="text-[11px] text-stone-600">
                Ready for the Study Haul learning loop on a linked concept.
              </p>
              <button
                type="button"
                disabled={starting}
                onClick={() => void enterAdaptiveClosedLoop()}
                data-core-adaptive-cta="continue"
                className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-800 px-3 py-2.5 text-sm font-semibold text-white touch-manipulation hover:bg-teal-700 disabled:opacity-60"
              >
                {starting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <ArrowRight className="h-4 w-4" aria-hidden />
                )}
                {adaptiveCta.kind === "resume"
                  ? adaptiveCta.label
                  : adaptiveCta.kind === "start"
                    ? adaptiveCta.label
                    : "Continue learning"}
              </button>
              {startError ? (
                <p className="mt-2 text-xs text-rose-700">{startError}</p>
              ) : null}
            </div>
          ) : null}

          {visible.length === 0 ? (
            <p className="text-xs text-stone-500">
              {preview.hasStudyExtract
                ? "No new candidates right now."
                : "No study extract found on this notebook."}
            </p>
          ) : (
            visible.map((candidate) => (
              <div
                key={candidate.key}
                className="rounded-xl border border-teal-100 bg-white px-3 py-2.5"
              >
                <p className="text-sm font-semibold text-stone-900">{candidate.title}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-stone-400">
                  {candidate.sourceType.replaceAll("_", " ")} · {candidate.sourcePath}
                </p>
                {candidate.definition ? (
                  <p className="mt-1 line-clamp-2 text-xs text-stone-600">
                    {candidate.definition}
                  </p>
                ) : null}
                <p className="mt-1 text-[11px] text-stone-500">
                  {candidate.status === "existing"
                    ? "Matches an existing Concept — link without creating a duplicate."
                    : "New Concept will be created if you confirm."}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyKey === candidate.key}
                    onClick={() => void confirm(candidate.key)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-teal-700 px-3 py-2 text-xs font-semibold text-white touch-manipulation disabled:opacity-60"
                  >
                    {busyKey === candidate.key ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {candidate.status === "existing" ? "Link existing" : "Confirm"}
                  </button>
                  <button
                    type="button"
                    disabled={busyKey === candidate.key}
                    onClick={() => void reject(candidate.key)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 touch-manipulation disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" />
                    Skip
                  </button>
                </div>
              </div>
            ))
          )}

          {preview.truncated ? (
            <p className="text-[11px] text-stone-500">
              Showing strongest candidates first ({preview.candidates.length} of{" "}
              {preview.totalBeforeCap}).
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
