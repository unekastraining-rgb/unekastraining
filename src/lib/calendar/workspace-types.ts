export type CalendarItemSource = "event" | "assignment" | "meeting";

export type CalendarViewMode = "month" | "week" | "day" | "agenda";

export type CalendarEventTypeFilter =
  | "ASSIGNMENT"
  | "EXAM"
  | "PROJECT"
  | "READING"
  | "STUDY_SESSION"
  | "CLASS"
  | "PERSONAL"
  | "OTHER";

export interface WorkspaceCourse {
  id: string;
  title: string;
  color: string | null;
}

export interface WorkspaceCalendarItem {
  id: string;
  source: CalendarItemSource;
  sourceId: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  eventType: CalendarEventTypeFilter;
  color: string;
  /** When true, event color was explicitly chosen and should not be remapped by theme palette. */
  colorIsCustom?: boolean;
  courseId?: string | null;
  courseTitle?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  completed: boolean;
  location?: string | null;
  reminderAt?: string | null;
  recurrence?: string | null;
  editable: boolean;
  overdue: boolean;
  externalSource?: string | null;
  calendarConnectionId?: string | null;
  isRecurrenceOccurrence?: boolean;
  seriesId?: string;
  occurrenceAt?: string;
}

export interface CalendarFilters {
  search: string;
  courseIds: Set<string>;
  eventTypes: Set<CalendarEventTypeFilter>;
  showCompleted: boolean;
  showIncomplete: boolean;
  showOverdue: boolean;
  datePreset: "all" | "today" | "week" | "month" | "custom";
  customStart?: string;
  customEnd?: string;
}

export const DEFAULT_EVENT_TYPES: CalendarEventTypeFilter[] = [
  "ASSIGNMENT",
  "EXAM",
  "PROJECT",
  "READING",
  "STUDY_SESSION",
  "CLASS",
  "PERSONAL",
  "OTHER",
];

export const EVENT_TYPE_LABELS: Record<CalendarEventTypeFilter, string> = {
  ASSIGNMENT: "Assignment",
  EXAM: "Exam",
  PROJECT: "Project",
  READING: "Reading",
  STUDY_SESSION: "Study Session",
  CLASS: "Class",
  PERSONAL: "Personal",
  OTHER: "Other",
};

export interface CalendarEventInput {
  title: string;
  description?: string | null;
  courseId?: string | null;
  courseTitle?: string;
  startAt: string;
  endAt?: string | null;
  allDay?: boolean;
  eventType?: CalendarEventTypeFilter;
  color?: string | null;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  recurrence?: string | null;
  reminderAt?: string | null;
  completed?: boolean;
  location?: string | null;
  syncToPlanner?: boolean;
  editScope?: "single" | "following" | "series";
  occurrenceAt?: string;
}

export interface AiScheduleRecommendation {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  reason: string;
  status: "pending" | "accepted" | "dismissed";
}
