import { AssignmentKind, AssignmentStatus, LMSProvider } from "@/generated/prisma";
import { db } from "@/lib/db";
import {
  fetchBlackboardGradebookColumns,
  fetchBlackboardUserColumnGrade,
  fetchBlackboardUserId,
  parseBlackboardUserGrade,
} from "@/lib/lms/blackboard-grades";
import {
  fetchBlackboardCourseMeetings,
  fetchCanvasCourseMeetings,
  parseMeetingScheduleFromText,
  upsertClassMeetings,
  type ClassMeetingInput,
} from "@/lib/lms/meetings";
import { collectMoodleCoursesForImport } from "@/lib/lms/moodle-collect";
import { resolveMoodleCredentials } from "@/lib/lms/moodle-env";
import { importMoodleCourses } from "@/lib/lms/moodle-import";
import { normalizeMoodleBaseUrl } from "@/lib/lms/moodle-url";

export interface CanvasCourse {
  id: number;
  name: string;
  course_code?: string;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description?: string;
  due_at: string | null;
  html_url?: string;
  points_possible?: number | null;
  submission?: {
    score?: number | null;
    grade?: string | null;
    workflow_state?: string;
  } | null;
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

export async function fetchCanvasCourses(
  baseUrl: string,
  accessToken: string,
): Promise<CanvasCourse[]> {
  const url = `${normalizeBaseUrl(baseUrl)}/api/v1/courses?enrollment_state=active&per_page=50`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Canvas API error (${response.status})`);
  }

  const data = (await response.json()) as CanvasCourse[];
  return data.filter((course) => course.name && !course.name.startsWith("Sandbox"));
}

export async function fetchCanvasAssignments(
  baseUrl: string,
  accessToken: string,
  courseId: number,
): Promise<CanvasAssignment[]> {
  const url = `${normalizeBaseUrl(baseUrl)}/api/v1/courses/${courseId}/assignments?include[]=submission&per_page=50`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) return [];
  return (await response.json()) as CanvasAssignment[];
}

function inferKind(title: string): AssignmentKind {
  const lower = title.toLowerCase();
  if (/\b(exam|midterm|final|test)\b/.test(lower)) return AssignmentKind.TEST;
  if (/\bquiz\b/.test(lower)) return AssignmentKind.QUIZ;
  if (/\b(project|portfolio)\b/.test(lower)) return AssignmentKind.PROJECT;
  if (/\b(reading|chapter)\b/.test(lower)) return AssignmentKind.READING;
  return AssignmentKind.ASSIGNMENT;
}

function formatSyncMessage(
  providerLabel: string,
  coursesFound: number,
  assignmentsImported: number,
  meetingsImported: number,
): string {
  const courseLabel = `${coursesFound} ${providerLabel} course${coursesFound === 1 ? "" : "s"}`;
  const parts = [`Synced ${courseLabel}`];

  if (assignmentsImported > 0) {
    parts.push(
      `imported ${assignmentsImported} new assignment${assignmentsImported === 1 ? "" : "s"}`,
    );
  }

  if (meetingsImported > 0) {
    parts.push(
      `imported ${meetingsImported} class meeting${meetingsImported === 1 ? "" : "s"}`,
    );
  }

  return `${parts.join(" and ")}.`;
}

export interface LmsSyncStats {
  provider: LMSProvider;
  coursesFound: number;
  coursesCreated: number;
  assignmentsImported: number;
  gradesUpdated: number;
  meetingsImported: number;
  message: string;
  usedDemo: boolean;
}

export async function syncCanvasConnection(
  userId: string,
  baseUrl: string,
  accessToken: string,
): Promise<LmsSyncStats> {
  const canvasCourses = await fetchCanvasCourses(baseUrl, accessToken);
  let coursesCreated = 0;
  let assignmentsImported = 0;
  let gradesUpdated = 0;
  let meetingsImported = 0;

  for (const canvasCourse of canvasCourses) {
    let course = await db.course.findFirst({
      where: { userId, title: canvasCourse.name },
    });

    if (!course && canvasCourse.course_code) {
      course = await db.course.findFirst({
        where: { userId, code: canvasCourse.course_code },
      });
    }

    if (!course) {
      course = await db.course.create({
        data: {
          userId,
          title: canvasCourse.name,
          code: canvasCourse.course_code ?? null,
          description: `Imported from Canvas (course id ${canvasCourse.id})`,
          color: "#6366f1",
        },
      });
      coursesCreated += 1;
    }

    const assignments = await fetchCanvasAssignments(
      baseUrl,
      accessToken,
      canvasCourse.id,
    );

    for (const assignment of assignments) {
      const dueDate = assignment.due_at ? new Date(assignment.due_at) : null;
      const existing = await db.assignment.findFirst({
        where: {
          courseId: course.id,
          title: assignment.name,
          dueDate,
        },
      });

      const score = assignment.submission?.score;
      const maxGrade =
        typeof assignment.points_possible === "number" ? assignment.points_possible : null;
      const graded =
        assignment.submission?.workflow_state === "graded" ||
        (typeof score === "number" && Number.isFinite(score));

      if (existing) {
        if (graded && typeof score === "number") {
          await db.assignment.update({
            where: { id: existing.id },
            data: {
              grade: score,
              maxGrade: maxGrade ?? existing.maxGrade,
              status: AssignmentStatus.GRADED,
            },
          });
          gradesUpdated += 1;
        }
        continue;
      }

      await db.assignment.create({
        data: {
          courseId: course.id,
          title: assignment.name,
          description: assignment.description?.replace(/<[^>]+>/g, " ").slice(0, 2000) ?? null,
          dueDate,
          kind: inferKind(assignment.name),
          status: graded ? AssignmentStatus.GRADED : AssignmentStatus.NOT_STARTED,
          grade: typeof score === "number" ? score : null,
          maxGrade,
        },
      });
      assignmentsImported += 1;
      if (graded) gradesUpdated += 1;
    }

    const meetingSlots = await fetchCanvasCourseMeetings(
      baseUrl,
      accessToken,
      canvasCourse.id,
    );
    meetingsImported += await upsertClassMeetings(course.id, meetingSlots);
  }

  return {
    provider: "CANVAS",
    coursesFound: canvasCourses.length,
    coursesCreated,
    assignmentsImported,
    gradesUpdated,
    meetingsImported,
    usedDemo: false,
    message: formatSyncMessage(
      "Canvas",
      canvasCourses.length,
      assignmentsImported,
      meetingsImported,
    ),
  };
}

interface GoogleCourse {
  id: string;
  name: string;
  section?: string;
  description?: string;
}

interface GoogleCourseWork {
  id: string;
  title: string;
  description?: string;
  dueDate?: { year: number; month: number; day: number };
  dueTime?: { hours: number; minutes: number };
}

export async function syncGoogleClassroomConnection(
  userId: string,
  accessToken: string,
): Promise<LmsSyncStats> {
  const coursesResponse = await fetch(
    "https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=20",
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
  );

  if (!coursesResponse.ok) {
    throw new Error(`Google Classroom API error (${coursesResponse.status})`);
  }

  const coursesPayload = (await coursesResponse.json()) as {
    courses?: GoogleCourse[];
  };
  const googleCourses = coursesPayload.courses ?? [];

  let coursesCreated = 0;
  let assignmentsImported = 0;
  let gradesUpdated = 0;
  let meetingsImported = 0;

  for (const googleCourse of googleCourses) {
    let course = await db.course.findFirst({
      where: { userId, title: googleCourse.name },
    });

    if (!course) {
      course = await db.course.create({
        data: {
          userId,
          title: googleCourse.name,
          code: googleCourse.section ?? null,
          description: `Imported from Google Classroom (${googleCourse.id})`,
          color: "#0d9488",
        },
      });
      coursesCreated += 1;
    }

    const workResponse = await fetch(
      `https://classroom.googleapis.com/v1/courses/${googleCourse.id}/courseWork?pageSize=30`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
    );

    if (!workResponse.ok) continue;

    const workPayload = (await workResponse.json()) as {
      courseWork?: GoogleCourseWork[];
    };

    for (const work of workPayload.courseWork ?? []) {
      let dueDate: Date | null = null;
      if (work.dueDate) {
        dueDate = new Date(
          work.dueDate.year,
          work.dueDate.month - 1,
          work.dueDate.day,
          work.dueTime?.hours ?? 23,
          work.dueTime?.minutes ?? 59,
        );
      }

      let grade: number | null = null;
      let maxGrade: number | null = null;
      try {
        const subResponse = await fetch(
          `https://classroom.googleapis.com/v1/courses/${googleCourse.id}/courseWork/${work.id}/studentSubmissions?userId=me`,
          { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
        );
        if (subResponse.ok) {
          const subPayload = (await subResponse.json()) as {
            studentSubmissions?: Array<{
              assignedGrade?: number;
              draftGrade?: number;
              maxPoints?: number;
            }>;
          };
          const submission = subPayload.studentSubmissions?.[0];
          const rawGrade = submission?.assignedGrade ?? submission?.draftGrade;
          if (typeof rawGrade === "number") {
            grade = rawGrade;
            maxGrade = submission?.maxPoints ?? null;
          }
        }
      } catch {
        // ignore grade fetch errors
      }

      const existing = await db.assignment.findFirst({
        where: { courseId: course.id, title: work.title, dueDate },
      });

      if (existing) {
        if (grade !== null) {
          await db.assignment.update({
            where: { id: existing.id },
            data: {
              grade,
              maxGrade: maxGrade ?? existing.maxGrade,
              status: AssignmentStatus.GRADED,
            },
          });
          gradesUpdated += 1;
        }
        continue;
      }

      await db.assignment.create({
        data: {
          courseId: course.id,
          title: work.title,
          description: work.description?.slice(0, 2000) ?? null,
          dueDate,
          kind: inferKind(work.title),
          status: grade !== null ? AssignmentStatus.GRADED : AssignmentStatus.NOT_STARTED,
          grade,
          maxGrade,
        },
      });
      assignmentsImported += 1;
      if (grade !== null) gradesUpdated += 1;
    }

    if (googleCourse.description) {
      const meetingSlots = parseMeetingScheduleFromText(googleCourse.description);
      meetingsImported += await upsertClassMeetings(course.id, meetingSlots);
    }
  }

  return {
    provider: "GOOGLE_CLASSROOM",
    coursesFound: googleCourses.length,
    coursesCreated,
    assignmentsImported,
    gradesUpdated,
    meetingsImported,
    usedDemo: false,
    message: formatSyncMessage(
      "Google Classroom",
      googleCourses.length,
      assignmentsImported,
      meetingsImported,
    ) + (gradesUpdated > 0 ? ` Updated ${gradesUpdated} grade${gradesUpdated === 1 ? "" : "s"}.` : ""),
  };
}

export async function syncDemoLmsData(
  userId: string,
  provider: LMSProvider,
): Promise<LmsSyncStats> {
  const demoCourses: Array<{
    title: string;
    code: string;
    assignments: Array<{ title: string; days: number }>;
    meetings: ClassMeetingInput[];
  }> = [
    {
      title: "CS 201 — Data Structures",
      code: "CS201",
      assignments: [
        { title: "Lab 4: Binary Search Trees", days: 5 },
        { title: "Midterm Review Quiz", days: 10 },
      ],
      meetings: [
        { dayOfWeek: 1, startTime: "10:00", endTime: "11:15", title: "Lecture" },
        { dayOfWeek: 3, startTime: "10:00", endTime: "11:15", title: "Lecture" },
      ],
    },
    {
      title: "ENG 110 — Composition",
      code: "ENG110",
      assignments: [{ title: "Essay Draft 2", days: 7 }],
      meetings: [
        { dayOfWeek: 2, startTime: "13:00", endTime: "14:30", title: "Seminar" },
        { dayOfWeek: 4, startTime: "13:00", endTime: "14:30", title: "Seminar" },
      ],
    },
  ];

  let coursesCreated = 0;
  let assignmentsImported = 0;
  let meetingsImported = 0;

  for (const demo of demoCourses) {
    let course = await db.course.findFirst({
      where: { userId, code: demo.code },
    });

    if (!course) {
      course = await db.course.create({
        data: {
          userId,
          title: demo.title,
          code: demo.code,
          description: `Demo import from ${provider}`,
          color: "#0d9488",
        },
      });
      coursesCreated += 1;
    }

    for (const item of demo.assignments) {
      const dueDate = new Date(Date.now() + item.days * 24 * 60 * 60 * 1000);
      const exists = await db.assignment.findFirst({
        where: { courseId: course.id, title: item.title },
      });
      if (exists) continue;

      await db.assignment.create({
        data: {
          courseId: course.id,
          title: item.title,
          dueDate,
          kind: inferKind(item.title),
          status: AssignmentStatus.NOT_STARTED,
        },
      });
      assignmentsImported += 1;
    }

    meetingsImported += await upsertClassMeetings(course.id, demo.meetings);
  }

  return {
    provider,
    coursesFound: demoCourses.length,
    coursesCreated,
    assignmentsImported,
    gradesUpdated: 0,
    meetingsImported,
    usedDemo: true,
    message: `Demo sync: added ${assignmentsImported} assignment${assignmentsImported === 1 ? "" : "s"} and ${meetingsImported} class meeting${meetingsImported === 1 ? "" : "s"} from ${provider}. Connect a real LMS URL + token for live import.`,
  };
}

interface BlackboardCourse {
  id: string;
  name: string;
  courseId?: string;
}

export async function fetchBlackboardCourses(baseUrl: string, accessToken: string) {
  const url = `${normalizeBaseUrl(baseUrl)}/learn/api/public/v1/users/me/courses?expand=course`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Blackboard API error (${response.status})`);
  const data = (await response.json()) as { results?: BlackboardCourse[] };
  return data.results ?? [];
}

/** @deprecated Use fetchBlackboardGradebookColumns from blackboard-grades.ts */
export async function fetchBlackboardAssignments(
  baseUrl: string,
  accessToken: string,
  courseId: string,
) {
  return fetchBlackboardGradebookColumns(baseUrl, accessToken, courseId);
}

export async function syncBlackboardConnection(
  userId: string,
  baseUrl: string,
  accessToken: string,
): Promise<LmsSyncStats> {
  const [bbCourses, bbUserId] = await Promise.all([
    fetchBlackboardCourses(baseUrl, accessToken),
    fetchBlackboardUserId(baseUrl, accessToken),
  ]);

  let coursesCreated = 0;
  let assignmentsImported = 0;
  let gradesUpdated = 0;
  let meetingsImported = 0;

  for (const bbCourse of bbCourses) {
    const courseKey = bbCourse.courseId ?? bbCourse.id;
    let course = await db.course.findFirst({
      where: { userId, title: bbCourse.name },
    });

    if (!course) {
      course = await db.course.create({
        data: {
          userId,
          title: bbCourse.name,
          code: courseKey,
          description: `Imported from Blackboard (${courseKey})`,
          color: "#7c3aed",
        },
      });
      coursesCreated += 1;
    }

    const columns = await fetchBlackboardGradebookColumns(baseUrl, accessToken, courseKey);

    for (const column of columns) {
      const dueDate = column.dueDate ? new Date(column.dueDate) : null;

      let grade: number | null = null;
      let maxGrade: number | null = column.scorePossible ?? null;
      let graded = false;
      let gradeLetter: string | null = null;

      if (bbUserId) {
        const userGrade = await fetchBlackboardUserColumnGrade(
          baseUrl,
          accessToken,
          courseKey,
          column.id,
          bbUserId,
        );
        const parsed = parseBlackboardUserGrade(userGrade, column.scorePossible);
        grade = parsed.grade;
        maxGrade = parsed.maxGrade ?? maxGrade;
        graded = parsed.graded;
        gradeLetter = parsed.letter;
      }

      const existing = await db.assignment.findFirst({
        where: { courseId: course.id, title: column.name },
      });

      if (existing) {
        if (graded) {
          await db.assignment.update({
            where: { id: existing.id },
            data: {
              grade,
              maxGrade: maxGrade ?? existing.maxGrade,
              status: AssignmentStatus.GRADED,
              dueDate: dueDate ?? existing.dueDate,
              description:
                gradeLetter && grade === null
                  ? appendGradeNote(existing.description, gradeLetter)
                  : existing.description,
            },
          });
          gradesUpdated += 1;
        }
        continue;
      }

      await db.assignment.create({
        data: {
          courseId: course.id,
          title: column.name,
          dueDate,
          kind: inferKind(column.name),
          status: graded ? AssignmentStatus.GRADED : AssignmentStatus.NOT_STARTED,
          grade,
          maxGrade,
          description: gradeLetter && grade === null ? `Grade: ${gradeLetter}` : null,
        },
      });
      assignmentsImported += 1;
      if (graded) gradesUpdated += 1;
    }

    const meetingSlots = await fetchBlackboardCourseMeetings(
      baseUrl,
      accessToken,
      courseKey,
    );
    meetingsImported += await upsertClassMeetings(course.id, meetingSlots);
  }

  return {
    provider: "BLACKBOARD",
    coursesFound: bbCourses.length,
    coursesCreated,
    assignmentsImported,
    gradesUpdated,
    meetingsImported,
    usedDemo: false,
    message:
      formatSyncMessage("Blackboard", bbCourses.length, assignmentsImported, meetingsImported) +
      (gradesUpdated > 0 ? ` Updated ${gradesUpdated} grade${gradesUpdated === 1 ? "" : "s"}.` : ""),
  };
}

function appendGradeNote(description: string | null | undefined, letter: string) {
  const note = `Grade: ${letter}`;
  if (!description?.trim()) return note;
  if (description.includes(note)) return description;
  return `${description}\n${note}`;
}

export async function syncMoodleConnection(
  userId: string,
  baseUrl: string,
  accessToken: string,
): Promise<LmsSyncStats> {
  const root = normalizeMoodleBaseUrl(baseUrl);
  const token = accessToken.trim();
  const importPayload = await collectMoodleCoursesForImport(root, token);
  return importMoodleCourses(userId, importPayload);
}

export async function syncUserLmsProvider(
  userId: string,
  provider: LMSProvider,
  options?: { demo?: boolean },
): Promise<LmsSyncStats> {
  const useDemo = options?.demo === true;

  if (!useDemo && provider === LMSProvider.MOODLE) {
    const credentials = await resolveMoodleCredentials(userId);
    if (!credentials) {
      throw new Error(
        "Connect your LMS first (URL + access token), or set MOODLE_URL and MOODLE_TOKEN in .env.",
      );
    }

    const result = await syncMoodleConnection(
      userId,
      credentials.baseUrl,
      credentials.accessToken,
    );

    const connection = await db.lMSConnection.findFirst({
      where: { userId, provider: LMSProvider.MOODLE },
    });
    if (connection) {
      await db.lMSConnection.update({
        where: { id: connection.id },
        data: { lastSyncedAt: new Date(), status: "connected" },
      });
    }

    return result;
  }

  const connection = await db.lMSConnection.findFirst({
    where: { userId, provider },
  });

  if (!connection || connection.status !== "connected") {
    throw new Error("Connect your LMS first (URL + access token).");
  }

  let result: LmsSyncStats;

  if (
    !useDemo &&
    provider === LMSProvider.CANVAS &&
    connection.baseUrl &&
    connection.accessToken
  ) {
    try {
      result = await syncCanvasConnection(
        userId,
        connection.baseUrl,
        connection.accessToken,
      );
    } catch (error) {
      console.warn("Canvas sync failed:", error);
      throw error instanceof Error ? error : new Error("Canvas sync failed.");
    }
  } else if (
    !useDemo &&
    provider === LMSProvider.GOOGLE_CLASSROOM &&
    connection.accessToken
  ) {
    try {
      result = await syncGoogleClassroomConnection(userId, connection.accessToken);
    } catch (error) {
      console.warn("Google Classroom sync failed:", error);
      throw error instanceof Error ? error : new Error("Google Classroom sync failed.");
    }
  } else if (
    !useDemo &&
    provider === LMSProvider.BLACKBOARD &&
    connection.baseUrl &&
    connection.accessToken
  ) {
    try {
      result = await syncBlackboardConnection(
        userId,
        connection.baseUrl,
        connection.accessToken,
      );
    } catch (error) {
      console.warn("Blackboard sync failed:", error);
      throw error instanceof Error ? error : new Error("Blackboard sync failed.");
    }
  } else if (
    useDemo &&
    provider === LMSProvider.MOODLE
  ) {
    result = await syncDemoLmsData(userId, provider);
  } else {
    result = await syncDemoLmsData(userId, provider);
  }

  await db.lMSConnection.update({
    where: { id: connection.id },
    data: { lastSyncedAt: new Date() },
  });

  return result;
}
