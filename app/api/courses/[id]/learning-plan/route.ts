import { NextResponse } from "next/server";

import { MaterialType } from "@/generated/prisma";
import { db } from "@/lib/db";
import { parseCurriculumFromMaterial } from "@/lib/grade-school/learning-plan";
import { generateCollegeLearningPlan } from "@/lib/lms/course-info/generate-college-learning-plan";
import { SYLLABUS_PLAN_MATERIAL_TITLE } from "@/lib/syllabus/enrich-course-from-syllabus";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;

    const materials = await db.courseMaterial.findMany({
      where: {
        courseId: id,
        course: { userId: user.id },
        OR: [
          { type: MaterialType.SYLLABUS },
          { title: SYLLABUS_PLAN_MATERIAL_TITLE },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: { extractedText: true },
    });

    const curriculum = materials
      .map((material) => parseCurriculumFromMaterial(material.extractedText))
      .find((plan) => plan !== null);
    if (!curriculum) {
      return NextResponse.json(
        { success: false, error: "No learning plan found for this class." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, curriculum });
  } catch (error) {
    console.error("Failed to load learning plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load learning plan." },
      { status: 500 },
    );
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;

    const course = await db.course.findFirst({
      where: { id, userId: user.id },
      select: { id: true, title: true, courseInfoJson: true, moodleCourseId: true },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found." }, { status: 404 });
    }

    if (!course.courseInfoJson && !course.moodleCourseId) {
      return NextResponse.json(
        { success: false, error: "Import course info from Moodle before generating a plan." },
        { status: 400 },
      );
    }

    const plan = await generateCollegeLearningPlan({
      courseName: course.title,
      courseInfoJson: course.courseInfoJson,
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Failed to generate learning plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate learning plan." },
      { status: 500 },
    );
  }
}
