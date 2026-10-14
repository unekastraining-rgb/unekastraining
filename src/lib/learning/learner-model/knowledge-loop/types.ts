/**
 * Phase 13 — Deeper Learner Model types (evidence-derived, additive).
 * Does NOT replace LearnerConceptState / LearningEvidence / ULE mastery.
 * Never stores mastery percentages as authority.
 */

import type {
  LearningEvidence,
  LearningEvidenceType,
  LearnerConceptState,
} from "@/lib/learning/learner-state/types";
import type { KnowledgeLearningAction } from "@/lib/learning/orchestrator/knowledge-loop/types";
import type { SixComponent } from "@/lib/csl/six";

export type CapabilityKind =
  | "explanation"
  | "application"
  | "recall"
  | "visualization";

export type CapabilityEvidence = {
  conceptId: string;
  capability: CapabilityKind;
  evidenceType: LearningEvidenceType;
  outcome?: string;
  occurredAt: Date;
  source?: string;
  evidenceId: string;
};

export type LearningActivitySummary = {
  evidenceId: string;
  conceptId?: string;
  type: LearningEvidenceType;
  outcome?: string;
  occurredAt: Date;
  source?: string;
};

export type LearningProgression = {
  conceptId: string;
  exposureCount: number;
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  lastOutcome?: string;
  lastSeenAt?: Date;
};

export type MisconceptionEvidence = {
  conceptId: string;
  /** Descriptive signal — never intelligence/personality labels. */
  signal: string;
  evidenceCount: number;
  lastObservedAt: Date;
  source?: string;
};

export type InstructionalResponseRecord = {
  conceptId: string;
  /** Technique / activity surface used (Six component or evidence type). */
  technique: string;
  outcome?: string;
  occurredAt: Date;
  source?: string;
  evidenceId: string;
};

/**
 * Rich read model derived from Phase 4A Learner State + evidence.
 * Consumers should use this instead of manually folding raw evidence.
 */
export type KnowledgeLoopLearnerModel = {
  userId: string;
  knowledge: {
    concepts: LearnerConceptState[];
  };
  capabilityEvidence: {
    explanation: CapabilityEvidence[];
    application: CapabilityEvidence[];
    recall: CapabilityEvidence[];
    visualization: CapabilityEvidence[];
  };
  learningHistory: {
    recentActivity: LearningActivitySummary[];
    recentConcepts: string[];
    progression: LearningProgression[];
  };
  misconceptions: MisconceptionEvidence[];
  instructionalResponses: InstructionalResponseRecord[];
};

export type ConceptLearningNeed = {
  conceptId: string;
  action: KnowledgeLearningAction;
  urgency: "low" | "medium" | "high";
  reason: string;
  evidence: string[];
  recommendedSix?: {
    technique: SixComponent;
    reasonCode: string;
    reason: string;
  } | null;
};

/** Re-export evidence type for consumers. */
export type { LearningEvidence };
