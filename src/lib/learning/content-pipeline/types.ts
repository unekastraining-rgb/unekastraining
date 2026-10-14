/**
 * 2P-8 — Universal Learning Content Pipeline types.
 *
 * Source material informs learning. It does not itself create mastery.
 * Concept defines what is being learned. Activity mechanism defines how it is practiced.
 * Content defines the actual learning experience. Evaluation determines what was demonstrated.
 *
 * The content pipeline prepares learning experiences; the Orchestrator remains
 * the learning decision engine.
 */

import type { ActivityLearningCharacteristic } from "@/lib/learning/orchestrator/activity-intervention-capability";
import type { UniversalContentActivityKind } from "@/lib/learning/activities/content-contract";
import type { MasteryFacetName } from "@/lib/learning/types";

/** Lifecycle for prepared learning content (in-memory / fixture — not a CMS). */
export type ContentPipelineStatus =
  | "DRAFT"
  | "READY"
  | "PUBLISHED"
  | "ARCHIVED";

export type ContentSourceType =
  | "core_note"
  | "chapter_extract"
  | "uploaded_document"
  | "syllabus"
  | "course_material"
  | "textbook"
  | "instructor_material"
  | "learner_material"
  | "fixture";

/**
 * Opaque source reference — does not duplicate large blobs.
 * Source ≠ Evidence. Importing a source never creates ConceptMastery.
 */
export type ContentSourceRef = {
  sourceId: string;
  sourceType: ContentSourceType;
  title: string;
  /** Optional pointer into existing storage (note id, material id, path). */
  locationRef?: string | null;
  /** Owning learner when source is private. */
  ownerLearnerId?: string | null;
  learningSpaceId?: string | null;
  /** Excerpt / summary only — not a full document copy. */
  excerpt?: string | null;
};

/**
 * Learning objective grounded to a Concept.
 * Prefer additive metadata — not a second Objective Prisma model.
 */
export type LearningObjectiveSpec = {
  objectiveId: string;
  conceptTitle: string;
  /** When known — ownership validated separately before publish. */
  conceptId?: string | null;
  objective: string;
  domainContext?: string | null;
  /** Characteristics the objective requires of a learning mechanism. */
  requiredCharacteristics: readonly ActivityLearningCharacteristic[];
  preferredFacet?: MasteryFacetName | null;
};

export type ContentPreparationInput = {
  source: ContentSourceRef;
  objective: LearningObjectiveSpec;
  /**
   * Optional explicit mechanism. When omitted, characteristics suggest
   * candidate mechanisms — Orchestrator still decides interventions.
   */
  activityKind?: UniversalContentActivityKind | null;
  /** Explicit content catalog id when known. */
  contentId?: string | null;
  /** Human/system confirmation gate — unconfirmed stays DRAFT. */
  confirmed?: boolean;
};

export type PreparedLearningContent = {
  /** Stable preparation identity (not LearningAttempt id). */
  preparationId: string;
  status: ContentPipelineStatus;
  source: ContentSourceRef;
  objective: LearningObjectiveSpec;
  activityKind: UniversalContentActivityKind;
  contentId: string;
  contentVersion: string;
  title: string;
  task: string;
  evaluationMode: string;
  skillFacet: MasteryFacetName | null;
  /** Characteristics that matched capability (informational). */
  matchedCharacteristics: readonly ActivityLearningCharacteristic[];
  selectionReason: string;
  /** True only after validation + confirmation; never implies mastery. */
  learnerFacing: boolean;
};

export type ContentValidationIssue = {
  code: string;
  message: string;
};

export type ContentValidationResult =
  | { ok: true; content: PreparedLearningContent }
  | { ok: false; issues: ContentValidationIssue[] };

export type PipelineTruthSummary = {
  sourceIsNotEvidence: true;
  contentGenerationIsNotMastery: true;
  conceptIsUniversalKnowledgeAtom: true;
  pipelineIsNotOrchestrator: true;
  pipelineDoesNotWriteLearningAttempt: true;
  pipelineDoesNotWriteConceptMastery: true;
  humanConfirmedBeforePublished: true;
  noLlmContentGeneration: true;
  quizFlashcardNotCollapsed: true;
  sixRemainsFallback: true;
  luckyNotAutoFromImport: true;
};
