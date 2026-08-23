import { NextResponse } from "next/server";

import { AssignmentStatus } from "@/generated/prisma";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await params;

    const course = await db.course.findFirst({
      where: { id, userId: user.id },
      select: { id: true, title: true },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found." }, { status: 404 });
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [masteries, sessions, weakTopics, pendingAssignments, dueFlashcards] =
      await Promise.all([
        db.topicMastery.findMany({
          where: { userId: user.id, topic: { courseId: id } },
          select: { proficiency: true },
        }),
        db.studySession.findMany({
          where: { userId: user.id, courseId: id, startedAt: { gte: weekAgo } },
          select: { durationSeconds: true },
        }),
        db.topicMastery.findMany({
          where: {
            userId: user.id,
            topic: { courseId: id },
            proficiency: { lt: 0.55 },
          },
          include: { topic: { select: { id: true, name: true } } },
          orderBy: { proficiency: "asc" },
          take: 4,
        }),
        db.assignment.count({
          where: {
            courseId: id,
            status: {
              in: [AssignmentStatus.NOT_STARTED, AssignmentStatus.IN_PROGRESS],
            },
          },
        }),
        db.flashcard.count({
          where: {
            userId: user.id,
            topic: { courseId: id },
            OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: new Date() } }],
          },
        }),
      ]);

    const overallMastery =
      masteries.length === 0
        ? 0
        : Math.round(
            (masteries.reduce((sum, item) => sum + item.proficiency, 0) /
              masteries.length) *
              100,
          );

    const minutesThisWeek = Math.round(
      sessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 60,
    );

    return NextResponse.json({
      success: true,
      data: {
        courseId: id,
        courseTitle: course.title,
        overallMastery,
        topicsTracked: masteries.length,
        minutesThisWeek,
        pendingAssignments,
        dueFlashcards,
        weakTopics: weakTopics.map((row) => ({
          id: row.topic.id,
          name: row.topic.name,
          proficiency: Math.round(row.proficiency * 100),
        })),
      },
    });
  } catch (error) {
    console.error("Failed to load course progress:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load progress." },
      { status: 500 },
    );
  }
}
