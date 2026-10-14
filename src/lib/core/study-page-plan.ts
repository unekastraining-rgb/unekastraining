import {
  bottomOfSections,
  originYForTypedNotes,
  sizeForFormatBlock,
} from "@/lib/core/block-layout";
import {
  filledSectionDataFromExtract,
  type ChapterStudyExtract,
} from "@/lib/core/chapter-study-extract";
import type { CoreFormatId } from "@/lib/core/format-catalog";
import { getFormatDefinition } from "@/lib/core/format-catalog";
import {
  chooseStudyFormats,
  STUDY_WIDE_FORMATS,
} from "@/lib/core/adaptive-study-choice";
import type { CompositeSection, FormatRecommendation } from "@/lib/core/note-types";
import {
  profileExtract,
  type StudyExtractProfile,
} from "@/lib/core/study-templates";

export { profileExtract };
export type { StudyDominant, StudyExtractProfile } from "@/lib/core/study-templates";

/** Canvas regions for a designed study page — not a linear dump of widgets. */
export type StudyRegion = "left" | "right" | "wide" | "bottom";

export interface PlannedBlock {
  formatId: CoreFormatId;
  region: StudyRegion;
  title: string;
  data: Record<string, unknown>;
}

export interface StudyPagePlan {
  label: string;
  blocks: PlannedBlock[];
}

export const STUDY_PAGE_LEFT = 36;
export const STUDY_PAGE_INNER = 1100;
export const STUDY_REGION_GAP = 36;
const PAGE_CONTENT_BUDGET = 1480;

const CHRONO_RE = /evolut|histor|timeline|era|decade|period/i;

function compact<T>(items: Array<T | null | undefined | false>): T[] {
  return items.filter((item): item is T => Boolean(item));
}

function isChronologicalName(name: string): boolean {
  return CHRONO_RE.test(name);
}

function layoutChosenFormats(
  extract: ChapterStudyExtract,
  formatIds: CoreFormatId[],
): StudyPagePlan[] {
  const columns: CoreFormatId[] = [];
  const wides: CoreFormatId[] = [];
  for (const id of formatIds) {
    if (STUDY_WIDE_FORMATS.has(id)) wides.push(id);
    else columns.push(id);
  }

  const page1 = compact([
    columns[0]
      ? planned(extract, columns[0], columns[1] ? "left" : wides[0] ? "left" : "wide")
      : null,
    columns[1] ? planned(extract, columns[1], "right") : null,
    wides[0] ? planned(extract, wides[0], "wide") : null,
  ]);

  const rest = [...columns.slice(2), ...wides.slice(1)];
  const page2 = rest.map((id, index) => {
    if (STUDY_WIDE_FORMATS.has(id) || rest.length === 1) {
      return planned(extract, id, "wide");
    }
    return planned(extract, id, index % 2 === 0 ? "left" : "right");
  });
  if (page2.length === 2 && page2[0] && page2[1] && page2[0].region === "left") {
    page2[1] = withRegion(page2[1], "right");
  }

  return compact([
    page1.length > 0 ? { label: "Study", blocks: page1 } : null,
    page2.length > 0 ? { label: continuationLabel(page2), blocks: page2 } : null,
  ]);
}

function processFormat(extract: ChapterStudyExtract, profile: StudyExtractProfile): CoreFormatId | null {
  if (profile.processCount === 0) return null;
  return profile.chronological ? "TIMELINE" : "PROCESS_FLOW";
}

function blockTitle(formatId: CoreFormatId, extract: ChapterStudyExtract): string {
  switch (formatId) {
    case "CONCEPT_DEFINITION":
      return "Key terms";
    case "TWO_COLUMN":
      return extract.comparisons[0]?.topic || getFormatDefinition(formatId).label;
    case "CHARTING":
      return extract.frameworks.length === 1
        ? extract.frameworks[0]!.name
        : "Frameworks";
    case "PROCESS_FLOW":
    case "FLOW":
      return extract.processesOrSteps[0]?.name || "Process";
    case "TIMELINE": {
      const named =
        extract.processesOrSteps.find((process) => isChronologicalName(process.name)) ??
        extract.processesOrSteps[0];
      return named?.name || "Timeline";
    }
    case "MIND_MAP":
      return extract.title || "Chapter map";
    case "OUTLINE":
      return "Learning objectives";
    case "CORNELL":
      return "Cornell notes";
    default:
      return getFormatDefinition(formatId).label;
  }
}

function withRegion(block: PlannedBlock, region: StudyRegion): PlannedBlock {
  return { ...block, region };
}

function planned(
  extract: ChapterStudyExtract,
  formatId: CoreFormatId,
  region: StudyRegion,
): PlannedBlock {
  return {
    formatId,
    region,
    title: blockTitle(formatId, extract),
    data: filledSectionDataFromExtract(formatId, extract),
  };
}

function continuationLabel(blocks: PlannedBlock[]): string {
  const ids = blocks.map((block) => block.formatId);
  if (ids.includes("CHARTING") && ids.includes("MIND_MAP")) return "Frameworks & map";
  if (ids.includes("CHARTING")) return "Frameworks";
  if (ids.includes("MIND_MAP")) return "Chapter map";
  if (ids.includes("TIMELINE")) return blocks[0]?.title || "Timeline";
  if (ids.includes("PROCESS_FLOW") || ids.includes("FLOW")) {
    return blocks[0]?.title || "Process";
  }
  return "Review";
}

function buildPages(extract: ChapterStudyExtract, profile: StudyExtractProfile): StudyPagePlan[] {
  const defs = profile.definitionCount > 0 ? planned(extract, "CONCEPT_DEFINITION", "left") : null;
  const comparison = profile.comparisonCount > 0 ? planned(extract, "TWO_COLUMN", "right") : null;
  const chart = profile.frameworkCount > 0 ? planned(extract, "CHARTING", "right") : null;
  const outline = profile.loCount > 0 ? planned(extract, "OUTLINE", "right") : null;
  const processId = processFormat(extract, profile);
  const process = processId ? planned(extract, processId, "wide") : null;
  const mind =
    profile.loCount >= 2 || profile.definitionCount >= 4
      ? planned(extract, "MIND_MAP", "right")
      : null;

  switch (profile.dominant) {
    case "definitions": {
      const blocks = compact([
        defs ? withRegion(defs, outline ? "left" : "wide") : null,
        outline,
      ]);
      return [{ label: "Study", blocks }];
    }
    case "comparison": {
      const hero = comparison ?? chart;
      const blocks = compact([
        defs,
        hero ? withRegion(hero, defs ? "right" : "wide") : null,
      ]);
      return [{ label: "Study", blocks }];
    }
    case "hierarchy": {
      return [
        {
          label: "Study",
          blocks: compact([
            outline ? withRegion(outline, "left") : null,
            mind ? withRegion(mind, outline ? "right" : "wide") : planned(extract, "MIND_MAP", "wide"),
          ]),
        },
      ];
    }
    case "process":
    case "timeline":
    case "mixed": {
      const right = comparison ?? (profile.comparisonCount === 0 ? chart : null) ?? outline;
      const page1 = compact([
        defs,
        right ? withRegion(right, defs ? "right" : "wide") : null,
        process,
      ]);

      const extras = compact([
        profile.comparisonCount > 0 && profile.frameworkCount > 0
          ? planned(extract, "CHARTING", "left")
          : null,
        mind ? withRegion(mind, "right") : null,
      ]);
      if (extras.length === 1) {
        extras[0] = withRegion(extras[0]!, "wide");
      }

      return compact([
        page1.length > 0 ? { label: "Study", blocks: page1 } : null,
        extras.length > 0 ? { label: continuationLabel(extras), blocks: extras } : null,
      ]);
    }
    default:
      return [{ label: "Study", blocks: compact([defs, comparison, process]) }];
  }
}

function splitOverflow(pages: StudyPagePlan[], firstOriginY: number): StudyPagePlan[] {
  const first = pages[0];
  if (!first || first.blocks.length <= 2) return pages;

  const placed = placePlannedBlocks(first.blocks, { originY: firstOriginY });
  const bottom = bottomOfSections(placed);
  if (bottom <= firstOriginY + PAGE_CONTENT_BUDGET) return pages;

  const keep = first.blocks.filter((block) => block.region === "left" || block.region === "right");
  const overflow = first.blocks.filter(
    (block) => block.region === "wide" || block.region === "bottom",
  );
  if (keep.length === 0 || overflow.length === 0) return pages;

  const overflowPage: StudyPagePlan = {
    label: continuationLabel(overflow),
    blocks:
      overflow.length === 1
        ? [withRegion(overflow[0]!, "wide")]
        : overflow,
  };
  return [{ ...first, blocks: keep }, overflowPage, ...pages.slice(1)];
}

/**
 * Adaptive chooses the formats; this assigns them to page regions.
 * Callers still render existing CompositeSections — no new notebook UI.
 */
export function planStudyPages(
  extract: ChapterStudyExtract,
  options?: {
    chosenFormats?: CoreFormatId[];
    adaptive?: Array<FormatRecommendation | CoreFormatId>;
  },
): StudyPagePlan[] {
  const chosen =
    options?.chosenFormats && options.chosenFormats.length > 0
      ? chooseStudyFormats(extract, options.chosenFormats)
      : chooseStudyFormats(extract, options?.adaptive);
  const fromAdaptive = layoutChosenFormats(extract, chosen).filter((page) => page.blocks.length > 0);
  const pages =
    fromAdaptive.length > 0
      ? fromAdaptive
      : buildPages(extract, profileExtract(extract)).filter((page) => page.blocks.length > 0);
  if (pages.length === 0) return [{ label: "Study", blocks: [] }];

  const overviewHeight = originYForTypedNotes(
    [`# ${extract.title}`, extract.chapterOverview, extract.learningObjectives[0]?.statement]
      .filter(Boolean)
      .join("\n"),
  );
  return splitOverflow(pages, overviewHeight);
}

export function placePlannedBlocks(
  blocks: PlannedBlock[],
  options?: { originY?: number; zStart?: number },
): CompositeSection[] {
  const originY = options?.originY ?? 48;
  let z = options?.zStart ?? 1;

  const left = blocks.filter((block) => block.region === "left");
  const right = blocks.filter((block) => block.region === "right");
  const wide = blocks.filter((block) => block.region === "wide");
  const bottom = blocks.filter((block) => block.region === "bottom");

  const paired = left.length > 0 && right.length > 0;
  const columnWidth = paired
    ? Math.floor((STUDY_PAGE_INNER - STUDY_REGION_GAP) / 2)
    : wide.length > 0
      ? 520
      : Math.min(720, STUDY_PAGE_INNER);

  const sections: CompositeSection[] = [];
  let yLeft = originY;
  let yRight = originY;

  for (const block of left) {
    const size = sizeForFormatBlock(block.formatId, block.data);
    const width = paired || wide.length > 0 ? columnWidth : Math.min(size.width, STUDY_PAGE_INNER);
    sections.push({
      id: `sec_${Math.random().toString(36).slice(2, 9)}`,
      formatId: block.formatId,
      title: block.title,
      data: block.data,
      x: STUDY_PAGE_LEFT,
      y: yLeft,
      width,
      height: size.height,
      zIndex: z++,
    });
    yLeft += size.height + STUDY_REGION_GAP;
  }

  for (const block of right) {
    const size = sizeForFormatBlock(block.formatId, block.data);
    const x = paired
      ? STUDY_PAGE_LEFT + columnWidth + STUDY_REGION_GAP
      : STUDY_PAGE_LEFT;
    sections.push({
      id: `sec_${Math.random().toString(36).slice(2, 9)}`,
      formatId: block.formatId,
      title: block.title,
      data: block.data,
      x,
      y: yRight,
      width: paired ? columnWidth : Math.min(size.width, STUDY_PAGE_INNER),
      height: size.height,
      zIndex: z++,
    });
    yRight += size.height + STUDY_REGION_GAP;
  }

  let y =
    left.length === 0 && right.length === 0 ? originY : Math.max(yLeft, yRight, originY);

  for (const block of [...wide, ...bottom]) {
    const size = sizeForFormatBlock(block.formatId, block.data);
    const height = Math.max(size.height, block.formatId === "MIND_MAP" ? 400 : 280);
    sections.push({
      id: `sec_${Math.random().toString(36).slice(2, 9)}`,
      formatId: block.formatId,
      title: block.title,
      data: block.data,
      x: STUDY_PAGE_LEFT,
      y,
      width: STUDY_PAGE_INNER,
      height,
      zIndex: z++,
    });
    y += height + STUDY_REGION_GAP;
  }

  return sections;
}

export function inferStudyRegion(section: CompositeSection): StudyRegion {
  if (STUDY_WIDE_FORMATS.has(section.formatId) || (section.width ?? 0) >= 800) {
    return "wide";
  }
  if ((section.x ?? 0) >= STUDY_PAGE_LEFT + 480) return "right";
  return "left";
}

/** Re-place existing sections into regions so mashed/overlapping blocks become a readable page. */
export function reflowSectionsToRegions(
  sections: CompositeSection[],
  originY: number,
  zStart = 1,
): CompositeSection[] {
  if (sections.length === 0) return sections;
  const blocks: PlannedBlock[] = sections.map((section) => ({
    formatId: section.formatId,
    region: inferStudyRegion(section),
    title: section.title,
    data: section.data ?? {},
  }));
  const placed = placePlannedBlocks(blocks, { originY, zStart });
  return placed.map((section, index) => ({
    ...section,
    id: sections[index]?.id ?? section.id,
    zIndex: sections[index]?.zIndex ?? section.zIndex,
  }));
}
