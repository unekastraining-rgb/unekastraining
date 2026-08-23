import { NextResponse } from "next/server";

import { AssignmentStatus } from "@/generated/prisma";
import { computePriority, isAssignmentCompleted } from "@/lib/academic";
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

    const data = assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate?.toISOString() ?? null,
      status: assignment.status,
      grade: assignment.grade,
      maxGrade: assignment.maxGrade,
      courseId: assignment.courseId,
      course: assignment.course.title,
      courseCode: assignment.course.code,
      priority: computePriority(assignment.dueDate),
      completed: isAssignmentCompleted(assignment.status),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Failed to fetch planner tasks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load planner tasks." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const { title, courseId, courseTitle, dueDate, description } = body;

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

    return NextResponse.json(
      {
        success: true,
        data: {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate?.toISOString() ?? null,
          status: assignment.status,
          courseId: assignment.courseId,
          course: assignment.course.title,
          courseCode: assignment.course.code,
          priority: computePriority(assignment.dueDate),
          completed: false,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create planner task:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create task.";
    const status = error instanceof Error ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const { id, status, completed } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Assignment id is required." },
        { status: 400 },
      );
    }

    const existing = await db.assignment.findFirst({
      where: {
        id,
        course: { userId: user.id },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Assignment not found." },
        { status: 404 },
      );
    }

    let nextStatus = status as AssignmentStatus | undefined;

    if (!nextStatus && typeof completed === "boolean") {
      nextStatus = completed
        ? AssignmentStatus.SUBMITTED
        : AssignmentStatus.NOT_STARTED;
    }

    if (!nextStatus) {
      return NextResponse.json(
        { success: false, error: "Status or completed flag is required." },
        { status: 400 },
      );
    }

    const assignment = await db.assignment.update({
      where: { id },
      data: { status: nextStatus },
      include: {
        course: { select: { title: true, code: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate?.toISOString() ?? null,
        status: assignment.status,
        course: assignment.course.title,
        priority: computePriority(assignment.dueDate),
        completed: isAssignmentCompleted(assignment.status),
      },
    });
  } catch (error) {
    console.error("Failed to update planner task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update task." },
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
        { success: false, error: "Assignment id is required." },
        { status: 400 },
      );
    }

    const existing = await db.assignment.findFirst({
      where: {
        id,
        course: { userId: user.id },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Assignment not found." },
        { status: 404 },
      );
    }

    await db.assignment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete planner task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete task." },
      { status: 500 },
    );
  }
}
