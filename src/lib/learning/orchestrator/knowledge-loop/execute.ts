/**
 * Phase 5 — Translate Orchestrator decisions into executable Study Haul actions.
 * Does NOT re-decide. Does NOT mutate learner state.
 */

import { findKnowledgeConceptById } from "@/lib/learning/learner-state/concept-identity";
import {
  resolveKnowledgeActionDestination,
  toOrchestrationApiView,
} from "@/lib/learning/orchestrator/knowledge-loop/destinations";
import type {
  KnowledgeActionDestination,
  KnowledgeLearningAction,
  KnowledgeOrchestrationApiView,
  KnowledgeOrchestratorDecision,
  KnowledgeOrchestratorReasonCode,
} from "@/lib/learning/orchestrator/knowledge-loop/types";
import type { StudyRoomContext } from "@/lib/study/resolve-study-room";

export type LearningActionExecutionKind =
  | "learn"
  | "practice"
  | "remember"
  | "complete";

export type LearningActionExecution = {
  action: KnowledgeLearningAction;
  conceptId: string | null;
  nextConceptId?: string | null;
  reasonCode: KnowledgeOrchestratorReasonCode;
  destination: {
    kind: LearningActionExecutionKind;
    href: string | null;
    room?: KnowledgeActionDestination["room"];
  };
  /** Learner-facing CTA — no reason codes / counts / concept ids. */
  learnerLabel: string;
  /** Optional short supporting sentence for UI. */
  learnerHint?: string;
};

function executionKind(
  action: KnowledgeLearningAction,
): LearningActionExecutionKind {
  switch (action) {
    case "teach":
    case "reteach":
    case "advance":
      return "learn";
    case "practice":
      return "practice";
    case "recall":
      return "remember";
    case "complete":
      return "complete";
  }
}

function learnerFacingCopy(decision: KnowledgeOrchestratorDecision): {
  label: string;
  hint?: string;
} {
  switch (decision.action) {
    case "teach":
      return {
        label: "Continue learning",
        hint: "Start with a clear explanation of this concept.",
      };
    case "reteach":
      return {
        label: "Try it again",
        hint: "Review the idea from another angle, then practice.",
      };
    case "practice":
      return {
        label: "Practice this concept",
        hint: "Use what you just learned.",
      };
    case "recall":
      return {
        label: "Review this concept",
        hint: "Check what you can remember without looking.",
      };
    case "advance":
      return {
        label: "Move to the next concept",
        hint: "You're ready for the next concept.",
      };
    case "complete":
      return {
        label: "You're ready for the next concept",
        hint:
          decision.reasonCode === "unknown-target"
            ? undefined
            : "You've covered what we know for this path.",
      };
  }
}

/**
 * Build an executable action from a Knowledge Loop decision.
 * Uses existing Study Room / Lucky hrefs; never invents concepts.
 */
export function executeKnowledgeLearningAction(
  decision: KnowledgeOrchestratorDecision,
  ctx: StudyRoomContext,
): LearningActionExecution {
  // Advance: prefer registered concept title for Learn topic.
  let roomCtx = ctx;
  if (decision.action === "advance" && decision.nextConceptId) {
    const next = findKnowledgeConceptById(decision.nextConceptId);
    roomCtx = {
      ...ctx,
      topic: next?.concept.title ?? decision.nextConceptId.replace(/-/g, " "),
    };
  }

  const dest = resolveKnowledgeActionDestination(decision, roomCtx);

  // Reteach: mark Learn href so personalization can emphasize clarification.
  let href = dest.href ?? null;
  if (decision.action === "reteach" && href) {
    const join = href.includes("?") ? "&" : "?";
    if (!/[?&]klAction=/.test(href)) {
      href = `${href}${join}klAction=reteach`;
    }
  }
  if (decision.action === "advance" && href && decision.nextConceptId) {
    const join = href.includes("?") ? "&" : "?";
    if (!/[?&]klAdvance=/.test(href)) {
      href = `${href}${join}klAdvance=${encodeURIComponent(decision.nextConceptId)}`;
    }
  }

  const copy = learnerFacingCopy(decision);

  return {
    action: decision.action,
    conceptId: decision.conceptId,
    nextConceptId: decision.nextConceptId ?? null,
    reasonCode: decision.reasonCode,
    destination: {
      kind: executionKind(decision.action),
      href,
      room: dest.room,
    },
    learnerLabel: copy.label,
    learnerHint: copy.hint,
  };
}

/** API-safe orchestration + execution (no trace). */
export function buildOrchestrationExecutionView(
  decision: KnowledgeOrchestratorDecision,
  ctx: StudyRoomContext,
): {
  apiView: KnowledgeOrchestrationApiView;
  execution: LearningActionExecution;
} {
  const execution = executeKnowledgeLearningAction(decision, ctx);
  const destination: KnowledgeActionDestination = {
    action: decision.action,
    href: execution.destination.href ?? undefined,
    room: execution.destination.room,
    conceptId: decision.conceptId,
    nextConceptId: decision.nextConceptId ?? null,
  };
  return {
    apiView: {
      ...toOrchestrationApiView(decision, destination),
      learnerLabel: execution.learnerLabel,
      learnerHint: execution.learnerHint,
    },
    execution,
  };
}
