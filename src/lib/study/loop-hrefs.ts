export function coreStudyPackHref(
  courseId: string,
  topic?: string | null,
): string {
  const params = new URLSearchParams({
    courseId: courseId.trim(),
    pack: "1",
  });
  if (topic?.trim()) params.set("topic", topic.trim());
  return `/core?${params.toString()}`;
}

/**
 * Deep-link into existing CORE Studio Study Guide (no second Study Guide system).
 * Opens CORE assist panel with studio focused on study-guide.
 */
export function coreStudyGuideHref(options: {
  courseId: string;
  topic?: string | null;
  materialId?: string | null;
}): string {
  const params = new URLSearchParams({
    courseId: options.courseId.trim(),
    assist: "1",
    studio: "study-guide",
  });
  if (options.topic?.trim()) params.set("topic", options.topic.trim());
  if (options.materialId?.trim()) {
    params.set("materialId", options.materialId.trim());
  }
  return `/core?${params.toString()}`;
}

/** Topic Study Haul workspace on /study (course + optional topic). */
export function studyHaulHref(
  courseId: string,
  topic?: string | null,
  hash?: string | null,
): string {
  const params = new URLSearchParams({
    courseId: courseId.trim(),
  });
  if (topic?.trim()) params.set("topic", topic.trim());
  const base = `/study?${params.toString()}`;
  if (hash?.trim()) return `${base}#${hash.trim().replace(/^#/, "")}`;
  return base;
}

/** Core → Six → Lucky deep links with course context. */

export function luckyQuizHref(
  courseId?: string | null,
  materialId?: string | null,
  topic?: string | null,
): string {
  if (!courseId?.trim()) return "/quizzes";
  const params = new URLSearchParams({
    courseId: courseId.trim(),
    make: "1",
  });
  if (materialId?.trim()) params.set("materialId", materialId.trim());
  if (topic?.trim()) params.set("topic", topic.trim());
  return `/quizzes?${params.toString()}`;
}

export function blurtingHref(
  courseId?: string | null,
  materialId?: string | null,
  topic?: string | null,
): string {
  if (!courseId?.trim()) return "/study/blurting";
  const params = new URLSearchParams({
    courseId: courseId.trim(),
  });
  if (materialId?.trim()) params.set("materialId", materialId.trim());
  if (topic?.trim()) params.set("topic", topic.trim());
  return `/study/blurting?${params.toString()}`;
}

/** Lucky teach-back (Feynman-style) with course topics / material grounding. */
export function teachMeHref(
  courseId?: string | null,
  materialId?: string | null,
  topic?: string | null,
): string {
  const params = new URLSearchParams();
  if (courseId?.trim()) params.set("courseId", courseId.trim());
  if (materialId?.trim()) params.set("materialId", materialId.trim());
  if (topic?.trim()) params.set("topic", topic.trim());
  const qs = params.toString();
  return qs ? `/study/teach-me?${qs}` : "/study/teach-me";
}

export function sixChunkingHref(
  courseId: string,
  topic: string,
  materialId?: string | null,
): string {
  const params = new URLSearchParams({
    courseId,
    topic: topic.trim() || "notes",
  });
  if (materialId?.trim()) params.set("materialId", materialId.trim());
  return `/study/six/chunking?${params.toString()}`;
}

/** Teach-back from notes — Core → Six Feynman with page/extract context. */
export function sixFeynmanHref(
  courseId: string,
  topic: string,
  materialId?: string | null,
): string {
  const params = new URLSearchParams({
    courseId,
    topic: topic.trim() || "notes",
  });
  if (materialId?.trim()) params.set("materialId", materialId.trim());
  return `/study/six/feynman?${params.toString()}`;
}

/**
 * Attach a cold-start / LMS topic to study destinations when missing.
 * Keeps Learn → Practice / Check / Remember / Tutor from opening empty shells.
 */
export function withColdStartTopic(
  href: string,
  topic?: string | null,
): string {
  if (!href || !topic?.trim() || href.includes("topic=")) return href;
  const isTarget =
    href.startsWith("/study/six/") ||
    href.startsWith("/study/blurting") ||
    href.startsWith("/study/teach-me") ||
    href.startsWith("/study/lucky") ||
    href.startsWith("/flashcards") ||
    href.startsWith("/study/activities/");
  if (!isTarget) return href;
  return `${href}${href.includes("?") ? "&" : "?"}topic=${encodeURIComponent(topic.trim())}`;
}

/** Attach courseId (and auto-build for plain quiz links) when missing. */
export function withCourseContext(href: string, courseId?: string | null): string {
  if (!courseId?.trim()) return href;

  const id = courseId.trim();

  if (href.startsWith("/quizzes")) {
    if (href.includes("courseId=")) return href;
    const separator = href.includes("?") ? "&" : "?";
    const needsMake =
      !href.includes("make=") &&
      (href === "/quizzes" ||
        (href.startsWith("/quizzes?") && !href.includes("filter=")));
    const autoMake = needsMake ? "&make=1" : "";
    return `${href}${separator}courseId=${encodeURIComponent(id)}${autoMake}`;
  }

  if (
    (href === "/core" || href.startsWith("/core?")) &&
    !href.includes("courseId=")
  ) {
    return `${href}${href.includes("?") ? "&" : "?"}courseId=${encodeURIComponent(id)}`;
  }

  if (href.startsWith("/study/blurting") && !href.includes("courseId=")) {
    return `${href}${href.includes("?") ? "&" : "?"}courseId=${encodeURIComponent(id)}`;
  }

  if (href.startsWith("/study/teach-me") && !href.includes("courseId=")) {
    return `${href}${href.includes("?") ? "&" : "?"}courseId=${encodeURIComponent(id)}`;
  }

  if (href.startsWith("/study/mixed") && !href.includes("courseId=")) {
    return `${href}${href.includes("?") ? "&" : "?"}courseId=${encodeURIComponent(id)}`;
  }

  if (href.startsWith("/flashcards") && !href.includes("courseId=")) {
    return `${href}${href.includes("?") ? "&" : "?"}courseId=${encodeURIComponent(id)}`;
  }

  if (href.startsWith("/study/six/") && !href.includes("courseId=")) {
    return `${href}${href.includes("?") ? "&" : "?"}courseId=${encodeURIComponent(id)}`;
  }

  if (href.startsWith("/study/mixed") && !href.includes("courseId=")) {
    return `${href}${href.includes("?") ? "&" : "?"}courseId=${encodeURIComponent(id)}`;
  }

  if (href.startsWith("/study/lucky") && !href.includes("courseId=")) {
    return `${href}${href.includes("?") ? "&" : "?"}courseId=${encodeURIComponent(id)}`;
  }

  if (href.startsWith("/dashboard") && href.includes("tab=chat") && !href.includes("courseId=")) {
    return `${href}${href.includes("?") ? "&" : "?"}courseId=${encodeURIComponent(id)}`;
  }

  return href;
}

/** Open course detail with material upload modal (OCR / photo syllabus). */
export function courseMaterialUploadHref(courseId: string): string {
  return `/courses/${courseId.trim()}?upload=1`;
}

/** Study hub “Photo syllabus” — lands on course upload or course picker scan mode. */
export function coursesScanLandingHref(courseId?: string | null): string {
  if (courseId?.trim()) return courseMaterialUploadHref(courseId);
  return "/courses?scan=1";
}
