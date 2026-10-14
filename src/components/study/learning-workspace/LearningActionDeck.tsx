"use client";

import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";

import { sixApproachTitle } from "@/lib/learning/workspace";
import type { LearningWorkspaceContext } from "@/lib/learning/workspace";
import type { LearningInteraction } from "@/lib/learning/studio";
import { isSelectInteraction } from "@/lib/learning/studio";

type Evaluation = {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  misconceptions: string[];
  nextSteps: string[];
};

/**
 * Bundle G — Action Deck: contextual interaction for the current teaching moment.
 * Select (recognition/transfer) or short-answer via existing evaluate.
 */
export function LearningActionDeck({
  workspace,
  prompt,
  interaction,
  response,
  onResponseChange,
  selectedChoice,
  onSelectChoice,
  onSubmit,
  loading,
  error,
  result,
  remediationLinks,
  onAdvance,
  canAdvance,
  advanceLabel,
  showAdvance,
}: {
  workspace: LearningWorkspaceContext;
  prompt: string;
  interaction?: LearningInteraction | null;
  response: string;
  onResponseChange: (value: string) => void;
  selectedChoice?: number | null;
  onSelectChoice?: (index: number) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
  result: Evaluation | null;
  remediationLinks?: React.ReactNode;
  onAdvance?: () => void;
  canAdvance?: boolean;
  advanceLabel?: string;
  showAdvance?: boolean;
}) {
  const approach = sixApproachTitle(workspace.sixTechnique);
  const isIncorrect = result != null && result.score < 70;
  const isCorrect = result != null && result.score >= 70;
  const selectMode = isSelectInteraction(interaction);
  const taskLabel =
    interaction?.label ??
    (selectMode
      ? "Recognition"
      : interaction?.kind === "transfer"
        ? "Transfer"
        : interaction?.kind === "apply"
          ? "Apply"
          : "Your turn");

  return (
    <aside
      data-learning-action-deck
      data-action-deck-stage={workspace.stage}
      data-interaction-kind={interaction?.kind ?? "explain"}
      className="flex h-full min-h-[18rem] flex-col border-t border-stone-800/10 bg-[#f7f5f1] lg:border-t-0 lg:border-l lg:border-stone-800/10"
      aria-label="Learning interaction"
    >
      <div className="border-b border-stone-800/10 bg-[#efece6] px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-600">
          {taskLabel}
        </p>
        {approach ? (
          <p
            data-six-approach-title
            className="mt-1 text-sm font-semibold text-stone-900"
          >
            {approach}
          </p>
        ) : null}
        {workspace.sixHowMessage ? (
          <p data-six-how-message className="mt-0.5 text-xs text-teal-900">
            {workspace.sixHowMessage}
          </p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <div
          data-action-deck-prompt
          className="border-l-4 border-teal-700 bg-white px-3 py-2.5"
        >
          <p className="text-sm font-medium leading-relaxed text-stone-900 whitespace-pre-wrap">
            {interaction?.prompt ?? prompt}
          </p>
        </div>

        {selectMode ? (
          <div
            data-action-deck-choices
            className="flex flex-col gap-2"
            role="radiogroup"
            aria-label="Choose the best answer"
          >
            {interaction!.choices!.map((choice, index) => {
              const selected = selectedChoice === index;
              return (
                <button
                  key={`${choice}-${index}`}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-choice-index={index}
                  onClick={() => onSelectChoice?.(index)}
                  className={`min-h-11 border px-3 py-2.5 text-left text-sm touch-manipulation ${
                    selected
                      ? "border-teal-800 bg-teal-50 font-semibold text-teal-950"
                      : "border-stone-300 bg-white text-stone-800 hover:border-stone-500"
                  }`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <label className="sr-only" htmlFor="learning-action-response">
              Your response
            </label>
            <textarea
              id="learning-action-response"
              data-learn-explain-panel
              value={response}
              onChange={(e) => onResponseChange(e.target.value)}
              rows={7}
              placeholder="Write your response…"
              className="w-full flex-1 resize-y border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          </>
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={
            loading ||
            (selectMode
              ? selectedChoice == null
              : response.trim().length < 2)
          }
          data-action-deck-submit
          className="inline-flex min-h-11 items-center justify-center gap-2 bg-stone-900 px-4 text-sm font-semibold text-white touch-manipulation hover:bg-stone-800 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden />
          )}
          {loading ? "Checking…" : selectMode ? "Check" : "Submit"}
        </button>

        {error ? (
          <p className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {result ? (
          <div
            data-action-deck-feedback
            data-feedback-state={isCorrect ? "success" : "retry"}
            className={`border px-3 py-3 ${
              isCorrect
                ? "border-teal-400 bg-teal-50"
                : "border-amber-400 bg-amber-50"
            }`}
          >
            <p className="text-sm font-bold text-stone-900">
              {isCorrect ? "That works" : "Not quite"}
            </p>
            <p className="mt-1 text-sm text-stone-800">{result.summary}</p>
            {isIncorrect && result.gaps[0] ? (
              <p className="mt-2 text-sm text-stone-800">{result.gaps[0]}</p>
            ) : null}
            {isIncorrect && result.misconceptions[0] ? (
              <p className="mt-1 text-sm text-amber-950">
                {result.misconceptions[0]}
              </p>
            ) : null}
            {isCorrect && result.strengths[0] ? (
              <p className="mt-2 text-sm text-teal-950">
                <span className="font-semibold">Why: </span>
                {result.strengths[0]}
              </p>
            ) : null}
            {isIncorrect ? (
              <p className="mt-2 text-xs font-medium text-stone-600">
                Revisit the idea above, then try again.
              </p>
            ) : null}
            {remediationLinks}
          </div>
        ) : null}

        {showAdvance && onAdvance ? (
          <button
            type="button"
            onClick={onAdvance}
            disabled={!canAdvance}
            data-learn-continue-step
            data-action-deck-advance
            className="mt-auto inline-flex min-h-11 items-center justify-center bg-teal-800 px-4 text-sm font-semibold text-white touch-manipulation hover:bg-teal-700 disabled:opacity-40"
            title={
              !canAdvance && workspace.formativeRequired
                ? "Complete this interaction before continuing"
                : undefined
            }
          >
            {advanceLabel ?? "Continue"}
          </button>
        ) : null}

        {workspace.experience?.nextAction?.href ? (
          <Link
            href={workspace.experience.nextAction.href}
            data-learn-orchestrated-next-link
            className="inline-flex min-h-11 items-center justify-center border border-teal-800 px-4 text-sm font-semibold text-teal-900 touch-manipulation hover:bg-teal-50"
          >
            {workspace.experience.nextAction.label}
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
