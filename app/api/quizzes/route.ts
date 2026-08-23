import { NextResponse } from "next/server";

import { db } from "@/lib/db";
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
    const { courseId, difficulty, questionCount, mode } = body;

    if (mode === "missed") {
      const quiz = await generateQuizFromMissedQuestions(user.id, courseId);
      return NextResponse.json({ success: true, data: quiz }, { status: 201 });
    }

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "courseId is required." },
        { status: 400 },
      );
    }

    const quiz = await generateQuizForCourse(user.id, courseId, {
      difficulty,
      questionCount,
    });

    return NextResponse.json({ success: true, data: quiz }, { status: 201 });
  } catch (error) {
    console.error("Failed to generate quiz:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate quiz.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
