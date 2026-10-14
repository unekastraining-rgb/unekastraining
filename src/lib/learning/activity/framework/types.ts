/**
 * Phase 17 — Unified Learning Activity contract (additive).
 * Describes the learning task; does not replace specialized implementations.
 */

import type { KnowledgeLearningAction } from "@/lib/learning/orchestrator/knowledge-loop/types";
import type { SixComponent } from "@/lib/csl/six";
import type { LearningEvidenceType } from "@/lib/learning/learner-state/types";

export type LearningActivityType =
  | "lesson"
  | "practice"
  | "recall"
  | "coding"
  | "lab"
  | "project"
  | "simulation"
  | "writing"
  | "presentation"
  | "visual"
  | "problem-solving"
  | "sql"
  | "game";

export type LearningActivityStatus =
  | "available"
  | "in-progress"
  | "completed";

export type LearningActivitySource = {
  courseId?: string;
  academicItemId?: string;
  coreSourceId?: string;
  challengeId?: string;
};

export type LearningActivityDescriptor = {
  id: string;
  type: LearningActivityType;
  conceptIds: string[];
  learningTarget?: string;
  title?: string;
  source?: LearningActivitySource;
  status: LearningActivityStatus;
  /** Orchestrator WHAT this activity fulfills. */
  orchestratorAction?: KnowledgeLearningAction;
  /** Six HOW recommendation (advisory). */
  sixTechnique?: SixComponent | null;
  /** Existing specialized implementation key when mapped. */
  implementationKey?: string;
};

export type LearningActivityEvaluationOutcome =
  | "correct"
  | "incorrect"
  | "partial"
  | "completed"
  | "attempted";

export type LearningActivityEvaluation = {
  activityId: string;
  outcome: LearningActivityEvaluationOutcome;
  evidenceType: LearningEvidenceType;
  conceptIds: string[];
  userId: string;
  feedback?: unknown;
  metadata?: Record<string, unknown>;
  source?: string;
};

export type LearningActivityRegistryEntry = {
  type: LearningActivityType;
  /** Existing foundation / content-contract kind when applicable. */
  foundationType?: string;
  defaultEvidenceType: LearningEvidenceType;
  defaultOrchestratorAction: KnowledgeLearningAction;
  defaultSixTechnique?: SixComponent;
  implementationKey: string;
};
