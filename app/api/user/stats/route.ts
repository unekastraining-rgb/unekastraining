import { NextResponse } from "next/server";

import { AssignmentStatus } from "@/generated/prisma";
import { buildProgressSnapshot } from "@/lib/csl/progress";
import { countQuizAttempts } from "@/lib/quizzes/attempts";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();
    const now = new Date();

    const [
      activeCoursesCount,
      pendingAssignments,
      dueFlashcards,
      masteries,
      quizAttempts,
      upcomingAssignment,
    ] = await Promise.all([
      db.course.count({ where: { userId: user.id } }),
      db.assignment.count({
        where: {
          course: { userId: user.id },
          status: {
            in: [AssignmentStatus.NOT_STARTED, AssignmentStatus.IN_PROGRESS],
          },
        },
      }),
      db.flashcard.count({
        where: {
          userId: user.id,
          OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
        },
      }),
      db.topicMastery.findMany({
        where: { userId: user.id },
        select: {
          proficiency: true,
          understanding: true,
          recall: true,
          application: true,
          reviewCount: true,
          lastReviewedAt: true,
        },
      }),
      countQuizAttempts(user.id),
      db.assignment.findFirst({
        where: {
          course: { userId: user.id },
          dueDate: { gte: now },
          status: {
            in: [AssignmentStatus.NOT_STARTED, AssignmentStatus.IN_PROGRESS],
          },
        },
        include: { course: { select: { title: true } } },
        orderBy: { dueDate: "asc" },
      }),
    ]);

    const progress = buildProgressSnapshot(masteries, quizAttempts);

    return NextResponse.json({
      success: true,
      data: {
        overallMastery: progress.overallMastery,
        understanding: progress.understanding,
        recall: progress.recall,
        application: progress.application,
        topicsTracked: progress.topicsTracked,
        reviewsThisWeek: progress.reviewsThisWeek,
        quizAttempts: progress.quizAttempts,
        dueFlashcards,
        pendingAssignments,
        activeCoursesCount,
        upcomingAssignment: upcomingAssignment
          ? {
              title: upcomingAssignment.title,
              course: upcomingAssignment.course.title,
              dueDate: upcomingAssignment.dueDate?.toISOString() ?? null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Failed to fetch user stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard stats." },
      { status: 500 },
    );
  }
}
