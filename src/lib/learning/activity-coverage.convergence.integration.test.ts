/**
 * 2G-81 — Cross-activity evidence closure on one Concept.
 *
 * Coding + SQL + Quiz → same ConceptMastery → Orchestrator reads aggregate state.
 * Also: missing concept rejects; foreign concept rejects; no evidence ≠ weak claim.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const USER = "user-81";
const CONCEPT = "concept-81";
const SPACE = "space-81";

type Store = {
  concepts: Map<string, Record<string, unknown>>;
  learningSpaces: Map<string, Record<string, unknown>>;
  masteries: Map<string, Record<string, unknown>>;
  attempts: Array<Record<string, unknown>>;
  learningObjects: Array<Record<string, unknown>>;
  topics: Array<Record<string, unknown>>;
  learnerProfiles: Map<string, Record<string, unknown>>;
  idSeq: number;
};

const store: Store = {
  concepts: new Map(),
  learningSpaces: new Map(),
  masteries: new Map(),
  attempts: [],
  learningObjects: [],
  topics: [],
  learnerProfiles: new Map(),
  idSeq: 0,
};

function nextId(prefix: string) {
  store.idSeq += 1;
  return `${prefix}-${store.idSeq}`;
}

function masteryKey(userId: string, conceptId: string) {
  return `${userId}::${conceptId}`;
}

function applyPrismaUpdate(
  existing: Record<string, unknown>,
  update: Record<string, unknown>,
) {
  const next = { ...existing };
  for (const [key, value] of Object.entries(update)) {
    if (
      value &&
      typeof value === "object" &&
      "increment" in (value as object) &&
      typeof (value as { increment: unknown }).increment === "number"
    ) {
      next[key] =
        Number(existing[key] ?? 0) +
        (value as { increment: number }).increment;
    } else {
      next[key] = value;
    }
  }
  return next;
}

function seedEmptyConcept(): void {
  store.concepts.clear();
  store.learningSpaces.clear();
  store.masteries.clear();
  store.attempts = [];
  store.learningObjects = [];
  store.topics = [];
  store.learnerProfiles.clear();
  store.idSeq = 0;

  store.learningSpaces.set(SPACE, {
    id: SPACE,
    userId: USER,
    kind: "COURSE",
    subjectDomain: "javascript programming",
    courseId: "course-81",
  });
  store.concepts.set(CONCEPT, {
    id: CONCEPT,
    userId: USER,
    learningSpaceId: SPACE,
    title: "Functions",
    subjectDomain: "javascript programming",
    metadataJson: "{}",
  });
  store.topics.push({
    id: "topic-81",
    name: "Functions",
    courseId: "course-81",
    conceptId: CONCEPT,
    masteries: [],
  });
  store.learnerProfiles.set(USER, {
    id: "lp-81",
    userId: USER,
    goalsJson: "[]",
    modalityPreferencesJson: "{}",
    accessibilityPreferencesJson: "{}",
    settingsJson: "{}",
  });
}

vi.mock("@/lib/db", () => ({
  db: {
    concept: {
      findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        for (const c of store.concepts.values()) {
          if (where.id && c.id !== where.id) continue;
          if (where.userId && c.userId !== where.userId) continue;
          const space = c.learningSpaceId
            ? store.learningSpaces.get(c.learningSpaceId as string)
            : null;
          return {
            ...c,
            learningSpace: space
              ? { subjectDomain: space.subjectDomain }
              : null,
          };
        }
        return null;
      }),
    },
    learningSpace: {
      findFirst: vi.fn(async () => null),
      findUnique: vi.fn(async () => null),
      create: vi.fn(),
    },
    conceptMastery: {
      findUnique: vi.fn(
        async ({
          where,
        }: {
          where: { userId_conceptId?: { userId: string; conceptId: string } };
        }) => {
          const pair = where.userId_conceptId;
          if (!pair) return null;
          return store.masteries.get(masteryKey(pair.userId, pair.conceptId)) ?? null;
        },
      ),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { userId_conceptId: { userId: string; conceptId: string } };
          create: Record<string, unknown>;
          update: Record<string, unknown>;
        }) => {
          const key = masteryKey(
            where.userId_conceptId.userId,
            where.userId_conceptId.conceptId,
          );
          const existing = store.masteries.get(key);
          if (!existing) {
            const row = { id: nextId("cm"), ...create };
            store.masteries.set(key, row);
            return row;
          }
          const next = applyPrismaUpdate(existing, update);
          store.masteries.set(key, next);
          return next;
        },
      ),
    },
    learningAttempt: {
      findMany: vi.fn(
        async ({ where }: { where: { userId: string; conceptId: string } }) =>
          store.attempts
            .filter(
              (a) =>
                a.userId === where.userId && a.conceptId === where.conceptId,
            )
            .sort(
              (a, b) =>
                (b.createdAt as Date).getTime() -
                (a.createdAt as Date).getTime(),
            ),
      ),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: nextId("la"), createdAt: new Date(), ...data };
        store.attempts.push(row);
        return row;
      }),
      count: vi.fn(async () => store.attempts.length),
    },
    learningObject: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: nextId("lo"), ...data };
        store.learningObjects.push(row);
        return row;
      }),
    },
    topic: {
      findFirst: vi.fn(async ({ where }: { where: { conceptId?: string } }) => {
        const topic = store.topics.find(
          (t) => !where.conceptId || t.conceptId === where.conceptId,
        );
        return topic ? { ...topic, masteries: [] } : null;
      }),
    },
    missedQuestion: { count: vi.fn(async () => 0) },
    learnerProfile: {
      upsert: vi.fn(
        async ({
          where,
          create,
        }: {
          where: { userId: string };
          create: Record<string, unknown>;
        }) => {
          const existing = store.learnerProfiles.get(where.userId);
          if (existing) return existing;
          const row = { id: nextId("lp"), ...create };
          store.learnerProfiles.set(where.userId, row);
          return row;
        },
      ),
    },
    retentionItem: {
      upsert: vi.fn(async () => ({ id: "ri-81" })),
      findUnique: vi.fn(async () => null),
      findFirst: vi.fn(async () => null),
      update: vi.fn(),
    },
    adaptiveSequenceRun: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(),
    },
  },
}));

import { submitCodingChallenge } from "@/lib/learning/activities/coding/service";
import { submitSqlChallenge } from "@/lib/learning/activities/sql/service";
import { buildEvidenceEnvelope } from "@/lib/learning/evidence/envelope";
import { recordEvidence } from "@/lib/learning/evidence/record";
import { applyEvidenceToMastery } from "@/lib/learning/mastery/apply";
import { getLearnerConceptMastery } from "@/lib/learning/learner-model/read";
import { projectLearnerConceptState } from "@/lib/learning/learner-model/project";
import { orchestrateForConcept } from "@/lib/learning/orchestrator";
import { emptyFacetScores } from "@/lib/learning/mastery/facets";
import { orchestrateFromLearnerState } from "@/lib/learning/orchestrator/diagnose";

describe("2G-81 three-family convergence (Coding + SQL + Quiz)", () => {
  beforeEach(() => {
    seedEmptyConcept();
  });

  it("three producers update the same ConceptMastery and feed Orchestrator", async () => {
    const coding = await submitCodingChallenge({
      learnerId: USER,
      conceptId: CONCEPT,
      challengeId: "js-sum-two",
      clientBody: { code: "function add(a, b) { return a + b; }" },
    });
    expect(coding.ok).toBe(true);

    const sql = await submitSqlChallenge({
      learnerId: USER,
      conceptId: CONCEPT,
      challengeId: "sql-select-students",
      clientBody: { sql: "SELECT * FROM students;" },
    });
    expect(sql.ok).toBe(true);

    const quizEnvelope = buildEvidenceEnvelope({
      learnerId: USER,
      learningObjectId: nextId("lo-quiz"),
      conceptId: CONCEPT,
      skillFacet: "RECOGNIZE",
      outcome: "SUCCESS",
      score: 1,
      confidence: null,
      sourceRef: { kind: "quiz_attempt", quizId: "q81", questionId: "qq1" },
    });
    await recordEvidence(quizEnvelope);
    await applyEvidenceToMastery(quizEnvelope);

    expect(store.attempts.length).toBeGreaterThanOrEqual(3);
    expect(
      store.attempts.every((a) => a.conceptId === CONCEPT && a.userId === USER),
    ).toBe(true);

    const mastery = store.masteries.get(masteryKey(USER, CONCEPT))!;
    expect(Number(mastery.perform)).toBeGreaterThan(0);
    expect(Number(mastery.recognize)).toBeGreaterThan(0);
    expect(Number(mastery.reviewCount)).toBeGreaterThanOrEqual(3);

    const summary = await getLearnerConceptMastery(USER, CONCEPT);
    expect(summary).not.toBeNull();
    expect(summary!.facets.perform).toBe(Number(mastery.perform));
    expect(summary!.facets.recognize).toBe(Number(mastery.recognize));

    const projection = await projectLearnerConceptState(USER, CONCEPT);
    expect(projection?.mastery.source).toBe("ConceptMastery");
    expect(projection?.recentActivity.bySource.activity).toBeGreaterThan(0);
    expect(projection?.recentActivity.bySource.quiz).toBeGreaterThan(0);

    const orch = await orchestrateForConcept(USER, CONCEPT);
    expect(orch).not.toBeNull();
    expect(orch!.signals.reviewCount).toBe(summary!.reviewCount);
    expect(orch!.signals.usedTopicMasteryFallback).toBe(false);
  });

  it("foreign concept cannot write Coding evidence", async () => {
    const result = await submitCodingChallenge({
      learnerId: USER,
      conceptId: "foreign-concept",
      challengeId: "js-sum-two",
      clientBody: { code: "function add(a,b){return a+b}" },
    });
    expect(result.ok).toBe(false);
    expect(store.attempts).toHaveLength(0);
    expect(store.masteries.size).toBe(0);
  });

  it("applyEvidenceToMastery without conceptId does not fabricate mastery", async () => {
    const envelope = buildEvidenceEnvelope({
      learnerId: USER,
      learningObjectId: "lo-x",
      conceptId: null,
      skillFacet: "RECOGNIZE",
      outcome: "SUCCESS",
      sourceRef: { kind: "quiz_attempt", quizId: "q", questionId: "1" },
    });
    await recordEvidence(envelope);
    const applied = await applyEvidenceToMastery(envelope);
    expect(applied).toBeNull();
    expect(store.masteries.size).toBe(0);
  });

  it("no evidence remains INSUFFICIENT_EVIDENCE (not fabricated weak mastery)", async () => {
    const summary = await getLearnerConceptMastery(USER, CONCEPT);
    expect(summary).not.toBeNull();
    expect(summary!.reviewCount).toBe(0);
    expect(summary!.facets).toEqual(emptyFacetScores());

    const orch = orchestrateFromLearnerState(summary!);
    expect(orch.diagnosis).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("client forgery cannot set Coding outcome", async () => {
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
});
