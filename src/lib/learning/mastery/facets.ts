import type {
  EvidenceOutcomeName,
  FacetedMasteryScores,
  MasteryFacetName,
} from "@/lib/learning/types";

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function facetKey(
  facet: MasteryFacetName,
): keyof Omit<FacetedMasteryScores, "confidence"> {
  switch (facet) {
    case "RECOGNIZE":
      return "recognize";
    case "EXPLAIN":
      return "explain";
    case "APPLY":
      return "apply";
    case "SOLVE":
      return "solve";
    case "PERFORM":
      return "perform";
    case "RETAIN":
      return "retain";
  }
}

/** Pure mastery delta — simple Phase 2A math (not final pedagogy). */
export function computeFacetDelta(outcome: EvidenceOutcomeName): number {
  if (outcome === "SUCCESS") return 0.1;
  if (outcome === "PARTIAL") return 0.03;
  if (outcome === "ABANDONED") return 0;
  return -0.06;
}

export function applyFacetDelta(
  current: FacetedMasteryScores,
  facet: MasteryFacetName,
  outcome: EvidenceOutcomeName,
): FacetedMasteryScores {
  const delta = computeFacetDelta(outcome);
  const key = facetKey(facet);
  const next: FacetedMasteryScores = { ...current };
  next[key] = clamp01(current[key] + delta);
  // Light spill into retain on success so retention has a seed signal.
  if (outcome === "SUCCESS" && facet !== "RETAIN") {
    next.retain = clamp01(current.retain + delta / 4);
  }
  next.confidence = clamp01(current.confidence + delta / 2);
  return next;
}

export function emptyFacetScores(): FacetedMasteryScores {
  return {
    recognize: 0,
    explain: 0,
    apply: 0,
    solve: 0,
    perform: 0,
    retain: 0,
    confidence: 0,
  };
}

export function reviewIntervalHours(outcome: EvidenceOutcomeName): number {
  if (outcome === "SUCCESS") return 72;
  if (outcome === "PARTIAL") return 24;
  return 12;
}
