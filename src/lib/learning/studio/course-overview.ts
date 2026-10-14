/**
 * Bundle J — Course overview from existing path + KL curriculum mappings.
 * Presentation helper — not a second curriculum database.
 */

import { findInstructionalConceptById } from "@/lib/learning/knowledge/instructional-library";
import { buildCurriculumSections } from "@/lib/learning/studio/curriculum-sections";
import type { CurriculumSection } from "@/lib/learning/studio/types";
import {
  curriculumPositionLabel,
  curriculumStatusForIndex,
} from "@/lib/learning/studio/curriculum-position";
import { PATH_POSITION_DISCLAIMER } from "@/lib/learning/unified-experience/copy";

export type CourseOverviewItem = {
  conceptId?: string;
  title: string;
  pathIndex: number;
  positionLabel: string;
  unitLabel?: string;
  curriculumLabel?: string;
};

export type CourseOverview = {
  pathTitle: string;
  currentIndex: number;
  sections: CurriculumSection[];
  items: CourseOverviewItem[];
  /** Honest disclaimer — position ≠ mastery. */
  positionDisclaimer: string;
  mappedCount: number;
  totalCount: number;
};

/**
 * Build a course/path overview for the Learning Studio curriculum surface.
 */
export function buildCourseOverviewFromPath(input: {
  pathTitle?: string;
  conceptTitles: string[];
  conceptIds?: Array<string | null | undefined>;
  currentIndex: number;
}): CourseOverview {
  const titles = input.conceptTitles.filter(Boolean);
  const sections = buildCurriculumSections({
    pathTitle: input.pathTitle,
    conceptTitles: titles,
    currentIndex: input.currentIndex,
  });

  let mappedCount = 0;
  const items: CourseOverviewItem[] = titles.map((title, pathIndex) => {
    const conceptId = input.conceptIds?.[pathIndex] ?? undefined;
    const hit = conceptId
      ? findInstructionalConceptById(conceptId)
      : null;
    const mapping = hit?.concept.curriculumMappings?.[0];
    if (mapping) mappedCount += 1;
    const position = curriculumStatusForIndex(pathIndex, input.currentIndex);
    return {
      conceptId: hit?.concept.id,
      title,
      pathIndex,
      positionLabel: curriculumPositionLabel(position),
      unitLabel: mapping?.unit,
      curriculumLabel: mapping?.label,
    };
  });

  return {
    pathTitle: input.pathTitle?.trim() || "Learning path",
    currentIndex: input.currentIndex,
    sections,
    items,
    positionDisclaimer: PATH_POSITION_DISCLAIMER,
    mappedCount,
    totalCount: titles.length,
  };
}
