import {
  readableCourseName,
  readableMeetingTitle,
} from "@/lib/courses/display-name";

export { readableCourseName } from "@/lib/courses/display-name";

export const ACADEMIC_WEEKDAYS = [1, 2, 3, 4] as const;
export const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday"] as const;

/** Soft preference only — not a cutoff. Extra Mon–Thu time is allowed. */
export const PREFERRED_START_HOUR = 9;
export const PREFERRED_END_HOUR = 13;

/** Target academic load Mon–Thu (class meetings + study/homework). */
export const TARGET_WEEKLY_HOURS = 19;
export const DAY_EARLIEST_HOUR = 7;
export const DAY_LATEST_HOUR = 21;
export const STUDY_BLOCK_MINUTES = 60;
export const BREAK_MINUTES = 15;

export type WeeklyBlockKind = "class" | "lab" | "homework" | "study";

export interface WeeklyScheduleCourse {
  id: string;
  title: string;
  code: string | null;
  color: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface WeeklyScheduleMeeting {
  courseId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  title?: string | null;
  location?: string | null;
}

export interface WeeklyGridBlock {
  id: string;
  courseId: string;
  courseTitle: string;
  label: string;
  kind: WeeklyBlockKind;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  color: string;
}

export interface CoursePaceNote {
  courseId: string;
  title: string;
  pace: "accelerated" | "full";
  dateLabel: string;
}

export interface WeeklyCollegeGrid {
  days: typeof WEEKDAY_LABELS;
  startMinutes: number;
  endMinutes: number;
  blocks: WeeklyGridBlock[];
  paceNotes: CoursePaceNote[];
  termLabel: string;
  targetWeeklyMinutes: number;
  scheduledWeeklyMinutes: number;
}

function parseHHMM(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function formatClock(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours >= 12 ? "pm" : "am";
  const hour12 = ((hours + 11) % 12) + 1;
  if (minutes === 0) return `${hour12}:00 ${suffix}`;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatGridClock(totalMinutes: number): string {
  return formatClock(totalMinutes);
}

export function parsePortalDates(courseInfoJson: string | null | undefined): {
  startDate?: string;
  endDate?: string;
} {
  if (!courseInfoJson) return {};
  try {
    const parsed = JSON.parse(courseInfoJson) as {
      course?: { startDate?: string; endDate?: string };
    };
    return {
      startDate: parsed.course?.startDate,
      endDate: parsed.course?.endDate,
    };
  } catch {
    return {};
  }
}

export function inferCoursePace(
  startDate?: string | null,
  endDate?: string | null,
): "accelerated" | "full" {
  if (!startDate || !endDate) return "full";
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return "full";
  const days = (end - start) / (1000 * 60 * 60 * 24);
  return days <= 80 ? "accelerated" : "full";
}

function formatMonth(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "long" });
}

export function courseDateLabel(startDate?: string | null, endDate?: string | null): string {
  const from = formatMonth(startDate);
  const to = formatMonth(endDate);
  if (from && to && from !== to) return `${from} → ${to}`;
  if (from) return from;
  return "Term dates in syllabus";
}

function fallbackFamilyColor(index: number, courseColor: string | null): string {
  if (courseColor && courseColor.toLowerCase() !== "#ea580c") return courseColor;
  const families = [
    "color-mix(in srgb, var(--sh-accent) 72%, white)",
    "color-mix(in srgb, var(--sh-primary) 68%, white)",
    "color-mix(in srgb, var(--sh-warm) 70%, white)",
  ];
  return families[index % families.length]!;
}

function overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

function slotTaken(
  blocks: WeeklyGridBlock[],
  dayOfWeek: number,
  start: number,
  end: number,
): boolean {
  return blocks.some(
    (block) =>
      block.dayOfWeek === dayOfWeek &&
      overlaps(block.startMinutes, block.endMinutes, start, end),
  );
}

function classifyKind(title: string, location?: string | null): WeeklyBlockKind {
  const hay = `${title} ${location ?? ""}`.toLowerCase();
  if (/\blab\b/.test(hay)) return "lab";
  if (/\b(lecture|class|seminar|recitation)\b/.test(hay)) return "class";
  return "class";
}

function meetingDisplayLabel(
  course: WeeklyScheduleCourse,
  meetingTitle?: string | null,
  location?: string | null,
): string {
  const hay = `${meetingTitle ?? ""} ${location ?? ""}`;
  if (/\blab\b/i.test(hay)) {
    return readableMeetingTitle("lab", course);
  }
  return readableMeetingTitle(meetingTitle, course);
}

function standingLabel(course: WeeklyScheduleCourse, kind: WeeklyBlockKind): string {
  const name = readableCourseName(course);
  if (kind === "homework") return `${name} homework`;
  return `${name} study`;
}

function isProgrammingCourse(course: WeeklyScheduleCourse): boolean {
  return /\b(csci|comp|program|coding|object[- ]oriented|software|java|python)\b/i.test(
    `${course.code ?? ""} ${course.title}`,
  );
}

function courseWeight(course: WeeklyScheduleCourse): number {
  const accelerated = inferCoursePace(course.startDate, course.endDate) === "accelerated";
  if (accelerated && isProgrammingCourse(course)) return 1.45;
  if (accelerated) return 1.35;
  if (isProgrammingCourse(course)) return 1.15;
  return 1;
}

function totalMinutes(blocks: WeeklyGridBlock[]): number {
  return blocks.reduce((sum, block) => sum + (block.endMinutes - block.startMinutes), 0);
}

function lastBlockOnDay(
  blocks: WeeklyGridBlock[],
  dayOfWeek: number,
  start: number,
): WeeklyGridBlock | undefined {
  return blocks
    .filter(
      (block) =>
        block.dayOfWeek === dayOfWeek &&
        block.endMinutes <= start &&
        start - block.endMinutes <= BREAK_MINUTES,
    )
    .sort((a, b) => b.endMinutes - a.endMinutes)[0];
}

function candidateStarts(): number[] {
  const preferred: number[] = [];
  const later: number[] = [];
  const earlier: number[] = [];
  const preferredStart = PREFERRED_START_HOUR * 60;
  const preferredEnd = PREFERRED_END_HOUR * 60;
  const earliest = DAY_EARLIEST_HOUR * 60;
  const latest = DAY_LATEST_HOUR * 60;

  for (let t = preferredStart; t <= preferredEnd - STUDY_BLOCK_MINUTES; t += 30) {
    preferred.push(t);
  }
  for (let t = preferredEnd; t <= latest - STUDY_BLOCK_MINUTES; t += 30) {
    later.push(t);
  }
  for (let t = earliest; t < preferredStart; t += 30) {
    earlier.push(t);
  }
  return [...preferred, ...later, ...earlier];
}

function placeStudyBlock(
  blocks: WeeklyGridBlock[],
  course: WeeklyScheduleCourse,
  color: string,
  kind: WeeklyBlockKind,
  avoidBackToBackProgramming: boolean,
): boolean {
  const duration = STUDY_BLOCK_MINUTES;
  const starts = candidateStarts();
  const days = [...ACADEMIC_WEEKDAYS].sort((a, b) => {
    const loadA = totalMinutes(blocks.filter((block) => block.dayOfWeek === a));
    const loadB = totalMinutes(blocks.filter((block) => block.dayOfWeek === b));
    return loadA - loadB;
  });

  for (const day of days) {
    for (const start of starts) {
      const end = start + duration;
      if (end > DAY_LATEST_HOUR * 60) continue;
      if (slotTaken(blocks, day, start, end)) continue;
      const previous = lastBlockOnDay(blocks, day, start);
      if (
        avoidBackToBackProgramming &&
        previous &&
        previous.kind !== "class" &&
        isProgrammingCourse(course) &&
        isProgrammingCourse({
          id: previous.courseId,
          title: previous.courseTitle,
          code: previous.courseTitle,
          color: null,
        })
      ) {
        continue;
      }
      blocks.push({
        id: `stand-${course.id}-${day}-${start}`,
        courseId: course.id,
        courseTitle: readableCourseName(course),
        label: standingLabel(course, kind),
        kind,
        dayOfWeek: day,
        startMinutes: start,
        endMinutes: end,
        color,
      });
      return true;
    }
  }
  return false;
}

function allocateStudyMinutes(
  courses: WeeklyScheduleCourse[],
  remainingMinutes: number,
): Map<string, number> {
  const weights = courses.map((course) => ({
    id: course.id,
    weight: courseWeight(course),
  }));
  const weightSum = weights.reduce((sum, item) => sum + item.weight, 0) || 1;
  const allocated = new Map<string, number>();
  let leftover = remainingMinutes;
  for (const [index, item] of weights.entries()) {
    const raw = Math.round((remainingMinutes * item.weight) / weightSum);
    const rounded = Math.round(raw / STUDY_BLOCK_MINUTES) * STUDY_BLOCK_MINUTES;
    const minutes =
      index === weights.length - 1
        ? Math.max(0, Math.round(leftover / STUDY_BLOCK_MINUTES) * STUDY_BLOCK_MINUTES)
        : Math.min(leftover, rounded);
    allocated.set(item.id, minutes);
    leftover -= minutes;
  }
  return allocated;
}

/**
 * Repeating Mon–Thu college week. Class meetings keep their real times.
 * Remaining load fills toward ~19h/week, preferring 9am–1pm then other Mon–Thu hours.
 * Friday–Sunday are omitted.
 */
export function buildWeeklyCollegeGrid(input: {
  courses: WeeklyScheduleCourse[];
  meetings: WeeklyScheduleMeeting[];
}): WeeklyCollegeGrid {
  const targetWeeklyMinutes = TARGET_WEEKLY_HOURS * 60;
  const blocks: WeeklyGridBlock[] = [];
  const colorByCourse = new Map<string, string>();

  input.courses.forEach((course, index) => {
    colorByCourse.set(course.id, fallbackFamilyColor(index, course.color));
  });

  for (const meeting of input.meetings) {
    if (!ACADEMIC_WEEKDAYS.includes(meeting.dayOfWeek as (typeof ACADEMIC_WEEKDAYS)[number])) {
      continue;
    }
    const start = parseHHMM(meeting.startTime);
    const end = parseHHMM(meeting.endTime);
    if (start == null || end == null || end <= start) continue;
    const course = input.courses.find((item) => item.id === meeting.courseId);
    if (!course) continue;
    const label = meetingDisplayLabel(course, meeting.title, meeting.location);
    const readable = readableCourseName(course);
    blocks.push({
      id: `class-${meeting.courseId}-${meeting.dayOfWeek}-${start}`,
      courseId: course.id,
      courseTitle: readable,
      label,
      kind: classifyKind(`${meeting.title ?? ""} ${meeting.location ?? ""}`, meeting.location),
      dayOfWeek: meeting.dayOfWeek,
      startMinutes: start,
      endMinutes: end,
      color: colorByCourse.get(course.id) ?? "#93c5fd",
    });
  }

  const remaining = Math.max(0, targetWeeklyMinutes - totalMinutes(blocks));
  const studyMinutes = allocateStudyMinutes(input.courses, remaining);
  const orderedCourses = [...input.courses].sort((a, b) => courseWeight(b) - courseWeight(a));

  let homeworkToggle = 0;
  for (const course of orderedCourses) {
    let left = studyMinutes.get(course.id) ?? 0;
    while (left >= STUDY_BLOCK_MINUTES) {
      homeworkToggle += 1;
      const kind: WeeklyBlockKind = homeworkToggle % 2 === 0 ? "homework" : "study";
      const placed = placeStudyBlock(
        blocks,
        course,
        colorByCourse.get(course.id) ?? "#86efac",
        kind,
        isProgrammingCourse(course),
      );
      if (!placed) break;
      left -= STUDY_BLOCK_MINUTES;
    }
  }

  const timed = blocks.map((block) => block.startMinutes);
  const timedEnd = blocks.map((block) => block.endMinutes);
  const fallbackStart = PREFERRED_START_HOUR * 60;
  const fallbackEnd = PREFERRED_END_HOUR * 60;
  const startMinutes = timed.length > 0 ? Math.min(...timed) : fallbackStart;
  const endMinutes = timedEnd.length > 0 ? Math.max(...timedEnd) : fallbackEnd;

  const paceNotes: CoursePaceNote[] = input.courses.map((course) => ({
    courseId: course.id,
    title: readableCourseName(course),
    pace: inferCoursePace(course.startDate, course.endDate),
    dateLabel: courseDateLabel(course.startDate, course.endDate),
  }));

  const year =
    input.courses.map((course) => course.startDate?.slice(0, 4)).find(Boolean) ??
    String(new Date().getFullYear());

  return {
    days: WEEKDAY_LABELS,
    startMinutes: Math.floor(startMinutes / 60) * 60,
    endMinutes: Math.ceil(endMinutes / 60) * 60,
    blocks,
    paceNotes,
    termLabel: `August–December ${year}`,
    targetWeeklyMinutes,
    scheduledWeeklyMinutes: totalMinutes(blocks),
  };
}

export function attachPortalDates(course: {
  id: string;
  title: string;
  code: string | null;
  color: string | null;
  courseInfoJson?: string | null;
}): WeeklyScheduleCourse {
  const dates = parsePortalDates(course.courseInfoJson);
  return {
    id: course.id,
    title: course.title,
    code: course.code,
    color: course.color,
    startDate: dates.startDate ?? null,
    endDate: dates.endDate ?? null,
  };
}
