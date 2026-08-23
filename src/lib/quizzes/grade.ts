import type { QuizQuestionType } from "@/generated/prisma";

import { aiService } from "@/lib/ai";
import {
  gradeObjectiveQuestion,
  parseAnswer,
  type GradedResponse,
} from "@/lib/quizzes/types";

export async function gradeQuizAnswers(
  questions: Array<{
    id: string;
    type: QuizQuestionType;
    prompt: string;
    correctAnswer: string;
    explanation: string | null;
  }>,
  answers: Array<{ questionId: string; answer: string | string[] | boolean }>,
): Promise<GradedResponse[]> {
  const results: GradedResponse[] = [];

  for (const question of questions) {
    const userAnswer = answers.find((item) => item.questionId === question.id)?.answer;

    if (userAnswer === undefined) {
      results.push({
        questionId: question.id,
        isCorrect: false,
        feedback: "No answer provided.",
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });
      continue;
    }

    if (
      question.type === "SHORT_ANSWER" ||
      question.type === "SCENARIO"
    ) {
      const graded = await gradeShortAnswer(question, userAnswer);
      results.push(graded);
      continue;
    }

    const isCorrect = gradeObjectiveQuestion(
      question.type,
      question.correctAnswer,
      userAnswer,
    );

    results.push({
      questionId: question.id,
      isCorrect,
      feedback: isCorrect
        ? "Correct!"
        : question.explanation ?? "Review this concept and try again.",
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    });
  }

  return results;
}

async function gradeShortAnswer(
  question: {
    id: string;
    prompt: string;
    correctAnswer: string;
    explanation: string | null;
  },
  userAnswer: string | string[] | boolean,
): Promise<GradedResponse> {
  const expected = parseAnswer(question.correctAnswer);
  const answerText = Array.isArray(userAnswer)
    ? userAnswer.join(", ")
    : String(userAnswer);

  if (
    String(expected).trim().toLowerCase() === answerText.trim().toLowerCase()
  ) {
    return {
      questionId: question.id,
      isCorrect: true,
      feedback: "Correct!",
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  }

  try {
    const result = await aiService.complete(
      [
        {
          role: "system",
          content:
            "You grade short-answer quiz responses fairly. Respond with JSON only.",
        },
        {
          role: "user",
          content: `Question: ${question.prompt}
Expected answer: ${String(expected)}
Student answer: ${answerText}

Return ONLY JSON:
{ "isCorrect": true|false, "feedback": "brief helpful feedback" }`,
        },
      ],
      { temperature: 0.1, maxTokens: 256 },
    );

    const parsed = JSON.parse(
      (result.content.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ??
        result.content).trim(),
    ) as { isCorrect: boolean; feedback: string };

    return {
      questionId: question.id,
      isCorrect: Boolean(parsed.isCorrect),
      feedback: parsed.feedback,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  } catch {
    return {
      questionId: question.id,
      isCorrect: false,
      feedback: question.explanation ?? "Compare your answer to the expected response.",
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  }
}
