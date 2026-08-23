import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { flashcardsToAnkiTsv, flashcardsToCsv } from "@/lib/flashcards/parse-import";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const format = searchParams.get("format") ?? "csv";

    const cards = await db.flashcard.findMany({
      where: {
        userId: user.id,
        ...(courseId ? { topic: { courseId } } : {}),
      },
      select: { front: true, back: true },
      orderBy: { createdAt: "asc" },
      take: 2000,
    });

    if (cards.length === 0) {
      return NextResponse.json(
        { success: false, error: "No flashcards to export." },
        { status: 404 },
      );
    }

    const body = format === "anki" ? flashcardsToAnkiTsv(cards) : flashcardsToCsv(cards);
    const extension = format === "anki" ? "txt" : "csv";
    const contentType = format === "anki" ? "text/plain" : "text/csv";

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="studyhaul-flashcards.${extension}"`,
      },
    });
  } catch (error) {
    console.error("Flashcard export failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export flashcards." },
      { status: 500 },
    );
  }
}
