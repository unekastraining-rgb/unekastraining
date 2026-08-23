import { AssignmentStatus } from "@/generated/prisma";
import { buildSixHrefForTopic } from "@/lib/csl/six-recommendations";
import { writeCalendarEventToGoogle } from "@/lib/calendar/google-calendar";
import { db } from "@/lib/db";

export interface ScheduleChange {
  type: "study_block" | "reschedule_assignment" | "review_topic";
  title: string;
  description: string;
  assignmentId?: string;
  topicId?: string;
  courseId?: string;
  sixHref?: string;
  suggestedDate?: string;
  minutes?: number;
}

export async function generateScheduleProposals(userId: string) {
  const now = new Date();
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [urgentAssignments, weakMasteries] = await Promise.all([
    db.assignment.findMany({
      where: {
        course: { userId },
        status: { in: [AssignmentStatus.NOT_STARTED, AssignmentStatus.IN_PROGRESS] },
        dueDate: { lte: threeDays },
      },
      include: { course: { select: { title: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    db.topicMastery.findMany({
      where: { userId, proficiency: { lt: 0.5 } },
      include: { topic: { include: { course: { select: { title: true } } } } },
      orderBy: { proficiency: "asc" },
      take: 4,
    }),
  ]);

  const changes: ScheduleChange[] = [];

  for (const assignment of urgentAssignments) {
    const dueLabel = assignment.dueDate
      ? assignment.dueDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
      : "soon";
    changes.push({
      type: "reschedule_assignment",
      title: `Block time for: ${assignment.title}`,
      description: `${assignment.course.title} is due ${dueLabel}. Schedule a focused work session.`,
      assignmentId: assignment.id,
      suggestedDate: assignment.dueDate
        ? new Date(assignment.dueDate.getTime() - 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      minutes: 45,
    });
  }

  for (const mastery of weakMasteries) {
    const sixHref = buildSixHrefForTopic({
      topicId: mastery.topicId,
      topicName: mastery.topic.name,
      courseId: mastery.topic.courseId,
      proficiency: mastery.proficiency,
      understanding: mastery.understanding,
      recall: mastery.recall,
      application: mastery.application,
      reviewCount: mastery.reviewCount,
    });

    changes.push({
      type: "review_topic",
      title: `Review: ${mastery.topic.name}`,
      description: `Low mastery (${Math.round(mastery.proficiency * 100)}%) in ${mastery.topic.course.title}. Open the linked Six session when this block starts.`,
      topicId: mastery.topicId,
      courseId: mastery.topic.courseId,
      sixHref,
      minutes: 20,
    });
  }

  if (changes.length === 0) {
    changes.push({
      type: "study_block",
      title: "Maintain your streak",
      description: "No urgent deadlines detected. Schedule a 20-minute mixed review session.",
      minutes: 20,
      suggestedDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return changes;
}

export async function applyScheduleProposal(
  userId: string,
  changes: ScheduleChange[],
) {
  const results: string[] = [];

  for (const change of changes) {
    const startAt = change.suggestedDate
      ? new Date(change.suggestedDate)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endAt = new Date(startAt.getTime() + (change.minutes ?? 30) * 60 * 1000);
    const description = change.sixHref
      ? `${change.description}\n\nSix session: ${change.sixHref}`
      : change.description;

    if (
      change.type === "study_block" ||
      change.type === "review_topic" ||
      change.type === "reschedule_assignment"
    ) {
      let courseId: string | undefined;
      if (change.type === "reschedule_assignment" && change.assignmentId) {
        const assignment = await db.assignment.findUnique({
          where: { id: change.assignmentId },
          select: { courseId: true },
        });
        courseId = assignment?.courseId;
      } else if (change.courseId) {
        courseId = change.courseId;
      }

      const event = await db.calendarEvent.create({
        data: {
          userId,
          courseId,
          title: change.title,
          description,
          startAt,
          endAt,
          eventType: "STUDY_SESSION",
          priority: change.type === "reschedule_assignment" ? "HIGH" : "MEDIUM",
          assignmentId:
            change.type === "reschedule_assignment" ? change.assignmentId : undefined,
        },
      });

      try {
        const link = await writeCalendarEventToGoogle(userId, event);
        if (link) {
          await db.calendarEvent.update({
            where: { id: event.id },
            data: {
              externalSource: "google",
              externalId: link.externalId,
              calendarConnectionId: link.calendarConnectionId,
            },
          });
        }
      } catch (error) {
        console.warn("Google Calendar write-back for proposal failed:", error);
      }

      results.push(`Scheduled: ${change.title}`);
    }
  }

  return results;
}
