import type { LuckyActivity } from "./lucky";

export interface MixedReviewStep {
  id: string;
  activity: LuckyActivity;
  label: string;
  reason: string;
  href: string;
  minutes: number;
}

export function buildMixedReviewPlan(context: {
  missedQuestions: number;
  dueFlashcards: number;
  weakTopics: number;
  lowUnderstanding: number;
}): MixedReviewStep[] {
  const steps: MixedReviewStep[] = [];
  const { missedQuestions, dueFlashcards, weakTopics, lowUnderstanding } = context;

  if (lowUnderstanding > 0) {
    steps.push({
      id: "teach",
      activity: "teach-me",
      label: "Teach Me warm-up",
      reason: `${lowUnderstanding} topic${lowUnderstanding === 1 ? "" : "s"} need deeper understanding`,
      href: "/study/teach-me",
      minutes: 8,
    });
  }

  if (missedQuestions > 0) {
    steps.push({
      id: "missed",
      activity: "mixed-review",
      label: "Missed-question drill",
      reason: `${missedQuestions} missed item${missedQuestions === 1 ? "" : "s"} to correct`,
      href: "/quizzes?filter=missed",
      minutes: 10,
    });
  }

  steps.push({
    id: "quiz",
    activity: "quiz",
    label: "Adaptive quiz",
    reason: weakTopics > 0 ? "Target weak mastery gaps" : "Check what stuck",
    href: "/quizzes",
    minutes: 12,
  });

  if (dueFlashcards > 0) {
    steps.push({
      id: "cards",
      activity: "flashcards",
      label: "Spaced flashcards",
      reason: `${dueFlashcards} card${dueFlashcards === 1 ? "" : "s"} due today`,
      href: "/flashcards",
      minutes: 8,
    });
  } else {
    steps.push({
      id: "blurting",
      activity: "blurting",
      label: "Blurting finish",
      reason: "Active recall without notes",
      href: "/study/blurting",
      minutes: 5,
    });
  }

  return steps.slice(0, 4);
}
