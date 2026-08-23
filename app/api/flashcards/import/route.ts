import { NextResponse } from "next/server";

import { parseApkgBuffer } from "@/lib/flashcards/parse-apkg";
import { parseFlashcardImportText } from "@/lib/flashcards/parse-import";
import { db } from "@/lib/db";
import { getOrCreateDefaultTopic } from "@/lib/topics";
import { requireUser } from "@/lib/user";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const courseId = String(form.get("courseId") ?? "");
      const file = form.get("file");
      if (!courseId) {
        return NextResponse.json(
          { success: false, error: "courseId is required." },
          { status: 400 },
        );
      }
      if (!(file instanceof Blob)) {
        return NextResponse.json(
          { success: false, error: "Upload a .apkg file." },
          { status: 400 },
        );
      }
      const course = await db.course.findFirst({
        where: { id: courseId, userId: user.id },
      });
      if (!course) {
        return NextResponse.json({ success: false, error: "Course not found." }, { status: 404 });
      }
      const parsed = await parseApkgBuffer(await file.arrayBuffer());
      const topic = await getOrCreateDefaultTopic(courseId);
      const created = await Promise.all(
        parsed.cards.map((card) =>
          db.flashcard.create({
            data: {
              userId: user.id,
              topicId: topic.id,
              front: card.front,
              back: card.back,
            },
          }),
        ),
      );
      return NextResponse.json({
        success: true,
        data: {
          imported: created.length,
          deckTitle: parsed.deckName,
          topicId: topic.id,
          format: "apkg",
        },
      });
    }

    const body = await request.json();
    const { courseId, cards, deckTitle, text } = body as {
      courseId?: string;
      deckTitle?: string;
      cards?: Array<{ front: string; back: string }>;
      text?: string;
    };

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "courseId is required." },
        { status: 400 },
      );
    }

    const course = await db.course.findFirst({
      where: { id: courseId, userId: user.id },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found." },
        { status: 404 },
      );
    }

    const parsedFromText = text?.trim() ? parseFlashcardImportText(text) : [];
    const validCards = [...(cards ?? []), ...parsedFromText]
      .filter((card) => card.front?.trim() && card.back?.trim())
      .slice(0, 500);

    if (validCards.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one valid flashcard is required." },
        { status: 400 },
      );
    }

    const topic = await getOrCreateDefaultTopic(courseId);
    const created = await Promise.all(
      validCards.map((card) =>
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

    return NextResponse.json({
      success: true,
      data: {
        imported: created.length,
        deckTitle: deckTitle ?? `${course.title} deck`,
        topicId: topic.id,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "UnauthorizedError") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("Flashcard import failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to import flashcards." },
      { status: 500 },
    );
  }
}
