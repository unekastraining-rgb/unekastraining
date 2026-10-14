/**
 * Phase 2G-44 — Quiz Assessment Adapter (first production registration).
 * Phase 2G-45 — prepare resolves an existing owned Quiz id into opaque activityRef.
 *
 * Quiz plugs into the universal AssessmentAdapter contract.
 * ASSESS ≠ Quiz: this adapter only claims plans that explicitly set
 * `adapterKey === "quiz"`. It does not launch, grade, or write evidence.
 *
 * Distinct from Adaptive sequence launch/complete helpers; reuses
 * `findOwnedQuizForConcept` for canonical Concept→Topic→owned Quiz alignment.
 * Evidence remains on `quiz-bridge.ts` after real Quiz interaction.
 */

import type {
  AssessmentAdapter,
  AssessmentAdapterContext,
  AssessmentAdapterPrepareContext,
  AssessmentAdapterRegisterResult,
  AssessmentAdapterRegistry,
  AssessmentActivityPrepareContribution,
  AssessmentActivityResolution,
} from "@/lib/learning/assessment/adapter-registry";
import { createAssessmentAdapterRegistry } from "@/lib/learning/assessment/adapter-registry";
import {
  findOwnedQuizForConcept,
  type FindOwnedQuizForConceptResult,
} from "@/lib/learning/sequence/quiz-adapter";

/** Opaque registry key — mechanism id, not a subject. */
export const QUIZ_ASSESSMENT_ADAPTER_KEY = "quiz";

/** Learning Object type for Quiz assessment items. */
export const QUIZ_ASSESSMENT_ACTIVITY_TYPE = "QUIZ_ITEM" as const;

/** Opaque activityRef.kind for an existing Quiz row id. */
export const QUIZ_ACTIVITY_REF_KIND = "quiz" as const;

export type FindOwnedQuizForConceptFn = (input: {
  userId: string;
  conceptId: string;
}) => Promise<FindOwnedQuizForConceptResult>;

export type CreateQuizAssessmentAdapterOptions = {
  /**
   * Dependency injection for tests — defaults to canonical
   * `findOwnedQuizForConcept` (Concept → Topic → owned Quiz).
   */
  findOwnedQuiz?: FindOwnedQuizForConceptFn;
};

function normalizeKey(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Build the production Quiz AssessmentAdapter.
 * prepare performs a read-only owned-Quiz identity lookup — never creates/starts.
 */
export function createQuizAssessmentAdapter(
  options?: CreateQuizAssessmentAdapterOptions,
): AssessmentAdapter {
  const findOwnedQuiz =
    options?.findOwnedQuiz ?? findOwnedQuizForConcept;

  return {
    key: QUIZ_ASSESSMENT_ADAPTER_KEY,

    canHandle(context: AssessmentAdapterContext): boolean {
      if (context.plan.status !== "ready") return false;
      // Explicit adapter request only — never purpose === ASSESS alone.
      return (
        normalizeKey(context.plan.adapterKey) === QUIZ_ASSESSMENT_ADAPTER_KEY
      );
    },

    resolve(_context: AssessmentAdapterContext): AssessmentActivityResolution {
      void _context;
      return {
        adapterKey: QUIZ_ASSESSMENT_ADAPTER_KEY,
        activityType: QUIZ_ASSESSMENT_ACTIVITY_TYPE,
      };
    },

    async prepare(
      context: AssessmentAdapterPrepareContext,
    ): Promise<AssessmentActivityPrepareContribution> {
      const learnerId = normalizeKey(context.learnerId);
      const conceptId = normalizeKey(context.plan.conceptId);
      if (!learnerId || !conceptId) {
        return { unavailable: true };
      }

      const owned = await findOwnedQuiz({
        userId: learnerId,
        conceptId,
      });

      if (!owned.ok) {
        return { unavailable: true };
      }

      const quizId = normalizeKey(owned.quizId);
      if (!quizId) {
        return { unavailable: true };
      }

      return {
        activityRef: {
          kind: QUIZ_ACTIVITY_REF_KIND,
          id: quizId,
        },
      };
    },
  };
}

/**
 * Registration point — explicit opt-in onto a registry instance.
 * Does not mutate a global singleton; does not auto-wire Workflow/standalone.
 */
export function registerQuizAssessmentAdapter(
  registry: AssessmentAdapterRegistry,
  options?: CreateQuizAssessmentAdapterOptions,
): AssessmentAdapterRegisterResult {
  return registry.register(createQuizAssessmentAdapter(options));
}

/**
 * Convenience: empty registry + Quiz adapter registered.
 * Callers that need Quiz must use this (or registerQuizAssessmentAdapter).
 * `createAssessmentAdapterRegistry()` remains empty by design.
 */
export function createAssessmentAdapterRegistryWithQuiz(
  options?: CreateQuizAssessmentAdapterOptions,
): AssessmentAdapterRegistry {
  const registry = createAssessmentAdapterRegistry();
  registerQuizAssessmentAdapter(registry, options);
  return registry;
}
