/**
 * Phase 4C — Resolve Knowledge Loop Orchestrator decision (read-only).
 * Loads learner state + evidence; never writes.
 * Phase 12 — attaches Six recommendation (HOW) without changing WHAT.
 */

import type { TeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import {
  getLearnerConceptState,
  listEvidence,
} from "@/lib/learning/learner-state/service";
import type { LearnerConceptState } from "@/lib/learning/learner-state/types";
import {
  decideKnowledgeLoop,
  summarizeConceptEvidence,
} from "@/lib/learning/orchestrator/knowledge-loop/decide";
import { buildOrchestrationExecutionView } from "@/lib/learning/orchestrator/knowledge-loop/execute";
import { recommendSixTechnique } from "@/lib/learning/orchestrator/knowledge-loop/six-intelligence";
import type {
  KnowledgeOrchestratorDecision,
  KnowledgeOrchestrationApiView,
  KnowledgeSixRecommendationApiView,
} from "@/lib/learning/orchestrator/knowledge-loop/types";
import type { StudyRoomContext } from "@/lib/study/resolve-study-room";
import type { LearningActionExecution } from "@/lib/learning/orchestrator/knowledge-loop/execute";

/**
 * Read-only orchestration. Does not mutate Learning Evidence or Learner State.
 */
export async function resolveKnowledgeLoopDecision(input: {
  userId: string;
  target: string;
  knowledge: TeachingKnowledgeContext | null | undefined;
}): Promise<KnowledgeOrchestratorDecision> {
  const knowledge = input.knowledge ?? null;
  const statesByConceptId = new Map<string, LearnerConceptState | null>();

  if (knowledge) {
    for (const concept of knowledge.concepts) {
      const state = input.userId?.trim()
        ? await getLearnerConceptState(input.userId, concept.id)
        : null;
      statesByConceptId.set(concept.id, state);
    }
  }

  const evidence = input.userId?.trim()
    ? await listEvidence(input.userId)
    : [];

  return decideKnowledgeLoop({
    target: input.target,
    knowledge,
    statesByConceptId,
    evidence,
  });
}

/** Decision + destination adapter for Learn / Study Room surfaces. */
export async function resolveKnowledgeLoopOrchestration(input: {
  userId: string;
  target: string;
  knowledge: TeachingKnowledgeContext | null | undefined;
  roomContext?: StudyRoomContext;
}): Promise<{
  decision: KnowledgeOrchestratorDecision;
  apiView: KnowledgeOrchestrationApiView;
  execution: LearningActionExecution;
}> {
  const knowledge = input.knowledge ?? null;
  const statesByConceptId = new Map<string, LearnerConceptState | null>();

  if (knowledge) {
    for (const concept of knowledge.concepts) {
      const state = input.userId?.trim()
        ? await getLearnerConceptState(input.userId, concept.id)
        : null;
      statesByConceptId.set(concept.id, state);
    }
  }

  const evidence = input.userId?.trim()
    ? await listEvidence(input.userId)
    : [];

  const decision = decideKnowledgeLoop({
    target: input.target,
    knowledge,
    statesByConceptId,
    evidence,
  });

  const built = buildOrchestrationExecutionView(
    decision,
    input.roomContext ?? { topic: input.target },
  );

  // Phase 12 — additive Six HOW recommendation; never changes Orchestrator WHAT.
  let sixRecommendation: KnowledgeSixRecommendationApiView | null = null;
  try {
    const focusId = decision.conceptId;
    const state = focusId ? statesByConceptId.get(focusId) : null;
    const summary = focusId
      ? summarizeConceptEvidence(focusId, state, evidence)
      : null;
    const rec = recommendSixTechnique({
      decision,
      summary,
      topic: input.target,
    });
    sixRecommendation = {
      technique: rec.technique,
      reasonCode: rec.reasonCode,
      reason: rec.reason,
      confidence: rec.confidence,
      conceptId: rec.conceptId ?? null,
    };
  } catch {
    sixRecommendation = null;
  }

  return {
    decision,
    apiView: {
      ...built.apiView,
      sixRecommendation,
    },
    execution: built.execution,
  };
}
