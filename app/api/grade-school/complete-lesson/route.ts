import { NextResponse } from "next/server";

import { StudyActivityType } from "@/generated/prisma";
import { db } from "@/lib/db";
import { generateLessonFlashcards } from "@/lib/grade-school/generate-flashcards";
import type { InteractiveLesson } from "@/lib/grade-school/generate-lesson";
import { markGradeSchoolStepComplete } from "@/lib/grade-school/progress";
import { requireGradeSchoolMode } from "@/lib/grade-school";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function POST(request: Request) {
  try {
    await requireGradeSchoolMode();
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const courseId = typeof body.courseId === "string" ? body.courseId : "";
    const stepIndex = Number(body.stepIndex);
    const lesson = body.lesson as InteractiveLesson | undefined;
    const lessonTitle = typeof body.lessonTitle === "string" ? body.lessonTitle : "Lesson";

    if (!courseId || Number.isNaN(stepIndex) || !lesson) {
      return NextResponse.json(
        { success: false, error: "courseId, stepIndex, and lesson are required." },
        { status: 400 },
      );
    }

    const course = await db.course.findFirst({
      where: { id: courseId, userId: user.id },
      select: { id: true, title: true, subject: true, gradeLevel: true },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found." },
        { status: 404 },
      );
    }

    const cards = await generateLessonFlashcards({
      userId: user.id,
      courseId,
      lessonTitle,
      subject: course.subject ?? "general",
      gradeLevel: course.gradeLevel ?? "elementary",
      lesson,
    });

    await markGradeSchoolStepComplete({
      courseId,
      stepIndex,
      flashcardCount: cards.length,
    });

    await db.studySession.create({
      data: {
        userId: user.id,
        courseId,
        activityType: StudyActivityType.GRADE_SCHOOL,
        durationSeconds: 600,
        cardsReviewed: cards.length,
        startedAt: new Date(),
        endedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      flashcardCount: cards.length,
      flashcardsHref: `/flashcards?courseId=${encodeURIComponent(courseId)}`,
    });
  } catch (error) {
    console.error("Grade school flashcard generation failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate flashcards.";
    const status = message.includes("Grade school planner") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
