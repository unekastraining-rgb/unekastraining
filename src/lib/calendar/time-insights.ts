import type { WorkspaceCalendarItem } from "./workspace-types";

export interface CalendarTimeInsights {
  totalScheduledHours: number;
  classHours: number;
  studyHours: number;
  assignmentHours: number;
  freeHoursEstimate: number;
  busiestDay: string | null;
  eventCount: number;
  completedCount: number;
  overdueCount: number;
}

function eventDurationHours(item: WorkspaceCalendarItem): number {
  const start = new Date(item.startAt);
  const end = item.endAt ? new Date(item.endAt) : new Date(start.getTime() + 60 * 60 * 1000);
  return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
}

export function buildCalendarTimeInsights(
  items: WorkspaceCalendarItem[],
  workingHoursPerDay = 16,
  daysInRange = 7,
): CalendarTimeInsights {
  let classHours = 0;
  let studyHours = 0;
  let assignmentHours = 0;
  const hoursByDay = new Map<string, number>();

  for (const item of items) {
    const hours = eventDurationHours(item);
    const day = item.startAt.slice(0, 10);
    hoursByDay.set(day, (hoursByDay.get(day) ?? 0) + hours);

    if (item.eventType === "CLASS") classHours += hours;
    else if (item.eventType === "STUDY_SESSION") studyHours += hours;
    else if (
      item.eventType === "ASSIGNMENT" ||
      item.eventType === "EXAM" ||
      item.eventType === "PROJECT"
    ) {
      assignmentHours += hours;
    }
  }

  const totalScheduledHours = classHours + studyHours + assignmentHours;
  const capacity = workingHoursPerDay * daysInRange;
  const freeHoursEstimate = Math.max(0, capacity - totalScheduledHours);

  let busiestDay: string | null = null;
  let busiestHours = 0;
  for (const [day, hours] of hoursByDay) {
    if (hours > busiestHours) {
      busiestHours = hours;
      busiestDay = day;
    }
  }

  return {
    totalScheduledHours: Math.round(totalScheduledHours * 10) / 10,
    classHours: Math.round(classHours * 10) / 10,
    studyHours: Math.round(studyHours * 10) / 10,
    assignmentHours: Math.round(assignmentHours * 10) / 10,
    freeHoursEstimate: Math.round(freeHoursEstimate * 10) / 10,
    busiestDay,
    eventCount: items.length,
    completedCount: items.filter((item) => item.completed).length,
    overdueCount: items.filter((item) => item.overdue).length,
  };
}
