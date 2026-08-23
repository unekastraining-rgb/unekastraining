import { randomBytes } from "crypto";

import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

function makeShareCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const shareCode = makeShareCode();

    const board = await db.collabBoard.create({
      data: {
        userId: user.id,
        title: typeof body.title === "string" ? body.title : "Shared whiteboard",
        shareCode,
        noteId: typeof body.noteId === "string" ? body.noteId : null,
        snapshotJson: JSON.stringify(body.snapshot ?? {}),
      },
    });

    return NextResponse.json({
      success: true,
      shareCode: board.shareCode,
      boardId: board.id,
    });
  } catch (error) {
    console.error("Collab board create failed:", error);
    return NextResponse.json({ success: false, error: "Failed to create board." }, { status: 500 });
  }
}
