import type { CompositeSection } from "@/lib/core/note-types";

export const DEFAULT_BLOCK_WIDTH = 320;
export const DEFAULT_BLOCK_HEIGHT = 280;

export function defaultBlockRect(index: number): Pick<CompositeSection, "x" | "y" | "width" | "height"> {
  const col = index % 2;
  const row = Math.floor(index / 2);
  return {
    x: 32 + col * (DEFAULT_BLOCK_WIDTH + 24),
    y: 32 + row * (DEFAULT_BLOCK_HEIGHT + 24),
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

export function pageCanvasMinHeight(sections: CompositeSection[]): number {
  if (sections.length === 0) return 384;
  const positioned = ensureBlockPositions(sections);
  const bottom = Math.max(...positioned.map((section) => (section.y ?? 0) + (section.height ?? DEFAULT_BLOCK_HEIGHT)));
  return Math.max(384, bottom + 48);
}
