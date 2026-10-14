/**
 * Phase 4B — Personalized Teaching Context types.
 *
 * Knowledge Library = what should be taught.
 * Learner State = what the learner has demonstrated.
 * Personalized Teaching Context = both, without deciding next activity.
 *
 * Familiarity labels describe interaction history — not mastery.
 */

import type { TeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import type {
  LearningEvidenceOutcome,
  LearnerConceptState,
} from "@/lib/learning/learner-state/types";

/**
 * Interaction-history familiarity (evidence-backed).
 * Not mastery: never "mastered" / "weak" / "advanced".
 */
export type TeachingFamiliarity =
  | "unseen"
  | "introduced"
  | "practiced"
  | "repeated";

/**
 * Safe presentation hints for the Teaching Engine.
 * These adjust HOW material is presented — not WHAT comes next.
 */
export type TeachingPresentationHint =
  | "foundational_definition"
  | "concise_recap"
  | "application_emphasis"
  | "reduce_redundancy"
  | "misconception_contrast"
  | "contrasting_examples";

/**
 * Deterministic personalization derived from LearnerConceptState.
 * Counts come from evidence only — never LLM inference.
 */
export type TeachingPersonalization = {
  conceptId: string;
  priorExposure: number;
  priorAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  familiarity: TeachingFamiliarity;
  lastOutcome?: LearningEvidenceOutcome | string;
  presentationHints: TeachingPresentationHint[];
};

/** Per-concept binding: knowledge concept + optional state + personalization. */
export type PersonalizedConceptBinding = {
  conceptId: string;
  state: LearnerConceptState | null;
  personalization: TeachingPersonalization;
};

/**
 * Teaching Knowledge Context + Learner State for presentation adaptation.
 * References existing knowledge; does not duplicate the Knowledge Library.
 */
export type PersonalizedTeachingContext = {
  knowledge: TeachingKnowledgeContext;
  /** One entry per knowledge concept in scope (path keeps each concept identity). */
  conceptBindings: PersonalizedConceptBinding[];
  /** Primary concept personalization (single-concept or first path concept). */
  primary: TeachingPersonalization;
};
