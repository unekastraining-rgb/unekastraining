/**
 * 2P-17 — Lightweight educational decision journal (not advisory).
 */

import type {
  EducationalMarketDecision,
  EducationalMarketJournalEntry,
} from "./types";

export function buildEducationalMarketJournalEntry(
  decision: EducationalMarketDecision,
  nowIso?: string,
): EducationalMarketJournalEntry {
  return {
    decision: {
      ...decision,
      reasoning: decision.reasoning.trim(),
    },
    recordedAtIso: nowIso ?? new Date(0).toISOString(),
    educationalOnly: true,
    notFinancialAdvice: true,
  };
}

/** Serialize journal+decision into an artifact string for submission. */
export function serializeEducationalMarketArtifact(input: {
  decision: EducationalMarketDecision;
  journal?: EducationalMarketJournalEntry | null;
}): string {
  return JSON.stringify({
    educationalOnly: true,
    realMoney: false,
    brokerage: false,
    decision: input.decision,
    journal: input.journal ?? null,
  });
}
