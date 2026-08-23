import { NextResponse } from "next/server";

import { MaterialType } from "@/generated/prisma";
import { db } from "@/lib/db";
import { requireGradeSchoolMode } from "@/lib/grade-school";
import type { SaveGeneratedCoursePayload } from "@/lib/syllabus/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveGeneratedCoursePayload;

    if (
      !body?.curriculum?.courseName ||
      !body.curriculum.topics?.length ||
      !body.curriculum.learningSteps?.length
    ) {
      return NextResponse.json(
        { error: "Invalid curriculum data. Generate a learning plan with guided activities first." },
        { status: 400 },
      );
    }

    const { user } = await requireGradeSchoolMode();
    const { curriculum } = body;

    const course = await db.course.create({
      data: {
        title: curriculum.courseName,
        gradeLevel: curriculum.gradeLevel,
        subject: curriculum.subject,
        focusTopic: curriculum.focusTopic ?? curriculum.strugglingWith ?? null,
        description: curriculum.summary,
        userId: user.id,
        color: "#0d9488",
        materials: {
          create: {
            title: `Learning plan: ${curriculum.gradeLevel} ${curriculum.subject}`,
            type: MaterialType.SYLLABUS,
            extractedText: JSON.stringify(curriculum, null, 2),
            sortOrder: 0,
          },
        },
        topics: {
          create: curriculum.topics.map((topic, index) => ({
            name: topic.name,
            description: topic.description,
            sortOrder: index,
          })),
        },
      },
      include: {
        topics: true,
        materials: true,
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("Failed to save generated course:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save generated course.";
    const status = message.includes("Grade school planner") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
