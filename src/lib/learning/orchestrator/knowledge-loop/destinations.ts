/**
 * Phase 4C — Map Knowledge Loop decisions to existing Study Room / Lucky hrefs.
 * Navigation is separate from decision. Does not invent URLs beyond resolveStudyRoomHref.
 */

import {
  resolveStudyRoomHref,
  type StudyRoomContext,
  type StudyRoomId,
} from "@/lib/study/resolve-study-room";
import type {
  KnowledgeActionDestination,
  KnowledgeLearningAction,
  KnowledgeOrchestratorDecision,
  KnowledgeOrchestrationApiView,
} from "@/lib/learning/orchestrator/knowledge-loop/types";

function roomForAction(
  action: KnowledgeLearningAction,
): StudyRoomId | undefined {
  switch (action) {
    case "teach":
    case "reteach":
      return "learn";
    case "practice":
      return "practice";
    case "recall":
      return "remember"; // Lucky-compatible retention room
    case "advance":
      return "learn";
    case "complete":
      return undefined;
  }
}

/**
 * Resolve an existing destination for a decision.
 * Recall → Remember/Lucky room (does not rewrite Lucky).
 */
export function resolveKnowledgeActionDestination(
  decision: KnowledgeOrchestratorDecision,
  ctx: StudyRoomContext,
): KnowledgeActionDestination {
  const room = roomForAction(decision.action);
  const topicForHref =
    decision.action === "advance" && decision.nextConceptId
      ? decision.nextConceptId.replace(/-/g, " ")
      : ctx.topic;

  const href = room
    ? resolveStudyRoomHref(room, {
        ...ctx,
        topic: topicForHref ?? ctx.topic,
      })
    : undefined;

  return {
    action: decision.action,
    href,
    room,
    conceptId: decision.conceptId,
    nextConceptId: decision.nextConceptId ?? null,
  };
}

/** Strip debug trace for public API payloads. */
export function toOrchestrationApiView(
  decision: KnowledgeOrchestratorDecision,
  destination?: KnowledgeActionDestination | null,
): KnowledgeOrchestrationApiView {
  return {
    action: decision.action,
    conceptId: decision.conceptId,
    nextConceptId: decision.nextConceptId ?? null,
    reasonCode: decision.reasonCode,
    confidence: decision.confidence,
    destination: destination ?? null,
  };
}
