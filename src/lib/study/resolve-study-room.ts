/**
 * Resolve Learn / Practice / Check / Remember / Tutor destinations to
 * existing engines — learner picks the room; Study Haul picks the capability.
 * Presentation helper only; does not create parallel engines.
 */

import { withLearningFocus } from "@/lib/study/learning-focus";
import {
  withColdStartTopic,
  withCourseContext,
} from "@/lib/study/loop-hrefs";
import {
  buildPracticeItemHref,
  resolveContextualPractice,
} from "@/lib/study/practice-landscape";

export type StudyRoomId =
  | "learn"
  | "practice"
  | "check"
  | "remember"
  | "tutor";

export type StudyRoomContext = {
  courseId?: string | null;
  topic?: string | null;
  materialId?: string | null;
  courseTitle?: string | null;
};

function scoped(href: string, ctx: StudyRoomContext): string {
  let next = withCourseContext(href, ctx.courseId ?? null);
  next = withColdStartTopic(next, ctx.topic ?? null);
  const materialId = ctx.materialId?.trim();
  if (materialId && !next.includes("materialId=")) {
    next = `${next}${next.includes("?") ? "&" : "?"}materialId=${encodeURIComponent(materialId)}`;
  }
  return next;
}

/** Primary href when the learner enters a Study Haul room. */
export function resolveStudyRoomHref(
  room: StudyRoomId,
  ctx: StudyRoomContext,
): string {
  const topic = ctx.topic?.trim() || null;
  const hay = [topic, ctx.courseTitle].filter(Boolean).join(" ");

  switch (room) {
    case "learn":
      return scoped(
        withLearningFocus("/study/teach-me", "teach"),
        ctx,
      );
    case "practice": {
      const item = resolveContextualPractice(hay || topic);
      return buildPracticeItemHref(item, {
        courseId: ctx.courseId,
        topic,
        materialId: ctx.materialId,
      });
    }
    case "check":
      // Retrieval / knowledge check for this concept — flashcards + course scope.
      return scoped("/flashcards", ctx);
    case "remember":
      // Retention / LUCKY — not a technique menu.
      return scoped("/study/lucky", ctx);
    case "tutor":
      return scoped(
        withLearningFocus("/study/teach-me", "tutor"),
        ctx,
      );
  }
}
