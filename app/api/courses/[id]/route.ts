import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;

    const course = await db.course.findFirst({
      where: { id, userId: user.id },
      include: {
        assignments: { orderBy: { dueDate: "asc" } },
        materials: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        meetings: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
        topics: {
          orderBy: { name: "asc" },
          include: {
            masteries: {
              where: { userId: user.id },
              take: 1,
            },
          },
        },
        _count: { select: { quizzes: true, studySessions: true } },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error("Failed to load course:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load course." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;
    const body = await request.json();

    const course = await db.course.findFirst({
      where: { id, userId: user.id },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found." },
        { status: 404 },
      );
    }

    const data: { color?: string; title?: string } = {};
    if (typeof body.color === "string") data.color = body.color;
    if (typeof body.title === "string") data.title = body.title;

    const updated = await db.course.update({
      where: { id },
      data,
      select: { id: true, title: true, color: true },
    });

    return NextResponse.json({ success: true, course: updated });
  } catch (error) {
    console.error("Failed to update course:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update course." },
      { status: 500 },
    );
  }
}
