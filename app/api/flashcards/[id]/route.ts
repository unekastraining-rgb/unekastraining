import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;

    const card = await db.flashcard.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!card) {
      return NextResponse.json(
        { success: false, error: "Flashcard not found." },
        { status: 404 },
      );
    }

    await db.flashcard.delete({ where: { id: card.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete flashcard:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete flashcard." },
      { status: 500 },
    );
  }
}
