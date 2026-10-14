"use client";

import type { LearnerContextPresentation } from "@/lib/learning/universal-learner-context";

/**
 * 2P-29 — Optional learner context lines (presentation only).
 * Renders nothing when empty — cold start / no context safe.
 */
export function LearnerContextStrip({
  presentation,
}: {
  presentation: LearnerContextPresentation | null | undefined;
}) {
  if (!presentation?.lines?.length) return null;

  return (
    <aside
      className="rounded-xl border border-stone-200 bg-stone-50/90 px-3 py-3"
      data-learner-context-strip
      aria-label="Your learning context"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
        Your learning context
      </p>
      <ul className="mt-1.5 space-y-1">
        {presentation.lines.map((line) => (
          <li key={line} className="text-sm text-stone-800">
            {line}
          </li>
        ))}
      </ul>
    </aside>
  );
}
