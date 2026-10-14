export type PageTemplateId =
  | "blank"
  | "ruled"
  | "college_ruled"
  | "dot_grid"
  | "graph_grid"
  | "cornell"
  | "cornell_ruled"
  | "cornell_grid"
  | "two_column"
  | "three_column"
  | "planner_week"
  | "meeting_notes"
  | "study_board"
  | "legal_pad"
  | "isometric"
  | "kanban"
  | "staff"
  | "mckinsey";

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
  | "slate"
  | "coral_reef"
  | "forest_fog"
  | "desert_sand"
  | "ink_navy"
  | "cherry_blossom"
  | "aurora"
  | "art_constellation"
  | "art_marble"
  | "art_terrazzo"
  | "art_topo"
  | "art_watercolor"
  | "art_linen"
  | "art_stained_glass"
  | "art_notebook_sketch";

export type PageTemplateKind = "paper" | "layout";

export interface PageTemplate {
  id: PageTemplateId;
  label: string;
  description: string;
  paperClass: string;
  /** Paper = surface only; layout = guides/zones on top of paper */
  kind: PageTemplateKind;
  noteMethod?: string;
}

export interface NotebookCover {
  id: NotebookCoverId;
  label: string;
  gradient: string;
  accent: string;
  /** Color swatches vs illustrated art covers */
  category: "color" | "art";
  /**
   * Optional CSS background for art covers (gradients / patterns).
   * Applied when customCoverColor is not set.
   */
  artBackground?: string;
  /** Title text on cover band */
  titleTone?: "light" | "dark";
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "blank",
    label: "Blank",
    description: "Cream notebook paper",
    paperClass: "bg-[#fffdf9]",
    kind: "paper",
  },
  {
    id: "ruled",
    label: "Ruled",
    description: "Lined notebook",
    paperClass:
      "bg-[#fffdf9] bg-[repeating-linear-gradient(transparent,transparent_31px,#e7e5e4_32px),linear-gradient(90deg,transparent_47px,#fda4af99_47px,#fda4af99_49px,transparent_49px)]",
    kind: "paper",
    noteMethod: "RULED",
  },
  {
    id: "college_ruled",
    label: "College ruled",
    description: "Tighter lined paper",
    paperClass:
      "bg-[#fffdf9] bg-[repeating-linear-gradient(transparent,transparent_26px,#e7e5e4_27px),linear-gradient(90deg,transparent_47px,#fda4af99_47px,#fda4af99_49px,transparent_49px)]",
    kind: "paper",
    noteMethod: "RULED",
  },
  {
    id: "dot_grid",
    label: "Dot grid",
    description: "Soft dots for handwriting",
    paperClass:
      "bg-[#fffdf9] bg-[radial-gradient(circle,#d6d3d1_1.15px,transparent_1.15px)] bg-[length:20px_20px]",
    kind: "paper",
    noteMethod: "DOT_GRID",
  },
  {
    id: "graph_grid",
    label: "Graph",
    description: "Square graph paper",
    paperClass:
      "bg-[#fffdf9] bg-[linear-gradient(#e7e5e4_1px,transparent_1px),linear-gradient(90deg,#e7e5e4_1px,transparent_1px)] bg-[size:28px_28px]",
    kind: "paper",
    noteMethod: "DOT_GRID",
  },
  {
    id: "legal_pad",
    label: "Legal pad",
    description: "Yellow ruled pad",
    paperClass:
      "bg-[#fef9c3] bg-[repeating-linear-gradient(transparent,transparent_31px,#fde68a_32px),linear-gradient(90deg,transparent_47px,#f8717199_47px,#f8717199_49px,transparent_49px)]",
    kind: "paper",
    noteMethod: "RULED",
  },
  {
    id: "isometric",
    label: "Isometric",
    description: "3D sketch grid",
    paperClass:
      "bg-[linear-gradient(30deg,#e7e5e488_1px,transparent_1px),linear-gradient(150deg,#e7e5e488_1px,transparent_1px),linear-gradient(90deg,#e7e5e466_1px,transparent_1px)] bg-[size:28px_48px]",
    kind: "paper",
    noteMethod: "DOT_GRID",
  },
  {
    id: "cornell",
    label: "Cornell",
    description: "Notes + cues layout",
    paperClass: "bg-white",
    kind: "layout",
    noteMethod: "CORNELL",
  },
  {
    id: "cornell_ruled",
    label: "Cornell ruled",
    description: "Cornell with lined notes",
    paperClass:
      "bg-[#fffdf9] bg-[repeating-linear-gradient(transparent,transparent_31px,#e7e5e4_32px)]",
    kind: "layout",
    noteMethod: "CORNELL",
  },
  {
    id: "cornell_grid",
    label: "Cornell grid",
    description: "Cornell with graph notes",
    paperClass:
      "bg-[#fffdf9] bg-[linear-gradient(#e7e5e4_1px,transparent_1px),linear-gradient(90deg,#e7e5e4_1px,transparent_1px)] bg-[size:28px_28px]",
    kind: "layout",
    noteMethod: "CORNELL",
  },
  {
    id: "two_column",
    label: "Two column",
    description: "Split page",
    paperClass: "bg-white",
    kind: "layout",
  },
  {
    id: "three_column",
    label: "Three column",
    description: "Triple vertical split",
    paperClass: "bg-white",
    kind: "layout",
  },
  {
    id: "staff",
    label: "Staff",
    description: "Music staff lines",
    paperClass:
      "bg-[#fffdf9] bg-[repeating-linear-gradient(transparent,transparent_10px,#d6d3d1_11px,transparent_12px,transparent_20px,#d6d3d1_21px,transparent_22px,transparent_30px,#d6d3d1_31px,transparent_32px,transparent_40px,#d6d3d1_41px,transparent_42px,transparent_50px,#d6d3d1_51px,transparent_52px,transparent_72px)]",
    kind: "paper",
  },
  {
    id: "mckinsey",
    label: "McKinsey",
    description: "Title · situation · insight",
    paperClass: "bg-white",
    kind: "layout",
  },
  {
    id: "planner_week",
    label: "Weekly planner",
    description: "7-day strip at top",
    paperClass:
      "bg-[repeating-linear-gradient(transparent,transparent_31px,#f5e6d3_32px)]",
    kind: "layout",
    noteMethod: "RULED",
  },
  {
    id: "meeting_notes",
    label: "Meeting notes",
    description: "Agenda + actions",
    paperClass: "bg-white",
    kind: "layout",
  },
  {
    id: "study_board",
    label: "Study board",
    description: "KWL-style zones",
    paperClass:
      "bg-[linear-gradient(90deg,#fff_0,#fff_33%,#fef3c7_33%,#fef3c7_34%,#fff_34%,#fff_66%,#ccfbf1_66%,#ccfbf1_67%,#fff_67%)]",
    kind: "layout",
  },
  {
    id: "kanban",
    label: "Kanban",
    description: "To do / doing / done",
    paperClass:
      "bg-[linear-gradient(90deg,#fff_0,#fff_33%,#fdba7422_33%,#fdba7422_34%,#fff_34%,#fff_66%,#5eead422_66%,#5eead422_67%,#fff_67%)]",
    kind: "layout",
  },
];

export function templatesByKind(kind: PageTemplateKind): PageTemplate[] {
  return PAGE_TEMPLATES.filter((template) => template.kind === kind);
}

export const NOTEBOOK_COVERS: NotebookCover[] = [
  {
    id: "classic_orange",
    label: "Classic orange",
    gradient: "from-orange-400 to-amber-500",
    accent: "#ea580c",
    category: "color",
  },
  {
    id: "teal_minimal",
    label: "Teal minimal",
    gradient: "from-teal-500 to-cyan-600",
    accent: "#0d9488",
    category: "color",
  },
  {
    id: "midnight",
    label: "Midnight",
    gradient: "from-stone-800 to-stone-950",
    accent: "#292524",
    category: "color",
  },
  {
    id: "botanical",
    label: "Botanical",
    gradient: "from-emerald-500 to-lime-600",
    accent: "#15803d",
    category: "color",
  },
  {
    id: "graph_paper",
    label: "Graph paper",
    gradient: "from-slate-200 to-slate-300",
    accent: "#64748b",
    category: "color",
  },
  {
    id: "lavender",
    label: "Lavender",
    gradient: "from-violet-400 to-purple-600",
    accent: "#7c3aed",
    category: "color",
  },
  {
    id: "rose",
    label: "Rose",
    gradient: "from-rose-400 to-pink-600",
    accent: "#e11d48",
    category: "color",
  },
  {
    id: "sunset",
    label: "Sunset",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    accent: "#f97316",
    category: "color",
  },
  {
    id: "ocean",
    label: "Ocean",
    gradient: "from-sky-400 to-blue-700",
    accent: "#2563eb",
    category: "color",
  },
  {
    id: "slate",
    label: "Slate",
    gradient: "from-zinc-400 to-zinc-600",
    accent: "#52525b",
    category: "color",
  },
  {
    id: "coral_reef",
    label: "Coral reef",
    gradient: "from-orange-300 via-rose-400 to-fuchsia-500",
    accent: "#fb7185",
    category: "color",
  },
  {
    id: "forest_fog",
    label: "Forest fog",
    gradient: "from-emerald-800 via-teal-700 to-stone-600",
    accent: "#065f46",
    category: "color",
  },
  {
    id: "desert_sand",
    label: "Desert sand",
    gradient: "from-amber-200 via-orange-300 to-stone-400",
    accent: "#d97706",
    category: "color",
  },
  {
    id: "ink_navy",
    label: "Ink navy",
    gradient: "from-blue-900 via-indigo-800 to-slate-900",
    accent: "#1e3a8a",
    category: "color",
  },
  {
    id: "cherry_blossom",
    label: "Cherry blossom",
    gradient: "from-pink-200 via-rose-300 to-fuchsia-400",
    accent: "#db2777",
    category: "color",
  },
  {
    id: "aurora",
    label: "Aurora",
    gradient: "from-indigo-500 via-emerald-400 to-cyan-400",
    accent: "#6366f1",
    category: "color",
  },
  {
    id: "art_constellation",
    label: "Constellation",
    gradient: "from-indigo-950 to-slate-900",
    accent: "#818cf8",
    category: "art",
    artBackground:
      "radial-gradient(circle at 20% 30%, #fff8 0 1px, transparent 2px), radial-gradient(circle at 70% 20%, #c7d2feaa 0 1.5px, transparent 3px), radial-gradient(circle at 40% 70%, #fff6 0 1px, transparent 2px), radial-gradient(circle at 85% 60%, #a5b4fc88 0 1px, transparent 2px), radial-gradient(circle at 15% 80%, #fff5 0 1px, transparent 2px), linear-gradient(135deg, #1e1b4b 0%, #0f172a 55%, #312e81 100%)",
  },
  {
    id: "art_marble",
    label: "Marble",
    gradient: "from-stone-100 to-stone-300",
    accent: "#a8a29e",
    category: "art",
    titleTone: "dark",
    artBackground:
      "radial-gradient(ellipse at 30% 20%, #ffffffcc 0%, transparent 40%), radial-gradient(ellipse at 80% 0%, #d6d3d1aa 0%, transparent 35%), radial-gradient(ellipse at 10% 80%, #a8a29e66 0%, transparent 45%), linear-gradient(120deg, #fafaf9 0%, #e7e5e4 40%, #d6d3d1 70%, #f5f5f4 100%)",
  },
  {
    id: "art_terrazzo",
    label: "Terrazzo",
    gradient: "from-orange-100 to-stone-200",
    accent: "#ea580c",
    category: "art",
    titleTone: "dark",
    artBackground:
      "radial-gradient(circle at 12% 30%, #fb923c 0 4px, transparent 5px), radial-gradient(circle at 40% 60%, #0d9488 0 3px, transparent 4px), radial-gradient(circle at 70% 25%, #a78bfa 0 5px, transparent 6px), radial-gradient(circle at 85% 70%, #f43f5e 0 3px, transparent 4px), radial-gradient(circle at 25% 80%, #38bdf8 0 4px, transparent 5px), linear-gradient(160deg, #fff7ed 0%, #f5f5f4 100%)",
  },
  {
    id: "art_topo",
    label: "Topographic",
    gradient: "from-teal-700 to-emerald-900",
    accent: "#0f766e",
    category: "art",
    artBackground:
      "repeating-radial-gradient(circle at 50% 50%, transparent 0 10px, #ccfbf155 10px 11px), repeating-radial-gradient(circle at 50% 50%, transparent 0 22px, #99f6e455 22px 23px), linear-gradient(160deg, #115e59 0%, #064e3b 100%)",
  },
  {
    id: "art_watercolor",
    label: "Watercolor",
    gradient: "from-sky-300 to-violet-400",
    accent: "#7c3aed",
    category: "art",
    titleTone: "dark",
    artBackground:
      "radial-gradient(circle at 20% 40%, #7dd3fc99 0%, transparent 45%), radial-gradient(circle at 75% 30%, #c4b5fd99 0%, transparent 40%), radial-gradient(circle at 55% 80%, #fda4af88 0%, transparent 45%), linear-gradient(135deg, #e0f2fe 0%, #ede9fe 50%, #fce7f3 100%)",
  },
  {
    id: "art_linen",
    label: "Linen craft",
    gradient: "from-amber-100 to-orange-200",
    accent: "#b45309",
    category: "art",
    titleTone: "dark",
    artBackground:
      "repeating-linear-gradient(0deg, transparent, transparent 2px, #d6d3d122 2px, #d6d3d122 3px), repeating-linear-gradient(90deg, transparent, transparent 2px, #a8a29e18 2px, #a8a29e18 3px), linear-gradient(135deg, #fffbeb 0%, #fed7aa 100%)",
  },
  {
    id: "art_stained_glass",
    label: "Stained glass",
    gradient: "from-indigo-600 to-rose-500",
    accent: "#4f46e5",
    category: "art",
    artBackground:
      "linear-gradient(60deg, #4f46e5cc 0 16%, transparent 16% 34%, #db2777cc 34% 50%, transparent 50% 66%, #0891b2cc 66% 82%, transparent 82%), linear-gradient(120deg, #f59e0bcc 0 20%, transparent 20% 40%, #10b981cc 40% 60%, transparent 60% 80%, #8b5cf6cc 80%), linear-gradient(180deg, #1e1b4bcc, #312e81)",
  },
  {
    id: "art_notebook_sketch",
    label: "Sketchbook",
    gradient: "from-stone-300 to-stone-500",
    accent: "#57534e",
    category: "art",
    titleTone: "dark",
    artBackground:
      "radial-gradient(ellipse at 10% 0%, #ffffff88 0%, transparent 40%), repeating-linear-gradient(95deg, transparent 0 18px, #78716c22 18px 19px), linear-gradient(180deg, #e7e5e4 0%, #a8a29e 100%)",
  },
];

export function getNotebookCover(coverId?: NotebookCoverId): NotebookCover {
  return NOTEBOOK_COVERS.find((cover) => cover.id === coverId) ?? NOTEBOOK_COVERS[0]!;
}

export function coversByCategory(category: "color" | "art"): NotebookCover[] {
  return NOTEBOOK_COVERS.filter((cover) => cover.category === category);
}

/** Served URL for an imported cover / background media asset. */
export function customCoverImageUrl(assetId?: string | null): string | null {
  const id = assetId?.trim();
  return id ? `/api/customization/templates/${id}` : null;
}

export function resolveNotebookCoverStyle(notebook?: {
  coverId?: NotebookCoverId;
  customCoverColor?: string | null;
  customCoverAssetId?: string | null;
}): {
  className?: string;
  style?: {
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundSize?: string;
    backgroundPosition?: string;
  };
  titleClassName: string;
} {
  // An imported cover image wins — the student picked their own artwork.
  const imported = customCoverImageUrl(notebook?.customCoverAssetId);
  if (imported) {
    return {
      style: {
        backgroundImage: `url(${imported})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      },
      titleClassName: "text-white drop-shadow-md",
    };
  }
  // Only solid custom colors override presets. null/undefined → use coverId art/gradient.
  if (notebook?.customCoverColor) {
    return {
      style: { backgroundColor: notebook.customCoverColor },
      titleClassName: "text-white drop-shadow-sm",
    };
  }
  const cover = getNotebookCover(notebook?.coverId);
  const titleClassName =
    cover.titleTone === "dark"
      ? "text-stone-800"
      : "text-white drop-shadow-sm";
  if (cover.artBackground) {
    return {
      style: {
        backgroundImage: cover.artBackground,
        backgroundSize: "cover",
      },
      titleClassName,
    };
  }
  return {
    className: `bg-gradient-to-r ${cover.gradient}`,
    titleClassName,
  };
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

/**
 * Curated cover + paper combos — marketplace-*adjacent* product type
 * (browse a pack, apply, write). Not a paid store; Study Haul–owned packs.
 */
export interface NotebookTemplatePack {
  id: string;
  label: string;
  description: string;
  coverId: NotebookCoverId;
  pageTemplateId: PageTemplateId;
  penPresetId?: PenPresetId;
}

export const NOTEBOOK_TEMPLATE_PACKS: NotebookTemplatePack[] = [
  {
    id: "clean_start",
    label: "Clean start",
    description: "Blank page · midnight cover",
    coverId: "midnight",
    pageTemplateId: "blank",
    penPresetId: "ballpoint",
  },
  {
    id: "lecture_lines",
    label: "Lecture lines",
    description: "Ruled paper · ocean cover",
    coverId: "ocean",
    pageTemplateId: "ruled",
    penPresetId: "ballpoint",
  },
  {
    id: "sketch_dots",
    label: "Sketch dots",
    description: "Dot grid · botanical cover",
    coverId: "botanical",
    pageTemplateId: "dot_grid",
    penPresetId: "pencil",
  },
  {
    id: "cornell_focus",
    label: "Cornell focus",
    description: "Cornell layout · teal cover",
    coverId: "teal_minimal",
    pageTemplateId: "cornell",
    penPresetId: "fountain",
  },
  {
    id: "exam_week",
    label: "Exam week",
    description: "Weekly planner · ink navy",
    coverId: "ink_navy",
    pageTemplateId: "planner_week",
    penPresetId: "ballpoint",
  },
  {
    id: "lab_graph",
    label: "Lab graph",
    description: "Graph paper · slate cover",
    coverId: "slate",
    pageTemplateId: "graph_grid",
    penPresetId: "ballpoint",
  },
  {
    id: "soft_notes",
    label: "Soft notes",
    description: "Blank · cherry blossom",
    coverId: "cherry_blossom",
    pageTemplateId: "blank",
    penPresetId: "fountain",
  },
  {
    id: "legal_pad",
    label: "Legal pad",
    description: "Yellow pad · desert sand",
    coverId: "desert_sand",
    pageTemplateId: "legal_pad",
    penPresetId: "ballpoint",
  },
];

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
