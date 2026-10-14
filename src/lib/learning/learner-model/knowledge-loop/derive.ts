/**
 * Phase 13 — Pure derive of KnowledgeLoopLearnerModel from existing state/evidence.
 */

import type {
  LearningEvidence,
  LearnerConceptState,
} from "@/lib/learning/learner-state/types";
import { deriveCapabilityEvidence } from "@/lib/learning/learner-model/knowledge-loop/capabilities";
import {
  deriveProgression,
  deriveRecentActivity,
  deriveRecentConcepts,
} from "@/lib/learning/learner-model/knowledge-loop/history";
import { deriveMisconceptionEvidence } from "@/lib/learning/learner-model/knowledge-loop/misconceptions";
import { deriveInstructionalResponseHistory } from "@/lib/learning/learner-model/knowledge-loop/responses";
import type { KnowledgeLoopLearnerModel } from "@/lib/learning/learner-model/knowledge-loop/types";

/**
 * Build the richer learner model from already-loaded Phase 4A data.
 * Deterministic. No I/O. No mastery percentages.
 */
export function deriveKnowledgeLoopLearnerModel(input: {
  userId: string;
  concepts: readonly LearnerConceptState[];
  evidence: readonly LearningEvidence[];
}): KnowledgeLoopLearnerModel {
  const userId = input.userId.trim();
  const ownedConcepts = input.concepts.filter((c) => c.userId === userId);
  const ownedEvidence = input.evidence.filter((e) => e.userId === userId);

  return {
    userId,
    knowledge: { concepts: [...ownedConcepts] },
    capabilityEvidence: deriveCapabilityEvidence(userId, ownedEvidence),
    learningHistory: {
      recentActivity: deriveRecentActivity(userId, ownedEvidence),
      recentConcepts: deriveRecentConcepts(userId, ownedEvidence),
      progression: deriveProgression(ownedConcepts),
    },
    misconceptions: deriveMisconceptionEvidence(userId, ownedEvidence),
    instructionalResponses: deriveInstructionalResponseHistory(
      userId,
      ownedEvidence,
    ),
  };
}
