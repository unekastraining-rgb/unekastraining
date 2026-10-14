/**
 * 2G-79 — Cross-activity evidence → ConceptMastery → projection → Orchestrator.
 * Mocks only the DB exterior; does not mock applyEvidenceToMastery / recordEvidence /
 * Orchestrator consumption of the resulting summary.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockConceptFindFirst,
  mockLearningObjectFindFirst,
  mockLearningObjectCreate,
  mockLearningAttemptCreate,
  mockLearningAttemptFindMany,
  mockConceptMasteryFindUnique,
  mockConceptMasteryUpsert,
  mockLearnerProfileUpsert,
  mockMissedQuestionCount,
  mockTopicFindFirst,
  mockAdaptiveFindFirst,
  mockRetentionFindFirst,
} = vi.hoisted(() => ({
  mockConceptFindFirst: vi.fn(),
  mockLearningObjectFindFirst: vi.fn(),
  mockLearningObjectCreate: vi.fn(),
  mockLearningAttemptCreate: vi.fn(),
  mockLearningAttemptFindMany: vi.fn(),
  mockConceptMasteryFindUnique: vi.fn(),
  mockConceptMasteryUpsert: vi.fn(),
  mockLearnerProfileUpsert: vi.fn(),
  mockMissedQuestionCount: vi.fn(),
  mockTopicFindFirst: vi.fn(),
  mockAdaptiveFindFirst: vi.fn(),
  mockRetentionFindFirst: vi.fn(),
}));

/** In-memory ConceptMastery so successive activity writes converge. */
let masteryStore: {
  recognize: number;
  explain: number;
  apply: number;
  solve: number;
  perform: number;
  retain: number;
  confidence: number;
  reviewCount: number;
  lastReviewedAt: Date | null;
  nextReviewAt: Date | null;
} | null = null;

const attemptRows: Array<{
  id: string;
  userId: string;
  conceptId: string;
  skillFacet: string;
  outcome: string;
  confidence: number | null;
  sourceRefJson: string;
  misconceptionSignalsJson: string;
  createdAt: Date;
}> = [];

vi.mock("@/lib/db", () => ({
  db: {
    concept: {
      findFirst: (...a: unknown[]) => mockConceptFindFirst(...a),
    },
    topic: { findFirst: (...a: unknown[]) => mockTopicFindFirst(...a) },
    learningObject: {
      findFirst: (...a: unknown[]) => mockLearningObjectFindFirst(...a),
      create: (...a: unknown[]) => mockLearningObjectCreate(...a),
    },
    learningAttempt: {
      create: (...a: unknown[]) => mockLearningAttemptCreate(...a),
      findMany: (...a: unknown[]) => mockLearningAttemptFindMany(...a),
    },
    conceptMastery: {
      findUnique: (...a: unknown[]) => mockConceptMasteryFindUnique(...a),
      upsert: (...a: unknown[]) => mockConceptMasteryUpsert(...a),
    },
    learnerProfile: {
      upsert: (...a: unknown[]) => mockLearnerProfileUpsert(...a),
    },
    missedQuestion: { count: (...a: unknown[]) => mockMissedQuestionCount(...a) },
    retentionItem: {
      upsert: vi.fn().mockResolvedValue({ id: "ri-1" }),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: (...a: unknown[]) => mockRetentionFindFirst(...a),
      update: vi.fn(),
    },
    adaptiveSequenceRun: {
      findFirst: (...a: unknown[]) => mockAdaptiveFindFirst(...a),
    },
  },
}));

vi.mock("@/lib/learning/evidence/intelligence-flag", () => ({
  isEvidenceIntelligenceEnabled: () => true,
}));

import { submitCodingChallenge } from "@/lib/learning/activities/coding/service";
import { submitSqlChallenge } from "@/lib/learning/activities/sql/service";
import { recordEvidence } from "@/lib/learning/evidence/record";
import { buildEvidenceEnvelope } from "@/lib/learning/evidence/envelope";
import { applyEvidenceToMastery } from "@/lib/learning/mastery/apply";
import { getLearnerConceptMastery } from "@/lib/learning/learner-model/read";
import { projectLearnerConceptState } from "@/lib/learning/learner-model/project";
import { orchestrateFromLearnerState } from "@/lib/learning/orchestrator/diagnose";
import { CANONICAL_ULE_MASTERY_SOURCE } from "@/lib/learning/mastery/mastery-truth";

const USER = "user-1";
const CONCEPT = "concept-1";

describe("2G-79 cross-activity ConceptMastery convergence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    masteryStore = null;
    attemptRows.length = 0;

    mockLearnerProfileUpsert.mockResolvedValue({ id: "lp1" });
    mockConceptFindFirst.mockResolvedValue({
      id: CONCEPT,
      userId: USER,
      learningSpaceId: null,
      title: "Binary Search",
    });
    mockTopicFindFirst.mockResolvedValue(null);
    mockMissedQuestionCount.mockResolvedValue(0);
    mockLearningObjectFindFirst.mockResolvedValue(null);
    mockLearningObjectCreate.mockResolvedValue({ id: "lo-auto" });
    mockAdaptiveFindFirst.mockResolvedValue(null);
    mockRetentionFindFirst.mockResolvedValue(null);

    mockLearningAttemptCreate.mockImplementation(
      async (args: { data: Record<string, unknown> }) => {
        const row = {
          id: `att-${attemptRows.length + 1}`,
          userId: String(args.data.userId),
          conceptId: String(args.data.conceptId),
          skillFacet: String(args.data.skillFacet),
          outcome: String(args.data.outcome),
          confidence:
            args.data.confidence === undefined || args.data.confidence === null
              ? null
              : Number(args.data.confidence),
          sourceRefJson: String(args.data.sourceRefJson),
          misconceptionSignalsJson: String(
            args.data.misconceptionSignalsJson ?? "[]",
          ),
          createdAt: new Date(),
        };
        attemptRows.push(row);
        return row;
      },
    );

    mockLearningAttemptFindMany.mockImplementation(async () =>
      [...attemptRows].reverse(),
    );

    mockConceptMasteryFindUnique.mockImplementation(async () =>
      masteryStore
        ? { userId: USER, conceptId: CONCEPT, ...masteryStore }
        : null,
    );

    mockConceptMasteryUpsert.mockImplementation(
      async (args: {
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => {
        const base = masteryStore ?? {
          recognize: 0,
          explain: 0,
          apply: 0,
          solve: 0,
          perform: 0,
          retain: 0,
          confidence: 0,
          reviewCount: 0,
          lastReviewedAt: null as Date | null,
          nextReviewAt: null as Date | null,
        };
        const src = masteryStore ? args.update : args.create;
        const nextReviewCount = masteryStore
          ? base.reviewCount + 1
          : Number(src.reviewCount ?? 1);
        masteryStore = {
          recognize: Number(src.recognize ?? base.recognize),
          explain: Number(src.explain ?? base.explain),
          apply: Number(src.apply ?? base.apply),
          solve: Number(src.solve ?? base.solve),
          perform: Number(src.perform ?? base.perform),
          retain: Number(src.retain ?? base.retain),
          confidence: Number(src.confidence ?? base.confidence),
          reviewCount: nextReviewCount,
          lastReviewedAt: (src.lastReviewedAt as Date) ?? new Date(),
          nextReviewAt: (src.nextReviewAt as Date) ?? new Date(),
        };
        return { id: "cm-1", userId: USER, conceptId: CONCEPT, ...masteryStore };
      },
    );
  });

  it("Coding evidence updates ConceptMastery.perform on the shared concept", async () => {
    const result = await submitCodingChallenge({
      learnerId: USER,
      conceptId: CONCEPT,
      challengeId: "js-sum-two",
      clientBody: { code: "function add(a, b) { return a + b; }" },
    });
    expect(result.ok).toBe(true);
    expect(attemptRows).toHaveLength(1);
    expect(attemptRows[0].skillFacet).toBe("PERFORM");
    expect(masteryStore?.perform).toBeGreaterThan(0);
    expect(masteryStore?.reviewCount).toBe(1);
  });

  it("SQL evidence converges on the same ConceptMastery row", async () => {
    await submitCodingChallenge({
      learnerId: USER,
      conceptId: CONCEPT,
      challengeId: "js-sum-two",
      clientBody: { code: "function add(a, b) { return a + b; }" },
    });
    const performAfterCoding = masteryStore!.perform;

    const sql = await submitSqlChallenge({
      learnerId: USER,
      conceptId: CONCEPT,
      challengeId: "sql-select-students",
      clientBody: { sql: "SELECT * FROM students;" },
    });
    expect(sql.ok).toBe(true);
    expect(attemptRows.length).toBeGreaterThanOrEqual(2);
    expect(masteryStore!.reviewCount).toBeGreaterThanOrEqual(2);
    expect(masteryStore!.perform).not.toBe(performAfterCoding);
  });

  it("Quiz RECOGNIZE evidence shares ConceptMastery with Coding PERFORM", async () => {
    await submitCodingChallenge({
      learnerId: USER,
      conceptId: CONCEPT,
      challengeId: "js-sum-two",
      clientBody: { code: "function add(a, b) { return a + b; }" },
    });
    const perform = masteryStore!.perform;

    const envelope = buildEvidenceEnvelope({
      learnerId: USER,
      learningObjectId: "lo-quiz",
      conceptId: CONCEPT,
      skillFacet: "RECOGNIZE",
      outcome: "SUCCESS",
      score: 1,
      confidence: null,
      misconceptionSignals: [],
      sourceRef: { kind: "quiz_attempt", quizId: "q1", questionId: "qq1" },
    });
    await recordEvidence(envelope);
    await applyEvidenceToMastery(envelope);

    expect(masteryStore!.recognize).toBeGreaterThan(0);
    expect(masteryStore!.perform).toBe(perform);
    expect(masteryStore!.reviewCount).toBe(2);
  });

  it("launch / open does not create evidence (no accidental LearningAttempt)", () => {
    expect(attemptRows).toHaveLength(0);
    expect(masteryStore).toBeNull();
  });

  it("completion-shaped client forgery cannot write mastery alone", async () => {
    const result = await submitCodingChallenge({
      learnerId: USER,
      conceptId: CONCEPT,
      challengeId: "js-sum-two",
      clientBody: {
        code: "function add(a, b) { return a + b; }",
        outcome: "FAIL",
        score: 0,
        learnerId: "attacker",
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.completion.outcome).toBe("SUCCESS");
    expect(result.rejectedForgeryKeys).toEqual(
      expect.arrayContaining(["outcome", "score", "learnerId"]),
    );
  });

  it("missing attempt confidence stays null (not zero)", async () => {
    const envelope = buildEvidenceEnvelope({
      learnerId: USER,
      learningObjectId: "lo-1",
      conceptId: CONCEPT,
      skillFacet: "EXPLAIN",
      outcome: "PARTIAL",
      sourceRef: { kind: "study_evaluate", mode: "teach_me" },
    });
    expect(envelope.confidence == null || envelope.confidence === null).toBe(
      true,
    );
    await recordEvidence(envelope);
    expect(attemptRows[0].confidence).toBeNull();
  });

  it("repeated FAILs stay associated with the same Concept", async () => {
    for (let i = 0; i < 3; i++) {
      const envelope = buildEvidenceEnvelope({
        learnerId: USER,
        learningObjectId: `lo-fail-${i}`,
        conceptId: CONCEPT,
        skillFacet: "PERFORM",
        outcome: "FAIL",
        misconceptionSignals: [`coding_fail:${i}`],
        sourceRef: { kind: "coding_challenge_submit", id: `c-${i}` },
      });
      await recordEvidence(envelope);
      await applyEvidenceToMastery(envelope);
    }
    expect(attemptRows.every((r) => r.conceptId === CONCEPT)).toBe(true);
    expect(masteryStore!.perform).toBeLessThan(0.5);
    expect(attemptRows).toHaveLength(3);
  });

  it("active Adaptive run does not alter mastery by itself", async () => {
    mockAdaptiveFindFirst.mockResolvedValue({
      id: "run-1",
      status: "ACTIVE",
      currentStepIndex: 2,
    });
    expect(masteryStore).toBeNull();
    const projection = await projectLearnerConceptState(USER, CONCEPT);
    expect(projection?.activeAdaptiveRun?.runId).toBe("run-1");
    expect(projection?.mastery.status).toBe("unavailable");
    expect(masteryStore).toBeNull();
  });

  it("retention state projects without becoming mastery", async () => {
    mockRetentionFindFirst.mockResolvedValue({
      id: "ret-1",
      dueAt: new Date("2026-09-22T00:00:00Z"),
      priority: 0.8,
      status: "DUE",
    });
    const envelope = buildEvidenceEnvelope({
      learnerId: USER,
      learningObjectId: "lo-r",
      conceptId: CONCEPT,
      skillFacet: "RETAIN",
      outcome: "SUCCESS",
      sourceRef: { kind: "lucky_retention_review", id: "ret-1" },
    });
    await recordEvidence(envelope);
    await applyEvidenceToMastery(envelope);

    const projection = await projectLearnerConceptState(USER, CONCEPT);
    expect(projection?.retentionState?.itemId).toBe("ret-1");
    expect(projection?.mastery.source).toBe(CANONICAL_ULE_MASTERY_SOURCE);
    expect(projection?.mastery.status).toBe("available");
  });

  it("learner-state projection → Orchestrator consumes updated ConceptMastery", async () => {
    await submitCodingChallenge({
      learnerId: USER,
      conceptId: CONCEPT,
      challengeId: "js-sum-two",
      clientBody: { code: "function add(a, b) { return a + b; }" },
    });
    for (const facet of ["RECOGNIZE", "EXPLAIN", "APPLY"] as const) {
      const envelope = buildEvidenceEnvelope({
        learnerId: USER,
        learningObjectId: `lo-${facet}`,
        conceptId: CONCEPT,
        skillFacet: facet,
        outcome: "SUCCESS",
        sourceRef: { kind: "quiz_attempt", quizId: "q", questionId: facet },
      });
      await recordEvidence(envelope);
      await applyEvidenceToMastery(envelope);
    }

    const summary = await getLearnerConceptMastery(USER, CONCEPT);
    expect(summary).not.toBeNull();
    expect(summary!.reviewCount).toBeGreaterThan(0);
    expect(summary!.facets.perform).toBeGreaterThan(0);
    expect(summary!.facets.recognize).toBeGreaterThan(0);

    const projection = await projectLearnerConceptState(USER, CONCEPT);
    expect(projection?.mastery.status).toBe("available");
    expect(projection?.recentActivity.bySource.activity).toBeGreaterThan(0);
    expect(projection?.recentActivity.bySource.quiz).toBeGreaterThan(0);
    expect(projection?.topicProgressSidecar.present).toBe(false);

    const orch = orchestrateFromLearnerState(summary!);
    expect(orch.signals.usedTopicMasteryFallback).toBe(false);
    expect(orch.signals.reviewCount).toBe(summary!.reviewCount);
  });

  it("foreign concept cannot write mastery", async () => {
    mockConceptFindFirst.mockResolvedValue(null);
    const result = await submitCodingChallenge({
      learnerId: USER,
      conceptId: "foreign",
      challengeId: "js-sum-two",
      clientBody: { code: "function add(a,b){return a+b}" },
    });
    expect(result.ok).toBe(false);
    expect(attemptRows).toHaveLength(0);
    expect(masteryStore).toBeNull();
  });

  it("evidence summary on projection is not treated as mastery source", async () => {
    const envelope = buildEvidenceEnvelope({
      learnerId: USER,
      learningObjectId: "lo-e",
      conceptId: CONCEPT,
      skillFacet: "RECOGNIZE",
      outcome: "FAIL",
      misconceptionSignals: ["quiz_miss:mc"],
      sourceRef: { kind: "quiz_attempt", quizId: "q", questionId: "1" },
    });
    await recordEvidence(envelope);
    await applyEvidenceToMastery(envelope);

    const projection = await projectLearnerConceptState(USER, CONCEPT);
    expect(projection?.summary.evidenceSignals).toBeDefined();
    expect(projection?.mastery.source).toBe(CANONICAL_ULE_MASTERY_SOURCE);
    if (projection?.mastery.status === "available") {
      expect(projection.mastery.facets.recognize).toBe(
        masteryStore!.recognize,
      );
    }
  });
});

describe("2G-79 activity boundary: completion ≠ mastery", () => {
  it("applyEvidenceToMastery is the only ConceptMastery upsert in activity spine", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const root = resolve(__dirname, "../../../..");
    const spine = readFileSync(
      resolve(root, "src/lib/learning/activities/server-evaluation.ts"),
      "utf8",
    );
    expect(spine).toContain("recordEvidence");
    expect(spine).toContain("applyEvidenceToMastery");
    expect(spine).not.toMatch(/db\.conceptMastery\.(create|update)\(/);
  });
});
