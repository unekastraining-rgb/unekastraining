import { db } from "@/lib/db";
import { coursePath } from "@/lib/courses";
import { readableCourseCode, readableCourseName, readableCourseTitle } from "@/lib/courses/display-name";
import { hubAssignmentFocusHref, hubCalendarHref } from "@/lib/hub/tabs";
import { buildSixHrefForTopic } from "@/lib/csl/six-recommendations";

import { formatActivityLabel, sessionHref } from "./search-meta";
import {
  extractInkOcrFromNoteJson,
  noteMatchesSearchQuery,
} from "./note-ink-search";

export type SearchResultType =
  | "course"
  | "assignment"
  | "note"
  | "flashcard"
  | "quiz"
  | "material"
  | "session"
  | "event"
  | "topic";

export interface GlobalSearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  href: string;
  /** When set, search UI can offer Core → Six → Lucky shortcuts for this hit. */
  loopCourseId?: string;
  loopTopic?: string;
}

function matches(haystack: string | null | undefined, query: string) {
  return (haystack ?? "").toLowerCase().includes(query);
}

function courseLabel(course?: { title: string; code?: string | null } | null) {
  if (!course) return null;
  return readableCourseTitle(course.title, course.code);
}

export async function searchGlobal(
  userId: string,
  rawQuery: string,
  limit = 20,
): Promise<GlobalSearchResult[]> {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < 2) return [];

  const [courses, assignments, notes, flashcards, quizzes, materials, sessions, events, topics] =
    await Promise.all([
    db.course.findMany({
      where: { userId },
      select: { id: true, title: true, code: true, instructor: true },
      take: 40,
    }),
    db.assignment.findMany({
      where: { course: { userId } },
      include: { course: { select: { title: true, code: true } } },
      orderBy: { dueDate: "asc" },
      take: 60,
    }),
    db.note.findMany({
      where: { userId },
      include: { course: { select: { id: true, title: true, code: true } } },
      orderBy: { updatedAt: "desc" },
      take: 60,
    }),
    db.flashcard.findMany({
      where: { userId },
      include: { topic: { include: { course: { select: { title: true, code: true } } } } },
      take: 80,
    }),
    db.quiz.findMany({
      where: { userId },
      include: { course: { select: { id: true, title: true, code: true } } },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    db.courseMaterial.findMany({
      where: { course: { userId } },
      include: { course: { select: { id: true, title: true, code: true } } },
      orderBy: { updatedAt: "desc" },
      take: 60,
    }),
    db.studySession.findMany({
      where: { userId },
      include: {
        course: { select: { title: true, code: true } },
        topic: { select: { name: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 80,
    }),
    db.calendarEvent.findMany({
      where: { userId },
      include: { course: { select: { title: true, code: true } } },
      orderBy: { startAt: "desc" },
      take: 80,
    }),
    db.topic.findMany({
      where: { course: { userId } },
      include: {
        course: { select: { id: true, title: true, code: true } },
        masteries: {
          where: { userId },
          take: 1,
        },
      },
      orderBy: { sortOrder: "asc" },
      take: 80,
    }),
  ]);

  const results: GlobalSearchResult[] = [];

  for (const course of courses) {
    const displayTitle = readableCourseName(course);
    const displayCode = readableCourseCode(course);
    if (
      matches(course.title, query) ||
      matches(course.code, query) ||
      matches(displayTitle, query) ||
      matches(displayCode, query) ||
      matches(course.instructor, query)
    ) {
      results.push({
        id: course.id,
        type: "course",
        title: displayTitle,
        subtitle: displayCode ?? "Course",
        href: coursePath(course.id),
        loopCourseId: course.id,
      });
    }
  }

  for (const assignment of assignments) {
    if (
      matches(assignment.title, query) ||
      matches(assignment.description, query) ||
      matches(assignment.course.title, query) ||
      matches(courseLabel(assignment.course), query)
    ) {
      results.push({
        id: assignment.id,
        type: "assignment",
        title: assignment.title,
        subtitle: courseLabel(assignment.course) ?? assignment.course.title,
        href: hubAssignmentFocusHref(assignment.id),
      });
    }
  }

  for (const note of notes) {
    const { matches: noteHit, fromHandwriting } = noteMatchesSearchQuery(note, query);
    if (noteHit) {
      results.push({
        id: note.id,
        type: "note",
        title: note.title ?? "Untitled note",
        subtitle: fromHandwriting
          ? `${courseLabel(note.course) ?? "Core"} · handwriting`
          : courseLabel(note.course) ?? "Core note",
        href: note.course?.id
          ? `/core?courseId=${note.course.id}&noteId=${note.id}`
          : `/core?noteId=${note.id}`,
        loopCourseId: note.course?.id,
      });
    }
  }

  for (const card of flashcards) {
    if (matches(card.front, query) || matches(card.back, query)) {
      results.push({
        id: card.id,
        type: "flashcard",
        title: card.front,
        subtitle: courseLabel(card.topic.course) ?? card.topic.course.title,
        href: card.topic.courseId
          ? `/flashcards?courseId=${card.topic.courseId}`
          : "/flashcards",
        loopCourseId: card.topic.courseId,
        loopTopic: card.topic.name,
      });
    }
  }

  for (const quiz of quizzes) {
    if (
      matches(quiz.title, query) ||
      matches(quiz.description, query) ||
      matches(quiz.course?.title, query) ||
      matches(courseLabel(quiz.course), query)
    ) {
      results.push({
        id: quiz.id,
        type: "quiz",
        title: quiz.title,
        subtitle: courseLabel(quiz.course) ?? "Quiz",
        href: quiz.course?.id
          ? `/quizzes?courseId=${quiz.course.id}`
          : `/quizzes/${quiz.id}`,
        loopCourseId: quiz.course?.id,
      });
    }
  }

  for (const material of materials) {
    if (
      matches(material.title, query) ||
      matches(material.extractedText, query) ||
      matches(material.type, query) ||
      matches(material.course.title, query) ||
      matches(courseLabel(material.course), query)
    ) {
      results.push({
        id: material.id,
        type: "material",
        title: material.title,
        subtitle: courseLabel(material.course) ?? material.course.title,
        href: `/core?courseId=${material.course.id}&materialId=${material.id}`,
        loopCourseId: material.course.id,
      });
    }
  }

  for (const session of sessions) {
    const activityLabel = formatActivityLabel(session.activityType);
    const dateLabel = session.startedAt.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const context = courseLabel(session.course) ?? session.topic?.name ?? "Study session";

    if (
      matches(activityLabel, query) ||
      matches(session.activityType, query) ||
      matches(session.course?.title, query) ||
      matches(courseLabel(session.course), query) ||
      matches(session.topic?.name, query)
    ) {
      results.push({
        id: session.id,
        type: "session",
        title: `${activityLabel} · ${dateLabel}`,
        subtitle: context,
        href: sessionHref(session.activityType),
      });
    }
  }

  for (const event of events) {
    if (
      matches(event.title, query) ||
      matches(event.description, query) ||
      matches(event.location, query) ||
      matches(event.course?.title, query) ||
      matches(courseLabel(event.course), query)
    ) {
      results.push({
        id: event.id,
        type: "event",
        title: event.title,
        subtitle: courseLabel(event.course) ?? "Calendar event",
        href: hubCalendarHref({
          date: event.startAt.toISOString().slice(0, 10),
          focus: event.id,
        }),
      });
    }
  }

  for (const topic of topics) {
    if (
      matches(topic.name, query) ||
      matches(topic.description, query) ||
      matches(topic.course.title, query) ||
      matches(courseLabel(topic.course), query)
    ) {
      const mastery = topic.masteries[0];
      results.push({
        id: topic.id,
        type: "topic",
        title: topic.name,
        subtitle: courseLabel(topic.course) ?? topic.course.title,
        href: buildSixHrefForTopic({
          topicId: topic.id,
          topicName: topic.name,
          courseId: topic.course.id,
          proficiency: mastery?.proficiency,
          understanding: mastery?.understanding,
          recall: mastery?.recall,
          application: mastery?.application,
          reviewCount: mastery?.reviewCount,
        }),
        loopCourseId: topic.course.id,
        loopTopic: topic.name,
      });
    }
  }

  const typeOrder: Record<SearchResultType, number> = {
    course: 0,
    assignment: 1,
    event: 2,
    topic: 3,
    note: 4,
    material: 5,
    flashcard: 6,
    quiz: 7,
    session: 8,
  };

  return results
    .sort((a, b) => typeOrder[a.type] - typeOrder[b.type] || a.title.localeCompare(b.title))
    .slice(0, limit);
}
