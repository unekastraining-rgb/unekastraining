/**
 * Phase 16 — Extract learning-relevant text from Core notes without mutation.
 */

import type { NoteDocument } from "@/lib/core/note-types";
import type {
  CoreSourceType,
  CoreUnderstandingStatus,
} from "@/lib/learning/core/types";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Collect plain text from a NoteDocument.
 * Pure — does not modify the document.
 */
export function extractTextFromNoteDocument(
  doc: NoteDocument | null | undefined,
): {
  text: string;
  sourceType: CoreSourceType;
  understanding: CoreUnderstandingStatus;
  hasInk: boolean;
  hasDrawing: boolean;
} {
  if (!doc) {
    return {
      text: "",
      sourceType: "note",
      understanding: "unavailable",
      hasInk: false,
      hasDrawing: false,
    };
  }

  const parts: string[] = [];

  if (doc.typed?.trim()) parts.push(doc.typed.trim());
  if (doc.typedHtml?.trim()) {
    const plain = stripHtml(doc.typedHtml);
    if (plain) parts.push(plain);
  }
  if (doc.outline?.length) parts.push(doc.outline.filter(Boolean).join("\n"));
  if (doc.outlineNodes?.length) {
    parts.push(
      doc.outlineNodes
        .map((n) => n.text?.trim())
        .filter(Boolean)
        .join("\n"),
    );
  }
  if (doc.cornell) {
    const c = doc.cornell;
    for (const field of ["cues", "notes", "summary"] as const) {
      const v = c[field];
      if (typeof v === "string" && v.trim()) parts.push(v.trim());
    }
  }
  if (doc.qa?.pairs?.length) {
    for (const p of doc.qa.pairs) {
      if (p.question?.trim()) parts.push(p.question.trim());
      if (p.answer?.trim()) parts.push(p.answer.trim());
    }
  }
  if (doc.concepts?.items?.length) {
    for (const item of doc.concepts.items) {
      if (item.term?.trim()) parts.push(item.term.trim());
      if (item.definition?.trim()) parts.push(item.definition.trim());
    }
  }
  if (doc.pageTextBoxes?.length) {
    for (const box of doc.pageTextBoxes) {
      if (box.text?.trim()) parts.push(box.text.trim());
    }
  }
  if (doc.canvas?.stickies?.length) {
    for (const s of doc.canvas.stickies) {
      if (s.text?.trim()) parts.push(s.text.trim());
    }
  }
  if (doc.audioClips?.length) {
    for (const clip of doc.audioClips) {
      if (clip.transcript?.trim()) parts.push(clip.transcript.trim());
    }
  }

  const text = parts.join("\n").trim();
  const hasInk =
    (doc.strokes?.length ?? 0) > 0 ||
    (doc.annotations?.length ?? 0) > 0 ||
    (doc.canvas?.strokes?.length ?? 0) > 0;
  const hasDrawing =
    (doc.canvas?.shapes?.length ?? 0) > 0 ||
    (doc.pageImages?.length ?? 0) > 0 ||
    Boolean(doc.pdfMaterialId);

  let sourceType: CoreSourceType = "note";
  if (text && hasInk) sourceType = "mixed";
  else if (!text && hasInk) sourceType = "handwriting";
  else if (!text && hasDrawing) sourceType = "drawing";
  else if (doc.pdfMaterialId) sourceType = "pdf";

  let understanding: CoreUnderstandingStatus = "unavailable";
  if (text.length >= 20) understanding = "understood";
  else if (text.length > 0) understanding = "partially_understood";
  else if (hasInk || hasDrawing) understanding = "unavailable";

  return { text, sourceType, understanding, hasInk, hasDrawing };
}

/**
 * Parse contentJson string → NoteDocument safely (never throws to caller as mutate).
 */
export function parseNoteDocumentJson(
  contentJson: string | null | undefined,
): NoteDocument | null {
  if (!contentJson?.trim()) return null;
  try {
    const parsed = JSON.parse(contentJson) as NoteDocument;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Prefer document extraction; fall back to Note.content string.
 * Never writes back.
 */
export function extractCoreText(input: {
  content?: string | null;
  contentJson?: string | null;
}): {
  text: string;
  sourceType: CoreSourceType;
  understanding: CoreUnderstandingStatus;
  document: NoteDocument | null;
} {
  const document = parseNoteDocumentJson(input.contentJson);
  const fromDoc = extractTextFromNoteDocument(document);
  if (fromDoc.text.trim()) {
    return {
      text: fromDoc.text,
      sourceType: fromDoc.sourceType,
      understanding: fromDoc.understanding,
      document,
    };
  }
  const plain = input.content?.trim() ?? "";
  return {
    text: plain,
    sourceType: plain ? "note" : fromDoc.sourceType,
    understanding: plain.length >= 20
      ? "understood"
      : plain
        ? "partially_understood"
        : fromDoc.understanding,
    document,
  };
}
