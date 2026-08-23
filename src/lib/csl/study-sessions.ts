import type { StudyActivityType } from "@/generated/prisma";
import { db } from "@/lib/db";

export interface CreateStudySessionInput {
  userId: string;
  activityType: StudyActivityType;
  courseId?: string | null;
  topicId?: string | null;
  durationSeconds?: number;
  cardsReviewed?: number;
  notesCreated?: number;
  startedAt?: Date;
  endedAt?: Date | null;
}

export async function createStudySession(input: CreateStudySessionInput) {
  const startedAt = input.startedAt ?? new Date();
  const endedAt = input.endedAt ?? startedAt;

  return db.studySession.create({
    data: {
      userId: input.userId,
      activityType: input.activityType,
      courseId: input.courseId ?? null,
      topicId: input.topicId ?? null,
      durationSeconds: input.durationSeconds ?? 0,
      cardsReviewed: input.cardsReviewed ?? 0,
      notesCreated: input.notesCreated ?? 0,
      startedAt,
      endedAt,
    },
  });
}

export async function finishStudySession(
  sessionId: string,
  patch: Partial<Pick<CreateStudySessionInput, "durationSeconds" | "cardsReviewed" | "notesCreated">>,
) {
  return db.studySession.update({
    where: { id: sessionId },
    data: {
      ...patch,
      endedAt: new Date(),
    },
  });
}

export interface StudyTelemetrySummary {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  weekTotalMinutes: number;
  minutesByActivity: Array<{ activityType: string; minutes: number; sessions: number }>;
  minutesByCourse: Array<{ courseId: string; courseTitle: string; minutes: number }>;
  recentSessions: Array<{
    id: string;
    activityType: string;
    durationSeconds: number;
    startedAt: string;
    courseId: string | null;
    courseTitle: string | null;
  }>;
  weeklyMinutes: Array<{ day: string; minutes: number }>;
}

export type HubTelemetrySnapshot = Pick<
  StudyTelemetrySummary,
  | "currentStreak"
  | "longestStreak"
  | "weekTotalMinutes"
  | "weeklyMinutes"
  | "minutesByActivity"
  | "minutesByCourse"
  | "recentSessions"
>;

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dayKey(date: Date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

export async function buildStudyTelemetry(userId: string): Promise<StudyTelemetrySummary> {
  const sessions = await db.studySession.findMany({
    where: { userId },
    include: { course: { select: { id: true, title: true } } },
    orderBy: { startedAt: "desc" },
    take: 200,
  });

  const totalSeconds = sessions.reduce((sum, session) => sum + session.durationSeconds, 0);
  const minutesByActivityMap = new Map<string, { minutes: number; sessions: number }>();
  const minutesByCourseMap = new Map<string, { courseTitle: string; minutes: number }>();

  for (const session of sessions) {
    const key = session.activityType;
    const current = minutesByActivityMap.get(key) ?? { minutes: 0, sessions: 0 };
    const sessionMinutes = Math.round(session.durationSeconds / 60);
    current.minutes += sessionMinutes;
    current.sessions += 1;
    minutesByActivityMap.set(key, current);

    if (session.courseId && session.course?.title) {
      const courseEntry = minutesByCourseMap.get(session.courseId) ?? {
        courseTitle: session.course.title,
        minutes: 0,
      };
      courseEntry.minutes += sessionMinutes;
      minutesByCourseMap.set(session.courseId, courseEntry);
    }
  }

  const activeDays = new Set(
    sessions.map((session) => dayKey(session.startedAt)),
  );

  let currentStreak = 0;
  const today = startOfDay(new Date());
  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    if (activeDays.has(dayKey(date))) {
      currentStreak += 1;
    } else if (offset === 0) {
      continue;
    } else {
      break;
    }
  }

  const sortedDayKeys = [...activeDays].sort();
  let longestStreak = 0;
  let run = 0;
  let previous: Date | null = null;
  for (const key of sortedDayKeys) {
    const date = new Date(`${key}T12:00:00`);
    if (previous && date.getTime() - previous.getTime() === 24 * 60 * 60 * 1000) {
      run += 1;
    } else {
      run = 1;
    }
    longestStreak = Math.max(longestStreak, run);
    previous = date;
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  const weeklyMinutes: Array<{ day: string; minutes: number }> = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = dayKey(date);
    const minutes = sessions
      .filter((session) => dayKey(session.startedAt) === key)
      .reduce((sum, session) => sum + Math.round(session.durationSeconds / 60), 0);
    weeklyMinutes.push({
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      minutes,
    });
  }

  const weekTotalMinutes = weeklyMinutes.reduce((sum, item) => sum + item.minutes, 0);

  return {
    totalSessions: sessions.length,
    totalMinutes: Math.round(totalSeconds / 60),
    currentStreak,
    longestStreak,
    weekTotalMinutes,
    minutesByActivity: [...minutesByActivityMap.entries()]
      .map(([activityType, value]) => ({ activityType, ...value }))
      .sort((a, b) => b.minutes - a.minutes),
    minutesByCourse: [...minutesByCourseMap.entries()]
      .map(([courseId, value]) => ({
        courseId,
        courseTitle: value.courseTitle,
        minutes: value.minutes,
      }))
      .sort((a, b) => b.minutes - a.minutes),
    recentSessions: sessions.slice(0, 12).map((session) => ({
      id: session.id,
      activityType: session.activityType,
      durationSeconds: session.durationSeconds,
      startedAt: session.startedAt.toISOString(),
      courseId: session.courseId,
      courseTitle: session.course?.title ?? null,
    })),
    weeklyMinutes,
  };
}
