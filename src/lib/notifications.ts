import { AssignmentStatus } from "@/generated/prisma";
import { db } from "@/lib/db";
import { readableCourseTitle } from "@/lib/courses/display-name";
import { buildSixHrefForTopic } from "@/lib/csl/six-recommendations";
import { hubAssignmentFocusHref, hubCalendarHref } from "@/lib/hub/tabs";
import type { NotificationPrefs } from "@/lib/notifications-prefs";
import { filterNotifications } from "@/lib/notifications-prefs";

export type NotificationKind =
  | "deadline"
  | "overdue"
  | "flashcards"
  | "reminder"
  | "mastery";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  href: string;
  severity: "high" | "medium" | "low";
  at?: string;
  read?: boolean;
  loopCourseId?: string | null;
  loopTopic?: string | null;
}

export async function buildNotifications(
  userId: string,
  prefs?: NotificationPrefs,
): Promise<AppNotification[]> {
  const now = new Date();
  const twoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const [overdue, dueSoon, dueFlashcards, reminders, weakTopics] = await Promise.all([
    db.assignment.findMany({
      where: {
        course: { userId },
        dueDate: { lt: now },
        status: {
          in: [AssignmentStatus.NOT_STARTED, AssignmentStatus.IN_PROGRESS],
        },
      },
      include: { course: { select: { title: true, code: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    db.assignment.findMany({
      where: {
        course: { userId },
        dueDate: { gte: now, lte: twoDays },
        status: {
          in: [AssignmentStatus.NOT_STARTED, AssignmentStatus.IN_PROGRESS],
        },
      },
      include: { course: { select: { title: true, code: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    db.flashcard.count({
      where: {
        userId,
        OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
      },
    }),
    db.calendarEvent.findMany({
      where: {
        userId,
        reminderAt: { lte: twoDays, gte: new Date(now.getTime() - 60 * 60 * 1000) },
        completed: false,
      },
      orderBy: { reminderAt: "asc" },
      take: 5,
    }),
    db.topicMastery.findMany({
      where: { userId, proficiency: { lt: 0.55 } },
      include: {
        topic: {
          include: { course: { select: { id: true, title: true, code: true } } },
        },
      },
      orderBy: { proficiency: "asc" },
      take: 3,
    }),
  ]);

  const items: AppNotification[] = [];
  const primaryCourseId = weakTopics[0]?.topic.courseId ?? null;
  const primaryTopic = weakTopics[0]?.topic.name ?? null;

  for (const assignment of overdue) {
    items.push({
      id: `overdue-${assignment.id}`,
      kind: "overdue",
      title: assignment.title,
      description: `${readableCourseTitle(assignment.course.title, assignment.course.code)} — overdue`,
      href: hubAssignmentFocusHref(assignment.id),
      severity: "high",
      at: assignment.dueDate?.toISOString(),
      loopCourseId: assignment.courseId,
      loopTopic: assignment.title.trim() || null,
    });
  }

  for (const assignment of dueSoon) {
    items.push({
      id: `due-${assignment.id}`,
      kind: "deadline",
      title: assignment.title,
      description: `${readableCourseTitle(assignment.course.title, assignment.course.code)} — due soon`,
      href: hubAssignmentFocusHref(assignment.id),
      severity: "medium",
      at: assignment.dueDate?.toISOString(),
      loopCourseId: assignment.courseId,
      loopTopic: assignment.title.trim() || null,
    });
  }

  if (dueFlashcards > 0) {
    items.push({
      id: "flashcards-due",
      kind: "flashcards",
      title: `${dueFlashcards} flashcards due`,
      description: "Spaced review keeps retention strong.",
      href: "/flashcards",
      severity: dueFlashcards >= 15 ? "medium" : "low",
      loopCourseId: primaryCourseId,
      loopTopic: primaryTopic,
    });
  }

  for (const event of reminders) {
    const dateParam = event.startAt.toISOString().slice(0, 10);
    items.push({
      id: `reminder-${event.id}`,
      kind: "reminder",
      title: event.title,
      description: event.description ?? "Calendar reminder",
      href: hubCalendarHref({ date: dateParam, focus: event.id }),
      severity: "medium",
      at: event.reminderAt?.toISOString(),
      loopCourseId: event.courseId,
      loopTopic: event.title.trim() || null,
    });
  }

  for (const mastery of weakTopics) {
    items.push({
      id: `weak-${mastery.topicId}`,
      kind: "mastery",
      title: mastery.topic.name,
      description: `${readableCourseTitle(mastery.topic.course.title, mastery.topic.course.code)} — ${Math.round(mastery.proficiency * 100)}% mastery`,
      href: buildSixHrefForTopic({
        topicId: mastery.topicId,
        topicName: mastery.topic.name,
        courseId: mastery.topic.courseId,
        proficiency: mastery.proficiency,
        understanding: mastery.understanding,
        recall: mastery.recall,
        application: mastery.application,
        reviewCount: mastery.reviewCount,
      }),
      severity: mastery.proficiency < 0.35 ? "high" : "medium",
      loopCourseId: mastery.topic.courseId,
      loopTopic: mastery.topic.name,
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  const sorted = items.sort((a, b) => order[a.severity] - order[b.severity]);
  const visible = prefs ? filterNotifications(sorted, prefs) : sorted;
  const readIds = new Set(prefs?.readIds ?? []);

  return visible.map((item) => ({
    ...item,
    read: readIds.has(item.id),
  }));
}
