/**
 * 2P-28 — Ownership-safe material context resolution.
 * Server-derived learner id only. Never trusts client learnerId.
 */

import { parseNoteDocument } from "@/lib/core/note-types";
import { db } from "@/lib/db";
import { findExistingLearningSpaceForCourse } from "@/lib/learning/knowledge/core-bridge";
import { readLearningKnowledgeMeta } from "@/lib/learning/knowledge/core-bridge-types";
import { loadMaterialForUser } from "@/lib/materials/workbook-from-material";

import { pickMaterialContextPriority } from "./priority";
import { buildMaterialProvenance } from "./provenance";
import type {
  LearningMaterialContext,
  MaterialContextPrioritySource,
  MaterialContextResolution,
} from "./types";

function extractionStateFromDoc(
  contentJson: string | null | undefined,
): LearningMaterialContext["extractionState"] {
  if (!contentJson) return null;
  try {
    const doc = parseNoteDocument(contentJson);
    const state = doc.metadata?.materialLearning?.state;
    if (
      state === "READY" ||
      state === "PARTIAL" ||
      state === "FAILED" ||
      state === "PROCESSING"
    ) {
      return state;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function sectionFromExtract(
  contentJson: string | null | undefined,
): string | null {
  if (!contentJson) return null;
  try {
    const doc = parseNoteDocument(contentJson);
    const extract = doc.metadata?.chapterStudyExtract;
    const title = extract?.title?.trim();
    if (title) return title;
    const firstDef = extract?.definitions?.[0]?.term?.trim();
    if (firstDef) return firstDef;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Resolve a single owned material into LearningMaterialContext.
 * Returns null for missing / foreign material (no title leak).
 */
export async function resolveOwnedMaterialContext(input: {
  userId: string;
  materialId: string;
  conceptId?: string | null;
  noteId?: string | null;
}): Promise<LearningMaterialContext | null> {
  const materialId = input.materialId.trim();
  if (!materialId) return null;

  const material = await loadMaterialForUser(input.userId, materialId);
  if (!material) return null;

  const space = await findExistingLearningSpaceForCourse(
    input.userId,
    material.courseId,
  );

  let noteId = input.noteId?.trim() || null;
  let contentJson: string | null = null;
  if (noteId) {
    const note = await db.note.findFirst({
      where: { id: noteId, userId: input.userId, materialId },
      select: { id: true, contentJson: true },
    });
    if (note) {
      contentJson = note.contentJson;
    } else {
      noteId = null;
    }
  }
  if (!noteId) {
    const note = await db.note.findFirst({
      where: { userId: input.userId, materialId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, contentJson: true },
    });
    if (note) {
      noteId = note.id;
      contentJson = note.contentJson;
    }
  }

  const extractionState = extractionStateFromDoc(contentJson);
  const section = sectionFromExtract(contentJson);
  const partial =
    extractionState === "PARTIAL" ||
    extractionState === "FAILED" ||
    !(material.extractedText ?? "").trim();

  const provenance = buildMaterialProvenance({
    materialTitle: material.title,
    section,
  });

  return {
    materialId: material.id,
    title: material.title,
    sourceType: material.type,
    learningSpaceId: space?.id ?? null,
    courseId: material.courseId,
    conceptId: input.conceptId?.trim() || null,
    noteId,
    extractionState,
    provenance,
    partial,
  };
}

type LinkedMaterialHit = {
  materialId: string;
  noteId: string;
  title: string;
  updatedAt: Date;
  contentJson: string | null;
};

/**
 * Find owned materials linked to a concept via Note learningKnowledge / materialSource.
 * Preserves multiple relationships; primary = most recently updated.
 */
export async function listConceptLinkedMaterials(
  userId: string,
  conceptId: string,
): Promise<LinkedMaterialHit[]> {
  const cid = conceptId.trim();
  if (!cid) return [];

  const notes = await db.note.findMany({
    where: {
      userId,
      materialId: { not: null },
    },
    orderBy: { updatedAt: "desc" },
    take: 40,
    select: {
      id: true,
      materialId: true,
      contentJson: true,
      updatedAt: true,
      material: { select: { title: true } },
    },
  });

  const hits: LinkedMaterialHit[] = [];
  const seen = new Set<string>();

  for (const note of notes) {
    const mid = note.materialId?.trim();
    if (!mid || seen.has(mid)) continue;

    let linked = false;
    try {
      const doc = parseNoteDocument(note.contentJson);
      const knowledge = readLearningKnowledgeMeta(doc.metadata?.learningKnowledge);
      if (knowledge.linkedConceptIds.includes(cid)) {
        linked = true;
      }
      if (
        !linked &&
        doc.metadata?.materialSource?.materialId === mid &&
        knowledge.linkedConceptIds.length === 0
      ) {
        // Soft: material workbook without confirm yet — not concept-linked.
        linked = false;
      }
    } catch {
      linked = false;
    }

    if (!linked) continue;
    seen.add(mid);
    hits.push({
      materialId: mid,
      noteId: note.id,
      title: note.material?.title ?? "Your material",
      updatedAt: note.updatedAt,
      contentJson: note.contentJson,
    });
  }

  return hits;
}

/**
 * LearningSpace → course materials (weakest automatic priority).
 * Uses most recently updated material on the space's course.
 */
async function learningSpaceMaterialId(
  userId: string,
  learningSpaceId: string | null | undefined,
): Promise<string | null> {
  const sid = learningSpaceId?.trim();
  if (!sid) return null;
  const space = await db.learningSpace.findFirst({
    where: { id: sid, userId },
    select: { courseId: true },
  });
  if (!space?.courseId) return null;
  const material = await db.courseMaterial.findFirst({
    where: { courseId: space.courseId, course: { userId } },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  return material?.id ?? null;
}

/**
 * Resolve optional material context for Adaptive / Activity / Tutor.
 * Priority: explicit → activity → concept → learning_space → none.
 */
export async function resolveLearningMaterialContext(input: {
  userId: string;
  conceptId?: string | null;
  explicitMaterialId?: string | null;
  activityMaterialId?: string | null;
  learningSpaceId?: string | null;
}): Promise<MaterialContextResolution> {
  const conceptId = input.conceptId?.trim() || null;

  let conceptMaterialId: string | null = null;
  let related: LearningMaterialContext["relatedSources"] = [];
  let conceptNoteId: string | null = null;

  if (conceptId) {
    const linked = await listConceptLinkedMaterials(input.userId, conceptId);
    if (linked.length > 0) {
      conceptMaterialId = linked[0]!.materialId;
      conceptNoteId = linked[0]!.noteId;
      related = linked.slice(1).map((h) => ({
        materialId: h.materialId,
        title: h.title,
        provenanceLabel: buildMaterialProvenance({ materialTitle: h.title }).label,
      }));
    }
  }

  const spaceMaterialId = await learningSpaceMaterialId(
    input.userId,
    input.learningSpaceId,
  );

  const picked = pickMaterialContextPriority({
    explicitMaterialId: input.explicitMaterialId,
    activityMaterialId: input.activityMaterialId,
    conceptMaterialId,
    learningSpaceMaterialId: spaceMaterialId,
  });

  if (!picked.materialId) {
    return {
      context: null,
      prioritySource: "none",
      createsEvidence: false,
    };
  }

  const noteHint =
    picked.prioritySource === "concept" ? conceptNoteId : null;

  const context = await resolveOwnedMaterialContext({
    userId: input.userId,
    materialId: picked.materialId,
    conceptId,
    noteId: noteHint,
  });

  // Foreign / missing after pick — treat as none (no leak).
  if (!context) {
    return {
      context: null,
      prioritySource: "none",
      createsEvidence: false,
    };
  }

  if (related.length && picked.prioritySource === "concept") {
    context.relatedSources = related;
  }

  return {
    context,
    prioritySource: picked.prioritySource,
    createsEvidence: false,
  };
}

export type { MaterialContextPrioritySource };
