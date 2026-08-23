import { computePriority } from "@/lib/academic";
import type { HubAssignment } from "@/components/hub/types";

const OPEN_STATUSES = new Set(["NOT_STARTED", "IN_PROGRESS"]);

function weekEndKey(todayKey: string): string {
  const end = new Date(`${todayKey}T12:00:00`);
  end.setDate(end.getDate() + 7);
  return end.toISOString().slice(0, 10);
}

function isExamKind(kind?: string): boolean {
  return kind === "TEST" || kind === "QUIZ";
}

/**
 * Assignments for the hub "Upcoming tasks" panel: this week (excluding today),
 * overdue work, high-priority deadlines, or upcoming exams.
 */
export function filterUpcomingHubAssignments(
  assignments: HubAssignment[],
  todayKey: string,
): HubAssignment[] {
  const endKey = weekEndKey(todayKey);

  return assignments
    .filter((assignment) => OPEN_STATUSES.has(assignment.status))
    .filter((assignment) => {
      const dueKey = assignment.dueDate?.slice(0, 10) ?? null;

      // Today's schedule panel covers calendar + due-today work.
      if (dueKey === todayKey) return false;

      if (dueKey && dueKey < todayKey) return true;

      if (dueKey && dueKey > todayKey && dueKey <= endKey) return true;

      if (assignment.dueDate) {
        const priority = computePriority(new Date(assignment.dueDate));
        if (priority === "HIGH") return true;
      }

      if (isExamKind(assignment.kind) && dueKey && dueKey > todayKey) {
        const examDate = new Date(`${dueKey}T12:00:00`);
        const horizon = new Date(`${todayKey}T12:00:00`);
        horizon.setDate(horizon.getDate() + 14);
        if (examDate <= horizon) return true;
      }

      return false;
    })
    .sort((a, b) => {
      const aDate = a.dueDate?.slice(0, 10) ?? "9999-12-31";
      const bDate = b.dueDate?.slice(0, 10) ?? "9999-12-31";
      return aDate.localeCompare(bDate);
    });
}
