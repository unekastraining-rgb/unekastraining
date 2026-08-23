import { NextResponse } from "next/server";

import { requireGradeSchoolMode } from "@/lib/grade-school";
import { generateCurriculum } from "@/lib/syllabus/generate-curriculum";
import type { GenerateCurriculumRequest } from "@/lib/syllabus/types";

export async function POST(request: Request) {
  try {
    await requireGradeSchoolMode();

    const body = (await request.json()) as GenerateCurriculumRequest;

    if (!body.gradeLevel?.trim() || (!body.subject?.trim() && !body.subjects?.length)) {
      return NextResponse.json(
        { error: "Grade level and at least one subject are required." },
        { status: 400 },
      );
    }

    const subjects = Array.isArray(body.subjects)
      ? body.subjects.map((s) => String(s).trim()).filter(Boolean)
      : body.subject
          ?.split(/[,;\n]+/)
          .map((s) => s.trim())
          .filter(Boolean) ?? [];

    const curriculum = await generateCurriculum({
      gradeLevel: body.gradeLevel.trim(),
      subject: subjects.join(", ") || body.subject.trim(),
      subjects,
      focusTopic: body.focusTopic?.trim() || null,
      strugglingWith: body.strugglingWith?.trim() || null,
      studentName: body.studentName?.trim() || null,
      strengths: body.strengths?.trim() || null,
      goals: body.goals?.trim() || null,
      parentNotes: body.parentNotes?.trim() || null,
    });

    return NextResponse.json({ success: true, curriculum });
  } catch (error) {
    console.error("Failed to generate curriculum:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate curriculum.";
    const status = message.includes("Grade school planner") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
