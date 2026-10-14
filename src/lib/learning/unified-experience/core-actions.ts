/**
 * Bundle E — Core → room href helpers.
 * Uses existing resolveStudyRoomHref — no Core orchestrator.
 */

import { findKnowledgeConceptById } from "@/lib/learning/learner-state/concept-identity";
import {
  coreLearningActionHints,
  type CoreLearningContent,
  type CoreLearningActionHint,
} from "@/lib/learning/core";
import {
  resolveStudyRoomHref,
  type StudyRoomContext,
} from "@/lib/study/resolve-study-room";

export type CoreLearningActionLink = {
  action: CoreLearningActionHint["action"];
  label: string;
  href: string | null;
  reason: string;
  conceptId?: string;
  conceptTitle?: string;
  disabledReason?: string;
};

const ACTION_LABEL: Record<string, string> = {
  learn: "Learn this",
  practice: "Practice",
  recall: "Recall",
  explain: "Explain",
  "connect-concept": "Connect a concept",
};

/**
 * Map Core action hints to Study room links.
 * Low-information notes return a single connect hint with null href.
 */
export function coreLearningActionLinks(
  content: CoreLearningContent,
  roomCtx?: Omit<StudyRoomContext, "topic">,
): CoreLearningActionLink[] {
  const hints = coreLearningActionHints(content);
  return hints.map((hint) => {
    const concept = hint.conceptId
      ? findKnowledgeConceptById(hint.conceptId)
      : null;
    const title =
      concept?.concept.title ??
      content.concepts?.find((c) => c.conceptId === hint.conceptId)?.title ??
      hint.conceptId;

    if (hint.action === "connect-concept" || !hint.conceptId || !hint.room) {
      return {
        action: hint.action,
        label: ACTION_LABEL[hint.action] ?? hint.action,
        href: null,
        reason:
          hint.reason ||
          "I couldn't identify a specific topic from this note yet.",
        disabledReason:
          "I couldn't identify a specific topic from this note yet.",
      };
    }

    const ctx: StudyRoomContext = {
      courseId: roomCtx?.courseId,
      materialId: roomCtx?.materialId,
      courseTitle: roomCtx?.courseTitle,
      topic: title ?? hint.conceptId,
    };

    let href = resolveStudyRoomHref(hint.room, ctx);
    if (hint.action === "explain") {
      const params = new URLSearchParams();
      params.set("focus", "explain");
      params.set("topic", title ?? hint.conceptId);
      if (ctx.courseId) params.set("courseId", ctx.courseId);
      if (ctx.materialId) params.set("materialId", ctx.materialId);
      href = `/study/teach-me?${params.toString()}`;
    }

    return {
      action: hint.action,
      label: ACTION_LABEL[hint.action] ?? hint.action,
      href,
      reason: hint.reason,
      conceptId: hint.conceptId,
      conceptTitle: title,
    };
  });
}
