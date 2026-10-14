import { NextResponse } from "next/server";

import { AssignmentStatus } from "@/generated/prisma";
import {
  buildColdStartFocusTopics,
  buildStudyNowPlan,
  enrichStudyNowBlocksForCourse,
  type StudyMinutes,
} from "@/lib/csl/study-now";
import { enrichStudyNowFocusTopicsWithUleBridge } from "@/lib/learning/study-now-ule-bridge";
import { getSixRecommendations } from "@/lib/csl/six-recommendations";
import { readableCourseTitle } from "@/lib/courses/display-name";
import { db } from "@/lib/db";
import { pickColdStartTopic } from "@/lib/study/cold-start-topic";
import { getOrCreateDefaultUser } from "@/lib/user";
import {
  backfillCourseTopicsIfEmpty,
  backfillUserCourseTopicsIfEmpty,
} from "@/lib/syllabus/enrich-course-from-syllabus";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";

const VALID_MINUTES = [5, 10, 20, 30, 45, 60] as const;

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    await backfillUserCourseTopicsIfEmpty(user.id);
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

    let scopedCourseId = courseId;
    if (!scopedCourseId) {
      const primary = await db.course.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });
      scopedCourseId = primary?.id;
    }

    if (scopedCourseId) {
      await backfillCourseTopicsIfEmpty(scopedCourseId);
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
      courseRecord,
    ] = await Promise.all([
      db.assignment.count({
        where: {
          course: { userId: user.id },
          ...(scopedCourseId ? { courseId: scopedCourseId } : {}),
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
          ...(scopedCourseId ? { topic: { courseId: scopedCourseId } } : {}),
        },
      }),
      db.missedQuestion.count({
        where: {
          userId: user.id,
          mastered: false,
          ...(scopedCourseId ? { courseId: scopedCourseId } : {}),
        },
      }),
      db.flashcard.count({
        where: {
          userId: user.id,
          OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
          ...(scopedCourseId ? { topic: { courseId: scopedCourseId } } : {}),
        },
      }),
      getSixRecommendations(user.id, 3, scopedCourseId),
      scopedCourseId
        ? db.course.findFirst({
            where: { id: scopedCourseId, userId: user.id },
            select: {
              title: true,
              code: true,
              topics: {
                orderBy: { sortOrder: "asc" },
                take: 24,
                select: { name: true },
              },
            },
          })
        : Promise.resolve(null),
    ]);

    let focusTopics = recommendations.map((item) => ({
      topicId: item.topicId,
      topicName: item.topicName,
      courseId: item.courseId,
      courseTitle: item.courseTitle,
      component: item.component,
      componentTitle: item.componentTitle,
      href: item.href,
      reason: item.reason,
      proficiency: item.proficiency,
    }));

    const readableTitle = courseRecord
      ? readableCourseTitle(courseRecord.title, courseRecord.code)
      : focusTopics[0]?.courseTitle ?? null;

    if (focusTopics.length === 0 && scopedCourseId && courseRecord) {
      focusTopics = buildColdStartFocusTopics({
        courseId: scopedCourseId,
        courseTitle: readableTitle ?? "Your course",
        topicNames: courseRecord.topics.map((topic) => topic.name),
      });
    }

    // 2G-70 WS6 — optional ULE Adaptive entry when Topic.conceptId already exists.
    // Never invents concepts; never writes evidence; does not replace the plan.
    const topicIds = focusTopics
      .map((t) => t.topicId)
      .filter((id) => id && !id.startsWith("cold-start-"));
    const conceptIdByTopicId = new Map<string, string | null>();
    if (topicIds.length > 0) {
      const linked = await db.topic.findMany({
        where: {
          id: { in: topicIds },
          course: { userId: user.id },
        },
        select: { id: true, conceptId: true },
      });
      for (const row of linked) {
        conceptIdByTopicId.set(row.id, row.conceptId);
      }
    }
    const uleEnrichedFocus = enrichStudyNowFocusTopicsWithUleBridge(
      focusTopics,
      conceptIdByTopicId,
    );

    const coldStartTopic = pickColdStartTopic(
      courseRecord?.topics.map((topic) => topic.name) ??
        focusTopics.map((topic) => topic.topicName),
    );

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

    const effectiveCourseId = scopedCourseId ?? focusTopics[0]?.courseId ?? null;

    const blocks = enrichStudyNowBlocksForCourse(plan.blocks, {
      courseId: effectiveCourseId,
      courseTitle: readableTitle,
      focusTopics,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        blocks,
        courseId: effectiveCourseId,
        courseTitle: readableTitle,
        coldStartTopic,
        topicNames:
          courseRecord?.topics
            .map((topic) => topic.name)
            .filter((name) => !isMetaSyllabusTopic(name)) ?? [],
        context: {
          pendingAssignments,
          weakTopics,
          missedQuestions,
          dueFlashcards,
        },
        recommendations: focusTopics,
        /** Additive ULE bridge — optional Adaptive CTAs when concept linked. */
        uleFocusTopics: uleEnrichedFocus,
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
