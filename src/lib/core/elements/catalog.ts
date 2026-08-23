/**
 * Expandable Elements Library catalog.
 * Add packs by appending to ELEMENT_PACKS and calling registerPackElements().
 */

import { SITE_CLIP_ART, type ClipArtGroup, type SiteClipArtItem } from "@/lib/core/clip-art-catalog";
import type { DecorationKind } from "@/lib/core/note-types";

export type ElementCategoryId =
  | "back-to-school"
  | "text-labels"
  | "sticky-notes"
  | "everyday"
  | "planning"
  | "shapes"
  | "diagrams"
  | "decorative"
  | "academic-cs"
  | "academic-math"
  | "academic-science"
  | "academic-psychology"
  | "academic-history"
  | "alerts"
  | "emphasis"
  | "celebration"
  | "motivation"
  | "priority"
  | "reminders"
  | "numbers"
  | "bullets"
  | "callouts"
  | "needs-work"
  | "questions"
  | "progress";

export type ElementInsertType = "clip-art" | "decoration" | "text-stamp";

/** Visual object vs text stamp — stickers live in a separate library. */
export type ElementRole = "visual" | "text";

export interface ElementDefinition {
  id: string;
  name: string;
  category: ElementCategoryId;
  packId: string;
  insertType: ElementInsertType;
  role: ElementRole;
  tags: string[];
  /** For clip-art inserts */
  assetId?: string;
  /** For decoration / stamp inserts */
  decorationKind?: DecorationKind;
  defaultText?: string;
  defaultColor?: string;
  defaultSize?: { w: number; h: number };
}

export interface ElementPack {
  id: string;
  name: string;
  description?: string;
}

export const ELEMENT_CATEGORIES: Record<ElementCategoryId, string> = {
  "back-to-school": "Back to School",
  "text-labels": "Text & Labels",
  "sticky-notes": "Sticky Notes",
  everyday: "Everyday",
  planning: "Planning",
  shapes: "Shapes",
  diagrams: "Diagrams & Mind Maps",
  decorative: "Decorative",
  "academic-cs": "Computer Science",
  "academic-math": "Mathematics",
  "academic-science": "Science",
  "academic-psychology": "Psychology",
  "academic-history": "History",
  alerts: "Alerts & Warnings",
  emphasis: "Emphasis",
  celebration: "Celebration",
  motivation: "Motivation",
  priority: "Priority",
  reminders: "Reminders",
  numbers: "Numbers",
  bullets: "Bullets & Lists",
  callouts: "Academic Callouts",
  "needs-work": "Needs More Work",
  questions: "Questions",
  progress: "Progress",
};

export const ELEMENT_PACKS: ElementPack[] = [
  { id: "core", name: "Study Essentials" },
  { id: "back-to-school", name: "Back to School" },
  { id: "academic", name: "Academic" },
  { id: "motivation", name: "Motivation" },
  { id: "planning", name: "Planning" },
  { id: "shapes", name: "Shapes Pack" },
  { id: "fall", name: "Fall Pack" },
];

const TEXT_STAMPS = [
  "Important",
  "Remember",
  "Study",
  "Exam",
  "Homework",
  "Due",
  "Review",
  "To Do",
  "Completed",
  "Key Concept",
  "Definition",
  "Example",
  "Formula",
  "Warning",
  "Common Mistake",
  "Professor Says",
  "Test Yourself",
  "Takeaway",
  "Needs More Work",
  "Review Again",
  "Confused",
  "Ask About This",
  "Keep Going",
  "You Got This",
  "Focus",
  "Look Here",
  "Key Point",
  "Don't Forget",
  "Due Today",
  "Overdue",
  "Why?",
  "How?",
  "What?",
  "Great Job",
  "Mastered",
  "Nailed It",
  "HOT TOPIC",
  "HIGH PRIORITY",
  "WATCH OUT",
  "DO NOT FORGET",
];

const STICKY_VARIANTS = [
  { suffix: "square", w: 160, h: 120, color: "#fef9c3" },
  { suffix: "wide", w: 200, h: 100, color: "#fde68a" },
  { suffix: "tall", w: 120, h: 160, color: "#fbcfe8" },
  { suffix: "mint", w: 160, h: 120, color: "#d1fae5" },
  { suffix: "sky", w: 160, h: 120, color: "#e0f2fe" },
  { suffix: "coral", w: 160, h: 120, color: "#fecdd3" },
  { suffix: "minimal", w: 140, h: 100, color: "#f5f5f4" },
  { suffix: "large", w: 220, h: 160, color: "#fef08a" },
];

const SHAPE_ENTRIES: Array<{ kind: DecorationKind; name: string; tags: string[]; w: number; h: number }> = [
  { kind: "shape_rect", name: "Rectangle", tags: ["square", "box"], w: 100, h: 60 },
  { kind: "circle", name: "Circle", tags: ["round"], w: 80, h: 80 },
  { kind: "ellipse", name: "Ellipse", tags: ["oval"], w: 120, h: 70 },
  { kind: "triangle", name: "Triangle", tags: ["geometry"], w: 90, h: 80 },
  { kind: "hexagon", name: "Hexagon", tags: ["geometry"], w: 90, h: 90 },
  { kind: "star_shape", name: "Star", tags: ["favorite"], w: 80, h: 80 },
  { kind: "diamond_shape", name: "Diamond", tags: ["gem"], w: 70, h: 90 },
  { kind: "arrow", name: "Arrow", tags: ["point", "direction"], w: 120, h: 24 },
  { kind: "line", name: "Line", tags: ["connector"], w: 120, h: 8 },
  { kind: "banner", name: "Banner", tags: ["label", "header"], w: 160, h: 40 },
  { kind: "dot", name: "Dot", tags: ["bullet"], w: 16, h: 16 },
];

const STICKER_CLIP_ART_GROUPS = new Set<ClipArtGroup>([
  "stickers",
  "decorative",
  "animated",
  "expressive",
]);

function clipArtToElement(item: SiteClipArtItem, category?: ElementCategoryId): ElementDefinition {
  return {
    id: `clip-${item.id}`,
    name: item.label,
    category: category ?? mapGroupToCategory(item.group, item.id),
    packId: "core",
    insertType: "clip-art",
    role: "visual",
    tags: [item.label.toLowerCase(), ...(item.tags ?? []), item.group],
    assetId: `site/${item.src}`,
  };
}

function buildCatalog(): ElementDefinition[] {
  const items: ElementDefinition[] = [];

  for (const item of SITE_CLIP_ART) {
    if (STICKER_CLIP_ART_GROUPS.has(item.group)) continue;
    items.push(clipArtToElement(item));
  }

  for (const label of TEXT_STAMPS) {
    items.push({
      id: `stamp-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: label,
      category: label.match(/important|warning|mistake|forget|watch/i)
        ? "alerts"
        : label.match(/great|mastered|nailed|completed|job/i)
          ? "celebration"
          : label.match(/keep|focus|got this|going/i)
            ? "motivation"
            : label.match(/due|overdue|forget|review/i)
              ? "reminders"
              : label.match(/confused|needs|ask|again/i)
                ? "needs-work"
                : label.match(/\?|why|how|what/i)
                  ? "questions"
                  : "callouts",
      packId: "core",
      insertType: "text-stamp",
      role: "text",
      tags: label.toLowerCase().split(/\s+/),
      decorationKind: "text_stamp",
      defaultText: label,
      defaultColor: "#fef3c7",
      defaultSize: { w: 140, h: 36 },
    });
  }

  for (const sticky of STICKY_VARIANTS) {
    items.push({
      id: `sticky-${sticky.suffix}`,
      name: `Sticky note (${sticky.suffix})`,
      category: "sticky-notes",
      packId: "core",
      insertType: "decoration",
      role: "visual",
      tags: ["sticky", "note", sticky.suffix],
      decorationKind: "sticky",
      defaultColor: sticky.color,
      defaultSize: { w: sticky.w, h: sticky.h },
    });
  }

  for (const shape of SHAPE_ENTRIES) {
    items.push({
      id: `shape-${shape.kind}`,
      name: shape.name,
      category: "shapes",
      packId: "shapes",
      insertType: "decoration",
      role: "visual",
      tags: shape.tags,
      decorationKind: shape.kind,
      defaultColor: "#93c5fd",
      defaultSize: { w: shape.w, h: shape.h },
    });
  }

  for (let n = 0; n <= 9; n += 1) {
    items.push({
      id: `num-${n}`,
      name: String(n),
      category: "numbers",
      packId: "core",
      insertType: "decoration",
      role: "visual",
      tags: ["number", String(n), "count"],
      decorationKind: "number_bubble",
      defaultColor: "#6366f1",
      defaultSize: { w: 36, h: 36 },
      defaultText: String(n),
    });
  }

  const diagramNodes = ["Concept", "Idea", "Topic", "Branch", "Node", "Step"];
  for (const name of diagramNodes) {
    items.push({
      id: `diagram-${name.toLowerCase()}`,
      name: `${name} node`,
      category: "diagrams",
      packId: "academic",
      insertType: "decoration",
      role: "visual",
      tags: ["mind map", "flow", "diagram", name.toLowerCase()],
      decorationKind: "shape_rect",
      defaultColor: "#c4b5fd",
      defaultSize: { w: 120, h: 56 },
      defaultText: name,
    });
  }

  const priorityLevels = [
    { label: "Low Priority", color: "#86efac", tags: ["low", "priority"] },
    { label: "Medium Priority", color: "#fde68a", tags: ["medium", "priority"] },
    { label: "High Priority", color: "#fb923c", tags: ["high", "priority", "urgent"] },
    { label: "Urgent", color: "#f87171", tags: ["urgent", "priority", "important"] },
  ];
  for (const level of priorityLevels) {
    items.push({
      id: `priority-${level.tags[0]}`,
      name: level.label,
      category: "priority",
      packId: "core",
      insertType: "text-stamp",
      role: "text",
      tags: level.tags,
      decorationKind: "banner",
      defaultText: level.label,
      defaultColor: level.color,
      defaultSize: { w: 150, h: 36 },
    });
  }

  const progressLabels = [
    "Progress",
    "Milestone",
    "Goal",
    "Streak",
    "Level Up",
    "Almost There",
    "Keep Going",
  ];
  for (const label of progressLabels) {
    items.push({
      id: `progress-${label.toLowerCase().replace(/\s+/g, "-")}`,
      name: label,
      category: "progress",
      packId: "motivation",
      insertType: "text-stamp",
      role: "text",
      tags: ["progress", "track", label.toLowerCase()],
      decorationKind: "banner",
      defaultText: label,
      defaultColor: "#a5f3fc",
      defaultSize: { w: 130, h: 36 },
    });
  }

  const planningLabels = [
    "Deadline",
    "Appointment",
    "Time Block",
    "Weekly Plan",
    "Monthly Plan",
    "Habit Tracker",
    "Checklist",
  ];
  for (const label of planningLabels) {
    items.push({
      id: `plan-${label.toLowerCase().replace(/\s+/g, "-")}`,
      name: label,
      category: "planning",
      packId: "planning",
      insertType: "decoration",
      role: "visual",
      tags: ["plan", "schedule", label.toLowerCase()],
      decorationKind: "shape_rect",
      defaultColor: "#e0e7ff",
      defaultSize: { w: 160, h: 80 },
      defaultText: label,
    });
  }

  const bulletKinds: Array<{ kind: DecorationKind; name: string; tags: string[] }> = [
    { kind: "dot", name: "Bullet dot", tags: ["bullet", "list"] },
    { kind: "circle", name: "Hollow circle bullet", tags: ["bullet", "circle"] },
    { kind: "diamond_shape", name: "Diamond bullet", tags: ["bullet", "diamond"] },
    { kind: "star_shape", name: "Star bullet", tags: ["bullet", "star"] },
    { kind: "triangle", name: "Arrow bullet", tags: ["bullet", "arrow"] },
  ];
  for (const bullet of bulletKinds) {
    items.push({
      id: `bullet-${bullet.kind}`,
      name: bullet.name,
      category: "bullets",
      packId: "core",
      insertType: "decoration",
      role: "visual",
      tags: bullet.tags,
      decorationKind: bullet.kind,
      defaultColor: "#78716c",
      defaultSize: { w: 20, h: 20 },
    });
  }

  return items;
}

function buildPackExtensions(): ElementDefinition[] {
  const items: ElementDefinition[] = [];
  const fallClipIds = ["leaf", "hourglass", "calendar-study", "alarm-clock", "callout-burst"];
  for (const clipId of fallClipIds) {
    const clip = SITE_CLIP_ART.find((entry) => entry.id === clipId);
    if (!clip) continue;
    items.push({
      ...clipArtToElement(clip, clip.id === "alarm-clock" ? "reminders" : "planning"),
      id: `fall-${clip.id}`,
      packId: "fall",
      tags: [...clipArtToElement(clip).tags, "fall", "autumn"],
    });
  }
  return items;
}

const PACK_EXTENSIONS: ElementDefinition[] = buildPackExtensions();

/** Append pack-specific catalog entries at runtime (for future seasonal drops). */
export function registerPackElements(packId: string, packItems: ElementDefinition[]) {
  for (const item of packItems) {
    PACK_EXTENSIONS.push({ ...item, packId });
  }
}

export function importedAssetToElement(asset: { id: string; name: string }): ElementDefinition {
  return {
    id: `imported-${asset.id}`,
    name: asset.name,
    category: "everyday",
    packId: "core",
    insertType: "clip-art",
    role: "visual",
    tags: ["imported", "custom", asset.name.toLowerCase()],
    assetId: asset.id,
  };
}

function mapGroupToCategory(group: string, itemId?: string): ElementCategoryId {
  if (itemId === "puzzle-piece") return "academic-psychology";
  if (itemId === "alarm-clock" || itemId === "megaphone") return "reminders";
  if (itemId === "callout-burst") return "callouts";
  if (itemId === "target" || itemId === "clipboard") return "planning";
  switch (group) {
    case "math":
      return "academic-math";
    case "science":
    case "anatomy":
      return "academic-science";
    case "history":
      return "academic-history";
    case "language":
      return "text-labels";
    case "arts":
      return "decorative";
    case "study":
      return "back-to-school";
    case "tech":
      return "academic-cs";
    case "expressive":
      return "motivation";
    case "decorative":
      return "decorative";
    case "animated":
      return "emphasis";
    default:
      return "everyday";
  }
}

export const ELEMENTS_CATALOG: ElementDefinition[] = [...buildCatalog(), ...PACK_EXTENSIONS];

export function searchElements(
  query: string,
  category?: ElementCategoryId,
  role?: ElementRole,
): ElementDefinition[] {
  const q = query.trim().toLowerCase();
  return ELEMENTS_CATALOG.filter((item) => {
    if (category && item.category !== category) return false;
    if (role && item.role !== role) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.tags.some((tag) => tag.includes(q) || q.includes(tag))
    );
  });
}

export function getElementsByCategory(category: ElementCategoryId): ElementDefinition[] {
  return ELEMENTS_CATALOG.filter((item) => item.category === category);
}
