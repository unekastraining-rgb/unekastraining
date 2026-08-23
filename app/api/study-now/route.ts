import { NextResponse } from "next/server";

import { AssignmentStatus } from "@/generated/prisma";
import { buildStudyNowPlan, type StudyMinutes } from "@/lib/csl/study-now";
import { getSixRecommendations } from "@/lib/csl/six-recommendations";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

const VALID_MINUTES = [5, 10, 20, 30, 45, 60] as const;

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const minutes = Number(body.minutes ?? 30) as StudyMinutes;
    const courseId =
      typeof body.courseId === "string" && body.courseId.trim()
        ? body.courseId.trim()
        : undefined;

    if (!VALID_MINUTES.includes(minutes as (typeof VALID_MINUTES)[number])) {
      return NextResponse.json(
        { success: false, error: "Invalid session length." },
        { status: 400 },
      );
    }

    if (courseId) {
      const course = await db.course.findFirst({
        where: { id: courseId, userId: user.id },
        select: { id: true, title: true },
      });
      if (!course) {
        return NextResponse.json(
          { success: false, error: "Course not found." },
          { status: 404 },
        );
      }
    }

    const now = new Date();
    const weekOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      pendingAssignments,
      weakTopics,
      missedQuestions,
      dueFlashcards,
      recommendations,
      courseTitle,
    ] = await Promise.all([
      db.assignment.count({
        where: {
          course: { userId: user.id },
          ...(courseId ? { courseId } : {}),
          status: {
            in: [AssignmentStatus.NOT_STARTED, AssignmentStatus.IN_PROGRESS],
          },
          dueDate: { lte: weekOut },
        },
      }),
      db.topicMastery.count({
        where: {
          userId: user.id,
          proficiency: { lt: 0.55 },
          ...(courseId ? { topic: { courseId } } : {}),
        },
      }),
      db.missedQuestion.count({
        where: {
          userId: user.id,
          mastered: false,
          ...(courseId ? { courseId } : {}),
        },
      }),
      db.flashcard.count({
        where: {
          userId: user.id,
          OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
          ...(courseId ? { topic: { courseId } } : {}),
        },
      }),
      getSixRecommendations(user.id, 3, courseId),
      courseId
        ? db.course.findFirst({
            where: { id: courseId, userId: user.id },
            select: { title: true },
          })
        : Promise.resolve(null),
    ]);

    const focusTopics = recommendations.map((item) => ({
      topicId: item.topicId,
      topicName: item.topicName,
      courseTitle: item.courseTitle,
      component: item.component,
      componentTitle: item.componentTitle,
      href: item.href,
      reason: item.reason,
      proficiency: item.proficiency,
    }));

    const plan = buildStudyNowPlan(
      minutes,
      {
        hasUpcomingDeadline: pendingAssignments > 0,
        weakTopics,
        missedQuestions,
        dueFlashcards,
      },
      focusTopics,
    );

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        courseId: courseId ?? null,
        courseTitle: courseTitle?.title ?? null,
        context: {
          pendingAssignments,
          weakTopics,
          missedQuestions,
          dueFlashcards,
        },
        recommendations: focusTopics,
      },
    });
  } catch (error) {
    console.error("Failed to build study plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to build study plan." },
      { status: 500 },
    );
  }
}
