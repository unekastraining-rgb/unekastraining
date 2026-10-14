/**
 * Canvas LMS cold start: turn syllabus HTML and/or module names into
 * study-ready text for SYLLABUS materials + topic enrichment (no uploads).
 */

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/(div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function formatCanvasModuleOutline(
  modules: Array<{ name?: string | null }>,
): string {
  const lines = modules
    .map((mod) => mod.name?.trim())
    .filter((name): name is string => Boolean(name && name.length >= 2))
    .slice(0, 24)
    .map((name, index) => `${index + 1}. ${name}`);

  if (lines.length === 0) return "";
  return `Module outline\n${lines.join("\n")}`;
}

/**
 * Prefer syllabus body; if thin, merge/replace with module outline so Lucky
 * and “Study from topics” can cold-start without student uploads.
 */
export function buildCanvasColdStartSyllabusText(input: {
  courseName: string;
  syllabusHtml?: string | null;
  modulesOutline?: string | null;
  /** Below this length we try modules as fallback/supplement. */
  thinThreshold?: number;
  /** Minimum usable text to seed a SYLLABUS material. */
  minSeedLength?: number;
}): { text: string; seeded: boolean; usedModules: boolean } {
  const thinThreshold = input.thinThreshold ?? 80;
  const minSeedLength = input.minSeedLength ?? 40;

  const fromHtml = input.syllabusHtml?.trim()
    ? stripHtmlToText(input.syllabusHtml)
    : "";
  let text = fromHtml;
  let usedModules = false;

  if (text.length < thinThreshold) {
    const outline = input.modulesOutline?.trim() ?? "";
    if (outline) {
      usedModules = true;
      text = text
        ? `${text}\n\n${outline}`
        : `Course: ${input.courseName}\n${outline}`;
    }
  }

  const trimmed = text.trim();
  return {
    text: trimmed,
    seeded: trimmed.length >= minSeedLength,
    usedModules,
  };
}

export function canvasSyllabusMaterialMeta(input: {
  baseUrl: string;
  courseId: number;
  courseName: string;
  courseCode?: string | null;
}): { title: string; url: string } {
  const base = input.baseUrl.replace(/\/$/, "");
  return {
    title: `${input.courseCode ?? input.courseName} Syllabus`,
    url: `${base}/courses/${input.courseId}/assignments/syllabus`,
  };
}
