import type { NoteMethod } from "@/generated/prisma";
import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import type { PageTemplateId, PenPresetId } from "@/lib/core/page-templates";
import type { MaterialPreviewPayload } from "@/lib/materials/client";

export interface SuggestedNotebookSetup {
  title: string;
  mode: "notes" | "whiteboard";
  pageTemplateId: PageTemplateId;
  method: NoteMethod;
  penPresetId: PenPresetId;
  whiteboardStarterId: string;
  summary: string;
}

export function suggestNotebookSetupFromMaterial(
  material: MaterialPreviewPayload,
): SuggestedNotebookSetup {
  const title = `${material.title} — workbook`;
  const type = material.type.toLowerCase();
  let pageTemplateId: PageTemplateId = "blank";
  let summary = "Notes notebook · blank paper";

  if (type.includes("syllabus") || type.includes("schedule")) {
    pageTemplateId = "planner_week";
    summary = "Notes notebook · weekly planner paper";
  } else if (type.includes("lecture") || type.includes("slide")) {
    pageTemplateId = "cornell";
    summary = "Notes notebook · Cornell paper";
  } else if (material.hasFile) {
    pageTemplateId = "blank";
    summary = "Notes notebook · blank paper (good for annotate)";
  } else if ((material.previewText?.length ?? 0) > 4000) {
    pageTemplateId = "ruled";
    summary = "Notes notebook · ruled paper";
  }

  return {
    title,
    mode: "notes",
    pageTemplateId,
    method: (pageTemplateId === "cornell"
      ? "CORNELL"
      : pageTemplateId === "ruled" || pageTemplateId === "planner_week"
        ? "RULED"
        : "BLANK") as NoteMethod,
    penPresetId: "ballpoint",
    whiteboardStarterId: "plain",
    summary,
  };
}

export function suggestNotebookSetupFromExtract(
  extract: ChapterStudyExtract,
  material?: MaterialPreviewPayload | null,
): SuggestedNotebookSetup {
  const formats = new Set(extract.recommendedFormats);
  let pageTemplateId: PageTemplateId = "blank";
  const mode: "notes" | "whiteboard" = "notes";
  const whiteboardStarterId = "plain";
  let method: NoteMethod = "BLANK";
  const penPresetId: PenPresetId = "ballpoint";

  if (formats.has("CORNELL")) {
    pageTemplateId = "cornell";
    method = "CORNELL";
  } else if (
    formats.has("MIND_MAP") ||
    formats.has("FLOW") ||
    formats.has("PROCESS_FLOW")
  ) {
    // Keep notes mode with blank paper; process/mind content lands in format blocks.
    pageTemplateId = "blank";
    method = "BLANK";
  } else if (extract.mustKnow.length >= 8) {
    pageTemplateId = "ruled";
    method = "RULED";
  } else if (material) {
    return {
      ...suggestNotebookSetupFromMaterial({
        ...material,
        title: extract.title || material.title,
      }),
      title: extract.title || `${material.title} — workbook`,
    };
  }

  const paperLabel =
    PAGE_TEMPLATE_LABELS[pageTemplateId] ?? pageTemplateId.replaceAll("_", " ");
  const summary = `Notes · ${paperLabel} paper`;

  return {
    title: extract.title || material?.title || "Study workbook",
    mode,
    pageTemplateId,
    method,
    penPresetId,
    whiteboardStarterId,
    summary,
  };
}

const PAGE_TEMPLATE_LABELS: Partial<Record<PageTemplateId, string>> = {
  blank: "blank",
  ruled: "ruled",
  college_ruled: "college ruled",
  cornell: "Cornell",
  cornell_ruled: "Cornell ruled",
  cornell_grid: "Cornell grid",
  two_column: "two-column",
  three_column: "three-column",
  planner_week: "weekly planner",
  meeting_notes: "meeting notes",
  study_board: "study board",
  legal_pad: "legal pad",
  kanban: "kanban",
  staff: "staff",
  mckinsey: "McKinsey",
};

export function friendlyAiImportError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("503") ||
    lower.includes("high demand") ||
    lower.includes("overloaded") ||
    lower.includes("unavailable") ||
    lower.includes("capacity")
  ) {
    return "The AI model is busy right now (high demand). Tap Try again in a moment.";
  }
  if (lower.includes("429") || lower.includes("rate limit") || lower.includes("quota")) {
    return "AI rate limit hit. Wait a few seconds, then tap Try again.";
  }
  if (lower.includes("not configured") || lower.includes("api key")) {
    return message;
  }
  return message || "AI import failed.";
}
