import { AssignmentStatus, MaterialType } from "@/generated/prisma";
import { AcademicHub } from "@/components/hub/AcademicHub";
import type { HubData } from "@/components/hub/types";
import { buildAttentionItems } from "@/lib/csl/attention";
import { buildProgressSnapshot } from "@/lib/csl/progress";
import { buildStudyTelemetry } from "@/lib/csl/study-sessions";
import { buildNotifications } from "@/lib/notifications";
import { getNotificationPrefs } from "@/lib/notifications-prefs";
import { parseCurriculumFromMaterial } from "@/lib/grade-school/learning-plan";
import { getGradeSchoolProgress, progressByCourse } from "@/lib/grade-school/progress";
import { getOrCreateUserPreferences } from "@/lib/preferences";
import { countQuizAttempts } from "@/lib/quizzes/attempts";
import { fetchHubTodayCalendarEvents } from "@/lib/hub/dashboard-calendar";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getOrCreateDefaultUser();
  const now = new Date();

  const [
    courses,
    assignments,
    meetings,
    materials,
    pendingAssignments,
    dueFlashcards,
    masteries,
    quizAttempts,
    missedQuestions,
    weakTopicRows,
    preferences,
    studyTelemetry,
    gradeSchoolProgressRows,
    notificationPrefs,
    todayCalendarEvents,
  ] = await Promise.all([
    db.course.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { assignments: true, materials: true },
        },
        materials: {
          where: { type: MaterialType.SYLLABUS },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { extractedText: true },
        },
      },
    }),
    db.assignment.findMany({
      where: { course: { userId: user.id } },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            color: true,
            materials: { select: { type: true }, take: 1 },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    }),
    db.classMeeting.findMany({
      where: { course: { userId: user.id } },
      include: {
        course: { select: { id: true, title: true, color: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    db.courseMaterial.findMany({
      where: { course: { userId: user.id } },
      include: {
        course: { select: { id: true, title: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.assignment.count({
      where: {
        course: { userId: user.id },
        status: {
          in: [AssignmentStatus.NOT_STARTED, AssignmentStatus.IN_PROGRESS],
        },
      },
    }),
    db.flashcard.count({
      where: {
        userId: user.id,
        OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
      },
    }),
    db.topicMastery.findMany({
      where: { userId: user.id },
      select: {
        proficiency: true,
        understanding: true,
        recall: true,
        application: true,
        reviewCount: true,
        lastReviewedAt: true,
      },
    }),
    countQuizAttempts(user.id),
    db.missedQuestion.count({
      where: { userId: user.id, mastered: false },
    }),
    db.topicMastery.findMany({
      where: { userId: user.id, proficiency: { lt: 0.55 } },
      include: {
        topic: {
          include: { course: { select: { title: true } } },
        },
      },
      orderBy: { proficiency: "asc" },
      take: 6,
    }),
    getOrCreateUserPreferences(user.id),
    buildStudyTelemetry(user.id),
    getGradeSchoolProgress(),
    getNotificationPrefs(user.id),
    fetchHubTodayCalendarEvents(user.id, now),
  ]);

  const overallMastery =
    masteries.length === 0
      ? 0
      : Math.round(
          (masteries.reduce((sum, item) => sum + item.proficiency, 0) /
            masteries.length) *
            100,
        );

  const twoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const overdueAssignments = assignments.filter(
    (assignment) =>
      assignment.dueDate &&
      assignment.dueDate < now &&
      assignment.status !== AssignmentStatus.SUBMITTED &&
      assignment.status !== AssignmentStatus.GRADED,
  );
  const dueSoonAssignments = assignments.filter(
    (assignment) =>
      assignment.dueDate &&
      assignment.dueDate >= now &&
      assignment.dueDate <= twoDays &&
      assignment.status !== AssignmentStatus.SUBMITTED &&
      assignment.status !== AssignmentStatus.GRADED,
  );

  const attention = buildAttentionItems({
    overdueAssignments: overdueAssignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      courseTitle: assignment.course.title,
    })),
    dueSoonAssignments: dueSoonAssignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      courseTitle: assignment.course.title,
      dueDate: assignment.dueDate!,
    })),
    weakTopics: weakTopicRows.map((row) => ({
      id: row.topicId,
      name: row.topic.name,
      courseId: row.topic.courseId,
      courseTitle: row.topic.course.title,
      proficiency: row.proficiency,
      understanding: row.understanding,
      recall: row.recall,
      application: row.application,
      reviewCount: row.reviewCount,
    })),
    missedQuestions,
    dueFlashcards,
  });

  const progress = buildProgressSnapshot(masteries, quizAttempts);

  const updates = await buildNotifications(user.id, notificationPrefs);

  const progressMap = progressByCourse(gradeSchoolProgressRows);

  const todayKey = now.toISOString().slice(0, 10);
  const todayTasks = todayCalendarEvents.length;

  const latestSession = studyTelemetry.recentSessions[0] ?? null;
  const latestNote = await db.note.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { course: { select: { id: true, title: true } } },
  });

  const jumpBackIn = latestSession?.courseTitle
    ? {
        title: latestSession.courseTitle,
        subtitle: `Continue studying · ${latestSession.activityType.replace(/_/g, " ").toLowerCase()}`,
        href: latestSession.courseId
          ? `/courses/${latestSession.courseId}`
          : "/study",
      }
    : latestNote
      ? {
          title: latestNote.title ?? "Your notebook",
          subtitle: latestNote.course?.title ?? "Core notes",
          href: `/core?courseId=${latestNote.courseId ?? ""}&noteId=${latestNote.id}`,
        }
      : courses[0]
        ? {
            title: courses[0].title,
            subtitle: "Open your class",
            href: `/courses/${courses[0].id}`,
          }
        : null;

  const hubData: HubData = {
    user: {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    jumpBackIn,
    updates: updates.slice(0, 6),
    courses: (() => {
      const meetingsByCourse = new Map<string, number>();
      for (const meeting of meetings) {
        meetingsByCourse.set(
          meeting.courseId,
          (meetingsByCourse.get(meeting.courseId) ?? 0) + 1,
        );
      }

      return courses.map((course) => ({
        id: course.id,
        title: course.title,
        code: course.code,
        instructor: course.instructor,
        semester: course.semester,
        color: course.color,
        assignmentCount: course._count.assignments,
        materialCount: course._count.materials,
        meetingCount: meetingsByCourse.get(course.id) ?? 0,
      }));
    })(),
    assignments: assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate?.toISOString() ?? null,
      kind: assignment.kind,
      status: assignment.status,
      grade: assignment.grade,
      maxGrade: assignment.maxGrade,
      courseId: assignment.courseId,
      courseTitle: assignment.course.title,
      courseColor: assignment.course.color,
      source: assignment.course.materials.some(
        (material) => material.type === "SYLLABUS",
      )
        ? "syllabus"
        : "manual",
    })),
    meetings: meetings.map((meeting) => ({
      id: meeting.id,
      courseId: meeting.courseId,
      courseTitle: meeting.course.title,
      courseColor: meeting.course.color,
      dayOfWeek: meeting.dayOfWeek,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      location: meeting.location,
      title: meeting.title,
    })),
    materials: materials.map((material) => ({
      id: material.id,
      title: material.title,
      type: material.type,
      courseId: material.courseId,
      courseTitle: material.course.title,
      courseColor: material.course.color,
    })),
    todayCalendarEvents,
    stats: {
      pendingAssignments,
      dueFlashcards,
      overallMastery,
      todayTasks,
    },
    attention,
    progress,
    telemetry: {
      currentStreak: studyTelemetry.currentStreak,
      longestStreak: studyTelemetry.longestStreak,
      weekTotalMinutes: studyTelemetry.weekTotalMinutes,
      weeklyMinutes: studyTelemetry.weeklyMinutes,
      minutesByActivity: studyTelemetry.minutesByActivity.slice(0, 4),
      minutesByCourse: studyTelemetry.minutesByCourse.slice(0, 3),
      recentSessions: studyTelemetry.recentSessions.slice(0, 8),
    },
    gradeSchoolPlans: courses
      .filter((course) => course.gradeLevel)
      .map((course) => {
        const curriculum = parseCurriculumFromMaterial(
          course.materials[0]?.extractedText,
        );
        if (!curriculum?.learningSteps?.length) return null;
        const progress = progressMap.get(course.id);
        return {
          courseId: course.id,
          courseTitle: course.title,
          courseColor: course.color,
          curriculum,
          completedSteps: progress?.completedSteps ?? [],
          flashcardCount: progress?.flashcards ?? 0,
        };
      })
      .filter((plan): plan is NonNullable<typeof plan> => plan !== null),
  };

  return <AcademicHub data={hubData} />;
}
