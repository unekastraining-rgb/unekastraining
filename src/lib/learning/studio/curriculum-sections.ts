/**
 * Bundle G — Curriculum sections for the Learning Studio journey.
 * Presentation grouping of existing path titles — not a mastery model.
 */

import type { CurriculumSection } from "@/lib/learning/studio/types";
import { curriculumStatusForIndex } from "@/lib/learning/studio/curriculum-position";

const SECTION_HINTS: Array<{ title: string; match: RegExp }> = [
  {
    title: "Foundations",
    match:
      /\b(customer|need|value|foundation|intro|understand|overview|basic|definition|concept)\b/i,
  },
  {
    title: "Strategy",
    match:
      /\b(segment|target|position|strategy|plan|market research|competitive)\b/i,
  },
  {
    title: "Mechanics",
    match:
      /\b(mix|product|price|place|promotion|method|syntax|query|equation|process|structure|inherit|class|supply|demand)\b/i,
  },
  {
    title: "Application",
    match:
      /\b(apply|application|challenge|transfer|integrat|project|practice|measure|result)\b/i,
  },
];

function sectionTitleFor(itemTitle: string, index: number, total: number): string {
  for (const hint of SECTION_HINTS) {
    if (hint.match.test(itemTitle)) return hint.title;
  }
  if (index === 0) return "Foundations";
  if (index >= total - 1) return "Application";
  if (index < total / 3) return "Foundations";
  if (index < (2 * total) / 3) return "Building blocks";
  return "Application";
}

/**
 * Group path concept titles into instructional sections for the curriculum rail.
 */
export function buildCurriculumSections(input: {
  pathTitle?: string;
  conceptTitles: string[];
  currentIndex: number;
}): CurriculumSection[] {
  const titles = input.conceptTitles.filter(Boolean);
  if (titles.length === 0) return [];

  const assigned = titles.map((title, pathIndex) => ({
    id: `path-${pathIndex}`,
    title,
    pathIndex,
    status: curriculumStatusForIndex(pathIndex, input.currentIndex),
    section: sectionTitleFor(title, pathIndex, titles.length),
  }));

  const order: string[] = [];
  const map = new Map<string, CurriculumSection>();
  for (const item of assigned) {
    if (!map.has(item.section)) {
      order.push(item.section);
      map.set(item.section, {
        id: `section-${item.section.toLowerCase().replace(/\s+/g, "-")}`,
        title: item.section,
        items: [],
      });
    }
    map.get(item.section)!.items.push({
      id: item.id,
      title: item.title,
      status: item.status,
      pathIndex: item.pathIndex,
    });
  }

  return order.map((k) => map.get(k)!);
}
