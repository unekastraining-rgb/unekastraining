import type { CourseInfoItem, CourseInfoPortal } from "./types";

const MONTHS =
  "january|february|march|april|may|june|july|august|september|october|november|december";
const MONTH_ABBR = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";

const DATE_PATTERNS = [
  /\b(\d{4})-(\d{2})-(\d{2})\b/,
  /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/,
  new RegExp(`\\b(${MONTHS}|${MONTH_ABBR})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, "i"),
  new RegExp(`\\b(${MONTHS}|${MONTH_ABBR})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "i"),
];

const IMPORTANT_EVENT_PATTERN =
  /\b(zoom|live\s+session|virtual\s+(?:class|meeting|session)|webinar|sync\s+session|office\s+hours|proctored)\b/i;

const SCHEDULE_KEYWORD_PATTERN =
  /\b(exam|midterm|final|withdraw|holiday|break|no\s+class|deadline|due|closes?)\b/i;

function inferYear(text: string, fallbackYear?: number): number {
  const match = text.match(/\b(20\d{2})\b/);
  if (match) return Number(match[1]);
  return fallbackYear ?? new Date().getFullYear();
}

function parseIsoDate(match: RegExpMatchArray, semesterYear: number): string | null {
  const full = match[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(full)) return full;

  if (match.length >= 4 && /^\d{1,2}\/\d{1,2}/.test(full)) {
    const month = Number(match[1]);
    const day = Number(match[2]);
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const monthToken = (match[1] ?? "").toLowerCase().slice(0, 3);
  const day = Number(match[2]);
  const year = match[3] ? Number(match[3]) : semesterYear;
  const monthMap: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };
  const month = monthMap[monthToken];
  if (!month || !Number.isFinite(day) || !year) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function findDateInLine(line: string, semesterYear: number): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = line.match(pattern);
    if (match) return parseIsoDate(match, semesterYear);
  }
  return null;
}

function cleanTitle(line: string): string {
  return line
    .replace(/^[\s•\-*\d.)]+/, "")
    .replace(DATE_PATTERNS[0], "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 160);
}

export function extractSyllabusDateItemsFromText(
  body: string,
  sourceLabel: string,
  year: number,
): CourseInfoItem[] {
  const items: CourseInfoItem[] = [];
  const seen = new Set<string>();

  for (const rawLine of body.split(/\n/)) {
    const line = rawLine.trim();
    if (line.length < 8) continue;

    const isImportantEvent = IMPORTANT_EVENT_PATTERN.test(line);
    const isScheduleLine = SCHEDULE_KEYWORD_PATTERN.test(line);
    const isModuleSession =
      /\bmodule\s+\d+\b/i.test(line) && /\b(zoom|live|session|meeting)\b/i.test(line);
    if (!isImportantEvent && !isScheduleLine && !isModuleSession) continue;

    const date = findDateInLine(line, year);
    const title = cleanTitle(line);
    if (!title || title.length < 4) continue;

    const key = `${title.toLowerCase()}|${date ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({
      title,
      date: date ?? undefined,
      body: isImportantEvent ? "From syllabus" : undefined,
      kind: "date",
      source: {
        type: "moodle_book",
        label: sourceLabel,
      },
    });
  }

  return items;
}

export function extractSyllabusDateItems(portal: CourseInfoPortal): CourseInfoItem[] {
  const year = inferYear(
    portal.sections.map((s) => s.items.map((i) => i.body).join("\n")).join("\n"),
    portal.course.startDate ? new Date(portal.course.startDate).getFullYear() : undefined,
  );

  const items: CourseInfoItem[] = [];
  const seen = new Set<string>();

  for (const section of portal.sections) {
    for (const item of section.items) {
      if (!item.body?.trim()) continue;
      const sourceLabel = item.source.label ?? section.title;
      const extracted = extractSyllabusDateItemsFromText(item.body, sourceLabel, year);
      for (const entry of extracted) {
        const key = `${entry.title}|${entry.date ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push(entry);
      }
    }
  }

  return items;
}

export function isImportantSyllabusEvent(title: string): boolean {
  if (IMPORTANT_EVENT_PATTERN.test(title)) return true;
  if (/\bmodule\s+\d+\b/i.test(title) && /\b(zoom|live|session|meeting)\b/i.test(title)) {
    return true;
  }
  return false;
}
