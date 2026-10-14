import type { NotebookPageRecord } from "@/lib/core/note-types";
import {
  PAGE_WORLD_BASE_HEIGHT,
  PAGE_WORLD_BASE_WIDTH,
} from "@/lib/core/page-world";

/** Gap between full-screen page tiles (px). */
export const NOTEBOOK_PAGE_GAP = 0;
/**
 * Max rubber-band pull (px) past the last page before release-to-add.
 * Not added to desk size at rest — so one page has no scrollbar until you pull.
 */
export const NOTEBOOK_PAGE_GROW_PAD = 88;
export const NOTEBOOK_SHEET_MAX_WIDTH = 4000;

export type PageGrowDirection = "below" | "beside";

/** "scroll" = stacked full-screen pages; "book" = facing pages side by side. */
export type PageLayoutMode = "scroll" | "book";

export interface PageGridPlacement {
  id: string;
  pageNumber: number;
  label?: string;
  gridRow: number;
  gridCol: number;
  data: Record<string, unknown>;
}

/** Uses stored grid coords (for add/find/book layout). */
export function withPageGridLayout(
  pages: NotebookPageRecord[],
): PageGridPlacement[] {
  return pages.map((page, index) => ({
    id: page.id,
    pageNumber: page.pageNumber,
    label: page.label,
    data: page.data,
    gridRow: Number.isFinite(page.gridRow) ? Number(page.gridRow) : index,
    gridCol: Number.isFinite(page.gridCol) ? Number(page.gridCol) : 0,
  }));
}

/** Continuous scroll stacks pages in order so wheel can flip 1 ↔ 2 ↔ 3. */
export function withScrollStackLayout(
  pages: NotebookPageRecord[],
): PageGridPlacement[] {
  return pages.map((page, index) => ({
    id: page.id,
    pageNumber: page.pageNumber,
    label: page.label,
    data: page.data,
    gridRow: index,
    gridCol: 0,
  }));
}

/**
 * One page = current screen width (or half width in book mode).
 */
export function fitSheetWidth(
  viewportWidth: number | undefined,
  layoutMode: PageLayoutMode = "scroll",
  gap = NOTEBOOK_PAGE_GAP,
): number {
  if (!viewportWidth || !Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    return 0;
  }
  if (layoutMode === "scroll") {
    return Math.round(
      Math.min(NOTEBOOK_SHEET_MAX_WIDTH, Math.max(320, viewportWidth)),
    );
  }
  const perRow = 2;
  const available = (viewportWidth - gap * (perRow + 1)) / perRow;
  return Math.round(Math.min(NOTEBOOK_SHEET_MAX_WIDTH, Math.max(280, available)));
}

/** One page = current screen height — never taller than the visible desk. */
export function fitSheetHeight(
  _sheetW: number,
  viewportHeight?: number,
): number {
  if (viewportHeight && Number.isFinite(viewportHeight) && viewportHeight > 0) {
    return Math.round(viewportHeight);
  }
  // Unmeasured: 0 so the desk can use 100% CSS until ResizeObserver fires.
  return 0;
}

export function pageDeskMetrics(
  pages: NotebookPageRecord[],
  options?: {
    viewportWidth?: number;
    viewportHeight?: number;
    layoutMode?: PageLayoutMode;
    activePageId?: string;
    activeWorldHeight?: number;
  },
) {
  const gap = NOTEBOOK_PAGE_GAP;
  const layoutMode = options?.layoutMode ?? "scroll";
  const laidOut =
    layoutMode === "scroll"
      ? withScrollStackLayout(pages)
      : withPageGridLayout(pages);
  let maxRow = 0;
  let maxCol = 0;
  for (const page of laidOut) {
    maxRow = Math.max(maxRow, page.gridRow);
    maxCol = Math.max(maxCol, page.gridCol);
  }
  const sheetW = fitSheetWidth(options?.viewportWidth, layoutMode, gap);
  const baseSheetH = fitSheetHeight(sheetW, options?.viewportHeight);

  const rowHeights = new Map<number, number>();
  for (let row = 0; row <= maxRow; row++) rowHeights.set(row, baseSheetH);

  let contentHeight = gap;
  for (let row = 0; row <= maxRow; row++) {
    contentHeight += (rowHeights.get(row) ?? baseSheetH) + gap;
  }
  const sideGap = 0;
  const contentWidth = (maxCol + 1) * sheetW + maxCol * gap + sideGap * 2;

  return {
    laidOut,
    maxRow,
    maxCol,
    sheetW,
    sheetH: baseSheetH,
    activeSheetH: baseSheetH,
    gap,
    sideGap,
    contentWidth,
    contentHeight,
    // Exact page tiles at rest — rubber-band pull is gesture-only (no pad height).
    deskWidth: contentWidth,
    deskHeight: contentHeight,
    growPad: NOTEBOOK_PAGE_GROW_PAD,
    activePageId: options?.activePageId,
    rowHeights,
  };
}

export function pageSlotStyle(
  page: Pick<PageGridPlacement, "gridRow" | "gridCol" | "id">,
  sheetW = PAGE_WORLD_BASE_WIDTH,
  sheetH = PAGE_WORLD_BASE_HEIGHT,
  gap = NOTEBOOK_PAGE_GAP,
  options?: {
    activePageId?: string;
    activeSheetH?: number;
    rowHeights?: Map<number, number>;
    sideGap?: number;
  },
): { left: number; top: number; width: number; height: number } {
  const sideGap = options?.sideGap ?? gap;
  let top = gap;
  if (options?.rowHeights) {
    for (let row = 0; row < page.gridRow; row++) {
      top += (options.rowHeights.get(row) ?? sheetH) + gap;
    }
  } else {
    top = gap + page.gridRow * (sheetH + gap);
  }
  const height =
    options?.activePageId &&
    page.id === options.activePageId &&
    options.activeSheetH
      ? options.activeSheetH
      : options?.rowHeights?.get(page.gridRow) ?? sheetH;
  return {
    left: sideGap + page.gridCol * (sheetW + gap),
    top,
    width: sheetW,
    height,
  };
}

export function findPageAtCell(
  pages: NotebookPageRecord[],
  row: number,
  col: number,
): PageGridPlacement | undefined {
  return withPageGridLayout(pages).find(
    (page) => page.gridRow === row && page.gridCol === col,
  );
}

export function nextCellInDirection(
  from: Pick<PageGridPlacement, "gridRow" | "gridCol">,
  direction: PageGrowDirection,
): { gridRow: number; gridCol: number } {
  if (direction === "beside") {
    return { gridRow: from.gridRow, gridCol: from.gridCol + 1 };
  }
  return { gridRow: from.gridRow + 1, gridCol: from.gridCol };
}
