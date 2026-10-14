/**
 * Bundle E — Core learning action links (presentation).
 * Read-only; never mutates note content.
 */

import { NextResponse } from "next/server";

import { getOrCreateDefaultUser } from "@/lib/user";
import { db } from "@/lib/db";
import { buildCoreLearningContent } from "@/lib/learning/core";
import { coreLearningActionLinks } from "@/lib/learning/unified-experience";

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json()) as {
      noteId?: string;
      courseId?: string | null;
      materialId?: string | null;
    };

    const noteId = body.noteId?.trim();
    if (!noteId) {
      return NextResponse.json(
        { success: false, error: "noteId required" },
        { status: 400 },
      );
    }

    // Ownership — never trust client userId.
    const note = await db.note.findFirst({
      where: { id: noteId, userId: user.id },
      select: {
        id: true,
        userId: true,
        title: true,
        content: true,
        contentJson: true,
      },
    });

    if (!note) {
      return NextResponse.json(
        { success: false, error: "Note not found." },
        { status: 404 },
      );
    }

    let courseTitle: string | null = null;
    const courseId = body.courseId?.trim() || null;
    if (courseId) {
      const course = await db.course.findFirst({
        where: { id: courseId, userId: user.id },
        select: { title: true },
      });
      courseTitle = course?.title ?? null;
    }

    const content = buildCoreLearningContent({
      sourceId: note.id,
      userId: note.userId,
      title: note.title,
      content: note.content,
      contentJson: note.contentJson,
    });

    // Read-only guarantee — original note fields never written back.
    const actions = coreLearningActionLinks(content, {
      courseId,
      materialId: body.materialId?.trim() || null,
      courseTitle,
    });

    return NextResponse.json({
      success: true,
      understanding: content.understanding,
      concepts: content.concepts ?? [],
      actions,
      contentUnchanged: true,
    });
  } catch (error) {
    console.error("Core learning-actions failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not resolve learning actions." },
      { status: 500 },
    );
  }
}
