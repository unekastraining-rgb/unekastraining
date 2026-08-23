import type { CoreToolbarItemId, CoreToolbarState } from "@/lib/core/core-toolbar-types";

export const DEFAULT_TOOLBAR_VISIBLE: CoreToolbarItemId[] = [
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
  "shapes",
  "sticky",
  "laser",
  "record",
  "zoom",
  "customize",
  "clearPage",
];

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
    visibleItems,
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

export function penModeToInkSize(mode: CoreToolbarState["activePenMode"], state: CoreToolbarState): number {
  switch (mode) {
    case "fountain":
    case "ball":
    case "brush":
      return state.fountainPen.thickness;
    case "pencil":
      return 2;
    case "highlighter":
      return 12;
    case "tape":
      return 18;
    case "shape":
      return 3;
    default:
      return 4;
  }
}
