import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  aggregateEvidenceSignals,
  emptyEvidenceSignals,
} from "@/lib/learning/evidence/aggregate";
import { EVIDENCE_AGGREGATION_POLICY } from "@/lib/learning/evidence/aggregation-policy";
import type { AttemptRowForAggregation } from "@/lib/learning/evidence/aggregation-types";
import { isEvidenceIntelligenceEnabled } from "@/lib/learning/evidence/intelligence-flag";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import {
  orchestrateFromLearnerState,
  type OrchestratorResult,
} from "@/lib/learning/orchestrator/diagnose";
import { enrichOrchestratorWithEvidenceSignals } from "@/lib/learning/orchestrator/evidence-enrichment";
import type { LearnerConceptMasterySummary } from "@/lib/learning/types";

function daysAgo(days: number, now = new Date()): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function attempt(
  partial: Partial<AttemptRowForAggregation> & {
    outcome: AttemptRowForAggregation["outcome"];
    createdAt: Date;
  },
): AttemptRowForAggregation {
  return {
    skillFacet: partial.skillFacet ?? "RECOGNIZE",
    sourceRefJson:
      partial.sourceRefJson ?? JSON.stringify({ kind: "quiz_attempt" }),
    misconceptionSignalsJson: partial.misconceptionSignalsJson ?? "[]",
    outcome: partial.outcome,
    createdAt: partial.createdAt,
  };
}

describe("Phase 2F-2 evidence intelligence flag", () => {
  const original = process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE;
    } else {
      process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE = original;
    }
  });

  it("defaults OFF", () => {
    delete process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE;
    expect(isEvidenceIntelligenceEnabled()).toBe(false);
  });

  it("enables for 1/true/on/yes", () => {
    for (const value of ["1", "true", "on", "yes"]) {
      process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE = value;
      expect(isEvidenceIntelligenceEnabled()).toBe(true);
    }
  });
});

describe("aggregateEvidenceSignals", () => {
  const now = new Date("2026-09-18T12:00:00.000Z");

  it("empty evidence → neutral aggregation", () => {
    expect(aggregateEvidenceSignals([])).toEqual(emptyEvidenceSignals());
  });

  it("single SUCCESS → no repeated failure", () => {
    const signals = aggregateEvidenceSignals(
      [
        attempt({
          outcome: "SUCCESS",
          skillFacet: "RECOGNIZE",
          createdAt: daysAgo(1, now),
        }),
      ],
      now,
    );
    expect(signals.successCount).toBe(1);
    expect(signals.failCount).toBe(0);
    expect(signals.repeatedFailure).toBe("none");
  });

  it("single FAIL → no repeated failure classification", () => {
    const signals = aggregateEvidenceSignals(
      [
        attempt({
          outcome: "FAIL",
          skillFacet: "APPLY",
          createdAt: daysAgo(1, now),
        }),
      ],
      now,
    );
    expect(signals.failCount).toBe(1);
    expect(signals.recentFailCount).toBe(1);
    expect(signals.repeatedFailure).toBe("none");
  });

  it("repeated recent FAILs → strong repeated-failure signal", () => {
    const signals = aggregateEvidenceSignals(
      [
        attempt({ outcome: "FAIL", skillFacet: "APPLY", createdAt: daysAgo(0, now) }),
        attempt({ outcome: "FAIL", skillFacet: "APPLY", createdAt: daysAgo(1, now) }),
        attempt({ outcome: "FAIL", skillFacet: "APPLY", createdAt: daysAgo(2, now) }),
      ],
      now,
    );
    expect(signals.recentFailCount).toBe(3);
    expect(signals.repeatedFailure).toBe("strong");
  });

  it("FAIL FAIL SUCCESS is not uninterrupted failure (possible at most)", () => {
    const signals = aggregateEvidenceSignals(
      [
        attempt({
          outcome: "SUCCESS",
          skillFacet: "APPLY",
          createdAt: daysAgo(0, now),
        }),
        attempt({ outcome: "FAIL", skillFacet: "APPLY", createdAt: daysAgo(1, now) }),
        attempt({ outcome: "FAIL", skillFacet: "APPLY", createdAt: daysAgo(2, now) }),
      ],
      now,
    );
    expect(signals.recentFailCount).toBe(2);
    expect(signals.recentSuccessCount).toBe(1);
    expect(signals.repeatedFailure).toBe("possible");
  });

  it("aggregates facet outcomes separately", () => {
    const signals = aggregateEvidenceSignals(
      [
        attempt({
          outcome: "SUCCESS",
          skillFacet: "RECOGNIZE",
          createdAt: daysAgo(1, now),
        }),
        attempt({
          outcome: "FAIL",
          skillFacet: "EXPLAIN",
          createdAt: daysAgo(1, now),
        }),
        attempt({
          outcome: "PARTIAL",
          skillFacet: "APPLY",
          createdAt: daysAgo(1, now),
        }),
        attempt({
          outcome: "SUCCESS",
          skillFacet: "SOLVE",
          createdAt: daysAgo(1, now),
        }),
        attempt({
          outcome: "FAIL",
          skillFacet: "PERFORM",
          createdAt: daysAgo(1, now),
        }),
        attempt({
          outcome: "SUCCESS",
          skillFacet: "RETAIN",
          createdAt: daysAgo(1, now),
        }),
      ],
      now,
    );
    expect(signals.facetOutcomes.RECOGNIZE.successCount).toBe(1);
    expect(signals.facetOutcomes.EXPLAIN.failCount).toBe(1);
    expect(signals.facetOutcomes.APPLY.partialCount).toBe(1);
    expect(signals.facetOutcomes.SOLVE.successCount).toBe(1);
    expect(signals.facetOutcomes.PERFORM.failCount).toBe(1);
    expect(signals.facetOutcomes.RETAIN.successCount).toBe(1);
  });

  it("preserves misconception signals and normalizes duplicates", () => {
    const signals = aggregateEvidenceSignals(
      [
        attempt({
          outcome: "FAIL",
          createdAt: daysAgo(1, now),
          misconceptionSignalsJson: JSON.stringify([
            "misconception:checked vs unchecked",
            "",
          ]),
        }),
        attempt({
          outcome: "FAIL",
          createdAt: daysAgo(2, now),
          misconceptionSignalsJson: JSON.stringify([
            "misconception:checked vs unchecked",
            "gap:hierarchy",
          ]),
        }),
        attempt({
          outcome: "FAIL",
          createdAt: daysAgo(3, now),
          misconceptionSignalsJson: "{not-json",
        }),
      ],
      now,
    );
    expect(signals.misconceptionSignals[0]).toEqual({
      signal: "misconception:checked vs unchecked",
      count: 2,
    });
    expect(
      signals.misconceptionSignals.find((item) => item.signal === "gap:hierarchy")
        ?.count,
    ).toBe(1);
  });

  it("aggregates known source kinds", () => {
    const signals = aggregateEvidenceSignals(
      [
        attempt({
          outcome: "SUCCESS",
          createdAt: daysAgo(1, now),
          sourceRefJson: JSON.stringify({ kind: "quiz_attempt" }),
        }),
        attempt({
          outcome: "FAIL",
          createdAt: daysAgo(1, now),
          sourceRefJson: JSON.stringify({ kind: "flashcard_review" }),
        }),
        attempt({
          outcome: "PARTIAL",
          createdAt: daysAgo(1, now),
          sourceRefJson: JSON.stringify({ kind: "study_evaluate" }),
        }),
        attempt({
          outcome: "SUCCESS",
          createdAt: daysAgo(1, now),
          sourceRefJson: JSON.stringify({ kind: "tutor_interaction" }),
        }),
        attempt({
          outcome: "FAIL",
          createdAt: daysAgo(1, now),
          sourceRefJson: JSON.stringify({ kind: "lucky_retention_review" }),
        }),
      ],
      now,
    );
    expect(signals.sourceCounts).toEqual({
      quiz: 1,
      flashcard: 1,
      study_evaluate: 1,
      tutor: 1,
      lucky: 1,
      activity: 0,
      other: 0,
    });
  });

  it("classifies coding/sql challenge submits as activity", () => {
    const signals = aggregateEvidenceSignals(
      [
        {
          outcome: "SUCCESS",
          skillFacet: "PERFORM",
          createdAt: daysAgo(1, now),
          sourceRefJson: JSON.stringify({ kind: "coding_challenge_submit" }),
          misconceptionSignalsJson: "[]",
        },
        {
          outcome: "PARTIAL",
          skillFacet: "PERFORM",
          createdAt: daysAgo(1, now),
          sourceRefJson: JSON.stringify({ kind: "sql_challenge_submit" }),
          misconceptionSignalsJson: "[]",
        },
      ],
      now,
    );
    expect(signals.sourceCounts.activity).toBe(2);
    expect(signals.sourceCounts.other).toBe(0);
  });

  it("bounded recent window ignores older failures for repeated-failure", () => {
    const oldDays = EVIDENCE_AGGREGATION_POLICY.recentWindowDays + 5;
    const signals = aggregateEvidenceSignals(
      [
        attempt({
          outcome: "SUCCESS",
          createdAt: daysAgo(1, now),
        }),
        attempt({
          outcome: "FAIL",
          createdAt: daysAgo(oldDays, now),
        }),
        attempt({
          outcome: "FAIL",
          createdAt: daysAgo(oldDays + 1, now),
        }),
        attempt({
          outcome: "FAIL",
          createdAt: daysAgo(oldDays + 2, now),
        }),
      ],
      now,
    );
    expect(signals.totalAttempts).toBe(4);
    expect(signals.recentFailCount).toBe(0);
    expect(signals.repeatedFailure).toBe("none");
    expect(signals.failCount).toBe(3);
  });
});

describe("Orchestrator evidence enrichment", () => {
  const original = process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE;
    } else {
      process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE = original;
    }
  });

  function summaryWithSignals(
    signals: LearnerConceptMasterySummary["evidenceSignals"],
  ): LearnerConceptMasterySummary {
    return {
      learnerId: "user-1",
      conceptId: "concept-1",
      conceptTitle: "Exceptions",
      facets: {
        ...emptyFacetScores(),
        recognize: 0.2,
        explain: 0.15,
        apply: 0.1,
        retain: 0.1,
      },
      topicMastery: null,
      recentMissedCount: 2,
      evidenceSourceCounts: {
        quiz: 3,
        flashcard: 0,
        study_evaluate: 0,
        other: 0,
      },
      reviewCount: 3,
      lastReviewedAt: null,
      nextReviewAt: null,
      evidenceSignals: signals,
    };
  }

  it("flag OFF leaves diagnosis and intervention unchanged", () => {
    delete process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE;
    const base = orchestrateFromLearnerState(
      summaryWithSignals({
        ...emptyEvidenceSignals(),
        totalAttempts: 3,
        recentFailCount: 3,
        repeatedFailure: "strong",
      }),
    );
    const enriched = enrichOrchestratorWithEvidenceSignals(
      base,
      summaryWithSignals({
        ...emptyEvidenceSignals(),
        totalAttempts: 3,
        recentFailCount: 3,
        repeatedFailure: "strong",
      }),
    );
    expect(enriched).toEqual(base);
  });

  it("keeps primary diagnosis and SIX intervention when strong repeated failure", () => {
    process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE = "1";
    const summary = summaryWithSignals({
      ...emptyEvidenceSignals(),
      totalAttempts: 3,
      recentAttempts: 3,
      recentFailCount: 3,
      failCount: 3,
      repeatedFailure: "strong",
      facetOutcomes: {
        ...emptyEvidenceSignals().facetOutcomes,
        EXPLAIN: {
          attemptCount: 3,
          successCount: 0,
          partialCount: 0,
          failCount: 3,
          abandonedCount: 0,
          latestOutcome: "FAIL",
        },
      },
      misconceptionSignals: [
        { signal: "misconception:checked vs unchecked", count: 2 },
      ],
    });
    const base = orchestrateFromLearnerState(summary);
    expect(base.diagnosis).toBe("UNDERSTANDING_GAP");
    const enriched = enrichOrchestratorWithEvidenceSignals(base, summary);
    expect(enriched.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(enriched.intervention?.sixComponent).toBe(
      base.intervention?.sixComponent,
    );
    expect(enriched.evidenceHints?.length).toBeGreaterThan(0);
    expect(enriched.reason).toContain(base.reason);
  });

  it("NO_INTERVENTION skips evidence enrichment", () => {
    process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE = "1";
    const strongSummary: LearnerConceptMasterySummary = {
      ...summaryWithSignals({
        ...emptyEvidenceSignals(),
        totalAttempts: 5,
        recentFailCount: 3,
        repeatedFailure: "strong",
      }),
      facets: {
        ...emptyFacetScores(),
        recognize: 0.8,
        explain: 0.8,
        apply: 0.75,
        perform: 0.7,
        retain: 0.7,
        confidence: 0.6,
      },
      reviewCount: 6,
      evidenceSourceCounts: {
        quiz: 3,
        flashcard: 2,
        study_evaluate: 1,
        other: 0,
      },
    };
    const base = orchestrateFromLearnerState(strongSummary);
    expect(base.diagnosis).toBe("NO_INTERVENTION");
    const enriched = enrichOrchestratorWithEvidenceSignals(
      base,
      strongSummary,
    );
    expect(enriched.evidenceHints).toBeUndefined();
  });
});

describe("Phase 2F-2 preservation", () => {
  it("does not add new Orchestrator diagnosis enums", () => {
    const diagnose = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    expect(diagnose).not.toMatch(
      /REPEATED_FAILURE_GAP|MISCONCEPTION_GAP|CAREFUL_ERROR_GAP/,
    );
  });

  it("does not modify evidence producers or mastery apply formulas", () => {
    for (const relative of [
      "src/lib/learning/assessment/quiz-bridge.ts",
      "src/lib/learning/assessment/flashcard-bridge.ts",
      "src/lib/learning/assessment/evaluate-bridge.ts",
      "src/lib/learning/tutor/evidence.ts",
      "src/lib/learning/evidence/record.ts",
      "src/lib/learning/mastery/apply.ts",
      "src/lib/learning/mastery/facets.ts",
    ]) {
      const source = readFileSync(path.join(process.cwd(), relative), "utf8");
      expect(source).not.toMatch(/STUDY_HAUL_EVIDENCE_INTELLIGENCE|aggregateEvidenceSignals/);
    }
  });

  it("keeps recentMissedCount distinct from LearningAttempt fail counts", () => {
    const read = readFileSync(
      path.join(process.cwd(), "src/lib/learning/learner-model/read.ts"),
      "utf8",
    );
    expect(read).toContain("recentMissedCount");
    expect(read).toContain("missedQuestion.count");
    expect(read).toContain("evidenceSignals");
    expect(read).toContain("isEvidenceIntelligenceEnabled");
  });

  it("env example documents the evidence intelligence flag", () => {
    const env = readFileSync(path.join(process.cwd(), ".env.example"), "utf8");
    expect(env).toContain("STUDY_HAUL_EVIDENCE_INTELLIGENCE");
  });
});

// silence unused OrchestratorResult import warning if any
void (null as unknown as OrchestratorResult);
