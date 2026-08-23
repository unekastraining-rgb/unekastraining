import type { SearchResultType } from "./global-search";

export const SEARCH_TYPE_LABELS: Record<SearchResultType, string> = {
  course: "Classes",
  assignment: "Assignments",
  event: "Calendar",
  topic: "Topics",
  note: "Notes",
  flashcard: "Flashcards",
  quiz: "Quizzes",
  material: "Materials",
  session: "Study sessions",
};

export const SEARCH_TYPE_EMOJI: Record<SearchResultType, string> = {
  course: "📚",
  assignment: "📝",
  event: "📅",
  topic: "🎯",
  note: "📓",
  flashcard: "🎴",
  quiz: "✅",
  material: "📄",
  session: "⏱️",
};

export const ACTIVITY_LABELS: Record<string, string> = {
  READING: "Reading",
  FLASHCARDS: "Flashcards",
  NOTES_REVIEW: "Notes review",
  PRACTICE: "Practice",
  ASSIGNMENT: "Assignment",
  QUIZ: "Quiz",
  SIX: "Six",
  LUCKY: "Lucky",
  BLURTING: "Blurting",
  TEACH_BACK: "Teach me",
  GENERAL: "Study",
};

export function formatActivityLabel(activityType: string) {
  return ACTIVITY_LABELS[activityType] ?? activityType.replace(/_/g, " ").toLowerCase();
}

export function sessionHref(activityType: string) {
  switch (activityType) {
    case "LUCKY":
      return "/study/lucky";
    case "BLURTING":
      return "/study/blurting";
    case "TEACH_BACK":
      return "/study/teach-me";
    case "SIX":
      return "/study";
    case "FLASHCARDS":
      return "/flashcards";
    case "QUIZ":
      return "/quizzes";
    default:
      return "/dashboard/telemetry";
  }
}
