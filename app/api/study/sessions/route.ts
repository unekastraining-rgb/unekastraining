import { NextResponse } from "next/server";

import type { StudyActivityType } from "@/generated/prisma";
import { createStudySession } from "@/lib/csl/study-sessions";
import { requireUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));

    const { db } = await import("@/lib/db");
    const sessions = await db.studySession.findMany({
      where: { userId: user.id },
      include: { course: { select: { title: true } } },
      orderBy: { startedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    if (error instanceof Error && error.name === "UnauthorizedError") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to list study sessions:", error);
    return NextResponse.json({ success: false, error: "Failed to load sessions." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const activityType = body.activityType as StudyActivityType;

    if (!activityType) {
      return NextResponse.json(
        { success: false, error: "activityType is required." },
        { status: 400 },
      );
    }

    const session = await createStudySession({
      userId: user.id,
      activityType,
      courseId: body.courseId ?? null,
      topicId: body.topicId ?? null,
      durationSeconds: Number(body.durationSeconds ?? 0),
      cardsReviewed: Number(body.cardsReviewed ?? 0),
      notesCreated: Number(body.notesCreated ?? 0),
      startedAt: body.startedAt ? new Date(body.startedAt) : undefined,
      endedAt: body.endedAt ? new Date(body.endedAt) : undefined,
    });

    return NextResponse.json({ success: true, session });
  } catch (error) {
    if (error instanceof Error && error.name === "UnauthorizedError") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to create study session:", error);
    return NextResponse.json({ success: false, error: "Failed to save session." }, { status: 500 });
  }
}
