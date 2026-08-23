import { NextResponse } from "next/server";

import { evaluateGradeSchoolThinking } from "@/lib/grade-school/check-thinking";
import { requireGradeSchoolMode } from "@/lib/grade-school";

export async function POST(request: Request) {
  try {
    await requireGradeSchoolMode();
    const body = await request.json();

    const userAnswer = typeof body.userAnswer === "string" ? body.userAnswer.trim() : "";
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const mode = body.mode === "writing" ? "writing" : "reading";

    if (!userAnswer || !question) {
      return NextResponse.json(
        { success: false, error: "question and userAnswer are required." },
        { status: 400 },
      );
    }

    if (userAnswer.length < 3) {
      return NextResponse.json(
        { success: false, error: "Write a little more so we can check your thinking." },
        { status: 400 },
      );
    }

    const feedback = await evaluateGradeSchoolThinking({
      passage: typeof body.passage === "string" ? body.passage : null,
      question,
      userAnswer,
      gradeLevel: typeof body.gradeLevel === "string" ? body.gradeLevel : null,
      subject: typeof body.subject === "string" ? body.subject : null,
      mode,
      sampleAnswer: typeof body.sampleAnswer === "string" ? body.sampleAnswer : null,
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error("Failed to check grade school thinking:", error);
    const message =
      error instanceof Error ? error.message : "Could not check your thinking.";
    const status = message.includes("Grade school planner") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
