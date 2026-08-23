import { MaterialType } from "@/generated/prisma";

import { aiService } from "@/lib/ai";
import { db } from "@/lib/db";
import { parseQuizGeneration } from "@/lib/quizzes/types";
import { aiSourceInstruction, getUserAppSettings } from "@/lib/settings/app-settings";
import { getOrCreateDefaultTopic } from "@/lib/topics";

export async function generateQuizForCourse(
  userId: string,
  courseId: string,
  options?: { difficulty?: string; questionCount?: number; topicName?: string },
) {
  const course = await db.course.findFirst({
    where: { id: courseId, userId },
    include: {
      materials: {
        where: {
          OR: [
            { type: MaterialType.SYLLABUS },
            { type: MaterialType.LECTURE_SLIDES },
            { type: MaterialType.TEXTBOOK },
            { type: MaterialType.DOCUMENT },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      topics: { orderBy: { sortOrder: "asc" }, take: 5 },
    },
  });

  if (!course) {
    throw new Error("Course not found.");
  }

  const sourceText =
    course.materials
      .map((material) => material.extractedText?.trim())
      .filter(Boolean)
      .join("\n\n") ||
    `${course.title} ${course.description ?? ""}`.trim();

  if (!sourceText) {
    throw new Error(
      "No course material found. Upload a syllabus or materials first.",
    );
  }

  const questionCount = options?.questionCount ?? 6;
  const difficulty = options?.difficulty ?? "MEDIUM";
  const topic = await getOrCreateDefaultTopic(courseId);
  const appSettings = await getUserAppSettings(userId);

  const result = await aiService.complete(
    [
      {
        role: "system",
        content:
          "You create challenging study quizzes for the CSL Lucky retention system. Respond with JSON only.",
      },
      {
        role: "user",
        content: `Create ${questionCount} quiz questions from this course material.

Difficulty: ${difficulty}
Course: ${course.title}
${options?.topicName ? `Focus topic: ${options.topicName}` : ""}

Mix question types: MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, SCENARIO.
For MULTIPLE_CHOICE include exactly 4 options.
For TRUE_FALSE correctAnswer is true or false.
For SHORT_ANSWER correctAnswer is a concise expected answer.
For SCENARIO write a realistic application question.

${aiSourceInstruction(appSettings.aiSourceMode)}

Return ONLY JSON:
{
  "title": "Quiz title",
  "questions": [
    {
      "type": "MULTIPLE_CHOICE",
      "prompt": "question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "B",
      "explanation": "why"
    }
  ]
}

Material:
${sourceText.slice(0, 9000)}`,
      },
    ],
    { temperature: 0.35, maxTokens: 4096 },
  );

  const jsonMatch = result.content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const rawJson = (jsonMatch?.[1] ?? result.content).trim();
  const parsed = JSON.parse(rawJson) as {
    title?: string;
    questions: unknown;
  };

  const questions = parseQuizGeneration(
    JSON.stringify({ questions: parsed.questions }),
  );

  if (questions.length === 0) {
    throw new Error("Could not generate quiz questions.");
  }

  const quiz = await db.quiz.create({
    data: {
      userId,
      courseId,
      topicId: topic.id,
      title:
        parsed.title?.trim() || `${course.title} Quiz`,
      description: `Lucky quiz · ${difficulty} difficulty`,
      difficulty,
      questionCount: questions.length,
      questions: {
        create: questions.map((question, index) => ({
          sortOrder: index,
          type: question.type,
          prompt: question.prompt,
          options: question.options ? JSON.stringify(question.options) : null,
          correctAnswer: JSON.stringify(question.correctAnswer),
          explanation: question.explanation ?? null,
          topicId: topic.id,
        })),
      },
    },
    include: { questions: { orderBy: { sortOrder: "asc" } } },
  });

  return quiz;
}

export async function generateQuizFromMissedQuestions(
  userId: string,
  courseId?: string,
) {
  const missed = await db.missedQuestion.findMany({
    where: {
      userId,
      mastered: false,
      ...(courseId ? { courseId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  if (missed.length === 0) {
    throw new Error("No missed questions to review yet. Take a quiz first!");
  }

  const quiz = await db.quiz.create({
    data: {
      userId,
      courseId: courseId ?? missed[0]?.courseId,
      topicId: missed[0]?.topicId,
      title: "Missed Question Review",
      description: "Lucky recycle — questions you missed before",
      source: "MISSED_RECYCLE",
      difficulty: "MEDIUM",
      questionCount: missed.length,
      questions: {
        create: missed.map((item, index) => ({
          sortOrder: index,
          type: item.questionType,
          prompt: item.prompt,
          options: item.options,
          correctAnswer: item.correctAnswer,
          explanation: item.explanation,
          topicId: item.topicId,
        })),
      },
    },
    include: { questions: { orderBy: { sortOrder: "asc" } } },
  });

  return quiz;
}
