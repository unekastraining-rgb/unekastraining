import { MaterialType } from "@/generated/prisma";

const TYPE_LABELS: Record<MaterialType, string> = {
  SYLLABUS: "Syllabus",
  LECTURE_SLIDES: "Lecture slides",
  TEXTBOOK: "Textbook / chapter",
  VIDEO: "Video",
  ARTICLE: "Article",
  DOCUMENT: "Document",
  OTHER: "Other",
};

export const MATERIAL_TYPE_OPTIONS: Array<{ value: MaterialType; label: string }> =
  (Object.keys(TYPE_LABELS) as MaterialType[]).map((value) => ({
    value,
    label: TYPE_LABELS[value],
  }));

export function materialTypeLabel(type: string): string {
  return TYPE_LABELS[type as MaterialType] ?? type;
}

/** Guess a MaterialType from filename / mime / user hint. */
export function inferMaterialType(input: {
  fileName?: string;
  mimeType?: string;
  title?: string;
  source?: string;
}): MaterialType {
  const hay = `${input.fileName ?? ""} ${input.title ?? ""} ${input.mimeType ?? ""}`.toLowerCase();

  if (input.source === "bookstore" || /\b(textbook|chapter|isbn)\b/.test(hay)) {
    return MaterialType.TEXTBOOK;
  }
  if (/\b(syllabus|course\s*outline)\b/.test(hay)) return MaterialType.SYLLABUS;
  if (/\.(pptx?|key)$/i.test(input.fileName ?? "") || /presentation|slides/.test(hay)) {
    return MaterialType.LECTURE_SLIDES;
  }
  if (/\b(video|youtube|vimeo|mp4|webm)\b/.test(hay)) return MaterialType.VIDEO;
  if (/\b(article|journal|paper)\b/.test(hay)) return MaterialType.ARTICLE;
  if (/\.(pdf|docx?|txt|md|rtf)$/i.test(input.fileName ?? "")) return MaterialType.DOCUMENT;
  return MaterialType.DOCUMENT;
}
