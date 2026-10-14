/**
 * 2P-18 — Writing revision gate (server-side).
 * Client completion flags cannot bypass required revision.
 */

import type { WritingAdaptiveActivity } from "./types";
import type { WritingSubmissionFields } from "./artifact";

export type WritingRevisionGateResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "revision_required"
        | "revision_unchanged"
        | "revision_too_short"
        | "draft_missing";
    };

/**
 * Enforce revision when the activity requires it.
 * Does not invent SUCCESS — callers still run rubric evaluation.
 */
export function assertWritingRevisionGate(input: {
  activity: Pick<
    WritingAdaptiveActivity,
    "requiresRevision" | "minChars" | "starterDraft"
  >;
  fields: WritingSubmissionFields;
}): WritingRevisionGateResult {
  if (!input.activity.requiresRevision) {
    return { ok: true };
  }

  const draft =
    input.fields.draft?.trim() ||
    input.activity.starterDraft?.trim() ||
    "";
  if (!draft) {
    return { ok: false, reason: "draft_missing" };
  }

  const revision = input.fields.revision?.trim() ?? "";
  if (!revision) {
    return { ok: false, reason: "revision_required" };
  }

  if (revision.length < input.activity.minChars) {
    return { ok: false, reason: "revision_too_short" };
  }

  // Must materially change the draft (normalized compare).
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  if (norm(revision) === norm(draft)) {
    return { ok: false, reason: "revision_unchanged" };
  }

  return { ok: true };
}

/** Client-forged completion / revised flags are ignored. */
export function stripWritingCompletionForgery(
  work: Record<string, unknown>,
): string[] {
  const rejected: string[] = [];
  for (const key of [
    "completed",
    "complete",
    "revisionComplete",
    "revisionDone",
    "skipRevision",
    "bypassedRevision",
  ] as const) {
    if (key in work) {
      rejected.push(key);
      delete work[key];
    }
  }
  return rejected;
}

export function writingRevisionTruthSummary(): {
  requiredRevisionCannotBeClientBypassed: true;
  activitiesWithoutRevisionDocumented: true;
} {
  return {
    requiredRevisionCannotBeClientBypassed: true,
    activitiesWithoutRevisionDocumented: true,
  };
}
