import { readStudyExtractFromUnknown } from "@/lib/core/study-extract-store";
import { parseNoteDocument, type NoteDocument } from "@/lib/core/note-types";
import { db } from "@/lib/db";
import { createConcept } from "@/lib/learning/knowledge/concept";
import {
  extractKnowledgeCandidatesFromStudyExtract,
  normalizeConceptTitle,
} from "@/lib/learning/knowledge/core-bridge-candidates";
import { isCoreKnowledgeBridgeEnabled } from "@/lib/learning/knowledge/core-bridge-flag";
import {
  emptyLearningKnowledgeMeta,
  readLearningKnowledgeMeta,
  type KnowledgeConceptCandidate,
  type LearningKnowledgeMeta,
} from "@/lib/learning/knowledge/core-bridge-types";

export {
  isCoreKnowledgeBridgeEnabled,
} from "@/lib/learning/knowledge/core-bridge-flag";
export {
  extractKnowledgeCandidatesFromStudyExtract,
  normalizeConceptTitle,
  CORE_KNOWLEDGE_CANDIDATE_CAP,
} from "@/lib/learning/knowledge/core-bridge-candidates";
export type {
  KnowledgeConceptCandidate,
  LearningKnowledgeMeta,
} from "@/lib/learning/knowledge/core-bridge-types";

export class CoreKnowledgeBridgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoreKnowledgeBridgeError";
  }
}

/** Lookup-only LearningSpace for a course — never creates. */
export async function findExistingLearningSpaceForCourse(
  userId: string,
  courseId: string | null | undefined,
): Promise<{ id: string; subjectDomain: string | null } | null> {
  if (!courseId?.trim()) return null;
  const space = await db.learningSpace.findFirst({
    where: { userId, courseId: courseId.trim() },
    select: { id: true, subjectDomain: true },
  });
  return space;
}

/** Find an owned Concept by normalized title within an optional LearningSpace. */
export async function findOwnedConceptByNormalizedTitle(input: {
  userId: string;
  normalizedTitle: string;
  learningSpaceId?: string | null;
}): Promise<{ id: string; title: string } | null> {
  const where =
    input.learningSpaceId != null
      ? { userId: input.userId, learningSpaceId: input.learningSpaceId }
      : { userId: input.userId };

  const rows = await db.concept.findMany({
    where,
    select: { id: true, title: true },
    take: 200,
  });

  const match = rows.find(
    (row) => normalizeConceptTitle(row.title) === input.normalizedTitle,
  );
  return match ?? null;
}

async function loadOwnedNote(userId: string, noteId: string) {
  const note = await db.note.findFirst({
    where: { id: noteId, userId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      topicId: true,
      materialId: true,
      contentJson: true,
      topic: {
        select: {
          id: true,
          name: true,
          conceptId: true,
          concept: { select: { id: true, title: true, userId: true } },
        },
      },
    },
  });
  if (!note) {
    throw new CoreKnowledgeBridgeError("Note not found.");
  }
  return note;
}

function docFromNote(contentJson: string | null): NoteDocument {
  return parseNoteDocument(contentJson);
}

function extractFromDoc(doc: NoteDocument) {
  return readStudyExtractFromUnknown(doc.metadata?.chapterStudyExtract);
}

function knowledgeFromDoc(doc: NoteDocument): LearningKnowledgeMeta {
  return readLearningKnowledgeMeta(doc.metadata?.learningKnowledge);
}

/**
 * Merge learningKnowledge into NoteDocument metadata without dropping other fields.
 */
export function mergeLearningKnowledgeIntoDocument(
  doc: NoteDocument,
  knowledge: LearningKnowledgeMeta,
): NoteDocument {
  return {
    ...doc,
    metadata: {
      ...(doc.metadata ?? {}),
      learningKnowledge: knowledge,
    },
  };
}

async function enrichCandidatesWithExistingConcepts(input: {
  userId: string;
  learningSpaceId: string | null;
  candidates: KnowledgeConceptCandidate[];
  linkedIds: string[];
}): Promise<KnowledgeConceptCandidate[]> {
  const linked = new Set(input.linkedIds);
  const enriched: KnowledgeConceptCandidate[] = [];

  for (const candidate of input.candidates) {
    if (candidate.status === "rejected") {
      enriched.push(candidate);
      continue;
    }

    let existingConceptId = candidate.existingConceptId ?? null;
    if (!existingConceptId) {
      const found = await findOwnedConceptByNormalizedTitle({
        userId: input.userId,
        normalizedTitle: candidate.normalizedTitle,
        learningSpaceId: input.learningSpaceId,
      });
      existingConceptId = found?.id ?? null;
    } else {
      // Verify ownership
      const owned = await db.concept.findFirst({
        where: { id: existingConceptId, userId: input.userId },
        select: { id: true },
      });
      if (!owned) existingConceptId = null;
    }

    let status: KnowledgeConceptCandidate["status"] = candidate.status;
    if (existingConceptId && linked.has(existingConceptId)) {
      status = "linked";
    } else if (existingConceptId) {
      status = "existing";
    } else {
      status = "proposed";
    }

    enriched.push({
      ...candidate,
      existingConceptId,
      status,
    });
  }

  return enriched;
}

export interface CoreKnowledgePreviewResult {
  enabled: boolean;
  noteId: string;
  learningSpaceId: string | null;
  hasStudyExtract: boolean;
  linkedConceptIds: string[];
  candidates: KnowledgeConceptCandidate[];
  truncated: boolean;
  totalBeforeCap: number;
}

/** Preview candidates — no Concept creation, no LearningSpace creation. */
export async function previewCoreKnowledgeBridge(input: {
  userId: string;
  noteId: string;
}): Promise<CoreKnowledgePreviewResult> {
  if (!isCoreKnowledgeBridgeEnabled()) {
    return {
      enabled: false,
      noteId: input.noteId,
      learningSpaceId: null,
      hasStudyExtract: false,
      linkedConceptIds: [],
      candidates: [],
      truncated: false,
      totalBeforeCap: 0,
    };
  }

  const note = await loadOwnedNote(input.userId, input.noteId);
  const doc = docFromNote(note.contentJson);
  const knowledge = knowledgeFromDoc(doc);
  const extract = extractFromDoc(doc);
  const space = await findExistingLearningSpaceForCourse(
    input.userId,
    note.courseId,
  );

  const topicConcept =
    note.topic?.concept && note.topic.concept.userId === input.userId
      ? { id: note.topic.concept.id, title: note.topic.concept.title }
      : null;

  const rawCandidates = extractKnowledgeCandidatesFromStudyExtract(extract, {
    topicConcept,
    alreadyLinkedIds: knowledge.linkedConceptIds,
  });

  // Count uncapped for truncation hint (re-run without relying on internal cap by building loosely)
  const uncapped = extractKnowledgeCandidatesFromStudyExtract(extract, {
    topicConcept,
    alreadyLinkedIds: knowledge.linkedConceptIds,
    cap: 100,
  });

  const rejectedKeys = new Set(
    knowledge.candidateConcepts
      .filter((c) => c.status === "rejected")
      .map((c) => c.key),
  );

  const withRejects = rawCandidates.map((c) =>
    rejectedKeys.has(c.key) ? { ...c, status: "rejected" as const } : c,
  );

  const candidates = await enrichCandidatesWithExistingConcepts({
    userId: input.userId,
    learningSpaceId: space?.id ?? null,
    candidates: withRejects,
    linkedIds: knowledge.linkedConceptIds,
  });

  return {
    enabled: true,
    noteId: note.id,
    learningSpaceId: space?.id ?? null,
    hasStudyExtract: Boolean(extract),
    linkedConceptIds: knowledge.linkedConceptIds,
    candidates,
    truncated: uncapped.length > candidates.length,
    totalBeforeCap: uncapped.length,
  };
}

async function persistNoteKnowledge(
  noteId: string,
  contentJson: string | null,
  knowledge: LearningKnowledgeMeta,
): Promise<LearningKnowledgeMeta> {
  const doc = docFromNote(contentJson);
  const nextDoc = mergeLearningKnowledgeIntoDocument(doc, knowledge);
  await db.note.update({
    where: { id: noteId },
    data: { contentJson: JSON.stringify(nextDoc) },
  });
  return knowledge;
}

/** Confirm a candidate: link existing Concept or create one — user-owned only. */
export async function confirmCoreKnowledgeCandidate(input: {
  userId: string;
  noteId: string;
  candidateKey: string;
}): Promise<{
  conceptId: string;
  created: boolean;
  knowledge: LearningKnowledgeMeta;
}> {
  if (!isCoreKnowledgeBridgeEnabled()) {
    throw new CoreKnowledgeBridgeError("Knowledge bridge is disabled.");
  }

  const note = await loadOwnedNote(input.userId, input.noteId);
  const doc = docFromNote(note.contentJson);
  const knowledge = knowledgeFromDoc(doc);
  const preview = await previewCoreKnowledgeBridge(input);
  const candidate = preview.candidates.find((c) => c.key === input.candidateKey);
  if (!candidate || candidate.status === "rejected") {
    throw new CoreKnowledgeBridgeError("Candidate not found.");
  }

  const space = await findExistingLearningSpaceForCourse(
    input.userId,
    note.courseId,
  );

  let conceptId = candidate.existingConceptId ?? null;
  let created = false;

  if (conceptId) {
    const owned = await db.concept.findFirst({
      where: { id: conceptId, userId: input.userId },
      select: { id: true },
    });
    if (!owned) {
      throw new CoreKnowledgeBridgeError("Concept not found.");
    }
  } else {
    const again = await findOwnedConceptByNormalizedTitle({
      userId: input.userId,
      normalizedTitle: candidate.normalizedTitle,
      learningSpaceId: space?.id ?? null,
    });
    if (again) {
      conceptId = again.id;
    } else {
      const concept = await createConcept({
        userId: input.userId,
        title: candidate.title,
        description: candidate.definition ?? null,
        subjectDomain: space?.subjectDomain ?? null,
        learningSpaceId: space?.id ?? null,
      });
      conceptId = concept.id;
      created = true;
    }
  }

  const linkedConceptIds = [
    ...new Set([...knowledge.linkedConceptIds, conceptId]),
  ];

  const candidateConcepts = preview.candidates.map((c) =>
    c.key === candidate.key
      ? {
          ...c,
          existingConceptId: conceptId,
          status: "linked" as const,
        }
      : c,
  );

  const nextKnowledge: LearningKnowledgeMeta = {
    version: 1,
    linkedConceptIds,
    confirmedAt: new Date().toISOString(),
    candidateConcepts,
  };

  await persistNoteKnowledge(note.id, note.contentJson, nextKnowledge);

  return { conceptId, created, knowledge: nextKnowledge };
}

/** Mark a candidate rejected in note metadata (no Concept delete). */
export async function rejectCoreKnowledgeCandidate(input: {
  userId: string;
  noteId: string;
  candidateKey: string;
}): Promise<{ knowledge: LearningKnowledgeMeta }> {
  if (!isCoreKnowledgeBridgeEnabled()) {
    throw new CoreKnowledgeBridgeError("Knowledge bridge is disabled.");
  }

  const note = await loadOwnedNote(input.userId, input.noteId);
  const doc = docFromNote(note.contentJson);
  const knowledge = knowledgeFromDoc(doc);
  const preview = await previewCoreKnowledgeBridge(input);
  const candidate = preview.candidates.find((c) => c.key === input.candidateKey);
  if (!candidate) {
    throw new CoreKnowledgeBridgeError("Candidate not found.");
  }

  const candidateConcepts = preview.candidates.map((c) =>
    c.key === candidate.key ? { ...c, status: "rejected" as const } : c,
  );

  // Keep prior rejected keys not in this preview
  const keys = new Set(candidateConcepts.map((c) => c.key));
  for (const prior of knowledge.candidateConcepts) {
    if (prior.status === "rejected" && !keys.has(prior.key)) {
      candidateConcepts.push(prior);
    }
  }

  const nextKnowledge: LearningKnowledgeMeta = {
    ...knowledge,
    candidateConcepts,
  };

  await persistNoteKnowledge(note.id, note.contentJson, nextKnowledge);
  return { knowledge: nextKnowledge };
}

/**
 * Load confirmed linked Concept IDs from notes for a course/material context.
 * Ownership-validated. Safe when bridge flag is OFF (returns []).
 */
export async function loadLinkedConceptIdsForCoreContext(input: {
  userId: string;
  courseId?: string | null;
  materialId?: string | null;
}): Promise<string[]> {
  if (!isCoreKnowledgeBridgeEnabled()) return [];

  try {
    const notes = await db.note.findMany({
      where: {
        userId: input.userId,
        ...(input.materialId
          ? { materialId: input.materialId }
          : input.courseId
            ? { courseId: input.courseId }
            : {}),
        contentJson: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: { contentJson: true },
    });

    const ids: string[] = [];
    for (const note of notes) {
      const knowledge = knowledgeFromDoc(docFromNote(note.contentJson));
      ids.push(...knowledge.linkedConceptIds);
    }

    const unique = [...new Set(ids)].slice(0, 5);
    if (unique.length === 0) return [];

    const owned = await db.concept.findMany({
      where: { userId: input.userId, id: { in: unique } },
      select: { id: true },
    });
    return owned.map((c) => c.id);
  } catch (error) {
    console.error("loadLinkedConceptIdsForCoreContext failed:", error);
    return [];
  }
}
