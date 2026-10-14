/**
 * 2P-43 — LearnerNextAction from existing LearningAction + Orchestrator reason.
 * Presentation / continuity only — not a planner.
 */

import {
  openLuckyLearningAction,
  resolveUniversalAdaptiveLearningAction,
  type LearningAction,
} from "@/lib/learning/experience/learning-action";
import type { LearnerNextAction } from "./types";

export function learningActionToNextAction(
  action: LearningAction,
  extras?: {
    reason?: string | null;
    source?: LearnerNextAction["source"];
  },
): LearnerNextAction {
  if (action.action === "NONE") {
    return {
      kind: "NONE",
      label: "",
      reason: null,
      source: "none",
    };
  }

  const source =
    extras?.source ??
    (action.action === "CONTINUE_ADAPTIVE"
      ? "adaptive_resume"
      : action.action === "OPEN_LUCKY"
        ? "lucky"
        : "orchestrator");

  return {
    kind: action.action,
    label: action.label,
    href: action.href,
    conceptId: action.conceptId,
    adaptiveRunId: action.runId,
    reason: extras?.reason?.trim() || null,
    source,
  };
}

/**
 * Prefer ACTIVE Adaptive resume, then focus-concept Start learning,
 * then LUCKY when due retention exists (never forced for every weak concept).
 * Deterministic — no randomness. Not a planner.
 */
export function resolveLearnerNextAction(input: {
  conceptId?: string | null;
  activeRunId?: string | null;
  orchestratorReason?: string | null;
  /** Soft LUCKY option — only when Adaptive has nothing to resume/start. */
  dueRetentionAvailable?: boolean;
}): LearnerNextAction {
  const action = resolveUniversalAdaptiveLearningAction({
    conceptId: input.conceptId,
    activeRunId: input.activeRunId,
  });

  if (action.action !== "NONE") {
    const reason =
      input.orchestratorReason?.trim() ||
      (action.action === "CONTINUE_ADAPTIVE"
        ? "Continue where you left off — your Adaptive study is still active."
        : action.action === "START_ADAPTIVE"
          ? "Your recent evidence suggests a useful next practice step."
          : null);
    return learningActionToNextAction(action, {
      reason,
      source:
        action.action === "CONTINUE_ADAPTIVE"
          ? "adaptive_resume"
          : action.action === "START_ADAPTIVE"
            ? "growth_focus"
            : "orchestrator",
    });
  }

  if (input.dueRetentionAvailable === true) {
    return learningActionToNextAction(openLuckyLearningAction(), {
      reason: "You have a retention check ready.",
      source: "lucky",
    });
  }

  return {
    kind: "NONE",
    label: "",
    reason: null,
    source: "none",
  };
}

export function learnerNextActionTruthSummary(): {
  isPlanner: false;
  persistsAiRecommendations: false;
  usesExistingLearningAction: true;
  deterministic: true;
} {
  return {
    isPlanner: false,
    persistsAiRecommendations: false,
    usesExistingLearningAction: true,
    deterministic: true,
  };
}
