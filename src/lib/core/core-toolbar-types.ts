import type { InkTool, ShapeKind } from "@/lib/core/ink-engine";

export type CoreToolbarItemId =
  | "chat"
  | "readWrite"
  | "select"
  | "lasso"
  | "pen"
  | "eraser"
  | "text"
  | "elements"
  | "stickers"
  | "images"
  | "templates"
  | "shapes"
  | "sticky"
  | "laser"
  | "record"
  | "recordings"
  | "zoom"
  | "ruler"
  | "timekeeper"
  | "customize"
  | "clearPage";

export type PenMode =
  | "fountain"
  | "ball"
  | "brush"
  | "pencil"
  | "highlighter"
  | "tape"
  | "shape";

export type LassoMode = "rect" | "freehand";

export type StrokeType = "solid" | "dashed" | "dotted";

export interface LassoSettings {
  mode: LassoMode;
  selectHandwriting: boolean;
  selectImages: boolean;
  selectShapes: boolean;
  selectArrows: boolean;
  selectTextBoxes: boolean;
  selectEquations: boolean;
  selectTape: boolean;
  selectStickyNotes: boolean;
}

export interface DrawAndHoldSettings {
  enabled: boolean;
  snapToShapes: boolean;
  fillColor: boolean;
}

export interface PenGestureSettings {
  scribbleToErase: boolean;
  eraseShapesAndHighlighter: boolean;
  circleToLasso: boolean;
}

export interface FountainPenSettings {
  tipSharpness: number;
  pressureSensitivity: number;
  tipFlatness: number;
  thickness: number;
  strokeType: StrokeType;
}

export interface PenSettings {
  thicknessBySpeed: boolean;
  reduceLatency: boolean;
  drawAndHold: DrawAndHoldSettings;
  gestures: PenGestureSettings;
}

export interface WritingAidsSettings {
  recognitionLanguage: string;
  checkSpelling: boolean;
  spellcheckNewDocuments: boolean;
  personalDictionary: string[];
}

export interface TapeSettings {
  straightTape: boolean;
}

export interface ShapeDrawSettings {
  requireHoldToSnap: boolean;
  snapToShapes: boolean;
  fillColor: boolean;
}

export interface CoreToolbarState {
  readOnly: boolean;
  visibleItems: CoreToolbarItemId[];
  activePenMode: PenMode;
  lasso: LassoSettings;
  fountainPen: FountainPenSettings;
  penSettings: PenSettings;
  writingAids: WritingAidsSettings;
  tape: TapeSettings;
  shapeDraw: ShapeDrawSettings;
  pencilReduceLatency: boolean;
  highlighterReduceLatency: boolean;
  shapeKind: ShapeKind;
  inkTool: InkTool;
}

export interface CoreToolbarActions {
  onOpenChat: () => void;
  onOpenAssist: () => void;
  onToggleReadOnly: () => void;
  onSelectPenMode: (mode: PenMode) => void;
  onSetInkTool: (tool: InkTool) => void;
  onSetShapeKind: (kind: ShapeKind) => void;
  onAddTextBox: () => void;
  onAddSticky: () => void;
  onSelectTool: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onInsertImage: () => void;
  onInsertElements: () => void;
  onStartRecord: () => void;
  onShowRecordings: () => void;
  onClearPage: () => void;
  onToggleLaser: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}
