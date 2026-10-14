import { NextResponse } from "next/server";

import type { NoteMethod } from "@/generated/prisma";
import { jsonErrorFromUnknown } from "@/lib/api/http-errors";
import { db } from "@/lib/db";
import { resolveOwnedNoteLinks } from "@/lib/notes/owned-note-links";
import { logOpsEvent } from "@/lib/ops/safe-log";
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
    return jsonErrorFromUnknown(error, "Failed to load note.");
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

    // Optional optimistic concurrency — reject stale clients.
    const expectedUpdatedAtRaw = body.expectedUpdatedAt ?? body.updatedAt;
    if (
      typeof expectedUpdatedAtRaw === "string" &&
      expectedUpdatedAtRaw.trim()
    ) {
      const expected = new Date(expectedUpdatedAtRaw);
      if (
        !Number.isNaN(expected.getTime()) &&
        existing.updatedAt.getTime() !== expected.getTime()
      ) {
        logOpsEvent("core.save.conflict", { status: 409, code: "stale_note" });
        return NextResponse.json(
          {
            success: false,
            error: "Note was updated elsewhere. Reload and try again.",
            code: "stale_note",
            updatedAt: existing.updatedAt.toISOString(),
          },
          { status: 409 },
        );
      }
    }

    let materialIdUpdate: string | null | undefined = undefined;
    let courseIdUpdate: string | null | undefined = undefined;
    let topicIdUpdate: string | null | undefined = undefined;

    if (
      body.materialId !== undefined ||
      body.courseId !== undefined ||
      body.topicId !== undefined
    ) {
      const links = await resolveOwnedNoteLinks(user.id, {
        courseId:
          body.courseId !== undefined ? body.courseId : existing.courseId,
        materialId:
          body.materialId !== undefined ? body.materialId : existing.materialId,
        topicId: body.topicId !== undefined ? body.topicId : existing.topicId,
      });
      if (body.materialId !== undefined) materialIdUpdate = links.materialId;
      if (body.courseId !== undefined) courseIdUpdate = links.courseId;
      if (body.topicId !== undefined) topicIdUpdate = links.topicId;
    }

    const note = await db.note.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.contentJson !== undefined
          ? { contentJson: body.contentJson }
          : {}),
        ...(body.method !== undefined
          ? { method: body.method as NoteMethod }
          : {}),
        ...(body.isPinned !== undefined ? { isPinned: body.isPinned } : {}),
        ...(materialIdUpdate !== undefined
          ? { materialId: materialIdUpdate }
          : {}),
        ...(courseIdUpdate !== undefined ? { courseId: courseIdUpdate } : {}),
        ...(topicIdUpdate !== undefined ? { topicId: topicIdUpdate } : {}),
      },
      include: {
        course: { select: { id: true, title: true, color: true } },
        material: { select: { id: true, title: true, type: true } },
      },
    });

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to update note.");
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
    return jsonErrorFromUnknown(error, "Failed to delete note.");
  }
}
