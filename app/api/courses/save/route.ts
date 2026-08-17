import { NextResponse } from "next/server";

import { MaterialType } from "@/generated/prisma";
import { db } from "@/lib/db";
import { getUploadFilePath } from "@/lib/syllabus/storage";
import type { SaveCoursePayload } from "@/lib/syllabus/types";
import { getOrCreateDefaultUser } from "@/lib/user";

function parseDueDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveCoursePayload;

    if (!body?.uploadId || !body?.fileName || !body?.extraction?.courseName) {
      return NextResponse.json(
        { error: "Invalid course data. Please confirm the preview and try again." },
        { status: 400 },
      );
    }

    const user = await getOrCreateDefaultUser();
    const { extraction, uploadId, fileName, extractedText } = body;

    const course = await db.course.create({
      data: {
        title: extraction.courseName,
        code: extraction.courseCode || null,
        instructor: extraction.instructor,
        semester: extraction.semester,
        userId: user.id,
        materials: {
          create: {
            title: `${fileName} (Syllabus)`,
            type: MaterialType.SYLLABUS,
            filePath: getUploadFilePath(uploadId),
            extractedText,
            sortOrder: 0,
          },
        },
        assignments: {
          create: extraction.assignments.map((assignment) => ({
            title: assignment.title,
            description: assignment.description ?? null,
            dueDate: parseDueDate(assignment.dueDate),
          })),
        },
      },
      include: {
        assignments: true,
        materials: true,
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("Failed to save course:", error);
    return NextResponse.json(
      { error: "Failed to save course to the database." },
      { status: 500 },
    );
  }
}
