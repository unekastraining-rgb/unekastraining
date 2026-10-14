import type { EvidenceEnvelope, EvidenceOutcomeName } from "@/lib/learning/types";

export function outcomeFromCorrect(isCorrect: boolean): EvidenceOutcomeName {
  return isCorrect ? "SUCCESS" : "FAIL";
}

/** Map 0–1 score ratio to a coarse evidence outcome (conservative). */
export function outcomeFromScoreRatio(scoreRatio: number): EvidenceOutcomeName {
  if (scoreRatio >= 0.8) return "SUCCESS";
  if (scoreRatio >= 0.5) return "PARTIAL";
  return "FAIL";
}

export function buildEvidenceEnvelope(
  partial: EvidenceEnvelope,
): EvidenceEnvelope {
  return {
    ...partial,
    misconceptionSignals: partial.misconceptionSignals ?? [],
    evidencePayload: partial.evidencePayload ?? {},
    startedAt: partial.startedAt ?? partial.endedAt ?? new Date(),
    endedAt: partial.endedAt ?? new Date(),
  };
}
