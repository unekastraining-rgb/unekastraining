/**
 * 2G-71 WS A — Universal Activity Execution Contract.
 *
 * Describes common lifecycle responsibilities without forcing Quiz/SIX/Flashcard
 * into identical implementations. Distinguishes:
 * Activity | Interaction | Evaluation | Evidence | Completion | Progression
 */

import type {
  EvidenceOutcomeName,
  LearningObjectTypeName,
  MasteryFacetName,
} from "@/lib/learning/types";
import type { ActivityFoundationType } from "@/lib/learning/activity-foundations";

/** Activity definition — identity, ownership, concept, criteria. Not evidence. */
export type UniversalActivityDefinition = {
  activityId: string;
  learningObjectType: LearningObjectTypeName | ActivityFoundationType;
  title: string;
  /** Opaque activity-owned payload (prompt, tests, rubric, seed data refs). */
  payload: Record<string, unknown>;
  conceptId: string;
  skillFacet: MasteryFacetName;
  /** Opaque success criteria — activity-owned, not ULE mastery math. */
  successCriteria: Record<string, unknown>;
};

/** Learner interaction — work product only. Never outcome/score/mastery. */
export type UniversalActivityInteraction = {
  activityId: string;
  /** Opaque learner work (code, SQL, draft, choices, observations, artifacts). */
  work: Record<string, unknown>;
  /** Optional Adaptive run context — opaque; does not mean completion. */
  adaptiveRunId?: string | null;
  adaptiveStepIndex?: number | null;
};

/**
 * Server evaluation result — authoritative.
 * Produced only after server-side evaluation. Never trusted from client.
 */
export type UniversalEvaluationResult = {
  serverAuthoritative: true;
  outcome: EvidenceOutcomeName;
  score: number | null;
  /** Opaque evaluator diagnostics for evidencePayload (not learner mastery math). */
  details: Record<string, unknown>;
  skillFacet: MasteryFacetName;
};

/** Evidence creation intent — still not ConceptMastery. */
export type UniversalEvidenceIntent = {
  learningObjectId: string;
  conceptId: string;
  learnerId: string;
  evaluation: UniversalEvaluationResult;
  sourceRef: { kind: string; [key: string]: unknown };
  evidencePayload?: Record<string, unknown>;
};

/**
 * Completion of the *activity attempt* (evidence written).
 * Does NOT imply Adaptive progression or LUCKY scheduling.
 */
export type UniversalActivityCompletion = {
  learningAttemptId: string;
  conceptId: string;
  outcome: EvidenceOutcomeName;
  score: number | null;
};

/**
 * Progression is owned by Adaptive coordinator / Orchestrator — never the activity.
 * This type is documentation only for adapters that *request* coordinator action.
 */
export type UniversalProgressionHandoff = {
  kind: "adaptive_bind_request";
  runId: string;
  learningAttemptId: string;
  stepIndex?: number | null;
};

export const ACTIVITY_LIFECYCLE_STAGES = [
  "definition",
  "resolve",
  "launch",
  "interaction",
  "evaluation",
  "evidence",
  "completion",
  "progression",
] as const;

export type ActivityLifecycleStage = (typeof ACTIVITY_LIFECYCLE_STAGES)[number];

export function activityExecutionTruthSummary(): {
  replacesQuizSixFlashcardAdapters: false;
  conflatesActivityWithEvidence: false;
  conflatesCompletionWithProgression: false;
  activityOwnsMasteryMath: false;
  activityOwnsAdaptiveProgression: false;
  activityOwnsLuckyScheduling: false;
} {
  return {
    replacesQuizSixFlashcardAdapters: false,
    conflatesActivityWithEvidence: false,
    conflatesCompletionWithProgression: false,
    activityOwnsMasteryMath: false,
    activityOwnsAdaptiveProgression: false,
    activityOwnsLuckyScheduling: false,
  };
}
