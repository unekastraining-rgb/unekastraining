import type { CourseMaterial, Note } from "@/generated/prisma";
import { db } from "@/lib/db";
import { emptyDocument } from "@/lib/core/note-types";
import { parseCurriculumFromMaterial } from "@/lib/grade-school/learning-plan";
import { parseStudyTopicFromMaterial } from "@/lib/study-topic/parse";

export interface MaterialWithCourse extends CourseMaterial {
  course: { id: string; title: string };
}

export interface MaterialWorkbookResult {
  note: Note;
  material: MaterialWithCourse;
  created: boolean;
}

function bodyTextForWorkbook(
  extractedText: string | null | undefined,
  title: string,
): string {
  if (!extractedText?.trim()) {
    return "";
  }

  const studyTopic = parseStudyTopicFromMaterial(extractedText);
  if (studyTopic?.summary) {
    return studyTopic.summary;
  }

  const curriculum = parseCurriculumFromMaterial(extractedText);
  if (curriculum?.summary) {
    return curriculum.summary;
  }

  const trimmed = extractedText.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return `Source material: ${title}\n\nUse the Materials panel in Core to reference the full source while you work in this workbook.`;
  }

  return trimmed.slice(0, 50_000);
}

export function previewTextForMaterial(
  extractedText: string | null | undefined,
  title: string,
): string {
  const body = bodyTextForWorkbook(extractedText, title);
  if (body) return body;
  return "";
}

export async function loadMaterialForUser(
  userId: string,
  materialId: string,
): Promise<MaterialWithCourse | null> {
  return db.courseMaterial.findFirst({
    where: { id: materialId, course: { userId } },
    include: { course: { select: { id: true, title: true } } },
  });
}

export async function getOrCreateMaterialWorkbook(
  userId: string,
  materialId: string,
): Promise<MaterialWorkbookResult | null> {
  const material = await loadMaterialForUser(userId, materialId);
  if (!material) return null;

  const existing = await db.note.findFirst({
    where: { userId, materialId: material.id },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    return { note: existing, material, created: false };
  }

  const hasFile = Boolean(material.filePath);
  const body = bodyTextForWorkbook(material.extractedText, material.title);
  const tool = hasFile ? "annotate" : "type";

  const doc = {
    ...emptyDocument(tool),
    typed: body,
    pdfMaterialId: hasFile ? material.id : null,
    tool,
    metadata: {
      materialSource: {
        materialId: material.id,
        title: material.title,
        type: material.type,
      },
    },
  };

  const note = await db.note.create({
    data: {
      userId,
      courseId: material.courseId,
      materialId: material.id,
      title: `${material.title} — workbook`,
      content: body.slice(0, 5000),
      method: hasFile ? "BLANK" : body.length > 2000 ? "OUTLINE" : "BLANK",
      contentJson: JSON.stringify(doc),
    },
  });

  return { note, material, created: true };
}
