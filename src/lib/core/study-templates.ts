import { CANVAS_ELEMENT_BASE_Z } from "@/lib/core/canvas-layer";
import {
  filledSectionDataFromExtract,
  type ChapterStudyExtract,
} from "@/lib/core/chapter-study-extract";
import type { CoreFormatId } from "@/lib/core/format-catalog";
import type { CompositeSection, FormatRecommendation, NoteDocument } from "@/lib/core/note-types";
import {
  applyPageData,
  extractPageData,
  getNotebookPages,
  syncCurrentPage,
  type PageData,
} from "@/lib/core/notebook-pages";

export type StudyTemplateId =
  | "cornell-key-terms"
  | "two-column-compare"
  | "charting-frameworks"
  | "process-flow"
  | "timeline"
  | "mind-map"
  | "outline"
  | "hybrid-study";

export type StudyTemplateMatch =
  | "definition-heavy"
  | "comparison-heavy"
  | "process"
  | "chronological"
  | "relationships"
  | "hybrid";

export type StudyDominant =
  | "definitions"
  | "comparison"
  | "process"
  | "timeline"
  | "hierarchy"
  | "mixed";

export interface StudyExtractProfile {
  definitionCount: number;
  comparisonCount: number;
  frameworkCount: number;
  processCount: number;
  processSteps: number;
  chronological: boolean;
  loCount: number;
  mustKnowCount: number;
  dominant: StudyDominant;
}

export interface StudySlotFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type StudySlotFill = "title" | "notes" | "cues" | "summary" | "extract";

export interface StudyTemplateSlot {
  id: string;
  title: string;
  formatId: CoreFormatId;
  fill: StudySlotFill;
  frame: StudySlotFrame;
  resolve?: "sequence";
}

export interface StudyTemplate {
  id: StudyTemplateId;
  label: string;
  match: StudyTemplateMatch;
  /** Named content areas this workspace fills from the extract. */
  fillFormats: CoreFormatId[];
  /** Add timeline vs process from the extract (hybrid / sequence workspaces). */
  includeSequence?: boolean;
}

export interface StudyTemplateSelection {
  primary: StudyTemplateId;
  page2?: StudyTemplateId;
}

export const STUDY_CHRONO_RE = /evolut|histor|timeline|era|decade|period/i;

const PAGE_LEFT = 36;
const PAGE_INNER = 1100;
const SLOT_GAP = 16;
const TOPIC: StudySlotFrame = { x: PAGE_LEFT, y: 28, width: PAGE_INNER, height: 88 };
const BELOW_TOPIC = TOPIC.y + TOPIC.height + SLOT_GAP;
const COL_WIDTH = (PAGE_INNER - SLOT_GAP) / 2;

export const STUDY_TEMPLATES: StudyTemplate[] = [
  {
    id: "cornell-key-terms",
    label: "Cornell notes",
    match: "definition-heavy",
    fillFormats: ["CORNELL", "CONCEPT_DEFINITION"],
  },
  {
    id: "two-column-compare",
    label: "Comparison",
    match: "comparison-heavy",
    fillFormats: ["TWO_COLUMN", "CORNELL"],
  },
  {
    id: "charting-frameworks",
    label: "Frameworks",
    match: "comparison-heavy",
    fillFormats: ["CHARTING"],
  },
  {
    id: "process-flow",
    label: "Process",
    match: "process",
    fillFormats: ["PROCESS_FLOW"],
  },
  {
    id: "timeline",
    label: "Timeline",
    match: "chronological",
    fillFormats: ["TIMELINE"],
  },
  {
    id: "mind-map",
    label: "Mind map",
    match: "relationships",
    fillFormats: ["MIND_MAP"],
  },
  {
    id: "outline",
    label: "Outline",
    match: "relationships",
    fillFormats: ["OUTLINE"],
  },
  {
    id: "hybrid-study",
    label: "Study workspace",
    match: "hybrid",
    fillFormats: ["CORNELL", "CONCEPT_DEFINITION", "TWO_COLUMN"],
    includeSequence: true,
  },
];

const STUDY_TEMPLATE_MAP = new Map(STUDY_TEMPLATES.map((template) => [template.id, template]));

const FORMAT_TO_TEMPLATE: Partial<Record<CoreFormatId, StudyTemplateId>> = {
  CORNELL: "cornell-key-terms",
  CORNELL_MIND: "cornell-key-terms",
  TWO_COLUMN: "two-column-compare",
  BOXING: "two-column-compare",
  CHARTING: "charting-frameworks",
  COMPARISON_MATRIX: "charting-frameworks",
  FLOW: "process-flow",
  PROCESS_FLOW: "process-flow",
  TIMELINE: "timeline",
  MIND_MAP: "mind-map",
  OUTLINE: "outline",
  HIERARCHY: "outline",
};

function compact<T>(items: Array<T | null | undefined | false>): T[] {
  return items.filter((item): item is T => Boolean(item));
}

function isChronologicalName(name: string): boolean {
  return STUDY_CHRONO_RE.test(name);
}

export function isStudyTemplateId(id: string | undefined | null): id is StudyTemplateId {
  return Boolean(id && STUDY_TEMPLATE_MAP.has(id as StudyTemplateId));
}

export function profileExtract(extract: ChapterStudyExtract): StudyExtractProfile {
  const definitionCount = extract.definitions.length;
  const comparisonCount = extract.comparisons.length;
  const frameworkCount = extract.frameworks.length;
  const processCount = extract.processesOrSteps.length;
  const processSteps = extract.processesOrSteps.reduce(
    (sum, process) => sum + process.steps.length,
    0,
  );
  const chronological = extract.processesOrSteps.some((process) =>
    isChronologicalName(process.name),
  );
  const loCount = extract.learningObjectives.length;
  const mustKnowCount = extract.mustKnow.length;

  const visualBuckets = compact([
    definitionCount > 0 ? "definitions" : null,
    comparisonCount > 0 ? "comparison" : null,
    frameworkCount > 0 ? "frameworks" : null,
    processCount > 0 ? "process" : null,
  ]);

  let dominant: StudyDominant;
  if (visualBuckets.length >= 2) {
    dominant = "mixed";
  } else if (processCount > 0) {
    dominant = chronological ? "timeline" : "process";
  } else if (comparisonCount > 0 || (frameworkCount > 0 && definitionCount === 0)) {
    dominant = "comparison";
  } else if (definitionCount > 0) {
    dominant = "definitions";
  } else if (loCount > 0) {
    dominant = "hierarchy";
  } else {
    dominant = "definitions";
  }

  return {
    definitionCount,
    comparisonCount,
    frameworkCount,
    processCount,
    processSteps,
    chronological,
    loCount,
    mustKnowCount,
    dominant,
  };
}

export function getStudyTemplate(id: StudyTemplateId): StudyTemplate {
  return STUDY_TEMPLATE_MAP.get(id) ?? STUDY_TEMPLATES[0]!;
}

export function sequenceFormatForExtract(extract: ChapterStudyExtract): CoreFormatId {
  const chronological = extract.processesOrSteps.some((process) =>
    isChronologicalName(process.name),
  );
  return chronological ? "TIMELINE" : "PROCESS_FLOW";
}

function topicSlot(id = "topic"): StudyTemplateSlot {
  return { id, title: "Topic", formatId: "SENTENCE", fill: "title", frame: TOPIC };
}

function textSlot(
  id: string,
  title: string,
  fill: Exclude<StudySlotFill, "extract" | "title">,
  frame: StudySlotFrame,
): StudyTemplateSlot {
  return { id, title, formatId: "SENTENCE", fill, frame };
}

/** Pre-designed labeled areas for this workspace — geometry first, then content. */
export function slotsForStudyTemplate(
  template: StudyTemplate,
  extract: ChapterStudyExtract,
): StudyTemplateSlot[] {
  const sequence = sequenceFormatForExtract(extract);
  const notesW = 760;
  const cuesW = PAGE_INNER - notesW - SLOT_GAP;
  const notesH = 500;
  const colH = 440;

  switch (template.id) {
    case "cornell-key-terms":
      return [
        topicSlot(),
        textSlot("notes", "Notes", "notes", {
          x: PAGE_LEFT,
          y: BELOW_TOPIC,
          width: notesW,
          height: notesH,
        }),
        textSlot("cues", "Cues / questions", "cues", {
          x: PAGE_LEFT + notesW + SLOT_GAP,
          y: BELOW_TOPIC,
          width: cuesW,
          height: notesH,
        }),
        textSlot("summary", "Summary", "summary", {
          x: PAGE_LEFT,
          y: BELOW_TOPIC + notesH + SLOT_GAP,
          width: PAGE_INNER,
          height: 150,
        }),
        {
          id: "terms",
          title: "Key terms",
          formatId: "CONCEPT_DEFINITION",
          fill: "extract",
          frame: {
            x: PAGE_LEFT,
            y: BELOW_TOPIC + notesH + SLOT_GAP + 150 + SLOT_GAP,
            width: PAGE_INNER,
            height: 320,
          },
        },
      ];
    case "two-column-compare":
      return [
        topicSlot(),
        {
          id: "compare",
          title: "Compare",
          formatId: "TWO_COLUMN",
          fill: "extract",
          frame: { x: PAGE_LEFT, y: BELOW_TOPIC, width: PAGE_INNER, height: 420 },
        },
        textSlot("conclusions", "Conclusions", "summary", {
          x: PAGE_LEFT,
          y: BELOW_TOPIC + 420 + SLOT_GAP,
          width: PAGE_INNER,
          height: 160,
        }),
      ];
    case "hybrid-study":
      return [
        topicSlot(),
        {
          id: "terms",
          title: "Key terms",
          formatId: "CONCEPT_DEFINITION",
          fill: "extract",
          frame: { x: PAGE_LEFT, y: BELOW_TOPIC, width: COL_WIDTH, height: colH },
        },
        {
          id: "compare",
          title: "Compare",
          formatId: "TWO_COLUMN",
          fill: "extract",
          frame: {
            x: PAGE_LEFT + COL_WIDTH + SLOT_GAP,
            y: BELOW_TOPIC,
            width: COL_WIDTH,
            height: colH,
          },
        },
        {
          id: "sequence",
          title: sequence === "TIMELINE" ? "Timeline" : "Process",
          formatId: sequence,
          fill: "extract",
          frame: {
            x: PAGE_LEFT,
            y: BELOW_TOPIC + colH + SLOT_GAP,
            width: PAGE_INNER,
            height: 400,
          },
          resolve: "sequence",
        },
      ];
    case "charting-frameworks":
      return [
        topicSlot(),
        {
          id: "frameworks",
          title: "Frameworks",
          formatId: "CHARTING",
          fill: "extract",
          frame: { x: PAGE_LEFT, y: BELOW_TOPIC, width: PAGE_INNER, height: 480 },
        },
      ];
    case "timeline":
      return [
        topicSlot(),
        {
          id: "timeline",
          title: "Timeline",
          formatId: "TIMELINE",
          fill: "extract",
          frame: { x: PAGE_LEFT, y: BELOW_TOPIC, width: PAGE_INNER, height: 480 },
        },
      ];
    case "process-flow":
      return [
        topicSlot(),
        {
          id: "process",
          title: "Process",
          formatId: "PROCESS_FLOW",
          fill: "extract",
          frame: { x: PAGE_LEFT, y: BELOW_TOPIC, width: PAGE_INNER, height: 480 },
        },
      ];
    case "mind-map":
      return [
        topicSlot(),
        {
          id: "map",
          title: "Mind map",
          formatId: "MIND_MAP",
          fill: "extract",
          frame: { x: PAGE_LEFT, y: BELOW_TOPIC, width: PAGE_INNER, height: 520 },
        },
      ];
    default:
      return [
        topicSlot(),
        {
          id: "outline",
          title: "Outline",
          formatId: "OUTLINE",
          fill: "extract",
          frame: { x: PAGE_LEFT, y: BELOW_TOPIC, width: PAGE_INNER, height: 480 },
        },
      ];
  }
}

function typedPayload(text: string): Record<string, unknown> {
  return { typed: text, typedHtml: undefined };
}

function dataForSlot(slot: StudyTemplateSlot, extract: ChapterStudyExtract): Record<string, unknown> {
  const formatId = slot.resolve === "sequence" ? sequenceFormatForExtract(extract) : slot.formatId;
  if (slot.fill === "extract") {
    return filledSectionDataFromExtract(formatId, extract);
  }
  const cornell = filledSectionDataFromExtract("CORNELL", extract).cornell as {
    notes?: string;
    cues?: string;
    summary?: string;
  };
  if (slot.fill === "title") return typedPayload(extract.title);
  if (slot.fill === "notes") return typedPayload(cornell.notes ?? "");
  if (slot.fill === "cues") return typedPayload(cornell.cues ?? "");
  return typedPayload(cornell.summary ?? extract.chapterOverview);
}

function sectionsFromTemplate(
  template: StudyTemplate,
  extract: ChapterStudyExtract,
): CompositeSection[] {
  return slotsForStudyTemplate(template, extract).map((slot, index) => {
    const formatId = slot.resolve === "sequence" ? sequenceFormatForExtract(extract) : slot.formatId;
    return {
      id: `sec_${slot.id}`,
      formatId,
      title: slot.title,
      data: dataForSlot(slot, extract),
      x: slot.frame.x,
      y: slot.frame.y,
      width: slot.frame.width,
      height: slot.frame.height,
      zIndex: CANVAS_ELEMENT_BASE_Z + index,
    } satisfies CompositeSection;
  });
}

function slotHasContent(formatId: CoreFormatId, extract: ChapterStudyExtract): boolean {
  switch (formatId) {
    case "CONCEPT_DEFINITION":
      return extract.definitions.length > 0;
    case "TWO_COLUMN":
    case "BOXING":
      return extract.comparisons.length > 0;
    case "CHARTING":
    case "COMPARISON_MATRIX":
      return extract.frameworks.length > 0;
    case "PROCESS_FLOW":
    case "FLOW":
    case "TIMELINE":
    case "PROGRESSIVE":
      return extract.processesOrSteps.length > 0;
    case "MIND_MAP":
      return extract.learningObjectives.length > 0 || extract.definitions.length > 0;
    case "OUTLINE":
    case "HIERARCHY":
      return extract.learningObjectives.length > 0;
    case "CORNELL":
    case "CORNELL_MIND":
      return true;
    case "QA":
      return false;
    default:
      return true;
  }
}

function asFormatIds(
  adaptive?: Array<FormatRecommendation | CoreFormatId>,
): CoreFormatId[] {
  if (!adaptive || adaptive.length === 0) return [];
  const ids: CoreFormatId[] = [];
  for (const item of adaptive) {
    const id = typeof item === "string" ? item : item.formatId;
    if (!id || id === "QA" || ids.includes(id)) continue;
    ids.push(id);
  }
  return ids;
}

function templateSupported(id: StudyTemplateId, extract: ChapterStudyExtract): boolean {
  const profile = profileExtract(extract);
  switch (id) {
    case "process-flow":
      return profile.processCount > 0 && !profile.chronological;
    case "timeline":
      return profile.processCount > 0 && profile.chronological;
    case "two-column-compare":
      return profile.comparisonCount > 0;
    case "charting-frameworks":
      return profile.frameworkCount > 0;
    case "mind-map":
      return profile.loCount > 0 || profile.definitionCount > 0;
    case "outline":
      return profile.loCount > 0;
    case "cornell-key-terms":
    case "hybrid-study":
      return true;
    default:
      return true;
  }
}

/**
 * Adaptive / extract shape selects one study *workspace* (labeled content areas),
 * not paper and not a packed list of format widgets. Extra techniques become extra pages.
 */
export function selectStudyTemplate(
  extract: ChapterStudyExtract,
  adaptive?: Array<FormatRecommendation | CoreFormatId>,
): StudyTemplateSelection {
  const profile = profileExtract(extract);
  const mixedSignals = [
    profile.definitionCount > 0,
    profile.comparisonCount > 0,
    profile.processCount > 0,
  ].filter(Boolean).length;

  if (mixedSignals >= 2) {
    return { primary: "hybrid-study" };
  }

  const adaptiveIds = asFormatIds(adaptive);
  for (const formatId of adaptiveIds) {
    const mapped = FORMAT_TO_TEMPLATE[formatId];
    if (!mapped || mapped === "hybrid-study" || !templateSupported(mapped, extract)) continue;
    if (mapped === "mind-map" && profile.definitionCount > 0) continue;
    if (mapped === "charting-frameworks" && profile.definitionCount > 0) continue;
    if (mapped === "cornell-key-terms") break;
    return {
      primary: mapped,
      page2:
        mapped !== "two-column-compare" && profile.comparisonCount > 0
          ? "two-column-compare"
          : mapped !== "charting-frameworks" && profile.frameworkCount > 0
            ? "charting-frameworks"
            : undefined,
    };
  }

  if (profile.processCount > 0 && profile.definitionCount === 0 && profile.comparisonCount === 0) {
    return { primary: profile.chronological ? "timeline" : "process-flow" };
  }
  if (profile.comparisonCount > 0 && profile.definitionCount === 0) {
    return {
      primary: "two-column-compare",
      page2: profile.frameworkCount > 0 ? "charting-frameworks" : undefined,
    };
  }
  if (profile.frameworkCount >= 2 && profile.definitionCount === 0) {
    return { primary: "charting-frameworks" };
  }
  if (
    profile.definitionCount === 0 &&
    profile.comparisonCount === 0 &&
    profile.processCount === 0 &&
    profile.loCount >= 3
  ) {
    return { primary: "mind-map" };
  }
  return { primary: "cornell-key-terms" };
}

export function formatsForStudyTemplate(
  template: StudyTemplate,
  extract: ChapterStudyExtract,
): CoreFormatId[] {
  const formats = [...template.fillFormats];
  if (template.includeSequence) {
    formats.push(sequenceFormatForExtract(extract));
  }
  return formats.filter((formatId) => formatId !== "QA" && slotHasContent(formatId, extract));
}

function mergeFilledIntoPage(
  page: PageData,
  formatId: CoreFormatId,
  extract: ChapterStudyExtract,
): PageData {
  const filled = filledSectionDataFromExtract(formatId, extract);
  return {
    ...page,
    cornell: (filled.cornell as PageData["cornell"]) ?? page.cornell,
    outlineNodes: (filled.outlineNodes as PageData["outlineNodes"]) ?? page.outlineNodes,
    mindMap: (filled.mindMap as PageData["mindMap"]) ?? page.mindMap,
    flow: (filled.flow as PageData["flow"]) ?? page.flow,
    charting: (filled.charting as PageData["charting"]) ?? page.charting,
    progressive: (filled.progressive as PageData["progressive"]) ?? page.progressive,
    concepts: (filled.concepts as PageData["concepts"]) ?? page.concepts,
    timeline: (filled.timeline as PageData["timeline"]) ?? page.timeline,
    problemSolution: (filled.problemSolution as PageData["problemSolution"]) ?? page.problemSolution,
    twoColumn: (filled.twoColumn as PageData["twoColumn"]) ?? page.twoColumn,
  };
}

function fillWorkspacePage(
  page: PageData,
  template: StudyTemplate,
  extract: ChapterStudyExtract,
): PageData {
  const formats = formatsForStudyTemplate(template, extract);
  let next: PageData = {
    ...page,
    typed: extract.title,
    typedHtml: undefined,
    activeFormat: "BLANK",
    compositeSections: sectionsFromTemplate(template, extract),
    studyTemplateId: template.id,
  };
  for (const formatId of formats) {
    next = mergeFilledIntoPage(next, formatId, extract);
  }
  return next;
}

/**
 * Apply a study workspace: labeled content areas first, then fill them from the extract.
 * Does not stamp paper / page style. Q&A is never placed on the canvas.
 */
export function applyStudyTemplate(
  doc: NoteDocument,
  template: StudyTemplate,
  extract: ChapterStudyExtract,
  _options?: { applyPaper?: boolean },
): NoteDocument {
  void _options;
  const synced = syncCurrentPage(doc);
  const nextPage = fillWorkspacePage(extractPageData(synced), template, extract);
  const next = applyPageData(synced, nextPage);
  return {
    ...next,
    metadata: {
      ...next.metadata,
      studyTemplateId: template.id,
      activeFormat: "BLANK",
      chapterStudyExtract: extract,
      appliedFormats: [
        ...new Set([
          ...(next.metadata?.appliedFormats ?? []),
          ...formatsForStudyTemplate(template, extract),
        ]),
      ],
    },
  };
}

/**
 * Fill one notebook page with a study workspace for a leftover technique.
 */
export function applyFormatAsStudyPage(
  doc: NoteDocument,
  formatId: CoreFormatId,
  extract: ChapterStudyExtract,
  options?: { applyPaper?: boolean },
): NoteDocument {
  if (formatId === "QA") return doc;
  const templateId = FORMAT_TO_TEMPLATE[formatId];
  if (templateId) {
    return applyStudyTemplate(doc, getStudyTemplate(templateId), extract, options);
  }

  const synced = syncCurrentPage(doc);
  const nextPage = mergeFilledIntoPage(
    {
      ...extractPageData(synced),
      typed: extract.title,
      typedHtml: undefined,
      activeFormat: "BLANK",
      compositeSections: undefined,
    },
    formatId,
    extract,
  );
  const next = applyPageData(synced, nextPage);
  return {
    ...next,
    metadata: {
      ...next.metadata,
      activeFormat: "BLANK",
      chapterStudyExtract: extract,
      appliedFormats: [...new Set([...(next.metadata?.appliedFormats ?? []), formatId])],
    },
  };
}

export function displayFormatFromStudyDoc(doc: NoteDocument): CoreFormatId {
  if (isStudyTemplateId(doc.metadata?.studyTemplateId)) return "BLANK";
  if ((doc.metadata?.compositeSections?.length ?? 0) > 0) return "BLANK";
  return doc.metadata?.activeFormat ?? "BLANK";
}

/** True if this notebook already has a Smart Study workspace on any page. */
export function hasLockedStudyTemplateLayout(doc: NoteDocument): boolean {
  if (isStudyTemplateId(doc.metadata?.studyTemplateId)) return true;
  return getNotebookPages(doc).pages.some((page) =>
    isStudyTemplateId((page.data as unknown as PageData | undefined)?.studyTemplateId),
  );
}
