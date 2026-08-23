import { NextResponse } from "next/server";

import { parseNoteDocument } from "@/lib/core/note-types";
import { noteDocumentToMarkdown } from "@/lib/notes/export-markdown";
import { buildNotesPdfBlob } from "@/lib/notes/export-pdf";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const format = searchParams.get("format") ?? "markdown";

    const notes = await db.note.findMany({
      where: {
        userId: user.id,
        ...(courseId ? { courseId } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { course: { select: { title: true } } },
    });

    if (notes.length === 0) {
      return NextResponse.json({ success: false, error: "No notes to export." }, { status: 404 });
    }

    if (format === "pdf") {
      const pdfBytes = await buildNotesPdfBlob(
        notes.map((note) => ({
          title: note.title,
          method: note.method,
          content: note.content,
          contentJson: note.contentJson,
          courseTitle: note.course?.title,
        })),
      );
      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="studyhaul-notes.pdf"',
        },
      });
    }

    const sections = notes.map((note) => {
      const doc = parseNoteDocument(note.contentJson);
      const header = note.course?.title
        ? `# ${note.title ?? "Untitled"}\n*${note.course.title}*`
        : `# ${note.title ?? "Untitled"}`;
      const body = noteDocumentToMarkdown(
        note.title ?? "Untitled",
        note.method,
        doc,
        note.content,
      );
      return `${header}\n\n${body}`;
    });

    const markdown = sections.join("\n\n---\n\n");

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="studyhaul-notes.md"',
      },
    });
  } catch (error) {
    console.error("Notes export failed:", error);
    return NextResponse.json({ success: false, error: "Failed to export notes." }, { status: 500 });
  }
}
