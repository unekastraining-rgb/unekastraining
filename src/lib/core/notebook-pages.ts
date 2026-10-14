import type { CoreFormatId } from "@/lib/core/format-catalog";
import { ensureBlockPositions, packStudyBlocks, bottomOfSections, originYForTypedNotes } from "@/lib/core/block-layout";
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
import {
  findPageAtCell,
  nextCellInDirection,
  withPageGridLayout,
  type PageGrowDirection,
} from "./notebook-page-layout";

export type { CompositeSection, DecorationKind, PageDecoration };

export interface PageData {
  tool: NoteTool;
  typed: string;
  typedHtml?: string;
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
  pageTemplateId?: import("@/lib/core/page-templates").PageTemplateId;
  /** Smart Study Guide workspace for this page only. Blank manual pages omit this. */
  studyTemplateId?: string;
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
    typedHtml: doc.typedHtml,
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
    pageTemplateId: doc.notebook?.pageTemplateId,
    studyTemplateId: doc.metadata?.studyTemplateId,
  };
}

export function applyPageData(doc: NoteDocument, data: PageData): NoteDocument {
  return {
    ...doc,
    tool: data.tool,
    typed: data.typed,
    typedHtml: data.typedHtml,
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
    notebook: {
      ...doc.notebook,
      pageTemplateId: data.pageTemplateId ?? doc.notebook?.pageTemplateId,
    },
    metadata: {
      ...doc.metadata,
      activeFormat: data.activeFormat,
      compositeSections: data.compositeSections,
      fontSize: data.fontSize,
      fontFamily: data.fontFamily,
      studyTemplateId: data.studyTemplateId,
    },
  };
}

export function getNotebookPages(doc: NoteDocument): NotebookPagesContainer {
  if (doc.metadata?.notebookPages) {
    const raw = doc.metadata.notebookPages.pages.map((page) => ({
      ...page,
      data: page.data as unknown as PageData,
    })) as unknown as NotebookPageRecord[];
    const laidOut = withPageGridLayout(raw);
    return {
      activePageId: doc.metadata.notebookPages.activePageId,
      pages: laidOut.map((page) => ({
        id: page.id,
        pageNumber: page.pageNumber,
        label: page.label,
        data: page.data,
        gridRow: page.gridRow,
        gridCol: page.gridCol,
      })),
    };
  }
  const data = extractPageData(doc);
  const id = rid("pg");
  return {
    activePageId: id,
    pages: [
      {
        id,
        pageNumber: 1,
        label: "Page 1",
        gridRow: 0,
        gridCol: 0,
        data: data as unknown as Record<string, unknown>,
      },
    ],
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

/**
 * Hydrate-only merge: prefer non-empty live fields, else fall back to stored
 * page data so open does not show a blank canvas when ink lives in
 * metadata.notebookPages.pages[].data.
 *
 * Do NOT use this on the save path — intentional clears (empty live arrays)
 * must win. Use {@link prepareNoteDocumentForSave} instead.
 */
export function mergePageDataPreserveContent(
  live: PageData,
  stored: PageData | undefined,
): PageData {
  const prefer = <T,>(next: T[] | undefined, prev: T[] | undefined): T[] => {
    if (Array.isArray(next) && next.length > 0) return next;
    if (Array.isArray(prev) && prev.length > 0) return prev;
    return next ?? prev ?? [];
  };
  const preferText = (next: string | undefined, prev: string | undefined) => {
    if (typeof next === "string" && next.trim()) return next;
    if (typeof prev === "string" && prev.trim()) return prev;
    return next ?? prev ?? "";
  };
  return {
    ...(stored ?? live),
    ...live,
    strokes: prefer(live.strokes, stored?.strokes),
    annotations: prefer(live.annotations, stored?.annotations),
    decorations: prefer(live.decorations, stored?.decorations),
    pageImages: prefer(live.pageImages, stored?.pageImages),
    pageTextBoxes: prefer(live.pageTextBoxes, stored?.pageTextBoxes),
    typed: preferText(live.typed, stored?.typed),
    typedHtml: preferText(live.typedHtml, stored?.typedHtml),
  };
}

/**
 * Save path: live top-level page fields are authoritative (including empty
 * clears). Sync into metadata.notebookPages without re-hydrating old strokes.
 * Callers must hydrate on open/select via {@link ensureNotebookPages} first.
 */
export function prepareNoteDocumentForSave(doc: NoteDocument): NoteDocument {
  return syncCurrentPage(doc);
}

export function ensureNotebookPages(doc: NoteDocument): NoteDocument {
  // Always hydrate top-level fields from the active page. Saved notes keep
  // strokes/typed/etc. in metadata.notebookPages.pages[].data; without this,
  // open shows an empty canvas even when ink exists on the active page.
  if (doc.metadata?.notebookPages) {
    const { activeData } = pagesFromDoc(doc);
    const merged = mergePageDataPreserveContent(extractPageData(doc), activeData);
    return applyPageData(doc, merged);
  }
  const container = getNotebookPages(doc);
  const first = container.pages[0];
  const data = (first?.data as unknown as PageData) ?? extractPageData(doc);
  return applyPageData(
    {
      ...doc,
      metadata: { ...doc.metadata, notebookPages: container },
    },
    data,
  );
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
  // Hydrate first so an empty live canvas cannot wipe ink still stored on the page.
  const synced = syncCurrentPage(ensureNotebookPages(doc));
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

export function addNotebookPage(
  doc: NoteDocument,
  options?: { label?: string; direction?: PageGrowDirection },
): NoteDocument {
  const synced = syncCurrentPage(doc);
  const container = getNotebookPages(synced);
  const active =
    withPageGridLayout(container.pages).find((p) => p.id === container.activePageId) ??
    withPageGridLayout(container.pages)[0];
  const direction = options?.direction ?? "below";
  const cell = active
    ? nextCellInDirection(active, direction)
    : { gridRow: container.pages.length, gridCol: 0 };

  // If the target cell is occupied, walk further in that direction.
  let target = cell;
  while (findPageAtCell(container.pages, target.gridRow, target.gridCol)) {
    target = nextCellInDirection(target, direction);
  }

  const nextNumber = container.pages.length + 1;
  const id = rid("pg");
  const newPage: NotebookPageRecord = {
    id,
    pageNumber: nextNumber,
    label: options?.label?.trim() || `Page ${nextNumber}`,
    gridRow: target.gridRow,
    gridCol: target.gridCol,
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

/** FreeNotes-style: grow the desk down or to the right from the active sheet. */
export function addNotebookPageInDirection(
  doc: NoteDocument,
  direction: PageGrowDirection,
): NoteDocument {
  return addNotebookPage(doc, { direction });
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
    gridRow: (source.gridRow ?? container.pages.length - 1) + 1,
    gridCol: source.gridCol ?? 0,
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
  data.compositeSections = packStudyBlocks(
    formatIds.map((formatId, index) => ({
      id: rid("sec"),
      formatId,
      title: sectionTitles[index] ?? getFormatDefinition(formatId).label,
      data: createEmptySectionData(formatId),
    })),
    { originY: 48 },
  );
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

  const created: CompositeSection[] = toAdd.map((formatId) => ({
    id: rid("sec"),
    formatId,
    title: getFormatDefinition(formatId).label,
    data: createEmptySectionData(formatId),
  }));
  const originY = existing.length
    ? bottomOfSections(existing) + 40
    : originYForTypedNotes(data.typed);
  const packed = packStudyBlocks(created, { originY });

  return {
    ...data,
    compositeSections: [...existing, ...packed],
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
      return { ...base, w: options?.w ?? 180, h: options?.h ?? 6, color: color || "#44403c" };
    case "vline":
      return { ...base, w: options?.w ?? 6, h: options?.h ?? 180, color: color || "#44403c" };
    case "border_frame":
      return {
        ...base,
        w: options?.w ?? 220,
        h: options?.h ?? 160,
        color: color || "#44403c",
        fillOpacity: 0,
        borderColor: color || "#44403c",
      };
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
