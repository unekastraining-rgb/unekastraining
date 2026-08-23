import { NextResponse } from "next/server";

import type { NoteMethod } from "@/generated/prisma";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;

    const note = await db.note.findFirst({
      where: { id, userId: user.id },
      include: {
        course: { select: { id: true, title: true, color: true } },
        material: {
          select: {
            id: true,
            title: true,
            type: true,
            extractedText: true,
            url: true,
            filePath: true,
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json(
        { success: false, error: "Note not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    console.error("Failed to load note:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load note." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;
    const body = await request.json();

    const existing = await db.note.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Note not found." },
        { status: 404 },
      );
    }

    const note = await db.note.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.contentJson !== undefined
          ? { contentJson: body.contentJson }
          : {}),
        ...(body.method !== undefined ? { method: body.method as NoteMethod } : {}),
        ...(body.isPinned !== undefined ? { isPinned: body.isPinned } : {}),
        ...(body.materialId !== undefined ? { materialId: body.materialId } : {}),
      },
      include: {
        course: { select: { id: true, title: true, color: true } },
        material: { select: { id: true, title: true, type: true } },
      },
    });

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    console.error("Failed to update note:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update note." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;

    const existing = await db.note.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Note not found." },
        { status: 404 },
      );
    }

    await db.note.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete note:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete note." },
      { status: 500 },
    );
  }
}
