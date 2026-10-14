import { NextResponse } from "next/server";

import { StudyActivityType } from "@/generated/prisma";
import { applySm2Review, type ReviewRating } from "@/lib/academic";
import { db } from "@/lib/db";
import { recordFlashcardReviewEvidence } from "@/lib/learning/assessment/flashcard-bridge";
import {
  adaptiveFlashcardResponsePayload,
  bindFlashcardReviewToAdaptiveSequence,
} from "@/lib/learning/sequence/flashcard-review-bind";
import { resolveUserUrlCourseId } from "@/lib/study/resolve-user-url-course-id";
import { updateTopicMasteryFromReview } from "@/lib/topics";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const now = new Date();
    const { searchParams } = new URL(request.url);
    const requestedCourseId = searchParams.get("courseId");
    const courseId = requestedCourseId
      ? await resolveUserUrlCourseId(user.id, requestedCourseId)
      : undefined;
    const scope = searchParams.get("scope");
    const dueOnly = scope !== "all";

    const cards = await db.flashcard.findMany({
      where: {
        userId: user.id,
        ...(dueOnly
          ? { OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }] }
          : {}),
        ...(courseId ? { topic: { courseId } } : {}),
      },
      include: {
        topic: {
          select: { id: true, name: true, courseId: true },
        },
      },
      orderBy: dueOnly ? { nextReviewAt: "asc" } : { createdAt: "desc" },
      take: dueOnly ? 50 : 200,
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
    const { cardId, rating, adaptiveRunId, adaptiveStep } = body as {
      cardId: string;
      rating: ReviewRating;
      adaptiveRunId?: unknown;
      adaptiveStep?: unknown;
      /** Ignored — completion is derived from evidence, never a client flag. */
      complete?: unknown;
    };
    void body.complete;

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

    // Universal Learning Engine (Phase 2B-1): flashcard → LO → Evidence → ConceptMastery.
    // Additive only; SM-2 + TopicMastery already applied. Failures must not break review.
    let evidenceAttemptId: string | null = null;
    let evidenceRecorded = false;
    try {
      const evidence = await recordFlashcardReviewEvidence({
        userId: user.id,
        flashcard: {
          id: card.id,
          front: card.front,
          topicId: card.topicId,
        },
        rating,
      });
      evidenceRecorded = evidence.recorded;
      evidenceAttemptId = evidence.attemptId;
    } catch (engineError) {
      console.error(
        "ULE flashcard evidence bridge failed (review still saved):",
        engineError,
      );
    }

    try {
      const { syncFlashcardRetentionItem } = await import(
        "@/lib/learning/retention"
      );
      await syncFlashcardRetentionItem({
        userId: user.id,
        flashcardId: flashcard.id,
        topicId: card.topicId,
        nextReviewAt: flashcard.nextReviewAt,
      });
    } catch (retentionError) {
      console.error(
        "ULE flashcard retention bridge failed (review still saved):",
        retentionError,
      );
    }

    // Phase 2G-54 — Adaptive bind only when context present + evidence written.
    // Soft-fail: review response still succeeds if Adaptive bind fails.
    let adaptive:
      | ReturnType<typeof adaptiveFlashcardResponsePayload>
      | undefined;
    try {
      const bindResult = await bindFlashcardReviewToAdaptiveSequence({
        userId: user.id,
        flashcardId: card.id,
        adaptiveRunId,
        adaptiveStep,
        recorded: evidenceRecorded,
        attemptId: evidenceAttemptId,
      });
      adaptive = adaptiveFlashcardResponsePayload(bindResult);
      if (bindResult.kind === "error") {
        console.error(
          "Flashcard Adaptive bind failed (review still saved):",
          bindResult.code,
          bindResult.message,
        );
      }
    } catch (adaptiveError) {
      console.error(
        "Flashcard Adaptive bind threw (review still saved):",
        adaptiveError,
      );
    }

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

    return NextResponse.json({
      success: true,
      data: flashcard,
      ...(adaptive ? { adaptive } : {}),
    });
  } catch (error) {
    console.error("Failed to review flashcard:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record review." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json().catch(() => ({}))) as {
      courseId?: string;
      ids?: unknown;
      id?: unknown;
    };
    const courseId = body.courseId?.trim();
    const rawIds = Array.isArray(body.ids)
      ? body.ids
      : typeof body.id === "string"
        ? [body.id]
        : [];
    const ids = rawIds
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);

    if (ids.length > 0) {
      const result = await db.flashcard.deleteMany({
        where: { id: { in: ids }, userId: user.id },
      });
      return NextResponse.json({
        success: true,
        data: { deleted: result.count },
      });
    }

    if (!courseId) {
      return NextResponse.json(
        {
          success: false,
          error: "courseId or ids is required to delete flashcards.",
        },
        { status: 400 },
      );
    }

    const course = await db.course.findFirst({
      where: { id: courseId, userId: user.id },
      select: { id: true },
    });
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found." },
        { status: 404 },
      );
    }

    const result = await db.flashcard.deleteMany({
      where: {
        userId: user.id,
        topic: { courseId },
      },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: result.count },
    });
  } catch (error) {
    console.error("Failed to delete flashcards:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete flashcards." },
      { status: 500 },
    );
  }
}
