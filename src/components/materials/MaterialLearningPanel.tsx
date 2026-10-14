"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { BookOpen, Check, Loader2, Sparkles } from "lucide-react";

import { ContinueLearningButton } from "@/components/study/ContinueLearningButton";
import { coreCourseHref } from "@/lib/study/core-href";
import { studyHaulHref } from "@/lib/study/loop-hrefs";

type Candidate = {
  key: string;
  title: string;
  status: string;
  definition?: string | null;
};

type LearningPayload = {
  materialId: string;
  noteId: string;
  courseId: string;
  title: string;
  state: string;
  learnerMessage: string;
  provenanceLabel: string;
  candidates: Candidate[];
  focusConceptId: string | null;
  knowledgeBridgeEnabled: boolean;
  hasStudyExtract: boolean;
  truncated?: boolean;
};

/**
 * 2P-27 — Minimal material → concept → Adaptive workflow.
 * 2P-33 — Start/Continue via shared ContinueLearningButton (no Material Tutor).
 */
export function MaterialLearningPanel({
  materialId,
  courseId,
  title,
}: {
  materialId: string;
  courseId: string;
  title: string;
}) {
  const [learning, setLearning] = useState<LearningPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prepare = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/materials/${materialId}/learning`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "prepare" }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        learning?: LearningPayload;
      };
      if (!res.ok || !data.success || !data.learning) {
        throw new Error(data.error ?? "Could not prepare material.");
      }
      setLearning(data.learning);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare material.");
    } finally {
      setBusy(false);
    }
  }, [materialId]);

  async function confirm(candidateKey: string) {
    setConfirmKey(candidateKey);
    setError(null);
    try {
      const res = await fetch(`/api/materials/${materialId}/learning`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", candidateKey }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        learning?: LearningPayload;
        conceptId?: string;
      };
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Could not confirm concept.");
      }
      if (data.learning) setLearning(data.learning);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm concept.");
    } finally {
      setConfirmKey(null);
    }
  }

  const coreHref = coreCourseHref({
    courseId,
    materialId,
    noteId: learning?.noteId,
    import: true,
  });

  return (
    <section
      className="mt-3 space-y-3 rounded-xl border border-stone-200/80 bg-stone-50/80 p-3"
      data-material-learning
      data-material-id={materialId}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void prepare()}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 touch-manipulation"
          data-material-prepare
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          Prepare for learning
        </button>
        <Link
          href={coreHref}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 touch-manipulation"
          data-material-open-core
        >
          <BookOpen className="h-3.5 w-3.5" />
          Open Workspace
        </Link>
        <Link
          href={studyHaulHref(courseId, title)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/60 px-3 py-2 text-sm font-medium text-teal-900 touch-manipulation"
          data-material-open-study-haul
        >
          <Sparkles className="h-3.5 w-3.5" />
          Open Study Haul
        </Link>
      </div>

      {error ? (
        <p
          className="text-xs text-red-700"
          data-material-learning-error
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {learning ? (
        <div
          className="space-y-2"
          data-material-learning-ready
          data-state={learning.state}
        >
          <p className="text-xs text-stone-600" data-material-provenance>
            {learning.provenanceLabel}
          </p>
          <p className="text-sm text-stone-800">{learning.learnerMessage}</p>
          {learning.truncated ? (
            <p className="text-xs text-amber-800">
              Some content was truncated so we could prepare this material. Open
              in CORE to review the full workbook.
            </p>
          ) : null}

          {learning.candidates.length > 0 ? (
            <ul className="space-y-2" data-material-candidates>
              {learning.candidates.map((c) => (
                <li
                  key={c.key}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-2.5 py-2"
                  data-candidate-key={c.key}
                >
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      {c.title}
                    </p>
                    <p className="text-[11px] text-stone-500">{c.status}</p>
                  </div>
                  {c.status === "linked" || c.status === "existing" ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                      <Check className="h-3.5 w-3.5" /> In knowledge
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void confirm(c.key)}
                      disabled={confirmKey === c.key}
                      className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 touch-manipulation"
                      data-material-confirm-concept
                    >
                      {confirmKey === c.key ? "Saving…" : "Confirm concept"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : learning.hasStudyExtract ? (
            <p className="text-xs text-stone-500">
              {learning.knowledgeBridgeEnabled
                ? "No concept candidates yet — open in CORE to enrich, then try again."
                : "Knowledge bridge is off — open in CORE to study this material."}
            </p>
          ) : null}

          {learning.focusConceptId ? (
            <div
              className="flex flex-wrap items-end gap-2"
              data-material-start-learning
            >
              <ContinueLearningButton
                conceptId={learning.focusConceptId}
                materialId={materialId}
                fromNote={learning.noteId}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-800 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60 touch-manipulation"
              />
              <Link
                href={`/study/teach-me?focus=teach&courseId=${encodeURIComponent(courseId)}&materialId=${encodeURIComponent(materialId)}&topic=${encodeURIComponent(title)}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 touch-manipulation"
                data-material-teach-me
              >
                Teach Me
              </Link>
              <Link
                href={`/study/teach-me?focus=tutor&courseId=${encodeURIComponent(courseId)}&materialId=${encodeURIComponent(materialId)}&topic=${encodeURIComponent(title)}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 touch-manipulation"
                data-material-ask-tutor
              >
                Tutor Me
              </Link>
              <Link
                href={`/study/six/hands-on-practice?focus=practice&courseId=${encodeURIComponent(courseId)}&materialId=${encodeURIComponent(materialId)}&topic=${encodeURIComponent(title)}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 touch-manipulation"
                data-material-practice
              >
                Practice
              </Link>
              <Link
                href={`/quizzes?courseId=${encodeURIComponent(courseId)}&materialId=${encodeURIComponent(materialId)}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 touch-manipulation"
                data-material-quiz
              >
                Quiz me
              </Link>
            </div>
          ) : null}

          <p className="text-[11px] text-stone-500">
            Uploading or opening &ldquo;{title}&rdquo; does not count as studying by
            itself — practice, quizzes, and review do.
          </p>
        </div>
      ) : null}
    </section>
  );
}
