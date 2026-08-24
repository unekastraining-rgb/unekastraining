import type { CourseInfoPortal } from "./types";

export interface WeeklyHaulBlock {
  id: string;
  label: string;
  weekStart?: string;
  weekEnd?: string;
  moduleNumber?: number;
  objectives: string[];
}

const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const OBJECTIVE_VERB =
  /^(listen|read|review|complete|participate|watch|submit|take|attend|discuss|write|study|explore|view|download|finish)/i;

const BOILERPLATE_OBJECTIVE =
  /^(welcome to\b|this course\b|in this (course|module)\b|we will\b|you will learn\b|course description\b|about this course\b)/i;

const SCHEDULE_TITLE_PATTERN =
  /\b(course schedule|weekly schedule|week\s+of|monday\s+\d|module\s+\d+[:\s-]+\w*\s*\d|objectives?\s+to\s+complete)\b/i;

const WEEK_HEADER_PATTERNS: Array<{
  regex: RegExp;
  parse: (match: RegExpMatchArray, year: number) => Partial<WeeklyHaulBlock> & { label: string };
}> = [
  {
    regex:
      /^(?:#{1,3}\s*)?(?:module\s+(\d+)[:\s-]+)?(?:monday|mon)[,\s]+(?:(\w+)\s+)?(\d{1,2})\s*[-–—]\s*(?:(?:sunday|sun)[,\s]+(?:(\w+)\s+)?)?(\d{1,2})/i,
    parse: (match, year) => {
      const moduleNumber = match[1] ? Number(match[1]) : undefined;
      const monthToken = (match[2] ?? match[4] ?? "").toLowerCase();
      const startDay = Number(match[3]);
      const endDay = Number(match[5] ?? match[3]);
      const month = MONTHS[monthToken.slice(0, 4)] ?? MONTHS[monthToken];
      const range = month ? formatDayRange(year, month, startDay, endDay) : undefined;
      return {
        label: match[0].replace(/^#{1,3}\s*/, "").trim(),
        moduleNumber,
        weekStart: range?.start,
        weekEnd: range?.end,
      };
    },
  },
  {
    regex:
      /^(?:#{1,3}\s*)?(?:week\s+(?:of\s+)?)?(\w+)\s+(\d{1,2})\s*[-–—]\s*(\d{1,2})/i,
    parse: (match, year) => {
      const month = MONTHS[match[1]!.toLowerCase().slice(0, 4)] ?? MONTHS[match[1]!.toLowerCase()];
      const startDay = Number(match[2]);
      const endDay = Number(match[3]);
      const range = month ? formatDayRange(year, month, startDay, endDay) : undefined;
      return {
        label: `${match[1]} ${startDay}–${endDay}`,
        weekStart: range?.start,
        weekEnd: range?.end,
      };
    },
  },
  {
    regex: /^(?:#{1,3}\s*)?module\s+(\d+)\s*[:\-]\s*(\w+\s+\d{1,2}\s*[-–—]\s*\d{1,2}.+)$/i,
    parse: (match) => ({
      label: `Module ${match[1]}: ${match[2]!.trim()}`,
      moduleNumber: Number(match[1]),
    }),
  },
  {
    regex: /^(?:#{1,3}\s*)?week\s+(\d+)\b[:\s-]+(.+)$/i,
    parse: (match) => ({
      label: `Week ${match[1]}: ${match[2]!.trim()}`,
    }),
  },
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDayRange(
  year: number,
  month: number,
  startDay: number,
  endDay: number,
): { start: string; end: string } | undefined {
  if (!month || !startDay || !endDay) return undefined;
  const start = `${year}-${pad(month)}-${pad(startDay)}`;
  if (endDay < startDay) {
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    return { start, end: `${endYear}-${pad(endMonth)}-${pad(endDay)}` };
  }
  return { start, end: `${year}-${pad(month)}-${pad(endDay)}` };
}

function inferYear(text: string, termStart?: string): number {
  if (termStart) {
    const parsed = new Date(termStart);
    if (!Number.isNaN(parsed.getTime())) return parsed.getFullYear();
  }
  const match = text.match(/\b(20\d{2})\b/);
  return match ? Number(match[1]) : new Date().getFullYear();
}

function cleanObjectiveLine(line: string): string {
  return line
    .replace(/^[\s•\-*]+/, "")
    .replace(/^\d+[.)]\s*/, "")
    .trim();
}

function isObjectiveLine(line: string): boolean {
  const cleaned = cleanObjectiveLine(line);
  if (cleaned.length < 10 || cleaned.length > 240) return false;
  if (/^objectives?\b/i.test(cleaned)) return false;
  if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(cleaned)) {
    return false;
  }
  if (BOILERPLATE_OBJECTIVE.test(cleaned)) return false;
  return OBJECTIVE_VERB.test(cleaned);
}

function parseWeekHeader(line: string, year: number): (Partial<WeeklyHaulBlock> & { label: string }) | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  for (const pattern of WEEK_HEADER_PATTERNS) {
    const match = trimmed.match(pattern.regex);
    if (match) return pattern.parse(match, year);
  }
  return null;
}

export function parseWeeklyScheduleFromText(
  text: string,
  options?: { termStart?: string; termEnd?: string },
): WeeklyHaulBlock[] {
  if (!text?.trim()) return [];

  const year = inferYear(text, options?.termStart);
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: WeeklyHaulBlock[] = [];
  let current: WeeklyHaulBlock | null = null;
  let collectingObjectives = false;

  function flush() {
    if (current && current.objectives.length > 0) {
      blocks.push(current);
    }
    current = null;
    collectingObjectives = false;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const weekHeader = parseWeekHeader(line, year);
    if (weekHeader) {
      flush();
      current = {
        id: `week-${blocks.length + 1}`,
        label: weekHeader.label,
        weekStart: weekHeader.weekStart,
        weekEnd: weekHeader.weekEnd,
        moduleNumber: weekHeader.moduleNumber,
        objectives: [],
      };
      continue;
    }

    if (/objectives?\s+(to\s+)?complete/i.test(line)) {
      if (current) collectingObjectives = true;
      continue;
    }

    if (!current) continue;

    if (isObjectiveLine(line)) {
      const objective = cleanObjectiveLine(line);
      if (!current.objectives.some((item) => item.toLowerCase() === objective.toLowerCase())) {
        current.objectives.push(objective);
      }
      collectingObjectives = true;
      continue;
    }

    if (collectingObjectives && line.length < 120 && !parseWeekHeader(line, year)) {
      const objective = cleanObjectiveLine(line);
      if (objective.length >= 10 && isObjectiveLine(objective)) {
        current.objectives.push(objective);
      }
    }
  }

  flush();
  return blocks;
}

function dateInRange(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}

export function pickCurrentWeekHaul(
  blocks: WeeklyHaulBlock[],
  options?: { today?: Date; termStart?: string; termEnd?: string },
): WeeklyHaulBlock | null {
  if (blocks.length === 0) return null;

  const today = options?.today ?? new Date();
  const todayIso = today.toISOString().slice(0, 10);

  for (const block of blocks) {
    if (block.weekStart && block.weekEnd && dateInRange(todayIso, block.weekStart, block.weekEnd)) {
      return block;
    }
  }

  if (options?.termStart) {
    const termStart = new Date(options.termStart);
    if (!Number.isNaN(termStart.getTime())) {
      const msPerWeek = 7 * 86_400_000;
      const weekIndex = Math.floor((today.getTime() - termStart.getTime()) / msPerWeek);
      const datedBlocks = blocks.filter((b) => b.weekStart && b.weekEnd);
      if (weekIndex >= 0 && weekIndex < datedBlocks.length) {
        return datedBlocks[weekIndex] ?? null;
      }
      const moduleBlocks = blocks.filter((b) => b.moduleNumber != null && b.objectives.length > 0);
      if (moduleBlocks.length > 0 && weekIndex >= 0) {
        const idx = Math.min(weekIndex, moduleBlocks.length - 1);
        return moduleBlocks[idx] ?? null;
      }
    }
  }

  return null;
}

export function collectScheduleText(portal: CourseInfoPortal): string {
  const chunks: string[] = [];

  for (const section of portal.sections) {
    for (const item of section.items) {
      const title = item.title ?? "";
      const body = item.body ?? "";
      const combined = `${title}\n${body}`.trim();
      if (!combined) continue;

      const titleLooksLikeSchedule = SCHEDULE_TITLE_PATTERN.test(title);
      const bodyLooksLikeSchedule = SCHEDULE_TITLE_PATTERN.test(body.slice(0, 500));

      if (section.id === "important-dates" && bodyLooksLikeSchedule) {
        chunks.push(combined);
        continue;
      }

      if (titleLooksLikeSchedule || (bodyLooksLikeSchedule && /objectives?\s+to\s+complete/i.test(body))) {
        chunks.push(combined);
      }
    }
  }

  return chunks.join("\n\n---\n\n");
}

export function buildWeeklyHaulFromPortal(
  portal: CourseInfoPortal | null,
): WeeklyHaulBlock | null {
  if (!portal) return null;
  const text = collectScheduleText(portal);
  if (!text.trim()) return null;
  const blocks = parseWeeklyScheduleFromText(text, {
    termStart: portal.course.startDate,
    termEnd: portal.course.endDate,
  });
  const haul = pickCurrentWeekHaul(blocks, {
    termStart: portal.course.startDate,
    termEnd: portal.course.endDate,
  });
  if (!haul || haul.objectives.length === 0) return null;
  if (haul.label === "Course objectives") return null;
  return haul;
}
