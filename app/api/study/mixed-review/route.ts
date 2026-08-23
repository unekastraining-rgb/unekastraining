import { NextResponse } from "next/server";

import { AssignmentStatus } from "@/generated/prisma";
import { buildMixedReviewPlan } from "@/lib/csl/mixed-review";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();
    const now = new Date();

    const [missedQuestions, dueFlashcards, weakTopics, lowUnderstanding] =
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
      ]);

    const steps = buildMixedReviewPlan({
      missedQuestions,
      dueFlashcards,
      weakTopics,
      lowUnderstanding,
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
      data: { steps, summary },
    });
  } catch (error) {
    console.error("Failed to build mixed review:", error);
    return NextResponse.json(
      { success: false, error: "Failed to build mixed review." },
      { status: 500 },
    );
  }
}
