import { moodleApiRequest } from "@/lib/lms/moodle-api";
import type {
  MoodleCourseContentModule,
  MoodleCourseContentSection,
} from "@/lib/lms/moodle-api";

const SYLLABUS_NAME_PATTERN =
  /\b(syllabus|course outline|course information|course info)\b/i;

export interface MoodleSyllabusSource {
  modtype: string;
  name: string;
  moduleId: number;
  instanceId: number;
  url: string | null;
  introHtml: string | null;
  chapterTitles: string[];
  fileUrls: string[];
}

export function isMoodleOnboardingCourse(shortname?: string, fullname?: string): boolean {
  const label = `${shortname ?? ""} ${fullname ?? ""}`.toLowerCase();
  return /\bonboarding\b/.test(label);
}

export function discoverSyllabusSources(
  contents: MoodleCourseContentSection[],
  books: Array<{ id: number; coursemodule: number; name: string; intro?: string }> = [],
  pages: Array<{ id: number; coursemodule: number; name: string; intro?: string }> = [],
): MoodleSyllabusSource[] {
  const sources: MoodleSyllabusSource[] = [];
  const bookByCm = new Map(books.map((book) => [book.coursemodule, book]));
  const pageByCm = new Map(pages.map((page) => [page.coursemodule, page]));

  for (const section of contents) {
    for (const mod of section.modules ?? []) {
      const modtype = mod.modname ?? "unknown";
      const name = mod.name ?? "";
      const isSyllabusName = SYLLABUS_NAME_PATTERN.test(name);
      const isBookSyllabus = modtype === "book" && isSyllabusName;
      const isPageSyllabus =
        modtype === "page" &&
        /\b(syllabus|course outline|instructor|course information)\b/i.test(name);
      const isResourceSyllabus =
        (modtype === "resource" || modtype === "folder") && isSyllabusName;

      if (!isBookSyllabus && !isPageSyllabus && !isResourceSyllabus) {
        continue;
      }

      const chapterTitles = extractBookChapterTitles(mod);
      const fileUrls = (mod.contents ?? [])
        .map((item) => item.fileurl)
        .filter((url): url is string => Boolean(url));

      const book = bookByCm.get(mod.id);
      const page = pageByCm.get(mod.id);

      sources.push({
        modtype,
        name,
        moduleId: mod.id,
        instanceId: mod.instance,
        url: mod.url ?? null,
        introHtml: book?.intro ?? page?.intro ?? mod.description ?? null,
        chapterTitles,
        fileUrls,
      });
    }
  }

  return sources;
}

function extractBookChapterTitles(mod: MoodleCourseContentModule): string[] {
  const structure = mod.contents?.find((item) => item.filename === "structure");
  if (!structure?.content) return [];

  try {
    const chapters = JSON.parse(structure.content) as Array<{ title?: string }>;
    return chapters
      .map((chapter) => chapter.title?.replace(/&amp;/g, "&").trim() ?? "")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function pluginFileUrl(baseUrl: string, token: string, fileUrl: string): string {
  const url = new URL(fileUrl);
  if (!url.searchParams.has("token")) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}

async function fetchPluginFileText(
  baseUrl: string,
  token: string,
  fileUrl: string,
): Promise<string> {
  const url = pluginFileUrl(baseUrl, token, fileUrl);
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
  if (!response.ok) return "";
  const text = await response.text();
  if (text.trimStart().startsWith("<")) {
    return htmlToPlainText(text);
  }
  return text.trim();
}

export async function fetchSyllabusText(
  baseUrl: string,
  token: string,
  source: MoodleSyllabusSource,
): Promise<string> {
  const parts: string[] = [`# ${source.name}`];

  if (source.introHtml) {
    parts.push(htmlToPlainText(source.introHtml));
  }

  if (source.chapterTitles.length > 0) {
    parts.push("\n## Chapters\n" + source.chapterTitles.map((title) => `- ${title}`).join("\n"));
  }

  const htmlFiles = source.fileUrls.filter((url) => /\.html?(\?|$)/i.test(url));
  const otherFiles = source.fileUrls.filter((url) => !/\.html?(\?|$)/i.test(url));

  for (const fileUrl of htmlFiles.slice(0, 12)) {
    const chapterText = await fetchPluginFileText(baseUrl, token, fileUrl);
    if (chapterText) {
      parts.push(`\n---\n${chapterText}`);
    }
  }

  if (parts.length <= 2 && otherFiles.length > 0) {
    parts.push(
      "\n## Attachments\n" +
        otherFiles.map((url) => `- ${url.split("/").pop() ?? url}`).join("\n"),
    );
  }

  return parts.join("\n\n").trim();
}

export async function fetchMoodleBooksByCourse(
  baseUrl: string,
  token: string,
  courseId: number,
): Promise<Array<{ id: number; coursemodule: number; name: string; intro?: string }>> {
  try {
    const payload = await moodleApiRequest<{
      books?: Array<{ id: number; coursemodule: number; name: string; intro?: string }>;
    }>(baseUrl, token, "mod_book_get_books_by_courses", {
      "courseids[0]": String(courseId),
    });
    return payload.books ?? [];
  } catch {
    return [];
  }
}

export async function fetchMoodlePagesByCourse(
  baseUrl: string,
  token: string,
  courseId: number,
): Promise<Array<{ id: number; coursemodule: number; name: string; intro?: string }>> {
  try {
    const payload = await moodleApiRequest<{
      pages?: Array<{ id: number; coursemodule: number; name: string; intro?: string }>;
    }>(baseUrl, token, "mod_page_get_pages_by_courses", {
      "courseids[0]": String(courseId),
    });
    return payload.pages ?? [];
  } catch {
    return [];
  }
}

export function extractInstructorFromText(text: string): string | null {
  const patterns = [
    /instructor[:\s]+([A-Za-z][A-Za-z .'-]{2,60})/i,
    /professor[:\s]+([A-Za-z][A-Za-z .'-]{2,60})/i,
    /taught by[:\s]+([A-Za-z][A-Za-z .'-]{2,60})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/\s+/g, " ").trim();
    }
  }

  return null;
}
