/**
 * Bundle E — Unified Learning Experience presentation types.
 * Read model only — never a second source of truth or decision engine.
 */

import type { LearningActivityIntent } from "@/lib/learning/knowledge/retrieval/learning-target";
import type { TeachScope } from "@/lib/learning/teach/scope";
import type {
  KnowledgeLearningAction,
  KnowledgeSixRecommendationApiView,
} from "@/lib/learning/orchestrator/knowledge-loop/types";

export type LearningExperiencePathPosition = {
  /** Path title (topic / family). */
  title: string;
  /** 0-based index — PATH POSITION, not mastery count. */
  currentIndex: number;
  total: number;
  /** Explicit: this is sequence position, not "concepts mastered". */
  kind: "path-position";
};

export type LearningExperienceCurrentConcept = {
  conceptId: string;
  title: string;
  /** 1-based display position when path known. */
  position?: number;
  total?: number;
};

export type LearningExperienceTarget = {
  rawRequest?: string;
  topic: string;
  activity?: LearningActivityIntent | string;
  scope?: TeachScope | string;
  resolution?: string;
};

export type LearningExperienceNextAction = {
  action: KnowledgeLearningAction | string;
  label: string;
  hint?: string;
  href?: string | null;
  room?: string | null;
};

/**
 * UI-friendly aggregate of existing intelligence outputs.
 * Built from Learning Target + path + Orchestrator + Six — never re-decides.
 */
export type LearningExperienceContext = {
  target: LearningExperienceTarget;
  currentConcept?: LearningExperienceCurrentConcept;
  path?: LearningExperiencePathPosition;
  /** Orchestrator WHAT decision (presentation copy of API view). */
  orchestratorDecision?: {
    action: KnowledgeLearningAction | string;
    conceptId?: string | null;
    nextConceptId?: string | null;
    learnerLabel?: string;
    learnerHint?: string;
  } | null;
  /** Six HOW recommendation — advisory only. */
  sixRecommendation?: KnowledgeSixRecommendationApiView | null;
  /** Friendly HOW sentence for learners (no internal reason codes). */
  sixHowMessage?: string | null;
  nextAction?: LearningExperienceNextAction | null;
  destinationHref?: string | null;
  /** True when Orchestrator action is complete for the requested scope. */
  isComplete?: boolean;
  /**
   * Never interpret path position as mastery.
   * Understanding comes from evidence elsewhere.
   */
  pathIsNotMastery: true;
};
