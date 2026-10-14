/**
 * 2G-76 — Full Adaptive Activity lifecycle integration.
 *
 * Exercises the real production pipeline with an in-memory persistence boundary
 * (Prisma/db only). Does not mock Orchestrator, policy, compatibility, ranking,
 * Adaptive coordinator, completion contract, bind, or plan-next.
 *
 * Path:
 * Concept + subjectDomain → orchestrateForConcept → activityIntervention →
 * Adaptive start → launch (no attempt) → coding submit → evidence →
 * bind → plan-next → re-orchestration
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createExplicitLearningIntent } from "@/lib/learning/intent/project";
import { getActivityInterventionCapability } from "@/lib/learning/orchestrator/activity-intervention-capability";
import {
  evaluateCapabilityCompatibilityForSituation,
  isCapabilityAvailableForSituation,
  selectActivityIntervention,
} from "@/lib/learning/orchestrator/activity-intervention-policy";
import { isAdaptiveReadyActivityAdapterKey } from "@/lib/learning/sequence/activity-adaptive-completion";
import {
  isActivityAdaptiveCompletionEligible,
} from "@/lib/learning/sequence/activity-adapter";
import { getActivityAdaptiveCompletionContract } from "@/lib/learning/sequence/activity-adaptive-completion";

const USER = "user-76";
const CONCEPT = "concept-76";
const SPACE = "space-76";
const TOPIC = "topic-76";
const COURSE = "course-76";
const SUBJECT_DOMAIN = "javascript programming";
const CONCEPT_TITLE = "JavaScript Functions";

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

function seedFixture(): void {
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
    title: "CS 101",
    subjectDomain: SUBJECT_DOMAIN,
    courseId: COURSE,
  });

  store.concepts.set(CONCEPT, {
    id: CONCEPT,
    userId: USER,
    learningSpaceId: SPACE,
    title: CONCEPT_TITLE,
    description: null,
    subjectDomain: SUBJECT_DOMAIN,
    difficulty: null,
    metadataJson: "{}",
  });

  store.masteries.set(masteryKey(USER, CONCEPT), {
    id: "cm-76",
    userId: USER,
    conceptId: CONCEPT,
    recognize: 0.7,
    explain: 0.65,
    apply: 0.2,
    solve: 0.1,
    perform: 0.1,
    retain: 0.5,
    confidence: 0.4,
    reviewCount: 4,
    lastReviewedAt: null,
    nextReviewAt: null,
  });

  // Seed prior quiz evidence so Orchestrator has enough events (not activity selection evidence).
  for (let i = 0; i < 3; i++) {
    store.attempts.push({
      id: `seed-attempt-${i}`,
      userId: USER,
      conceptId: CONCEPT,
      learningObjectId: `seed-lo-${i}`,
      outcome: "FAIL",
      score: 0,
      skillFacet: "RECOGNIZE",
      sourceRefJson: JSON.stringify({
        kind: "quiz_attempt",
        quizId: "seed-quiz",
        attemptId: `qa-${i}`,
      }),
      misconceptionSignalsJson: "[]",
      createdAt: new Date(Date.UTC(2026, 0, 1 + i)),
    });
  }

  store.topics.push({
    id: TOPIC,
    name: CONCEPT_TITLE,
    courseId: COURSE,
    conceptId: CONCEPT,
    masteries: [],
  });

  store.learnerProfiles.set(USER, {
    id: "lp-76",
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
          const next = { ...existing, ...update };
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
          store.attempts.filter(
            (a) =>
              a.userId === where.userId && a.conceptId === where.conceptId,
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
      count: vi.fn(async ({ where }: { where?: { userId?: string; conceptId?: string } } = {}) => {
        return store.attempts.filter((a) => {
          if (where?.userId && a.userId !== where.userId) return false;
          if (where?.conceptId && a.conceptId !== where.conceptId) return false;
          // Exclude seed quiz attempts when counting activity evidence in assertions —
          // callers use store.attempts.length / filter themselves.
          return true;
        }).length;
      }),
    },
    learningObject: {
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: { userId?: string; type?: string; payloadRefJson?: string };
        }) => {
          return (
            store.learningObjects.find((lo) => {
              if (where.userId && lo.userId !== where.userId) return false;
              if (where.type && lo.type !== where.type) return false;
              if (
                where.payloadRefJson &&
                lo.payloadRefJson !== where.payloadRefJson
              ) {
                return false;
              }
              return true;
            }) ?? null
          );
        },
      ),
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
          where: { id?: string; userId?: string; conceptId?: string; status?: string };
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
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: { conceptId?: string };
          include?: unknown;
        }) => {
          const topic = store.topics.find(
            (t) => !where.conceptId || t.conceptId === where.conceptId,
          );
          if (!topic) return null;
          return {
            ...topic,
            masteries: [],
          };
        },
      ),
    },
    missedQuestion: {
      count: vi.fn(async () => 0),
    },
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
      findUnique: vi.fn(async () => null),
    },
    retentionItem: {
      upsert: vi.fn(async () => ({ id: "ri-76" })),
      findUnique: vi.fn(async () => null),
      update: vi.fn(),
    },
    quiz: { findFirst: vi.fn(async () => null) },
    flashcard: { findFirst: vi.fn(async () => null) },
  },
}));

vi.mock("@/lib/learning/sequence/lucky-handoff", () => ({
  syncLuckyRetentionAfterSequenceComplete: vi.fn().mockResolvedValue(undefined),
}));

import { orchestrateForConcept } from "@/lib/learning/orchestrator";
import { submitCodingChallenge } from "@/lib/learning/activities/coding/service";
import {
  bindUniversalActivityAttemptToAdaptiveSequence,
} from "@/lib/learning/sequence/activity-adapter";
import { loadAdaptiveRunPageView } from "@/lib/learning/sequence/adaptive-run-page";
import {
  getAdaptiveSequenceRun,
  startAdaptiveSequenceRun,
} from "@/lib/learning/sequence";

const practiceOptions = {
  intent: createExplicitLearningIntent({ purpose: "PRACTICE" }),
  courseId: COURSE,
  topicId: TOPIC,
  topicName: CONCEPT_TITLE,
};

function activityAttemptCount(): number {
  return store.attempts.filter((a) => {
    try {
      const ref = JSON.parse(String(a.sourceRefJson)) as { kind?: string };
      return ref.kind === "coding_challenge_submit";
    } catch {
      return false;
    }
  }).length;
}

describe("2G-76 Adaptive Activity full lifecycle integration", () => {
  beforeEach(() => {
    seedFixture();
    vi.clearAllMocks();
  });

  it("Concept subjectDomain → orchestrate → Adaptive coding step → launch≠attempt → submit → bind → plan-next", async () => {
    // ——— PHASE 1: baseline diagnosis ———
    const orch1 = await orchestrateForConcept(USER, CONCEPT, practiceOptions);
    expect(orch1).not.toBeNull();
    if (!orch1) throw new Error("expected orchestrator result");

    expect(orch1.diagnosis).toBe("APPLICATION_GAP");
    expect(orch1.intervention?.kind).toBe("six");
    expect(orch1.activityIntervention?.adapterKey).toBe("coding");
    expect(orch1.activityIntervention?.kind).toBe("activity");
    expect(isAdaptiveReadyActivityAdapterKey("coding")).toBe(true);

    // subjectDomain loaded from Concept (authoritative), used for selection — not diagnosis output
    const conceptRow = store.concepts.get(CONCEPT)!;
    expect(conceptRow.subjectDomain).toBe(SUBJECT_DOMAIN);

    const diagnosisBefore = orch1.diagnosis;
    const facetsBefore = { ...orch1.signals.facets };

    // Determinism: same inputs → same activity intervention
    const orch1b = await orchestrateForConcept(USER, CONCEPT, practiceOptions);
    expect(orch1b?.activityIntervention?.adapterKey).toBe(
      orch1.activityIntervention?.adapterKey,
    );
    expect(orch1b?.diagnosis).toBe(diagnosisBefore);

    // ——— Diagnosis integrity: change ONLY availability ———
    const codingCap = getActivityInterventionCapability("coding")!;
    const prevBind = codingCap.adaptiveBindIntegrated;
    (codingCap as { adaptiveBindIntegrated: boolean }).adaptiveBindIntegrated =
      false;
    try {
      const orchUnavailable = await orchestrateForConcept(
        USER,
        CONCEPT,
        practiceOptions,
      );
      expect(orchUnavailable?.diagnosis).toBe(diagnosisBefore);
      expect(orchUnavailable?.signals.facets).toEqual(facetsBefore);
      expect(orchUnavailable?.activityIntervention).toBeUndefined();
      expect(orchUnavailable?.intervention?.kind).toBe("six");
    } finally {
      (codingCap as { adaptiveBindIntegrated: boolean }).adaptiveBindIntegrated =
        prevBind;
    }

    // Restore availability — selection returns
    const orchRestored = await orchestrateForConcept(
      USER,
      CONCEPT,
      practiceOptions,
    );
    expect(orchRestored?.diagnosis).toBe(diagnosisBefore);
    expect(orchRestored?.activityIntervention?.adapterKey).toBe("coding");

    // ——— PHASE 2: start Adaptive run (real coordinator) ———
    const started = await startAdaptiveSequenceRun({
      userId: USER,
      conceptId: CONCEPT,
      options: practiceOptions,
    });
    expect(started.kind).toBe("started");
    if (started.kind !== "started") throw new Error("expected started");

    expect(started.currentStep.intervention).toBe("coding");
    expect(started.currentStep.learningObjectId).toBeNull();
    expect(started.run.status).toBe("ACTIVE");
    expect(started.run.steps).toHaveLength(1);
    expect(started.run.steps[0]?.intervention).toBe("coding");

    const runId = started.run.id;
    const attemptsBeforeLaunch = store.attempts.length;
    const codingAttemptsBeforeLaunch = activityAttemptCount();

    // ——— PHASE 3: launch via Adaptive run page (no LearningAttempt) ———
    const page = await loadAdaptiveRunPageView(USER, runId);
    expect(page.kind).toBe("active");
    if (page.kind !== "active") throw new Error("expected active page");
    expect(page.activityTitle).toBe("Coding practice");
    expect(page.sixHref).toContain("/study/activities/coding");
    expect(page.sixHref).toContain(`conceptId=${CONCEPT}`);
    expect(page.sixHref).toContain(`adaptiveRunId=${runId}`);
    expect(page.sixHref).toContain("adaptiveStep=0");
    expect(page.sixHref?.toLowerCase()).not.toContain("adapterkey=");

    expect(store.attempts.length).toBe(attemptsBeforeLaunch);
    expect(activityAttemptCount()).toBe(codingAttemptsBeforeLaunch);

    // ——— PHASE 4: learner submission via real coding evidence bridge ———
    const submit = await submitCodingChallenge({
      learnerId: USER,
      conceptId: CONCEPT,
      challengeId: "js-sum-two",
      clientBody: {
        code: "function add(a, b) { return a + b; }",
        outcome: "FAIL",
        score: 0,
        learnerId: "forged-attacker",
        adaptiveRunId: runId,
        adaptiveStepIndex: 0,
      },
    });
    expect(submit.ok).toBe(true);
    if (!submit.ok) throw new Error("expected submit ok");
    expect(submit.rejectedForgeryKeys).toEqual(
      expect.arrayContaining(["outcome", "score", "learnerId"]),
    );
    expect(activityAttemptCount()).toBe(codingAttemptsBeforeLaunch + 1);

    const attemptId = submit.completion.learningAttemptId;
    const attemptRow = store.attempts.find((a) => a.id === attemptId);
    expect(attemptRow).toBeTruthy();
    expect(attemptRow?.userId).toBe(USER);
    expect(attemptRow?.conceptId).toBe(CONCEPT);
    expect(attemptRow?.skillFacet).toBe("PERFORM");
    const sourceRef = JSON.parse(String(attemptRow?.sourceRefJson)) as {
      kind: string;
    };
    expect(sourceRef.kind).toBe("coding_challenge_submit");

    const contract = getActivityAdaptiveCompletionContract("coding")!;
    const eligibility = isActivityAdaptiveCompletionEligible({
      contract,
      attempt: {
        userId: String(attemptRow!.userId),
        conceptId: String(attemptRow!.conceptId),
        skillFacet: String(attemptRow!.skillFacet),
        outcome: String(attemptRow!.outcome),
        sourceRefJson: String(attemptRow!.sourceRefJson),
      },
      expectedLearnerId: USER,
      expectedConceptId: CONCEPT,
    });
    expect(eligibility.eligible).toBe(true);

    // ——— PHASE 5–6: bind + plan-next (real production path) ———
    const bound = await bindUniversalActivityAttemptToAdaptiveSequence({
      userId: USER,
      runId,
      attemptId,
      stepIndex: 0,
    });
    expect(bound.kind).toBe("bound");
    if (bound.kind !== "bound") throw new Error("expected bound");

    const runAfter = await getAdaptiveSequenceRun(USER, runId);
    expect(runAfter).not.toBeNull();
    expect(runAfter!.lastAttemptId).toBe(attemptId);
    expect(runAfter!.currentStepIndex).toBeGreaterThanOrEqual(1);
    expect(
      runAfter!.interventionHistory.some((h) => h.attemptId === attemptId),
    ).toBe(true);

    // Re-orchestration came from Orchestrator (plan result), not activity-chosen diagnosis
    expect(bound.plan.kind).toMatch(
      /NEXT_STEP|STOP_NO_INTERVENTION|STOP_IMMEDIATE_REPEAT|STOP_MAX_STEPS|ALREADY_PROCESSED/,
    );
    if (bound.plan.kind === "NEXT_STEP") {
      expect(bound.plan.orchestrator.diagnosis).toBeTruthy();
      expect(bound.plan.currentStep.intervention).toBeTruthy();
      // Next step comes from Orchestrator mapping, not a hard-coded activity choice
      expect(bound.plan.orchestrator.learnerId).toBe(USER);
    }
    if (bound.plan.kind === "STOP_NO_INTERVENTION") {
      expect(bound.plan.orchestrator === null || bound.plan.orchestrator.diagnosis).toBeTruthy();
    }
    if (bound.plan.kind === "STOP_IMMEDIATE_REPEAT") {
      expect(bound.plan.orchestrator.diagnosis).toBeTruthy();
    }

    // Idempotent: same attempt cannot double-progress
    const boundAgain = await bindUniversalActivityAttemptToAdaptiveSequence({
      userId: USER,
      runId,
      attemptId,
      stepIndex: 0,
    });
    // Soft path may return bound with ALREADY_PROCESSED plan, or skipped depending on step
    if (boundAgain.kind === "bound") {
      expect(boundAgain.plan.kind).toBe("ALREADY_PROCESSED");
    }

    const runFinal = await getAdaptiveSequenceRun(USER, runId);
    const codingHistory = runFinal!.interventionHistory.filter(
      (h) => h.attemptId === attemptId,
    );
    expect(codingHistory).toHaveLength(1);
  });

  it("MATCH + availability failure → no activity selection; SIX remains; diagnosis unchanged", async () => {
    const orchBefore = await orchestrateForConcept(USER, CONCEPT, practiceOptions);
    expect(orchBefore?.diagnosis).toBe("APPLICATION_GAP");
    expect(orchBefore?.activityIntervention?.adapterKey).toBe("coding");

    const coding = getActivityInterventionCapability("coding")!;
    const compat = evaluateCapabilityCompatibilityForSituation(coding, {
      diagnosis: "APPLICATION_GAP",
      conceptId: CONCEPT,
      conceptTitle: CONCEPT_TITLE,
      subjectDomain: SUBJECT_DOMAIN,
      intentPurpose: "PRACTICE",
    });
    expect(compat.status).toBe("MATCH");

    const prev = coding.adaptiveBindIntegrated;
    (coding as { adaptiveBindIntegrated: boolean }).adaptiveBindIntegrated =
      false;
    try {
      expect(
        isCapabilityAvailableForSituation(coding, {
          diagnosis: "APPLICATION_GAP",
          conceptId: CONCEPT,
          conceptTitle: CONCEPT_TITLE,
          subjectDomain: SUBJECT_DOMAIN,
          intentPurpose: "PRACTICE",
        }),
      ).toBe(false);

      expect(
        selectActivityIntervention({
          diagnosis: "APPLICATION_GAP",
          conceptId: CONCEPT,
          conceptTitle: CONCEPT_TITLE,
          subjectDomain: SUBJECT_DOMAIN,
          intentPurpose: "PRACTICE",
        }),
      ).toBeNull();

      const orch = await orchestrateForConcept(USER, CONCEPT, practiceOptions);
      expect(orch?.diagnosis).toBe("APPLICATION_GAP");
      expect(orch?.activityIntervention).toBeUndefined();
      expect(orch?.intervention?.kind).toBe("six");

      // No Adaptive activity step from unavailable coding
      const started = await startAdaptiveSequenceRun({
        userId: USER,
        conceptId: CONCEPT,
        options: practiceOptions,
      });
      expect(started.kind).toBe("started");
      if (started.kind !== "started") throw new Error("expected started");
      expect(started.currentStep.intervention).not.toBe("coding");
      expect(started.currentStep.intervention).toBe(
        orch?.intervention?.sixComponent,
      );
    } finally {
      (coding as { adaptiveBindIntegrated: boolean }).adaptiveBindIntegrated =
        prev;
    }
  });

  it("same inputs → same selected activityIntervention (determinism)", async () => {
    const a = await orchestrateForConcept(USER, CONCEPT, practiceOptions);
    const b = await orchestrateForConcept(USER, CONCEPT, practiceOptions);
    expect(a?.activityIntervention?.adapterKey).toBe("coding");
    expect(b?.activityIntervention?.adapterKey).toBe(
      a?.activityIntervention?.adapterKey,
    );
    expect(a?.diagnosis).toBe(b?.diagnosis);
  });

  it("SIX fallback when activityIntervention absent still starts Adaptive run", async () => {
    // No PRACTICE intent → no activityIntervention; SIX still starts
    const orch = await orchestrateForConcept(USER, CONCEPT, {
      courseId: COURSE,
      topicId: TOPIC,
      topicName: CONCEPT_TITLE,
    });
    expect(orch?.diagnosis).toBe("APPLICATION_GAP");
    expect(orch?.activityIntervention).toBeUndefined();
    expect(orch?.intervention?.kind).toBe("six");

    const started = await startAdaptiveSequenceRun({
      userId: USER,
      conceptId: CONCEPT,
      options: {
        courseId: COURSE,
        topicId: TOPIC,
        topicName: CONCEPT_TITLE,
      },
    });
    expect(started.kind).toBe("started");
    if (started.kind !== "started") throw new Error("expected started");
    expect(started.currentStep.intervention).toBe(
      orch!.intervention!.sixComponent,
    );
    expect(isAdaptiveReadyActivityAdapterKey(started.currentStep.intervention)).toBe(
      false,
    );
  });
});

describe("2G-77 compatibility hardening on Adaptive lifecycle path", () => {
  beforeEach(() => {
    seedFixture();
    vi.clearAllMocks();
  });

  it("computer science must not falsely select Lab; Coding remains; diagnosis intact", async () => {
    const concept = store.concepts.get(CONCEPT)!;
    concept.subjectDomain = "computer science";
    const space = store.learningSpaces.get(SPACE)!;
    space.subjectDomain = "computer science";

    const orch = await orchestrateForConcept(USER, CONCEPT, practiceOptions);
    expect(orch?.diagnosis).toBe("APPLICATION_GAP");
    expect(orch?.activityIntervention?.adapterKey).toBe("coding");
    expect(orch?.activityIntervention?.adapterKey).not.toBe("lab");
    expect(orch?.intervention?.kind).toBe("six");

    const again = await orchestrateForConcept(USER, CONCEPT, practiceOptions);
    expect(again?.diagnosis).toBe(orch?.diagnosis);
    expect(again?.activityIntervention?.adapterKey).toBe("coding");

    const started = await startAdaptiveSequenceRun({
      userId: USER,
      conceptId: CONCEPT,
      options: practiceOptions,
    });
    expect(started.kind).toBe("started");
    if (started.kind !== "started") throw new Error("expected started");
    expect(started.currentStep.intervention).toBe("coding");
  });

  it("changing only subjectDomain compatibility does not change diagnosis", async () => {
    const codingDomain = await orchestrateForConcept(USER, CONCEPT, practiceOptions);
    expect(codingDomain?.diagnosis).toBe("APPLICATION_GAP");

    const concept = store.concepts.get(CONCEPT)!;
    concept.subjectDomain = "medieval history";
    store.learningSpaces.get(SPACE)!.subjectDomain = "medieval history";

    const unrecognized = await orchestrateForConcept(USER, CONCEPT, practiceOptions);
    expect(unrecognized?.diagnosis).toBe("APPLICATION_GAP");
    expect(unrecognized?.diagnosis).toBe(codingDomain?.diagnosis);
    expect(unrecognized?.activityIntervention).toBeUndefined();
    expect(unrecognized?.intervention?.kind).toBe("six");
  });
});
