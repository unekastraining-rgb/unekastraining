import { NextResponse } from "next/server";

import { AssignmentStatus } from "@/generated/prisma";
import { resolveCourseForUser } from "@/lib/courses";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();

    const assignments = await db.assignment.findMany({
      where: {
        course: { userId: user.id },
      },
      include: {
        course: {
          select: { id: true, title: true, code: true },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    console.error("Failed to fetch assignments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load assignments." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const { title, description, dueDate, courseId, courseTitle } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Assignment title is required." },
        { status: 400 },
      );
    }

    const course = await resolveCourseForUser(user.id, { courseId, courseTitle });

    const assignment = await db.assignment.create({
      data: {
        title: title.trim(),
        description: description ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        courseId: course.id,
        status: AssignmentStatus.NOT_STARTED,
      },
      include: {
        course: { select: { title: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create assignment:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create assignment.";
    const status = error instanceof Error ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const { assignmentId, status } = body;

    if (!assignmentId || !status) {
      return NextResponse.json(
        { success: false, error: "assignmentId and status are required." },
        { status: 400 },
      );
    }

    const existing = await db.assignment.findFirst({
      where: {
        id: assignmentId,
        course: { userId: user.id },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Assignment not found." },
        { status: 404 },
      );
    }

    const assignment = await db.assignment.update({
      where: { id: assignmentId },
      data: { status },
      include: {
        course: { select: { title: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error("Failed to update assignment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update assignment." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const { assignmentId, id } = body;
    const targetId = assignmentId ?? id;

    if (!targetId) {
      return NextResponse.json(
        { success: false, error: "Assignment id is required." },
        { status: 400 },
      );
    }

    const existing = await db.assignment.findFirst({
      where: {
        id: targetId,
        course: { userId: user.id },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Assignment not found." },
        { status: 404 },
      );
    }

    await db.assignment.delete({ where: { id: targetId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete assignment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete assignment." },
      { status: 500 },
    );
  }
}
