import type { QuizQuestionType } from "@/generated/prisma";

export interface GeneratedQuizQuestion {
  type: QuizQuestionType;
  prompt: string;
  options?: string[];
  correctAnswer: string | string[] | boolean;
  explanation?: string;
}

export interface QuizQuestionPublic {
  id: string;
  sortOrder: number;
  type: QuizQuestionType;
  prompt: string;
  options: string[] | null;
}

export interface QuizAnswerInput {
  questionId: string;
  answer: string | string[] | boolean;
}

export interface GradedResponse {
  questionId: string;
  isCorrect: boolean;
  feedback?: string;
  correctAnswer: string;
  explanation?: string | null;
}

export function parseQuizGeneration(content: string): GeneratedQuizQuestion[] {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? content).trim();
  const parsed = JSON.parse(raw) as { questions: GeneratedQuizQuestion[] };

  if (!Array.isArray(parsed.questions)) {
    throw new Error("AI response did not include quiz questions.");
  }

  return parsed.questions
    .filter((question) => question.prompt?.trim())
    .slice(0, 10)
    .map((question) => ({
      ...question,
      type: normalizeQuestionType(question.type),
    }));
}

function normalizeQuestionType(type: string): QuizQuestionType {
  const upper = String(type).toUpperCase();
  if (upper === "MULTIPLE_CHOICE") return "MULTIPLE_CHOICE";
  if (upper === "MULTIPLE_RESPONSE") return "MULTIPLE_RESPONSE";
  if (upper === "TRUE_FALSE") return "TRUE_FALSE";
  if (upper === "SCENARIO") return "SCENARIO";
  return "SHORT_ANSWER";
}

export function serializeAnswer(answer: string | string[] | boolean): string {
  return JSON.stringify(answer);
}

export function parseAnswer(raw: string): string | string[] | boolean {
  try {
    return JSON.parse(raw) as string | string[] | boolean;
  } catch {
    return raw;
  }
}

export function gradeObjectiveQuestion(
  type: QuizQuestionType,
  correctRaw: string,
  userAnswer: string | string[] | boolean,
): boolean {
  const correct = parseAnswer(correctRaw);

  if (type === "TRUE_FALSE") {
    return Boolean(correct) === Boolean(userAnswer);
  }

  if (type === "MULTIPLE_RESPONSE") {
    const correctSet = new Set(
      Array.isArray(correct) ? correct.map(String) : [String(correct)],
    );
    const userSet = new Set(
      Array.isArray(userAnswer) ? userAnswer.map(String) : [String(userAnswer)],
    );
    if (correctSet.size !== userSet.size) return false;
    for (const value of correctSet) {
      if (!userSet.has(value)) return false;
    }
    return true;
  }

  return String(correct).trim().toLowerCase() === String(userAnswer).trim().toLowerCase();
}
