export type CoreStudyIntent =
  | "study-guide"
  | "flashcards"
  | "quiz"
  | "practice"
  | "learning-plan"
  | "explain"
  | null;

/**
 * Detect notebook-layout intents. Conversational "quiz me" stays in chat;
 * only explicit generate/create/make/layout phrases trigger canvas actions.
 */
export function detectCoreStudyIntent(text: string): CoreStudyIntent {
  const t = text.trim().toLowerCase();
  if (!t) return null;

  if (/\b(make|create|generate|build)\b.{0,24}\bflashcards?\b/.test(t) || /\bflashcards?\s+from\b/.test(t)) {
    return "flashcards";
  }
  if (/\b(make|create|generate|build)\b.{0,24}\bquiz\b/.test(t)) {
    return "quiz";
  }
  if (/\b(practice questions|test myself|practice on (this|the) (page|chapter))\b/.test(t)) {
    return "practice";
  }
  if (/\b(learning plan|study plan)\b/.test(t)) {
    return "learning-plan";
  }
  if (/\b(lay out|create|generate|make)\b.{0,20}\bexplain/.test(t) || /\bexplanations?\s+(on|in)\s+(the\s+)?(page|notebook|core)\b/.test(t)) {
    return "explain";
  }
  if (
    /\b(create|make|generate|build)\b.{0,24}\bstudy guide\b/.test(t) ||
    /\bstudy (this|it|the chapter|chapter \d+)\b/.test(t) ||
    /\bhelp me study\b/.test(t)
  ) {
    return "study-guide";
  }

  return null;
}
