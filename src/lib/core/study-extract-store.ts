import {
  formatChapterStudyAsNote,
  normalizeChapterStudyExtract,
  type ChapterStudyExtract,
} from "@/lib/core/chapter-study-extract";
import { parseNoteDocument } from "@/lib/core/note-types";
import { db } from "@/lib/db";

/** Compact study-knowledge block for Ask / quiz / flashcard prompts. */
export function formatStudyExtractContext(
  extract: ChapterStudyExtract,
  options?: { maxChars?: number },
): string {
  const maxChars = options?.maxChars ?? 14000;
  const full = formatChapterStudyAsNote(extract);
  if (full.length <= maxChars) return full;
  return `${full.slice(0, maxChars)}\n\n[Study extract truncated]`;
}

export function readStudyExtractFromUnknown(
  raw: unknown,
): ChapterStudyExtract | null {
  if (!raw || typeof raw !== "object") return null;
  const normalized = normalizeChapterStudyExtract(raw as Record<string, unknown>);
  const hasContent =
    Boolean(normalized.chapterOverview.trim()) ||
    normalized.learningObjectives.length > 0 ||
    normalized.definitions.length > 0 ||
    normalized.frameworks.length > 0 ||
    normalized.comparisons.length > 0 ||
    normalized.mustKnow.length > 0 ||
    normalized.testYourself.length > 0 ||
    normalized.processesOrSteps.length > 0 ||
    (normalized.workedExamples?.length ?? 0) > 0;
  return hasContent ? normalized : null;
}

/**
 * Load the most recent With-AI chapter study extract from a Core note
 * linked to this material (or any note in the course if materialId omitted).
 */
export async function loadPersistedStudyExtract(options: {
  userId: string;
  materialId?: string | null;
  courseId?: string | null;
}): Promise<ChapterStudyExtract | null> {
  const notes = await db.note.findMany({
    where: {
      userId: options.userId,
      ...(options.materialId
        ? { materialId: options.materialId }
        : options.courseId
          ? { courseId: options.courseId }
          : {}),
      contentJson: { not: null },
    },
    orderBy: { updatedAt: "desc" },
    take: 12,
    select: { contentJson: true, materialId: true },
  });

  for (const note of notes) {
    if (!note.contentJson) continue;
    try {
      const doc = parseNoteDocument(note.contentJson);
      const extract = readStudyExtractFromUnknown(doc.metadata?.chapterStudyExtract);
      if (extract) return extract;
    } catch {
      // skip corrupt notes
    }
  }

  return null;
}
