import { NextResponse } from "next/server";

import { AssignmentStatus } from "@/generated/prisma";
import { buildMixedReviewPlan } from "@/lib/csl/mixed-review";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import { db } from "@/lib/db";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import { resolveLoopFocusTopic } from "@/lib/study/resolve-loop-focus-topic";
import { resolveUrlCourseId } from "@/lib/study/resolve-url-course-id";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    await backfillUserCourseTopicsIfEmpty(user.id);
    const now = new Date();
    const { searchParams } = new URL(request.url);
    const requestedCourseId = searchParams.get("courseId")?.trim() || undefined;
    const urlTopic = searchParams.get("topic")?.trim() || null;

    const userCourses = await db.course.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    const courseIds = userCourses.map((course) => course.id);
    const resolvedCourseId = resolveUrlCourseId(requestedCourseId, courseIds) || undefined;

    const [missedQuestions, dueFlashcards, weakTopics, lowUnderstanding, primaryCourse] =
      await Promise.all([
        db.missedQuestion.count({
          where: { userId: user.id, mastered: false },
        }),
        db.flashcard.count({
          where: {
            userId: user.id,
            OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
          },
        }),
        db.topicMastery.count({
          where: { userId: user.id, proficiency: { lt: 0.55 } },
        }),
        db.topicMastery.count({
          where: { userId: user.id, understanding: { lt: 0.5 } },
        }),
        resolvedCourseId
          ? db.course.findFirst({
              where: { id: resolvedCourseId, userId: user.id },
              select: {
                id: true,
                title: true,
                topics: {
                  orderBy: { sortOrder: "asc" },
                  take: 24,
                  select: { name: true },
                },
              },
            })
          : Promise.resolve(null),
      ]);

    const topicNames =
      primaryCourse?.topics
        .map((topic) => topic.name)
        .filter((name) => !isMetaSyllabusTopic(name)) ?? [];
    const focusTopic = resolveLoopFocusTopic(urlTopic, topicNames);

    const steps = buildMixedReviewPlan({
      missedQuestions,
      dueFlashcards,
      weakTopics,
      lowUnderstanding,
      courseId: primaryCourse?.id ?? null,
      focusTopic,
    });

    const pendingDeadlines = await db.assignment.count({
      where: {
        course: { userId: user.id },
        status: {
          in: [AssignmentStatus.NOT_STARTED, AssignmentStatus.IN_PROGRESS],
        },
        dueDate: { lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
      },
    });

    const summary =
      pendingDeadlines > 0
        ? `Deadline-aware mix: ${steps.length} activities tuned to your gaps.`
        : `Balanced Lucky loop across ${steps.length} retention activities.`;

    return NextResponse.json({
      success: true,
      data: {
        steps,
        summary,
        courseId: primaryCourse?.id ?? null,
        courseTitle: primaryCourse?.title ?? null,
        focusTopic,
        topics: topicNames,
      },
    });
  } catch (error) {
    console.error("Failed to build mixed review:", error);
    return NextResponse.json(
      { success: false, error: "Failed to build mixed review." },
      { status: 500 },
    );
  }
}
