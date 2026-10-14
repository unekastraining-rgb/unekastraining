/**
 * Phase 2F-3 — Evidence intelligence validation & calibration scenarios.
 * Deterministic tests only; does not change aggregation thresholds.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  aggregateEvidenceSignals,
  emptyEvidenceSignals,
} from "@/lib/learning/evidence/aggregate";
import { EVIDENCE_AGGREGATION_POLICY } from "@/lib/learning/evidence/aggregation-policy";
import type { AttemptRowForAggregation } from "@/lib/learning/evidence/aggregation-types";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import { orchestrateFromLearnerState } from "@/lib/learning/orchestrator/diagnose";
import { enrichOrchestratorWithEvidenceSignals } from "@/lib/learning/orchestrator/evidence-enrichment";
import { enrichOrchestratorWithPrerequisites } from "@/lib/learning/orchestrator/prerequisites";
import type {
  FacetedMasteryScores,
  LearnerConceptMasterySummary,
} from "@/lib/learning/types";

const {
  mockGetPrerequisiteConceptIds,
  mockGetLearnerConceptMastery,
  mockConceptFindFirst,
  mockLearningAttemptFindMany,
} = vi.hoisted(() => ({
  mockGetPrerequisiteConceptIds: vi.fn(),
  mockGetLearnerConceptMastery: vi.fn(),
  mockConceptFindFirst: vi.fn(),
  mockLearningAttemptFindMany: vi.fn(),
}));

vi.mock("@/lib/learning/knowledge/concept-relationship", () => ({
  getPrerequisiteConceptIds: mockGetPrerequisiteConceptIds,
}));

vi.mock("@/lib/learning/learner-model/read", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/learning/learner-model/read")>();
  return {
    ...actual,
    getLearnerConceptMastery: mockGetLearnerConceptMastery,
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    concept: { findFirst: mockConceptFindFirst },
    learningAttempt: { findMany: mockLearningAttemptFindMany },
  },
}));

import { getEvidenceSignalsForConcept } from "@/lib/learning/evidence/aggregate-read";

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

function baseSummary(partial: {
  learnerId?: string;
  conceptId?: string;
  conceptTitle?: string;
  facets?: Partial<FacetedMasteryScores>;
  topicMastery?: LearnerConceptMasterySummary["topicMastery"];
  recentMissedCount?: number;
  evidenceSourceCounts?: LearnerConceptMasterySummary["evidenceSourceCounts"];
  reviewCount?: number;
  lastReviewedAt?: Date | null;
  nextReviewAt?: Date | null;
  evidenceSignals?: LearnerConceptMasterySummary["evidenceSignals"];
} = {}): LearnerConceptMasterySummary {
  return {
    learnerId: partial.learnerId ?? "user-1",
    conceptId: partial.conceptId ?? "concept-1",
    conceptTitle: partial.conceptTitle ?? "Exception Handling",
    facets: { ...emptyFacetScores(), ...partial.facets },
    topicMastery: partial.topicMastery ?? null,
    recentMissedCount: partial.recentMissedCount ?? 0,
    evidenceSourceCounts: partial.evidenceSourceCounts ?? {
      quiz: 2,
      flashcard: 0,
      study_evaluate: 0,
      other: 0,
    },
    reviewCount: partial.reviewCount ?? 3,
    lastReviewedAt: partial.lastReviewedAt ?? null,
    nextReviewAt: partial.nextReviewAt ?? null,
    evidenceSignals: partial.evidenceSignals,
  };
}

describe("Phase 2F-3 scenario validation — aggregation", () => {
  const now = new Date("2026-09-18T12:00:00.000Z");

  it("1. SINGLE FAILURE → repeatedFailure none", () => {
    const signals = aggregateEvidenceSignals(
      [attempt({ outcome: "FAIL", createdAt: daysAgo(1, now) })],
      now,
    );
    expect(signals.failCount).toBe(1);
    expect(signals.recentFailCount).toBe(1);
    expect(signals.repeatedFailure).toBe("none");
  });

  it("2. REPEATED FAILURE (2) → possible", () => {
    const signals = aggregateEvidenceSignals(
      [
        attempt({ outcome: "FAIL", createdAt: daysAgo(0, now) }),
        attempt({ outcome: "FAIL", createdAt: daysAgo(1, now) }),
      ],
      now,
    );
    expect(signals.failCount).toBe(2);
    expect(signals.recentFailCount).toBe(2);
    expect(signals.repeatedFailure).toBe("possible");
  });

  it("3. STRONG REPEATED FAILURE (3) → strong", () => {
    const signals = aggregateEvidenceSignals(
      [
        attempt({ outcome: "FAIL", createdAt: daysAgo(0, now) }),
        attempt({ outcome: "FAIL", createdAt: daysAgo(1, now) }),
        attempt({ outcome: "FAIL", createdAt: daysAgo(2, now) }),
      ],
      now,
    );
    expect(signals.failCount).toBe(3);
    expect(signals.recentFailCount).toBe(3);
    expect(signals.repeatedFailure).toBe("strong");
  });

  it("4. IMPROVEMENT FAIL FAIL SUCCESS → not strong; lastSuccessfulAttemptAt set", () => {
    const successAt = daysAgo(0, now);
    const signals = aggregateEvidenceSignals(
      [
        attempt({ outcome: "SUCCESS", createdAt: successAt }),
        attempt({ outcome: "FAIL", createdAt: daysAgo(1, now) }),
        attempt({ outcome: "FAIL", createdAt: daysAgo(2, now) }),
      ],
      now,
    );
    expect(signals.failCount).toBe(2);
    expect(signals.successCount).toBe(1);
    expect(signals.recentFailCount).toBe(2);
    expect(signals.recentSuccessCount).toBe(1);
    expect(signals.repeatedFailure).not.toBe("strong");
    expect(signals.repeatedFailure).toBe("possible");
    expect(signals.lastSuccessfulAttemptAt).toBe(successAt.toISOString());
  });

  it("5. PERSISTENT FAILURE SUCCESS then FAIL×3 → strong", () => {
    const signals = aggregateEvidenceSignals(
      [
        attempt({ outcome: "FAIL", createdAt: daysAgo(0, now) }),
        attempt({ outcome: "FAIL", createdAt: daysAgo(1, now) }),
        attempt({ outcome: "FAIL", createdAt: daysAgo(2, now) }),
        attempt({ outcome: "SUCCESS", createdAt: daysAgo(3, now) }),
      ],
      now,
    );
    expect(signals.repeatedFailure).toBe("strong");
    expect(signals.recentFailCount).toBe(3);
    expect(signals.successCount).toBe(1);
  });

  it("6. FACET-SPECIFIC APPLY failures stay in APPLY bucket", () => {
    const signals = aggregateEvidenceSignals(
      [
        attempt({
          outcome: "SUCCESS",
          skillFacet: "RECOGNIZE",
          createdAt: daysAgo(1, now),
        }),
        attempt({
          outcome: "SUCCESS",
          skillFacet: "EXPLAIN",
          createdAt: daysAgo(1, now),
        }),
        attempt({
          outcome: "FAIL",
          skillFacet: "APPLY",
          createdAt: daysAgo(0, now),
        }),
        attempt({
          outcome: "FAIL",
          skillFacet: "APPLY",
          createdAt: daysAgo(1, now),
        }),
      ],
      now,
    );
    expect(signals.facetOutcomes.RECOGNIZE.successCount).toBe(1);
    expect(signals.facetOutcomes.EXPLAIN.successCount).toBe(1);
    expect(signals.facetOutcomes.APPLY.failCount).toBe(2);
    expect(signals.facetOutcomes.APPLY.successCount).toBe(0);
    expect(signals.failCount).toBe(2);
  });

  it("7. MISCONCEPTION signals foo×2 bar×1; malformed ignored; top-5 cap", () => {
    const rows = [
      attempt({
        outcome: "FAIL",
        createdAt: daysAgo(0, now),
        misconceptionSignalsJson: JSON.stringify([
          "misconception:foo",
          "",
          "   ",
        ]),
      }),
      attempt({
        outcome: "FAIL",
        createdAt: daysAgo(1, now),
        misconceptionSignalsJson: JSON.stringify([
          "misconception:foo",
          "misconception:bar",
        ]),
      }),
      attempt({
        outcome: "FAIL",
        createdAt: daysAgo(2, now),
        misconceptionSignalsJson: "{bad",
      }),
      attempt({
        outcome: "FAIL",
        createdAt: daysAgo(3, now),
        misconceptionSignalsJson: JSON.stringify(null),
      }),
      ...["a", "b", "c", "d", "e", "f"].map((tag, index) =>
        attempt({
          outcome: "FAIL",
          createdAt: daysAgo(4 + index, now),
          misconceptionSignalsJson: JSON.stringify([`misconception:${tag}`]),
        }),
      ),
    ];
    const signals = aggregateEvidenceSignals(rows, now);
    expect(
      signals.misconceptionSignals.find((s) => s.signal === "misconception:foo")
        ?.count,
    ).toBe(2);
    expect(
      signals.misconceptionSignals.find((s) => s.signal === "misconception:bar")
        ?.count,
    ).toBe(1);
    expect(signals.misconceptionSignals.length).toBeLessThanOrEqual(
      EVIDENCE_AGGREGATION_POLICY.maxMisconceptionSignals,
    );
  });

  it("12. EMPTY DATA → neutral, no crash", () => {
    expect(aggregateEvidenceSignals([])).toEqual(emptyEvidenceSignals());
  });

  it("13. NULL/OPTIONAL fields remain deterministic", () => {
    const signals = aggregateEvidenceSignals(
      [
        attempt({
          outcome: "FAIL",
          createdAt: daysAgo(1, now),
          misconceptionSignalsJson: "null",
          sourceRefJson: JSON.stringify({ kind: "quiz_attempt", extra: null }),
        }),
        attempt({
          outcome: "SUCCESS",
          createdAt: daysAgo(2, now),
          misconceptionSignalsJson: "[]",
          sourceRefJson: "{}",
        }),
        attempt({
          outcome: "PARTIAL",
          createdAt: daysAgo(3, now),
          misconceptionSignalsJson: JSON.stringify([123, null, "ok"]),
          sourceRefJson: "not-json",
        }),
      ],
      now,
    );
    expect(signals.failCount).toBe(1);
    expect(signals.successCount).toBe(1);
    expect(signals.partialCount).toBe(1);
    expect(signals.misconceptionSignals).toEqual([{ signal: "ok", count: 1 }]);
    expect(signals.sourceCounts.quiz).toBe(1);
    expect(signals.sourceCounts.other).toBe(2);
    expect(Number.isNaN(signals.failCount)).toBe(false);
  });

  it("15. TIME WINDOW — old FAILs in lifetime counts, not recentFailCount", () => {
    const old = EVIDENCE_AGGREGATION_POLICY.recentWindowDays + 2;
    const signals = aggregateEvidenceSignals(
      [
        attempt({ outcome: "SUCCESS", createdAt: daysAgo(1, now) }),
        attempt({ outcome: "FAIL", createdAt: daysAgo(old, now) }),
        attempt({ outcome: "FAIL", createdAt: daysAgo(old + 1, now) }),
        attempt({ outcome: "FAIL", createdAt: daysAgo(old + 2, now) }),
      ],
      now,
    );
    expect(signals.failCount).toBe(3);
    expect(signals.recentFailCount).toBe(0);
    expect(signals.repeatedFailure).toBe("none");
  });
});

describe("Phase 2F-3 scenario validation — Orchestrator safety", () => {
  const originalEvidence = process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE;
  const originalPrereq = process.env.STUDY_HAUL_ORCHESTRATOR_PREREQUISITES;
  const originalRelationships = process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS;

  beforeEach(() => {
    process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE = "1";
    process.env.STUDY_HAUL_ORCHESTRATOR_PREREQUISITES = "1";
    process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS = "1";
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalEvidence === undefined) {
      delete process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE;
    } else {
      process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE = originalEvidence;
    }
    if (originalPrereq === undefined) {
      delete process.env.STUDY_HAUL_ORCHESTRATOR_PREREQUISITES;
    } else {
      process.env.STUDY_HAUL_ORCHESTRATOR_PREREQUISITES = originalPrereq;
    }
    if (originalRelationships === undefined) {
      delete process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS;
    } else {
      process.env.STUDY_HAUL_CONCEPT_RELATIONSHIPS = originalRelationships;
    }
  });

  it("1. single FAIL does not invent exaggerated evidence hints", () => {
    const signals = aggregateEvidenceSignals([
      attempt({ outcome: "FAIL", createdAt: daysAgo(1) }),
    ]);
    const summary = baseSummary({
      facets: { recognize: 0.2, explain: 0.2, apply: 0.1, retain: 0.1 },
      evidenceSignals: signals,
    });
    const diagnosed = orchestrateFromLearnerState(summary);
    const enriched = enrichOrchestratorWithEvidenceSignals(diagnosed, summary);
    expect(enriched.diagnosis).toBe(diagnosed.diagnosis);
    expect(enriched.intervention?.sixComponent).toBe(
      diagnosed.intervention?.sixComponent,
    );
    expect(
      enriched.evidenceHints?.some((h) => h.kind === "repeated_failure"),
    ).toBeFalsy();
  });

  it("6. APPLICATION_GAP + APPLY fails — primary diagnosis/SIX preserved", () => {
    const signals = {
      ...emptyEvidenceSignals(),
      totalAttempts: 4,
      recentAttempts: 4,
      failCount: 2,
      recentFailCount: 2,
      repeatedFailure: "possible" as const,
      facetOutcomes: {
        ...emptyEvidenceSignals().facetOutcomes,
        APPLY: {
          attemptCount: 2,
          successCount: 0,
          partialCount: 0,
          failCount: 2,
          abandonedCount: 0,
          latestOutcome: "FAIL" as const,
        },
        RECOGNIZE: {
          attemptCount: 1,
          successCount: 1,
          partialCount: 0,
          failCount: 0,
          abandonedCount: 0,
          latestOutcome: "SUCCESS" as const,
        },
        EXPLAIN: {
          attemptCount: 1,
          successCount: 1,
          partialCount: 0,
          failCount: 0,
          abandonedCount: 0,
          latestOutcome: "SUCCESS" as const,
        },
      },
    };
    const summary = baseSummary({
      facets: {
        recognize: 0.7,
        explain: 0.7,
        apply: 0.2,
        retain: 0.5,
      },
      reviewCount: 4,
      evidenceSourceCounts: {
        quiz: 2,
        flashcard: 0,
        study_evaluate: 2,
        other: 0,
      },
      evidenceSignals: signals,
    });
    const diagnosed = orchestrateFromLearnerState(summary);
    expect(diagnosed.diagnosis).toBe("APPLICATION_GAP");
    expect(diagnosed.intervention?.sixComponent).toBe("hands-on-practice");
    const enriched = enrichOrchestratorWithEvidenceSignals(diagnosed, summary);
    expect(enriched.diagnosis).toBe("APPLICATION_GAP");
    expect(enriched.intervention?.sixComponent).toBe("hands-on-practice");
    expect(enriched.evidenceHints?.length).toBeGreaterThan(0);
  });

  it("8. prerequisite + evidence hints coexist without overwriting diagnosis/SIX", async () => {
    mockGetPrerequisiteConceptIds.mockResolvedValue(["prereq-1"]);
    mockGetLearnerConceptMastery.mockResolvedValue({
      learnerId: "user-1",
      conceptId: "prereq-1",
      conceptTitle: "Exceptions",
      facets: {
        ...emptyFacetScores(),
        recognize: 0.2,
        explain: 0.2,
        apply: 0.1,
        retain: 0.1,
      },
      topicMastery: null,
      recentMissedCount: 0,
      evidenceSourceCounts: {
        quiz: 2,
        flashcard: 0,
        study_evaluate: 0,
        other: 0,
      },
      reviewCount: 3,
      lastReviewedAt: null,
      nextReviewAt: null,
    });

    const signals = {
      ...emptyEvidenceSignals(),
      totalAttempts: 3,
      recentAttempts: 3,
      recentFailCount: 3,
      failCount: 3,
      repeatedFailure: "strong" as const,
    };
    const summary = baseSummary({
      facets: { recognize: 0.2, explain: 0.15, apply: 0.1, retain: 0.1 },
      evidenceSignals: signals,
    });
    const diagnosed = orchestrateFromLearnerState(summary);
    expect(diagnosed.diagnosis).toBe("UNDERSTANDING_GAP");
    const withPrereq = await enrichOrchestratorWithPrerequisites(diagnosed);
    const withBoth = enrichOrchestratorWithEvidenceSignals(withPrereq, summary);

    expect(withBoth.diagnosis).toBe("UNDERSTANDING_GAP");
    expect(withBoth.intervention?.sixComponent).toBe(
      diagnosed.intervention?.sixComponent,
    );
    expect(withBoth.prerequisiteHints?.length).toBe(1);
    expect(withBoth.evidenceHints?.length).toBeGreaterThan(0);
    expect(withBoth.reason).toContain(diagnosed.reason);
  });

  it("9. NO_INTERVENTION never manufactures evidence hints", () => {
    const summary = baseSummary({
      facets: {
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
      evidenceSignals: {
        ...emptyEvidenceSignals(),
        totalAttempts: 6,
        recentFailCount: 3,
        repeatedFailure: "strong",
      },
    });
    const diagnosed = orchestrateFromLearnerState(summary);
    expect(diagnosed.diagnosis).toBe("NO_INTERVENTION");
    const enriched = enrichOrchestratorWithEvidenceSignals(diagnosed, summary);
    expect(enriched.diagnosis).toBe("NO_INTERVENTION");
    expect(enriched.evidenceHints).toBeUndefined();
    expect(enriched.intervention).toBeNull();
  });

  it("10. INSUFFICIENT_EVIDENCE stays conservative (no evidence invent)", () => {
    const summary = baseSummary({
      facets: {},
      reviewCount: 0,
      evidenceSourceCounts: {
        quiz: 0,
        flashcard: 0,
        study_evaluate: 0,
        other: 0,
      },
      evidenceSignals: emptyEvidenceSignals(),
    });
    const diagnosed = orchestrateFromLearnerState(summary);
    expect(diagnosed.diagnosis).toBe("INSUFFICIENT_EVIDENCE");
    expect(diagnosed.intervention?.sixComponent).toBe("chunking");
    const enriched = enrichOrchestratorWithEvidenceSignals(diagnosed, summary);
    expect(enriched.diagnosis).toBe("INSUFFICIENT_EVIDENCE");
    expect(enriched.intervention?.sixComponent).toBe("chunking");
    expect(enriched.evidenceHints).toBeUndefined();
  });

  it("11. FLAG OFF parity — no evidenceHints even with strong signals present", () => {
    delete process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE;
    const summary = baseSummary({
      facets: { recognize: 0.2, explain: 0.2, apply: 0.1, retain: 0.1 },
      evidenceSignals: {
        ...emptyEvidenceSignals(),
        totalAttempts: 3,
        recentFailCount: 3,
        repeatedFailure: "strong",
      },
    });
    const diagnosed = orchestrateFromLearnerState(summary);
    const enriched = enrichOrchestratorWithEvidenceSignals(diagnosed, summary);
    expect(enriched).toEqual(diagnosed);
    expect(enriched.evidenceHints).toBeUndefined();
  });

  it("evidence enrichment errors degrade to original result", () => {
    const summary = baseSummary({
      facets: { recognize: 0.2, explain: 0.2, apply: 0.1, retain: 0.1 },
      evidenceSignals: {
        ...emptyEvidenceSignals(),
        totalAttempts: 3,
        recentFailCount: 3,
        repeatedFailure: "strong",
        // Force hint builder path; poison misconception list via getter
        get misconceptionSignals(): never {
          throw new Error("hint boom");
        },
      } as ReturnType<typeof emptyEvidenceSignals>,
    });
    const diagnosed = orchestrateFromLearnerState(summary);
    const enriched = enrichOrchestratorWithEvidenceSignals(diagnosed, summary);
    expect(enriched.diagnosis).toBe(diagnosed.diagnosis);
    expect(enriched.intervention).toEqual(diagnosed.intervention);
  });
});

describe("Phase 2F-3 ownership + flag-gated reader", () => {
  const original = process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE;
    } else {
      process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE = original;
    }
    vi.clearAllMocks();
  });

  it("14. FLAG OFF → getEvidenceSignalsForConcept returns null (no DB work)", async () => {
    delete process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE;
    await expect(
      getEvidenceSignalsForConcept("user-1", "concept-1"),
    ).resolves.toBeNull();
    expect(mockConceptFindFirst).not.toHaveBeenCalled();
    expect(mockLearningAttemptFindMany).not.toHaveBeenCalled();
  });

  it("14. ownership — foreign Concept returns null", async () => {
    process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE = "1";
    mockConceptFindFirst.mockResolvedValue(null);
    await expect(
      getEvidenceSignalsForConcept("user-1", "foreign-concept"),
    ).resolves.toBeNull();
    expect(mockLearningAttemptFindMany).not.toHaveBeenCalled();
  });

  it("14. ownership — attempts queried only for learnerId + conceptId", async () => {
    process.env.STUDY_HAUL_EVIDENCE_INTELLIGENCE = "1";
    mockConceptFindFirst.mockResolvedValue({ id: "concept-1" });
    mockLearningAttemptFindMany.mockResolvedValue([]);
    await getEvidenceSignalsForConcept("user-1", "concept-1");
    expect(mockLearningAttemptFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", conceptId: "concept-1" },
      }),
    );
  });
});

describe("Phase 2F-3 calibration & pipeline inspection", () => {
  it("documents current thresholds as consistent with scenarios", () => {
    expect(EVIDENCE_AGGREGATION_POLICY.recentWindowDays).toBe(30);
    expect(EVIDENCE_AGGREGATION_POLICY.recentAttemptLimit).toBe(10);
    expect(EVIDENCE_AGGREGATION_POLICY.repeatedFailurePossibleMinFails).toBe(2);
    expect(EVIDENCE_AGGREGATION_POLICY.repeatedFailureStrongMinFails).toBe(3);
    expect(EVIDENCE_AGGREGATION_POLICY.repeatedFailureStrongMinStreak).toBe(2);
  });

  it("orchestrateForConcept pipeline order: diagnose → prereq → evidence", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/index.ts"),
      "utf8",
    );
    // Inspect call order inside orchestrateForConcept only (imports appear earlier).
    const fnStart = source.indexOf("export async function orchestrateForConcept");
    const fnEnd = source.indexOf("\nexport {", fnStart);
    expect(fnStart).toBeGreaterThan(-1);
    expect(fnEnd).toBeGreaterThan(fnStart);
    const body = source.slice(fnStart, fnEnd);
    const diagnoseIdx = body.indexOf("orchestrateFromLearnerState");
    const prereqIdx = body.indexOf("enrichOrchestratorWithPrerequisites");
    const evidenceIdx = body.indexOf("enrichOrchestratorWithEvidenceSignals");
    expect(diagnoseIdx).toBeGreaterThan(-1);
    expect(prereqIdx).toBeGreaterThan(diagnoseIdx);
    expect(evidenceIdx).toBeGreaterThan(prereqIdx);
  });

  it("evidence enrichment never mutates diagnosis enum set", () => {
    const enrichment = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/orchestrator/evidence-enrichment.ts",
      ),
      "utf8",
    );
    expect(enrichment).not.toMatch(/diagnosis:\s*"/);
    expect(enrichment).toContain("GAP_DIAGNOSES");
    expect(enrichment).toContain("intervention");
    // Spreads result; does not assign a new diagnosis field.
    expect(enrichment).toMatch(/\.\.\.result/);
  });

  it("no new diagnosis enums introduced in Phase 2F-3", () => {
    const diagnose = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    expect(diagnose).not.toMatch(
      /REPEATED_FAILURE_GAP|MISCONCEPTION_GAP|ADAPTIVE_GAP/,
    );
  });
});
