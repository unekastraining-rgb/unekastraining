import { NextResponse } from "next/server";

import type { NoteMethod } from "@/generated/prisma";
import { db } from "@/lib/db";
import { emptyDocument } from "@/lib/core/note-types";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    const notes = await db.note.findMany({
      where: {
        userId: user.id,
        ...(courseId ? { courseId } : {}),
      },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      include: {
        course: { select: { id: true, title: true, color: true } },
        material: { select: { id: true, title: true, type: true } },
      },
    });

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error("Failed to list notes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load notes." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const { title, courseId, topicId, method, materialId, contentJson } = body as {
      title?: string;
      courseId?: string;
      topicId?: string;
      method?: NoteMethod;
      materialId?: string;
      contentJson?: string;
    };

    const doc = contentJson ? contentJson : JSON.stringify(emptyDocument());
    const note = await db.note.create({
      data: {
        userId: user.id,
        title: title?.trim() || "Untitled note",
        content: "",
        method: method ?? "BLANK",
        contentJson: typeof doc === "string" ? doc : JSON.stringify(doc),
        courseId: courseId ?? null,
        topicId: topicId ?? null,
        materialId: materialId ?? null,
      },
      include: {
        course: { select: { id: true, title: true, color: true } },
        material: { select: { id: true, title: true, type: true } },
      },
    });

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (error) {
    console.error("Failed to create note:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create note." },
      { status: 500 },
    );
  }
}
