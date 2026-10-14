import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import { normalizeChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import { emptyDocument, type NoteDocument } from "@/lib/core/note-types";

export { applyAiExtractToDocument } from "@/lib/core/apply-studio-to-canvas";

export async function fetchChapterStudyExtract(options: {
  courseId: string;
  materialId: string;
}): Promise<{ extract: ChapterStudyExtract; title: string }> {
  const response = await fetch("/api/core/studio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      type: "chapter-study",
      courseId: options.courseId || undefined,
      materialId: options.materialId,
    }),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error ?? "AI import failed.");
  }

  // Studio wraps payload in `data` (same shape as Assist Studio).
  const payload = (data.data ?? data) as {
    structured?: Record<string, unknown>;
    title?: string;
    noteText?: string;
  };
  const extract = normalizeChapterStudyExtract(
    (payload.structured ?? {}) as Record<string, unknown>,
  );

  const hasContent =
    Boolean(extract.chapterOverview.trim()) ||
    extract.learningObjectives.length > 0 ||
    extract.definitions.length > 0 ||
    extract.frameworks.length > 0 ||
    extract.comparisons.length > 0 ||
    extract.mustKnow.length > 0 ||
    extract.studyToRemember.length > 0 ||
    extract.testYourself.length > 0 ||
    extract.processesOrSteps.length > 0 ||
    (extract.workedExamples?.length ?? 0) > 0 ||
    extract.recommendedFormats.length > 0;

  if (!hasContent) {
    throw new Error(
      "AI returned an empty extract. Try again, or import without AI.",
    );
  }

  return {
    extract,
    title: String(payload.title ?? extract.title ?? "Study extract"),
  };
}

export async function importExtractQaToFlashcards(options: {
  courseId: string;
  materialId?: string | null;
  deckTitle: string;
  pairs: Array<{ question: string; answer: string }>;
}): Promise<number> {
  const cards = options.pairs
    .filter((pair) => pair.question.trim() && pair.answer.trim())
    .map((pair) => ({ front: pair.question.trim(), back: pair.answer.trim() }));
  if (cards.length === 0) return 0;

  const response = await fetch("/api/flashcards/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      courseId: options.courseId,
      deckTitle: options.deckTitle,
      cards,
      materialId: options.materialId || undefined,
    }),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error ?? "Could not save flashcards.");
  }
  return Number(data.data?.imported ?? cards.length);
}

export async function importExtractQuiz(options: {
  courseId: string;
  materialId?: string | null;
  extract: ChapterStudyExtract;
  sourceText?: string;
}): Promise<string | null> {
  const response = await fetch("/api/quizzes", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      courseId: options.courseId,
      materialId: options.materialId || undefined,
      questionCount: 30,
      extract: options.extract,
      sourceText: options.sourceText || undefined,
    }),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error ?? "Could not generate quiz.");
  }
  return typeof data.data?.id === "string" ? data.data.id : null;
}

/** Save generated FAQ / timeline / notes into Locker as course material. */
export async function saveGeneratedToLocker(options: {
  courseId: string;
  title: string;
  text: string;
}): Promise<{ id: string; title: string } | null> {
  const text = options.text.trim();
  if (!options.courseId || !text) return null;

  const response = await fetch("/api/materials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      courseId: options.courseId,
      title: options.title,
      type: "DOCUMENT",
      source: "paste",
      text,
    }),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error ?? "Could not save to Locker.");
  }
  const material = data.material as { id: string; title: string } | undefined;
  return material ? { id: material.id, title: material.title } : null;
}

/**
 * Without AI: paste/annotate the original material on the target sheet.
 * Source file stays in Locker / Course Info — not duplicated as a Core "Source" page.
 */
export function seedRawMaterialDocument(
  material: {
    id: string;
    title: string;
    extractedText: string | null;
    filePath?: string | null;
  },
  base: NoteDocument = emptyDocument(material.filePath ? "annotate" : "type"),
): NoteDocument {
  const hasFile = Boolean(material.filePath);
  const body = (material.extractedText ?? "").trim().slice(0, 50_000);
  return {
    ...base,
    typed: body,
    tool: hasFile ? "annotate" : "type",
    pdfMaterialId: hasFile ? material.id : null,
    metadata: {
      ...base.metadata,
      materialSource: {
        materialId: material.id,
        title: material.title,
      },
    },
  };
}
