import { NextResponse } from "next/server";

import { aiService } from "@/lib/ai";
import { isAIConfigured } from "@/lib/ai/is-configured";
import { aiUnavailableResponse } from "@/lib/ai/http";
import { loadCourseSourceText } from "@/lib/ai/course-source";
import { generateQuizForCourse } from "@/lib/quizzes/generate";
import { generateScheduleProposals } from "@/lib/schedule/proposals";
import { db } from "@/lib/db";
import { getOrCreateDefaultTopic } from "@/lib/topics";
import { getOrCreateDefaultUser } from "@/lib/user";

function parseOutline(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse((fenced?.[1] ?? content).trim()) as {
    title: string;
    summary: string;
    sections: Array<{ heading: string; bullets: string[] }>;
  };
}

function parseCards(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const parsed = JSON.parse((fenced?.[1] ?? content).trim()) as {
    cards: Array<{ front: string; back: string }>;
  };
  return parsed.cards?.filter((card) => card.front?.trim() && card.back?.trim()) ?? [];
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const courseId = typeof body.courseId === "string" ? body.courseId.trim() : "";
    const focus =
      typeof body.focus === "string" && body.focus.trim() ? body.focus.trim() : null;

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "courseId is required." },
        { status: 400 },
      );
    }

    const course = await db.course.findFirst({
      where: { id: courseId, userId: user.id },
      select: { id: true, title: true },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found." }, { status: 404 });
    }

    if (!isAIConfigured()) {
      return aiUnavailableResponse("Break this down");
    }

    const topicLabel = focus ?? course.title;

    const sourceResult = await loadCourseSourceText(user.id, courseId);
    const source =
      sourceResult?.text ??
      `Course: ${course.title}. Focus: ${topicLabel}`;

    const outlineResponse = await aiService.complete(
      [
        {
          role: "system",
          content:
            "Create a study breakdown outline from source material. Respond JSON only.",
        },
        {
          role: "user",
          content: `Focus: ${topicLabel}

SOURCE:
${source.slice(0, 12000)}

Return ONLY JSON:
{
  "title": "...",
  "summary": "2-3 sentences",
  "sections": [{"heading":"...","bullets":["..."]}]
}`,
        },
      ],
      { temperature: 0.3, jsonMode: true },
    );

    const outline = parseOutline(outlineResponse.content);

    const cardsResponse = await aiService.complete(
      [
        {
          role: "system",
          content: "Generate flashcards from study material. Respond JSON only.",
        },
        {
          role: "user",
          content: `Topic: ${topicLabel}
Outline: ${JSON.stringify(outline.sections)}

Return ONLY JSON: { "cards": [{"front":"...","back":"..."}] } (8-12 cards)`,
        },
      ],
      { temperature: 0.3, jsonMode: true },
    );

    const cards = parseCards(cardsResponse.content);
    const topic = await getOrCreateDefaultTopic(courseId);

    const createdCards = await Promise.all(
      cards.slice(0, 12).map((card) =>
        db.flashcard.create({
          data: {
            userId: user.id,
            topicId: topic.id,
            front: card.front.trim(),
            back: card.back.trim(),
          },
        }),
      ),
    );

    const quiz = await generateQuizForCourse(user.id, courseId, {
      topicName: topicLabel,
      questionCount: 5,
    });

    const proposals = await generateScheduleProposals(user.id);
    const courseProposals = proposals.filter(
      (change) =>
        change.courseId === courseId ||
        change.title.toLowerCase().includes(topicLabel.toLowerCase()),
    );

    return NextResponse.json({
      success: true,
      data: {
        outline,
        flashcardsCreated: createdCards.length,
        quizId: quiz.id,
        quizTitle: quiz.title,
        scheduleProposals: courseProposals.slice(0, 4),
        proposalCount: courseProposals.length,
      },
    });
  } catch (error) {
    console.error("Break down failed:", error);
    const message = error instanceof Error ? error.message : "Break down failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
