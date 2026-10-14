/**
 * Moodle cold start: turn course sections/modules into study-ready outline text
 * (parity with Canvas module → topic seeding).
 */

import {
  buildCanvasColdStartSyllabusText,
  formatCanvasModuleOutline,
} from "@/lib/lms/canvas-cold-start";
import type { MoodleCourseContentSection } from "@/lib/lms/moodle-api";
import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";

const ADMIN_SECTION =
  /^(welcome|getting started|start here|announcements|general|ask your instructor|news and announcements|meet the|office hours|test\b|exam\b|midterm|final)\b/i;

function decodeMoodleLabel(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function isLearningSectionName(name: string): boolean {
  if (/^module\s*\d+/i.test(name)) return true;
  if (/^week\s*\d+/i.test(name)) return true;
  if (/^unit\s*\d+/i.test(name)) return true;
  if (/^chapter\s*\d+/i.test(name)) return true;
  return false;
}

/**
 * Prefer Module/Week/Unit section titles; fall back to other non-admin sections.
 * Skips Welcome / Getting Started / empty shells so Study doesn’t seed noise.
 */
export function formatMoodleModuleOutline(
  sections: MoodleCourseContentSection[],
): string {
  const learning: string[] = [];
  const other: string[] = [];

  for (const section of sections) {
    const name = decodeMoodleLabel(section.name ?? "");
    if (!name || name.length < 2) continue;
    if (isMetaSyllabusTopic(name)) continue;
    if (ADMIN_SECTION.test(name) && !isLearningSectionName(name)) continue;

    const hasContent = (section.modules?.length ?? 0) > 0;
    if (isLearningSectionName(name)) {
      learning.push(name);
      continue;
    }
    // Keep non-empty substantive sections (e.g. “Inheritance and Polymorphism”)
    if (hasContent || name.length >= 8) {
      other.push(name);
    }
  }

  const chosen = learning.length >= 1 ? learning : other;
  return formatCanvasModuleOutline(chosen.map((name) => ({ name })));
}

export function buildMoodleColdStartSyllabusText(input: {
  courseName: string;
  syllabusText?: string | null;
  modulesOutline?: string | null;
}): { text: string; seeded: boolean; usedModules: boolean } {
  const syllabus = input.syllabusText?.trim() ?? "";
  const outline = input.modulesOutline?.trim() ?? "";

  // Always keep Moodle module sections in the seed text so Study topics come from
  // real weekly modules — even when a long syllabus/policy book was found.
  if (outline) {
    const text = syllabus
      ? `${syllabus}\n\n${outline}`
      : `Course: ${input.courseName}\n${outline}`;
    const trimmed = text.trim();
    return {
      text: trimmed,
      seeded: trimmed.length >= 40,
      usedModules: true,
    };
  }

  return buildCanvasColdStartSyllabusText({
    courseName: input.courseName,
    syllabusHtml: syllabus,
    modulesOutline: outline,
  });
}
