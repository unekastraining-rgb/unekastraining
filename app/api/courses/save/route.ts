import { NextResponse } from "next/server";

import { AssignmentKind, MaterialType } from "@/generated/prisma";
import { db } from "@/lib/db";
import { parseMeetingScheduleFromText, upsertClassMeetings } from "@/lib/lms/meetings";
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

function inferAssignmentKind(title: string): AssignmentKind {
  const lower = title.toLowerCase();
  if (/\b(exam|midterm|final|test)\b/.test(lower)) return AssignmentKind.TEST;
  if (/\bquiz\b/.test(lower)) return AssignmentKind.QUIZ;
  if (/\b(project|portfolio)\b/.test(lower)) return AssignmentKind.PROJECT;
  if (/\b(reading|chapter)\b/.test(lower)) return AssignmentKind.READING;
  return AssignmentKind.ASSIGNMENT;
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
            kind: inferAssignmentKind(assignment.title),
          })),
        },
      },
      include: {
        assignments: true,
        materials: true,
      },
    });

    const meetingCandidates = [
      ...(extraction.meetings ?? []),
      ...parseMeetingScheduleFromText(extractedText),
    ];
    const meetingsImported = await upsertClassMeetings(course.id, meetingCandidates);

    return NextResponse.json({ course, meetingsImported }, { status: 201 });
  } catch (error) {
    console.error("Failed to save course:", error);
    return NextResponse.json(
      { error: "Failed to save course to the database." },
      { status: 500 },
    );
  }
}
