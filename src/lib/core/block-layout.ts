import type { CoreFormatId } from "@/lib/core/format-catalog";
import type { CompositeSection } from "@/lib/core/note-types";

export const DEFAULT_BLOCK_WIDTH = 480;
export const DEFAULT_BLOCK_HEIGHT = 420;

const LEFT = 36;
const GAP = 48;
const COL_GAP = 36;
const MAX_ROW_WIDTH = 1120;
const TYPED_WRAP_COLS = 86;

export function originYForTypedNotes(typed: string | undefined): number {
  const text = (typed ?? "").trim();
  if (!text) return 56;
  const visualLines = text.split("\n").reduce((sum, line) => {
    return sum + Math.max(1, Math.ceil((line.length || 1) / TYPED_WRAP_COLS));
  }, 0);
  return Math.max(200, 72 + visualLines * 26 + 80);
}

export function sizeForFormatBlock(
  formatId: CoreFormatId,
  data?: Record<string, unknown> | null,
): { width: number; height: number } {
  switch (formatId) {
    case "CORNELL":
    case "CORNELL_MIND":
      return { width: 780, height: 520 };
    case "FLOW":
    case "PROCESS_FLOW": {
      const nodes = (data?.flow as { nodes?: unknown[] } | undefined)?.nodes?.length ?? 3;
      return { width: Math.min(1100, Math.max(680, 100 + nodes * 200)), height: 400 };
    }
    case "MIND_MAP":
      return { width: 700, height: 480 };
    case "CHARTING":
    case "COMPARISON_MATRIX": {
      const rows = (data?.charting as { rows?: unknown[] } | undefined)?.rows?.length ?? 3;
      const cols = (data?.charting as { columns?: unknown[] } | undefined)?.columns?.length ?? 3;
      return {
        width: Math.min(1100, Math.max(560, 96 + cols * 160)),
        height: Math.max(340, 132 + rows * 48),
      };
    }
    case "CONCEPT_DEFINITION": {
      const count = (data?.concepts as { items?: unknown[] } | undefined)?.items?.length ?? 2;
      return { width: 520, height: Math.max(360, 88 + count * 118) };
    }
    case "TWO_COLUMN":
    case "BOXING": {
      const count = (data?.twoColumn as { rows?: unknown[] } | undefined)?.rows?.length ?? 3;
      return { width: 560, height: Math.max(300, 108 + count * 48) };
    }
    case "OUTLINE":
    case "HIERARCHY": {
      const count = Array.isArray(data?.outlineNodes) ? data.outlineNodes.length : 4;
      return { width: 560, height: Math.max(360, 72 + count * 40) };
    }
    case "TIMELINE": {
      const count = (data?.timeline as { events?: unknown[] } | undefined)?.events?.length ?? 3;
      return { width: 560, height: Math.max(360, 80 + count * 108) };
    }
    case "PROGRESSIVE": {
      const count = (data?.progressive as { steps?: unknown[] } | undefined)?.steps?.length ?? 3;
      return { width: 560, height: Math.max(280, 64 + count * 88) };
    }
    case "PROBLEM_SOLUTION": {
      const count = (data?.problemSolution as { items?: unknown[] } | undefined)?.items?.length ?? 2;
      return { width: 560, height: Math.max(260, 64 + count * 110) };
    }
    case "QA": {
      const count = (data?.qa as { pairs?: unknown[] } | undefined)?.pairs?.length ?? 2;
      return { width: 520, height: Math.max(240, 56 + count * 88) };
    }
    default:
      return { width: DEFAULT_BLOCK_WIDTH, height: DEFAULT_BLOCK_HEIGHT };
  }
}

export function defaultBlockRect(index: number): Pick<CompositeSection, "x" | "y" | "width" | "height"> {
  const col = index % 2;
  const row = Math.floor(index / 2);
  return {
    x: LEFT + col * (DEFAULT_BLOCK_WIDTH + COL_GAP),
    y: 48 + row * (DEFAULT_BLOCK_HEIGHT + GAP),
    width: DEFAULT_BLOCK_WIDTH,
    height: DEFAULT_BLOCK_HEIGHT,
  };
}

export function ensureBlockPositions(sections: CompositeSection[]): CompositeSection[] {
  return sections.map((section, index) => {
    if (
      section.x != null &&
      section.y != null &&
      section.width != null &&
      section.height != null
    ) {
      return section;
    }
    return { ...section, ...defaultBlockRect(index) };
  });
}

/** Pack blocks into non-overlapping rows, sized for their format/content. */
export function packStudyBlocks(
  sections: CompositeSection[],
  options?: { originY?: number },
): CompositeSection[] {
  const originY = options?.originY ?? 48;
  let cursorX = LEFT;
  let cursorY = originY;
  let rowHeight = 0;

  function wrapRow() {
    if (rowHeight > 0) cursorY += rowHeight + GAP;
    cursorX = LEFT;
    rowHeight = 0;
  }

  return sections.map((section) => {
    const size = sizeForFormatBlock(section.formatId, section.data);
    const wide = size.width >= 640;

    if (cursorX > LEFT && (wide || cursorX + size.width > LEFT + MAX_ROW_WIDTH)) {
      wrapRow();
    }

    const placed: CompositeSection = {
      ...section,
      x: cursorX,
      y: cursorY,
      width: size.width,
      height: size.height,
    };

    if (wide) {
      cursorY += size.height + GAP;
      cursorX = LEFT;
      rowHeight = 0;
    } else {
      cursorX += size.width + COL_GAP;
      rowHeight = Math.max(rowHeight, size.height);
    }

    return placed;
  });
}

export function bottomOfSections(sections: CompositeSection[]): number {
  if (sections.length === 0) return 0;
  return Math.max(
    ...sections.map(
      (section) => (section.y ?? 0) + (section.height ?? DEFAULT_BLOCK_HEIGHT),
    ),
  );
}

export function pageCanvasMinHeight(sections: CompositeSection[]): number {
  if (sections.length === 0) return 384;
  const positioned = ensureBlockPositions(sections);
  const bottom = Math.max(
    ...positioned.map((section) => (section.y ?? 0) + (section.height ?? DEFAULT_BLOCK_HEIGHT)),
  );
  return Math.max(384, bottom + 48);
}

export function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  padding = 8,
): boolean {
  return !(
    a.x + a.width + padding <= b.x ||
    b.x + b.width + padding <= a.x ||
    a.y + a.height + padding <= b.y ||
    b.y + b.height + padding <= a.y
  );
}
