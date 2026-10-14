"use client";

import { useCallback, useState } from "react";

import type { HaulWritingAiAction } from "@/lib/haul/writing/ai-actions";

/**
 * Proposal panel — AI output never auto-overwrites learner text.
 */
export function HaulWritingProposal({
  original,
  proposal,
  busy,
  error,
  onReplace,
  onInsertBelow,
  onCopy,
  onTryAnother,
  onDismiss,
}: {
  original?: string;
  proposal: string | null;
  busy?: boolean;
  error?: string | null;
  onReplace: () => void;
  onInsertBelow: () => void;
  onCopy: () => void;
  onTryAnother: () => void;
  onDismiss: () => void;
}) {
  if (!proposal && !busy && !error) return null;

  return (
    <div
      data-haul-writing-proposal
      className="mt-3 space-y-3 rounded-2xl border border-orange-200 bg-orange-50/60 p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
          Proposal
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-semibold text-stone-500 hover:text-stone-800"
        >
          Dismiss
        </button>
      </div>
      {busy ? (
        <p className="text-sm text-stone-600">Generating…</p>
      ) : error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : (
        <>
          {original?.trim() ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Original
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-stone-600">{original}</p>
            </div>
          ) : null}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Proposed
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-stone-900">{proposal}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onReplace}
              className="min-h-11 rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white touch-manipulation"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onInsertBelow}
              className="min-h-11 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 touch-manipulation"
            >
              Insert below
            </button>
            <button
              type="button"
              onClick={onCopy}
              className="min-h-11 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 touch-manipulation"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={onTryAnother}
              className="min-h-11 rounded-xl border border-dashed border-stone-300 px-3 py-2 text-xs font-semibold text-stone-600 touch-manipulation"
            >
              Try another
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function useHaulWritingAi() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<HaulWritingAiAction | null>(null);
  const [lastPayload, setLastPayload] = useState<Record<string, unknown> | null>(
    null,
  );

  const run = useCallback(async (payload: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    setLastPayload(payload);
    setLastAction((payload.action as HaulWritingAiAction) ?? null);
    try {
      const res = await fetch("/api/haul/writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        success?: boolean;
        proposal?: string;
        error?: string;
        aiAvailable?: boolean;
      };
      if (!res.ok || !data.success || !data.proposal) {
        setProposal(null);
        setError(
          data.error ??
            (data.aiAvailable === false
              ? "AI unavailable. You can still write with the template."
              : "Could not generate a proposal."),
        );
        return null;
      }
      setProposal(data.proposal);
      return data.proposal;
    } catch {
      setProposal(null);
      setError("AI unavailable. You can still write with the template.");
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const retry = useCallback(async () => {
    if (!lastPayload) return null;
    return run(lastPayload);
  }, [lastPayload, run]);

  const clear = useCallback(() => {
    setProposal(null);
    setError(null);
  }, []);

  return { busy, error, proposal, lastAction, run, retry, clear, setProposal };
}
