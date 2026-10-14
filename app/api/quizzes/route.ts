import { NextResponse } from "next/server";

import { friendlyUserFacingAiError } from "@/lib/ai/parse-json-response";
import { db } from "@/lib/db";
import { normalizeChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import {
  generateQuizForCourse,
  generateQuizFromMissedQuestions,
} from "@/lib/quizzes/generate";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();

    const [quizzes, missedCount] = await Promise.all([
      db.quiz.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          course: { select: { id: true, title: true, color: true } },
          _count: { select: { questions: true, attempts: true } },
          attempts: {
            where: { userId: user.id, completedAt: { not: null } },
            orderBy: { completedAt: "desc" },
            take: 1,
            select: { score: true, maxScore: true, completedAt: true },
          },
        },
        take: 30,
      }),
      db.missedQuestion.count({
        where: { userId: user.id, mastered: false },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: quizzes.map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        source: quiz.source,
        course: quiz.course,
        questionCount: quiz._count.questions,
        attemptCount: quiz._count.attempts,
        lastAttempt: quiz.attempts[0] ?? null,
        createdAt: quiz.createdAt.toISOString(),
      })),
      missedCount,
    });
  } catch (error) {
    console.error("Failed to list quizzes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load quizzes." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const { difficulty, questionCount, mode, materialId, extract } = body;
    const courseId = typeof body.courseId === "string" ? body.courseId : undefined;

    if (mode === "missed") {
      const quiz = await generateQuizFromMissedQuestions(user.id, courseId);
      return NextResponse.json({ success: true, data: quiz }, { status: 201 });
    }

    if (!courseId && typeof materialId !== "string") {
      return NextResponse.json(
        { success: false, error: "courseId or materialId is required." },
        { status: 400 },
      );
    }

    const quiz = await generateQuizForCourse(user.id, courseId, {
      difficulty,
      questionCount,
      topicName: typeof body.topicName === "string" ? body.topicName : undefined,
      materialId: typeof materialId === "string" ? materialId : undefined,
      sourceText: typeof body.sourceText === "string" ? body.sourceText : undefined,
      extract:
        extract && typeof extract === "object"
          ? normalizeChapterStudyExtract(extract as Record<string, unknown>)
          : undefined,
    });

    return NextResponse.json({ success: true, data: quiz }, { status: 201 });
  } catch (error) {
    console.error("Failed to generate quiz:", error);
    const message = friendlyUserFacingAiError(
      error,
      "Could not build a quiz from this material. Try a syllabus or pasted reading, then Make quiz again.",
    );
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
