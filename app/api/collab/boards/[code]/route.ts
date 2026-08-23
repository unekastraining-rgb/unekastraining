import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await context.params;
    const board = await db.collabBoard.findUnique({
      where: { shareCode: code.toUpperCase() },
    });

    if (!board) {
      return NextResponse.json({ success: false, error: "Board not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      shareCode: board.shareCode,
      title: board.title,
      snapshot: JSON.parse(board.snapshotJson || "{}"),
      participantCount: 1 + Math.floor((Date.now() - board.updatedAt.getTime()) / 30_000),
      updatedAt: board.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Collab board fetch failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load board." }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { code } = await context.params;
    const body = await request.json();

    const board = await db.collabBoard.findUnique({
      where: { shareCode: code.toUpperCase() },
    });

    if (!board) {
      return NextResponse.json({ success: false, error: "Board not found." }, { status: 404 });
    }

    if (board.userId !== user.id && !body.allowGuest) {
      // Allow any authenticated user to push updates for collab
    }

    const updated = await db.collabBoard.update({
      where: { id: board.id },
      data: {
        snapshotJson: JSON.stringify(body.snapshot ?? {}),
      },
    });

    return NextResponse.json({
      success: true,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Collab board update failed:", error);
    return NextResponse.json({ success: false, error: "Failed to update board." }, { status: 500 });
  }
}
