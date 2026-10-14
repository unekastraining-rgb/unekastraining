import { AssignmentKind, AssignmentStatus, LMSProvider, MaterialType } from "@/generated/prisma";
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
import { enrichCourseFromSyllabus, seedTopicsFromSyllabusOutline } from "@/lib/syllabus/enrich-course-from-syllabus";
import { buildCanvasColdStartSyllabusText, canvasSyllabusMaterialMeta, formatCanvasModuleOutline } from "@/lib/lms/canvas-cold-start";
import {
  blackboardSyllabusMaterialMeta,
  buildBlackboardColdStartText,
} from "@/lib/lms/blackboard-cold-start";
import {
  buildGoogleClassroomColdStartText,
  googleClassroomSyllabusMaterialMeta,
} from "@/lib/lms/google-classroom-cold-start";
import { upsertLmsSyllabusMaterial } from "@/lib/lms/upsert-lms-syllabus-material";
import { formatColdStartSyncMessage } from "@/lib/lms/cold-start-sync-message";
import { lmsColdStartCourseEntry } from "@/lib/lms/cold-start-course-entry";
import { buildDemoCanvasSyllabus, demoColdStartCourseEntry } from "@/lib/lms/demo-cold-start";
import { openLmsToken } from "@/lib/security/lms-token-crypto";

export { formatColdStartSyncMessage } from "@/lib/lms/cold-start-sync-message";

export interface CanvasCourse {
  id: number;
  name: string;
  course_code?: string;
  syllabus_body?: string | null;
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
  const url = `${normalizeBaseUrl(baseUrl)}/api/v1/courses?enrollment_state=active&include[]=syllabus_body&per_page=50`;
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

/** Module names as a cold-start outline when syllabus_body is empty. */
export async function fetchCanvasModuleOutline(
  baseUrl: string,
  accessToken: string,
  courseId: number,
): Promise<string> {
  const url = `${normalizeBaseUrl(baseUrl)}/api/v1/courses/${courseId}/modules?per_page=50`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return "";

  const modules = (await response.json()) as Array<{ name?: string; position?: number }>;
  return formatCanvasModuleOutline(modules);
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
  /** Demo/LMS cold start: course ids + first syllabus topic for Core→Six→Lucky links. */
  coldStartCourses?: Array<{
    id: string;
    title: string;
    focusTopic: string | null;
  }>;
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
  let syllabiImported = 0;
  let topicsCreated = 0;
  const coldStartCourseTitles: string[] = [];
  const coldStartCourses: NonNullable<LmsSyncStats["coldStartCourses"]> = [];

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

    // Cold start: syllabus body and/or module outline → SYLLABUS material + topics
    let modulesOutline = "";
    const thinSyllabus =
      !(canvasCourse.syllabus_body?.trim()) ||
      buildCanvasColdStartSyllabusText({
        courseName: canvasCourse.name,
        syllabusHtml: canvasCourse.syllabus_body,
      }).text.length < 80;

    if (thinSyllabus) {
      modulesOutline = await fetchCanvasModuleOutline(
        baseUrl,
        accessToken,
        canvasCourse.id,
      );
    }

    const coldStart = buildCanvasColdStartSyllabusText({
      courseName: canvasCourse.name,
      syllabusHtml: canvasCourse.syllabus_body,
      modulesOutline,
    });

    if (coldStart.seeded) {
      const syllabusText = coldStart.text;
      const { title: syllabusTitle, url: syllabusUrl } = canvasSyllabusMaterialMeta({
        baseUrl,
        courseId: canvasCourse.id,
        courseName: canvasCourse.name,
        courseCode: canvasCourse.course_code ?? null,
      });
      const upserted = await upsertLmsSyllabusMaterial({
        courseId: course.id,
        title: syllabusTitle,
        url: syllabusUrl,
        extractedText: syllabusText,
      });
      if (upserted === "created") syllabiImported += 1;

      topicsCreated += await enrichTopicsFromLmsSyllabus({
        userId,
        courseId: course.id,
        syllabusText,
        courseTitle: canvasCourse.name,
        courseCode: canvasCourse.course_code ?? null,
        label: "Canvas",
      });

      const fromSyllabus = parseMeetingScheduleFromText(syllabusText);
      meetingsImported += await upsertClassMeetings(course.id, fromSyllabus);
      coldStartCourseTitles.push(canvasCourse.name);
      coldStartCourses.push(
        lmsColdStartCourseEntry(course.id, canvasCourse.name, syllabusText),
      );
    }
  }

  const baseMessage = formatSyncMessage(
    "Canvas",
    canvasCourses.length,
    assignmentsImported,
    meetingsImported,
  );

  return {
    provider: "CANVAS",
    coursesFound: canvasCourses.length,
    coursesCreated,
    assignmentsImported,
    gradesUpdated,
    meetingsImported,
    usedDemo: false,
    coldStartCourses: coldStartCourses.length > 0 ? coldStartCourses : undefined,
    message: formatColdStartSyncMessage(baseMessage, {
      syllabiImported,
      topicsCreated,
      courseTitles: coldStartCourseTitles,
    }),
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
  materials?: Array<{
    link?: { url?: string | null; title?: string | null } | null;
    youtubeVideo?: { alternateLink?: string | null; title?: string | null } | null;
    driveFile?: {
      driveFile?: { title?: string | null; alternateLink?: string | null } | null;
    } | null;
  }>;
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
  let syllabiImported = 0;
  let topicsCreated = 0;
  const coldStartCourseTitles: string[] = [];
  const coldStartCourses: NonNullable<LmsSyncStats["coldStartCourses"]> = [];

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

    const courseWork: GoogleCourseWork[] = workResponse.ok
      ? (((await workResponse.json()) as { courseWork?: GoogleCourseWork[] })
          .courseWork ?? [])
      : [];

    for (const work of courseWork) {
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

    // Cold start: description + coursework outline → CourseMaterial + topics
    const coldStart = buildGoogleClassroomColdStartText({
      courseName: googleCourse.name,
      section: googleCourse.section,
      description: googleCourse.description,
      courseWork,
    });

    if (coldStart.seeded) {
      const { title: syllabusTitle, url: syllabusUrl } =
        googleClassroomSyllabusMaterialMeta({
          googleCourseId: googleCourse.id,
          courseName: googleCourse.name,
          section: googleCourse.section,
        });
      const upserted = await upsertLmsSyllabusMaterial({
        courseId: course.id,
        title: syllabusTitle,
        url: syllabusUrl,
        extractedText: coldStart.text,
      });
      if (upserted === "created") syllabiImported += 1;

      topicsCreated += await enrichTopicsFromLmsSyllabus({
        userId,
        courseId: course.id,
        syllabusText: coldStart.text,
        courseTitle: googleCourse.name,
        courseCode: googleCourse.section ?? null,
        label: "Google Classroom",
      });

      coldStartCourseTitles.push(googleCourse.name);
      coldStartCourses.push(
        lmsColdStartCourseEntry(course.id, googleCourse.name, coldStart.text),
      );
    }
  }

  const baseMessage =
    formatSyncMessage(
      "Google Classroom",
      googleCourses.length,
      assignmentsImported,
      meetingsImported,
    ) +
    (gradesUpdated > 0
      ? ` Updated ${gradesUpdated} grade${gradesUpdated === 1 ? "" : "s"}.`
      : "");

  return {
    provider: "GOOGLE_CLASSROOM",
    coursesFound: googleCourses.length,
    coursesCreated,
    assignmentsImported,
    gradesUpdated,
    meetingsImported,
    usedDemo: false,
    coldStartCourses: coldStartCourses.length > 0 ? coldStartCourses : undefined,
    message: formatColdStartSyncMessage(baseMessage, {
      syllabiImported,
      topicsCreated,
      courseTitles: coldStartCourseTitles,
    }),
  };
}

export async function syncDemoLmsData(
  userId: string,
  provider: LMSProvider,
): Promise<LmsSyncStats> {
  const demoCourses: Array<{
    title: string;
    code: "CS201" | "ENG110";
    syllabusText: string;
    assignments: Array<{ title: string; days: number }>;
    meetings: ClassMeetingInput[];
  }> = [
    {
      title: "CS 201 — Data Structures",
      code: "CS201",
      syllabusText: buildDemoCanvasSyllabus("CS201"),
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
      syllabusText: buildDemoCanvasSyllabus("ENG110"),
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
  let syllabiImported = 0;
  let topicsCreated = 0;
  const coldStartCourseTitles: string[] = [];
  const coldStartCourses: Array<{ id: string; title: string; focusTopic: string | null }> =
    [];

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

    // Cold start: syllabus material + topics so Blurt / Study from topics work without uploads.
    const syllabusTitle = `${demo.code} Syllabus (demo)`;
    const existingSyllabus = await db.courseMaterial.findFirst({
      where: { courseId: course.id, title: syllabusTitle },
      select: { id: true },
    });
    if (!existingSyllabus) {
      await db.courseMaterial.create({
        data: {
          courseId: course.id,
          title: syllabusTitle,
          type: MaterialType.SYLLABUS,
          extractedText: demo.syllabusText,
          sortOrder: 0,
        },
      });
      syllabiImported += 1;
    } else {
      await db.courseMaterial.update({
        where: { id: existingSyllabus.id },
        data: { extractedText: demo.syllabusText, type: MaterialType.SYLLABUS },
      });
    }

    try {
      const enriched = await enrichCourseFromSyllabus({
        userId,
        courseId: course.id,
        syllabusText: demo.syllabusText,
        courseTitle: demo.title,
        courseCode: demo.code,
        force: true,
      });
      topicsCreated += enriched.topicsCreated;
      if (enriched.topicsCreated === 0) {
        topicsCreated += await seedTopicsFromSyllabusOutline(course.id, demo.syllabusText);
      }
    } catch (error) {
      console.warn("Demo syllabus topic enrich failed:", error);
      try {
        topicsCreated += await seedTopicsFromSyllabusOutline(course.id, demo.syllabusText);
      } catch (seedError) {
        console.warn("Demo syllabus outline topic seed failed:", seedError);
      }
    }

    coldStartCourseTitles.push(demo.title);
    coldStartCourses.push(demoColdStartCourseEntry(course.id, demo.title, demo.code));
  }

  const demoBase = `Demo sync (${provider}): added ${assignmentsImported} assignment${assignmentsImported === 1 ? "" : "s"}, ${meetingsImported} meeting${meetingsImported === 1 ? "" : "s"}`;

  return {
    provider,
    coursesFound: demoCourses.length,
    coursesCreated,
    assignmentsImported,
    gradesUpdated: 0,
    meetingsImported,
    usedDemo: true,
    coldStartCourses,
    message:
      coldStartCourseTitles.length > 0
        ? `${formatColdStartSyncMessage(`${demoBase}.`, {
            syllabiImported,
            topicsCreated,
            courseTitles: coldStartCourseTitles,
          })} Connect a real LMS URL + token for live import.`
        : `${demoBase}. Connect a real LMS URL + token for live import.`,
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
  let syllabiImported = 0;
  let topicsCreated = 0;
  const coldStartCourseTitles: string[] = [];
  const coldStartCourses: NonNullable<LmsSyncStats["coldStartCourses"]> = [];

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

    // Cold start: gradebook columns + meetings → CourseMaterial + topics
    const coldStart = buildBlackboardColdStartText({
      courseName: bbCourse.name,
      courseKey,
      columns,
      meetings: meetingSlots,
    });

    if (coldStart.seeded) {
      const { title: syllabusTitle, url: syllabusUrl } =
        blackboardSyllabusMaterialMeta({
          baseUrl,
          courseKey,
          courseName: bbCourse.name,
        });
      const upserted = await upsertLmsSyllabusMaterial({
        courseId: course.id,
        title: syllabusTitle,
        url: syllabusUrl,
        extractedText: coldStart.text,
      });
      if (upserted === "created") syllabiImported += 1;

      topicsCreated += await enrichTopicsFromLmsSyllabus({
        userId,
        courseId: course.id,
        syllabusText: coldStart.text,
        courseTitle: bbCourse.name,
        courseCode: courseKey,
        label: "Blackboard",
      });

      coldStartCourseTitles.push(bbCourse.name);
      coldStartCourses.push(
        lmsColdStartCourseEntry(course.id, bbCourse.name, coldStart.text),
      );
    }
  }

  const baseMessage =
    formatSyncMessage(
      "Blackboard",
      bbCourses.length,
      assignmentsImported,
      meetingsImported,
    ) +
    (gradesUpdated > 0
      ? ` Updated ${gradesUpdated} grade${gradesUpdated === 1 ? "" : "s"}.`
      : "");

  return {
    provider: "BLACKBOARD",
    coursesFound: bbCourses.length,
    coursesCreated,
    assignmentsImported,
    gradesUpdated,
    meetingsImported,
    usedDemo: false,
    coldStartCourses: coldStartCourses.length > 0 ? coldStartCourses : undefined,
    message: formatColdStartSyncMessage(baseMessage, {
      syllabiImported,
      topicsCreated,
      courseTitles: coldStartCourseTitles,
    }),
  };
}

/** Shared topic enrichment used by Canvas / Google Classroom / Blackboard cold start. */
async function enrichTopicsFromLmsSyllabus(input: {
  userId: string;
  courseId: string;
  syllabusText: string;
  courseTitle: string;
  courseCode?: string | null;
  label: string;
}): Promise<number> {
  let topicsCreated = 0;
  try {
    const enriched = await enrichCourseFromSyllabus({
      userId: input.userId,
      courseId: input.courseId,
      syllabusText: input.syllabusText,
      courseTitle: input.courseTitle,
      courseCode: input.courseCode ?? null,
    });
    topicsCreated += enriched.topicsCreated;
    if (enriched.topicsCreated === 0) {
      topicsCreated += await seedTopicsFromSyllabusOutline(
        input.courseId,
        input.syllabusText,
      );
    }
  } catch (error) {
    console.warn(`${input.label} syllabus topic enrich failed:`, error);
    try {
      topicsCreated += await seedTopicsFromSyllabusOutline(
        input.courseId,
        input.syllabusText,
      );
    } catch (seedError) {
      console.warn(`${input.label} syllabus outline topic seed failed:`, seedError);
    }
  }
  return topicsCreated;
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

  if (useDemo) {
    const result = await syncDemoLmsData(userId, provider);
    const connection = await db.lMSConnection.findFirst({
      where: { userId, provider },
    });
    if (connection) {
      await db.lMSConnection.update({
        where: { id: connection.id },
        data: { lastSyncedAt: new Date() },
      });
    }
    return result;
  }

  if (provider === LMSProvider.MOODLE) {
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

  const accessToken = openLmsToken(connection.accessToken);
  if (!accessToken) {
    throw new Error("Connect your LMS first (URL + access token).");
  }

  let result: LmsSyncStats;

  if (
    provider === LMSProvider.CANVAS &&
    connection.baseUrl &&
    accessToken
  ) {
    try {
      result = await syncCanvasConnection(
        userId,
        connection.baseUrl,
        accessToken,
      );
    } catch (error) {
      console.warn("Canvas sync failed:", error);
      throw error instanceof Error ? error : new Error("Canvas sync failed.");
    }
  } else if (
    provider === LMSProvider.GOOGLE_CLASSROOM &&
    accessToken
  ) {
    try {
      result = await syncGoogleClassroomConnection(userId, accessToken);
    } catch (error) {
      console.warn("Google Classroom sync failed:", error);
      throw error instanceof Error ? error : new Error("Google Classroom sync failed.");
    }
  } else if (
    provider === LMSProvider.BLACKBOARD &&
    connection.baseUrl &&
    accessToken
  ) {
    try {
      result = await syncBlackboardConnection(
        userId,
        connection.baseUrl,
        accessToken,
      );
    } catch (error) {
      console.warn("Blackboard sync failed:", error);
      throw error instanceof Error ? error : new Error("Blackboard sync failed.");
    }
  } else {
    throw new Error(`Unsupported LMS provider: ${provider}`);
  }

  await db.lMSConnection.update({
    where: { id: connection.id },
    data: { lastSyncedAt: new Date() },
  });

  return result;
}
