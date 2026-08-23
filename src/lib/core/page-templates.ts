export type PageTemplateId =
  | "blank"
  | "ruled"
  | "dot_grid"
  | "graph_grid"
  | "cornell"
  | "two_column"
  | "planner_week"
  | "meeting_notes"
  | "study_board";

export type NotebookCoverId =
  | "classic_orange"
  | "teal_minimal"
  | "midnight"
  | "botanical"
  | "graph_paper"
  | "lavender"
  | "rose"
  | "sunset"
  | "ocean"
  | "slate";

export interface PageTemplate {
  id: PageTemplateId;
  label: string;
  description: string;
  paperClass: string;
  noteMethod?: string;
}

export interface NotebookCover {
  id: NotebookCoverId;
  label: string;
  gradient: string;
  accent: string;
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "blank",
    label: "Blank",
    description: "Clean white page",
    paperClass: "bg-white",
  },
  {
    id: "ruled",
    label: "Ruled",
    description: "Lined notebook",
    paperClass:
      "bg-[repeating-linear-gradient(transparent,transparent_27px,#e7e5e4_28px)]",
    noteMethod: "RULED",
  },
  {
    id: "dot_grid",
    label: "Dot grid",
    description: "GoodNotes-style dots",
    paperClass:
      "bg-[radial-gradient(circle,#d6d3d1_1px,transparent_1px)] bg-[length:18px_18px]",
    noteMethod: "DOT_GRID",
  },
  {
    id: "graph_grid",
    label: "Graph",
    description: "Square graph paper",
    paperClass:
      "bg-[linear-gradient(#e7e5e4_1px,transparent_1px),linear-gradient(90deg,#e7e5e4_1px,transparent_1px)] bg-[size:24px_24px]",
    noteMethod: "DOT_GRID",
  },
  {
    id: "cornell",
    label: "Cornell",
    description: "Notes + cues layout",
    paperClass: "bg-white",
    noteMethod: "CORNELL",
  },
  {
    id: "two_column",
    label: "Two column",
    description: "Split page",
    paperClass: "bg-white",
  },
  {
    id: "planner_week",
    label: "Weekly planner",
    description: "7-day strip at top",
    paperClass:
      "bg-[repeating-linear-gradient(transparent,transparent_27px,#f5e6d3_28px)]",
    noteMethod: "RULED",
  },
  {
    id: "meeting_notes",
    label: "Meeting notes",
    description: "Agenda + actions",
    paperClass: "bg-white",
  },
  {
    id: "study_board",
    label: "Study board",
    description: "KWL-style zones",
    paperClass:
      "bg-[linear-gradient(90deg,#fff_0,#fff_33%,#fef3c7_33%,#fef3c7_34%,#fff_34%,#fff_66%,#ccfbf1_66%,#ccfbf1_67%,#fff_67%)]",
  },
];

export const NOTEBOOK_COVERS: NotebookCover[] = [
  {
    id: "classic_orange",
    label: "Classic orange",
    gradient: "from-orange-400 to-amber-500",
    accent: "#ea580c",
  },
  {
    id: "teal_minimal",
    label: "Teal minimal",
    gradient: "from-teal-500 to-cyan-600",
    accent: "#0d9488",
  },
  {
    id: "midnight",
    label: "Midnight",
    gradient: "from-stone-800 to-stone-950",
    accent: "#292524",
  },
  {
    id: "botanical",
    label: "Botanical",
    gradient: "from-emerald-500 to-lime-600",
    accent: "#15803d",
  },
  {
    id: "graph_paper",
    label: "Graph paper",
    gradient: "from-slate-200 to-slate-300",
    accent: "#64748b",
  },
  {
    id: "lavender",
    label: "Lavender",
    gradient: "from-violet-400 to-purple-600",
    accent: "#7c3aed",
  },
  {
    id: "rose",
    label: "Rose",
    gradient: "from-rose-400 to-pink-600",
    accent: "#e11d48",
  },
  {
    id: "sunset",
    label: "Sunset",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    accent: "#f97316",
  },
  {
    id: "ocean",
    label: "Ocean",
    gradient: "from-sky-400 to-blue-700",
    accent: "#2563eb",
  },
  {
    id: "slate",
    label: "Slate",
    gradient: "from-zinc-400 to-zinc-600",
    accent: "#52525b",
  },
];

export function getNotebookCover(coverId?: NotebookCoverId): NotebookCover {
  return NOTEBOOK_COVERS.find((cover) => cover.id === coverId) ?? NOTEBOOK_COVERS[0]!;
}

export function resolveNotebookCoverStyle(notebook?: {
  coverId?: NotebookCoverId;
  customCoverColor?: string | null;
}): { className?: string; style?: { backgroundColor?: string } } {
  if (notebook?.customCoverColor) {
    return { style: { backgroundColor: notebook.customCoverColor } };
  }
  const cover = getNotebookCover(notebook?.coverId);
  return { className: `bg-gradient-to-r ${cover.gradient}` };
}

export const PEN_PRESETS = [
  {
    id: "ballpoint",
    label: "Ballpoint",
    width: 3,
    opacity: 1,
    pressure: 0.4,
    description: "Everyday writing pen",
  },
  {
    id: "fountain",
    label: "Fountain",
    width: 2.5,
    opacity: 0.92,
    pressure: 0.85,
    description: "Variable width with pressure",
  },
  {
    id: "marker",
    label: "Marker",
    width: 8,
    opacity: 0.95,
    pressure: 0.3,
    description: "Bold marker strokes",
  },
  {
    id: "highlighter",
    label: "Highlighter",
    width: 14,
    opacity: 0.38,
    pressure: 0.2,
    description: "Transparent highlight",
  },
  {
    id: "pencil",
    label: "Pencil",
    width: 2,
    opacity: 0.72,
    pressure: 0.65,
    description: "Soft graphite sketch",
  },
] as const;

export type PenPresetId = (typeof PEN_PRESETS)[number]["id"];

export const WHITEBOARD_STARTERS = [
  { id: "plain", label: "Plain whiteboard", emoji: "⬜" },
  { id: "flowchart", label: "Flowchart", emoji: "🔀" },
  { id: "mindmap", label: "Concept map", emoji: "🧠" },
  { id: "standup", label: "Daily standup", emoji: "📋" },
  { id: "kwl", label: "KWL chart", emoji: "📊" },
  { id: "brainstorm", label: "Brainstorm", emoji: "💡" },
  { id: "swot", label: "SWOT", emoji: "⊞" },
  { id: "spider", label: "Spider map", emoji: "🕸️" },
] as const;
