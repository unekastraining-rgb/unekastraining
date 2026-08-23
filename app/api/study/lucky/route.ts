import { NextResponse } from "next/server";

import { buildLuckySession } from "@/lib/csl/lucky-engine";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();
    const now = new Date();

    const [missedQuestions, dueFlashcards, weakTopics, lowUnderstanding, lowRecall] =
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
        db.topicMastery.count({
          where: { userId: user.id, recall: { lt: 0.5 } },
        }),
      ]);

    const plan = buildLuckySession({
      missedQuestions,
      dueFlashcards,
      weakTopics,
      lowUnderstanding,
      lowRecall,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        context: {
          missedQuestions,
          dueFlashcards,
          weakTopics,
          lowUnderstanding,
          lowRecall,
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
