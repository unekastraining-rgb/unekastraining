import { NextResponse } from "next/server";

import { buildLuckySession, enrichLuckyBlocksForCourse } from "@/lib/csl/lucky-engine";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import { resolveLoopFocusTopic } from "@/lib/study/resolve-loop-focus-topic";
import { resolveUrlCourseId } from "@/lib/study/resolve-url-course-id";
import { db } from "@/lib/db";
import {
  countDueBySource,
  syncRetentionSourcesForUser,
} from "@/lib/learning/retention";
import { getOrCreateDefaultUser } from "@/lib/user";
import {
  backfillCourseTopicsIfEmpty,
  backfillUserCourseTopicsIfEmpty,
} from "@/lib/syllabus/enrich-course-from-syllabus";

export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    await backfillUserCourseTopicsIfEmpty(user.id);
    const { searchParams } = new URL(request.url);
    const requestedCourseId = searchParams.get("courseId")?.trim() || undefined;
    const urlTopic = searchParams.get("topic")?.trim() || null;

    const userCourses = await db.course.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    const courseIds = userCourses.map((course) => course.id);
    const courseId = resolveUrlCourseId(requestedCourseId, courseIds) || undefined;

    if (courseId) {
      await backfillCourseTopicsIfEmpty(courseId);
    }
    const now = new Date();

    // Phase 2C: best-effort RetentionItem sync. Lucky UI unchanged if this fails.
    let retentionCounts: Awaited<ReturnType<typeof countDueBySource>> | null =
      null;
    try {
      await syncRetentionSourcesForUser(user.id);
      retentionCounts = await countDueBySource(user.id, now);
    } catch (retentionError) {
      console.error(
        "ULE retention sync failed (Lucky still uses legacy counts):",
        retentionError,
      );
    }

    const [
      missedQuestionsLegacy,
      dueFlashcardsLegacy,
      weakTopicsLegacy,
      lowUnderstanding,
      lowRecall,
      courseTopics,
      course,
    ] = await Promise.all([
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
        db.topicMastery.count({
          where: { userId: user.id, recall: { lt: 0.5 } },
        }),
        courseId
          ? db.topic.findMany({
              where: { courseId, course: { userId: user.id } },
              orderBy: { sortOrder: "asc" },
              take: 24,
              select: { name: true },
            })
          : Promise.resolve([] as Array<{ name: string }>),
        courseId
          ? db.course.findFirst({
              where: { id: courseId, userId: user.id },
              select: { title: true },
            })
          : Promise.resolve(null),
      ]);

    // Prefer RetentionItem counts when sync succeeded; else legacy queries.
    const missedQuestions = retentionCounts
      ? retentionCounts.missedQuestions
      : missedQuestionsLegacy;
    const dueFlashcards = retentionCounts
      ? retentionCounts.dueFlashcards
      : dueFlashcardsLegacy;
    const weakTopics = retentionCounts
      ? retentionCounts.weakMastery
      : weakTopicsLegacy;

    const topicNames = courseTopics
      .map((topic) => topic.name)
      .filter((name) => !isMetaSyllabusTopic(name));
    const coldStartTopic = resolveLoopFocusTopic(urlTopic, topicNames);

    const plan = buildLuckySession({
      missedQuestions,
      dueFlashcards,
      weakTopics,
      lowUnderstanding,
      lowRecall,
    });

    const blocks = enrichLuckyBlocksForCourse(plan.blocks, {
      courseId,
      coldStartTopic,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        blocks,
        courseId: courseId ?? null,
        courseTitle: course?.title ?? null,
        topicNames,
        coldStartTopic,
        context: {
          missedQuestions,
          dueFlashcards,
          weakTopics,
          lowUnderstanding,
          lowRecall,
          retentionDue: retentionCounts?.total ?? null,
        },
      },
    });
  } catch (error) {
    console.error("Failed to build Lucky session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to build Lucky session." },
      { status: 500 },
    );
  }
}
