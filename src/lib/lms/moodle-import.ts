import { AssignmentKind, AssignmentStatus, MaterialType } from "@/generated/prisma";
import { readableCourseCode, readableCourseTitle } from "@/lib/courses/display-name";
import { db } from "@/lib/db";
import {
  calendarEventsToWeeklyMeetings,
  isWeeklyClassEventTitle,
  parseMeetingScheduleFromText,
  upsertClassMeetings,
} from "@/lib/lms/meetings";
import type { MoodleAssignment, MoodleCalendarEvent, MoodleCourse } from "@/lib/lms/moodle-api";
import { buildMoodleColdStartSyllabusText } from "@/lib/lms/moodle-cold-start";
import { extractInstructorFromText } from "@/lib/lms/moodle-syllabus";
import {
  enrichCourseFromSyllabus,
  seedTopicsFromSyllabusOutline,
} from "@/lib/syllabus/enrich-course-from-syllabus";
import { syncCourseInfoAfterMoodleImport } from "@/lib/lms/course-info/sync-course-info";
import { formatColdStartSyncMessage } from "@/lib/lms/cold-start-sync-message";
import { lmsColdStartCourseEntry } from "@/lib/lms/cold-start-course-entry";
import type { LmsSyncStats } from "@/lib/lms/sync";

function inferKind(title: string, fallback: AssignmentKind = AssignmentKind.ASSIGNMENT): AssignmentKind {
  const lower = title.toLowerCase();
  if (/\b(exam|midterm|final|test)\b/.test(lower)) return AssignmentKind.TEST;
  if (/\bquiz\b/.test(lower)) return AssignmentKind.QUIZ;
  if (/\b(project|portfolio|business plan)\b/.test(lower)) return AssignmentKind.PROJECT;
  if (/\b(reading|chapter|podcast)\b/.test(lower)) return AssignmentKind.READING;
  return fallback;
}

function formatSyncMessage(
  coursesFound: number,
  assignmentsImported: number,
  meetingsImported: number,
  gradesUpdated: number,
  syllabiImported: number,
  plansGenerated: number,
  topicsCreated: number,
  courseTitles: string[],
): string {
  const parts = [`Synced ${coursesFound} Moodle course${coursesFound === 1 ? "" : "s"}`];
  if (assignmentsImported > 0) {
    parts.push(
      `imported ${assignmentsImported} new assignment${assignmentsImported === 1 ? "" : "s"}`,
    );
  }
  if (syllabiImported > 0) {
    parts.push(`imported ${syllabiImported} syllab${syllabiImported === 1 ? "us" : "i"}`);
  }
  if (plansGenerated > 0) {
    parts.push(`built ${plansGenerated} AI study plan${plansGenerated === 1 ? "" : "s"}`);
  }
  if (meetingsImported > 0) {
    parts.push(
      `imported ${meetingsImported} class meeting${meetingsImported === 1 ? "" : "s"}`,
    );
  }
  let message = `${parts.join(", ")}.`;
  if (gradesUpdated > 0) {
    message += ` Updated ${gradesUpdated} grade${gradesUpdated === 1 ? "" : "s"}.`;
  }
  return formatColdStartSyncMessage(message, {
    syllabiImported,
    topicsCreated,
    courseTitles,
  });
}

export interface MoodleImportAssignment extends Omit<MoodleAssignment, "grade"> {
  grade?: number | null;
  maxGrade?: number | null;
}

export interface MoodleImportCourse extends MoodleCourse {
  assignments: MoodleImportAssignment[];
  calendarEvents: MoodleCalendarEvent[];
  calendarAssignments?: Array<{
    name: string;
    duedate: number;
    kind: "quiz" | "assignment";
    intro?: string;
  }>;
  syllabusText?: string | null;
  syllabusUrl?: string | null;
  syllabusModuleName?: string | null;
  /** Section/module outline for Study topic cold start when syllabus is thin. */
  modulesOutline?: string | null;
}

async function upsertAssignment(
  courseId: string,
  title: string,
  dueDate: Date | null,
  description: string | null,
  kind: AssignmentKind,
  grade: number | null,
  maxGrade: number | null,
): Promise<{ imported: boolean; gradeUpdated: boolean }> {
  const existing = await db.assignment.findFirst({
    where: { courseId, title, dueDate },
  });

  if (existing) {
    if (grade !== null && Number.isFinite(grade)) {
      await db.assignment.update({
        where: { id: existing.id },
        data: {
          grade,
          maxGrade: maxGrade ?? existing.maxGrade,
          status: AssignmentStatus.GRADED,
        },
      });
      return { imported: false, gradeUpdated: true };
    }
    return { imported: false, gradeUpdated: false };
  }

  await db.assignment.create({
    data: {
      courseId,
      title,
      description,
      dueDate,
      kind,
      status:
        grade !== null && Number.isFinite(grade)
          ? AssignmentStatus.GRADED
          : AssignmentStatus.NOT_STARTED,
      grade: grade !== null && Number.isFinite(grade) ? grade : null,
      maxGrade,
    },
  });

  return {
    imported: true,
    gradeUpdated: grade !== null && Number.isFinite(grade),
  };
}

function shouldRefreshInstructor(
  current: string | null | undefined,
  next: string | null,
): boolean {
  if (!next) return false;
  if (!current?.trim()) return true;
  if (/^meet instructor/i.test(current)) return true;
  return next.length > current.length + 8;
}

export async function importMoodleCourses(
  userId: string,
  courses: MoodleImportCourse[],
): Promise<LmsSyncStats> {
  let coursesCreated = 0;
  let assignmentsImported = 0;
  let gradesUpdated = 0;
  let meetingsImported = 0;
  let syllabiImported = 0;
  let plansGenerated = 0;
  let topicsCreated = 0;
  const courseTitles: string[] = [];
  const coldStartCourses: NonNullable<LmsSyncStats["coldStartCourses"]> = [];

  for (const moodleCourse of courses) {
    const displayTitle = readableCourseTitle(
      moodleCourse.fullname,
      moodleCourse.shortname ?? null,
    );
    const displayCode =
      readableCourseCode({
        code: moodleCourse.shortname ?? null,
        title: moodleCourse.fullname,
      }) ??
      moodleCourse.shortname ??
      String(moodleCourse.id);
    const instructor = moodleCourse.syllabusText
      ? extractInstructorFromText(moodleCourse.syllabusText)
      : null;

    let course =
      (await db.course.findFirst({
        where: { userId, moodleCourseId: moodleCourse.id },
      })) ??
      (await db.course.findFirst({
        where: { userId, title: moodleCourse.fullname },
      })) ??
      (await db.course.findFirst({
        where: { userId, title: displayTitle },
      }));

    if (!course) {
      course = await db.course.create({
        data: {
          userId,
          title: displayTitle,
          code: displayCode,
          description: `Imported from Moodle (${moodleCourse.id})`,
          instructor,
          moodleCourseId: moodleCourse.id,
          color: "#ea580c",
        },
      });
      coursesCreated += 1;
    } else {
      await db.course.update({
        where: { id: course.id },
        data: {
          moodleCourseId: moodleCourse.id,
          title: displayTitle,
          code: displayCode,
          ...(instructor && shouldRefreshInstructor(course.instructor, instructor)
            ? { instructor }
            : {}),
        },
      });
      course = {
        ...course,
        title: displayTitle,
        code: displayCode,
        ...(instructor && shouldRefreshInstructor(course.instructor, instructor)
          ? { instructor }
          : {}),
      };
    }
    courseTitles.push(displayTitle);

    const assignTitles = new Set<string>();

    for (const assignment of moodleCourse.assignments) {
      assignTitles.add(assignment.name.toLowerCase());
      const dueDate = assignment.duedate ? new Date(assignment.duedate * 1000) : null;
      const grade = assignment.grade ?? null;
      const maxGrade = assignment.maxGrade ?? null;
      const result = await upsertAssignment(
        course.id,
        assignment.name,
        dueDate,
        assignment.intro?.replace(/<[^>]+>/g, " ").slice(0, 2000) ?? null,
        inferKind(assignment.name),
        grade,
        maxGrade,
      );
      if (result.imported) assignmentsImported += 1;
      if (result.gradeUpdated) gradesUpdated += 1;
    }

    for (const calendarAssignment of moodleCourse.calendarAssignments ?? []) {
      const normalized = calendarAssignment.name.toLowerCase();
      if ([...assignTitles].some((title) => normalized.includes(title) || title.includes(normalized))) {
        continue;
      }

      const dueDate = new Date(calendarAssignment.duedate * 1000);
      const kind =
        calendarAssignment.kind === "quiz" ? AssignmentKind.QUIZ : AssignmentKind.ASSIGNMENT;
      const result = await upsertAssignment(
        course.id,
        calendarAssignment.name,
        dueDate,
        calendarAssignment.intro?.replace(/<[^>]+>/g, " ").slice(0, 2000) ?? null,
        inferKind(calendarAssignment.name, kind),
        null,
        null,
      );
      if (result.imported) assignmentsImported += 1;
    }

    const coldStart = buildMoodleColdStartSyllabusText({
      courseName: displayTitle,
      syllabusText: moodleCourse.syllabusText,
      modulesOutline: moodleCourse.modulesOutline,
    });
    const syllabusText = coldStart.text;

    if (coldStart.seeded) {
      const syllabusTitle =
        moodleCourse.syllabusModuleName ??
        (coldStart.usedModules
          ? `${displayTitle} modules`
          : `${displayTitle} Syllabus`);
      const existingSyllabus = await db.courseMaterial.findFirst({
        where: { courseId: course.id, type: MaterialType.SYLLABUS },
      });

      if (existingSyllabus) {
        await db.courseMaterial.update({
          where: { id: existingSyllabus.id },
          data: {
            title: syllabusTitle,
            url: moodleCourse.syllabusUrl,
            extractedText: syllabusText,
          },
        });
      } else {
        await db.courseMaterial.create({
          data: {
            courseId: course.id,
            title: syllabusTitle,
            type: MaterialType.SYLLABUS,
            url: moodleCourse.syllabusUrl,
            extractedText: syllabusText,
            sortOrder: 0,
          },
        });
        syllabiImported += 1;
      }
    }

    // Drop prior mis-imports (e.g. discussion forum dues turned into weekly meetings).
    const existingMeetings = await db.classMeeting.findMany({
      where: { courseId: course.id },
      select: { id: true, title: true },
    });
    const staleMeetingIds = existingMeetings
      .filter((meeting) => meeting.title && !isWeeklyClassEventTitle(meeting.title))
      .map((meeting) => meeting.id);
    if (staleMeetingIds.length > 0) {
      await db.classMeeting.deleteMany({
        where: { id: { in: staleMeetingIds } },
      });
    }

    const events = moodleCourse.calendarEvents.map((event) => {
      const startAt = new Date(event.timestart * 1000);
      const endAt = new Date(
        (event.timestart + (event.timeduration ?? 3600)) * 1000,
      );
      return {
        title: event.name,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        location_name: event.location ?? null,
        rrule: null,
      };
    });

    meetingsImported += await upsertClassMeetings(
      course.id,
      calendarEventsToWeeklyMeetings(events),
    );

    if (moodleCourse.syllabusText) {
      const fromSyllabus = parseMeetingScheduleFromText(moodleCourse.syllabusText);
      meetingsImported += await upsertClassMeetings(course.id, fromSyllabus);
    }

    if (coldStart.seeded) {
      try {
        const enriched = await enrichCourseFromSyllabus({
          userId,
          courseId: course.id,
          syllabusText,
          courseTitle: displayTitle,
          courseCode: displayCode,
          instructor: course.instructor,
        });
        if (enriched.planGenerated) plansGenerated += 1;
        topicsCreated += enriched.topicsCreated;
      } catch (error) {
        console.warn("Syllabus AI enrichment failed for course", course.id, error);
      }

      // Prefer real Moodle module sections over generic "Course outcomes" fallbacks.
      if (coldStart.usedModules && moodleCourse.modulesOutline?.trim()) {
        await db.topic.deleteMany({
          where: {
            courseId: course.id,
            name: {
              in: [
                "Course outcomes",
                "Readings & modules",
                "Assignments & projects",
                "Exams & quizzes",
              ],
            },
          },
        });
        topicsCreated += await seedTopicsFromSyllabusOutline(
          course.id,
          moodleCourse.modulesOutline,
        );
      } else {
        topicsCreated += await seedTopicsFromSyllabusOutline(course.id, syllabusText);
      }

      coldStartCourses.push(
        lmsColdStartCourseEntry(
          course.id,
          displayTitle,
          moodleCourse.modulesOutline?.trim() || syllabusText,
        ),
      );
    }

    try {
      await syncCourseInfoAfterMoodleImport(userId, course.id, moodleCourse.id);
    } catch (error) {
      console.warn("Course info sync failed for Moodle course", moodleCourse.id, error);
    }
  }

  return {
    provider: "MOODLE",
    coursesFound: courses.length,
    coursesCreated,
    assignmentsImported,
    gradesUpdated,
    meetingsImported,
    usedDemo: false,
    coldStartCourses: coldStartCourses.length > 0 ? coldStartCourses : undefined,
    message: formatSyncMessage(
      courses.length,
      assignmentsImported,
      meetingsImported,
      gradesUpdated,
      syllabiImported,
      plansGenerated,
      topicsCreated,
      courseTitles,
    ),
  };
}
