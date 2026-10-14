import type { CoreFormatId } from "@/lib/core/format-catalog";
import {
  filledSectionDataFromExtract,
  leftoverStudySlices,
  learningPlanFromExtract,
  normalizeChapterStudyExtract,
  type ChapterStudyExtract,
} from "@/lib/core/chapter-study-extract";
import type { CoreStudioType } from "@/lib/core/studio-types";
import type { CompositeSection, FormatRecommendation, NoteDocument } from "@/lib/core/note-types";
import { CANVAS_ELEMENT_BASE_Z, nextCanvasElementZIndex } from "@/lib/core/canvas-layer";
import { getFormatDefinition } from "@/lib/core/format-catalog";
import { originYForTypedNotes, packStudyBlocks, bottomOfSections } from "@/lib/core/block-layout";
import { extraStudyFormats } from "@/lib/core/adaptive-study-choice";
import {
  applyFormatAsStudyPage,
  applyStudyTemplate,
  formatsForStudyTemplate,
  getStudyTemplate,
  hasLockedStudyTemplateLayout,
  selectStudyTemplate,
} from "@/lib/core/study-templates";
import { mergeDeskFromExtract } from "@/lib/core/notebook-desk";
import {
  addNotebookPage,
  appendCompositeSections,
  applyPageData,
  extractPageData,
  getNotebookPages,
  seedFormatOnPage,
  syncCurrentPage,
  switchNotebookPage,
  type PageData,
} from "@/lib/core/notebook-pages";

const SOURCE_TEXT_MIN = 80;

export function pageHasPreservableSource(doc: NoteDocument): boolean {
  const typed = (doc.typed ?? "").trim();
  if (typed.length >= SOURCE_TEXT_MIN) return true;
  const html = (doc.typedHtml ?? "").replace(/<[^>]+>/g, "").trim();
  if (html.length >= SOURCE_TEXT_MIN) return true;
  if (doc.pdfMaterialId) return true;
  if ((doc.pageImages?.length ?? 0) > 0) return true;
  if ((doc.strokes?.length ?? 0) > 0) return true;
  if ((doc.pageTextBoxes ?? []).some((box) => (box.text ?? "").trim().length > 20)) return true;
  return false;
}

export function pageHasStudyBlocks(doc: NoteDocument): boolean {
  return (doc.metadata?.compositeSections?.length ?? 0) > 0;
}

/**
 * Apply AI chapter extract as a template-first study workspace:
 * Adaptive picks a content layout, then named areas are filled.
 * Extra techniques use additional notebook pages. Q&A stays off-canvas.
 */
export function applyAiExtractToDocument(
  doc: NoteDocument,
  extract: ChapterStudyExtract,
  options?: {
    pageId?: string;
    chosenFormats?: CoreFormatId[];
    adaptiveRecommendations?: FormatRecommendation[];
  },
): NoteDocument {
  let next = syncCurrentPage(doc);
  if (options?.pageId) {
    next = switchNotebookPage(next, options.pageId);
  }

  const selection = selectStudyTemplate(
    extract,
    options?.adaptiveRecommendations ?? options?.chosenFormats,
  );
  const primary = getStudyTemplate(selection.primary);
  const page2 = selection.page2 ? getStudyTemplate(selection.page2) : null;
  const formats = [
    ...new Set([
      ...formatsForStudyTemplate(primary, extract),
      ...(page2 ? formatsForStudyTemplate(page2, extract) : []),
    ]),
  ];

  next = applyStudyTemplate(next, primary, extract);
  next = syncCurrentPage(next);
  const homePages = getNotebookPages(next);
  const homePageId = homePages.activePageId;
  next = {
    ...next,
    metadata: {
      ...next.metadata,
      notebookPages: {
        ...homePages,
        pages: homePages.pages.map((page) =>
          page.id === homePageId
            ? { ...page, label: primary.label || page.label }
            : page,
        ),
      },
    },
  };

  if (page2) {
    next = addNotebookPage(next, { label: page2.label });
    next = applyStudyTemplate(next, page2, extract, { applyPaper: false });
  }

  const extras = extraStudyFormats(extract, formats, options?.adaptiveRecommendations ?? options?.chosenFormats);
  for (const formatId of extras) {
    next = addNotebookPage(next, { label: getFormatDefinition(formatId).label });
    next = applyFormatAsStudyPage(next, formatId, extract, { applyPaper: false });
  }

  for (const leftover of leftoverStudySlices(extract)) {
    next = addNotebookPage(next, { label: leftover.label });
    next = applyFormatAsStudyPage(next, leftover.formatId, leftover.extract, { applyPaper: false });
  }

  next = switchNotebookPage(next, homePageId);
  const applied = [...new Set([...formats, ...extras])];
  return {
    ...next,
    metadata: {
      ...next.metadata,
      chapterStudyExtract: extract,
      notebookDesk: mergeDeskFromExtract(next.metadata?.notebookDesk, extract),
      studyTemplateId: primary.id,
      appliedFormats: [
        ...new Set([...(next.metadata?.appliedFormats ?? []), ...applied]),
      ],
      recommendedFormats: applied
        .filter((formatId) => formatId !== "QA")
        .map((formatId) => ({
          formatId,
          confidence: 1,
          reason: formats.includes(formatId)
            ? "On this study template"
            : "Extra study page from Adaptive / extract",
          aiSuggested: true,
        })),
    },
  };
}

/**
 * Apply extract onto the current (or requested) study page.
 * Original material stays in Locker / Course Info — not a second Core source sheet.
 */
export function applyExtractPreservingSource(
  doc: NoteDocument,
  extract: ChapterStudyExtract,
  options?: { pageId?: string; forceNewPage?: boolean },
): NoteDocument {
  let next = syncCurrentPage(doc);
  if (options?.pageId) {
    next = switchNotebookPage(next, options.pageId);
  }
  void options?.forceNewPage;
  return applyAiExtractToDocument(next, extract);
}

export function fillNewSectionsFromExtract(
  sections: CompositeSection[] | undefined,
  existingIds: Set<string>,
  extract: ChapterStudyExtract | null,
): CompositeSection[] | undefined {
  if (!sections) return sections;
  if (!extract) return sections;
  return sections.map((section) => {
    if (existingIds.has(section.id)) return section;
    return {
      ...section,
      title: section.title || getFormatDefinition(section.formatId).label,
      data: filledSectionDataFromExtract(section.formatId, extract),
    };
  });
}

export function applyFilledFormatsToDocument(
  doc: NoteDocument,
  formatIds: CoreFormatId[],
  extract: ChapterStudyExtract | null,
  options?: { skipExisting?: boolean },
): { doc: NoteDocument; addedIds: string[] } {
  if (formatIds.length === 0) return { doc, addedIds: [] };

  if (hasLockedStudyTemplateLayout(doc)) {
    const already = new Set(doc.metadata?.appliedFormats ?? []);
    const toAdd = formatIds.filter((formatId) => {
      if (formatId === "QA") return false;
      if (options?.skipExisting && already.has(formatId)) return false;
      return true;
    });
    if (toAdd.length === 0) return { doc, addedIds: [] };

    let next = syncCurrentPage(doc);
    const homePageId = getNotebookPages(next).activePageId;
    for (const formatId of toAdd) {
      next = addNotebookPage(next, { label: getFormatDefinition(formatId).label });
      if (extract) {
        next = applyFormatAsStudyPage(next, formatId, extract);
      } else {
        const page = seedFormatOnPage(extractPageData(next), formatId);
        next = applyPageData(next, { ...page, compositeSections: undefined });
      }
    }
    next = switchNotebookPage(next, homePageId);
    return {
      doc: {
        ...next,
        metadata: {
          ...next.metadata,
          studyTemplateId: extractPageData(next).studyTemplateId,
          appliedFormats: [...new Set([...(next.metadata?.appliedFormats ?? []), ...toAdd])],
          chapterStudyExtract: extract ?? next.metadata?.chapterStudyExtract,
        },
      },
      addedIds: [],
    };
  }

  const synced = syncCurrentPage(doc);
  const pageData = extractPageData(synced);
  const existingIds = new Set(pageData.compositeSections?.map((section) => section.id) ?? []);
  const withFormats = appendCompositeSections(pageData, formatIds, {
    skipExisting: options?.skipExisting,
  });
  let z = nextCanvasElementZIndex(synced);
  const addedIds: string[] = [];
  const filled = fillNewSectionsFromExtract(
    withFormats.compositeSections,
    existingIds,
    extract,
  );
  const existingKept = (filled ?? []).filter((section) => existingIds.has(section.id));
  const added = (filled ?? []).filter((section) => !existingIds.has(section.id));
  const originY = Math.max(
    originYForTypedNotes(pageData.typed),
    existingKept.length ? bottomOfSections(existingKept) + 40 : 0,
  );
  const packedAdded = packStudyBlocks(added, { originY });
  const compositeSections = [...existingKept, ...packedAdded].map((section) => {
    if (existingIds.has(section.id)) {
      return { ...section, zIndex: section.zIndex ?? CANVAS_ELEMENT_BASE_Z };
    }
    addedIds.push(section.id);
    return { ...section, zIndex: z++ };
  });

  const next = applyPageData(synced, { ...withFormats, compositeSections });
  return {
    doc: {
      ...next,
      metadata: {
        ...next.metadata,
        activeFormat: "BLANK",
        appliedFormats: [
          ...new Set([...(next.metadata?.appliedFormats ?? []), ...formatIds]),
        ],
        chapterStudyExtract: extract ?? next.metadata?.chapterStudyExtract,
      },
    },
    addedIds,
  };
}

function appendFilledSection(
  doc: NoteDocument,
  formatId: CoreFormatId,
  data: Record<string, unknown>,
  title?: string,
): NoteDocument {
  const synced = syncCurrentPage(doc);
  const pageData = extractPageData(synced);
  const existing = pageData.compositeSections ?? [];
  const originY = existing.length
    ? bottomOfSections(existing) + 40
    : originYForTypedNotes(pageData.typed);
  const packed = packStudyBlocks(
    [
      {
        id: `sec_${Math.random().toString(36).slice(2, 9)}`,
        formatId,
        title: title || getFormatDefinition(formatId).label,
        data,
        zIndex: nextCanvasElementZIndex(synced),
      },
    ],
    { originY },
  );
  return applyPageData(synced, {
    ...pageData,
    compositeSections: [...existing, ...packed],
  });
}

/**
 * Place study-guide / chapter-study / timeline into editable Core canvas objects.
 * FAQ and flashcards belong in Locker / Lucky.
 */
export function applyStudioStructuredToDocument(
  doc: NoteDocument,
  type: CoreStudioType,
  structured: Record<string, unknown> | undefined,
  options?: { pageId?: string; preserveSource?: boolean },
): NoteDocument {
  let next = syncCurrentPage(doc);
  if (options?.pageId) {
    next = switchNotebookPage(next, options.pageId);
  }

  if (type === "chapter-study" || type === "study-guide") {
    const extract = normalizeChapterStudyExtract(structured ?? {});
    return applyAiExtractToDocument(next, extract, options?.pageId ? { pageId: options.pageId } : undefined);
  }

  if (type === "timeline") {
    const events = Array.isArray(structured?.events)
      ? (structured.events as Array<{
          date?: string;
          label?: string;
          title?: string;
          detail?: string;
          description?: string;
        }>).map((event) => ({
          date: String(event.date ?? ""),
          title: String(event.label ?? event.title ?? ""),
          description: String(event.detail ?? event.description ?? ""),
        }))
      : [];
    return appendFilledSection(
      next,
      "TIMELINE",
      { timeline: { events: events.length > 0 ? events : [{ date: "", title: "", description: "" }] } },
      String(structured?.title ?? "Timeline"),
    );
  }

  return next;
}

export function applyPracticeQuestionsToDocument(
  doc: NoteDocument,
  extract: ChapterStudyExtract,
): NoteDocument {
  const data = filledSectionDataFromExtract("QA", extract);
  let next = syncCurrentPage(doc);
  if (pageHasPreservableSource(next) || pageHasStudyBlocks(next)) {
    next = addNotebookPage(next, { label: "Practice questions" });
  }
  return appendFilledSection(next, "QA", data, "Practice questions");
}

export function applyLearningPlanToDocument(
  doc: NoteDocument,
  extract: ChapterStudyExtract,
): NoteDocument {
  let next = syncCurrentPage(doc);
  if (pageHasPreservableSource(next) || pageHasStudyBlocks(next)) {
    next = addNotebookPage(next, { label: "Learning plan" });
  }
  return appendFilledSection(
    next,
    "PROGRESSIVE",
    learningPlanFromExtract(extract),
    "Learning plan",
  );
}

export function applyExplanationsToDocument(
  doc: NoteDocument,
  extract: ChapterStudyExtract,
): NoteDocument {
  let next = syncCurrentPage(doc);
  if (pageHasPreservableSource(next) || pageHasStudyBlocks(next)) {
    next = addNotebookPage(next, { label: "Explanations" });
  }
  next = appendFilledSection(
    next,
    "PROBLEM_SOLUTION",
    filledSectionDataFromExtract("PROBLEM_SOLUTION", extract),
    "Explanations",
  );
  if (extract.definitions.length > 0) {
    next = appendFilledSection(
      next,
      "CONCEPT_DEFINITION",
      filledSectionDataFromExtract("CONCEPT_DEFINITION", extract),
      "Key terms",
    );
  }
  return next;
}

export const ALL_SHEETS_TARGET = "__all_sheets__";

function readPageDataSourceText(data: PageData | undefined): string {
  if (!data) return "";
  const parts: string[] = [];
  if (data.typed?.trim()) parts.push(data.typed.trim());
  for (const box of data.pageTextBoxes ?? []) {
    if (box.text?.trim()) parts.push(box.text.trim());
  }
  if (data.cornell) {
    for (const value of [data.cornell.notes, data.cornell.cues, data.cornell.summary]) {
      if (value?.trim()) parts.push(value.trim());
    }
  }
  if (data.qa?.pairs) {
    for (const pair of data.qa.pairs) {
      const line = [pair.question, pair.answer].filter((item) => item?.trim()).join(" — ");
      if (line) parts.push(line);
    }
  }
  for (const decoration of data.decorations ?? []) {
    if (decoration.text?.trim()) parts.push(decoration.text.trim());
  }
  return parts.join("\n\n").trim();
}

export function readNotebookPageSourceText(doc: NoteDocument, pageId: string): string {
  const pages = getNotebookPages(doc);
  const page = pages.pages.find((item) => item.id === pageId);
  if (!page) return "";
  return readPageDataSourceText(page.data as unknown as PageData);
}

export function readAllNotebookSheetsText(doc: NoteDocument): string {
  const fromMeta = (doc.metadata?.notebookSourceText ?? "").trim();
  const pages = getNotebookPages(doc);
  const fromPages = pages.pages
    .map((page) => {
      const text = readPageDataSourceText(page.data as unknown as PageData);
      if (!text) return "";
      const label = page.label?.trim() || `Page ${page.pageNumber}`;
      return `## ${label}\n${text}`;
    })
    .filter(Boolean)
    .join("\n\n");
  return [fromMeta, fromPages].filter(Boolean).join("\n\n").trim();
}

export function readNotebookSourceText(doc: NoteDocument): string {
  const fromMeta = (doc.metadata?.notebookSourceText ?? "").trim();
  if (fromMeta) return fromMeta;
  const allSheets = readAllNotebookSheetsText(doc);
  if (allSheets) return allSheets;
  const pages = getNotebookPages(doc);
  const sourcePage = pages.pages.find((page) => /source/i.test(page.label ?? ""));
  if (sourcePage) {
    const typed = readPageDataSourceText(sourcePage.data as unknown as PageData);
    if (typed) return typed;
  }
  return (doc.typed ?? "").trim();
}
