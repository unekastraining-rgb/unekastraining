/**
 * Universal Learning Engine — foundational TypeScript contracts (Phase 2A).
 * Prisma enums mirror these; keep names aligned.
 */

export const MASTERY_FACETS = [
  "RECOGNIZE",
  "EXPLAIN",
  "APPLY",
  "SOLVE",
  "PERFORM",
  "RETAIN",
] as const;

export type MasteryFacetName = (typeof MASTERY_FACETS)[number];

export const LEARNING_SPACE_KINDS = [
  "COURSE",
  "CLASS",
  "TRAINING",
  "GOAL",
  "HOBBY",
  "CERTIFICATION",
  "SELF_DIRECTED",
  "EVERYDAY",
] as const;

export type LearningSpaceKindName = (typeof LEARNING_SPACE_KINDS)[number];

export const LEARNING_OBJECT_TYPES = [
  "EXPLANATION",
  "QUIZ_ITEM",
  "FLASHCARD",
  "FEYNMAN",
  "VISUALIZATION",
  "HANDS_ON_PRACTICE",
  "ACTIVE_RECALL",
  "TUTOR_TURN",
  "CODING_CHALLENGE",
  "SQL_CHALLENGE",
  "SIMULATION",
  "GAME",
  "WRITING_EXERCISE",
  "PROJECT_TASK",
  "PRESENTATION_PRACTICE",
  "LAB",
  "RETENTION_ITEM",
  "OTHER",
] as const;

export type LearningObjectTypeName = (typeof LEARNING_OBJECT_TYPES)[number];

export const EVIDENCE_OUTCOMES = [
  "SUCCESS",
  "PARTIAL",
  "FAIL",
  "ABANDONED",
] as const;

export type EvidenceOutcomeName = (typeof EVIDENCE_OUTCOMES)[number];

export const SIX_TECHNIQUES = [
  "chunking",
  "detailed_explanation",
  "feynman",
  "visualization",
  "hands_on_practice",
  "active_recall",
] as const;

export type SixTechniqueName = (typeof SIX_TECHNIQUES)[number];

/** Standardized evidence the engine understands (adapters emit this only). */
export interface EvidenceEnvelope {
  learnerId: string;
  learningObjectId: string;
  conceptId?: string | null;
  skillFacet: MasteryFacetName;
  outcome: EvidenceOutcomeName;
  score?: number | null;
  confidence?: number | null;
  misconceptionSignals?: string[];
  sourceRef: {
    kind: string;
    [key: string]: unknown;
  };
  evidencePayload?: Record<string, unknown>;
  startedAt?: Date;
  endedAt?: Date;
}

import type { EvidenceSignals } from "@/lib/learning/evidence/aggregation-types";

export interface FacetedMasteryScores {
  recognize: number;
  explain: number;
  apply: number;
  solve: number;
  perform: number;
  retain: number;
  confidence: number;
}

export interface LearnerConceptMasterySummary {
  learnerId: string;
  conceptId: string;
  conceptTitle: string;
  facets: FacetedMasteryScores;
  /** Legacy TopicMastery dims when a Topic maps to this Concept. */
  topicMastery?: {
    topicId: string;
    proficiency: number;
    confidence: number;
    understanding: number;
    recall: number;
    application: number;
  } | null;
  recentMissedCount: number;
  /** Counts of LearningAttempts by source kind (quiz / flashcard / study_evaluate / other). */
  evidenceSourceCounts: {
    quiz: number;
    flashcard: number;
    study_evaluate: number;
    other: number;
  };
  reviewCount: number;
  lastReviewedAt: Date | null;
  nextReviewAt: Date | null;
  /**
   * Phase 2F-2 — optional evidence-intelligence signals (flag-gated).
   * Derived from LearningAttempt; never replaces ConceptMastery.
   * Distinct from recentMissedCount (MissedQuestion-derived).
   */
  evidenceSignals?: EvidenceSignals;
}
