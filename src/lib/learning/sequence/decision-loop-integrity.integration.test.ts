/**
 * 2G-80 — Critical decision-loop integrity: evidence must change the next Orchestrator decision.
 *
 * Real path (no mocked Orchestrator / applyEvidenceToMastery / recordEvidence):
 * ConceptMastery → orchestrateForConcept → evidence → applyEvidenceToMastery
 * → orchestrateForConcept again → diagnosis reflects updated state
 * → Adaptive bind → plan-next re-reads mastery
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const USER = "user-80";
const CONCEPT = "concept-80";
const SPACE = "space-80";
const TOPIC = "topic-80";
const COURSE = "course-80";

type Store = {
  concepts: Map<string, Record<string, unknown>>;
  learningSpaces: Map<string, Record<string, unknown>>;
  masteries: Map<string, Record<string, unknown>>;
  attempts: Array<Record<string, unknown>>;
  learningObjects: Array<Record<string, unknown>>;
  runs: Map<string, Record<string, unknown>>;
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
  runs: new Map(),
  topics: [],
  learnerProfiles: new Map(),
  idSeq: 0,
};

function nextId(prefix: string): string {
  store.idSeq += 1;
  return `${prefix}-${store.idSeq}`;
}

function masteryKey(userId: string, conceptId: string): string {
  return `${userId}::${conceptId}`;
}

function applyPrismaUpdate(
  existing: Record<string, unknown>,
  update: Record<string, unknown>,
): Record<string, unknown> {
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

/** APPLICATION_GAP seed: strong understand, weak apply, weak retain. */
function seedApplicationGap(): void {
  store.concepts.clear();
  store.learningSpaces.clear();
  store.masteries.clear();
  store.attempts = [];
  store.learningObjects = [];
  store.runs.clear();
  store.topics = [];
  store.learnerProfiles.clear();
  store.idSeq = 0;

  store.learningSpaces.set(SPACE, {
    id: SPACE,
    userId: USER,
    kind: "COURSE",
    title: "CS",
    subjectDomain: "computer science",
    courseId: COURSE,
  });

  store.concepts.set(CONCEPT, {
    id: CONCEPT,
    userId: USER,
    learningSpaceId: SPACE,
    title: "Recursion",
    subjectDomain: "computer science",
    metadataJson: "{}",
  });

  store.masteries.set(masteryKey(USER, CONCEPT), {
    id: "cm-80",
    userId: USER,
    conceptId: CONCEPT,
    recognize: 0.7,
    explain: 0.65,
    apply: 0.2,
    solve: 0.1,
    perform: 0.1,
    retain: 0.3,
    confidence: 0.4,
    reviewCount: 4,
    lastReviewedAt: null,
    nextReviewAt: null,
  });

  for (let i = 0; i < 3; i++) {
    store.attempts.push({
      id: `seed-${i}`,
      userId: USER,
      conceptId: CONCEPT,
      learningObjectId: `seed-lo-${i}`,
      outcome: "SUCCESS",
      skillFacet: "RECOGNIZE",
      confidence: null,
      sourceRefJson: JSON.stringify({ kind: "quiz_attempt", quizId: "seed" }),
      misconceptionSignalsJson: "[]",
      createdAt: new Date(Date.UTC(2026, 0, 1 + i)),
    });
  }

  store.topics.push({
    id: TOPIC,
    name: "Recursion",
    courseId: COURSE,
    conceptId: CONCEPT,
    masteries: [],
  });

  store.learnerProfiles.set(USER, {
    id: "lp-80",
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
        const id = where.id as string | undefined;
        const userId = where.userId as string | undefined;
        for (const c of store.concepts.values()) {
          if (id && c.id !== id) continue;
          if (userId && c.userId !== userId) continue;
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
        async ({
          where,
        }: {
          where: { userId: string; conceptId: string };
        }) =>
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
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: { id?: string; userId?: string };
        }) => {
          return (
            store.attempts.find((a) => {
              if (where.id && a.id !== where.id) return false;
              if (where.userId && a.userId !== where.userId) return false;
              return true;
            }) ?? null
          );
        },
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
    adaptiveSequenceRun: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = {
          id: nextId("run"),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        store.runs.set(row.id as string, row);
        return row;
      }),
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: {
            id?: string;
            userId?: string;
            conceptId?: string;
            status?: string;
          };
        }) => {
          for (const run of store.runs.values()) {
            if (where.id && run.id !== where.id) continue;
            if (where.userId && run.userId !== where.userId) continue;
            if (where.conceptId && run.conceptId !== where.conceptId) continue;
            if (where.status && run.status !== where.status) continue;
            return { ...run };
          }
          return null;
        },
      ),
      findMany: vi.fn(async () => [...store.runs.values()]),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          const existing = store.runs.get(where.id);
          if (!existing) throw new Error("run missing");
          const next = { ...existing, ...data, updatedAt: new Date() };
          store.runs.set(where.id, next);
          return next;
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: {
            id: string;
            userId: string;
            status: string;
            currentStepIndex: number;
          };
          data: Record<string, unknown>;
        }) => {
          const existing = store.runs.get(where.id);
          if (
            !existing ||
            existing.userId !== where.userId ||
            existing.status !== where.status ||
            existing.currentStepIndex !== where.currentStepIndex
          ) {
            return { count: 0 };
          }
          const next = { ...existing, ...data, updatedAt: new Date() };
          store.runs.set(where.id, next);
          return { count: 1 };
        },
      ),
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
      upsert: vi.fn(async () => ({ id: "ri-80" })),
      findUnique: vi.fn(async () => null),
      findFirst: vi.fn(async () => null),
      update: vi.fn(),
    },
    quiz: { findFirst: vi.fn(async () => null) },
    flashcard: { findFirst: vi.fn(async () => null) },
  },
}));

vi.mock("@/lib/learning/sequence/lucky-handoff", () => ({
  syncLuckyRetentionAfterSequenceComplete: vi.fn().mockResolvedValue(undefined),
}));

import { buildEvidenceEnvelope } from "@/lib/learning/evidence/envelope";
import { recordEvidence } from "@/lib/learning/evidence/record";
import { applyEvidenceToMastery } from "@/lib/learning/mastery/apply";
import { getLearnerConceptMastery } from "@/lib/learning/learner-model/read";
import { projectLearnerConceptState } from "@/lib/learning/learner-model/project";
import { orchestrateForConcept } from "@/lib/learning/orchestrator";
import {
  recordAdaptiveSequenceCompletionAndPlanNext,
  startAdaptiveSequenceRun,
} from "@/lib/learning/sequence";
import type { MasteryFacetName } from "@/lib/learning/types";

async function writeFacetEvidence(
  facet: MasteryFacetName,
  outcome: "SUCCESS" | "PARTIAL" | "FAIL",
  sourceKind: string,
): Promise<{ attemptId: string }> {
  const envelope = buildEvidenceEnvelope({
    learnerId: USER,
    learningObjectId: nextId("lo-ev"),
    conceptId: CONCEPT,
    skillFacet: facet,
    outcome,
    score: outcome === "SUCCESS" ? 1 : outcome === "PARTIAL" ? 0.5 : 0,
    confidence: null,
    sourceRef: { kind: sourceKind, id: nextId("src") },
  });
  const attempt = await recordEvidence(envelope);
  await applyEvidenceToMastery(envelope);
  return { attemptId: attempt.id };
}

describe("2G-80 decision loop — evidence changes next Orchestrator decision", () => {
  beforeEach(() => {
    seedApplicationGap();
  });

  it("initial APPLICATION_GAP → APPLY evidence → RETENTION_GAP (state consumed)", async () => {
    const before = await orchestrateForConcept(USER, CONCEPT);
    expect(before).not.toBeNull();
    expect(before!.diagnosis).toBe("APPLICATION_GAP");
    expect(before!.intervention?.sixComponent).toBe("hands-on-practice");

    // 0.2 + 4×0.1 = 0.6 → apply crosses STRONG; retain stays weak → RETENTION_GAP
    for (let i = 0; i < 4; i++) {
      await writeFacetEvidence("APPLY", "SUCCESS", "study_evaluate");
    }

    const mastery = store.masteries.get(masteryKey(USER, CONCEPT))!;
    expect(Number(mastery.apply)).toBeGreaterThanOrEqual(0.55);
    expect(Number(mastery.retain)).toBeLessThan(0.45);

    const after = await orchestrateForConcept(USER, CONCEPT);
    expect(after).not.toBeNull();
    expect(after!.diagnosis).toBe("RETENTION_GAP");
    expect(after!.intervention?.sixComponent).toBe("active-recall");
    expect(after!.diagnosis).not.toBe(before!.diagnosis);
    expect(after!.signals.usedTopicMasteryFallback).toBe(false);
  });

  it("identical inputs remain deterministic", async () => {
    const a = await orchestrateForConcept(USER, CONCEPT);
    const b = await orchestrateForConcept(USER, CONCEPT);
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a!.diagnosis).toBe(b!.diagnosis);
    expect(a!.intervention?.sixComponent).toBe(b!.intervention?.sixComponent);
    expect(a!.confidence).toBe(b!.confidence);
  });

  it("cross-activity: Coding PERFORM + Quiz RECOGNIZE share ConceptMastery and feed orch", async () => {
    await writeFacetEvidence("PERFORM", "SUCCESS", "coding_challenge_submit");
    await writeFacetEvidence("RECOGNIZE", "SUCCESS", "quiz_attempt");

    const summary = await getLearnerConceptMastery(USER, CONCEPT);
    expect(summary).not.toBeNull();
    expect(summary!.facets.perform).toBeGreaterThan(0.1);
    expect(summary!.facets.recognize).toBeGreaterThan(0.7);

    const orch = await orchestrateForConcept(USER, CONCEPT);
    expect(orch).not.toBeNull();
    expect(orch!.signals.reviewCount).toBe(summary!.reviewCount);
    expect(orch!.conceptId).toBe(CONCEPT);
  });

  it("facet separation: RECOGNIZE evidence does not equal EXPLAIN bump", async () => {
    const before = store.masteries.get(masteryKey(USER, CONCEPT))!;
    const explainBefore = Number(before.explain);
    await writeFacetEvidence("RECOGNIZE", "SUCCESS", "quiz_attempt");
    const after = store.masteries.get(masteryKey(USER, CONCEPT))!;
    expect(Number(after.recognize)).toBeGreaterThan(Number(before.recognize));
    expect(Number(after.explain)).toBe(explainBefore);
  });

  it("APPLY evidence does not collapse into PERFORM", async () => {
    const before = store.masteries.get(masteryKey(USER, CONCEPT))!;
    const performBefore = Number(before.perform);
    await writeFacetEvidence("APPLY", "SUCCESS", "study_evaluate");
    const after = store.masteries.get(masteryKey(USER, CONCEPT))!;
    expect(Number(after.apply)).toBeGreaterThan(Number(before.apply));
    expect(Number(after.perform)).toBe(performBefore);
  });

  it("RETAIN evidence does not equal RECOGNIZE bump", async () => {
    const before = store.masteries.get(masteryKey(USER, CONCEPT))!;
    const recognizeBefore = Number(before.recognize);
    await writeFacetEvidence("RETAIN", "SUCCESS", "flashcard_review");
    const after = store.masteries.get(masteryKey(USER, CONCEPT))!;
    expect(Number(after.retain)).toBeGreaterThan(Number(before.retain));
    expect(Number(after.recognize)).toBe(recognizeBefore);
  });

  it("learner projection reflects mastery after evidence (not UI completion)", async () => {
    await writeFacetEvidence("APPLY", "SUCCESS", "study_evaluate");
    const projection = await projectLearnerConceptState(USER, CONCEPT);
    expect(projection?.mastery.source).toBe("ConceptMastery");
    expect(projection?.summary.reviewCount).toBeGreaterThan(4);
  });

  it("foreign learner cannot read or drive this Concept's orch", async () => {
    const foreign = await orchestrateForConcept("other-user", CONCEPT);
    expect(foreign).toBeNull();
    const summary = await getLearnerConceptMastery("other-user", CONCEPT);
    expect(summary).toBeNull();
  });
});

describe("2G-80 Adaptive re-orchestration reads updated mastery", () => {
  beforeEach(() => {
    seedApplicationGap();
  });

  it("plan-next after APPLY evidence appends RETENTION step (not APPLICATION)", async () => {
    const started = await startAdaptiveSequenceRun({
      userId: USER,
      conceptId: CONCEPT,
    });
    expect(started.kind).toBe("started");
    if (started.kind !== "started") throw new Error("expected started");
    expect(started.run.status).toBe("ACTIVE");
    expect(started.orchestrator.diagnosis).toBe("APPLICATION_GAP");

    for (let i = 0; i < 4; i++) {
      await writeFacetEvidence("APPLY", "SUCCESS", "study_evaluate");
    }

    const { attemptId } = await writeFacetEvidence(
      "APPLY",
      "SUCCESS",
      "study_evaluate",
    );

    const plan = await recordAdaptiveSequenceCompletionAndPlanNext({
      userId: USER,
      runId: started.run.id,
      attemptId,
      stepIndex: 0,
    });

    expect(plan.kind).not.toBe("ALREADY_PROCESSED");
    if (plan.kind === "NEXT_STEP") {
      expect(plan.orchestrator.diagnosis).toBe("RETENTION_GAP");
      expect(plan.run.steps.length).toBeGreaterThan(1);
      const next = plan.run.steps[plan.run.steps.length - 1]!;
      expect(next.intervention).toBe("active-recall");
    } else if (plan.kind === "STOP_NO_INTERVENTION") {
      expect(plan.orchestrator?.diagnosis).not.toBe("APPLICATION_GAP");
    } else if (plan.kind === "STOP_IMMEDIATE_REPEAT") {
      expect(plan.orchestrator.diagnosis).toBe("RETENTION_GAP");
    } else {
      const orch = await orchestrateForConcept(USER, CONCEPT);
      expect(orch?.diagnosis).toBe("RETENTION_GAP");
    }
  });

  it("duplicate bind is idempotent and does not re-append", async () => {
    const started = await startAdaptiveSequenceRun({
      userId: USER,
      conceptId: CONCEPT,
    });
    expect(started.kind).toBe("started");
    if (started.kind !== "started") throw new Error("expected started");

    const { attemptId } = await writeFacetEvidence(
      "APPLY",
      "SUCCESS",
      "study_evaluate",
    );

    const first = await recordAdaptiveSequenceCompletionAndPlanNext({
      userId: USER,
      runId: started.run.id,
      attemptId,
      stepIndex: 0,
    });
    const second = await recordAdaptiveSequenceCompletionAndPlanNext({
      userId: USER,
      runId: started.run.id,
      attemptId,
      stepIndex: 0,
    });

    expect(second.kind).toBe("ALREADY_PROCESSED");
    if (first.kind === "NEXT_STEP" && second.kind === "ALREADY_PROCESSED") {
      expect(second.run.steps.length).toBe(first.run.steps.length);
    }
  });

  it("launch alone does not create LearningAttempt", async () => {
    const before = store.attempts.length;
    await startAdaptiveSequenceRun({
      userId: USER,
      conceptId: CONCEPT,
    });
    expect(store.attempts.length).toBe(before);
  });
});
