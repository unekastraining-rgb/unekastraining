/**
 * 2P-27 — Smallest useful material search (no vector DB).
 * Scoped to the owning learner via course.userId.
 */

import { db } from "@/lib/db";

export type MaterialSearchHit = {
  id: string;
  title: string;
  type: string;
  courseId: string;
  courseTitle: string;
  excerpt: string | null;
  matchedOn: "title" | "text";
};

const SEARCH_RESULT_CAP = 25;
const EXCERPT_LEN = 180;

/**
 * Search owned materials by title and extracted text.
 * Does not load full documents into one response.
 */
export async function searchOwnedMaterials(
  userId: string,
  query: string,
): Promise<MaterialSearchHit[]> {
  const q = query.trim().slice(0, 200);
  if (q.length < 2) return [];

  const rows = await db.courseMaterial.findMany({
    where: {
      course: { userId },
      OR: [
        { title: { contains: q } },
        { extractedText: { contains: q } },
      ],
    },
    select: {
      id: true,
      title: true,
      type: true,
      courseId: true,
      extractedText: true,
      course: { select: { title: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: SEARCH_RESULT_CAP,
  });

  const lower = q.toLowerCase();
  return rows.map((row) => {
    const titleMatch = row.title.toLowerCase().includes(lower);
    let excerpt: string | null = null;
    const text = row.extractedText ?? "";
    if (!titleMatch && text) {
      const idx = text.toLowerCase().indexOf(lower);
      if (idx >= 0) {
        const start = Math.max(0, idx - 40);
        excerpt = text.slice(start, start + EXCERPT_LEN).trim();
      }
    } else if (text) {
      excerpt = text.slice(0, EXCERPT_LEN).trim();
    }
    return {
      id: row.id,
      title: row.title,
      type: row.type,
      courseId: row.courseId,
      courseTitle: row.course.title,
      excerpt,
      matchedOn: titleMatch ? ("title" as const) : ("text" as const),
    };
  });
}
