import { parseAiJson } from "@/lib/ai/parse-json-response";
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

export function parseQuizGeneration(
  content: string,
  options?: { maxQuestions?: number },
): GeneratedQuizQuestion[] {
  const parsed = parseAiJson<{ questions?: unknown }>(
    content,
    "Could not build a quiz from this reading. Try again.",
  );
  return normalizeGeneratedQuestions(parsed.questions, options?.maxQuestions);
}

export function normalizeGeneratedQuestions(
  questions: unknown,
  maxQuestions = 30,
): GeneratedQuizQuestion[] {
  if (!Array.isArray(questions)) {
    throw new Error("AI response did not include quiz questions.");
  }

  return questions
    .map((item) => item as Partial<GeneratedQuizQuestion> & { question?: string })
    .filter((question) => String(question.prompt ?? question.question ?? "").trim())
    .slice(0, maxQuestions)
    .map((question) => ({
      type: normalizeQuestionType(String(question.type ?? "")),
      prompt: String(question.prompt ?? question.question ?? "").trim(),
      options: Array.isArray(question.options)
        ? question.options.map((option) => String(option))
        : undefined,
      correctAnswer:
        question.correctAnswer ??
        (question as { answer?: string | string[] | boolean }).answer ??
        "",
      explanation: question.explanation,
    }));
}

export function normalizeQuestionType(type: string): QuizQuestionType {
  const upper = String(type).toUpperCase().replace(/[\s-]+/g, "_");
  if (upper === "FILL_IN_BLANK" || upper === "FILL_BLANK" || upper === "CLOZE") {
    return "FILL_IN_BLANK";
  }
  if (upper === "MULTIPLE_CHOICE" || upper === "WHICH_IS_NOT_TRUE" || upper === "EXCEPT") {
    return "MULTIPLE_CHOICE";
  }
  if (upper === "MULTIPLE_RESPONSE" || upper === "SELECT_ALL" || upper === "MULTI_SELECT") {
    return "MULTIPLE_RESPONSE";
  }
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
    const asBool = (value: unknown) => {
      if (typeof value === "boolean") return value;
      const text = String(value).trim().toLowerCase();
      return text === "true" || text === "t" || text === "yes";
    };
    return asBool(correct) === asBool(userAnswer);
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

  if (type === "FILL_IN_BLANK") {
    return normalizeFillIn(String(correct)) === normalizeFillIn(String(userAnswer));
  }

  return String(correct).trim().toLowerCase() === String(userAnswer).trim().toLowerCase();
}

function normalizeFillIn(value: string): string {
  return value.trim().toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ");
}
