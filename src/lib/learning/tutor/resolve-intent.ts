/**
 * Phase 2G-24 — Resolve optional LearningIntent for a TutorRequest.
 * Does not change TutorMode, TutorEvidenceIntent, or instructional policy.
 */

import { parseLearningIntent } from "@/lib/learning/intent/parse";
import { projectTutorModeToLearningIntent } from "@/lib/learning/intent/project";
import type { LearningIntent } from "@/lib/learning/intent/types";
import type { TutorRequest } from "@/lib/learning/tutor/types";

/**
 * Resolve LearningIntent for this Tutor turn.
 *
 * - Valid `request.intent` → use it (caller-supplied)
 * - `request.intent === null` → omit (explicit opt-out)
 * - `undefined` → project from TutorMode when safe (PRACTICE / EXAM)
 * - Ambiguous modes → null
 *
 * Never invents ASSESS from free text. Never upgrades INFERRED to EXPLICIT
 * without modeLearnerSelected.
 */
export function resolveTutorLearningIntent(
  request: TutorRequest,
): LearningIntent | null {
  if (request.intent === null) return null;

  if (request.intent !== undefined) {
    return parseLearningIntent(request.intent);
  }

  return projectTutorModeToLearningIntent(request.mode, {
    learnerSelected: request.modeLearnerSelected === true,
    conceptId: request.conceptIds?.[0],
    learningSpaceId: request.learningSpaceId ?? undefined,
    scope: "request",
  });
}

/**
 * Attach resolved LearningIntent onto a TutorRequest copy.
 * Does not mutate TutorMode or evidenceIntent.
 */
export function withResolvedTutorLearningIntent(
  request: TutorRequest,
): TutorRequest {
  return {
    ...request,
    intent: resolveTutorLearningIntent(request),
  };
}
