import type { CourseInfoItem, CourseInfoPortal } from "./types";

const MONTHS =
  "january|february|march|april|may|june|july|august|september|october|november|december";
const MONTH_ABBR = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";
const WEEKDAYS = "monday|tuesday|wednesday|thursday|friday|saturday|sunday";
const CLOCK = String.raw`\d{1,2}[.:]\d{2}\s*(?:a\.?m\.?|p\.?m\.?)`;

const DATE_PATTERNS = [
  /\b(\d{4})-(\d{2})-(\d{2})\b/,
  /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/,
  new RegExp(`\\b(${MONTHS}|${MONTH_ABBR})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, "i"),
  new RegExp(`\\b(${MONTHS}|${MONTH_ABBR})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "i"),
];

const SECTION_HEADER =
  /^(key semester dates|key course dates|important dates)\s*:?\s*$/i;

/** Join-Zoom buttons, module blurbs, and policy paragraphs are not date rows. */
export function isJunkDateTitle(title: string): boolean {
  const text = title.trim();
  if (!text) return true;
  if (/click here to join|join the zoom|join zoom meeting/i.test(text)) return true;
  if (/times below/i.test(text)) return true;
  if (/i will be available/i.test(text) && !new RegExp(CLOCK, "i").test(text)) return true;
  if (/^zoom$/i.test(text)) return true;
  if (/you are responsible/i.test(text)) return true;
  if (/in this module,?\s+you will/i.test(text)) return true;
  if (/failure to complete the academic/i.test(text)) return true;
  if (/being aware of and meeting all deadlines/i.test(text)) return true;
  if (/^important:\s*you\b/i.test(text)) return true;
  if (/you will (submit|take|complete|find|need)/i.test(text)) return true;
  return false;
}

const SEMESTER_DATE_PATTERN = new RegExp(
  String.raw`\b(classes start|aea|withdraw|drop with|holiday|labor day|last day of term|last date to drop|final grades?|grades due|no class|add\/drop)\b`,
  "i",
);

const COURSE_DATE_PATTERN = new RegExp(
  String.raw`\b(test\s*\d|final exam|midterm|final project|pre-course|post-course|check-ins?|discussion forum|assignment and quiz|weekly check|module assignment|module discussion|submission timeline)\b`,
  "i",
);

const KEY_SCHEDULE_PATTERN = new RegExp(
  String.raw`(?:${SEMESTER_DATE_PATTERN.source})|(?:${COURSE_DATE_PATTERN.source})|\b(timeline|each (${WEEKDAYS}))\b`,
  "i",
);

const SCHEDULE_KEYWORD_PATTERN = new RegExp(
  String.raw`\b(exam|midterm|final|test\s*\d|withdraw|holiday|break|no\s+class|deadline|due|closes?|quiz|project|check-in|forum)\b`,
  "i",
);

const DATED_SESSION_PATTERN =
  /\b(live\s+session|webinar|sync\s+session|proctored)\b/i;

function capWord(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function normalizeClockDots(text: string): string {
  return text.replace(
    /(\d{1,2})[.](\d{2})\s*(a\.?m\.?|p\.?m\.?)/gi,
    (_full, hours: string, minutes: string, meridiem: string) =>
      `${hours}:${minutes} ${meridiem.replace(/\./g, "").toUpperCase()}`,
  );
}

export function extractWhenLabel(line: string): string | undefined {
  const normalized = normalizeClockDots(line.replace(/\s+/g, " ").trim());

  const eachDay = normalized.match(new RegExp(`\\beach\\s+(${WEEKDAYS})\\b`, "i"));
  if (eachDay?.[1]) return `Each ${capWord(eachDay[1])}`;

  const windowMatch = normalized.match(
    new RegExp(
      `(?:${WEEKDAYS})?,?\\s*(?:${MONTHS}|${MONTH_ABBR})\\.?\\s+\\d{1,2}[\\s\\S]{0,60}?${CLOCK}\\s*[-–]\\s*[\\s\\S]{0,40}?${CLOCK}`,
      "i",
    ),
  );
  if (windowMatch) return windowMatch[0].replace(/\s+/g, " ").trim();

  const weekly = normalized.match(
    new RegExp(`\\b(${WEEKDAYS})\\s+${CLOCK}\\s*[-–]\\s*${CLOCK}`, "i"),
  );
  if (weekly) return weekly[0].replace(/\s+/g, " ").trim();

  return undefined;
}

export type ScheduleBucket = "semester" | "course";

export function isSemesterDateTitle(title: string): boolean {
  if (isJunkDateTitle(title)) return false;
  return SEMESTER_DATE_PATTERN.test(title);
}

export function isCourseDateTitle(title: string): boolean {
  if (isJunkDateTitle(title)) return false;
  if (isSemesterDateTitle(title)) return false;
  if (COURSE_DATE_PATTERN.test(title)) return true;
  return /\b(quiz|exam|assessment|project)\b/i.test(title) && !/\bfinal grades?\b/i.test(title);
}

export function classifyScheduleTitle(title: string): ScheduleBucket | null {
  if (isSemesterDateTitle(title)) return "semester";
  if (isCourseDateTitle(title)) return "course";
  return null;
}

export function isScheduleEventName(title: string): boolean {
  if (isJunkDateTitle(title)) return false;
  if (SECTION_HEADER.test(title.trim())) return false;
  if (KEY_SCHEDULE_PATTERN.test(title)) return true;
  if (SCHEDULE_KEYWORD_PATTERN.test(title)) return true;
  if (isDatedClassSession(title)) return true;
  return false;
}

export function isKeyScheduleLine(title: string): boolean {
  if (!isScheduleEventName(title)) return false;
  if (!hasScheduleTiming(title) && !isLabeledDateRow(title)) return false;
  if (KEY_SCHEDULE_PATTERN.test(title)) return true;
  if (SCHEDULE_KEYWORD_PATTERN.test(title) && hasScheduleTiming(title)) return true;
  if (extractWhenLabel(title)) return true;
  return false;
}

function isLabeledDateRow(title: string): boolean {
  const match = title.trim().match(/^([^:]{3,55}):\s+(\S[\s\S]+)$/);
  if (!match) return false;
  const label = match[1]!.trim();
  const rest = match[2]!.trim();
  if (/^(important|note|attention|reminder|overview)$/i.test(label)) return false;
  if (/^you\b/i.test(rest) || /^in this module/i.test(rest)) return false;
  return hasScheduleTiming(title) || Boolean(extractWhenLabel(rest) || findIsoDateInLine(rest, 2026));
}

export function hasScheduleTiming(title: string, year = 2026): boolean {
  return Boolean(extractWhenLabel(title) || findIsoDateInLine(title, year));
}

/** "Final Project Due Date: Tuesday, October 20" → "Final Project" */
export function shortEventTitle(line: string): string {
  const cleaned = line.replace(/^[\s•\-*\d.)]+/, "").replace(/\s+/g, " ").trim();
  const labeled = cleaned.match(/^([^:]{3,55}):\s+(.+)$/);
  if (labeled?.[1] && labeled[2]) {
    const label = labeled[1]
      .replace(/\s+(timeline|due date)$/i, "")
      .trim();
    const rest = labeled[2].trim();
    const afterDash = rest.split(/\s+[—–]\s+/).pop()?.trim() ?? "";
    if (
      afterDash &&
      afterDash.length <= 28 &&
      afterDash !== rest &&
      !hasScheduleTiming(afterDash) &&
      !/\d/.test(afterDash)
    ) {
      return `${label} (${afterDash})`.slice(0, 60);
    }
    return label.slice(0, 60);
  }
  const parts = cleaned.split(/\s+[—–]\s+/);
  const left = parts[0]?.trim() ?? cleaned;
  const right = parts.slice(1).join(" — ");
  if (parts.length >= 2 && left.length > 0 && left.length <= 70 && hasScheduleTiming(right)) {
    return left;
  }
  return cleaned.slice(0, 80);
}

function isDatedClassSession(title: string): boolean {
  if (isJunkDateTitle(title)) return false;
  if (DATED_SESSION_PATTERN.test(title)) return true;
  if (/\bzoom\b/i.test(title) && /\b(session|class|required|module)\b/i.test(title)) return true;
  if (/\boffice\s+hours\b/i.test(title) && (extractWhenLabel(title) || findIsoDateInLine(title, 2026))) {
    return true;
  }
  return false;
}

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

export function findIsoDateInLine(line: string, semesterYear: number): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = line.match(pattern);
    if (match) return parseIsoDate(match, semesterYear);
  }
  return null;
}

function splitDateLines(body: string): string[] {
  return body
    .split(/\n|•/)
    .map((line) => line.replace(/^[\s•\-*\d.)]+/, "").trim())
    .filter((line) => line.length >= 3);
}

function sectionBucketFromHeader(line: string): ScheduleBucket | "reset" | null {
  if (/^key semester dates\s*:?\s*$/i.test(line)) return "semester";
  if (/^key course dates\s*:?\s*$/i.test(line)) return "course";
  if (/^important dates\s*:?\s*$/i.test(line)) return "reset";
  return null;
}

export interface ExtractedScheduleItem extends CourseInfoItem {
  bucket: ScheduleBucket;
}

export function extractSyllabusDateItemsFromText(
  body: string,
  sourceLabel: string,
  year: number,
): ExtractedScheduleItem[] {
  const items: ExtractedScheduleItem[] = [];
  const seen = new Set<string>();
  let sectionBucket: ScheduleBucket | null = null;

  for (const rawLine of splitDateLines(body)) {
    const line = rawLine.trim();
    const header = sectionBucketFromHeader(line);
    if (header === "reset") {
      sectionBucket = null;
      continue;
    }
    if (header === "semester" || header === "course") {
      sectionBucket = header;
      continue;
    }
    if (isJunkDateTitle(line)) continue;

    const isSchedule =
      isKeyScheduleLine(line) ||
      isDatedClassSession(line) ||
      (/\bmodule\s+\d+\b/i.test(line) && /\b(zoom|live|session|meeting)\b/i.test(line));
    if (!isSchedule) continue;

    const date = findIsoDateInLine(line, year) ?? undefined;
    const when = extractWhenLabel(line);
    if (!date && !when) continue;
    const title = shortEventTitle(line);
    if (!title || title.length < 4) continue;

    const bucket = sectionBucket ?? classifyScheduleTitle(title) ?? classifyScheduleTitle(line);
    if (!bucket) continue;

    const key = `${bucket}|${title.toLowerCase()}|${date ?? ""}|${when ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({
      title,
      date,
      when,
      bucket,
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
  if (isJunkDateTitle(title)) return false;
  if (isDatedClassSession(title)) return true;
  if (isKeyScheduleLine(title)) return true;
  if (/\bmodule\s+\d+\b/i.test(title) && /\b(zoom|live|session|meeting)\b/i.test(title)) {
    return true;
  }
  return false;
}
