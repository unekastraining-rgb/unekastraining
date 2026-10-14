/**
 * Phase 2G-29 — Formal Learning Decision Context.
 * Phase 2G-30 — Orchestrator boundary resolve/attach helpers.
 *
 * Contextual input surrounding an Orchestrator decision.
 * Not policy: does not diagnose, select interventions, rank, or persist.
 * Reuses LearningIntent and opaque string ids — no duplicated learner/evidence/mastery models.
 */

import { parseLearningIntent } from "@/lib/learning/intent/parse";
import type { LearningIntent } from "@/lib/learning/intent/types";

/**
 * Canonical contextual envelope for a future Universal Learning Engine boundary.
 * Evidence/mastery remain supplied by existing LearnerConceptMasterySummary / diagnose inputs.
 */
export type LearningDecisionContext = {
  /**
   * Optional learner purpose.
   * undefined = absent; null = explicit omit / invalid parse; otherwise canonical LearningIntent.
   */
  intent?: LearningIntent | null;
  /** Opaque Concept id — never invented by the Orchestrator. */
  conceptId?: string | null;
  /** Opaque Learning Space id — never invented by the Orchestrator. */
  learningSpaceId?: string | null;
};

/**
 * Untrusted / partial input before normalization.
 * Intent may be a raw payload; ids may be opaque strings or null.
 */
export type LearningDecisionContextInput = {
  intent?: LearningIntent | null | unknown;
  conceptId?: string | null;
  learningSpaceId?: string | null;
};

/**
 * Fields that may carry decision context into the Orchestrator boundary (2G-30).
 * Distinct from course/topic route options used only for SIX hrefs.
 */
export type OrchestrateDecisionContextOptions = {
  /**
   * Formal nested context. Normalized once at the orchestration boundary.
   */
  decisionContext?: LearningDecisionContextInput | null;
  /**
   * Convenience alias for `decisionContext.intent` (2G-28-style top-level intent).
   * When both are set, top-level `intent` wins.
   */
  intent?: LearningDecisionContextInput["intent"];
};

/** Preserve opaque id strings; explicit null stays null; empty/non-string → null. */
function normalizeOpaqueId(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Normalize a raw context input.
 * Empty / null / undefined input → `{}` (valid empty context).
 * Intent uses canonical parseLearningIntent (invalid → null).
 */
export function normalizeLearningDecisionContext(
  input?: LearningDecisionContextInput | null,
): LearningDecisionContext {
  if (input == null) return {};

  const out: LearningDecisionContext = {};

  if ("intent" in input) {
    if (input.intent === undefined) {
      // absent — omit key
    } else if (input.intent === null) {
      out.intent = null;
    } else {
      out.intent = parseLearningIntent(input.intent);
    }
  }

  if ("conceptId" in input) {
    const conceptId = normalizeOpaqueId(
      input.conceptId as string | null | undefined,
    );
    if (conceptId !== undefined) out.conceptId = conceptId;
  }

  if ("learningSpaceId" in input) {
    const learningSpaceId = normalizeOpaqueId(
      input.learningSpaceId as string | null | undefined,
    );
    if (learningSpaceId !== undefined) out.learningSpaceId = learningSpaceId;
  }

  return out;
}

/**
 * True when the normalized context carries no keys
 * (caller may treat as equivalent to no contextual metadata).
 */
export function isEmptyLearningDecisionContext(
  context: LearningDecisionContext,
): boolean {
  return (
    !("intent" in context) &&
    !("conceptId" in context) &&
    !("learningSpaceId" in context)
  );
}

/**
 * Resolve optional Orchestrator-boundary context options.
 * undefined = no context keys provided (absent).
 * Does not diagnose or select interventions.
 */
export function resolveOrchestrateDecisionContext(
  options?: OrchestrateDecisionContextOptions | null,
): LearningDecisionContext | undefined {
  if (options == null) return undefined;

  const hasNested =
    "decisionContext" in options && options.decisionContext !== undefined;
  const hasTopIntent = "intent" in options;

  if (!hasNested && !hasTopIntent) return undefined;

  const fromNested = hasNested
    ? normalizeLearningDecisionContext(options.decisionContext)
    : {};

  const fromTop = hasTopIntent
    ? normalizeLearningDecisionContext({ intent: options.intent })
    : {};

  return { ...fromNested, ...fromTop };
}

/**
 * Attach normalized decision context onto an Orchestrator result.
 * Preserves all decision fields; metadata only.
 */
export function withOrchestratorDecisionContext<
  T extends { decisionContext?: LearningDecisionContext },
>(result: T, options?: OrchestrateDecisionContextOptions | null): T {
  const decisionContext = resolveOrchestrateDecisionContext(options);
  if (decisionContext === undefined) return result;
  return { ...result, decisionContext };
}
