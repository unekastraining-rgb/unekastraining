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
import {
  attachPortalDates,
  buildWeeklyCollegeGrid,
} from "@/lib/schedule/weekly-college-grid";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";
import { backfillUserCourseTopicsIfEmpty } from "@/lib/syllabus/enrich-course-from-syllabus";
import {
  readableCourseCode,
  readableCourseName,
  readableCourseTitle,
  readableMeetingTitle,
} from "@/lib/courses/display-name";
import { parseHubTab } from "@/lib/hub/tabs";
import { localDateKey } from "@/lib/calendar/types";
import { enrichAssignmentsWithConceptLinks } from "@/lib/learning/school-lms";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const initialTab = parseHubTab(params.tab ?? null);
  const user = await getOrCreateDefaultUser();
  await backfillUserCourseTopicsIfEmpty(user.id);
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
    assignmentTopics,
  ] = await Promise.all([
    db.course.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
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
        topics: {
          orderBy: { sortOrder: "asc" },
          take: 24,
          select: { name: true },
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
            code: true,
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
        course: { select: { id: true, title: true, code: true, color: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    db.courseMaterial.findMany({
      where: { course: { userId: user.id } },
      include: {
        course: { select: { id: true, title: true, code: true, color: true } },
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
          include: { course: { select: { title: true, code: true } } },
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
    // 2P-31 — topics with concept links for assignment → Adaptive CTAs
    db.topic.findMany({
      where: { course: { userId: user.id }, conceptId: { not: null } },
      select: { id: true, name: true, courseId: true, conceptId: true },
    }),
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
      courseId: assignment.courseId,
      courseTitle: readableCourseTitle(assignment.course.title, assignment.course.code),
    })),
    dueSoonAssignments: dueSoonAssignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      courseId: assignment.courseId,
      courseTitle: readableCourseTitle(assignment.course.title, assignment.course.code),
      dueDate: assignment.dueDate!,
    })),
    weakTopics: weakTopicRows.map((row) => ({
      id: row.topicId,
      name: row.topic.name,
      courseId: row.topic.courseId,
      courseTitle: readableCourseTitle(row.topic.course.title, row.topic.course.code),
      proficiency: row.proficiency,
      understanding: row.understanding,
      recall: row.recall,
      application: row.application,
      reviewCount: row.reviewCount,
    })),
    missedQuestions,
    dueFlashcards,
    primaryCourseId: courses[0]?.id ?? weakTopicRows[0]?.topic.courseId ?? null,
  });

  const progress = buildProgressSnapshot(masteries, quizAttempts);

  const updates = await buildNotifications(user.id, notificationPrefs);

  const progressMap = progressByCourse(gradeSchoolProgressRows);

  const todayKey = localDateKey(now);
  const todayTasks = todayCalendarEvents.length;

  const latestSession = studyTelemetry.recentSessions[0] ?? null;
  const latestNote = await db.note.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { course: { select: { id: true, title: true, code: true } } },
  });

  const jumpBackIn = latestSession?.courseTitle
    ? {
        title: latestSession.courseTitle,
        subtitle: `Continue studying · ${latestSession.activityType.replace(/_/g, " ").toLowerCase()}`,
        href: latestSession.courseId
          ? `/courses/${latestSession.courseId}`
          : "/study",
        courseId: latestSession.courseId ?? null,
      }
    : latestNote
      ? {
          title: latestNote.title ?? "Your notebook",
          subtitle: latestNote.course
            ? readableCourseTitle(latestNote.course.title, latestNote.course.code)
            : "Core notes",
          href: `/core?courseId=${latestNote.courseId ?? ""}&noteId=${latestNote.id}`,
          courseId: latestNote.courseId ?? latestNote.course?.id ?? null,
          topic: latestNote.title?.trim() || null,
        }
      : courses[0]
        ? {
            title: readableCourseName(courses[0]),
            subtitle: "Open your class",
            href: `/courses/${courses[0].id}`,
            courseId: courses[0].id,
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
        title: readableCourseName(course),
        code: readableCourseCode(course),
        instructor: course.instructor,
        semester: course.semester,
        color: course.color,
        assignmentCount: course._count.assignments,
        materialCount: course._count.materials,
        meetingCount: meetingsByCourse.get(course.id) ?? 0,
        topics: course.topics.map((topic) => topic.name),
      }));
    })(),
    assignments: enrichAssignmentsWithConceptLinks(
      assignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate?.toISOString() ?? null,
        kind: assignment.kind,
        status: assignment.status,
        grade: assignment.grade,
        maxGrade: assignment.maxGrade,
        courseId: assignment.courseId,
        courseTitle: readableCourseTitle(assignment.course.title, assignment.course.code),
        courseColor: assignment.course.color,
        source: assignment.course.materials.some(
          (material) => material.type === "SYLLABUS",
        )
          ? ("syllabus" as const)
          : ("manual" as const),
      })),
      assignmentTopics.map((t) => ({
        id: t.id,
        name: t.name,
        courseId: t.courseId,
        conceptId: t.conceptId,
      })),
    ),
    meetings: meetings.map((meeting) => ({
      id: meeting.id,
      courseId: meeting.courseId,
      courseTitle: readableCourseTitle(meeting.course.title, meeting.course.code),
      courseColor: meeting.course.color,
      dayOfWeek: meeting.dayOfWeek,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      location: meeting.location,
      title: readableMeetingTitle(meeting.title, meeting.course),
    })),
    materials: materials.map((material) => ({
      id: material.id,
      title: material.title,
      type: material.type,
      courseId: material.courseId,
      courseTitle: readableCourseTitle(material.course.title, material.course.code),
      courseColor: material.course.color,
    })),
    todayCalendarEvents,
    todayKey,
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
          courseTitle: readableCourseName(course),
          courseColor: course.color,
          curriculum,
          completedSteps: progress?.completedSteps ?? [],
          flashcardCount: progress?.flashcards ?? 0,
        };
      })
      .filter((plan): plan is NonNullable<typeof plan> => plan !== null),
    weeklySchedule:
      courses.length === 0
        ? null
        : buildWeeklyCollegeGrid({
            courses: courses.map((course) => attachPortalDates(course)),
            meetings: meetings.map((meeting) => ({
              courseId: meeting.courseId,
              dayOfWeek: meeting.dayOfWeek,
              startTime: meeting.startTime,
              endTime: meeting.endTime,
              title: meeting.title,
              location: meeting.location,
            })),
          }),
  };

  return <AcademicHub data={hubData} initialTab={initialTab} />;
}
