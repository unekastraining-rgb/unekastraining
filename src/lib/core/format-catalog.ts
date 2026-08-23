import type { NoteMethod } from "@/generated/prisma";

/** Adaptive format IDs — may differ from persisted NoteMethod (composites, presets). */
export type CoreFormatId =
  | "OUTLINE"
  | "HIERARCHY"
  | "CORNELL"
  | "CORNELL_MIND"
  | "TWO_COLUMN"
  | "BOXING"
  | "SENTENCE"
  | "CHARTING"
  | "COMPARISON_MATRIX"
  | "MIND_MAP"
  | "FLOW"
  | "PROCESS_FLOW"
  | "TIMELINE"
  | "PROGRESSIVE"
  | "PROBLEM_SOLUTION"
  | "CONCEPT_DEFINITION"
  | "QA"
  | "SKETCH"
  | "SKETCHNOTES"
  | "WHITEBOARD"
  | "BLANK"
  | "DOT_GRID"
  | "RULED";

export type FormatCategory =
  | "structured"
  | "visual"
  | "freeform"
  | "composite";

export interface CoreFormatDefinition {
  id: CoreFormatId;
  label: string;
  description: string;
  emoji: string;
  category: FormatCategory;
  /** Primary NoteMethod stored on the Note row */
  noteMethod: NoteMethod;
  /** Secondary formats often paired with this one */
  companions?: CoreFormatId[];
  guideSteps: string[];
  /** Keywords that suggest this format when found in source material */
  signalWords?: string[];
}

export const CORE_FORMAT_CATALOG: CoreFormatDefinition[] = [
  {
    id: "OUTLINE",
    label: "Outline",
    description: "Hierarchical headings and nested bullets",
    emoji: "📋",
    category: "structured",
    noteMethod: "OUTLINE",
    guideSteps: [
      "Start with the lecture or chapter title as your top heading.",
      "Add Roman numerals or numbers for major sections.",
      "Indent sub-points under each section — facts, names, dates.",
      "Leave space to add examples or connections later.",
    ],
    signalWords: ["chapter", "section", "lecture", "unit", "module"],
  },
  {
    id: "HIERARCHY",
    label: "Hierarchy",
    description: "Tree of concepts from general to specific",
    emoji: "🌳",
    category: "structured",
    noteMethod: "OUTLINE",
    companions: ["MIND_MAP"],
    guideSteps: [
      "Place the broadest concept at the top.",
      "Branch into categories, then sub-concepts.",
      "Use indentation or the mind map view for relationships.",
    ],
    signalWords: ["taxonomy", "classification", "categories", "types of"],
  },
  {
    id: "CORNELL",
    label: "Cornell",
    description: "Notes, cues, and summary columns",
    emoji: "📓",
    category: "structured",
    noteMethod: "CORNELL",
    guideSteps: [
      "Record main ideas in the large notes area during class.",
      "After class, write cue questions in the right column.",
      "Summarize the page in your own words at the bottom.",
      "Cover the notes and quiz yourself with the cues.",
    ],
    signalWords: ["lecture", "class", "discussion"],
  },
  {
    id: "CORNELL_MIND",
    label: "Cornell + Mind map",
    description: "Structured notes plus a concept map for relationships",
    emoji: "📓🧠",
    category: "composite",
    noteMethod: "CORNELL",
    companions: ["MIND_MAP"],
    guideSteps: [
      "Use Cornell for the lecture capture.",
      "Switch to Mind map to connect big ideas visually.",
      "Link terms from your cue column to map nodes.",
    ],
  },
  {
    id: "TWO_COLUMN",
    label: "Two column",
    description: "Side-by-side comparison or term / definition pairs",
    emoji: "📑",
    category: "structured",
    noteMethod: "CHARTING",
    guideSteps: [
      "Label the left column (terms, causes, pros…).",
      "Label the right column (definitions, effects, cons…).",
      "Fill row by row as you read or listen.",
    ],
    signalWords: ["compare", "versus", "vs", "difference", "pair"],
  },
  {
    id: "BOXING",
    label: "Boxing",
    description: "Ideas grouped in bordered boxes on the page",
    emoji: "▢",
    category: "visual",
    noteMethod: "WHITEBOARD",
    guideSteps: [
      "Draw a box for each main idea or topic cluster.",
      "Keep related bullets inside the same box.",
      "Use arrows between boxes for relationships.",
    ],
  },
  {
    id: "SENTENCE",
    label: "Sentence method",
    description: "One fact or idea per line — fast lecture capture",
    emoji: "📄",
    category: "structured",
    noteMethod: "RULED",
    guideSteps: [
      "Write each new fact on its own line.",
      "Skip heavy formatting — speed matters.",
      "Reorganize into outline or Cornell after class.",
    ],
    signalWords: ["lecture", "fast", "dictation"],
  },
  {
    id: "CHARTING",
    label: "Charting",
    description: "Tables for comparing topics side by side",
    emoji: "📊",
    category: "structured",
    noteMethod: "CHARTING",
    guideSteps: [
      "Pick column headers (theories, organisms, wars…).",
      "Add a row for each attribute you compare.",
      "Fill cells with concise facts.",
    ],
    signalWords: ["compare", "contrast", "table", "versus", "similarities"],
  },
  {
    id: "COMPARISON_MATRIX",
    label: "Comparison matrix",
    description: "Grid comparing multiple items across criteria",
    emoji: "⊞",
    category: "structured",
    noteMethod: "CHARTING",
    guideSteps: [
      "List items to compare as column headers.",
      "List comparison criteria as rows.",
      "Fill each cell — empty cells reveal gaps to study.",
    ],
    signalWords: ["compare", "matrix", "criteria", "evaluate"],
  },
  {
    id: "MIND_MAP",
    label: "Mind map",
    description: "Central idea with branching concepts",
    emoji: "🧠",
    category: "visual",
    noteMethod: "MIND_MAP",
    companions: ["CONCEPT_DEFINITION"],
    guideSteps: [
      "Put the central topic in the middle node.",
      "Add branches for major themes.",
      "Connect related ideas with links.",
      "Use color or position for categories.",
    ],
    signalWords: ["concept", "relationship", "network", "systems", "pathway"],
  },
  {
    id: "FLOW",
    label: "Flow diagram",
    description: "Steps and decisions in a process",
    emoji: "🔀",
    category: "visual",
    noteMethod: "FLOW",
    guideSteps: [
      "Start with the first step or input.",
      "Add nodes for each stage in order.",
      "Use arrows to show direction and branches.",
    ],
    signalWords: ["process", "step", "algorithm", "cycle", "pathway"],
  },
  {
    id: "PROCESS_FLOW",
    label: "Process / flow",
    description: "Sequential stages — biology, chemistry, workflows",
    emoji: "⚙️",
    category: "visual",
    noteMethod: "FLOW",
    guideSteps: [
      "Name each stage in the process.",
      "Note inputs and outputs between stages.",
      "Mark where feedback or loops occur.",
    ],
    signalWords: ["process", "mechanism", "reaction", "cycle", "phase"],
  },
  {
    id: "TIMELINE",
    label: "Timeline",
    description: "Events ordered chronologically",
    emoji: "📅",
    category: "structured",
    noteMethod: "OUTLINE",
    companions: ["OUTLINE"],
    guideSteps: [
      "List events with dates or eras on the left.",
      "Describe what happened and why it matters.",
      "Group eras with headings for cause/effect chains.",
    ],
    signalWords: ["history", "century", "war", "era", "revolution", "timeline", "date"],
  },
  {
    id: "PROGRESSIVE",
    label: "Progressive notes",
    description: "Build complexity step by step — ideal for code and math",
    emoji: "📈",
    category: "structured",
    noteMethod: "OUTLINE",
    companions: ["PROBLEM_SOLUTION"],
    guideSteps: [
      "Start with the simplest version of the idea.",
      "Add a step when you introduce a new concept or line of code.",
      "Show output or result after each step.",
      "End with a full worked example.",
    ],
    signalWords: ["code", "function", "algorithm", "example", "step", "proof", "derive"],
  },
  {
    id: "PROBLEM_SOLUTION",
    label: "Problem → solution",
    description: "Problem, approach, solution, and reflection",
    emoji: "🧩",
    category: "structured",
    noteMethod: "QA",
    companions: ["PROGRESSIVE"],
    guideSteps: [
      "State the problem clearly in your own words.",
      "Write your approach before the answer.",
      "Show the solution or code output.",
      "Note what you would do differently next time.",
    ],
    signalWords: ["problem", "debug", "error", "solve", "exercise", "homework"],
  },
  {
    id: "CONCEPT_DEFINITION",
    label: "Concept definition",
    description: "Term → definition → example → application",
    emoji: "💡",
    category: "structured",
    noteMethod: "QA",
    companions: ["MIND_MAP"],
    guideSteps: [
      "List each key term from the material.",
      "Write a definition in your own words.",
      "Add a concrete example.",
      "Explain how it applies in context.",
    ],
    signalWords: ["definition", "term", "vocabulary", "concept", "theory"],
  },
  {
    id: "QA",
    label: "Q&A",
    description: "Question and answer pairs for self-testing",
    emoji: "❓",
    category: "structured",
    noteMethod: "QA",
    guideSteps: [
      "Turn headings into questions.",
      "Write answers without peeking at notes.",
      "Export to flashcards when ready.",
    ],
  },
  {
    id: "SKETCH",
    label: "Sketch",
    description: "Draw diagrams and freehand notes",
    emoji: "✏️",
    category: "freeform",
    noteMethod: "SKETCH",
    guideSteps: [
      "Switch to Sketch tool for pen and highlighter.",
      "Label diagrams with short text.",
    ],
    signalWords: ["diagram", "draw", "label", "anatomy", "figure"],
  },
  {
    id: "SKETCHNOTES",
    label: "Sketchnotes",
    description: "Visual notes mixing text, icons, and drawings",
    emoji: "🎨",
    category: "freeform",
    noteMethod: "SKETCH",
    guideSteps: [
      "Use icons and arrows to connect ideas visually.",
      "Keep text large and sparse.",
      "Combine sketch layer with short typed labels.",
    ],
  },
  {
    id: "WHITEBOARD",
    label: "Whiteboard",
    description: "Infinite canvas — brainstorm and rearrange freely",
    emoji: "⬜",
    category: "freeform",
    noteMethod: "WHITEBOARD",
    guideSteps: [
      "Pan and zoom to add content anywhere.",
      "Cluster sticky ideas, then connect with arrows.",
      "Convert to structured notes when done brainstorming.",
    ],
    signalWords: ["brainstorm", "ideate", "standup", "swot", "kwl"],
  },
  {
    id: "BLANK",
    label: "Blank page",
    description: "Start from scratch — no structure imposed",
    emoji: "📄",
    category: "freeform",
    noteMethod: "BLANK",
    guideSteps: ["Type, sketch, or speak freely. Change format anytime."],
  },
  {
    id: "DOT_GRID",
    label: "Dot grid",
    description: "Dotted paper for handwriting and diagrams",
    emoji: "⊞",
    category: "freeform",
    noteMethod: "DOT_GRID",
    guideSteps: ["Use sketch mode for stylus or Apple Pencil input."],
  },
  {
    id: "RULED",
    label: "Ruled",
    description: "Lined notebook paper",
    emoji: "📝",
    category: "freeform",
    noteMethod: "RULED",
    guideSteps: ["Ideal for sentence method and fast lecture notes."],
  },
];

export const CORE_FORMAT_MAP = new Map(
  CORE_FORMAT_CATALOG.map((format) => [format.id, format]),
);

export function getFormatDefinition(id: CoreFormatId): CoreFormatDefinition {
  return CORE_FORMAT_MAP.get(id) ?? CORE_FORMAT_CATALOG.find((f) => f.id === "BLANK")!;
}

export function formatsByCategory(): Record<FormatCategory, CoreFormatDefinition[]> {
  const grouped: Record<FormatCategory, CoreFormatDefinition[]> = {
    structured: [],
    visual: [],
    freeform: [],
    composite: [],
  };
  for (const format of CORE_FORMAT_CATALOG) {
    grouped[format.category].push(format);
  }
  return grouped;
}
