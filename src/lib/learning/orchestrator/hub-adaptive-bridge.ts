/**
 * Phase 2G-59 — Study Hub → Adaptive closed-loop bridge (pure helpers).
 * 2P-25 — Start vs Continue labels unified via LearningAction contract.
 *
 * Hub is an ENTRY POINT only: resolve primary Adaptive start/resume CTA and
 * optional secondary direct SIX link. Does not diagnose, write evidence,
 * update mastery, re-orchestrate, or manage AdaptiveSequenceRun state.
 */

export type HubAdaptivePrimaryCta =
  | {
      kind: "resume";
      runId: string;
      label: "Continue learning";
      href: string;
    }
  | {
      kind: "start";
      conceptId: string;
      label: "Start learning";
    }
  | { kind: "none" };

export type HubDirectSixSecondaryCta = {
  href: string;
  /** Existing Orchestrator action label (e.g. "Try it"). */
  label: string;
};

/**
 * Primary Hub learning CTA: enter/resume the Adaptive closed loop.
 * Never fabricates conceptId or runId.
 *
 * Semantics (2P-25):
 * - active run → Continue learning
 * - concept only → Start learning
 * - neither → none (preserve existing fallbacks elsewhere)
 */
export function resolveHubAdaptivePrimaryCta(input: {
  conceptId?: string | null;
  activeRunId?: string | null;
}): HubAdaptivePrimaryCta {
  const runId =
    typeof input.activeRunId === "string" ? input.activeRunId.trim() : "";
  if (runId) {
    return {
      kind: "resume",
      runId,
      label: "Continue learning",
      href: `/study/adaptive/${runId}`,
    };
  }

  const conceptId =
    typeof input.conceptId === "string" ? input.conceptId.trim() : "";
  if (!conceptId) {
    return { kind: "none" };
  }

  return {
    kind: "start",
    conceptId,
    label: "Start learning",
  };
}

/**
 * Secondary manual path: existing Orchestrator SIX deep link.
 * Preserved when href + actionLabel are present.
 */
export function resolveHubDirectSixSecondaryCta(input: {
  href?: string | null;
  actionLabel?: string | null;
}): HubDirectSixSecondaryCta | null {
  const href = typeof input.href === "string" ? input.href.trim() : "";
  const label =
    typeof input.actionLabel === "string" ? input.actionLabel.trim() : "";
  if (!href || !label) return null;
  return { href, label };
}

/** Adaptive run page path for a known run id (no side effects). */
export function hubAdaptiveRunHref(runId: string): string {
  return `/study/adaptive/${runId.trim()}`;
}
