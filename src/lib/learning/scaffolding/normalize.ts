/**
 * 2P-12 — Normalize / validate LearningScaffold inputs.
 * Invalid entries are ignored — never fabricated into new content.
 */

import type {
  LearningScaffold,
  LearningScaffoldInput,
  LearningScaffoldKind,
  LearningScaffoldLevel,
  LearningScaffoldRevealPolicy,
} from "./types";

const KINDS = new Set<LearningScaffoldKind>([
  "HINT",
  "STEP",
  "EXAMPLE",
  "CHECKLIST",
  "CONSTRAINT",
]);

function isLevel(v: unknown): v is LearningScaffoldLevel {
  return v === 1 || v === 2 || v === 3;
}

function isReveal(v: unknown): v is LearningScaffoldRevealPolicy {
  return v === "ON_REQUEST" || v === "ALWAYS";
}

/**
 * Normalize one scaffold. Returns null when invalid (dropped, not invented).
 */
export function normalizeLearningScaffold(
  input: LearningScaffoldInput | null | undefined,
): LearningScaffold | null {
  if (!input || typeof input !== "object") return null;
  if (typeof input.kind !== "string" || !KINDS.has(input.kind as LearningScaffoldKind)) {
    return null;
  }
  if (typeof input.label !== "string" || !input.label.trim()) return null;
  if (typeof input.content !== "string" || !input.content.trim()) return null;

  const level: LearningScaffoldLevel = isLevel(input.level) ? input.level : 1;
  const revealPolicy: LearningScaffoldRevealPolicy = isReveal(input.revealPolicy)
    ? input.revealPolicy
    : "ON_REQUEST";
  const doesNotRevealAnswer =
    typeof input.doesNotRevealAnswer === "boolean"
      ? input.doesNotRevealAnswer
      : true;

  // Answer-reveal protection: never keep a scaffold that opts into revealing
  // the answer unless it is an EXAMPLE with ALWAYS (still rare — default true).
  if (doesNotRevealAnswer === false && input.kind !== "EXAMPLE") {
    return null;
  }

  return {
    kind: input.kind as LearningScaffoldKind,
    label: input.label.trim(),
    content: input.content.trim(),
    level,
    revealPolicy,
    doesNotRevealAnswer,
  };
}

export function normalizeLearningScaffolds(
  inputs: readonly LearningScaffoldInput[] | null | undefined,
): LearningScaffold[] {
  if (!inputs?.length) return [];
  const out: LearningScaffold[] = [];
  for (const raw of inputs) {
    const n = normalizeLearningScaffold(raw);
    if (n) out.push(n);
  }
  return out;
}

/** Stable progressive order: level asc, then ALWAYS before ON_REQUEST, then kind. */
export function orderLearningScaffolds(
  scaffolds: readonly LearningScaffold[],
): LearningScaffold[] {
  const kindRank: Record<LearningScaffoldKind, number> = {
    CONSTRAINT: 0,
    CHECKLIST: 1,
    HINT: 2,
    STEP: 3,
    EXAMPLE: 4,
  };
  return [...scaffolds].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    if (a.revealPolicy !== b.revealPolicy) {
      return a.revealPolicy === "ALWAYS" ? -1 : 1;
    }
    return kindRank[a.kind] - kindRank[b.kind];
  });
}
