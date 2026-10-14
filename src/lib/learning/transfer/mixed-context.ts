/**
 * 2P-46 — Mixed-context evidence reading (read-side).
 * Uses existing LearningAttempt outcomes + context metadata.
 * Does not rewrite ConceptMastery or invent TRANSFER_GAP.
 */

import {
  parseAttemptContextIdentity,
  type AttemptContextIdentity,
} from "./context-identity";

export type MixedContextReading =
  | "none"
  | "single_context_success"
  | "cross_context_success"
  | "success_then_transfer_fail"
  | "transfer_recovery"
  | "cross_context_struggle";

export type MixedContextAttemptRow = {
  sourceRefJson?: string | null;
  outcome?: string | null;
  skillFacet?: string | null;
};

function outcomeOf(row: MixedContextAttemptRow): string {
  return (row.outcome ?? "").toString().trim().toUpperCase();
}

function isSuccess(o: string): boolean {
  return o === "SUCCESS" || o === "PARTIAL";
}

function isFail(o: string): boolean {
  return o === "FAIL";
}

/**
 * Interpret recent attempts across contexts for the same concept.
 * Pure — no DB. Learner-safe lines only.
 */
export function interpretMixedContextEvidence(
  attempts: readonly MixedContextAttemptRow[],
): {
  reading: MixedContextReading;
  learnerSafeLine: string | null;
  contextsObserved: string[];
} {
  const withCtx: Array<{
    outcome: string;
    ctx: AttemptContextIdentity;
    variant: string;
  }> = [];

  for (const row of attempts) {
    const ctx = parseAttemptContextIdentity(row.sourceRefJson);
    const variant = ctx.contextVariant || ctx.contentKey || ctx.contentId;
    if (!variant) continue;
    withCtx.push({ outcome: outcomeOf(row), ctx, variant });
  }

  const contextsObserved = [
    ...new Set(withCtx.map((r) => r.variant)),
  ];

  if (withCtx.length === 0) {
    return { reading: "none", learnerSafeLine: null, contextsObserved: [] };
  }

  if (contextsObserved.length === 1) {
    const only = withCtx.filter((r) => isSuccess(r.outcome));
    if (only.length > 0) {
      return {
        reading: "single_context_success",
        learnerSafeLine:
          "You demonstrated this in one context. Practicing in a different setting can deepen transfer when another example is available.",
        contextsObserved,
      };
    }
    return { reading: "none", learnerSafeLine: null, contextsObserved };
  }

  // Newest first (caller should pass newest-first).
  const newest = withCtx[0]!;
  const older = withCtx.slice(1);
  const olderSuccessOther = older.some(
    (r) => r.variant !== newest.variant && isSuccess(r.outcome),
  );
  const olderFailOther = older.some(
    (r) => r.variant !== newest.variant && isFail(r.outcome),
  );
  const anySuccess = withCtx.some((r) => isSuccess(r.outcome));
  const anyFail = withCtx.some((r) => isFail(r.outcome));
  const successVariants = new Set(
    withCtx.filter((r) => isSuccess(r.outcome)).map((r) => r.variant),
  );

  if (successVariants.size >= 2 && !anyFail) {
    return {
      reading: "cross_context_success",
      learnerSafeLine:
        "You have successful evidence across more than one context for this concept.",
      contextsObserved,
    };
  }

  if (isFail(newest.outcome) && olderSuccessOther) {
    return {
      reading: "success_then_transfer_fail",
      learnerSafeLine:
        "Your recent attempts show the concept works in one setting but needs more practice in another.",
      contextsObserved,
    };
  }

  if (isSuccess(newest.outcome) && olderFailOther) {
    return {
      reading: "transfer_recovery",
      learnerSafeLine:
        "You are practicing this skill in a new context after earlier difficulty — progress is emerging, not permanent mastery everywhere.",
      contextsObserved,
    };
  }

  if (anySuccess && anyFail && successVariants.size >= 1) {
    return {
      reading: "cross_context_struggle",
      learnerSafeLine:
        "More evidence is needed across different situations before strong transfer claims.",
      contextsObserved,
    };
  }

  if (successVariants.size >= 2) {
    return {
      reading: "cross_context_success",
      learnerSafeLine:
        "You have successful evidence across more than one context for this concept.",
      contextsObserved,
    };
  }

  return { reading: "none", learnerSafeLine: null, contextsObserved };
}

export function mixedContextEvidenceTruthSummary(): {
  inventsTransferEngine: false;
  inventsTransferGap: false;
  inventsMasteryDecay: false;
  rewritesConceptMastery: false;
  usesExistingLearningAttempts: true;
} {
  return {
    inventsTransferEngine: false,
    inventsTransferGap: false,
    inventsMasteryDecay: false,
    rewritesConceptMastery: false,
    usesExistingLearningAttempts: true,
  };
}
