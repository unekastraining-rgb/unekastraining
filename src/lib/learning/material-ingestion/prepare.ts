/**
 * 2P-27 — Non-AI material → CORE extract → Knowledge candidates.
 * Does not write LearningAttempt or ConceptMastery.
 */

import {
  buildDeterministicColdStartExtract,
  canBuildDeterministicColdStart,
} from "@/lib/core/build-cold-start-chapter-extract";
import { parseNoteDocument, type NoteDocument } from "@/lib/core/note-types";
import { readStudyExtractFromUnknown } from "@/lib/core/study-extract-store";
import { db } from "@/lib/db";
import { sourceRefFromCourseMaterial } from "@/lib/learning/content-pipeline/from-core";
import {
  confirmCoreKnowledgeCandidate,
  findExistingLearningSpaceForCourse,
  isCoreKnowledgeBridgeEnabled,
  previewCoreKnowledgeBridge,
} from "@/lib/learning/knowledge/core-bridge";
import { pickCoreBridgeFocusConceptId } from "@/lib/learning/orchestrator/core-adaptive-bridge";
import {
  getOrCreateMaterialWorkbook,
  loadMaterialForUser,
} from "@/lib/materials/workbook-from-material";

import { presentLearnerFacingProvenance } from "./provenance";
import type {
  MaterialLearningPrepareResult,
  MaterialProcessingState,
} from "./types";

/** Soft cap so huge PDFs do not flood cold-start / AI context later. */
export const MATERIAL_EXTRACT_TEXT_CAP = 40_000;

export class MaterialLearningError extends Error {
  constructor(
    message: string,
    public readonly code: "not_found" | "failed" | "forbidden" = "failed",
  ) {
    super(message);
    this.name = "MaterialLearningError";
  }
}

function learnerMessageForState(state: MaterialProcessingState): string {
  switch (state) {
    case "UPLOADING":
      return "We're uploading your material.";
    case "PROCESSING":
      return "We're preparing your material.";
    case "READY":
      return "Your material is ready for review and learning.";
    case "PARTIAL":
      return "Some content was extracted, but this document may need review.";
    case "FAILED":
      return "We couldn't read this material.";
    default:
      return "Material status unknown.";
  }
}

function persistExtractOnDocument(
  doc: NoteDocument,
  extract: ReturnType<typeof buildDeterministicColdStartExtract>,
  meta: {
    materialId: string;
    title: string;
    type: string;
    state: MaterialProcessingState;
    nonAi: boolean;
    truncated: boolean;
  },
): NoteDocument {
  return {
    ...doc,
    metadata: {
      ...(doc.metadata ?? {}),
      chapterStudyExtract: extract,
      materialSource: {
        materialId: meta.materialId,
        title: meta.title,
        type: meta.type,
      },
      materialLearning: {
        version: 1,
        state: meta.state,
        preparedAt: new Date().toISOString(),
        nonAi: meta.nonAi,
        truncated: meta.truncated,
        materialId: meta.materialId,
      },
    },
  };
}

async function loadCourseTopics(courseId: string) {
  return db.topic.findMany({
    where: { courseId },
    orderBy: { sortOrder: "asc" },
    select: { name: true, description: true },
    take: 40,
  });
}

/**
 * Prepare owned material for learning:
 * workbook → deterministic ChapterStudyExtract → Knowledge preview.
 * Never creates LearningAttempt / ConceptMastery.
 */
export async function prepareMaterialForLearning(
  userId: string,
  materialId: string,
): Promise<MaterialLearningPrepareResult> {
  const material = await loadMaterialForUser(userId, materialId);
  if (!material) {
    throw new MaterialLearningError("Material not found.", "not_found");
  }

  const workbook = await getOrCreateMaterialWorkbook(userId, materialId);
  if (!workbook) {
    throw new MaterialLearningError("Material not found.", "not_found");
  }

  const space = await findExistingLearningSpaceForCourse(
    userId,
    material.courseId,
  );
  const provenance = presentLearnerFacingProvenance({
    materialTitle: material.title,
  });
  const excerpt = (material.extractedText ?? "").trim().slice(0, 500);
  const source = sourceRefFromCourseMaterial({
    materialId: material.id,
    title: material.title,
    learnerId: userId,
    learningSpaceId: space?.id ?? null,
    excerpt: excerpt || null,
    sourceType: material.type === "SYLLABUS" ? "syllabus" : "course_material",
  });

  let doc = parseNoteDocument(workbook.note.contentJson);
  let existingExtract = readStudyExtractFromUnknown(
    doc.metadata?.chapterStudyExtract,
  );
  let state: MaterialProcessingState = existingExtract ? "READY" : "PROCESSING";
  let nonAi = true;
  let truncated = false;

  if (!existingExtract) {
    const rawText = (material.extractedText ?? "").trim();
    truncated = rawText.length > MATERIAL_EXTRACT_TEXT_CAP;
    const sourceText = rawText.slice(0, MATERIAL_EXTRACT_TEXT_CAP);
    const topics = await loadCourseTopics(material.courseId);

    if (
      canBuildDeterministicColdStart(sourceText, topics) ||
      sourceText.length >= 80
    ) {
      const extract = buildDeterministicColdStartExtract({
        sourceText:
          sourceText.length >= 40
            ? sourceText
            : `${material.title}\n\n${topics.map((t) => t.name).join("\n")}`,
        courseTitle: material.course.title || material.title,
        topics: topics.length
          ? topics
          : sourceText.length >= 80
            ? undefined
            : [{ name: material.title, description: excerpt || null }],
      });
      state = truncated || !sourceText ? "PARTIAL" : "READY";
      doc = persistExtractOnDocument(doc, extract, {
        materialId: material.id,
        title: material.title,
        type: material.type,
        state,
        nonAi: true,
        truncated,
      });
      await db.note.update({
        where: { id: workbook.note.id },
        data: { contentJson: JSON.stringify(doc) },
      });
      existingExtract = extract;
    } else if (sourceText.length > 0 || topics.length > 0) {
      state = "PARTIAL";
      // Still open a minimal extract so the learner can review typed body.
      const extract = buildDeterministicColdStartExtract({
        sourceText: sourceText || material.title,
        courseTitle: material.course.title || material.title,
        topics:
          topics.length > 0
            ? topics
            : [{ name: material.title, description: "Review this material in CORE." }],
      });
      doc = persistExtractOnDocument(doc, extract, {
        materialId: material.id,
        title: material.title,
        type: material.type,
        state,
        nonAi: true,
        truncated,
      });
      await db.note.update({
        where: { id: workbook.note.id },
        data: { contentJson: JSON.stringify(doc) },
      });
      existingExtract = extract;
    } else {
      state = "FAILED";
    }
  } else {
    const prior = doc.metadata?.materialLearning as
      | { nonAi?: boolean; truncated?: boolean }
      | undefined;
    nonAi = prior?.nonAi !== false;
    truncated = Boolean(prior?.truncated);
  }

  const knowledgeBridgeEnabled = isCoreKnowledgeBridgeEnabled();
  let candidates: MaterialLearningPrepareResult["candidates"] = [];
  let linkedConceptIds: string[] = [];
  let focusConceptId: string | null = null;

  if (knowledgeBridgeEnabled && existingExtract) {
    const preview = await previewCoreKnowledgeBridge({
      userId,
      noteId: workbook.note.id,
    });
    candidates = preview.candidates.filter((c) => c.status !== "rejected");
    linkedConceptIds = preview.linkedConceptIds;
    focusConceptId = pickCoreBridgeFocusConceptId({
      linkedConceptIds: preview.linkedConceptIds,
    });
  }

  return {
    materialId: material.id,
    noteId: workbook.note.id,
    courseId: material.courseId,
    title: material.title,
    state,
    learnerMessage: learnerMessageForState(state),
    nonAi,
    truncated,
    source,
    provenanceLabel: provenance.label,
    knowledgeBridgeEnabled,
    hasStudyExtract: Boolean(existingExtract),
    candidates,
    linkedConceptIds,
    focusConceptId,
  };
}

/** Status without mutating (unless workbook missing — still creates workbook only). */
export async function getMaterialLearningStatus(
  userId: string,
  materialId: string,
): Promise<MaterialLearningPrepareResult> {
  const material = await loadMaterialForUser(userId, materialId);
  if (!material) {
    throw new MaterialLearningError("Material not found.", "not_found");
  }

  const workbook = await getOrCreateMaterialWorkbook(userId, materialId);
  if (!workbook) {
    throw new MaterialLearningError("Material not found.", "not_found");
  }

  const space = await findExistingLearningSpaceForCourse(
    userId,
    material.courseId,
  );
  const provenance = presentLearnerFacingProvenance({
    materialTitle: material.title,
  });
  const doc = parseNoteDocument(workbook.note.contentJson);
  const existingExtract = readStudyExtractFromUnknown(
    doc.metadata?.chapterStudyExtract,
  );
  const meta = doc.metadata?.materialLearning as
    | { state?: MaterialProcessingState; nonAi?: boolean; truncated?: boolean }
    | undefined;

  let state: MaterialProcessingState = "FAILED";
  if (existingExtract) {
    state = meta?.state === "PARTIAL" ? "PARTIAL" : "READY";
  } else if ((material.extractedText ?? "").trim().length > 0) {
    state = "PROCESSING";
  }

  const knowledgeBridgeEnabled = isCoreKnowledgeBridgeEnabled();
  let candidates: MaterialLearningPrepareResult["candidates"] = [];
  let linkedConceptIds: string[] = [];
  let focusConceptId: string | null = null;

  if (knowledgeBridgeEnabled && existingExtract) {
    const preview = await previewCoreKnowledgeBridge({
      userId,
      noteId: workbook.note.id,
    });
    candidates = preview.candidates.filter((c) => c.status !== "rejected");
    linkedConceptIds = preview.linkedConceptIds;
    focusConceptId = pickCoreBridgeFocusConceptId({
      linkedConceptIds: preview.linkedConceptIds,
    });
  }

  return {
    materialId: material.id,
    noteId: workbook.note.id,
    courseId: material.courseId,
    title: material.title,
    state,
    learnerMessage: learnerMessageForState(state),
    nonAi: meta?.nonAi !== false,
    truncated: Boolean(meta?.truncated),
    source: sourceRefFromCourseMaterial({
      materialId: material.id,
      title: material.title,
      learnerId: userId,
      learningSpaceId: space?.id ?? null,
      excerpt: (material.extractedText ?? "").trim().slice(0, 500) || null,
      sourceType: material.type === "SYLLABUS" ? "syllabus" : "course_material",
    }),
    provenanceLabel: provenance.label,
    knowledgeBridgeEnabled,
    hasStudyExtract: Boolean(existingExtract),
    candidates,
    linkedConceptIds,
    focusConceptId,
  };
}

/**
 * Confirm a Knowledge candidate from material-prepared note.
 * Creates Concept only — never LearningAttempt / ConceptMastery.
 */
export async function confirmMaterialConceptCandidate(input: {
  userId: string;
  materialId: string;
  candidateKey: string;
}): Promise<{ conceptId: string; created: boolean; noteId: string }> {
  const material = await loadMaterialForUser(input.userId, input.materialId);
  if (!material) {
    throw new MaterialLearningError("Material not found.", "not_found");
  }
  const workbook = await getOrCreateMaterialWorkbook(
    input.userId,
    input.materialId,
  );
  if (!workbook) {
    throw new MaterialLearningError("Material not found.", "not_found");
  }

  const result = await confirmCoreKnowledgeCandidate({
    userId: input.userId,
    noteId: workbook.note.id,
    candidateKey: input.candidateKey,
  });

  return {
    conceptId: result.conceptId,
    created: result.created,
    noteId: workbook.note.id,
  };
}
