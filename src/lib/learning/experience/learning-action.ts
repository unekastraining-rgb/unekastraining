/**
 * 2P-25 — Universal Learning Action (presentation / navigation only).
 *
 * Does NOT write evidence, mastery, recommendations, Adaptive runs, or activity results.
 * Wraps the existing Hub Adaptive CTA contract for consistent Start vs Continue labels.
 */

import {
  hubAdaptiveRunHref,
  resolveHubAdaptivePrimaryCta,
  resolveHubDirectSixSecondaryCta,
  type HubAdaptivePrimaryCta,
  type HubDirectSixSecondaryCta,
} from "@/lib/learning/orchestrator/hub-adaptive-bridge";

/** Canonical learner-facing Adaptive CTA labels (2P-25). */
export const LEARNING_ACTION_START_LABEL = "Start learning" as const;
export const LEARNING_ACTION_CONTINUE_LABEL = "Continue learning" as const;
export const LEARNING_ACTION_VIEW_PROGRESS_LABEL = "View progress" as const;
export const LEARNING_ACTION_TRY_AGAIN_LABEL = "Practice again" as const;
export const LEARNING_ACTION_RETAIN_LABEL = "Open Lucky retention" as const;

/**
 * 2P-33 — Context-sensitive Adaptive CTA label (presentation only).
 * Does not invent resumable state — callers pass whether an ACTIVE run exists.
 */
export function adaptiveLearningActionLabel(hasActiveRun: boolean): string {
  return hasActiveRun
    ? LEARNING_ACTION_CONTINUE_LABEL
    : LEARNING_ACTION_START_LABEL;
}

export type LearningActionKind =
  | "START_ADAPTIVE"
  | "CONTINUE_ADAPTIVE"
  | "OPEN_ACTIVITY"
  | "OPEN_CORE"
  | "OPEN_SIX"
  | "OPEN_TUTOR"
  | "OPEN_LUCKY"
  | "OPEN_HUB"
  | "NONE";

/**
 * Presentation-only learning action. Never executes learning logic.
 * IDs are opaque navigation handles — not for learner-facing display.
 */
export type LearningAction = {
  action: LearningActionKind;
  label: string;
  href?: string;
  /** Opaque — do not render to learners. */
  conceptId?: string;
  /** Opaque — do not render to learners. */
  learningSpaceId?: string;
  /** Opaque ACTIVE Adaptive run id — do not render to learners. */
  runId?: string;
};

export function resolveUniversalAdaptiveLearningAction(input: {
  conceptId?: string | null;
  activeRunId?: string | null;
}): LearningAction {
  const hub = resolveHubAdaptivePrimaryCta(input);
  if (hub.kind === "none") {
    return { action: "NONE", label: "" };
  }
  if (hub.kind === "resume") {
    return {
      action: "CONTINUE_ADAPTIVE",
      label: LEARNING_ACTION_CONTINUE_LABEL,
      href: hub.href,
      runId: hub.runId,
    };
  }
  return {
    action: "START_ADAPTIVE",
    label: LEARNING_ACTION_START_LABEL,
    conceptId: hub.conceptId,
  };
}

/** Map Hub CTA shape → universal action (same semantics, unified labels). */
export function learningActionFromHubCta(
  cta: HubAdaptivePrimaryCta,
): LearningAction {
  if (cta.kind === "none") return { action: "NONE", label: "" };
  if (cta.kind === "resume") {
    return {
      action: "CONTINUE_ADAPTIVE",
      label: LEARNING_ACTION_CONTINUE_LABEL,
      href: cta.href,
      runId: cta.runId,
    };
  }
  return {
    action: "START_ADAPTIVE",
    label: LEARNING_ACTION_START_LABEL,
    conceptId: cta.conceptId,
  };
}

export function openActivityLearningAction(input: {
  label: string;
  href: string;
  conceptId?: string | null;
}): LearningAction {
  return {
    action: "OPEN_ACTIVITY",
    label: input.label.trim() || "Open activity",
    href: input.href.trim(),
    conceptId: input.conceptId?.trim() || undefined,
  };
}

export function openSixLearningAction(
  six: HubDirectSixSecondaryCta | null,
): LearningAction | null {
  if (!six) return null;
  return {
    action: "OPEN_SIX",
    label: six.label,
    href: six.href,
  };
}

export function openCoreLearningAction(noteId?: string | null): LearningAction {
  const id = typeof noteId === "string" ? noteId.trim() : "";
  return {
    action: "OPEN_CORE",
    label: "Open Core",
    href: id ? `/core?noteId=${encodeURIComponent(id)}` : "/core",
  };
}

export function openLuckyLearningAction(): LearningAction {
  return {
    action: "OPEN_LUCKY",
    label: "Open Lucky retention",
    href: "/study/lucky",
  };
}

export function openHubLearningAction(): LearningAction {
  return {
    action: "OPEN_HUB",
    label: "Open Study Hub",
    href: "/study",
  };
}

export function openTutorLearningAction(input?: {
  conceptId?: string | null;
}): LearningAction {
  const conceptId =
    typeof input?.conceptId === "string" ? input.conceptId.trim() : "";
  return {
    action: "OPEN_TUTOR",
    label: "Open Tutor",
    href: conceptId
      ? `/study/teach-me?conceptId=${encodeURIComponent(conceptId)}`
      : "/study/teach-me",
    conceptId: conceptId || undefined,
  };
}

/** Re-export secondary SIX resolver for callers that need both. */
export function resolveSixSecondaryAction(input: {
  href?: string | null;
  actionLabel?: string | null;
}): LearningAction | null {
  return openSixLearningAction(resolveHubDirectSixSecondaryCta(input));
}

export function adaptiveRunHrefForAction(runId: string): string {
  return hubAdaptiveRunHref(runId);
}

/**
 * Learner-facing surfaces must not render opaque ids.
 * Returns true when a string looks like an internal id leak.
 */
export function containsInternalLearningIdLeak(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return (
    /\b(LearningAttempt|ConceptMastery|AdaptiveSequenceRun|adapterKey|evidenceEnvelope|subjectDomain)\b/i.test(
      t,
    ) ||
    /\b(UNDERSTANDING_GAP|APPLICATION_GAP|RECALL_GAP|RETENTION_GAP|INSUFFICIENT_EVIDENCE)\b/.test(
      t,
    ) ||
    /\b(cm[a-z0-9]{20,})\b/i.test(t)
  );
}
