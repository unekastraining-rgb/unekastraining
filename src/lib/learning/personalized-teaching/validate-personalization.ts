/**
 * Phase 4B — Personalization contract checks for AI lessons.
 * Additive to Phase 2B validateAiLesson — does not weaken it.
 */

import type { SixWorkedLesson } from "@/lib/csl/six-worked-lesson";
import { FORBIDDEN_LEARNER_JUDGMENT_RE } from "@/lib/learning/personalized-teaching/rules";

function lessonTextBlob(lesson: SixWorkedLesson): string {
  const parts: string[] = [
    lesson.learningFrame,
    lesson.cheatSheet,
    ...lesson.roadmap,
  ];
  for (const c of lesson.chunks) {
    parts.push(
      c.title,
      c.explanation,
      c.example ?? "",
      c.misconception ?? "",
      c.checkPrompt ?? "",
      c.breakdown ?? "",
      c.memoryTrick ?? "",
    );
  }
  for (const p of lesson.practicePrompts) {
    parts.push(p.title, p.prompt, p.tip ?? "");
  }
  return parts.join("\n");
}

/**
 * True when the lesson makes unsupported psychological / mastery claims
 * that personalization must not invent.
 */
export function lessonContainsUnsupportedLearnerJudgment(
  lesson: SixWorkedLesson,
): boolean {
  return FORBIDDEN_LEARNER_JUDGMENT_RE.test(lessonTextBlob(lesson));
}

/**
 * True when lesson text leaks raw learner-state metadata phrasing
 * (counts / familiarity labels) to the learner-facing surface.
 */
export function lessonLeaksLearnerStateMetadata(
  lesson: SixWorkedLesson,
): boolean {
  const blob = lessonTextBlob(lesson);
  return (
    /\b(prior exposures?|prior attempts?|familiarity:\s*(unseen|introduced|practiced|repeated)|incorrectAttempts|exposureCount)\b/i.test(
      blob,
    ) || /\bLEARNER CONTEXT\b/.test(blob)
  );
}
