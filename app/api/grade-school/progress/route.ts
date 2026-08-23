import { NextResponse } from "next/server";

import {
  getGradeSchoolProgress,
  markGradeSchoolStepComplete,
  progressByCourse,
} from "@/lib/grade-school/progress";
import { requireGradeSchoolMode } from "@/lib/grade-school";

export async function GET(request: Request) {
  try {
    await requireGradeSchoolMode();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId") ?? undefined;
    const rows = await getGradeSchoolProgress(courseId);
    const byCourse = Object.fromEntries(progressByCourse(rows));

    return NextResponse.json({
      success: true,
      progress: rows.map((row) => ({
        courseId: row.courseId,
        stepIndex: row.stepIndex,
        completedAt: row.completedAt.toISOString(),
        flashcardCount: row.flashcardCount,
        courseTitle: row.course.title,
      })),
      byCourse,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load progress.";
    const status = message.includes("Grade school planner") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireGradeSchoolMode();
    const body = await request.json();
    const courseId = typeof body.courseId === "string" ? body.courseId : "";
    const stepIndex = Number(body.stepIndex);
    const flashcardCount = Number(body.flashcardCount ?? 0);

    if (!courseId || Number.isNaN(stepIndex)) {
      return NextResponse.json(
        { success: false, error: "courseId and stepIndex are required." },
        { status: 400 },
      );
    }

    const row = await markGradeSchoolStepComplete({
      courseId,
      stepIndex,
      flashcardCount: Number.isFinite(flashcardCount) ? flashcardCount : 0,
    });

    return NextResponse.json({
      success: true,
      progress: {
        courseId: row.courseId,
        stepIndex: row.stepIndex,
        completedAt: row.completedAt.toISOString(),
        flashcardCount: row.flashcardCount,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save progress.";
    const status = message.includes("Grade school planner") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
