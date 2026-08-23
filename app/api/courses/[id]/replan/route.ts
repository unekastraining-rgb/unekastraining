import { NextResponse } from "next/server";

import { MaterialType } from "@/generated/prisma";
import { db } from "@/lib/db";
import { requireGradeSchoolMode } from "@/lib/grade-school";
import { parseCurriculumFromMaterial } from "@/lib/grade-school/learning-plan";
import {
  clearCourseStepProgress,
  getGradeSchoolProgress,
} from "@/lib/grade-school/progress";
import { SYLLABUS_PLAN_MATERIAL_TITLE } from "@/lib/syllabus/enrich-course-from-syllabus";
import { replanCurriculum } from "@/lib/syllabus/replan-curriculum";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireGradeSchoolMode();
    const { id: courseId } = await context.params;
    const body = await request.json();
    const parentNotes =
      typeof body.parentNotes === "string" ? body.parentNotes.trim() : "";

    const course = await db.course.findFirst({
      where: { id: courseId, userId: user.id },
      include: {
        materials: {
          where: {
            OR: [
              { type: MaterialType.SYLLABUS },
              { title: SYLLABUS_PLAN_MATERIAL_TITLE },
            ],
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Plan not found." }, { status: 404 });
    }

    const material =
      course.materials.find((item) => parseCurriculumFromMaterial(item.extractedText)) ??
      course.materials[0];
    const curriculum = parseCurriculumFromMaterial(material?.extractedText);
    if (!curriculum) {
      return NextResponse.json(
        { success: false, error: "No growth plan found for this learner." },
        { status: 404 },
      );
    }

    const progressRows = await getGradeSchoolProgress(courseId);
    const completedSteps = progressRows.map((row) => row.stepIndex);

    if (completedSteps.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Complete at least one lesson before replanning — we need progress to adapt.",
        },
        { status: 400 },
      );
    }

    const updated = await replanCurriculum({
      curriculum,
      completedSteps,
      parentNotes: parentNotes || null,
    });

    if (material) {
      await db.courseMaterial.update({
        where: { id: material.id },
        data: { extractedText: JSON.stringify(updated, null, 2) },
      });
    }

    await db.course.update({
      where: { id: courseId },
      data: {
        title: updated.courseName,
        description: updated.summary,
        focusTopic: updated.focusTopic ?? updated.strugglingWith ?? null,
      },
    });

    await clearCourseStepProgress(courseId);

    return NextResponse.json({
      success: true,
      curriculum: updated,
      message: `Plan updated to version ${updated.planVersion}. New activities focus on areas that still need growth.`,
    });
  } catch (error) {
    console.error("Failed to replan curriculum:", error);
    const message = error instanceof Error ? error.message : "Failed to update plan.";
    const status = message.includes("Grade school planner") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
