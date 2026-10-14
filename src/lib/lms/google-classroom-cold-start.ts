/**
 * Google Classroom cold start: course description + coursework titles/links
 * → study-ready SYLLABUS text (no fabricated body content).
 */

export type GoogleClassroomWorkOutlineItem = {
  id: string;
  title: string;
  description?: string | null;
  materials?: Array<{
    link?: { url?: string | null; title?: string | null } | null;
    youtubeVideo?: { alternateLink?: string | null; title?: string | null } | null;
    driveFile?: {
      driveFile?: { title?: string | null; alternateLink?: string | null } | null;
    } | null;
  }> | null;
};

export function googleClassroomSyllabusMaterialMeta(input: {
  googleCourseId: string;
  courseName: string;
  section?: string | null;
}): { title: string; url: string } {
  const label = input.section?.trim() || input.courseName;
  return {
    title: `${label} Syllabus (Google Classroom)`,
    // Stable identity for provenance + repeated-sync updates (no schema externalId).
    url: `https://classroom.google.com/c/${encodeURIComponent(input.googleCourseId)}`,
  };
}

/**
 * Build outline text from available Classroom metadata.
 * Does not download Drive files or invent lecture content.
 */
export function buildGoogleClassroomColdStartText(input: {
  courseName: string;
  section?: string | null;
  description?: string | null;
  courseWork?: GoogleClassroomWorkOutlineItem[] | null;
  thinThreshold?: number;
  minSeedLength?: number;
}): { text: string; seeded: boolean } {
  const thinThreshold = input.thinThreshold ?? 80;
  const minSeedLength = input.minSeedLength ?? 40;

  const lines: string[] = [`Course: ${input.courseName}`];
  if (input.section?.trim()) {
    lines.push(`Section: ${input.section.trim()}`);
  }

  const description = input.description?.trim() ?? "";
  if (description) {
    lines.push("", description);
  }

  const work = input.courseWork ?? [];
  const workLines: string[] = [];
  const linkLines: string[] = [];

  for (const item of work.slice(0, 40)) {
    const title = item.title?.trim();
    if (!title) continue;
    const desc = item.description?.trim();
    workLines.push(
      desc
        ? `${workLines.length + 1}. ${title} — ${desc.slice(0, 240)}`
        : `${workLines.length + 1}. ${title}`,
    );

    for (const mat of item.materials ?? []) {
      const link = mat.link;
      if (link?.url?.trim()) {
        linkLines.push(
          `- ${link.title?.trim() || title}: ${link.url.trim()}`,
        );
      }
      const yt = mat.youtubeVideo;
      if (yt?.alternateLink?.trim()) {
        linkLines.push(
          `- ${yt.title?.trim() || "YouTube"}: ${yt.alternateLink.trim()}`,
        );
      }
      const drive = mat.driveFile?.driveFile;
      if (drive?.alternateLink?.trim()) {
        linkLines.push(
          `- ${drive.title?.trim() || "Drive file"}: ${drive.alternateLink.trim()}`,
        );
      }
    }
  }

  if (workLines.length > 0) {
    lines.push("", "Coursework outline", ...workLines);
  }
  if (linkLines.length > 0) {
    lines.push("", "Linked materials", ...linkLines.slice(0, 30));
  }

  const text = lines.join("\n").trim();

  // Thin description alone: still seed if we have coursework titles.
  if (text.length < thinThreshold && workLines.length === 0 && !description) {
    return { text: "", seeded: false };
  }

  return {
    text,
    seeded: text.length >= minSeedLength,
  };
}
