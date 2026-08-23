export type CourseInfoItemKind =
  | "date"
  | "text"
  | "link"
  | "file"
  | "assignment"
  | "policy"
  | "list";

export interface CourseInfoSource {
  type:
    | "moodle_calendar"
    | "moodle_assignment"
    | "moodle_quiz"
    | "moodle_book"
    | "moodle_page"
    | "moodle_folder"
    | "moodle_section"
    | "moodle_module";
  label: string;
  url?: string;
}

export interface CourseInfoItem {
  title: string;
  body?: string;
  date?: string;
  kind: CourseInfoItemKind;
  source: CourseInfoSource;
  moodleRef?: {
    modname?: string;
    cmid?: number;
    instance?: number;
    eventId?: number;
  };
}

export interface CourseInfoSection {
  id: string;
  title: string;
  items: CourseInfoItem[];
}

export interface CourseInfoPortal {
  courseId: string;
  moodleCourseId: number;
  syncedAt: string;
  course: {
    name: string;
    shortname?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    moodleUrl?: string;
  };
  sections: CourseInfoSection[];
}

export function parseCourseInfoPortal(json: string | null | undefined): CourseInfoPortal | null {
  if (!json?.trim()) return null;
  try {
    const parsed = JSON.parse(json) as CourseInfoPortal;
    if (!parsed.courseId || !parsed.moodleCourseId || !Array.isArray(parsed.sections)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
