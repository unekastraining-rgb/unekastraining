export type CalendarEventKind =
  | "class"
  | "assignment"
  | "test"
  | "quiz"
  | "project"
  | "study-session";

export type QuickViewMode = "today" | "week" | "due-soon";

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  title: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  courseId?: string;
  courseTitle?: string;
  courseColor?: string | null;
  status?: string;
  completed?: boolean;
  description?: string | null;
  source: "syllabus" | "manual" | "lms" | "recommended" | "google";
  priority?: "LOW" | "MEDIUM" | "HIGH";
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isTestKind(kind: string): boolean {
  return kind === "TEST" || kind === "QUIZ";
}
