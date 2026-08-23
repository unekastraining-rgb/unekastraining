import type { CoreFormatId } from "@/lib/core/format-catalog";
import { defaultBlockRect, ensureBlockPositions } from "@/lib/core/block-layout";
import type {
  CompositeSection,
  DecorationKind,
  NoteDocument,
  NotebookPageRecord,
  NotebookPagesContainer,
  NoteTool,
  PageDecoration,
  PageImage,
  PageTextBox,
  SketchStroke,
} from "./note-types";
import {
  emptyCharting,
  emptyConcepts,
  emptyDocument,
  emptyFlow,
  emptyMindMap,
  emptyOutlineNodes,
  emptyProblemSolution,
  emptyProgressive,
  emptyQa,
  emptyTimeline,
  emptyTwoColumn,
} from "./note-types";
import { createEmptySectionData } from "./section-format-data";
import { getFormatDefinition } from "./format-catalog";

export type { CompositeSection, DecorationKind, PageDecoration };

export interface PageData {
  tool: NoteTool;
  typed: string;
  strokes: SketchStroke[];
  annotations?: SketchStroke[];
  cornell?: NoteDocument["cornell"];
  outlineNodes?: NoteDocument["outlineNodes"];
  mindMap?: NoteDocument["mindMap"];
  flow?: NoteDocument["flow"];
  charting?: NoteDocument["charting"];
  qa?: NoteDocument["qa"];
  progressive?: NoteDocument["progressive"];
  concepts?: NoteDocument["concepts"];
  timeline?: NoteDocument["timeline"];
  problemSolution?: NoteDocument["problemSolution"];
  twoColumn?: NoteDocument["twoColumn"];
  canvas?: NoteDocument["canvas"];
  pageTextBoxes: PageTextBox[];
  pageImages: PageImage[];
  decorations: PageDecoration[];
  compositeSections?: CompositeSection[];
  fontSize?: number;
  fontFamily?: string;
  activeFormat?: CoreFormatId;
}

function rid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyPageData(tool: NoteTool = "type"): PageData {
  return extractPageData(emptyDocument(tool));
}

export function extractPageData(doc: NoteDocument): PageData {
  return {
    tool: doc.tool,
    typed: doc.typed,
    strokes: doc.strokes ?? [],
    annotations: doc.annotations,
    cornell: doc.cornell,
    outlineNodes: doc.outlineNodes,
    mindMap: doc.mindMap,
    flow: doc.flow,
    charting: doc.charting,
    qa: doc.qa,
    progressive: doc.progressive,
    concepts: doc.concepts,
    timeline: doc.timeline,
    problemSolution: doc.problemSolution,
    twoColumn: doc.twoColumn,
    canvas: doc.canvas,
    pageTextBoxes: doc.pageTextBoxes ?? [],
    pageImages: doc.pageImages ?? [],
    decorations: doc.decorations ?? [],
    compositeSections: doc.metadata?.compositeSections
      ? ensureBlockPositions(doc.metadata.compositeSections)
      : undefined,
    fontSize: doc.metadata?.fontSize ?? 15,
    fontFamily: doc.metadata?.fontFamily ?? "inherit",
    activeFormat: doc.metadata?.activeFormat,
  };
}

export function applyPageData(doc: NoteDocument, data: PageData): NoteDocument {
  return {
    ...doc,
    tool: data.tool,
    typed: data.typed,
    strokes: data.strokes,
    annotations: data.annotations,
    cornell: data.cornell,
    outlineNodes: data.outlineNodes,
    mindMap: data.mindMap,
    flow: data.flow,
    charting: data.charting,
    qa: data.qa,
    progressive: data.progressive,
    concepts: data.concepts,
    timeline: data.timeline,
    problemSolution: data.problemSolution,
    twoColumn: data.twoColumn,
    canvas: data.canvas,
    pageTextBoxes: data.pageTextBoxes,
    pageImages: data.pageImages,
    decorations: data.decorations,
    metadata: {
      ...doc.metadata,
      activeFormat: data.activeFormat,
      compositeSections: data.compositeSections,
      fontSize: data.fontSize,
      fontFamily: data.fontFamily,
    },
  };
}

export function getNotebookPages(doc: NoteDocument): NotebookPagesContainer {
  if (doc.metadata?.notebookPages) {
    return {
      activePageId: doc.metadata.notebookPages.activePageId,
      pages: doc.metadata.notebookPages.pages.map((page) => ({
        ...page,
        data: page.data as unknown as PageData,
      })) as unknown as NotebookPageRecord[],
    };
  }
  const data = extractPageData(doc);
  const id = rid("pg");
  return {
    activePageId: id,
    pages: [{ id, pageNumber: 1, label: "Page 1", data: data as unknown as Record<string, unknown> }],
  };
}

export function pagesFromDoc(doc: NoteDocument): {
  container: NotebookPagesContainer;
  activeData: PageData;
} {
  const container = getNotebookPages(doc);
  const active =
    container.pages.find((p) => p.id === container.activePageId) ?? container.pages[0];
  return {
    container,
    activeData: (active?.data as unknown as PageData) ?? extractPageData(doc),
  };
}

export function ensureNotebookPages(doc: NoteDocument): NoteDocument {
  if (doc.metadata?.notebookPages) return doc;
  const container = getNotebookPages(doc);
  return {
    ...doc,
    metadata: { ...doc.metadata, notebookPages: container },
  };
}

export function syncCurrentPage(doc: NoteDocument): NoteDocument {
  const container = getNotebookPages(doc);
  const data = extractPageData(doc);
  return {
    ...doc,
    metadata: {
      ...doc.metadata,
      notebookPages: {
        activePageId: container.activePageId,
        pages: container.pages.map((page) =>
          page.id === container.activePageId
            ? { ...page, data: data as unknown as Record<string, unknown> }
            : page,
        ),
      },
    },
  };
}

export function switchNotebookPage(doc: NoteDocument, pageId: string): NoteDocument {
  const synced = syncCurrentPage(doc);
  const container = synced.metadata!.notebookPages!;
  const next = container.pages.find((p) => p.id === pageId);
  if (!next) return synced;
  return applyPageData(
    {
      ...synced,
      metadata: {
        ...synced.metadata,
        notebookPages: { ...container, activePageId: pageId },
      },
    },
    next.data as unknown as PageData,
  );
}

export function addNotebookPage(doc: NoteDocument): NoteDocument {
  const synced = syncCurrentPage(doc);
  const container = synced.metadata!.notebookPages!;
  const nextNumber = container.pages.length + 1;
  const id = rid("pg");
  const newPage = {
    id,
    pageNumber: nextNumber,
    label: `Page ${nextNumber}`,
    data: emptyPageData() as unknown as Record<string, unknown>,
  };
  return applyPageData(
    {
      ...synced,
      metadata: {
        ...synced.metadata,
        notebookPages: { activePageId: id, pages: [...container.pages, newPage] },
      },
    },
    emptyPageData(),
  );
}

export function duplicateNotebookPage(doc: NoteDocument, pageId: string): NoteDocument {
  const synced = syncCurrentPage(doc);
  const container = synced.metadata!.notebookPages!;
  const source = container.pages.find((p) => p.id === pageId);
  if (!source) return synced;
  const id = rid("pg");
  const copyData = JSON.parse(JSON.stringify(source.data)) as PageData;
  const copy = {
    id,
    pageNumber: container.pages.length + 1,
    label: `${(source as NotebookPageRecord).label ?? "Page"} (copy)`,
    data: copyData as unknown as Record<string, unknown>,
  };
  return applyPageData(
    {
      ...synced,
      metadata: {
        ...synced.metadata,
        notebookPages: { activePageId: id, pages: [...container.pages, copy] },
      },
    },
    copyData,
  );
}

export function renameNotebookPage(
  doc: NoteDocument,
  pageId: string,
  label: string,
): NoteDocument {
  const container = getNotebookPages(doc);
  return {
    ...doc,
    metadata: {
      ...doc.metadata,
      notebookPages: {
        ...container,
        pages: container.pages.map((p) =>
          p.id === pageId ? { ...p, label: label.trim() || p.label } : p,
        ),
      },
    },
  };
}

export function deleteNotebookPage(doc: NoteDocument, pageId: string): NoteDocument {
  const synced = syncCurrentPage(doc);
  const container = synced.metadata!.notebookPages!;
  if (container.pages.length <= 1) return synced;

  const remaining = container.pages.filter((page) => page.id !== pageId);
  const nextActiveId =
    container.activePageId === pageId
      ? (remaining[0]?.id ?? container.activePageId)
      : container.activePageId;
  const renumbered = remaining.map((page, index) => ({
    ...page,
    pageNumber: index + 1,
  }));
  const activePage =
    renumbered.find((page) => page.id === nextActiveId) ?? renumbered[0]!;

  return applyPageData(
    {
      ...synced,
      metadata: {
        ...synced.metadata,
        notebookPages: { activePageId: activePage.id, pages: renumbered },
      },
    },
    activePage.data as unknown as PageData,
  );
}

export function seedFormatOnPage(data: PageData, formatId: CoreFormatId): PageData {
  const next = { ...data, activeFormat: formatId };
  switch (formatId) {
    case "PROGRESSIVE":
      next.progressive = emptyProgressive();
      break;
    case "PROBLEM_SOLUTION":
      next.problemSolution = emptyProblemSolution();
      break;
    case "CONCEPT_DEFINITION":
      next.concepts = emptyConcepts();
      break;
    case "TIMELINE":
      next.timeline = emptyTimeline();
      break;
    case "TWO_COLUMN":
    case "BOXING":
      next.twoColumn = emptyTwoColumn();
      break;
    case "HIERARCHY":
    case "OUTLINE":
      next.outlineNodes = emptyOutlineNodes().nodes;
      break;
    case "MIND_MAP":
      next.mindMap = emptyMindMap();
      break;
    case "FLOW":
    case "PROCESS_FLOW":
      next.flow = emptyFlow();
      break;
    case "CORNELL":
    case "CORNELL_MIND":
      next.cornell = { notes: "", cues: "", summary: "" };
      if (formatId === "CORNELL_MIND") next.mindMap = emptyMindMap();
      break;
    case "QA":
      next.qa = emptyQa();
      break;
    case "CHARTING":
    case "COMPARISON_MATRIX":
      next.charting = emptyCharting();
      break;
    default:
      break;
  }
  return next;
}

export function buildCompositePageData(
  formatIds: CoreFormatId[],
  sectionTitles: string[],
): PageData {
  const data = emptyPageData();
  data.compositeSections = formatIds.map((formatId, index) => ({
    id: rid("sec"),
    formatId,
    title: sectionTitles[index] ?? getFormatDefinition(formatId).label,
    data: createEmptySectionData(formatId),
    ...defaultBlockRect(index),
  }));
  data.activeFormat = formatIds[0];
  return data;
}

export function appendCompositeSections(
  data: PageData,
  formatIds: CoreFormatId[],
  options?: { skipExisting?: boolean },
): PageData {
  const existing = ensureBlockPositions(data.compositeSections ?? []);
  const toAdd = formatIds.filter(
    (formatId) =>
      !options?.skipExisting || !existing.some((section) => section.formatId === formatId),
  );
  if (toAdd.length === 0) return data;

  const startIndex = existing.length;
  const newSections: CompositeSection[] = toAdd.map((formatId, index) => ({
    id: rid("sec"),
    formatId,
    title: getFormatDefinition(formatId).label,
    data: createEmptySectionData(formatId),
    ...defaultBlockRect(startIndex + index),
  }));

  return {
    ...data,
    compositeSections: [...existing, ...newSections],
    activeFormat: "BLANK",
  };
}

export function createDecoration(
  kind: DecorationKind,
  x = 80,
  y = 120,
  color = "#fef3c7",
  options?: { w?: number; h?: number; text?: string; number?: number },
): PageDecoration {
  const base = { id: rid("dec"), kind, x, y, color };
  switch (kind) {
    case "sticky":
      return {
        ...base,
        w: options?.w ?? 160,
        h: options?.h ?? 120,
        text: options?.text ?? "Note…",
        color: color || "#fef9c3",
      };
    case "text_stamp":
    case "banner":
      return {
        ...base,
        w: options?.w ?? 140,
        h: options?.h ?? 36,
        text: options?.text ?? "Label",
        color: color || "#fef3c7",
      };
    case "color_block":
      return { ...base, w: options?.w ?? 120, h: options?.h ?? 80, color: "#fed7aa" };
    case "number_bubble":
      return {
        ...base,
        w: options?.w ?? 36,
        h: options?.h ?? 36,
        number: options?.number ?? 1,
        color: color || "#ea580c",
      };
    case "circle":
    case "ellipse":
      return { ...base, w: options?.w ?? 64, h: options?.h ?? 64, color: color || "#bfdbfe" };
    case "triangle":
      return { ...base, w: options?.w ?? 80, h: options?.h ?? 70, color: color || "#86efac" };
    case "hexagon":
    case "star_shape":
    case "diamond_shape":
      return { ...base, w: options?.w ?? 80, h: options?.h ?? 80, color: color || "#c4b5fd" };
    case "arrow":
      return { ...base, w: options?.w ?? 100, h: options?.h ?? 24, color: color || "#44403c" };
    case "line":
      return { ...base, w: options?.w ?? 120, h: options?.h ?? 8, color: color || "#44403c" };
    case "dot":
      return { ...base, w: options?.w ?? 16, h: options?.h ?? 16, color: color || "#0d9488" };
    default:
      return {
        ...base,
        w: options?.w ?? 100,
        h: options?.h ?? 60,
        color,
      };
  }
}

export function createPageImage(assetId: string, x = 80, y = 160): PageImage {
  return {
    id: rid("img"),
    assetId,
    x,
    y,
    width: 160,
    height: 160,
  };
}
