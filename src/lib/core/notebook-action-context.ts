/**
 * Phase 2G-26 — Ephemeral CORE notebook-action context.
 * Carries LearningIntent projected from CoreStudyIntent without changing
 * notebook generation or CoreStudyIntent semantics.
 */

import type { CoreStudyIntent } from "@/lib/core/study-intent";
import { projectCoreStudyIntentToLearningIntent } from "@/lib/learning/intent/project";
import type { LearningIntent } from "@/lib/learning/intent/types";

export type CoreNotebookActionCoreIntent = Exclude<CoreStudyIntent, null>;

/**
 * Current CORE notebook/layout action context.
 * learningIntent is optional WHY metadata — never drives generation.
 */
export type CoreNotebookActionContext = {
  coreStudyIntent: CoreNotebookActionCoreIntent;
  /** Projected canonical LearningIntent, or null when ambiguous. */
  learningIntent: LearningIntent | null;
};

/**
 * Build action context from a resolved CoreStudyIntent.
 * Uses the existing 2G-23 projection helper — does not invent new mappings.
 */
export function buildCoreNotebookActionContext(
  coreStudyIntent: CoreNotebookActionCoreIntent,
): CoreNotebookActionContext {
  return {
    coreStudyIntent,
    learningIntent: projectCoreStudyIntentToLearningIntent(coreStudyIntent),
  };
}
