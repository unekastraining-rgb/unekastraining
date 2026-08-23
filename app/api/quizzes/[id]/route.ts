import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;

    const quiz = await db.quiz.findFirst({
      where: { id, userId: user.id },
      include: {
        course: { select: { id: true, title: true, color: true } },
        questions: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        course: quiz.course,
        questions: quiz.questions.map((question) => ({
          id: question.id,
          sortOrder: question.sortOrder,
          type: question.type,
          prompt: question.prompt,
          options: question.options ? JSON.parse(question.options) : null,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to load quiz:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load quiz." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;

    const quiz = await db.quiz.findFirst({
      where: { id, userId: user.id },
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found." },
        { status: 404 },
      );
    }

    await db.quiz.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete quiz:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete quiz." },
      { status: 500 },
    );
  }
}
