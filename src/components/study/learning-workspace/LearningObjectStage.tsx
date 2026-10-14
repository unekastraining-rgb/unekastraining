"use client";

import { Loader2 } from "lucide-react";

import { ActivityRuntime } from "@/components/study/activities";
import type { LearningObject } from "@/lib/learning/studio/learning-objects";
import type { LearningInteraction } from "@/lib/learning/studio";
import { isSelectInteraction } from "@/lib/learning/studio";
import { studioStageLabel, type LearningStudioStage } from "@/lib/learning/studio";
import type {
  InteractiveActivity,
  InteractiveFeedback,
  InteractiveSubmission,
} from "@/lib/learning/activity/runtime";

type Evaluation = {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  misconceptions: string[];
  nextSteps: string[];
};

/**
 * Bundle G UX — Dominant Learning Stage.
 * Renders one learning object + in-stage interaction (no side questionnaire).
 */
export function LearningObjectStage({
  object,
  studioStage,
  response,
  onResponseChange,
  selectedChoice,
  onSelectChoice,
  onSubmit,
  loading,
  error,
  result,
  onAdvance,
  canAdvance,
  advanceLabel,
  showAdvance,
  momentIndex,
  momentTotal,
  onPrev,
  onNext,
  hasPrev,
  remediationLinks,
  interactiveActivity,
  onInteractiveComplete,
}: {
  object: LearningObject;
  studioStage: LearningStudioStage;
  response: string;
  onResponseChange: (value: string) => void;
  selectedChoice: number | null;
  onSelectChoice: (index: number) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
  result: Evaluation | null;
  onAdvance?: () => void;
  canAdvance?: boolean;
  advanceLabel?: string;
  showAdvance?: boolean;
  momentIndex: number;
  momentTotal: number;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  remediationLinks?: React.ReactNode;
  /** Bundle I — KL-backed interactive runtime (takes over stage interaction when set). */
  interactiveActivity?: InteractiveActivity | null;
  onInteractiveComplete?: (
    submission: InteractiveSubmission,
    feedback: InteractiveFeedback,
  ) => void;
}) {
  const isAssess =
    object.kind === "assessment" ||
    object.treatment === "assessment" ||
    object.kind === "feedback" ||
    Boolean(interactiveActivity);
  const showRuntime =
    Boolean(interactiveActivity) && object.kind !== "feedback";
  const showInteraction =
    !showRuntime &&
    Boolean(object.interaction) &&
    object.kind !== "feedback";
  const interaction = object.interaction;
  const selectMode = isSelectInteraction(interaction);
  const isIncorrect = result != null && result.score < 70;
  const isCorrect = result != null && result.score >= 70;

  return (
    <section
      data-learning-stage
      data-learning-object={object.kind}
      data-learn-teaching-panel
      data-learn-teaching-sequence
      data-studio-stage={studioStage}
      data-activity-runtime-active={showRuntime ? "true" : "false"}
      className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto ${
        isAssess ? "bg-[#f3f1ec]" : "bg-[#f7f5f1]"
      }`}
    >
      {/* Bundle L — immersive stage: wider frame for diagrams/activities; prose stays readable */}
      <div
        className={`mx-auto flex w-full flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8 ${
          showRuntime
            ? "max-w-5xl xl:max-w-6xl"
            : "max-w-4xl xl:max-w-5xl"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            data-learning-object-label
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500"
          >
            {object.objectLabel}
          </p>
          <p className="text-[11px] font-medium text-stone-400">
            {studioStageLabel(studioStage)}
            {momentTotal > 1
              ? ` · ${momentIndex + 1}/${momentTotal}`
              : null}
          </p>
        </div>

        <h2
          data-learn-concept-content
          className="mt-3 font-serif text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl"
        >
          {object.title}
        </h2>

        {object.lead ? (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-700">
            {object.lead}
          </p>
        ) : null}

        {/* Dominant learning object body */}
        <div className="mt-8 flex-1">
          {object.treatment === "diagram" && object.primary ? (
            <VisualModel body={object.primary} />
          ) : null}

          {object.treatment === "comparison" && object.primary ? (
            <ComparisonObject
              primary={object.primary}
              secondary={object.secondary}
              contrast={object.contrast}
            />
          ) : null}

          {object.treatment === "code" && object.primary ? (
            <pre
              data-learning-object-body="code"
              className="overflow-x-auto border border-stone-800/20 bg-stone-950 px-5 py-4 font-mono text-sm leading-relaxed text-teal-100"
            >
              {object.primary}
            </pre>
          ) : null}

          {object.treatment === "steps" && object.primary ? (
            <pre
              data-learning-object-body="steps"
              className="whitespace-pre-wrap border-l-4 border-stone-800 bg-white px-5 py-4 font-mono text-sm leading-relaxed text-stone-800"
            >
              {object.primary}
            </pre>
          ) : null}

          {object.treatment === "scenario" && object.primary ? (
            <div
              data-learning-object-body="scenario"
              className="border border-stone-800/15 bg-white px-5 py-5"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
                Scenario
              </p>
              <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-stone-900">
                {object.primary}
              </p>
            </div>
          ) : null}

          {object.treatment === "prose" && !object.primary ? null : null}

          {object.treatment === "prose" && object.primary ? (
            <VisualModel body={object.primary} />
          ) : null}

          {object.treatment === "assessment" && object.primary && !showInteraction ? (
            <p className="text-lg font-medium text-stone-900">{object.primary}</p>
          ) : null}

          {object.kind === "feedback" && result ? (
            <FeedbackObject result={result} isCorrect={isCorrect} isIncorrect={isIncorrect} />
          ) : null}

          {object.secondary &&
          object.treatment !== "comparison" &&
          object.treatment !== "code" ? (
            <p className="mt-4 text-sm leading-relaxed text-stone-600 whitespace-pre-wrap">
              {object.secondary}
            </p>
          ) : null}

          {object.contrast && object.treatment !== "comparison" ? (
            <p className="mt-4 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {object.contrast}
            </p>
          ) : null}
        </div>

        {/* Bundle I — KL-backed interactive runtime in the Learning Stage */}
        {showRuntime && interactiveActivity ? (
          <ActivityRuntime
            activity={interactiveActivity}
            loading={loading}
            onComplete={(submission, feedback) => {
              onInteractiveComplete?.(submission, feedback);
            }}
          />
        ) : null}

        {/* In-stage interaction — not a side questionnaire */}
        {showInteraction && interaction ? (
          <div
            data-in-stage-interaction
            data-interaction-kind={interaction.kind}
            className="mt-10 border-t border-stone-800/10 pt-8"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-900">
              {interaction.label ?? "Your turn"}
            </p>
            <p className="mt-2 text-lg font-medium leading-snug text-stone-950 whitespace-pre-wrap">
              {interaction.prompt}
            </p>

            {selectMode ? (
              <div
                data-action-deck-choices
                className="mt-5 grid gap-2 sm:grid-cols-1"
                role="radiogroup"
                aria-label="Choose an answer"
              >
                {interaction.choices!.map((choice, index) => {
                  const selected = selectedChoice === index;
                  return (
                    <button
                      key={`${choice}-${index}`}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      data-choice-index={index}
                      onClick={() => onSelectChoice(index)}
                      className={`min-h-12 border px-4 py-3 text-left text-sm touch-manipulation ${
                        selected
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-300 bg-white text-stone-800 hover:border-stone-500"
                      }`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            ) : (
              <textarea
                data-learn-explain-panel
                value={response}
                onChange={(e) => onResponseChange(e.target.value)}
                rows={5}
                placeholder="Write your response…"
                className="mt-5 w-full resize-y border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 focus:border-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            )}

            <button
              type="button"
              data-action-deck-submit
              onClick={onSubmit}
              disabled={
                loading ||
                (selectMode
                  ? selectedChoice == null
                  : response.trim().length < 2)
              }
              className="mt-4 inline-flex min-h-12 min-w-[8rem] items-center justify-center gap-2 bg-stone-900 px-6 text-sm font-semibold text-white touch-manipulation hover:bg-stone-800 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {loading ? "Checking…" : "Submit"}
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {result && object.kind !== "feedback" ? (
          <div
            data-action-deck-feedback
            data-feedback-state={isCorrect ? "success" : "retry"}
            className={`mt-6 border px-4 py-4 ${
              isCorrect
                ? "border-teal-500 bg-teal-50"
                : "border-amber-500 bg-amber-50"
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
              <p className="mt-2 text-sm text-teal-950">{result.strengths[0]}</p>
            ) : null}
            {remediationLinks}
          </div>
        ) : null}

        {result && object.kind === "feedback" ? remediationLinks : null}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-stone-800/10 pt-5">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={onPrev}
            className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-stone-600 touch-manipulation hover:bg-stone-200/50 disabled:opacity-30"
          >
            Previous
          </button>
          {showAdvance && onAdvance ? (
            <button
              type="button"
              data-learn-continue-step
              data-action-deck-advance
              onClick={onAdvance}
              disabled={!canAdvance}
              className="inline-flex min-h-12 items-center bg-teal-800 px-5 text-sm font-semibold text-white touch-manipulation hover:bg-teal-700 disabled:opacity-40"
            >
              {advanceLabel ?? "Continue"}
            </button>
          ) : onNext ? (
            <button
              type="button"
              data-learn-continue-step
              onClick={onNext}
              className="inline-flex min-h-12 items-center bg-teal-800 px-5 text-sm font-semibold text-white touch-manipulation hover:bg-teal-700"
            >
              Continue
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function VisualModel({ body }: { body: string }) {
  const parts = body.split(/\s*→\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return (
      <div
        data-learning-object-body="visual-model"
        className="flex flex-wrap items-center justify-center gap-2 border border-stone-800/10 bg-white px-4 py-8 sm:gap-3 sm:px-8"
      >
        {parts.map((part, i) => (
          <span key={`${part}-${i}`} className="inline-flex items-center gap-2 sm:gap-3">
            <span
              className={`min-h-11 px-3 py-2 text-center text-sm font-semibold sm:px-4 ${
                part.startsWith("●")
                  ? "bg-stone-900 text-white"
                  : "bg-[#efece6] text-stone-900"
              }`}
            >
              {part.replace(/^●\s*/, "")}
            </span>
            {i < parts.length - 1 ? (
              <span className="text-stone-400" aria-hidden>
                →
              </span>
            ) : null}
          </span>
        ))}
      </div>
    );
  }
  return (
    <pre
      data-learning-object-body="visual-model"
      className="whitespace-pre-wrap border border-stone-800/10 bg-white px-5 py-6 font-mono text-sm leading-relaxed text-stone-800"
    >
      {body}
    </pre>
  );
}

function ComparisonObject({
  primary,
  secondary,
  contrast,
}: {
  primary: string;
  secondary?: string;
  contrast?: string;
}) {
  const lines = primary.split(/\n|→|↔/).map((l) => l.trim()).filter(Boolean);
  const left = lines[0] ?? primary;
  const right = lines[1] ?? secondary ?? contrast ?? "";
  return (
    <div
      data-learning-object-body="comparison"
      className="grid gap-3 sm:grid-cols-2"
    >
      <div className="border border-stone-800/15 bg-white px-4 py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-800">
          This idea
        </p>
        <p className="mt-2 text-sm font-medium leading-relaxed text-stone-900">
          {left}
        </p>
      </div>
      <div className="border border-amber-300/80 bg-amber-50/80 px-4 py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-900">
          Not this
        </p>
        <p className="mt-2 text-sm font-medium leading-relaxed text-amber-950">
          {right || contrast || "A nearby but different idea"}
        </p>
      </div>
    </div>
  );
}

function FeedbackObject({
  result,
  isCorrect,
  isIncorrect,
}: {
  result: Evaluation;
  isCorrect: boolean;
  isIncorrect: boolean;
}) {
  return (
    <div
      data-learning-object-body="feedback"
      data-action-deck-feedback
      data-feedback-state={isCorrect ? "success" : "retry"}
      className={`border px-5 py-6 ${
        isCorrect ? "border-teal-500 bg-teal-50" : "border-amber-500 bg-amber-50"
      }`}
    >
      <p className="text-xl font-bold text-stone-950">
        {isCorrect ? "That works" : "Not quite"}
      </p>
      <p className="mt-2 text-base text-stone-800">{result.summary}</p>
      {isIncorrect && result.gaps[0] ? (
        <p className="mt-3 text-sm text-stone-800">{result.gaps[0]}</p>
      ) : null}
      {isIncorrect && result.misconceptions[0] ? (
        <p className="mt-2 text-sm text-amber-950">{result.misconceptions[0]}</p>
      ) : null}
      {isCorrect && result.strengths[0] ? (
        <p className="mt-3 text-sm text-teal-950">
          <span className="font-semibold">Why: </span>
          {result.strengths[0]}
        </p>
      ) : null}
    </div>
  );
}

/** Keep type import used for future interaction props. */
export type { LearningInteraction };
