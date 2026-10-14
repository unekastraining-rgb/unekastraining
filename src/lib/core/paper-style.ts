/**
 * Dynamic paper surfaces (line color, spacing, paper color) for Core notes.
 * FreeNotes-adjacent knobs without cloning their product.
 */

import type { CSSProperties } from "react";
import type { PageTemplateId } from "@/lib/core/page-templates";

export const DEFAULT_PAPER_COLOR = "#fffdf9";
export const DEFAULT_LINE_COLOR = "#e7e5e4";
export const DEFAULT_RULING_SPACING = 32;

/** Common paper fills for create / edit (GoodNotes-adjacent, not a clone). */
export const NOTEBOOK_PAPER_COLORS: Array<{ id: string; label: string; hex: string }> = [
  { id: "cream", label: "Cream", hex: "#fffdf9" },
  { id: "white", label: "White", hex: "#ffffff" },
  { id: "yellow", label: "Yellow", hex: "#fef9c3" },
  { id: "soft_gray", label: "Soft gray", hex: "#f5f5f4" },
  { id: "blush", label: "Blush", hex: "#fff1f2" },
  { id: "mint", label: "Mint", hex: "#ecfdf5" },
];

const LAYOUT_ONLY: PageTemplateId[] = [
  "blank",
  "cornell",
  "two_column",
  "three_column",
  "meeting_notes",
  "mckinsey",
];

export function isLayoutOnlyTemplate(id?: PageTemplateId | null): boolean {
  if (!id) return true;
  return LAYOUT_ONLY.includes(id);
}

function ruledBackground(
  paper: string,
  line: string,
  gap: number,
  margin = true,
): string {
  const rule = Math.max(18, Math.min(56, gap));
  const lines = `repeating-linear-gradient(transparent, transparent ${rule - 1}px, ${line} ${rule}px)`;
  if (!margin) return lines;
  return `${lines}, linear-gradient(90deg, transparent 47px, #fda4af99 47px, #fda4af99 49px, transparent 49px)`;
}

function dotBackground(paper: string, line: string, gap: number): string {
  const size = Math.max(14, Math.min(40, gap));
  return `radial-gradient(circle, ${line} 1.15px, transparent 1.15px)`;
}

function graphBackground(line: string, gap: number): string {
  const size = Math.max(16, Math.min(48, gap));
  return `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`;
}

function staffBackground(paper: string, line: string, gap: number): string {
  // Five-line staff groups with space between staves
  const lineGap = Math.max(8, Math.min(16, Math.round(gap / 3)));
  const stave = lineGap * 4;
  const block = stave + lineGap * 3;
  return [
    `repeating-linear-gradient(
      transparent 0,
      transparent ${lineGap}px,
      ${line} ${lineGap}px,
      ${line} ${lineGap + 1}px,
      transparent ${lineGap + 1}px,
      transparent ${lineGap * 2}px,
      ${line} ${lineGap * 2}px,
      ${line} ${lineGap * 2 + 1}px,
      transparent ${lineGap * 2 + 1}px,
      transparent ${lineGap * 3}px,
      ${line} ${lineGap * 3}px,
      ${line} ${lineGap * 3 + 1}px,
      transparent ${lineGap * 3 + 1}px,
      transparent ${lineGap * 4}px,
      ${line} ${lineGap * 4}px,
      ${line} ${lineGap * 4 + 1}px,
      transparent ${lineGap * 4 + 1}px,
      transparent ${block}px
    )`,
  ].join(",");
}

function withPaperGrain(style: CSSProperties): CSSProperties {
  // Soft fiber as the *last* paint layer so ruling/grid backgroundSize stays intact.
  const grain =
    "radial-gradient(rgba(28,25,23,0.055) 0.6px, transparent 0.85px)";
  const existing = style.backgroundImage;
  const size = style.backgroundSize;
  if (!existing) {
    return {
      ...style,
      backgroundImage: grain,
      backgroundSize: "3.5px 3.5px",
    };
  }
  const layerCount = String(existing).split(/,(?![^(]*\))/).length;
  const sizeForExisting =
    size ??
    Array.from({ length: layerCount }, () => "auto").join(", ");
  return {
    ...style,
    backgroundImage: `${existing}, ${grain}`,
    backgroundSize: `${sizeForExisting}, 3.5px 3.5px`,
  };
}

/**
 * Inline background for the page canvas. Prefer this over static Tailwind
 * paperClass whenever paper/line color or spacing can change.
 */
export function resolvePaperSurfaceStyle(input: {
  templateId?: PageTemplateId | null;
  paperColor?: string | null;
  lineColor?: string | null;
  spacingPx?: number | null;
}): CSSProperties {
  const paper = input.paperColor?.trim() || DEFAULT_PAPER_COLOR;
  const line = input.lineColor?.trim() || DEFAULT_LINE_COLOR;
  const gap = input.spacingPx ?? DEFAULT_RULING_SPACING;
  const id = input.templateId ?? "blank";

  const base: CSSProperties = { backgroundColor: paper };

  switch (id) {
    case "ruled":
    case "college_ruled":
    case "cornell_ruled":
    case "planner_week":
      return withPaperGrain({
        ...base,
        backgroundImage: ruledBackground(
          paper,
          line,
          id === "college_ruled" ? Math.round(gap * 0.85) : gap,
          id !== "cornell_ruled",
        ),
      });
    case "legal_pad":
      return withPaperGrain({
        backgroundColor: paper === DEFAULT_PAPER_COLOR ? "#fef9c3" : paper,
        backgroundImage: ruledBackground(
          paper,
          line === DEFAULT_LINE_COLOR ? "#fde68a" : line,
          gap,
        ),
      });
    case "dot_grid":
      return withPaperGrain({
        ...base,
        backgroundImage: dotBackground(paper, line, gap),
        backgroundSize: `${Math.max(14, Math.min(40, gap))}px ${Math.max(14, Math.min(40, gap))}px`,
      });
    case "graph_grid":
    case "cornell_grid":
      return withPaperGrain({
        ...base,
        backgroundImage: graphBackground(line, gap),
        backgroundSize: `${Math.max(16, Math.min(48, gap))}px ${Math.max(16, Math.min(48, gap))}px`,
      });
    case "isometric":
      return withPaperGrain({
        ...base,
        backgroundImage: `linear-gradient(30deg, ${line}88 1px, transparent 1px), linear-gradient(150deg, ${line}88 1px, transparent 1px), linear-gradient(90deg, ${line}66 1px, transparent 1px)`,
        backgroundSize: `${gap}px ${Math.round(gap * 1.7)}px`,
      });
    case "staff":
      return withPaperGrain({
        ...base,
        backgroundImage: staffBackground(paper, line, gap),
      });
    case "study_board":
      return {
        ...base,
        backgroundImage: `linear-gradient(90deg, ${paper} 0, ${paper} 33%, ${line} 33%, ${line} 34%, ${paper} 34%, ${paper} 66%, ${line} 66%, ${line} 67%, ${paper} 67%)`,
      };
    case "kanban":
      return {
        ...base,
        backgroundImage: `linear-gradient(90deg, ${paper} 0, ${paper} 33%, ${line}22 33%, ${line}22 34%, ${paper} 34%, ${paper} 66%, ${line}22 66%, ${line}22 67%, ${paper} 67%)`,
      };
    default:
      // blank / layout overlays — solid paper with light fiber (overlays draw structure)
      return withPaperGrain(base);
  }
}

/** When true, skip Tailwind paperClass so inline style owns the surface. */
export function usesDynamicPaperStyle(templateId?: PageTemplateId | null): boolean {
  return Boolean(templateId) && !isLayoutOnlyTemplate(templateId);
}
