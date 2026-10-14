import { EVIDENCE_AGGREGATION_POLICY } from "@/lib/learning/evidence/aggregation-policy";
import type {
  AttemptRowForAggregation,
  EvidenceOutcomeNameForAggregation,
  EvidenceSignals,
  EvidenceSourceAggregateCounts,
  FacetOutcomeAggregate,
  MasteryFacetNameForAggregation,
  MisconceptionSignalAggregate,
  RepeatedFailureStrength,
} from "@/lib/learning/evidence/aggregation-types";

const OUTCOMES: readonly EvidenceOutcomeNameForAggregation[] = [
  "SUCCESS",
  "PARTIAL",
  "FAIL",
  "ABANDONED",
];

const FACETS: readonly MasteryFacetNameForAggregation[] = [
  "RECOGNIZE",
  "EXPLAIN",
  "APPLY",
  "SOLVE",
  "PERFORM",
  "RETAIN",
];

function emptyFacetAggregate(): FacetOutcomeAggregate {
  return {
    attemptCount: 0,
    successCount: 0,
    partialCount: 0,
    failCount: 0,
    abandonedCount: 0,
    latestOutcome: null,
  };
}

function emptyFacetOutcomes(): Record<
  MasteryFacetNameForAggregation,
  FacetOutcomeAggregate
> {
  return {
    RECOGNIZE: emptyFacetAggregate(),
    EXPLAIN: emptyFacetAggregate(),
    APPLY: emptyFacetAggregate(),
    SOLVE: emptyFacetAggregate(),
    PERFORM: emptyFacetAggregate(),
    RETAIN: emptyFacetAggregate(),
  };
}

function emptySourceCounts(): EvidenceSourceAggregateCounts {
  return {
    quiz: 0,
    flashcard: 0,
    study_evaluate: 0,
    tutor: 0,
    lucky: 0,
    activity: 0,
    other: 0,
  };
}

export function emptyEvidenceSignals(): EvidenceSignals {
  return {
    totalAttempts: 0,
    recentAttempts: 0,
    successCount: 0,
    partialCount: 0,
    failCount: 0,
    abandonedCount: 0,
    recentFailCount: 0,
    recentSuccessCount: 0,
    repeatedFailure: "none",
    misconceptionSignals: [],
    facetOutcomes: emptyFacetOutcomes(),
    sourceCounts: emptySourceCounts(),
    lastAttemptAt: null,
    lastSuccessfulAttemptAt: null,
    lastFailedAttemptAt: null,
  };
}

function isOutcome(value: string): value is EvidenceOutcomeNameForAggregation {
  return (OUTCOMES as readonly string[]).includes(value);
}

function isFacet(value: string): value is MasteryFacetNameForAggregation {
  return (FACETS as readonly string[]).includes(value);
}

const ACTIVITY_SOURCE_KINDS = new Set([
  "coding_challenge_submit",
  "sql_challenge_submit",
  "writing_challenge_submit",
  "lab_challenge_submit",
  "simulation_challenge_submit",
  "game_challenge_submit",
  "project_challenge_submit",
  "presentation_challenge_submit",
]);

export function classifyEvidenceSourceKind(
  sourceRefJson: string,
): keyof EvidenceSourceAggregateCounts {
  try {
    const parsed = JSON.parse(sourceRefJson) as { kind?: string };
    const kind = parsed.kind ?? "";
    if (kind === "quiz_attempt" || kind === "quiz_question") return "quiz";
    if (kind === "flashcard_review" || kind === "flashcard") return "flashcard";
    if (kind === "study_evaluate") return "study_evaluate";
    if (kind === "tutor_interaction" || kind === "tutor_turn") return "tutor";
    if (kind === "lucky_retention_review" || kind === "retention_item") {
      return "lucky";
    }
    if (ACTIVITY_SOURCE_KINDS.has(kind) || kind.endsWith("_challenge_submit")) {
      return "activity";
    }
  } catch {
    // fall through
  }
  return "other";
}

function parseMisconceptionSignals(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  } catch {
    return [];
  }
}

function bumpOutcome(
  agg: FacetOutcomeAggregate,
  outcome: EvidenceOutcomeNameForAggregation,
) {
  agg.attemptCount += 1;
  if (outcome === "SUCCESS") agg.successCount += 1;
  else if (outcome === "PARTIAL") agg.partialCount += 1;
  else if (outcome === "FAIL") agg.failCount += 1;
  else agg.abandonedCount += 1;
}

function computeRepeatedFailure(
  recentOutcomesNewestFirst: EvidenceOutcomeNameForAggregation[],
  recentFailCount: number,
): RepeatedFailureStrength {
  const {
    repeatedFailurePossibleMinFails,
    repeatedFailureStrongMinFails,
    repeatedFailureStrongMinStreak,
  } = EVIDENCE_AGGREGATION_POLICY;

  if (recentFailCount < repeatedFailurePossibleMinFails) return "none";

  let streak = 0;
  for (const outcome of recentOutcomesNewestFirst) {
    if (outcome !== "FAIL") break;
    streak += 1;
  }

  if (
    recentFailCount >= repeatedFailureStrongMinFails &&
    streak >= repeatedFailureStrongMinStreak
  ) {
    return "strong";
  }

  return "possible";
}

function toIso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

/**
 * Pure aggregation over LearningAttempt-shaped rows (newest-first preferred).
 */
export function aggregateEvidenceSignals(
  rows: AttemptRowForAggregation[],
  now: Date = new Date(),
): EvidenceSignals {
  if (rows.length === 0) return emptyEvidenceSignals();

  const sorted = [...rows].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const windowMs =
    EVIDENCE_AGGREGATION_POLICY.recentWindowDays * 24 * 60 * 60 * 1000;
  const windowStart = now.getTime() - windowMs;

  const inWindow = sorted.filter(
    (row) => row.createdAt.getTime() >= windowStart,
  );
  const recent = inWindow.slice(
    0,
    EVIDENCE_AGGREGATION_POLICY.recentAttemptLimit,
  );

  const signals = emptyEvidenceSignals();
  signals.totalAttempts = sorted.length;
  signals.recentAttempts = recent.length;

  let lastSuccess: Date | null = null;
  let lastFail: Date | null = null;
  const misconceptionCounts = new Map<string, number>();
  const recentOutcomes: EvidenceOutcomeNameForAggregation[] = [];

  for (const row of sorted) {
    const outcomeRaw = String(row.outcome);
    if (!isOutcome(outcomeRaw)) continue;
    const outcome = outcomeRaw;

    if (outcome === "SUCCESS") {
      signals.successCount += 1;
      if (!lastSuccess) lastSuccess = row.createdAt;
    } else if (outcome === "PARTIAL") {
      signals.partialCount += 1;
    } else if (outcome === "FAIL") {
      signals.failCount += 1;
      if (!lastFail) lastFail = row.createdAt;
    } else {
      signals.abandonedCount += 1;
    }

    const facetRaw = String(row.skillFacet);
    if (isFacet(facetRaw)) {
      const facetAgg = signals.facetOutcomes[facetRaw];
      if (facetAgg.latestOutcome == null) {
        facetAgg.latestOutcome = outcome;
      }
      bumpOutcome(facetAgg, outcome);
    }

    signals.sourceCounts[classifyEvidenceSourceKind(row.sourceRefJson)] += 1;

    for (const signal of parseMisconceptionSignals(
      row.misconceptionSignalsJson,
    )) {
      misconceptionCounts.set(
        signal,
        (misconceptionCounts.get(signal) ?? 0) + 1,
      );
    }
  }

  for (const row of recent) {
    const outcomeRaw = String(row.outcome);
    if (!isOutcome(outcomeRaw)) continue;
    recentOutcomes.push(outcomeRaw);
    if (outcomeRaw === "FAIL") signals.recentFailCount += 1;
    if (outcomeRaw === "SUCCESS") signals.recentSuccessCount += 1;
  }

  signals.repeatedFailure = computeRepeatedFailure(
    recentOutcomes,
    signals.recentFailCount,
  );

  const misconceptionSignals: MisconceptionSignalAggregate[] = [
    ...misconceptionCounts.entries(),
  ]
    .map(([signal, count]) => ({ signal, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.signal.localeCompare(b.signal);
    })
    .slice(0, EVIDENCE_AGGREGATION_POLICY.maxMisconceptionSignals);

  signals.misconceptionSignals = misconceptionSignals;
  signals.lastAttemptAt = toIso(sorted[0]?.createdAt ?? null);
  signals.lastSuccessfulAttemptAt = toIso(lastSuccess);
  signals.lastFailedAttemptAt = toIso(lastFail);

  return signals;
}
