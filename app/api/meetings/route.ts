import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import type { ClassMeetingInput } from "@/lib/lms/meetings";
import { getOrCreateDefaultUser } from "@/lib/user";

function parseMeetingBody(body: Record<string, unknown>): ClassMeetingInput | null {
  const dayOfWeek = Number(body.dayOfWeek);
  const startTime = typeof body.startTime === "string" ? body.startTime.trim() : "";
  const endTime = typeof body.endTime === "string" ? body.endTime.trim() : "";

  if (
    !Number.isInteger(dayOfWeek) ||
    dayOfWeek < 0 ||
    dayOfWeek > 6 ||
    !/^\d{2}:\d{2}$/.test(startTime) ||
    !/^\d{2}:\d{2}$/.test(endTime)
  ) {
    return null;
  }

  return {
    dayOfWeek,
    startTime,
    endTime,
    location:
      typeof body.location === "string" ? body.location.trim() || null : null,
    title: typeof body.title === "string" ? body.title.trim() || null : null,
  };
}

export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    const meetings = await db.classMeeting.findMany({
      where: {
        course: { userId: user.id },
        ...(courseId ? { courseId } : {}),
      },
      include: {
        course: { select: { id: true, title: true, color: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({ success: true, data: meetings });
  } catch (error) {
    console.error("Failed to list class meetings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load class meetings." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const courseId = typeof body.courseId === "string" ? body.courseId : "";
    const meeting = parseMeetingBody(body);

    if (!courseId || !meeting) {
      return NextResponse.json(
        { success: false, error: "courseId, dayOfWeek, startTime, and endTime are required." },
        { status: 400 },
      );
    }

    const course = await db.course.findFirst({
      where: { id: courseId, userId: user.id },
    });
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found." },
        { status: 404 },
      );
    }

    const created = await db.classMeeting.create({
      data: { courseId, ...meeting },
      include: {
        course: { select: { id: true, title: true, color: true } },
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("Failed to create class meeting:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create class meeting." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const meeting = parseMeetingBody(body);

    if (!id || !meeting) {
      return NextResponse.json(
        { success: false, error: "id, dayOfWeek, startTime, and endTime are required." },
        { status: 400 },
      );
    }

    const existing = await db.classMeeting.findFirst({
      where: { id, course: { userId: user.id } },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Class meeting not found." },
        { status: 404 },
      );
    }

    const updated = await db.classMeeting.update({
      where: { id },
      data: meeting,
      include: {
        course: { select: { id: true, title: true, color: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update class meeting:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update class meeting." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Meeting id is required." },
        { status: 400 },
      );
    }

    const meeting = await db.classMeeting.findFirst({
      where: {
        id,
        course: { userId: user.id },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: "Class meeting not found." },
        { status: 404 },
      );
    }

    await db.classMeeting.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete class meeting:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete class meeting." },
      { status: 500 },
    );
  }
}
