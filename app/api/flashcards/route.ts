import { NextResponse } from "next/server";

import { StudyActivityType } from "@/generated/prisma";
import { applySm2Review, type ReviewRating } from "@/lib/academic";
import { db } from "@/lib/db";
import { updateTopicMasteryFromReview } from "@/lib/topics";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const now = new Date();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    const cards = await db.flashcard.findMany({
      where: {
        userId: user.id,
        OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
        ...(courseId ? { topic: { courseId } } : {}),
      },
      include: {
        topic: {
          select: { id: true, name: true, courseId: true },
        },
      },
      orderBy: { nextReviewAt: "asc" },
      take: 50,
    });

    return NextResponse.json({ success: true, data: cards });
  } catch (error) {
    console.error("Failed to fetch flashcards:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load flashcards." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const { cardId, rating } = body as {
      cardId: string;
      rating: ReviewRating;
    };

    if (!cardId || !rating) {
      return NextResponse.json(
        { success: false, error: "cardId and rating are required." },
        { status: 400 },
      );
    }

    const card = await db.flashcard.findFirst({
      where: { id: cardId, userId: user.id },
    });

    if (!card) {
      return NextResponse.json(
        { success: false, error: "Flashcard not found." },
        { status: 404 },
      );
    }

    const updated = applySm2Review(card, rating);

    const flashcard = await db.flashcard.update({
      where: { id: cardId },
      data: updated,
    });

    await updateTopicMasteryFromReview(user.id, card.topicId, rating);

    await db.studySession.create({
      data: {
        userId: user.id,
        topicId: card.topicId,
        activityType: StudyActivityType.FLASHCARDS,
        durationSeconds: 30,
        cardsReviewed: 1,
        startedAt: new Date(),
        endedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: flashcard });
  } catch (error) {
    console.error("Failed to review flashcard:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record review." },
      { status: 500 },
    );
  }
}
