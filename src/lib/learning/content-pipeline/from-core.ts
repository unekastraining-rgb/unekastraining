/**
 * 2P-8 follow-up — Thin CORE / ChapterStudyExtract → pipeline adapter.
 * Reuses CORE Knowledge bridge outputs; does not invent a second grounding algorithm.
 * Does not write ConceptMastery or LearningAttempt.
 */

import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import type { ActivityLearningCharacteristic } from "@/lib/learning/orchestrator/activity-intervention-capability";
import type {
  ContentPreparationInput,
  ContentSourceRef,
  LearningObjectiveSpec,
} from "./types";
import { makeContentSourceRef } from "./source";
import { makeLearningObjective } from "./characteristics";

/** Conservative verb → characteristic hints (deterministic, no LLM). */
function characteristicsFromObjectiveStatement(
  statement: string,
): ActivityLearningCharacteristic[] {
  const s = statement.toLowerCase();
  const out = new Set<ActivityLearningCharacteristic>();
  if (/\b(implement|code|program|build|write code)\b/.test(s)) {
    out.add("construction");
    out.add("application");
    out.add("practice");
  }
  if (/\b(diagnos|troubleshoot|debug|fault)\b/.test(s)) {
    out.add("troubleshooting");
    out.add("decision_making");
    out.add("scenario_reasoning");
  }
  if (/\b(explain|describe|define|summariz)\b/.test(s)) {
    out.add("explanation");
    out.add("communication");
  }
  if (/\b(analy[sz]e|compare|evaluat|interpret)\b/.test(s)) {
    out.add("analysis");
  }
  if (/\b(apply|practice|use|demonstrate)\b/.test(s)) {
    out.add("application");
    out.add("practice");
  }
  if (/\b(create|design|propose|plan)\b/.test(s)) {
    out.add("creation");
  }
  if (out.size === 0) {
    out.add("explanation");
    out.add("recall");
  }
  return [...out];
}

export function sourceRefFromCoreNote(input: {
  noteId: string;
  title: string;
  learnerId: string;
  learningSpaceId?: string | null;
  excerpt?: string | null;
}): ContentSourceRef {
  return makeContentSourceRef({
    sourceId: `core-note:${input.noteId}`,
    sourceType: "core_note",
    title: input.title,
    locationRef: input.noteId,
    ownerLearnerId: input.learnerId,
    learningSpaceId: input.learningSpaceId ?? null,
    excerpt: input.excerpt ?? null,
  });
}

export function sourceRefFromChapterExtract(input: {
  extract: Pick<ChapterStudyExtract, "title" | "chapterOverview">;
  learnerId: string;
  locationRef?: string | null;
  learningSpaceId?: string | null;
}): ContentSourceRef {
  return makeContentSourceRef({
    sourceId: `chapter-extract:${input.locationRef ?? input.extract.title}`,
    sourceType: "chapter_extract",
    title: input.extract.title || "Chapter extract",
    locationRef: input.locationRef ?? null,
    ownerLearnerId: input.learnerId,
    learningSpaceId: input.learningSpaceId ?? null,
    excerpt: input.extract.chapterOverview?.slice(0, 500) ?? null,
  });
}

/**
 * 2P-27 — CourseMaterial as ContentSourceRef.
 * Source ≠ Evidence ≠ Mastery. Ownership must be validated by the caller.
 */
export function sourceRefFromCourseMaterial(input: {
  materialId: string;
  title: string;
  learnerId: string;
  learningSpaceId?: string | null;
  excerpt?: string | null;
  /** Prefer course_material; syllabus when the row is a syllabus. */
  sourceType?: "course_material" | "syllabus" | "learner_material";
}): ContentSourceRef {
  return makeContentSourceRef({
    sourceId: `course-material:${input.materialId}`,
    sourceType: input.sourceType ?? "course_material",
    title: input.title,
    locationRef: input.materialId,
    ownerLearnerId: input.learnerId,
    learningSpaceId: input.learningSpaceId ?? null,
    excerpt: input.excerpt ?? null,
  });
}

/**
 * Map a ChapterStudyExtract learning objective (+ grounded Concept) into
 * a pipeline LearningObjectiveSpec. Caller must supply a confirmed conceptId.
 */
export function learningObjectiveFromExtract(input: {
  extractObjective: { code?: string; statement: string };
  conceptTitle: string;
  conceptId: string;
  domainContext?: string | null;
  index?: number;
}): LearningObjectiveSpec {
  const statement = input.extractObjective.statement.trim();
  const code = input.extractObjective.code?.trim() || `lo-${input.index ?? 0}`;
  return makeLearningObjective({
    objectiveId: `extract:${code}`,
    conceptTitle: input.conceptTitle,
    conceptId: input.conceptId,
    objective: statement,
    domainContext: input.domainContext ?? null,
    requiredCharacteristics: characteristicsFromObjectiveStatement(statement),
    preferredFacet: null,
  });
}

/**
 * Build a preparation input from CORE-grounded concept + extract LO.
 * Does not auto-confirm or publish — caller sets confirmed after review.
 */
export function preparationInputFromCoreGrounding(input: {
  source: ContentSourceRef;
  conceptId: string;
  conceptTitle: string;
  extractObjective: { code?: string; statement: string };
  domainContext?: string | null;
  activityKind?: ContentPreparationInput["activityKind"];
  contentId?: string | null;
  confirmed?: boolean;
  index?: number;
}): ContentPreparationInput {
  return {
    source: input.source,
    objective: learningObjectiveFromExtract({
      extractObjective: input.extractObjective,
      conceptTitle: input.conceptTitle,
      conceptId: input.conceptId,
      domainContext: input.domainContext,
      index: input.index,
    }),
    activityKind: input.activityKind ?? null,
    contentId: input.contentId ?? null,
    confirmed: Boolean(input.confirmed),
  };
}
