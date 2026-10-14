/**
 * Phase 2G-46 — Assessment activity launch boundary (instruction only).
 * Phase 2G-53 — Flashcard launch mapping (existing `/flashcards` experience).
 *
 * Prepared descriptor → launch instruction (e.g. canonical Quiz / Flashcard href).
 * Does not start attempts, navigate the browser, write evidence, or mutate Adaptive.
 */

import type { AssessmentActivityDescriptor } from "@/lib/learning/assessment/activity-preparation";
import {
  FLASHCARD_ACTIVITY_REF_KIND,
  FLASHCARD_ASSESSMENT_ADAPTER_KEY,
  findOwnedFlashcardLaunchContext,
  type FindOwnedDueFlashcardForConceptFn,
  type FindOwnedFlashcardLaunchContextFn,
} from "@/lib/learning/assessment/flashcard-assessment-adapter";
import {
  QUIZ_ACTIVITY_REF_KIND,
  QUIZ_ASSESSMENT_ADAPTER_KEY,
  type FindOwnedQuizForConceptFn,
} from "@/lib/learning/assessment/quiz-assessment-adapter";
import type {
  AssessmentMode,
  AssessmentWorkflowAdaptiveContext,
} from "@/lib/learning/assessment/workflow";
import { flashcardAdaptiveHref } from "@/lib/learning/sequence/flashcard-adapter";
import { quizAdaptiveHref } from "@/lib/learning/sequence/quiz-adapter";
import type { LearningObjectTypeName } from "@/lib/learning/types";

/**
 * Non-executing launch instruction for a future UI/caller.
 * `activityRef` stays opaque — not a typed quizId on the universal contract.
 */
export type AssessmentActivityLaunch = {
  adapterKey: string;
  activityType: LearningObjectTypeName;
  conceptId: string;
  learnerId: string;
  activityRef: { kind: string; id: string };
  /** Canonical existing activity URL when the mechanism supports one. */
  href: string;
  assessmentMode?: AssessmentMode;
  /** Passive Adaptive refs — mirrored into query params when applicable. */
  adaptive?: AssessmentWorkflowAdaptiveContext;
};

export type LaunchAssessmentActivityFailureReason =
  | "invalid_request"
  | "activity_ref_required"
  | "activity_ref_invalid"
  | "activity_not_available"
  | "adapter_unsupported";

export type LaunchAssessmentActivityResult =
  | { ok: true; launch: AssessmentActivityLaunch }
  | { ok: false; reason: LaunchAssessmentActivityFailureReason };

export type LaunchAssessmentActivityInput = {
  descriptor: AssessmentActivityDescriptor;
  /**
   * Optional read-only re-check that the opaque Quiz id still matches the
   * canonical owned Concept→Topic→Quiz lookup. Off by default — 2G-45 already
   * authorized identity. Inject in tests or callers that need a second check.
   */
  verifyOwnedQuiz?: FindOwnedQuizForConceptFn;
  /**
   * Optional read-only re-check that the opaque Flashcard id still matches the
   * canonical owned Concept→Topic→due Flashcard lookup (2G-53).
   */
  verifyOwnedFlashcard?: FindOwnedDueFlashcardForConceptFn;
  /**
   * Inject launch course/topic context for Flashcard href. Defaults to
   * `findOwnedFlashcardLaunchContext` (owned card → courseId).
   */
  resolveFlashcardLaunchContext?: FindOwnedFlashcardLaunchContextFn;
};

function normalizeId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseOpaqueActivityRef(
  raw: AssessmentActivityDescriptor["activityRef"],
):
  | { ok: true; activityRef: { kind: string; id: string } }
  | { ok: false; reason: "activity_ref_required" | "activity_ref_invalid" } {
  if (raw == null) {
    return { ok: false, reason: "activity_ref_required" };
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, reason: "activity_ref_invalid" };
  }
  const kind = normalizeId((raw as { kind?: unknown }).kind);
  const id = normalizeId((raw as { id?: unknown }).id);
  if (!kind || !id) {
    return { ok: false, reason: "activity_ref_invalid" };
  }
  return { ok: true, activityRef: { kind, id } };
}

function buildQuizHref(
  quizId: string,
  adaptive?: AssessmentWorkflowAdaptiveContext,
): string {
  if (!adaptive) {
    return quizAdaptiveHref(quizId);
  }
  return quizAdaptiveHref(quizId, {
    adaptiveRunId: adaptive.runId,
    adaptiveStep: adaptive.stepIndex,
  });
}

/**
 * Produce a launch instruction from a prepared AssessmentActivityDescriptor.
 * Pure relative to attempts/evidence/Adaptive progression — href metadata only.
 */
export async function launchAssessmentActivity(
  input: LaunchAssessmentActivityInput,
): Promise<LaunchAssessmentActivityResult> {
  if (input == null || typeof input !== "object") {
    return { ok: false, reason: "invalid_request" };
  }

  const descriptor = input.descriptor;
  if (descriptor == null || typeof descriptor !== "object") {
    return { ok: false, reason: "invalid_request" };
  }

  const adapterKey = normalizeId(descriptor.adapterKey);
  const activityType = normalizeId(
    descriptor.activityType,
  ) as LearningObjectTypeName;
  const conceptId = normalizeId(descriptor.conceptId);
  const learnerId = normalizeId(descriptor.learnerId);

  if (!adapterKey || !activityType || !conceptId || !learnerId) {
    return { ok: false, reason: "invalid_request" };
  }

  const parsedRef = parseOpaqueActivityRef(descriptor.activityRef);
  if (!parsedRef.ok) {
    return { ok: false, reason: parsedRef.reason };
  }
  const { activityRef } = parsedRef;

  if (adapterKey === QUIZ_ASSESSMENT_ADAPTER_KEY) {
    if (activityRef.kind !== QUIZ_ACTIVITY_REF_KIND) {
      return { ok: false, reason: "activity_ref_invalid" };
    }

    if (input.verifyOwnedQuiz) {
      const owned = await input.verifyOwnedQuiz({
        userId: learnerId,
        conceptId,
      });
      if (!owned.ok || normalizeId(owned.quizId) !== activityRef.id) {
        return { ok: false, reason: "activity_not_available" };
      }
    }

    const launch: AssessmentActivityLaunch = {
      adapterKey,
      activityType,
      conceptId,
      learnerId,
      activityRef: { kind: activityRef.kind, id: activityRef.id },
      href: buildQuizHref(activityRef.id, descriptor.adaptive),
    };
    if (descriptor.assessmentMode) {
      launch.assessmentMode = descriptor.assessmentMode;
    }
    if (descriptor.adaptive) {
      launch.adaptive = {
        runId: descriptor.adaptive.runId,
        stepIndex: descriptor.adaptive.stepIndex,
      };
    }
    return { ok: true, launch };
  }

  if (adapterKey === FLASHCARD_ASSESSMENT_ADAPTER_KEY) {
    if (activityRef.kind !== FLASHCARD_ACTIVITY_REF_KIND) {
      return { ok: false, reason: "activity_ref_invalid" };
    }

    let courseId = "";
    let topicName = "";

    if (input.verifyOwnedFlashcard) {
      const owned = await input.verifyOwnedFlashcard({
        userId: learnerId,
        conceptId,
      });
      if (!owned.ok || normalizeId(owned.flashcardId) !== activityRef.id) {
        return { ok: false, reason: "activity_not_available" };
      }
      courseId = normalizeId(owned.courseId);
      topicName = normalizeId(owned.topicName);
    } else {
      const resolveLaunchContext =
        input.resolveFlashcardLaunchContext ?? findOwnedFlashcardLaunchContext;
      const launchContext = await resolveLaunchContext({
        userId: learnerId,
        flashcardId: activityRef.id,
      });
      if (!launchContext.ok) {
        return { ok: false, reason: "activity_not_available" };
      }
      courseId = normalizeId(launchContext.courseId);
      topicName = normalizeId(launchContext.topicName);
    }

    if (!courseId) {
      return { ok: false, reason: "activity_not_available" };
    }

    const launch: AssessmentActivityLaunch = {
      adapterKey,
      activityType,
      conceptId,
      learnerId,
      activityRef: { kind: activityRef.kind, id: activityRef.id },
      // Existing Flashcard route + established adaptive query params (2G-54).
      href: flashcardAdaptiveHref(
        { courseId, topicName },
        descriptor.adaptive
          ? {
              adaptiveRunId: descriptor.adaptive.runId,
              adaptiveStep: descriptor.adaptive.stepIndex,
            }
          : undefined,
      ),
    };
    if (descriptor.assessmentMode) {
      launch.assessmentMode = descriptor.assessmentMode;
    }
    if (descriptor.adaptive) {
      launch.adaptive = {
        runId: descriptor.adaptive.runId,
        stepIndex: descriptor.adaptive.stepIndex,
      };
    }
    return { ok: true, launch };
  }

  return { ok: false, reason: "adapter_unsupported" };
}
