/**
 * Phase 13 — Read API over Phase 4A Learner State (additive).
 * Orchestrator remains the decision authority — this only surfaces evidence.
 */

import {
  getLearnerConceptState,
  getLearnerState,
  listEvidence,
} from "@/lib/learning/learner-state/service";
import { summarizeConceptEvidence } from "@/lib/learning/orchestrator/knowledge-loop/decide";
import { decideKnowledgeLoop } from "@/lib/learning/orchestrator/knowledge-loop/decide";
import { recommendSixTechnique } from "@/lib/learning/orchestrator/knowledge-loop/six-intelligence";
import { findKnowledgeConceptById } from "@/lib/learning/learner-state/concept-identity";
import { deriveCapabilityEvidence } from "@/lib/learning/learner-model/knowledge-loop/capabilities";
import { deriveKnowledgeLoopLearnerModel } from "@/lib/learning/learner-model/knowledge-loop/derive";
import { deriveMisconceptionEvidence } from "@/lib/learning/learner-model/knowledge-loop/misconceptions";
import { deriveInstructionalResponseHistory } from "@/lib/learning/learner-model/knowledge-loop/responses";
import {
  deriveRecentActivity,
  deriveRecentConcepts,
} from "@/lib/learning/learner-model/knowledge-loop/history";
import type {
  ConceptLearningNeed,
  KnowledgeLoopLearnerModel,
} from "@/lib/learning/learner-model/knowledge-loop/types";
import type { TeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import { getRegisteredGeneralTeachingContext } from "@/lib/learning/knowledge/retrieval/general-identity";

export async function getLearnerModel(
  userId: string,
): Promise<KnowledgeLoopLearnerModel> {
  const state = await getLearnerState(userId);
  const evidence = await listEvidence(userId);
  return deriveKnowledgeLoopLearnerModel({
    userId,
    concepts: state.concepts,
    evidence,
  });
}

export async function getRecentLearningHistory(userId: string) {
  const evidence = await listEvidence(userId);
  return {
    recentActivity: deriveRecentActivity(userId, evidence),
    recentConcepts: deriveRecentConcepts(userId, evidence),
  };
}

export async function getCapabilityEvidence(
  userId: string,
  conceptId: string,
) {
  const evidence = await listEvidence(userId);
  return deriveCapabilityEvidence(userId, evidence, conceptId);
}

export async function getMisconceptionEvidence(
  userId: string,
  conceptId: string,
) {
  const evidence = await listEvidence(userId);
  return deriveMisconceptionEvidence(userId, evidence, conceptId);
}

export async function getInstructionalResponseHistory(
  userId: string,
  conceptId: string,
) {
  const evidence = await listEvidence(userId);
  return deriveInstructionalResponseHistory(userId, evidence, conceptId);
}

/**
 * Concept learning need — Orchestrator decides WHAT; this packages evidence.
 * Does not invent concepts. Does not replace decideKnowledgeLoop.
 */
export async function getConceptLearningNeed(
  userId: string,
  conceptId: string,
): Promise<ConceptLearningNeed | null> {
  if (!userId.trim() || !conceptId.trim()) return null;
  if (!findKnowledgeConceptById(conceptId)) return null;

  const [conceptState, evidence, learnerState] = await Promise.all([
    getLearnerConceptState(userId, conceptId),
    listEvidence(userId),
    getLearnerState(userId),
  ]);

  const summary = summarizeConceptEvidence(
    conceptId,
    conceptState,
    evidence.filter((e) => e.userId === userId),
  );

  const knowledge = knowledgeContextForConcept(conceptId);
  const statesByConceptId = new Map(
    learnerState.concepts.map((c) => [c.conceptId, c] as const),
  );
  if (conceptState && !statesByConceptId.has(conceptId)) {
    statesByConceptId.set(conceptId, conceptState);
  }

  const decision = decideKnowledgeLoop({
    target: conceptId,
    knowledge,
    statesByConceptId,
    evidence: evidence.filter((e) => e.userId === userId),
  });

  const six = recommendSixTechnique({
    decision,
    summary,
    topic: conceptId,
  });

  const urgency: ConceptLearningNeed["urgency"] =
    decision.action === "reteach" || summary.incorrectCount >= 2
      ? "high"
      : decision.action === "teach" || decision.action === "practice"
        ? "medium"
        : "low";

  const evidenceNotes: string[] = [];
  if (summary.exposureCount === 0) evidenceNotes.push("no_exposure");
  if (summary.attemptCount === 0) evidenceNotes.push("no_attempts");
  if (summary.lastOutcome === "incorrect") evidenceNotes.push("recent_incorrect");
  if (!summary.hasRecallEvidence && summary.attemptCount > 0) {
    evidenceNotes.push("missing_recall");
  }
  if (summary.hasCheckEvidence && !summary.hasPracticeEvidence) {
    evidenceNotes.push("explain_without_apply");
  }

  return {
    conceptId,
    action: decision.action,
    urgency,
    reason: decision.reason,
    evidence: evidenceNotes,
    recommendedSix: {
      technique: six.technique,
      reasonCode: six.reasonCode,
      reason: six.reason,
    },
  };
}

function knowledgeContextForConcept(
  conceptId: string,
): TeachingKnowledgeContext | null {
  const ref = findKnowledgeConceptById(conceptId);
  if (!ref) return null;
  const fromKl =
    resolveTeachingKnowledgeContext(ref.concept.title) ??
    resolveTeachingKnowledgeContext(conceptId);
  if (fromKl) return fromKl;
  if (conceptId.startsWith("general:")) {
    const slug = conceptId.replace(/^general:/, "").split(":")[0];
    return getRegisteredGeneralTeachingContext(slug);
  }
  return null;
}
