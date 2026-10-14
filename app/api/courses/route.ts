import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { withReadableCourse } from "@/lib/courses/display-name";
import { emptyDocument } from "@/lib/core/note-types";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();

    const courses = await db.course.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        topics: {
          select: { name: true },
          orderBy: { sortOrder: "asc" },
          take: 24,
        },
        materials: {
          select: {
            id: true,
            title: true,
            type: true,
            extractedText: true,
            filePath: true,
            url: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { assignments: true, materials: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      courses: courses.map((course) => ({
        ...withReadableCourse(course),
        topics: course.topics.map((topic) => topic.name),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json(
      { error: "Failed to load courses." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Class name is required." },
        { status: 400 },
      );
    }

    const course = await db.course.create({
      data: {
        title,
        code: code || null,
        userId: user.id,
        notes: {
          create: {
            userId: user.id,
            title: `${title} — notebook`,
            content: "",
            method: "BLANK",
            contentJson: JSON.stringify(emptyDocument()),
          },
        },
      },
      include: { notes: true },
    });

    return NextResponse.json(
      {
        success: true,
        course,
        noteId: course.notes[0]?.id ?? null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create course:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create class." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const rawIds = Array.isArray(body.ids)
      ? body.ids
      : body.id
        ? [body.id]
        : [];
    const ids = rawIds
      .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Course id is required." },
        { status: 400 },
      );
    }

    const owned = await db.course.findMany({
      where: { id: { in: ids }, userId: user.id },
      select: { id: true },
    });
    const ownedIds = owned.map((c) => c.id);

    if (ownedIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Course not found." },
        { status: 404 },
      );
    }

    await db.course.deleteMany({
      where: { id: { in: ownedIds }, userId: user.id },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: ownedIds.length, ids: ownedIds },
    });
  } catch (error) {
    console.error("Failed to delete course:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete course." },
      { status: 500 },
    );
  }
}
