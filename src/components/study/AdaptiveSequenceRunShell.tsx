"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import type { AdaptiveRunPageView } from "@/lib/learning/sequence/adaptive-run-page";
import { coreNotebookReturnHref } from "@/lib/learning/orchestrator/core-adaptive-bridge";
import { MaterialSourceCitation } from "@/components/study/MaterialSourceCitation";

const CORE_RETURN_NOTE_KEY = "studyhaul:coreReturnNoteId";

function rememberCoreReturnNote(noteId: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CORE_RETURN_NOTE_KEY, noteId);
  } catch {
    /* ignore quota / private mode */
  }
}

function readStoredCoreReturnNote(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(CORE_RETURN_NOTE_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Phase 2G-9/2G-10 — Adaptive Sequence run shell.
 * Complete / Abandon call thin APIs that use existing coordinator lifecycle.
 */
export function AdaptiveSequenceRunShell({
  view,
  fromNoteId = null,
}: {
  view: Exclude<AdaptiveRunPageView, { kind: "not_found" }>;
  /** Optional CORE note id for Back to notebook (from ?fromNote=). */
  fromNoteId?: string | null;
}) {
  const router = useRouter();
  const fromProp = fromNoteId?.trim() || null;
  // Read sessionStorage once on mount (client). Avoid setState-in-effect.
  const [storedNoteId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : readStoredCoreReturnNote(),
  );
  useEffect(() => {
    if (fromProp) rememberCoreReturnNote(fromProp);
  }, [fromProp]);
  const resolvedNoteId = fromProp || storedNoteId;
  const notebookHref = resolvedNoteId
    ? coreNotebookReturnHref(resolvedNoteId)
    : null;
  const [busy, setBusy] = useState<"complete" | "abandon" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function postLifecycle(action: "complete" | "abandon") {
    if (busy) return;
    setBusy(action);
    setActionError(null);
    try {
      const response = await fetch(
        `/api/study/adaptive/${view.runId}/${action}`,
        {
          method: "POST",
          credentials: "same-origin",
        },
      );
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };
      if (!response.ok || !data.success) {
        setActionError(data.error ?? `Could not ${action} adaptive study.`);
        return;
      }
      router.refresh();
    } catch {
      setActionError(`Could not ${action} adaptive study.`);
    } finally {
      setBusy(null);
    }
  }

  if (view.kind === "completed") {
    return (
      <section
        data-adaptive-run
        data-adaptive-status="COMPLETED"
        className="mx-auto max-w-lg rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Adaptive study
        </p>
        <h1 className="mt-2 text-xl font-bold text-stone-900">
          Adaptive study complete
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          You completed this adaptive learning run for “{view.conceptTitle}.”
          Study Haul may schedule retention practice when this concept needs
          review.
        </p>
        {view.materialCitation ? (
          <div className="mt-4">
            <MaterialSourceCitation citation={view.materialCitation} compact />
          </div>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href="/study/lucky"
            data-adaptive-lucky-handoff
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white touch-manipulation hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Open Lucky retention
          </Link>
          {notebookHref ? (
            <Link
              href={notebookHref}
              data-adaptive-return-core
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-700 bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 touch-manipulation hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Back to notebook
            </Link>
          ) : null}
          <Link
            href="/study"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 touch-manipulation hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Back to Study Hub
          </Link>
        </div>
      </section>
    );
  }

  if (view.kind === "abandoned") {
    return (
      <section
        data-adaptive-run
        data-adaptive-status="ABANDONED"
        className="mx-auto max-w-lg rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Adaptive study
        </p>
        <h1 className="mt-2 text-xl font-bold text-stone-900">
          This adaptive run was stopped
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          “{view.conceptTitle}” is no longer an active adaptive study. Start a
          new adaptive study from Study Hub when you are ready.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {notebookHref ? (
            <Link
              href={notebookHref}
              data-adaptive-return-core
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-700 bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 touch-manipulation hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Back to notebook
            </Link>
          ) : null}
          <Link
            href="/study"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 touch-manipulation hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Back to Study Hub
          </Link>
        </div>
      </section>
    );
  }

  if (view.kind === "unavailable") {
    return (
      <section
        data-adaptive-run
        data-adaptive-status="unavailable"
        className="mx-auto max-w-lg rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <h1 className="text-xl font-bold text-stone-900">Adaptive study</h1>
        <p className="mt-2 text-sm text-stone-600">{view.reason}</p>
        <Link
          href="/study"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 touch-manipulation"
        >
          Back to Study Hub
        </Link>
      </section>
    );
  }

  // ACTIVE
  return (
    <section
      data-adaptive-run
      data-adaptive-status="ACTIVE"
      className="mx-auto max-w-lg rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        Adaptive study
      </p>
      <h1 className="mt-2 text-xl font-bold text-stone-900">
        {view.conceptTitle}
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        Step {view.stepNumber} of {view.totalSteps}
      </p>

      {"materialCitation" in view && view.materialCitation ? (
        <div className="mt-4">
          <MaterialSourceCitation citation={view.materialCitation} />
        </div>
      ) : null}

      {view.learnerState &&
      (view.learnerState.whyThisStep || view.learnerState.masterySummary) ? (
        <div
          data-adaptive-learner-state
          className="mt-4 rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-3"
        >
          {view.learnerState.whyThisStep ? (
            <div data-adaptive-why-this-step>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Why this step?
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-stone-700">
                {view.materialCitation
                  ? `${view.learnerState.whyThisStep}\n\n${view.materialCitation.provenanceLabel}`
                  : view.learnerState.whyThisStep}
              </p>
            </div>
          ) : null}
          {view.learnerState.masterySummary ? (
            <div
              data-adaptive-mastery-summary
              className={view.learnerState.whyThisStep ? "mt-3" : undefined}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Your learning progress
              </p>
              <p className="mt-1 text-sm text-stone-700">
                {view.learnerState.masterySummary.stateLabel.replace(
                  /^(Current learning state|Concept mastery):\s*/i,
                  "",
                )}
              </p>
              {view.learnerState.masterySummary.focusHint ? (
                <p className="mt-1 text-xs text-stone-500">
                  {view.learnerState.masterySummary.focusHint}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {view.activityTitle ? (
        <p className="mt-4 text-base font-semibold text-teal-800">
          {view.activityTitle}
        </p>
      ) : (
        <p className="mt-4 text-base font-semibold text-stone-800">
          Next activity: {view.intervention}
        </p>
      )}

      {view.activityDescription ? (
        <p className="mt-2 text-sm text-stone-600">{view.activityDescription}</p>
      ) : null}

      {view.stopNotice ? (
        <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
          {view.stopNotice}
        </p>
      ) : null}

      {view.sixUnavailableReason ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {view.sixUnavailableReason}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {view.sixHref ? (
          <Link
            href={view.sixHref}
            data-adaptive-continue-six
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white touch-manipulation hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Continue with this activity
          </Link>
        ) : (
          <p className="w-full text-sm text-stone-600">
            There is no launchable activity for this step right now. You can
            finish this adaptive run or abandon and start fresh from Study Hub.
          </p>
        )}
        <button
          type="button"
          data-adaptive-complete
          disabled={busy != null}
          onClick={() => void postLifecycle("complete")}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-700 bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 touch-manipulation hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-60"
        >
          {busy === "complete" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Completing…
            </>
          ) : view.sixHref ? (
            "Complete adaptive study"
          ) : (
            "Finish adaptive study"
          )}
        </button>
        <button
          type="button"
          data-adaptive-abandon
          disabled={busy != null}
          onClick={() => void postLifecycle("abandon")}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 touch-manipulation hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-60"
        >
          {busy === "abandon" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Stopping…
            </>
          ) : (
            "Abandon run"
          )}
        </button>
        <Link
          href="/study"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 touch-manipulation hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Back to Study Hub
        </Link>
        {notebookHref ? (
          <Link
            href={notebookHref}
            data-adaptive-return-core
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-700 bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 touch-manipulation hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Back to notebook
          </Link>
        ) : null}
      </div>

      {actionError ? (
        <p className="mt-3 text-sm text-rose-700" role="alert">
          {actionError}
        </p>
      ) : null}
    </section>
  );
}
