"use client";

import {
  HAUL_WRITING_PHASES,
  HAUL_WRITING_PHASE_LABELS,
  type HaulWritingPhase,
  nextSuggestedHaulPhase,
} from "@/lib/haul/writing/loop-phases";

/**
 * Bundle J — Learn → Plan → Write → Feedback → Revise → Finish strip.
 */
export function HaulWritingPhaseStrip({
  phase,
}: {
  phase: HaulWritingPhase;
}) {
  const next = nextSuggestedHaulPhase(phase);
  return (
    <div
      data-haul-writing-phase-strip
      data-haul-phase={phase}
      className="flex flex-wrap items-center gap-1 border-b border-stone-200 bg-[#faf8f5] px-3 py-2"
      aria-label="Writing learning loop"
    >
      {HAUL_WRITING_PHASES.map((p) => {
        const active = p === phase;
        const past =
          HAUL_WRITING_PHASES.indexOf(p) < HAUL_WRITING_PHASES.indexOf(phase);
        return (
          <span
            key={p}
            data-phase={p}
            data-phase-active={active ? "true" : "false"}
            className={`inline-flex min-h-9 items-center px-2 text-[11px] font-semibold uppercase tracking-wide ${
              active
                ? "bg-stone-900 text-white"
                : past
                  ? "text-teal-800"
                  : "text-stone-400"
            }`}
          >
            {HAUL_WRITING_PHASE_LABELS[p]}
            {p !== "finish" ? (
              <span className="ml-2 text-stone-300" aria-hidden>
                →
              </span>
            ) : null}
          </span>
        );
      })}
      {next ? (
        <span className="ml-auto text-[10px] text-stone-500">
          Suggested next: {HAUL_WRITING_PHASE_LABELS[next]}
        </span>
      ) : null}
    </div>
  );
}
