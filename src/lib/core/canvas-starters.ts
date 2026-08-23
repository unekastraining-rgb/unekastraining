import { getFormatDefinition, type CoreFormatId } from "@/lib/core/format-catalog";
import { WHITEBOARD_STARTERS } from "@/lib/core/page-templates";

export type CanvasStarterKind = "layout" | "format";

export type CanvasStarterCategory = "layout" | "structured" | "visual" | "composite";

export interface CanvasStarter {
  id: string;
  label: string;
  emoji: string;
  kind: CanvasStarterKind;
  category: CanvasStarterCategory;
  formatId?: CoreFormatId;
}

/** Explicit starter lists — matches Structured / Visual / Composite picker in Tools. */
const STRUCTURED_FORMAT_IDS: CoreFormatId[] = [
  "OUTLINE",
  "HIERARCHY",
  "CORNELL",
  "TWO_COLUMN",
  "SENTENCE",
  "CHARTING",
  "COMPARISON_MATRIX",
  "TIMELINE",
  "PROGRESSIVE",
  "PROBLEM_SOLUTION",
  "CONCEPT_DEFINITION",
  "QA",
];

const VISUAL_FORMAT_IDS: CoreFormatId[] = [
  "BOXING",
  "MIND_MAP",
  "FLOW",
  "PROCESS_FLOW",
];

const COMPOSITE_FORMAT_IDS: CoreFormatId[] = ["CORNELL_MIND"];

const LAYOUT_STARTERS: CanvasStarter[] = WHITEBOARD_STARTERS.map((starter) => ({
  id: starter.id,
  label: starter.label,
  emoji: starter.emoji,
  kind: "layout" as const,
  category: "layout" as const,
}));

function formatStarters(
  formatIds: CoreFormatId[],
  category: Exclude<CanvasStarterCategory, "layout">,
): CanvasStarter[] {
  return formatIds.map((formatId) => {
    const def = getFormatDefinition(formatId);
    return {
      id: formatId,
      label: def.label,
      emoji: def.emoji,
      kind: "format" as const,
      category,
      formatId,
    };
  });
}

const FORMAT_STARTERS: CanvasStarter[] = [
  ...formatStarters(STRUCTURED_FORMAT_IDS, "structured"),
  ...formatStarters(VISUAL_FORMAT_IDS, "visual"),
  ...formatStarters(COMPOSITE_FORMAT_IDS, "composite"),
];

export const CANVAS_STARTERS: CanvasStarter[] = [...LAYOUT_STARTERS, ...FORMAT_STARTERS];

export const CANVAS_STARTER_GROUPS: {
  id: CanvasStarterCategory;
  label: string;
}[] = [
  { id: "layout", label: "Canvas layouts" },
  { id: "structured", label: "Structured" },
  { id: "visual", label: "Visual" },
  { id: "composite", label: "Composite" },
];

/** All format IDs available as canvas starters (for validation / UI hints). */
export const CANVAS_FORMAT_IDS: CoreFormatId[] = [
  ...STRUCTURED_FORMAT_IDS,
  ...VISUAL_FORMAT_IDS,
  ...COMPOSITE_FORMAT_IDS,
];

const LAYOUT_IDS = new Set(LAYOUT_STARTERS.map((starter) => starter.id));

export function isLayoutStarter(id: string): boolean {
  return LAYOUT_IDS.has(id);
}

export function isFormatStarter(id: string): boolean {
  return CANVAS_FORMAT_IDS.includes(id as CoreFormatId);
}

export function formatIdsFromStarters(starterIds: string[]): CoreFormatId[] {
  return starterIds.filter((id) => isFormatStarter(id)) as CoreFormatId[];
}

export function layoutIdsFromStarters(starterIds: string[]): string[] {
  return starterIds.filter((id) => isLayoutStarter(id));
}

export function startersByCategory(category: CanvasStarterCategory): CanvasStarter[] {
  return CANVAS_STARTERS.filter((starter) => starter.category === category);
}
