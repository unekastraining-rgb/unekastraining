import {
  fetchMoodleAssignmentGrade,
  fetchMoodleCalendarEvents,
  fetchMoodleCourseAssignments,
  fetchMoodleCourseContents,
  fetchMoodleEnrolledCourses,
  moodleCalendarEventsToAssignments,
} from "@/lib/lms/moodle-api";
import { normalizeMoodleBaseUrl } from "@/lib/lms/moodle-url";
import type { MoodleImportCourse } from "@/lib/lms/moodle-import";
import {
  discoverSyllabusSources,
  fetchMoodleBooksByCourse,
  fetchMoodlePagesByCourse,
  fetchSyllabusText,
  isMoodleOnboardingCourse,
} from "@/lib/lms/moodle-syllabus";

export async function collectMoodleCoursesForImport(
  baseUrl: string,
  token: string,
): Promise<MoodleImportCourse[]> {
  const root = normalizeMoodleBaseUrl(baseUrl);
  const courses = await fetchMoodleEnrolledCourses(root, token);
  const payload: MoodleImportCourse[] = [];

  for (const course of courses) {
    if (isMoodleOnboardingCourse(course.shortname, course.fullname)) {
      continue;
    }

    const [assignments, calendarEvents, contents, books, pages] = await Promise.all([
      fetchMoodleCourseAssignments(root, token, course.id),
      fetchMoodleCalendarEvents(root, token, course.id),
      fetchMoodleCourseContents(root, token, course.id).catch(() => []),
      fetchMoodleBooksByCourse(root, token, course.id),
      fetchMoodlePagesByCourse(root, token, course.id),
    ]);

    const withGrades = await Promise.all(
      assignments.map(async (assignment) => {
        const gradeInfo = await fetchMoodleAssignmentGrade(root, token, assignment.id);
        return {
          ...assignment,
          grade: gradeInfo?.grade ?? null,
          maxGrade: gradeInfo?.maxGrade ?? null,
        };
      }),
    );

    const calendarAssignments = moodleCalendarEventsToAssignments(calendarEvents);
    const syllabusSources = discoverSyllabusSources(contents, books, pages);
    let syllabusText = "";
    let syllabusUrl: string | null = null;

    if (syllabusSources.length > 0) {
      const primary = syllabusSources[0]!;
      syllabusUrl = primary.url;
      syllabusText = await fetchSyllabusText(root, token, primary);
    }

    payload.push({
      ...course,
      assignments: withGrades,
      calendarEvents,
      calendarAssignments,
      syllabusText: syllabusText || null,
      syllabusUrl,
      syllabusModuleName: syllabusSources[0]?.name ?? null,
    });
  }

  return payload;
}
