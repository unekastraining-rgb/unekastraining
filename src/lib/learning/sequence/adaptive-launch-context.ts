/**
 * Phase 2G-15 / 2G-22 — Shared Adaptive launch context parsing.
 * Opaque client fields → trusted integers/strings (+ optional LearningIntent).
 * Does not validate ownership, completion, or Attempt compatibility.
 * Intent is never authoritative for identity or ownership.
 */

import { parseLearningIntent } from "@/lib/learning/intent/parse";
import type { LearningIntent } from "@/lib/learning/intent/types";

export function parseAdaptiveRunId(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

/** Non-negative integer step index, or null if missing/invalid. */
export function parseAdaptiveStepIndex(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
    return Math.floor(raw);
  }
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  }
  return null;
}

/**
 * Parsed Adaptive launch fields. Intent is optional and ignored when absent
 * or malformed so existing callers remain unchanged.
 */
export interface AdaptiveLaunchContext {
  runId: string;
  stepIndex: number | null;
  /** Ephemeral learner intent; null when absent or invalid. */
  intent: LearningIntent | null;
}

/**
 * Parse Adaptive launch context from opaque client fields.
 * Malformed intent → null (does not fail the whole context).
 */
export function parseAdaptiveLaunchContext(input: {
  adaptiveRunId?: unknown;
  adaptiveStep?: unknown;
  /** Optional LearningIntent object or JSON-shaped payload. */
  intent?: unknown;
}): AdaptiveLaunchContext {
  return {
    runId: parseAdaptiveRunId(input.adaptiveRunId),
    stepIndex: parseAdaptiveStepIndex(input.adaptiveStep),
    intent: parseLearningIntent(input.intent),
  };
}
