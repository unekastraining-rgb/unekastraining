import { parseMeetingScheduleFromText } from "@/lib/lms/meetings";

import type { SyllabusAssignment, SyllabusExtraction, SyllabusMeeting } from "./types";

const MONTHS =
  "january|february|march|april|may|june|july|august|september|october|november|december";
const MONTH_ABBR = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";

const DATE_PATTERNS = [
  /\b(\d{4})-(\d{2})-(\d{2})\b/,
  /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/,
  new RegExp(`\\b(${MONTHS}|${MONTH_ABBR})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, "i"),
  new RegExp(`\\b(${MONTHS}|${MONTH_ABBR})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "i"),
];

const ASSIGNMENT_KEYWORDS =
  /\b(exam|midterm|final|quiz|homework|hw|assignment|project|paper|essay|lab|presentation|discussion|reading|report|portfolio|deadline|due)\b/i;

function courseNameFromFileName(fileName?: string): string | null {
  if (!fileName?.trim()) return null;
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\bsyllabus\b/gi, "")
    .trim();
  return base || null;
}

function parseIsoDate(match: RegExpMatchArray, semesterYear?: number | null): string | null {
  const full = match[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(full)) {
    return full;
  }

  if (match.length >= 4 && /^\d{1,2}\/\d{1,2}/.test(full)) {
    const month = Number(match[1]);
    const day = Number(match[2]);
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) {
      return null;
    }
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const monthToken = (match[1] ?? "").toLowerCase().slice(0, 3);
  const day = Number(match[2]);
  let year = match[3] ? Number(match[3]) : semesterYear;
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

function findDateInLine(line: string, semesterYear?: number | null): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      return parseIsoDate(match, semesterYear);
    }
  }
  return null;
}

function inferSemesterYear(text: string): number | null {
  const match = text.match(/\b(20\d{2})\b/);
  return match ? Number(match[1]) : null;
}

function extractCourseName(lines: string[], fileName?: string): string {
  const labeled = lines.find((line) =>
    /^(course(\s+title|\s+name)?|class(\s+name)?)\s*[:\-]/i.test(line),
  );
  if (labeled) {
    const value = labeled.split(/[:\-]/).slice(1).join("-").trim();
    if (value) return value.slice(0, 120);
  }

  const candidate = lines.find(
    (line) =>
      line.length >= 4 &&
      line.length <= 80 &&
      !ASSIGNMENT_KEYWORDS.test(line) &&
      !/^(office hours|email|phone|department|university|college)\b/i.test(line),
  );
  if (candidate) return candidate;

  return courseNameFromFileName(fileName) ?? "New course";
}

function extractCourseCode(text: string): string | null {
  const labeled = text.match(/\b(?:course\s*code|catalog\s*(?:no|number)?)\s*[:\-]\s*([A-Z]{2,6}[\s-]?\d{3}[A-Z]?)/i);
  if (labeled?.[1]) return labeled[1].replace(/\s+/, " ").trim();

  const inline = text.match(/\b([A-Z]{2,5}[\s-]?\d{3}[A-Z]?)\b/);
  return inline?.[1]?.replace(/\s+/, " ").trim() ?? null;
}

function extractInstructor(text: string): string | null {
  const match = text.match(
    /(?:instructor|professor|faculty|teacher)\s*[:\-]\s*([^\n\r|]+)/i,
  );
  return match?.[1]?.trim().slice(0, 120) ?? null;
}

function extractSemester(text: string): string | null {
  const match = text.match(
    /\b((?:spring|summer|fall|winter|autumn)\s+20\d{2}|20\d{2}\s+(?:spring|summer|fall|winter|autumn)|(?:spring|summer|fall|winter|autumn)\s+semester\s+20\d{2})\b/i,
  );
  return match?.[1] ?? null;
}

function cleanAssignmentTitle(raw: string): string {
  return raw
    .replace(DATE_PATTERNS[0], "")
    .replace(DATE_PATTERNS[1], "")
    .replace(/\b(due|deadline)\s*[:\-]?\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\d.)\-\s]+/, "")
    .trim()
    .slice(0, 160);
}

function extractAssignments(text: string, semesterYear: number | null): SyllabusAssignment[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const assignments: SyllabusAssignment[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    const dueDate = findDateInLine(line, semesterYear);
    const hasKeyword = ASSIGNMENT_KEYWORDS.test(line);
    const dueLabel = /\b(due|deadline)\b/i.test(line);

    if (!dueDate && !hasKeyword && !dueLabel) continue;

    let title = cleanAssignmentTitle(line);
    if ((!title || title.length < 3) && index > 0) {
      title = cleanAssignmentTitle(lines[index - 1]!);
    }
    if (!title || title.length < 3) {
      title = dueDate ? `Assignment due ${dueDate}` : "Assignment";
    }

    const key = `${title.toLowerCase()}|${dueDate ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);

    assignments.push({
      title,
      dueDate,
      description: null,
    });
  }

  return assignments;
}

function meetingsFromText(text: string): SyllabusMeeting[] {
  return parseMeetingScheduleFromText(text).map((meeting) => ({
    dayOfWeek: meeting.dayOfWeek,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    location: meeting.location ?? null,
    title: meeting.title ?? "Class",
  }));
}

export function parseSyllabusHeuristic(
  text: string,
  fileName?: string,
): SyllabusExtraction {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const semesterYear = inferSemesterYear(normalized);

  return {
    courseName: extractCourseName(lines, fileName),
    courseCode: extractCourseCode(normalized),
    instructor: extractInstructor(normalized),
    semester: extractSemester(normalized),
    assignments: extractAssignments(normalized, semesterYear),
    meetings: meetingsFromText(normalized),
  };
}

export function mergeSyllabusExtractions(
  base: SyllabusExtraction,
  enhanced: SyllabusExtraction,
): SyllabusExtraction {
  const assignmentMap = new Map<string, SyllabusAssignment>();
  for (const assignment of base.assignments) {
    assignmentMap.set(`${assignment.title}|${assignment.dueDate ?? ""}`, assignment);
  }
  for (const assignment of enhanced.assignments) {
    assignmentMap.set(`${assignment.title}|${assignment.dueDate ?? ""}`, assignment);
  }

  const meetingMap = new Map<string, SyllabusMeeting>();
  for (const meeting of [...(base.meetings ?? []), ...(enhanced.meetings ?? [])]) {
    meetingMap.set(
      `${meeting.dayOfWeek}|${meeting.startTime}|${meeting.endTime}`,
      meeting,
    );
  }

  return {
    courseName: enhanced.courseName?.trim() || base.courseName,
    courseCode: enhanced.courseCode ?? base.courseCode ?? null,
    instructor: enhanced.instructor ?? base.instructor,
    semester: enhanced.semester ?? base.semester,
    assignments: Array.from(assignmentMap.values()),
    meetings: Array.from(meetingMap.values()),
  };
}
