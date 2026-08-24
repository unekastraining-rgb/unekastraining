import {
  fetchMoodleCalendarEvents,
  fetchMoodleCourseAssignments,
  fetchMoodleCourseContents,
  moodleApiRequest,
} from "@/lib/lms/moodle-api";
import type { MoodleCourseContentModule, MoodleCourseContentSection } from "@/lib/lms/moodle-api";
import { normalizeMoodleBaseUrl } from "@/lib/lms/moodle-url";
import {
  fetchMoodlePagesByCourse,
  parseBookChapterFileUrls,
} from "@/lib/lms/moodle-syllabus";

import { fetchPluginFileText, htmlToPlainText, unixToIso } from "./html";
import { extractSyllabusDateItemsFromText } from "./syllabus-dates";
import type { CourseInfoItem, CourseInfoPortal, CourseInfoSection } from "./types";

const SYLLABUS_PATTERN = /\b(syllabus|course outline|course information|course info)\b/i;

interface BookChapter {
  title: string;
  href: string;
  level: number;
  body: string;
}

interface SectionBucket {
  id: string;
  title: string;
  items: CourseInfoItem[];
}

function sectionTitle(id: string): string {
  const titles: Record<string, string> = {
    overview: "Course Overview",
    "important-dates": "Important Dates",
    instructor: "Instructor Information",
    materials: "Materials & Resources",
    grading: "Grading",
    policies: "Course Policies",
    attendance: "Attendance",
    etiquette: "Online Etiquette",
    technology: "Technology Requirements",
    outcomes: "Learning Outcomes",
    assignments: "Assignments & Major Requirements",
    quizzes: "Quizzes & Assessments",
    projects: "Projects & Presentations",
    media: "Podcasts & Media",
    resources: "Course Resources",
    announcements: "Announcements",
    faq: "Q&A / FAQ",
    other: "Other Information",
  };
  return titles[id] ?? "Course Information";
}

function classifyLabel(text: string): string {
  const t = text.toLowerCase();
  if (/important date|course schedule|academic calendar|weekly schedule|week\s+\d+/.test(t)) {
    return "important-dates";
  }
  if (/instructor|professor|office hour|about your/.test(t)) return "instructor";
  if (/grading|grade breakdown|grade scale/.test(t)) return "grading";
  if (/polic|academic integrity|incomplete work|diversity statement|accessibility/.test(t)) {
    return "policies";
  }
  if (/attendance/.test(t)) return "attendance";
  if (/etiquette|netiquette|online conduct/.test(t)) return "etiquette";
  if (/technical|technology|assistance|computer/.test(t)) return "technology";
  if (/material|resource|textbook|required reading/.test(t)) return "materials";
  if (/outcome|objective/.test(t)) return "outcomes";
  if (/faq|frequently asked|q&a/.test(t)) return "faq";
  if (/business plan|project|presentation|portfolio/.test(t)) return "projects";
  if (/podcast|panopto|media|video/.test(t)) return "media";
  if (/quiz|assessment|exam|test/.test(t)) return "quizzes";
  if (/assignment|homework|due/.test(t)) return "assignments";
  return "other";
}

function bucketMap(): Map<string, SectionBucket> {
  return new Map();
}

function addItem(
  buckets: Map<string, SectionBucket>,
  sectionId: string,
  item: CourseInfoItem,
) {
  if (!item.title?.trim() && !item.body?.trim() && !item.date) return;

  const id = sectionId || "other";
  let bucket = buckets.get(id);
  if (!bucket) {
    bucket = { id, title: sectionTitle(id), items: [] };
    buckets.set(id, bucket);
  }

  const duplicate = bucket.items.some(
    (existing) =>
      existing.title === item.title &&
      existing.date === item.date &&
      existing.body === item.body,
  );
  if (!duplicate) {
    bucket.items.push(item);
  }
}

function parseBookStructure(mod: MoodleCourseContentModule): BookChapter[] {
  return parseBookChapterFileUrls(mod).map((chapter) => ({
    title: chapter.title,
    href: "",
    level: 0,
    body: "",
    _fileUrl: chapter.fileUrl,
  })) as Array<BookChapter & { _fileUrl?: string | null }>;
}

async function loadBookChapters(
  token: string,
  mod: MoodleCourseContentModule,
  bookUrl: string | null,
): Promise<BookChapter[]> {
  const raw = parseBookStructure(mod) as Array<BookChapter & { _fileUrl?: string | null }>;
  const chapters: BookChapter[] = [];

  for (const chapter of raw) {
    let body = "";
    if (chapter._fileUrl) {
      body = await fetchPluginFileText(token, chapter._fileUrl);
    }
    chapters.push({
      title: chapter.title,
      href: chapter.href,
      level: chapter.level,
      body: body.slice(0, 4000),
    });
  }

  if (chapters.length === 0 && mod.description) {
    chapters.push({
      title: mod.name,
      href: "",
      level: 0,
      body: htmlToPlainText(mod.description).slice(0, 4000),
    });
  }

  return chapters;
}

function dateDedupeKey(item: CourseInfoItem): string {
  const ref = item.moodleRef;
  if (ref?.eventId) return `event:${ref.eventId}`;
  if (ref?.modname && ref.instance && item.date) {
    return `${ref.modname}:${ref.instance}:${item.date.slice(0, 10)}`;
  }
  return `${item.title}:${item.date ?? ""}`;
}

function mergeDateItems(items: CourseInfoItem[]): CourseInfoItem[] {
  const best = new Map<string, CourseInfoItem>();
  const priority = (item: CourseInfoItem) => {
    if (item.source.type === "moodle_calendar") {
      if (item.title.toLowerCase().includes("close")) return 4;
      if (item.title.toLowerCase().includes("due")) return 4;
      return 2;
    }
    if (item.source.type === "moodle_assignment") return 3;
    return 1;
  };

  for (const item of items) {
    const key = dateDedupeKey(item);
    const existing = best.get(key);
    if (!existing || priority(item) > priority(existing)) {
      best.set(key, item);
    }
  }

  return [...best.values()].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return a.date.localeCompare(b.date);
  });
}

function modulesFromContents(
  contents: MoodleCourseContentSection[],
): Array<MoodleCourseContentModule & { sectionName: string }> {
  return contents.flatMap((section) =>
    (section.modules ?? []).map((mod) => ({
      ...mod,
      sectionName: section.name ?? `Section ${section.section}`,
    })),
  );
}

export async function buildCourseInfoPortal(input: {
  studyHaulCourseId: string;
  moodleCourseId: number;
  baseUrl: string;
  token: string;
  courseMeta?: {
    fullname?: string;
    shortname?: string;
    category?: string;
    startdate?: number;
    enddate?: number;
    viewurl?: string;
  };
}): Promise<CourseInfoPortal> {
  const root = normalizeMoodleBaseUrl(input.baseUrl);
  const token = input.token.trim();
  const moodleCourseId = input.moodleCourseId;

  const [contents, assignmentList, calendarEvents, pages] = await Promise.all([
    fetchMoodleCourseContents(root, token, moodleCourseId),
    fetchMoodleCourseAssignments(root, token, moodleCourseId),
    fetchMoodleCalendarEvents(root, token, moodleCourseId),
    fetchMoodlePagesByCourse(root, token, moodleCourseId),
  ]);

  let courseMeta = input.courseMeta;
  if (!courseMeta?.fullname) {
    try {
      const enrolled = await moodleApiRequest<{
        courses?: Array<{
          id: number;
          fullname: string;
          shortname?: string;
          startdate?: number;
          enddate?: number;
          viewurl?: string;
          coursecategory?: string;
        }>;
      }>(root, token, "core_course_get_enrolled_courses_by_timeline_classification", {
        classification: "all",
        limit: "50",
        offset: "0",
      });
      const match = enrolled.courses?.find((course) => course.id === moodleCourseId);
      if (match) {
        courseMeta = {
          fullname: match.fullname,
          shortname: match.shortname,
          startdate: match.startdate,
          enddate: match.enddate,
          viewurl: match.viewurl,
          category: match.coursecategory,
        };
      }
    } catch {
      // optional
    }
  }

  const buckets = bucketMap();
  const modules = modulesFromContents(contents);

  for (const section of contents) {
    if (!section.summary?.trim()) continue;
    const text = htmlToPlainText(section.summary);
    if (text.length < 40) continue;
    addItem(buckets, "overview", {
      title: section.name ?? "Course overview",
      body: text.slice(0, 2000),
      kind: "text",
      source: {
        type: "moodle_section",
        label: `Section: ${section.name}`,
      },
    });
  }

  for (const page of pages) {
    const sectionId = classifyLabel(page.name);
    const body = page.intro ? htmlToPlainText(page.intro) : "";
    addItem(buckets, sectionId, {
      title: page.name,
      body: body.slice(0, 3000) || undefined,
      kind: "text",
      source: {
        type: "moodle_page",
        label: page.name,
        url: modules.find((mod) => mod.id === page.coursemodule)?.url ?? undefined,
      },
      moodleRef: { modname: "page", cmid: page.coursemodule, instance: page.id },
    });
  }

  for (const mod of modules) {
    if (mod.modname === "book" && SYLLABUS_PATTERN.test(mod.name)) {
      const chapters = await loadBookChapters(token, mod, mod.url ?? null);
      for (const chapter of chapters) {
        if (!chapter.body && !chapter.title) continue;
        const sectionId = classifyLabel(chapter.title);
        addItem(buckets, sectionId, {
          title: chapter.title,
          body: chapter.body || undefined,
          kind: sectionId === "policies" ? "policy" : "text",
          source: {
            type: "moodle_book",
            label: `${mod.name} → ${chapter.title}`,
            url: mod.url ?? undefined,
          },
          moodleRef: { modname: "book", cmid: mod.id, instance: mod.instance },
        });
      }
      continue;
    }

    if (mod.modname === "folder" && (mod.contents?.length ?? 0) > 0) {
      const sectionId = classifyLabel(mod.name);
      const files = (mod.contents ?? [])
        .filter((item) => item.type === "file" && item.filename)
        .map((item) => item.filename!);
      if (files.length > 0) {
        addItem(buckets, sectionId === "other" ? "resources" : sectionId, {
          title: mod.name,
          body: files.map((file) => `• ${file}`).join("\n"),
          kind: "list",
          source: {
            type: "moodle_folder",
            label: mod.sectionName,
            url: mod.url ?? undefined,
          },
          moodleRef: { modname: "folder", cmid: mod.id, instance: mod.instance },
        });
      }
    }

    if (mod.modname === "forum") {
      const body = mod.description ? htmlToPlainText(mod.description) : undefined;
      addItem(buckets, "announcements", {
        title: mod.name,
        body,
        kind: "text",
        source: {
          type: "moodle_module",
          label: mod.sectionName,
          url: mod.url ?? undefined,
        },
        moodleRef: { modname: "forum", cmid: mod.id, instance: mod.instance },
      });
    }

    if (mod.modname === "quiz") {
      addItem(buckets, "quizzes", {
        title: mod.name,
        kind: "assignment",
        source: {
          type: "moodle_quiz",
          label: mod.sectionName,
          url: mod.url ?? undefined,
        },
        moodleRef: { modname: "quiz", cmid: mod.id, instance: mod.instance },
      });
    }

    if (mod.modname === "panoptosubmission") {
      addItem(buckets, "media", {
        title: mod.name,
        kind: "assignment",
        source: {
          type: "moodle_module",
          label: mod.sectionName,
          url: mod.url ?? undefined,
        },
        moodleRef: { modname: mod.modname, cmid: mod.id, instance: mod.instance },
      });
    }
  }

  const dateItems: CourseInfoItem[] = [];

  for (const event of calendarEvents) {
    const iso = unixToIso(event.timestart);
    if (!iso) continue;

    const eventLabel =
      event.eventtype === "close" || event.eventtype === "due"
        ? event.name.replace(/\s+(closes?|due)$/i, "").trim()
        : event.name;

    dateItems.push({
      title: eventLabel,
      date: iso,
      body:
        event.eventtype === "open"
          ? "Opens"
          : event.eventtype === "close"
            ? "Closes / due"
            : "Due",
      kind: "date",
      source: {
        type: "moodle_calendar",
        label: "Moodle calendar",
      },
      moodleRef: {
        modname: event.modulename ?? undefined,
        instance: event.instance ?? undefined,
        eventId: event.id,
      },
    });
  }

  for (const assignment of assignmentList) {
    const iso = unixToIso(assignment.duedate);
    if (iso) {
      dateItems.push({
        title: assignment.name,
        date: iso,
        body: assignment.grade ? `Worth ${assignment.grade} points` : undefined,
        kind: "date",
        source: {
          type: "moodle_assignment",
          label: "Moodle assignment",
        },
        moodleRef: {
          modname: "assign",
          cmid: assignment.cmid,
          instance: assignment.id,
        },
      });
    }

    addItem(buckets, classifyLabel(assignment.name), {
      title: assignment.name,
      body: assignment.grade ? `Points: ${assignment.grade}` : undefined,
      date: iso,
      kind: "assignment",
      source: {
        type: "moodle_assignment",
        label: "Moodle assignments",
      },
      moodleRef: {
        modname: "assign",
        cmid: assignment.cmid,
        instance: assignment.id,
      },
    });
  }

  const mergedDates = mergeDateItems(dateItems);

  const syllabusYear = courseMeta?.startdate
    ? new Date(unixToIso(courseMeta.startdate) ?? "").getFullYear()
    : new Date().getFullYear();
  const syllabusDates: CourseInfoItem[] = [];
  for (const bucket of buckets.values()) {
    for (const item of bucket.items) {
      if (!item.body?.trim()) continue;
      syllabusDates.push(
        ...extractSyllabusDateItemsFromText(item.body, item.source.label, syllabusYear),
      );
    }
  }

  const allDates = mergeDateItems([...mergedDates, ...syllabusDates]);
  for (const item of allDates) {
    addItem(buckets, "important-dates", item);
  }

  const sections: CourseInfoSection[] = [...buckets.values()]
    .filter((bucket) => bucket.items.length > 0)
    .sort((a, b) => {
      const order = [
        "overview",
        "important-dates",
        "instructor",
        "outcomes",
        "materials",
        "grading",
        "assignments",
        "quizzes",
        "projects",
        "media",
        "policies",
        "attendance",
        "etiquette",
        "technology",
        "resources",
        "announcements",
        "faq",
        "other",
      ];
      return order.indexOf(a.id) - order.indexOf(b.id);
    });

  return {
    courseId: input.studyHaulCourseId,
    moodleCourseId,
    syncedAt: new Date().toISOString(),
    course: {
      name: courseMeta?.fullname ?? `Course ${moodleCourseId}`,
      shortname: courseMeta?.shortname,
      category: courseMeta?.category,
      startDate: unixToIso(courseMeta?.startdate),
      endDate: unixToIso(courseMeta?.enddate),
      moodleUrl: courseMeta?.viewurl ?? `${root}/course/view.php?id=${moodleCourseId}`,
    },
    sections,
  };
}
