import { NextResponse } from "next/server";

import { AssignmentStatus } from "@/generated/prisma";
import { computePriority, isAssignmentCompleted } from "@/lib/academic";
import { resolveCourseForUser } from "@/lib/courses";
import { readableCourseCode, readableCourseTitle } from "@/lib/courses/display-name";
import { db } from "@/lib/db";
import { fromLocalAssignment } from "@/lib/learning/academic";
import { buildAdaptiveLearningPlan } from "@/lib/learning/adaptive-planner";
import { enrichAssignmentsWithConceptLinks } from "@/lib/learning/school-lms";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();

    const [assignments, topics] = await Promise.all([
      db.assignment.findMany({
        where: {
          course: { userId: user.id },
        },
        include: {
          course: {
            select: { id: true, title: true, code: true },
          },
        },
        orderBy: { dueDate: "asc" },
      }),
      // 2P-49 — same soft concept bridge as Hub / Course (no second recommender).
      db.topic.findMany({
        where: { course: { userId: user.id }, conceptId: { not: null } },
        select: { id: true, name: true, courseId: true, conceptId: true },
      }),
    ]);

    const topicRows = topics.map((t) => ({
      id: t.id,
      name: t.name,
      courseId: t.courseId,
      conceptId: t.conceptId,
    }));

    const enriched = enrichAssignmentsWithConceptLinks(
      assignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate?.toISOString() ?? null,
        status: assignment.status,
        grade: assignment.grade,
        maxGrade: assignment.maxGrade,
        courseId: assignment.courseId,
        course: readableCourseTitle(assignment.course.title, assignment.course.code),
        courseCode: readableCourseCode(assignment.course),
        priority: computePriority(assignment.dueDate),
        completed: isAssignmentCompleted(assignment.status),
      })),
      topicRows,
    );

    // Phase 15 — additive adaptive plan (never blocks planner if it fails).
    let adaptivePlan: {
      activities: Array<{
        conceptId: string;
        title: string;
        action: string;
        sixTechnique?: string | null;
        scheduledStartAt: string;
        minutes: number;
        urgency: string;
        reason: string;
        room?: string;
      }>;
      needsCount: number;
      /** Planned learning blocks only — does NOT create calendar events. */
      calendarWritten: false;
    } | null = null;
    try {
      const academicItems = assignments.map((a) =>
        fromLocalAssignment(user.id, {
          id: a.id,
          courseId: a.courseId,
          title: a.title,
          description: a.description,
          dueDate: a.dueDate,
          kind: a.kind,
          status: a.status,
        }),
      );
      const plan = await buildAdaptiveLearningPlan({
        userId: user.id,
        items: academicItems,
        topics: topicRows,
      });
      adaptivePlan = {
        needsCount: plan.needs.length,
        /** Planned learning blocks only — does NOT create calendar events. */
        calendarWritten: false as const,
        activities: plan.activities.slice(0, 12).map((a) => ({
          conceptId: a.conceptId,
          title: a.title,
          action: a.action,
          sixTechnique: a.sixTechnique ?? null,
          scheduledStartAt: a.scheduledStartAt.toISOString(),
          minutes: a.minutes,
          urgency: a.urgency,
          reason: a.reason,
          room: a.room,
        })),
      };
    } catch (err) {
      console.warn("Phase 15 adaptive plan skipped:", err);
      adaptivePlan = null;
    }

    return NextResponse.json({
      success: true,
      data: enriched,
      /** Bundle B Phase 15 — optional scheduled learning activities. */
      adaptivePlan,
    });
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
          course: readableCourseTitle(assignment.course.title, assignment.course.code),
          courseCode: readableCourseCode(assignment.course),
          priority: computePriority(assignment.dueDate),
          completed: false,
          conceptId: null,
          topicId: null,
          alignmentState: "unaligned" as const,
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
        course: readableCourseTitle(assignment.course.title, assignment.course.code),
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
