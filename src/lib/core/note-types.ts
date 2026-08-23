import type { NoteMethod } from "@/generated/prisma";
import type { CoreFormatId } from "@/lib/core/format-catalog";
import type {
  NotebookCoverId,
  PageTemplateId,
  PenPresetId,
} from "@/lib/core/page-templates";

export type NoteTool = "type" | "sketch" | "speak" | "annotate" | "textbox";
export type InkTool = "pen" | "highlighter" | "eraser" | "lasso" | "shape" | "hand";
export type ShapeKind = "rect" | "ellipse" | "line" | "arrow" | "triangle";

export interface SketchPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface SketchStroke {
  id?: string;
  color: string;
  width: number;
  points: SketchPoint[];
  tool?: "pen" | "highlighter" | "eraser";
  opacity?: number;
}

export interface CanvasViewport {
  x: number;
  y: number;
  scale: number;
}

export interface CanvasSticky {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
}

export interface CanvasShape {
  id: string;
  kind: ShapeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  strokeWidth: number;
}

export interface InfiniteCanvasData {
  viewport: CanvasViewport;
  strokes: SketchStroke[];
  stickies: CanvasSticky[];
  shapes: CanvasShape[];
}

export interface AudioClip {
  id: string;
  label: string;
  transcript: string;
  durationMs: number;
  recordedAt: string;
  storageKey?: string;
  aiTranscript?: boolean;
}

export interface NotebookChromeState {
  coverId?: NotebookCoverId;
  /** User-chosen cover color (hex). Overrides gradient when set. */
  customCoverColor?: string | null;
  /** When false, page has no cover band or spine. */
  showCover?: boolean;
  pageTemplateId?: PageTemplateId;
  /** Imported PNG/JPG/PDF background asset id */
  customBackgroundAssetId?: string | null;
  penPresetId?: PenPresetId;
  /** Page fill behind template */
  pageBackgroundColor?: string | null;
  /** Notebook edge / margin accent */
  edgeColor?: string | null;
  /** Visual scheme for page chrome */
  colorScheme?: "solid" | "ombre" | "edge" | "bubbles";
  /** Colors from applied palette card */
  appliedPaletteColors?: string[];
}

export interface PageTextBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color?: string;
  backgroundColor?: string;
  rotation?: number;
  locked?: boolean;
  zIndex?: number;
  opacity?: number;
  groupId?: string;
}

export type DecorationKind =
  | "sticky"
  | "color_block"
  | "number_bubble"
  | "circle"
  | "ellipse"
  | "triangle"
  | "arrow"
  | "line"
  | "dot"
  | "shape_rect"
  | "hexagon"
  | "star_shape"
  | "diamond_shape"
  | "banner"
  | "text_stamp";

export interface PageDecoration {
  id: string;
  kind: DecorationKind;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  text?: string;
  number?: number;
  rotation?: number;
  locked?: boolean;
  zIndex?: number;
  opacity?: number;
  borderColor?: string;
  fillOpacity?: number;
  textColor?: string;
  groupId?: string;
}

export interface PageImage {
  id: string;
  assetId: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  rotation?: number;
  locked?: boolean;
  zIndex?: number;
  opacity?: number;
  groupId?: string;
}

export interface CompositeSection {
  id: string;
  formatId: CoreFormatId;
  title: string;
  /** Isolated editor payload for composite pages */
  data?: Record<string, unknown>;
  /** Position on the freeform page canvas */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
}

export interface NotebookPageRecord {
  id: string;
  pageNumber: number;
  label?: string;
  data: Record<string, unknown>;
}

export interface NotebookPagesContainer {
  activePageId: string;
  pages: NotebookPageRecord[];
}

export interface CornellContent {
  notes: string;
  cues: string;
  summary: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface MindMapData {
  nodes: MindMapNode[];
  edges: Array<{ from: string; to: string }>;
}

export interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface FlowData {
  nodes: FlowNode[];
  edges: Array<{ from: string; to: string }>;
}

export interface ChartingData {
  columns: string[];
  rows: string[][];
}

export interface QaPair {
  question: string;
  answer: string;
}

export interface QaData {
  pairs: QaPair[];
}

export interface OutlineNode {
  id: string;
  text: string;
  level: number;
}

export interface ProgressiveStep {
  title: string;
  content: string;
  code?: string;
  output?: string;
}

export interface ConceptEntry {
  term: string;
  definition: string;
  example: string;
  application: string;
}

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

export interface ProblemSolutionEntry {
  problem: string;
  approach: string;
  solution: string;
  notes: string;
}

export interface TwoColumnRow {
  left: string;
  right: string;
}

export interface FormatRecommendation {
  formatId: CoreFormatId;
  confidence: number;
  reason: string;
  aiSuggested?: boolean;
}

export interface NoteDocumentMetadata {
  activeFormat?: CoreFormatId;
  recommendedFormats?: FormatRecommendation[];
  appliedFormats?: CoreFormatId[];
  materialSummary?: string;
  guideDismissed?: boolean;
  aiBlocks?: Array<{ id: string; label: string; content: string }>;
  compositeSections?: CompositeSection[];
  notebookPages?: NotebookPagesContainer;
  fontSize?: number;
  fontFamily?: string;
  coreToolbar?: import("@/lib/core/core-toolbar-types").CoreToolbarState;
}

export function emptyMindMap(): MindMapData {
  return {
    nodes: [{ id: "root", label: "Central idea", x: 280, y: 180 }],
    edges: [],
  };
}

export function emptyFlow(): FlowData {
  return {
    nodes: [
      { id: "start", label: "Start", x: 80, y: 160 },
      { id: "step", label: "Step", x: 280, y: 160 },
      { id: "end", label: "End", x: 480, y: 160 },
    ],
    edges: [
      { from: "start", to: "step" },
      { from: "step", to: "end" },
    ],
  };
}

export function emptyCharting(): ChartingData {
  return {
    columns: ["Topic", "Details", "Notes"],
    rows: [
      ["", "", ""],
      ["", "", ""],
    ],
  };
}

export function emptyQa(): QaData {
  return {
    pairs: [{ question: "", answer: "" }],
  };
}

export function emptyTimeline(): { events: TimelineEvent[] } {
  return { events: [{ date: "", title: "", description: "" }] };
}

export function emptyProgressive(): { steps: ProgressiveStep[] } {
  return {
    steps: [
      { title: "Step 1", content: "", code: "", output: "" },
      { title: "Step 2", content: "", code: "", output: "" },
    ],
  };
}

export function emptyConcepts(): { items: ConceptEntry[] } {
  return {
    items: [{ term: "", definition: "", example: "", application: "" }],
  };
}

export function emptyProblemSolution(): { items: ProblemSolutionEntry[] } {
  return {
    items: [{ problem: "", approach: "", solution: "", notes: "" }],
  };
}

export function emptyTwoColumn(): {
  leftHeader: string;
  rightHeader: string;
  rows: TwoColumnRow[];
} {
  return {
    leftHeader: "Term / Idea",
    rightHeader: "Definition / Detail",
    rows: [
      { left: "", right: "" },
      { left: "", right: "" },
    ],
  };
}

export function emptyOutlineNodes(): { nodes: OutlineNode[] } {
  return {
    nodes: [
      { id: "h1", text: "Main topic", level: 0 },
      { id: "h2", text: "Subtopic", level: 1 },
    ],
  };
}

export interface NoteDocument {
  tool: NoteTool;
  typed: string;
  strokes: SketchStroke[];
  cornell?: CornellContent;
  outline?: string[];
  outlineNodes?: OutlineNode[];
  annotations?: SketchStroke[];
  pdfMaterialId?: string | null;
  mindMap?: MindMapData;
  flow?: FlowData;
  charting?: ChartingData;
  qa?: QaData;
  progressive?: { steps: ProgressiveStep[] };
  concepts?: { items: ConceptEntry[] };
  timeline?: { events: TimelineEvent[] };
  problemSolution?: { items: ProblemSolutionEntry[] };
  twoColumn?: {
    leftHeader: string;
    rightHeader: string;
    rows: TwoColumnRow[];
  };
  canvas?: InfiniteCanvasData;
  audioClips?: AudioClip[];
  notebook?: NotebookChromeState;
  pageTextBoxes?: PageTextBox[];
  pageImages?: PageImage[];
  decorations?: PageDecoration[];
  metadata?: NoteDocumentMetadata;
}

export const NOTE_METHODS: Array<{
  id: NoteMethod;
  label: string;
  description: string;
  emoji: string;
}> = [
  { id: "OUTLINE", label: "Outline", description: "Hierarchical headings & bullets", emoji: "📋" },
  { id: "CORNELL", label: "Cornell", description: "Notes, cues, and summary columns", emoji: "📓" },
  { id: "BLANK", label: "Blank", description: "Freeform page", emoji: "📄" },
  { id: "DOT_GRID", label: "Dot grid", description: "GoodNotes-style dotted paper", emoji: "⊞" },
  { id: "RULED", label: "Ruled", description: "Lined notebook paper", emoji: "📝" },
  { id: "FLOW", label: "Flow", description: "Process & workflow diagrams", emoji: "🔀" },
  { id: "CHARTING", label: "Charting", description: "Compare & contrast tables", emoji: "📊" },
  { id: "QA", label: "Q&A", description: "Question and answer pairs", emoji: "❓" },
  { id: "SKETCH", label: "Sketch", description: "Draw and diagram freely", emoji: "✏️" },
  { id: "WHITEBOARD", label: "Whiteboard", description: "Infinite canvas workspace", emoji: "⬜" },
  { id: "MIND_MAP", label: "Mind map", description: "Interactive concept maps", emoji: "🧠" },
];

export function emptyCanvas(): InfiniteCanvasData {
  return {
    viewport: { x: 0, y: 0, scale: 1 },
    strokes: [],
    stickies: [],
    shapes: [],
  };
}

export function emptyDocument(tool: NoteTool = "type"): NoteDocument {
  return {
    tool,
    typed: "",
    strokes: [],
    outline: [""],
    outlineNodes: emptyOutlineNodes().nodes,
    cornell: { notes: "", cues: "", summary: "" },
    annotations: [],
    pdfMaterialId: null,
    mindMap: emptyMindMap(),
    flow: emptyFlow(),
    charting: emptyCharting(),
    qa: emptyQa(),
    progressive: emptyProgressive(),
    concepts: emptyConcepts(),
    timeline: emptyTimeline(),
    problemSolution: emptyProblemSolution(),
    twoColumn: emptyTwoColumn(),
    canvas: emptyCanvas(),
    audioClips: [],
    notebook: {
      coverId: "classic_orange",
      customCoverColor: "#ea580c",
      showCover: true,
      pageTemplateId: "blank",
      penPresetId: "ballpoint",
    },
    pageTextBoxes: [],
    pageImages: [],
    metadata: {},
  };
}

export function parseNoteDocument(raw: string | null | undefined): NoteDocument {
  if (!raw) return emptyDocument();
  try {
    return { ...emptyDocument(), ...JSON.parse(raw) };
  } catch {
    return { ...emptyDocument(), typed: raw };
  }
}
