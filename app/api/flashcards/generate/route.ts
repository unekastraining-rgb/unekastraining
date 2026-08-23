import { NextResponse } from "next/server";

import { MaterialType } from "@/generated/prisma";
import { aiService } from "@/lib/ai";
import { isAIConfigured } from "@/lib/ai/is-configured";
import { aiUnavailableResponse } from "@/lib/ai/http";
import { db } from "@/lib/db";
import { aiSourceInstruction, getUserAppSettings } from "@/lib/settings/app-settings";
import { getOrCreateDefaultTopic } from "@/lib/topics";
import { getOrCreateDefaultUser } from "@/lib/user";

interface GeneratedCard {
  front: string;
  back: string;
}

function parseCardsFromResponse(content: string): GeneratedCard[] {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? content).trim();
  const parsed = JSON.parse(raw) as { cards: GeneratedCard[] };

  if (!Array.isArray(parsed.cards)) {
    throw new Error("AI response did not include flashcards.");
  }

  return parsed.cards
    .filter((card) => card.front?.trim() && card.back?.trim())
    .slice(0, 12);
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "courseId is required." },
        { status: 400 },
      );
    }

    const course = await db.course.findFirst({
      where: { id: courseId, userId: user.id },
      include: {
        materials: {
          where: { type: MaterialType.SYLLABUS },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found." },
        { status: 404 },
      );
    }

    if (!isAIConfigured()) {
      return aiUnavailableResponse("Flashcard generation");
    }

    const sourceText =
      course.materials[0]?.extractedText?.trim() ||
      `${course.title} ${course.description ?? ""}`.trim();

    if (!sourceText) {
      return NextResponse.json(
        {
          success: false,
          error: "No syllabus text found. Upload a syllabus for this course first.",
        },
        { status: 400 },
      );
    }

    const appSettings = await getUserAppSettings(user.id);

    const result = await aiService.complete(
      [
        {
          role: "system",
          content:
            "You generate concise study flashcards and respond with JSON only.",
        },
        {
          role: "user",
          content: `Create 8 study flashcards from this course material.

${aiSourceInstruction(appSettings.aiSourceMode)}

Return ONLY JSON:
{
  "cards": [
    { "front": "question", "back": "answer" }
  ]
}

Course: ${course.title}
Material:
${sourceText.slice(0, 8000)}`,
        },
      ],
      { temperature: 0.3, maxTokens: 2048 },
    );

    const cards = parseCardsFromResponse(result.content);
    const topic = await getOrCreateDefaultTopic(courseId);

    const created = await db.$transaction(
      cards.map((card) =>
        db.flashcard.create({
          data: {
            front: card.front,
            back: card.back,
            userId: user.id,
            topicId: topic.id,
            nextReviewAt: new Date(),
          },
        }),
      ),
    );

    return NextResponse.json(
      { success: true, data: created, count: created.length },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to generate flashcards:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate flashcards.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
