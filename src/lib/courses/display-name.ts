/** Friendly names for catalog codes so Study Haul doesn’t show “CSCI 1250 0711”. */
const COURSE_NICKNAMES: Record<string, string> = {
  CSCI2340: "Object Oriented Design",
  CSCI1250: "Computer Programming",
  BUSN1001: "Intro to Business",
};

function catalogKey(value: string): string {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = compact.match(/^([A-Z]{2,6})(\d{4})/);
  return match ? `${match[1]}${match[2]}` : compact;
}

function catalogKeyFromCourse(code: string | null | undefined, title: string): string | null {
  if (code?.trim()) {
    const key = catalogKey(code);
    if (/^[A-Z]{2,6}\d{4}$/.test(key)) return key;
  }
  const match = title.match(/\b([A-Za-z]{2,6})\s*-?\s*(\d{4})\b/);
  if (match) return catalogKey(`${match[1]}${match[2]}`);
  return null;
}

export function looksLikeCatalogLabel(value: string): boolean {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z]{2,6}\d{4}(\d{3,4})?$/.test(compact);
}

export function stripSectionNumbers(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b0\d{3}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripCatalogAndSection(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    // Moodle path junk: CSCI 2340/LEC/172I-2026/FALL/ELEARN1
    .replace(
      /\b[A-Za-z]{2,6}\s*-?\s*\d{4}(?:\.[A-Za-z0-9]+)?(?:,\s*[A-Za-z0-9./]+)*(?:\/[A-Za-z0-9_-]+)*/g,
      " ",
    )
    .replace(/\b[A-Za-z]{2,6}\s*-?\s*\d{4}\b/g, " ")
    .replace(/\b0\d{3}\b/g, " ")
    .replace(/\b(?:LEC|LAB|FALL|SPRING|SUMMER|ELEARN\d*|SESSION|\dSESSION)\b/gi, " ")
    .replace(/^[\s\-–—:|/]+|[\s\-–—:|/]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Moodle fullnames often look like:
 * "CSCI 2340/LEC/172I-2026/FALL/ELEARN1 - Object-Oriented Design"
 * Prefer the human title after the dash over catalog codes.
 */
function extractTitleAfterCatalogPrefix(title: string): string | null {
  const normalized = title.replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  const parts = normalized.split(/\s+[-–—]\s+/);
  if (parts.length >= 2) {
    const candidate = stripCatalogAndSection(parts[parts.length - 1]!);
    if (candidate.length >= 3 && !looksLikeCatalogLabel(candidate)) {
      return candidate;
    }
  }

  const stripped = stripCatalogAndSection(normalized);
  if (
    stripped.length >= 3 &&
    !looksLikeCatalogLabel(stripped) &&
    stripped.toLowerCase() !== normalized.toLowerCase()
  ) {
    return stripped;
  }

  return null;
}

function formatCatalogKey(key: string | null): string | null {
  if (!key) return null;
  const match = key.match(/^([A-Z]{2,6})(\d{4})$/);
  return match ? `${match[1]} ${match[2]}` : null;
}

export function readableCourseName(course: {
  code?: string | null;
  title: string;
}): string {
  // Prefer a real course name from Moodle/LMS titles before nicknames/codes.
  const fromTitle = extractTitleAfterCatalogPrefix(course.title);
  if (fromTitle) return fromTitle;

  const name = stripCatalogAndSection(course.title);
  if (name.length >= 3 && !looksLikeCatalogLabel(name)) return name;

  const key = catalogKeyFromCourse(course.code, course.title);
  if (key && COURSE_NICKNAMES[key]) return COURSE_NICKNAMES[key];

  const formatted = formatCatalogKey(key);
  if (formatted) return formatted;

  return stripSectionNumbers(course.title) || course.title.replace(/\s+/g, " ").trim();
}

export function readableCourseTitle(
  title: string | null | undefined,
  code?: string | null,
): string {
  if (!title?.trim() && !code?.trim()) return "";
  return readableCourseName({ title: title ?? "", code: code ?? null });
}

export function readableCourseCode(course: {
  code?: string | null;
  title?: string | null;
}): string | null {
  const key = catalogKeyFromCourse(course.code ?? null, course.title ?? "");
  const formatted = formatCatalogKey(key);
  if (formatted) return formatted;
  const raw = course.code?.replace(/\s+/g, " ").trim();
  if (!raw) return null;
  const stripped = stripSectionNumbers(raw);
  return stripped && !looksLikeCatalogLabel(stripped) ? stripped : stripped || null;
}

export function readableMeetingTitle(
  meetingTitle: string | null | undefined,
  course: { title: string; code?: string | null },
): string {
  const readable = readableCourseName(course);
  const raw = meetingTitle?.trim();
  if (!raw) return readable;
  if (looksLikeCatalogLabel(raw)) return readable;
  if (/^(lab|lecture|class|seminar|recitation|discussion)$/i.test(raw)) {
    return `${readable} ${raw.toLowerCase()}`;
  }
  if (/^[A-Za-z]{2,6}(\s*-?\s*\d{4})?\s+(lab|lecture|class|seminar|recitation|discussion)\b/i.test(raw)) {
    return /\blab\b/i.test(raw) ? `${readable} lab` : readable;
  }
  if (/\blab\b/i.test(raw) && looksLikeCatalogLabel(raw.replace(/\blab\b/gi, ""))) {
    return `${readable} lab`;
  }
  return stripSectionNumbers(raw);
}

export function withReadableCourse<T extends { title: string; code?: string | null }>(
  course: T,
): T {
  const source = { title: course.title, code: course.code ?? null };
  if ("code" in course) {
    return {
      ...course,
      title: readableCourseName(source),
      code: readableCourseCode(source),
    };
  }
  return {
    ...course,
    title: readableCourseName(source),
  };
}
