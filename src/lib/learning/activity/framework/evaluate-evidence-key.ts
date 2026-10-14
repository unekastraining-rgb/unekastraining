/**
 * Bundle M — Idempotent evidence keys for /api/study/evaluate.
 * Identifies the logical submission, not a wall-clock timestamp.
 */

import { createHash } from "node:crypto";

export type EvaluateEvidenceKeyInput = {
  userId: string;
  mode: string;
  topic?: string | null;
  conceptId?: string | null;
  activityId?: string | null;
  /** Distinct practice rounds / attempts — omit for pure retries of the same submission. */
  attemptId?: string | null;
  outcome?: string | null;
  /** Stable fingerprint of the learner submission payload (answer text, selections, etc.). */
  submissionFingerprint?: string | null;
};

function stablePart(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function hashFingerprint(raw: string): string {
  if (!raw) return "empty";
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

/**
 * Deterministic event key for Knowledge Library / Phase 4A evidence.
 * Same logical submission → same key (DB uniqueness / upsert can dedupe).
 * Distinct attemptId or fingerprint → distinct key (repeated practice OK).
 */
export function buildIdempotentEvaluateEvidenceKey(
  input: EvaluateEvidenceKeyInput,
): string {
  const parts = [
    "evaluate",
    stablePart(input.userId),
    stablePart(input.mode),
    stablePart(input.topic),
    stablePart(input.conceptId),
    stablePart(input.activityId),
    stablePart(input.attemptId),
    stablePart(input.outcome),
    hashFingerprint(stablePart(input.submissionFingerprint)),
  ];
  return parts.join(":");
}
