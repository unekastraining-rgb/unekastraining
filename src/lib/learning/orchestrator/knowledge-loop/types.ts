/**
 * Phase 4C — Knowledge Library Loop Orchestrator types.
 *
 * Deterministic next-action decisions from KL concepts + Phase 4A learner state.
 * Coexists with the ULE ConceptMastery orchestrator (diagnose.ts) — does not replace it.
 *
 * The Orchestrator decides WHAT action is next.
 * It does NOT generate lessons, write evidence, or invent concepts.
 */

import type { TeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import type {
  LearningEvidence,
  LearnerConceptState,
} from "@/lib/learning/learner-state/types";

/** Canonical learning actions for the Knowledge Library loop. */
export type KnowledgeLearningAction =
  | "teach"
  | "practice"
  | "reteach"
  | "recall"
  | "advance"
  | "complete";

/**
 * Stable machine-readable reason codes.
 * Not for direct learner display unless a surface already maps them.
 */
export type KnowledgeOrchestratorReasonCode =
  | "new-concept"
  | "needs-practice"
  | "recent-incorrect"
  | "needs-recall"
  | "ready-to-advance"
  | "no-next-concept"
  | "unknown-target"
  | "path-continue";

export type KnowledgeOrchestratorConfidence = "low" | "medium" | "high";

/** Debug/test trace — not for public learner lesson payloads. */
export type KnowledgeOrchestratorTrace = {
  target: string;
  focusConceptId: string | null;
  pathId?: string;
  pathConceptIds?: string[];
  exposureCount: number;
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  lastOutcome?: string;
  hasPracticeEvidence: boolean;
  hasCheckEvidence: boolean;
  hasRecallEvidence: boolean;
};

export type KnowledgeOrchestratorDecision = {
  action: KnowledgeLearningAction;
  /** Concept the action applies to (null when unknown-target). */
  conceptId: string | null;
  /** When action is advance — next KL concept id (never fabricated). */
  nextConceptId?: string | null;
  reasonCode: KnowledgeOrchestratorReasonCode;
  /** Short internal explanation. */
  reason: string;
  confidence: KnowledgeOrchestratorConfidence;
  /** Presentation hint for reteach → Personalized Teaching (optional). */
  presentationHint?:
    | "misconception_contrast"
    | "foundational_definition"
    | "application_emphasis";
  trace: KnowledgeOrchestratorTrace;
};

/** Snapshot inputs for a pure, deterministic decision (no I/O). */
export type KnowledgeOrchestratorInput = {
  target: string;
  knowledge: TeachingKnowledgeContext | null;
  /** States keyed by Knowledge Library concept id. */
  statesByConceptId: ReadonlyMap<string, LearnerConceptState | null>;
  /** Evidence for this learner (will be filtered to in-scope concepts). */
  evidence: readonly LearningEvidence[];
};

/** Phase 12 — Six technique recommendation (HOW), separate from action (WHAT). */
export type KnowledgeSixRecommendationApiView = {
  technique: string;
  reasonCode: string;
  reason: string;
  confidence: "low" | "medium" | "high";
  conceptId?: string | null;
};

/** Public API-safe view (no raw evidence dump / no full trace). */
export type KnowledgeOrchestrationApiView = {
  action: KnowledgeLearningAction;
  conceptId: string | null;
  nextConceptId?: string | null;
  reasonCode: KnowledgeOrchestratorReasonCode;
  confidence: KnowledgeOrchestratorConfidence;
  destination?: KnowledgeActionDestination | null;
  /** Phase 5 — learner-facing CTA (UI may show; never decision source of truth). */
  learnerLabel?: string;
  learnerHint?: string;
  /** Phase 12 — optional Six HOW recommendation; never blocks learning. */
  sixRecommendation?: KnowledgeSixRecommendationApiView | null;
};

export type KnowledgeActionDestination = {
  action: KnowledgeLearningAction;
  /** Existing Study Room / Lucky / Learn href when applicable. */
  href?: string;
  room?: "learn" | "practice" | "check" | "remember" | "tutor";
  conceptId?: string | null;
  nextConceptId?: string | null;
};
