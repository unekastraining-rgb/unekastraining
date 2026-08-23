import { NextResponse } from "next/server";

import { MaterialType } from "@/generated/prisma";
import { db } from "@/lib/db";
import { generateInteractiveLesson } from "@/lib/grade-school/generate-lesson";
import { parseCurriculumFromMaterial } from "@/lib/grade-school/learning-plan";
import { requireGradeSchoolMode } from "@/lib/grade-school";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function POST(request: Request) {
  try {
    await requireGradeSchoolMode();
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const courseId = typeof body.courseId === "string" ? body.courseId : "";
    const stepIndex = Number(body.stepIndex ?? 0);

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "courseId is required." },
        { status: 400 },
      );
    }

    const course = await db.course.findFirst({
      where: { id: courseId, userId: user.id },
      select: {
        title: true,
        gradeLevel: true,
        subject: true,
        focusTopic: true,
        description: true,
        materials: {
          where: { type: MaterialType.SYLLABUS },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { extractedText: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found." },
        { status: 404 },
      );
    }

    const curriculum = parseCurriculumFromMaterial(
      course.materials[0]?.extractedText,
    );
    const learningStep = curriculum?.learningSteps[stepIndex];

    if (!curriculum || !learningStep) {
      return NextResponse.json(
        { success: false, error: "Learning step not found." },
        { status: 404 },
      );
    }

    const lesson = await generateInteractiveLesson({
      gradeLevel: curriculum.gradeLevel ?? course.gradeLevel ?? "elementary",
      subject: curriculum.subject ?? course.subject ?? "general",
      focusTopic: curriculum.focusTopic ?? course.focusTopic,
      strugglingWith: curriculum.strugglingWith,
      learningStep,
      courseSummary: curriculum.summary ?? course.description,
      learnerSummary: curriculum.learnerSummary,
    });

    return NextResponse.json({ success: true, lesson });
  } catch (error) {
    console.error("Failed to generate grade school lesson:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate lesson.";
    const status = message.includes("Grade school planner") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
