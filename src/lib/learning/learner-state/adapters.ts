/**
 * Phase 4A — Adapters that observe existing Learn / evaluate flows
 * and write Knowledge Library–aligned learning evidence.
 *
 * Does not change Teaching Engine, Orchestrator, Lucky, or ULE mastery.
 */

import type { TeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import {
  conceptRefsFromTeachingContext,
  resolveEvidenceConceptIds,
  resolveEvidenceConceptsForTopic,
  type ResolvedKnowledgeConceptRef,
} from "@/lib/learning/learner-state/concept-identity";
import { outcomeFromScoreRatio } from "@/lib/learning/learner-state/derive";
import { recordLearningEvidence } from "@/lib/learning/learner-state/service";
import type {
  LearningEvidenceType,
  RecordLearningEvidenceResult,
} from "@/lib/learning/learner-state/types";

/**
 * Record lesson_exposure for each resolved Knowledge Library concept
 * when a Learn lesson is successfully produced.
 */
export async function recordLessonExposuresFromTeachingContext(input: {
  userId: string;
  teachingKnowledge: TeachingKnowledgeContext | null | undefined;
  /** Optional idempotency key prefix (e.g. lesson hash / request id). */
  eventKeyPrefix?: string;
  source?: string;
}): Promise<RecordLearningEvidenceResult[]> {
  if (!input.userId || !input.teachingKnowledge) return [];

  const refs = conceptRefsFromTeachingContext(input.teachingKnowledge);
  if (refs.length === 0) return [];

  const results: RecordLearningEvidenceResult[] = [];
  for (const ref of refs) {
    const eventKey = input.eventKeyPrefix
      ? `${input.eventKeyPrefix}:${ref.conceptId}`
      : undefined;
    const result = await recordLearningEvidence({
      userId: input.userId,
      type: "lesson_exposure",
      conceptId: ref.conceptId,
      domain: ref.domain,
      subject: ref.subject ?? undefined,
      outcome: "completed",
      source: input.source ?? "six-lesson",
      eventKey,
      metadata: {
        target: input.teachingKnowledge.target,
        resolution: input.teachingKnowledge.resolution,
        learningPathId: input.teachingKnowledge.learningPathId,
      },
    });
    results.push(result);
  }
  return results;
}

/** Map study-evaluate mode/component to Phase 4A/6 evidence type. */
export function evidenceTypeFromEvaluate(input: {
  mode: string;
  sixComponent?: string | null;
}): LearningEvidenceType | null {
  const mode = input.mode.toLowerCase();
  if (mode === "blurting") return "recall_result";
  // Learn Check (teach-me) remains a check/demonstration-style attempt.
  if (mode === "teach-me") return "check_attempt";
  if (mode !== "six") return null;

  const component = (input.sixComponent ?? "").toLowerCase().replace(/_/g, "-");
  switch (component) {
    case "hands-on-practice":
      return "application_attempt";
    case "active-recall":
      return "recall_result";
    case "feynman":
    case "detailed-explanation":
      return "explanation_attempt";
    case "visualization":
      return "visualization_attempt";
    case "chunking":
      // Chunking evaluate submissions are understanding checks, not page views.
      return "check_attempt";
    default:
      return "check_attempt";
  }
}

/**
 * Record attempt evidence from Study Evaluate when the topic maps to
 * Knowledge Library concepts. Failures must not break evaluate UX.
 */
export async function recordEvaluateKnowledgeEvidence(input: {
  userId: string;
  topic: string | null | undefined;
  mode: string;
  sixComponent?: string | null;
  scoreRatio: number;
  /** Optional stable id for this evaluate submission. */
  eventKey?: string;
}): Promise<RecordLearningEvidenceResult[]> {
  const type = evidenceTypeFromEvaluate({
    mode: input.mode,
    sixComponent: input.sixComponent,
  });
  if (!type || !input.userId) return [];

  const refs = resolveEvidenceConceptsForTopic(input.topic);
  if (refs.length === 0) {
    // Unknown topic — do not fabricate concept IDs.
    return [];
  }

  const outcome = outcomeFromScoreRatio(input.scoreRatio);
  const results: RecordLearningEvidenceResult[] = [];

  for (const ref of refs) {
    const eventKey = input.eventKey
      ? `${input.eventKey}:${ref.conceptId}`
      : undefined;
    results.push(
      await recordLearningEvidence({
        userId: input.userId,
        type,
        conceptId: ref.conceptId,
        domain: ref.domain,
        subject: ref.subject ?? undefined,
        outcome,
        source: "study-evaluate",
        eventKey,
        metadata: {
          mode: input.mode,
          sixComponent: input.sixComponent ?? null,
          topic: input.topic ?? null,
        },
      }),
    );
  }
  return results;
}

export async function recordLessonExposuresForTarget(input: {
  userId: string;
  target: string;
  eventKeyPrefix?: string;
  source?: string;
}): Promise<RecordLearningEvidenceResult[]> {
  const refs = resolveEvidenceConceptIds(input.target);
  if (refs.length === 0) return [];

  // Build a minimal teaching-like path via refs directly.
  const results: RecordLearningEvidenceResult[] = [];
  for (const ref of refs) {
    const eventKey = input.eventKeyPrefix
      ? `${input.eventKeyPrefix}:${ref.conceptId}`
      : undefined;
    results.push(
      await recordLearningEvidence({
        userId: input.userId,
        type: "lesson_exposure",
        conceptId: ref.conceptId,
        domain: ref.domain,
        subject: ref.subject ?? undefined,
        outcome: "completed",
        source: input.source ?? "six-lesson",
        eventKey,
        metadata: { target: input.target },
      }),
    );
  }
  return results;
}

export type { ResolvedKnowledgeConceptRef };
