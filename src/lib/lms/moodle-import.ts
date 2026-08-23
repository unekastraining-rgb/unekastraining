import { AssignmentKind, AssignmentStatus, MaterialType } from "@/generated/prisma";
import { db } from "@/lib/db";
import {
  calendarEventsToWeeklyMeetings,
  parseMeetingScheduleFromText,
  upsertClassMeetings,
} from "@/lib/lms/meetings";
import type { MoodleAssignment, MoodleCalendarEvent, MoodleCourse } from "@/lib/lms/moodle-api";
import { extractInstructorFromText } from "@/lib/lms/moodle-syllabus";
import { enrichCourseFromSyllabus } from "@/lib/syllabus/enrich-course-from-syllabus";
import { syncCourseInfoAfterMoodleImport } from "@/lib/lms/course-info/sync-course-info";
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
  return message;
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

  for (const moodleCourse of courses) {
    const instructor = moodleCourse.syllabusText
      ? extractInstructorFromText(moodleCourse.syllabusText)
      : null;

    let course = await db.course.findFirst({
      where: { userId, title: moodleCourse.fullname },
    });

    if (!course) {
      course = await db.course.create({
        data: {
          userId,
          title: moodleCourse.fullname,
          code: moodleCourse.shortname ?? String(moodleCourse.id),
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
          ...(instructor && !course.instructor ? { instructor } : {}),
        },
      });
      if (instructor && !course.instructor) {
        course = { ...course, instructor };
      }
    }

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

    if (moodleCourse.syllabusText?.trim()) {
      const syllabusTitle =
        moodleCourse.syllabusModuleName ?? `${moodleCourse.shortname ?? "Course"} Syllabus`;
      const existingSyllabus = await db.courseMaterial.findFirst({
        where: { courseId: course.id, type: MaterialType.SYLLABUS },
      });

      if (existingSyllabus) {
        await db.courseMaterial.update({
          where: { id: existingSyllabus.id },
          data: {
            title: syllabusTitle,
            url: moodleCourse.syllabusUrl,
            extractedText: moodleCourse.syllabusText,
          },
        });
      } else {
        await db.courseMaterial.create({
          data: {
            courseId: course.id,
            title: syllabusTitle,
            type: MaterialType.SYLLABUS,
            url: moodleCourse.syllabusUrl,
            extractedText: moodleCourse.syllabusText,
            sortOrder: 0,
          },
        });
        syllabiImported += 1;
      }
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

      try {
        const enriched = await enrichCourseFromSyllabus({
          userId,
          courseId: course.id,
          syllabusText: moodleCourse.syllabusText,
          courseTitle: moodleCourse.fullname,
          courseCode: moodleCourse.shortname ?? null,
          instructor: course.instructor,
        });
        if (enriched.planGenerated) plansGenerated += 1;
      } catch (error) {
        console.warn("Syllabus AI enrichment failed for course", course.id, error);
      }

      await syncCourseInfoAfterMoodleImport(userId, course.id, moodleCourse.id);
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
    message: formatSyncMessage(
      courses.length,
      assignmentsImported,
      meetingsImported,
      gradesUpdated,
      syllabiImported,
      plansGenerated,
    ),
  };
}
