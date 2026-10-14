/**
 * Phase 9 — Personal Knowledge Retrieval.
 * Searches the authenticated learner's owned materials/notes and builds
 * grounding inputs for Phase 7/8 retrieval. Does not promote to KL.
 */

import { db } from "@/lib/db";
import {
  loadChapterStudySourceText,
  loadCourseSourceText,
  loadMaterialSourceText,
} from "@/lib/ai/course-source";
import { instructionalSourceForTeaching } from "@/lib/learning/knowledge/instructional-library";
import { stripTeachFraming } from "@/lib/learning/knowledge/retrieval/normalize-target";
import type { KnowledgeSource } from "@/lib/learning/knowledge/retrieval/types";
import { searchOwnedMaterials } from "@/lib/learning/material-ingestion/search";

export type PersonalKnowledgeHit = {
  source: KnowledgeSource;
  materialId?: string;
  noteId?: string;
  title?: string;
  relevantText: string;
  relevance?: number;
};

export type PersonalGroundingForLearn = {
  groundingText?: string;
  materialId?: string | null;
  materialTitle?: string | null;
  courseId?: string | null;
  courseTitle?: string | null;
  noteText?: string | null;
  noteTitle?: string | null;
  noteId?: string | null;
  hits: PersonalKnowledgeHit[];
};

function searchTermsFromTopic(topic: string): string[] {
  const clean = stripTeachFraming(topic).toLowerCase();
  const stop = new Set([
    "the",
    "and",
    "for",
    "from",
    "with",
    "using",
    "my",
    "notes",
    "note",
    "chapter",
    "teach",
    "me",
    "about",
    "this",
    "that",
    "course",
    "material",
    "textbook",
  ]);
  const parts = clean
    .split(/[^a-z0-9]+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 3 && !stop.has(p));
  const unique = [...new Set(parts)];
  // Prefer longer distinctive tokens first.
  unique.sort((a, b) => b.length - a.length);
  return unique.slice(0, 6);
}

/**
 * Search owned course materials for topic-relevant excerpts.
 * Always scoped by userId (course.userId).
 */
export async function searchPersonalMaterialsForTopic(
  userId: string,
  topic: string,
  options?: { courseId?: string | null; limit?: number },
): Promise<PersonalKnowledgeHit[]> {
  if (!userId?.trim() || !topic.trim()) return [];
  const terms = searchTermsFromTopic(topic);
  if (terms.length === 0) return [];

  const hits: PersonalKnowledgeHit[] = [];
  const seen = new Set<string>();
  const limit = options?.limit ?? 5;

  for (const term of terms) {
    if (hits.length >= limit) break;
    let results = await searchOwnedMaterials(userId, term);
    if (options?.courseId) {
      results = results.filter((r) => r.courseId === options.courseId);
    }
    for (const r of results) {
      if (seen.has(r.id) || hits.length >= limit) continue;
      seen.add(r.id);
      // Load fuller owned text for grounding (ownership re-checked).
      const material = await db.courseMaterial.findFirst({
        where: { id: r.id, course: { userId } },
        select: { id: true, title: true, extractedText: true, courseId: true },
      });
      const text =
        instructionalSourceForTeaching(material?.extractedText ?? r.excerpt) ??
        r.excerpt ??
        "";
      if (text.trim().length < 80) continue;
      hits.push({
        source: {
          kind: "course-material",
          id: r.id,
          title: r.title,
          confidence: "medium",
          excerpt: text.slice(0, 400),
          limitations: [
            "Owned course material — not Knowledge Library canonical knowledge.",
          ],
        },
        materialId: r.id,
        title: r.title,
        relevantText: text.slice(0, 4000),
        relevance: r.matchedOn === "title" ? 0.9 : 0.7,
      });
    }
  }
  return hits;
}

/**
 * Search owned notes for topic-relevant content.
 * Always scoped by userId.
 */
export async function searchPersonalNotesForTopic(
  userId: string,
  topic: string,
  options?: { courseId?: string | null; limit?: number },
): Promise<PersonalKnowledgeHit[]> {
  if (!userId?.trim() || !topic.trim()) return [];
  const terms = searchTermsFromTopic(topic);
  if (terms.length === 0) return [];

  const limit = options?.limit ?? 3;
  const or = terms.flatMap((t) => [
    { title: { contains: t } },
    { content: { contains: t } },
  ]);

  const rows = await db.note.findMany({
    where: {
      userId,
      ...(options?.courseId ? { courseId: options.courseId } : {}),
      OR: or,
    },
    select: { id: true, title: true, content: true, courseId: true },
    orderBy: { updatedAt: "desc" },
    take: limit * 2,
  });

  const hits: PersonalKnowledgeHit[] = [];
  for (const row of rows) {
    const text = row.content?.trim() ?? "";
    if (text.length < 40) continue;
    hits.push({
      source: {
        kind: "user-note",
        id: row.id,
        title: row.title?.trim() || "Your notes",
        confidence: "medium",
        excerpt: text.slice(0, 400),
        limitations: [
          "User notes — not Knowledge Library canonical knowledge.",
        ],
      },
      noteId: row.id,
      title: row.title?.trim() || "Your notes",
      relevantText: text.slice(0, 4000),
      relevance: 0.75,
    });
    if (hits.length >= limit) break;
  }
  return hits;
}

/**
 * Assemble personal grounding for Learn / retrieval.
 * Prefer explicit materialId; otherwise search owned materials/notes by topic.
 * Never invents content. Never crosses user ownership.
 */
export async function loadPersonalGroundingForLearn(input: {
  userId: string;
  topic: string;
  courseId?: string | null;
  materialId?: string | null;
  /** Skip DB search (tests / when materials already loaded). */
  disableSearch?: boolean;
}): Promise<PersonalGroundingForLearn> {
  const empty: PersonalGroundingForLearn = {
    hits: [],
    courseId: input.courseId ?? null,
    materialId: input.materialId ?? null,
  };
  if (!input.userId?.trim() || !input.topic.trim()) return empty;

  let groundingText: string | undefined;
  let materialTitle: string | null = null;
  let courseTitle: string | null = null;
  let materialId = input.materialId ?? null;
  const courseId = input.courseId ?? null;

  // Explicit material / course loaders (already ownership-scoped).
  if (materialId) {
    const chapter =
      (await loadChapterStudySourceText(input.userId, materialId, 9000)) ??
      (await loadMaterialSourceText(input.userId, materialId, 9000));
    if (chapter?.text) {
      groundingText =
        instructionalSourceForTeaching(chapter.text) ?? chapter.text;
      materialTitle = chapter.materialTitle ?? null;
    }
  }
  if (!groundingText && courseId) {
    const course = await loadCourseSourceText(input.userId, courseId, 9000);
    if (course?.text) {
      groundingText =
        instructionalSourceForTeaching(course.text) ?? course.text;
      courseTitle = course.courseTitle ?? null;
    }
  }

  const hits: PersonalKnowledgeHit[] = [];
  let noteText: string | null = null;
  let noteTitle: string | null = null;
  let noteId: string | null = null;

  if (!input.disableSearch) {
    const materialHits = await searchPersonalMaterialsForTopic(
      input.userId,
      input.topic,
      { courseId, limit: 4 },
    );
    const noteHits = await searchPersonalNotesForTopic(
      input.userId,
      input.topic,
      { courseId, limit: 3 },
    );
    hits.push(...materialHits, ...noteHits);

    if (!groundingText && materialHits[0]) {
      groundingText = materialHits[0].relevantText;
      materialId = materialHits[0].materialId ?? materialId;
      materialTitle = materialHits[0].title ?? materialTitle;
    }
    if (noteHits[0]) {
      noteText = noteHits[0].relevantText;
      noteTitle = noteHits[0].title ?? "Your notes";
      noteId = noteHits[0].noteId ?? null;
    }
  }

  return {
    groundingText,
    materialId,
    materialTitle,
    courseId,
    courseTitle,
    noteText,
    noteTitle,
    noteId,
    hits,
  };
}
