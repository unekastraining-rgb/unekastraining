import type { LuckyActivity } from "./lucky";
import { withColdStartTopic, withCourseContext } from "@/lib/study/loop-hrefs";

export interface MixedReviewStep {
  id: string;
  activity: LuckyActivity;
  label: string;
  reason: string;
  href: string;
  minutes: number;
}

export interface MixedReviewContext {
  missedQuestions: number;
  dueFlashcards: number;
  weakTopics: number;
  lowUnderstanding: number;
  /** Primary course for cold-start loop links */
  courseId?: string | null;
  focusTopic?: string | null;
}

function loopHref(href: string, courseId?: string | null, focusTopic?: string | null): string {
  const withCourse = withCourseContext(href, courseId);
  return withColdStartTopic(withCourse, focusTopic);
}

export function buildMixedReviewPlan(context: MixedReviewContext): MixedReviewStep[] {
  const steps: MixedReviewStep[] = [];
  const { missedQuestions, dueFlashcards, weakTopics, lowUnderstanding, courseId, focusTopic } =
    context;

  if (lowUnderstanding > 0) {
    steps.push({
      id: "teach",
      activity: "teach-me",
      label: "Teach Me warm-up",
      reason: `${lowUnderstanding} topic${lowUnderstanding === 1 ? "" : "s"} need deeper understanding`,
      href: loopHref("/study/teach-me", courseId, focusTopic),
      minutes: 8,
    });
  }

  if (missedQuestions > 0) {
    steps.push({
      id: "missed",
      activity: "mixed-review",
      label: "Missed-question drill",
      reason: `${missedQuestions} missed item${missedQuestions === 1 ? "" : "s"} to correct`,
      href: loopHref("/quizzes?filter=missed", courseId, focusTopic),
      minutes: 10,
    });
  }

  steps.push({
    id: "quiz",
    activity: "quiz",
    label: "Adaptive quiz",
    reason: weakTopics > 0 ? "Target weak mastery gaps" : "Check what stuck",
    href: loopHref("/quizzes", courseId, focusTopic),
    minutes: 12,
  });

  if (dueFlashcards > 0) {
    steps.push({
      id: "cards",
      activity: "flashcards",
      label: "Spaced flashcards",
      reason: `${dueFlashcards} card${dueFlashcards === 1 ? "" : "s"} due today`,
      href: loopHref("/flashcards", courseId, focusTopic),
      minutes: 8,
    });
  } else {
    steps.push({
      id: "blurting",
      activity: "blurting",
      label: "Blurting finish",
      reason: "Active recall without notes",
      href: loopHref("/study/blurting", courseId, focusTopic),
      minutes: 5,
    });
  }

  return steps.slice(0, 4);
}
