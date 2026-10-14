"use client";

/**
 * Bundle G — Learning Studio stage strip.
 * Shows Understand → Explore → Try → Apply → Transfer as journey states
 * (not room navigation pills).
 */

import {
  STUDIO_STAGE_SEQUENCE,
  studioStageLabel,
  type LearningStudioStage,
} from "@/lib/learning/studio";

export function LearningStudioStageStrip({
  active,
}: {
  active: LearningStudioStage;
}) {
  const visible = STUDIO_STAGE_SEQUENCE.filter((s) => s !== "recall");
  return (
    <nav
      data-learning-studio-stage-strip
      aria-label="Learning stage"
      className="flex flex-wrap items-center gap-1 border-b border-stone-200 pb-3"
    >
      {visible.map((stage, i) => {
        const isActive = stage === active;
        const activeIndex = visible.findIndex((s) => s === active);
        const past = activeIndex >= 0 && i < activeIndex;
        return (
          <span key={stage} className="inline-flex items-center gap-1">
            {i > 0 ? (
              <span className="text-stone-300" aria-hidden>
                →
              </span>
            ) : null}
            <span
              data-studio-stage={stage}
              data-studio-stage-active={isActive ? "true" : "false"}
              className={`text-[11px] font-semibold tracking-wide ${
                isActive
                  ? "text-teal-900 underline decoration-teal-600 decoration-2 underline-offset-4"
                  : past
                    ? "text-stone-500"
                    : "text-stone-400"
              }`}
            >
              {studioStageLabel(stage)}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
