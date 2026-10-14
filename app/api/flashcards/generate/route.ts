import { NextResponse } from "next/server";

import { aiService } from "@/lib/ai";
import { isAIConfigured } from "@/lib/ai/is-configured";
import { aiUnavailableResponse } from "@/lib/ai/http";
import {
  loadCourseSourceText,
  loadMaterialSourceText,
} from "@/lib/ai/course-source";
import {
  formatStudyExtractContext,
  loadPersistedStudyExtract,
} from "@/lib/core/study-extract-store";
import { db } from "@/lib/db";
import { aiSourceInstruction, getUserAppSettings } from "@/lib/settings/app-settings";
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
    const courseId = typeof body.courseId === "string" ? body.courseId : null;
    const materialId = typeof body.materialId === "string" ? body.materialId : null;
    const topicFocus =
      typeof body.topic === "string" && body.topic.trim()
        ? body.topic.trim().slice(0, 200)
        : "";

    if (!courseId && !materialId) {
      return NextResponse.json(
        { success: false, error: "courseId or materialId is required." },
        { status: 400 },
      );
    }

    if (!isAIConfigured()) {
      return aiUnavailableResponse("Flashcard generation");
    }

    const source = materialId
      ? await loadMaterialSourceText(user.id, materialId, 14000)
      : await loadCourseSourceText(user.id, courseId, 14000);

    if (!source?.text?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No readable text found. Upload a textbook chapter, PDF, or syllabus with extractable text first.",
        },
        { status: 400 },
      );
    }

    const studyExtract = await loadPersistedStudyExtract({
      userId: user.id,
      materialId,
      courseId,
    });
    const studyBlock = studyExtract
      ? formatStudyExtractContext(studyExtract, { maxChars: 10000 })
      : "";

    const resolvedCourseId =
      courseId ??
      (
        await db.courseMaterial.findFirst({
          where: { id: materialId!, course: { userId: user.id } },
          select: { courseId: true },
        })
      )?.courseId;

    if (!resolvedCourseId) {
      return NextResponse.json(
        { success: false, error: "Course not found for that material." },
        { status: 404 },
      );
    }

    const course = await db.course.findFirst({
      where: { id: resolvedCourseId, userId: user.id },
      select: { id: true, title: true },
    });
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found." },
        { status: 404 },
      );
    }

    const appSettings = await getUserAppSettings(user.id);
    const focusLine = topicFocus
      ? `Focus only on this chapter/topic: "${topicFocus}". Prefer key definitions, processes, and exam-worthy details from that section.`
      : "Cover the most important concepts in the source.";

    const result = await aiService.complete(
      [
        {
          role: "system",
          content:
            "You generate concise high-value study flashcards. Prefer study-extract concepts when provided. Skip page numbers and fluff. Respond with JSON only.",
        },
        {
          role: "user",
          content: `Create 8–12 study flashcards from this course material for "${course.title}".

${focusLine}

${aiSourceInstruction(appSettings.aiSourceMode)}

${
  studyBlock
    ? `STUDY EXTRACT (prefer this):\n${studyBlock}\n\nRAW SOURCE (fallback):\n${source.text.slice(0, 5000)}`
    : `SOURCE:\n${source.text}`
}

Return ONLY JSON:
{
  "cards": [
    { "front": "question", "back": "answer" }
  ]
}`,
        },
      ],
      {
        temperature: 0.4,
        maxTokens: 2000,
        includeOpenAIPro: appSettings.aiUseOpenAIPro,
      },
    );

    const cards = parseCardsFromResponse(result.content);
    if (cards.length === 0) {
      return NextResponse.json(
        { success: false, error: "No flashcards were generated." },
        { status: 502 },
      );
    }

    const topicName = topicFocus || "General";
    let topic = await db.topic.findFirst({
      where: { courseId: course.id, name: topicName },
    });
    if (!topic) {
      const maxSort = await db.topic.aggregate({
        where: { courseId: course.id },
        _max: { sortOrder: true },
      });
      topic = await db.topic.create({
        data: {
          courseId: course.id,
          name: topicName,
          description: topicFocus
            ? `Generated from material focus: ${topicFocus}`
            : "Generated study flashcards",
          sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
        },
      });
    }

    await db.$transaction(
      cards.map((card) =>
        db.flashcard.create({
          data: {
            userId: user.id,
            topicId: topic!.id,
            front: card.front.trim(),
            back: card.back.trim(),
          },
        }),
      ),
    );

    return NextResponse.json({
      success: true,
      created: cards.length,
      topic: topic.name,
    });
  } catch (error) {
    console.error("Failed to generate flashcards:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate flashcards.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
