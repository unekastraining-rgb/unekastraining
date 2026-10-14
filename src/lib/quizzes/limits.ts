export const QUIZ_QUESTION_MIN = 20;
export const QUIZ_QUESTION_MAX = 30;
export const QUIZ_QUESTION_DEFAULT = 30;

/** Lucky chapter quizzes are 20–30 items. Missed-question recycle does not use this. */
export function clampQuizQuestionCount(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return QUIZ_QUESTION_DEFAULT;
  return Math.min(QUIZ_QUESTION_MAX, Math.max(QUIZ_QUESTION_MIN, Math.round(numeric)));
}
