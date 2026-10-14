/**
 * 2P-8 — Content preparation + validation.
 *
 * Prepares reusable Universal Activity content from source + concept + objective.
 * Never writes LearningAttempt / ConceptMastery / evidence.
 * Never alters Orchestrator diagnosis.
 */

import {
  getActivityContentDescriptor,
  selectActivityContent,
  type UniversalContentActivityKind,
} from "@/lib/learning/activities/content-contract";
import { assertOwnedConcept } from "@/lib/learning/activities/server-evaluation";
import {
  capabilitySupportsCharacteristics,
  isMeaningfulObjective,
  makeLearningObjective,
  suggestActivityKindsForObjective,
} from "./characteristics";
import { makeContentSourceRef } from "./source";
import type {
  ContentPreparationInput,
  ContentValidationIssue,
  ContentValidationResult,
  PipelineTruthSummary,
  PreparedLearningContent,
} from "./types";

function stablePreparationId(input: {
  sourceId: string;
  objectiveId: string;
  activityKind: string;
  contentId: string;
}): string {
  return `prep:${input.sourceId}:${input.objectiveId}:${input.activityKind}:${input.contentId}`;
}

/**
 * Prepare content candidate. Status is DRAFT until validate+confirm → READY/PUBLISHED.
 */
export function prepareLearningContent(
  input: ContentPreparationInput,
): PreparedLearningContent | { error: string } {
  const source = makeContentSourceRef(input.source);
  const objective = makeLearningObjective(input.objective);

  if (!source.sourceId) return { error: "missing_source" };
  if (!objective.objectiveId) return { error: "missing_objective_id" };
  if (!isMeaningfulObjective(objective.objective)) {
    return { error: "objective_not_meaningful" };
  }
  if (!objective.conceptTitle) return { error: "missing_concept_title" };

  const suggested = suggestActivityKindsForObjective(objective);
  const activityKind: UniversalContentActivityKind | null =
    input.activityKind ?? suggested[0] ?? null;
  if (!activityKind) return { error: "no_compatible_activity_kind" };

  if (
    !capabilitySupportsCharacteristics(
      activityKind,
      objective.requiredCharacteristics,
    )
  ) {
    return { error: "capability_incompatible" };
  }

  const selected = selectActivityContent({
    activityKind,
    contentId: input.contentId,
    conceptTitle: objective.conceptTitle,
    subjectDomain: objective.domainContext,
  });
  if (!selected) return { error: "content_unavailable" };

  const descriptor = selected.descriptor;
  const confirmed = Boolean(input.confirmed);
  const status = confirmed ? "READY" : "DRAFT";

  return {
    preparationId: stablePreparationId({
      sourceId: source.sourceId,
      objectiveId: objective.objectiveId,
      activityKind,
      contentId: descriptor.contentId,
    }),
    status,
    source,
    objective,
    activityKind,
    contentId: descriptor.contentId,
    contentVersion: `v1:${descriptor.contentId}:${objective.objectiveId}`,
    title: descriptor.title,
    task: descriptor.task,
    evaluationMode: descriptor.evaluationMode,
    skillFacet: descriptor.skillFacet ?? objective.preferredFacet ?? null,
    matchedCharacteristics: objective.requiredCharacteristics.filter((c) =>
      capabilitySupportsCharacteristics(activityKind, [c]),
    ),
    selectionReason: selected.reason,
    learnerFacing: false,
  };
}

export async function validatePreparedLearningContent(
  content: PreparedLearningContent,
  opts?: {
    requireConfirmation?: boolean;
    learnerId?: string | null;
    publish?: boolean;
    /** When true and conceptId present, require owned Concept via assertOwnedConcept. */
    requireOwnedConcept?: boolean;
  },
): Promise<ContentValidationResult> {
  const issues: ContentValidationIssue[] = [];

  if (!content.source.sourceId) {
    issues.push({ code: "missing_source", message: "Source identity required." });
  }
  if (!content.objective.conceptTitle.trim()) {
    issues.push({
      code: "missing_concept",
      message: "Objective must connect to a Concept title.",
    });
  }
  if (!isMeaningfulObjective(content.objective.objective)) {
    issues.push({
      code: "objective_not_meaningful",
      message: "Objective is missing or generic.",
    });
  }
  if (!content.contentId) {
    issues.push({
      code: "missing_content",
      message: "Prepared content must reference catalog contentId.",
    });
  }

  const descriptor = getActivityContentDescriptor(
    content.activityKind,
    content.contentId,
  );
  if (!descriptor) {
    issues.push({
      code: "unknown_content",
      message: "Content id is not in the Universal Activity catalog.",
    });
  } else if (!descriptor.evaluationMode) {
    issues.push({
      code: "missing_evaluation",
      message: "Content lacks an evaluation mode.",
    });
  }

  if (
    !capabilitySupportsCharacteristics(
      content.activityKind,
      content.objective.requiredCharacteristics,
    )
  ) {
    issues.push({
      code: "capability_incompatible",
      message: "Activity mechanism does not support required characteristics.",
    });
  }

  const learnerId = opts?.learnerId?.trim();
  const owner = content.source.ownerLearnerId?.trim();
  if (learnerId && owner && owner !== learnerId) {
    issues.push({
      code: "foreign_source",
      message: "Source belongs to another learner.",
    });
  }

  const conceptId = content.objective.conceptId?.trim();
  if (opts?.requireOwnedConcept === true && learnerId && conceptId) {
    const owned = await assertOwnedConcept({ learnerId, conceptId });
    if (!owned.ok) {
      issues.push({
        code: owned.reason,
        message:
          owned.reason === "foreign_concept"
            ? "Concept is not owned by this learner."
            : "Concept is missing.",
      });
    }
  }

  if (opts?.requireConfirmation !== false && content.status === "DRAFT") {
    issues.push({
      code: "unconfirmed",
      message: "Content remains DRAFT until human/system confirmation.",
    });
  }

  if (issues.length > 0) return { ok: false, issues };

  let next: PreparedLearningContent = {
    ...content,
    learnerFacing: true,
  };
  if (opts?.publish) {
    next = { ...next, status: "PUBLISHED" };
  } else if (next.status === "DRAFT") {
    next = { ...next, status: "READY" };
  }

  return { ok: true, content: next };
}

/**
 * Full pipeline step: prepare → validate → optional publish.
 * Does not write mastery. Opt-in Concept ownership via requireOwnedConcept.
 */
export async function runContentPipeline(
  input: ContentPreparationInput & {
    learnerId?: string | null;
    publish?: boolean;
    requireOwnedConcept?: boolean;
  },
): Promise<ContentValidationResult> {
  const prepared = prepareLearningContent({
    ...input,
    confirmed: Boolean(input.confirmed),
  });
  if ("error" in prepared) {
    return {
      ok: false,
      issues: [{ code: prepared.error, message: prepared.error }],
    };
  }
  const forValidate: PreparedLearningContent = input.confirmed
    ? { ...prepared, status: "READY" }
    : prepared;

  return validatePreparedLearningContent(forValidate, {
    requireConfirmation: !input.confirmed,
    learnerId: input.learnerId,
    publish: input.publish,
    requireOwnedConcept: input.requireOwnedConcept === true,
  });
}

export function contentPipelineTruthSummary(): PipelineTruthSummary {
  return {
    sourceIsNotEvidence: true,
    contentGenerationIsNotMastery: true,
    conceptIsUniversalKnowledgeAtom: true,
    pipelineIsNotOrchestrator: true,
    pipelineDoesNotWriteLearningAttempt: true,
    pipelineDoesNotWriteConceptMastery: true,
    humanConfirmedBeforePublished: true,
    noLlmContentGeneration: true,
    quizFlashcardNotCollapsed: true,
    sixRemainsFallback: true,
    luckyNotAutoFromImport: true,
  };
}

/** Architecture guard: preparation modules must not import mastery writers. */
export function pipelineModuleDoesNotWriteMastery(sourceText: string): boolean {
  // Ignore this helper's own documentation strings.
  const stripped = sourceText
    .replace(/pipelineModuleDoesNotWriteMastery[\s\S]*$/m, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  const banned = [
    "from \"@/lib/learning/mastery/apply\"",
    "from '@/lib/learning/mastery/apply'",
    "from \"@/lib/learning/evidence/record\"",
    "from '@/lib/learning/evidence/record'",
    "recordAuthoritativeActivityEvidence(",
    "applyEvidenceToMastery(",
    "recordEvidence(",
  ];
  return banned.every((b) => !stripped.includes(b));
}
