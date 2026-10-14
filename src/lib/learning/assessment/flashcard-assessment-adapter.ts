/**
 * Phase 2G-53 — Flashcard Assessment Adapter (small additive bridge).
 *
 * Flashcard plugs into the universal AssessmentAdapter contract.
 * ASSESS ≠ Flashcard: claims only explicit `adapterKey === "flashcard"`
 * with assessmentMode PRACTICE_CHECK. Does not launch UX execution, rate,
 * write evidence, mutate SM-2, or bind Adaptive completion.
 *
 * Evidence remains on `flashcard-bridge.ts` after real self-rating.
 * Adaptive completion binding is intentionally deferred (later phase).
 */

import { db } from "@/lib/db";
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

/** Opaque registry key — mechanism id, not a subject. */
export const FLASHCARD_ASSESSMENT_ADAPTER_KEY = "flashcard";

/** Learning Object type for Flashcard assessment items (existing enum). */
export const FLASHCARD_ASSESSMENT_ACTIVITY_TYPE = "FLASHCARD" as const;

/** Opaque activityRef.kind for an existing Flashcard row id. */
export const FLASHCARD_ACTIVITY_REF_KIND = "flashcard" as const;

/** Assessment modes this adapter will claim — PRACTICE_CHECK only (2G-52). */
export const FLASHCARD_ASSESSMENT_ALLOWED_MODE = "PRACTICE_CHECK" as const;

export type FindOwnedDueFlashcardForConceptResult =
  | {
      ok: true;
      flashcardId: string;
      topicId: string;
      courseId: string;
      topicName: string;
    }
  | {
      ok: false;
      reason: "invalid_request" | "NO_TOPIC" | "NO_FLASHCARD";
    };

export type FindOwnedDueFlashcardForConceptFn = (input: {
  userId: string;
  conceptId: string;
  /** Injected clock for due checks in tests. */
  now?: Date;
}) => Promise<FindOwnedDueFlashcardForConceptResult>;

/**
 * Read-only launch context for an opaque owned Flashcard id.
 * Used by activity-launch to build the existing `/flashcards` href.
 */
export type FlashcardLaunchContextResult =
  | {
      ok: true;
      flashcardId: string;
      courseId: string;
      topicName: string;
    }
  | { ok: false; reason: "invalid_request" | "NOT_FOUND" };

export type FindOwnedFlashcardLaunchContextFn = (input: {
  userId: string;
  flashcardId: string;
}) => Promise<FlashcardLaunchContextResult>;

export type CreateFlashcardAssessmentAdapterOptions = {
  /**
   * Dependency injection for tests — defaults to canonical
   * `findOwnedDueFlashcardForConcept` (Concept → Topic → owned due Flashcard).
   */
  findOwnedDueFlashcard?: FindOwnedDueFlashcardForConceptFn;
};

function normalizeKey(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Canonical owned due Flashcard for a concept (read-only).
 *
 * Alignment: Concept → Topic (course owned by learner) → earliest-due owned
 * Flashcard on that topic (`nextReviewAt` null or ≤ now).
 * Does not create cards, mutate SM-2, or touch LUCKY.
 */
export async function findOwnedDueFlashcardForConcept(input: {
  userId: string;
  conceptId: string;
  now?: Date;
}): Promise<FindOwnedDueFlashcardForConceptResult> {
  const userId = normalizeKey(input.userId);
  const conceptId = normalizeKey(input.conceptId);
  if (!userId || !conceptId) {
    return { ok: false, reason: "invalid_request" };
  }

  const topic = await db.topic.findFirst({
    where: { conceptId, course: { userId } },
    select: { id: true, name: true, courseId: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!topic?.courseId) {
    return { ok: false, reason: "NO_TOPIC" };
  }

  const now = input.now ?? new Date();
  const card = await db.flashcard.findFirst({
    where: {
      userId,
      topicId: topic.id,
      OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
    },
    select: { id: true, userId: true },
    orderBy: { nextReviewAt: "asc" },
  });

  if (!card || card.userId !== userId) {
    return { ok: false, reason: "NO_FLASHCARD" };
  }

  return {
    ok: true,
    flashcardId: card.id,
    topicId: topic.id,
    courseId: topic.courseId,
    topicName: topic.name ?? "",
  };
}

/**
 * Read-only ownership + course context for launch href construction.
 */
export async function findOwnedFlashcardLaunchContext(input: {
  userId: string;
  flashcardId: string;
}): Promise<FlashcardLaunchContextResult> {
  const userId = normalizeKey(input.userId);
  const flashcardId = normalizeKey(input.flashcardId);
  if (!userId || !flashcardId) {
    return { ok: false, reason: "invalid_request" };
  }

  const card = await db.flashcard.findFirst({
    where: { id: flashcardId, userId },
    select: {
      id: true,
      topic: { select: { courseId: true, name: true } },
    },
  });
  if (!card?.topic?.courseId) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  return {
    ok: true,
    flashcardId: card.id,
    courseId: card.topic.courseId,
    topicName: card.topic.name ?? "",
  };
}

/**
 * Existing Flashcard experience href — no new routes or invented params.
 * Uses courseId (+ optional topic focus) already understood by flashcards-view.
 */
export function flashcardAssessmentHref(input: {
  courseId: string;
  topicName?: string;
}): string {
  const courseId = normalizeKey(input.courseId);
  const params = new URLSearchParams();
  if (courseId) params.set("courseId", courseId);
  const topicName = normalizeKey(input.topicName);
  if (topicName) params.set("topic", topicName);
  const query = params.toString();
  return query ? `/flashcards?${query}` : "/flashcards";
}

/**
 * Build the production Flashcard AssessmentAdapter.
 * prepare performs a read-only owned due-Flashcard lookup — never creates/rates.
 */
export function createFlashcardAssessmentAdapter(
  options?: CreateFlashcardAssessmentAdapterOptions,
): AssessmentAdapter {
  const findOwnedDueFlashcard =
    options?.findOwnedDueFlashcard ?? findOwnedDueFlashcardForConcept;

  return {
    key: FLASHCARD_ASSESSMENT_ADAPTER_KEY,

    canHandle(context: AssessmentAdapterContext): boolean {
      if (context.plan.status !== "ready") return false;
      if (
        normalizeKey(context.plan.adapterKey) !==
        FLASHCARD_ASSESSMENT_ADAPTER_KEY
      ) {
        return false;
      }
      // 2G-52: PRACTICE_CHECK only — not DIAGNOSTIC / VERIFICATION.
      return context.plan.assessmentMode === FLASHCARD_ASSESSMENT_ALLOWED_MODE;
    },

    resolve(_context: AssessmentAdapterContext): AssessmentActivityResolution {
      void _context;
      return {
        adapterKey: FLASHCARD_ASSESSMENT_ADAPTER_KEY,
        activityType: FLASHCARD_ASSESSMENT_ACTIVITY_TYPE,
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

      const owned = await findOwnedDueFlashcard({
        userId: learnerId,
        conceptId,
      });

      if (!owned.ok) {
        return { unavailable: true };
      }

      const flashcardId = normalizeKey(owned.flashcardId);
      if (!flashcardId) {
        return { unavailable: true };
      }

      return {
        activityRef: {
          kind: FLASHCARD_ACTIVITY_REF_KIND,
          id: flashcardId,
        },
      };
    },
  };
}

/**
 * Registration point — explicit opt-in onto a registry instance.
 * Does not mutate a global singleton; does not auto-wire Workflow/standalone.
 */
export function registerFlashcardAssessmentAdapter(
  registry: AssessmentAdapterRegistry,
  options?: CreateFlashcardAssessmentAdapterOptions,
): AssessmentAdapterRegisterResult {
  return registry.register(createFlashcardAssessmentAdapter(options));
}

/**
 * Convenience: empty registry + Flashcard adapter registered.
 * Callers that need Flashcard must use this (or registerFlashcardAssessmentAdapter).
 * `createAssessmentAdapterRegistry()` remains empty by design.
 */
export function createAssessmentAdapterRegistryWithFlashcard(
  options?: CreateFlashcardAssessmentAdapterOptions,
): AssessmentAdapterRegistry {
  const registry = createAssessmentAdapterRegistry();
  registerFlashcardAssessmentAdapter(registry, options);
  return registry;
}
