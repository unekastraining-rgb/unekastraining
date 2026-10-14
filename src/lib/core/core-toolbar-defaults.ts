import type { CoreToolbarItemId, CoreToolbarState } from "@/lib/core/core-toolbar-types";

export const DEFAULT_TOOLBAR_VISIBLE: CoreToolbarItemId[] = [
  "chat",
  "pen",
  "eraser",
  "lasso",
  "select",
  "text",
  "stickers",
  "images",
  "elements",
  "shapes",
  "sticky",
  "templates",
  "starters",
  "customize",
];

/** Older “pen-only” chrome — upgrade back to the full writing toolkit. */
const LEGACY_MINIMAL_TOOLBAR = new Set<CoreToolbarItemId>([
  "pen",
  "eraser",
  "lasso",
  "select",
  "text",
  "templates",
]);

export function normalizeToolbarVisibleItems(
  items: CoreToolbarItemId[] | undefined | null,
): CoreToolbarItemId[] {
  if (!items || items.length === 0) return [...DEFAULT_TOOLBAR_VISIBLE];
  const onlyLegacy =
    items.length <= 6 && items.every((id) => LEGACY_MINIMAL_TOOLBAR.has(id));
  if (onlyLegacy) return [...DEFAULT_TOOLBAR_VISIBLE];
  let next = [...items];
  if (!next.includes("starters")) {
    const templatesIdx = next.indexOf("templates");
    if (templatesIdx >= 0) next.splice(templatesIdx + 1, 0, "starters");
    else next.push("starters");
  }
  if (!next.includes("customize")) {
    next = [...next, "customize"];
  }
  return next;
}

export const ALL_TOOLBAR_ITEMS: CoreToolbarItemId[] = [
  "chat",
  "readWrite",
  "select",
  "lasso",
  "pen",
  "eraser",
  "text",
  "elements",
  "stickers",
  "images",
  "templates",
  "starters",
  "shapes",
  "sticky",
  "laser",
  "record",
  "recordings",
  "zoom",
  "ruler",
  "timekeeper",
  "customize",
  "clearPage",
];

export function defaultCoreToolbarState(
  visibleItems: CoreToolbarItemId[] = DEFAULT_TOOLBAR_VISIBLE,
): CoreToolbarState {
  return {
    readOnly: false,
    visibleItems: normalizeToolbarVisibleItems(visibleItems),
    activePenMode: "fountain",
    lasso: {
      mode: "freehand",
      selectHandwriting: true,
      selectImages: true,
      selectShapes: true,
      selectArrows: true,
      selectTextBoxes: true,
      selectEquations: true,
      selectTape: true,
      selectStickyNotes: true,
    },
    fountainPen: {
      tipSharpness: 65,
      pressureSensitivity: 70,
      tipFlatness: 35,
      thickness: 4,
      strokeType: "solid",
    },
    penSettings: {
      thicknessBySpeed: true,
      reduceLatency: true,
      drawAndHold: {
        enabled: false,
        snapToShapes: true,
        fillColor: false,
      },
      gestures: {
        scribbleToErase: true,
        eraseShapesAndHighlighter: true,
        circleToLasso: false,
      },
    },
    writingAids: {
      recognitionLanguage: "auto",
      checkSpelling: true,
      spellcheckNewDocuments: true,
      personalDictionary: [],
    },
    tape: {
      straightTape: true,
    },
    shapeDraw: {
      requireHoldToSnap: false,
      snapToShapes: true,
      fillColor: false,
    },
    pencilReduceLatency: true,
    highlighterReduceLatency: true,
    shapeKind: "rect",
    inkTool: "pen",
  };
}

export function penModeToInkTool(mode: CoreToolbarState["activePenMode"]): import("@/lib/core/ink-engine").InkTool {
  switch (mode) {
    case "highlighter":
      return "highlighter";
    case "shape":
      return "shape";
    default:
      return "pen";
  }
}

export function penModeToInkMedium(
  mode: CoreToolbarState["activePenMode"],
): "ink" | "chalk" | "crayon" | "colorPencil" | "marker" {
  switch (mode) {
    case "chalk":
      return "chalk";
    case "crayon":
      return "crayon";
    case "colorPencil":
      return "colorPencil";
    case "marker":
      return "marker";
    default:
      return "ink";
  }
}

export function penModeToInkSize(mode: CoreToolbarState["activePenMode"], state: CoreToolbarState): number {
  switch (mode) {
    case "fountain":
    case "ball":
    case "brush":
      return state.fountainPen.thickness;
    case "pencil":
      return 2;
    case "colorPencil":
      return 3;
    case "chalk":
      return 6;
    case "crayon":
      return 9;
    case "marker":
      return 10;
    case "highlighter":
      return 14;
    case "tape":
      return 18;
    case "shape":
      return 3;
    default:
      return 4;
  }
}
