import { NextResponse } from "next/server";

import type { NoteMethod } from "@/generated/prisma";
import { jsonErrorFromUnknown } from "@/lib/api/http-errors";
import { emptyDocument } from "@/lib/core/note-types";
import { db } from "@/lib/db";
import { resolveOwnedNoteLinks } from "@/lib/notes/owned-note-links";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    // Only filter by courseId when the course is owned (else empty result).
    let ownedCourseFilter: string | undefined;
    if (courseId?.trim()) {
      const course = await db.course.findFirst({
        where: { id: courseId.trim(), userId: user.id },
        select: { id: true },
      });
      ownedCourseFilter = course?.id;
      if (!ownedCourseFilter) {
        return NextResponse.json({ success: true, data: [] });
      }
    }

    const notes = await db.note.findMany({
      where: {
        userId: user.id,
        ...(ownedCourseFilter ? { courseId: ownedCourseFilter } : {}),
      },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      include: {
        course: { select: { id: true, title: true, color: true } },
        material: { select: { id: true, title: true, type: true } },
      },
    });

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to load notes.");
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

    const links = await resolveOwnedNoteLinks(user.id, {
      courseId,
      materialId,
      topicId,
    });

    const doc = contentJson ? contentJson : JSON.stringify(emptyDocument());
    const note = await db.note.create({
      data: {
        userId: user.id,
        title: title?.trim() || "Untitled note",
        content: "",
        method: method ?? "BLANK",
        contentJson: typeof doc === "string" ? doc : JSON.stringify(doc),
        courseId: links.courseId,
        topicId: links.topicId,
        materialId: links.materialId,
      },
      include: {
        course: { select: { id: true, title: true, color: true } },
        material: { select: { id: true, title: true, type: true } },
      },
    });

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to create note.");
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json().catch(() => ({}))) as {
      ids?: unknown;
      id?: unknown;
    };
    const rawIds = Array.isArray(body.ids)
      ? body.ids
      : typeof body.id === "string"
        ? [body.id]
        : [];
    const ids = rawIds
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Notebook id is required." },
        { status: 400 },
      );
    }

    const owned = await db.note.findMany({
      where: { id: { in: ids }, userId: user.id },
      select: { id: true },
    });

    if (owned.length === 0) {
      return NextResponse.json(
        { success: false, error: "Notebook not found." },
        { status: 404 },
      );
    }

    const ownedIds = owned.map((note) => note.id);
    await db.note.deleteMany({
      where: { id: { in: ownedIds }, userId: user.id },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: ownedIds.length },
    });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to delete notebooks.");
  }
}
