/**
 * 2P-29 — Universal Learner Context (read-only projection).
 * Aggregates existing truth. Does not create a personalization engine.
 */

import type { LearningIntent } from "@/lib/learning/intent/types";
import type { LearnerConceptStateProjection } from "@/lib/learning/learner-model/project";
import type { LearningMaterialContext } from "@/lib/learning/material-context";
import type { LearningDecisionContext } from "@/lib/learning/orchestrator/context";
import type { PersonaPresentationHooks } from "@/lib/learning/persona-accessibility-hooks";
import type { TeachingStyle } from "@/lib/learning/tutor/teaching-style/types";

/** Signal category for documentation / consumers. */
export type LearnerContextSignalCategory =
  | "decision_driving"
  | "decision_contextual"
  | "presentation_only"
  | "product_navigation";

/**
 * Normalized read-only learner context.
 * All nested fields optional — cold start / partial context must work.
 */
export type UniversalLearnerContext = {
  learnerId: string;
  /** When resolved — never trust client learnerId for ownership. */
  resolvedAt: string;
  /** Explicit: this projection never writes evidence/mastery. */
  createsEvidence: false;
  createsMastery: false;

  /** Decision-driving: ConceptMastery-backed projection when conceptId known. */
  concept?: LearnerConceptStateProjection | null;

  /** Decision-contextual: LearningSpace (optional). */
  learningSpace?: {
    id: string;
    title: string | null;
    subjectDomain: string | null;
    kind: string | null;
  } | null;

  /** Decision-contextual: 2P-28 material context. */
  material?: LearningMaterialContext | null;

  /** Decision-contextual: WHY (Learning Intent). */
  intent?: LearningIntent | null;

  /** Presentation: HOW (Teaching Style). */
  teachingStyle?: TeachingStyle | null;

  /** Presentation: accessibility / modality hooks. */
  preferences?: {
    persona: PersonaPresentationHooks | null;
  };

  /** Decision-contextual / navigation: active Adaptive progression. */
  activeLearning?: {
    runId: string;
    conceptId: string;
    status: string;
    currentStepIndex: number;
  } | null;

  /**
   * Supporting recent activity labels (from concept projection when present).
   * Not a second activity history store.
   */
  recentActivitySummary?: {
    totalAttempts: number;
    label: string | null;
  } | null;

  /** Formal Orchestrator decision envelope (ids + intent) — not a diagnosis. */
  decisionContext?: LearningDecisionContext;
};

export type ResolveUniversalLearnerContextInput = {
  /** Server-derived only. */
  learnerId: string;
  conceptId?: string | null;
  learningSpaceId?: string | null;
  materialId?: string | null;
  /** Raw intent — parsed, never invented. */
  intent?: unknown;
  /** Explicit teaching style if already resolved by caller. */
  teachingStyle?: TeachingStyle | null;
  includePersonaHooks?: boolean;
  includeMaterial?: boolean;
  includeActiveRun?: boolean;
};
