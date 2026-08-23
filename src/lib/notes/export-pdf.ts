import type { NoteMethod } from "@/generated/prisma";

import type { NoteDocument } from "@/lib/core/note-types";
import { noteDocumentToMarkdown } from "@/lib/notes/export-markdown";

export function notesToPdfLines(
  notes: Array<{
    title: string | null;
    method: NoteMethod;
    content: string;
    contentJson: string | null;
    courseTitle?: string | null;
  }>,
): string[] {
  const lines: string[] = [];
  for (const note of notes) {
    let doc: NoteDocument;
    try {
      doc = note.contentJson
        ? { ...JSON.parse(note.contentJson) }
        : { tool: "type", typed: note.content, strokes: [] };
    } catch {
      doc = { tool: "type", typed: note.content, strokes: [] };
    }

    lines.push(note.courseTitle ? `${note.title ?? "Untitled"} (${note.courseTitle})` : (note.title ?? "Untitled"));
    lines.push("");
    const markdown = noteDocumentToMarkdown(note.title ?? "Untitled", note.method, doc, note.content);
    for (const line of markdown.split("\n")) {
      lines.push(line.replace(/^#+\s*/, "").replace(/\*\*/g, ""));
    }
    lines.push("");
    lines.push("—".repeat(40));
    lines.push("");
  }
  return lines;
}

export async function buildNotesPdfBlob(
  notes: Array<{
    title: string | null;
    method: NoteMethod;
    content: string;
    contentJson: string | null;
    courseTitle?: string | null;
  }>,
): Promise<Uint8Array> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const lines = notesToPdfLines(notes);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Study Haul — Notes Export", margin, y);
  y += 28;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line || " ", maxWidth) as string[];
    for (const segment of wrapped) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(segment, margin, y);
      y += 14;
    }
  }

  return doc.output("arraybuffer") as unknown as Uint8Array;
}
