/**
 * Phase 4A — Learner State Foundation integrity tests.
 *
 * Proves Learning Evidence → Learner Concept State with Knowledge Library IDs.
 * Does not test Orchestrator / adaptive teaching / Lucky rewrite.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import "@/lib/learning/knowledge/packs";
import {
  createLearnerStateService,
  createMemoryLearnerStateStore,
  emptyLearnerConceptState,
  evidenceTypeFromEvaluate,
  findKnowledgeConceptById,
  getLearnerConceptState,
  getLearnerState,
  isRegisteredKnowledgeConceptId,
  recordEvaluateKnowledgeEvidence,
  recordLearningEvidence,
  recordLessonExposuresForTarget,
  resetLearnerStateForTests,
  resolveEvidenceConceptIds,
  resolveEvidenceConceptsForTopic,
} from "@/lib/learning/learner-state";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 4A — Learner State Foundation", () => {
  beforeEach(() => {
    resetLearnerStateForTests();
  });

  it("A — empty learner has no concept state", async () => {
    const state = await getLearnerState("user-a");
    expect(state.concepts).toEqual([]);
    expect(await getLearnerConceptState("user-a", "java-arraylist")).toBeNull();
  });

  it("B — lesson exposure produces exposureCount = 1", async () => {
    const result = await recordLearningEvidence({
      userId: "user-a",
      type: "lesson_exposure",
      conceptId: "java-arraylist",
      outcome: "completed",
      source: "test",
    });
    expect(result.recorded).toBe(true);
    if (!result.recorded) return;
    expect(result.conceptState?.exposureCount).toBe(1);
    expect(result.conceptState?.attemptCount).toBe(0);
  });

  it("C — multiple exposures produce deterministic counts", async () => {
    await recordLearningEvidence({
      userId: "user-a",
      type: "lesson_exposure",
      conceptId: "java-arraylist",
      outcome: "completed",
    });
    await recordLearningEvidence({
      userId: "user-a",
      type: "lesson_exposure",
      conceptId: "java-arraylist",
      outcome: "completed",
    });
    await recordLearningEvidence({
      userId: "user-a",
      type: "lesson_exposure",
      conceptId: "java-arraylist",
      outcome: "completed",
    });
    const state = await getLearnerConceptState("user-a", "java-arraylist");
    expect(state?.exposureCount).toBe(3);
  });

  it("D — correct practice increments attemptCount and correctCount", async () => {
    await recordLearningEvidence({
      userId: "user-a",
      type: "practice_attempt",
      conceptId: "java-arraylist",
      outcome: "correct",
    });
    const state = await getLearnerConceptState("user-a", "java-arraylist");
    expect(state?.attemptCount).toBe(1);
    expect(state?.correctCount).toBe(1);
    expect(state?.incorrectCount).toBe(0);
  });

  it("E — incorrect practice increments attemptCount and incorrectCount", async () => {
    await recordLearningEvidence({
      userId: "user-a",
      type: "practice_attempt",
      conceptId: "java-arraylist",
      outcome: "incorrect",
    });
    const state = await getLearnerConceptState("user-a", "java-arraylist");
    expect(state?.attemptCount).toBe(1);
    expect(state?.correctCount).toBe(0);
    expect(state?.incorrectCount).toBe(1);
  });

  it("F — mixed results accumulate correctly", async () => {
    for (const outcome of ["correct", "incorrect", "correct"] as const) {
      await recordLearningEvidence({
        userId: "user-a",
        type: "practice_attempt",
        conceptId: "java-arraylist",
        outcome,
      });
    }
    const state = await getLearnerConceptState("user-a", "java-arraylist");
    expect(state?.attemptCount).toBe(3);
    expect(state?.correctCount).toBe(2);
    expect(state?.incorrectCount).toBe(1);
  });

  it("G — lastSeenAt updates correctly", async () => {
    const t1 = new Date("2026-01-01T10:00:00Z");
    const t2 = new Date("2026-01-02T10:00:00Z");
    await recordLearningEvidence({
      userId: "user-a",
      type: "lesson_exposure",
      conceptId: "java-arraylist",
      outcome: "completed",
      occurredAt: t1,
    });
    await recordLearningEvidence({
      userId: "user-a",
      type: "check_attempt",
      conceptId: "java-arraylist",
      outcome: "correct",
      occurredAt: t2,
    });
    const state = await getLearnerConceptState("user-a", "java-arraylist");
    expect(state?.lastSeenAt?.toISOString()).toBe(t2.toISOString());
    expect(state?.lastOutcome).toBe("correct");
  });

  it("H — ArrayList in Java maps to java-arraylist (not whole Java pack)", () => {
    const refs = resolveEvidenceConceptIds("ArrayList in Java");
    expect(refs.map((r) => r.conceptId)).toEqual(["java-arraylist"]);
    expect(refs.every((r) => r.conceptId !== "java-fundamentals")).toBe(true);
    expect(findKnowledgeConceptById("java-arraylist")?.conceptId).toBe(
      "java-arraylist",
    );
  });

  it("I — Python fundamentals path maps to expanded registered concepts", async () => {
    const refs = resolveEvidenceConceptIds("Python Programming Fundamentals");
    expect(refs.map((r) => r.conceptId)).toEqual([
      "python-variables",
      "python-conditionals",
      "python-loops",
      "python-functions",
      "python-lists",
      "python-dictionaries",
      "python-exceptions",
    ]);
    const results = await recordLessonExposuresForTarget({
      userId: "user-a",
      target: "Python Programming Fundamentals",
    });
    expect(results).toHaveLength(7);
    for (const id of [
      "python-variables",
      "python-conditionals",
      "python-loops",
      "python-functions",
      "python-lists",
      "python-dictionaries",
      "python-exceptions",
    ]) {
      const s = await getLearnerConceptState("user-a", id);
      expect(s?.exposureCount).toBe(1);
    }
  });

  it("J — unknown topic does not create a fake concept ID", async () => {
    expect(resolveEvidenceConceptIds("Quantum Underwater Basket Weaving")).toEqual(
      [],
    );
    expect(resolveEvidenceConceptsForTopic("Totally Unknown Topic XYZ")).toEqual(
      [],
    );
    expect(isRegisteredKnowledgeConceptId("fake-made-up-concept")).toBe(false);

    const rejected = await recordLearningEvidence({
      userId: "user-a",
      type: "lesson_exposure",
      conceptId: "fake-made-up-concept",
      outcome: "completed",
    });
    expect(rejected.recorded).toBe(false);
    if (rejected.recorded) return;
    expect(rejected.reason).toBe("unknown_concept_id");

    const evalResults = await recordEvaluateKnowledgeEvidence({
      userId: "user-a",
      topic: "Totally Unknown Topic XYZ",
      mode: "teach-me",
      scoreRatio: 0.9,
    });
    expect(evalResults).toEqual([]);
    expect((await getLearnerState("user-a")).concepts).toEqual([]);
  });

  it("K — learner isolation (User A vs User B)", async () => {
    await recordLearningEvidence({
      userId: "user-a",
      type: "practice_attempt",
      conceptId: "java-arraylist",
      outcome: "correct",
    });
    expect(await getLearnerConceptState("user-b", "java-arraylist")).toBeNull();
    expect((await getLearnerState("user-b")).concepts).toEqual([]);
    expect(
      (await getLearnerConceptState("user-a", "java-arraylist"))?.correctCount,
    ).toBe(1);
  });

  it("L — cross-domain isolation (Stocks vs Java/Python/Economics)", async () => {
    await recordLearningEvidence({
      userId: "user-a",
      type: "practice_attempt",
      conceptId: "stocks-market-cap",
      outcome: "correct",
    });
    expect(await getLearnerConceptState("user-a", "java-arraylist")).toBeNull();
    expect(await getLearnerConceptState("user-a", "python-variables")).toBeNull();
    expect(
      await getLearnerConceptState("user-a", "economics-supply-demand"),
    ).toBeNull();
    expect(
      (await getLearnerConceptState("user-a", "stocks-market-cap"))?.correctCount,
    ).toBe(1);
  });

  it("M — duplicate eventKey does not double-count", async () => {
    const first = await recordLearningEvidence({
      userId: "user-a",
      type: "check_attempt",
      conceptId: "java-arraylist",
      outcome: "correct",
      eventKey: "eval:abc:java-arraylist",
    });
    const second = await recordLearningEvidence({
      userId: "user-a",
      type: "check_attempt",
      conceptId: "java-arraylist",
      outcome: "correct",
      eventKey: "eval:abc:java-arraylist",
    });
    expect(first.recorded && !first.duplicate).toBe(true);
    expect(second.recorded && second.duplicate).toBe(true);
    const state = await getLearnerConceptState("user-a", "java-arraylist");
    expect(state?.attemptCount).toBe(1);
    expect(state?.correctCount).toBe(1);
  });

  it("N — existing Learn wiring observes evidence without Orchestrator/UI rewrite", () => {
    const six = read("app/api/study/six-lesson/route.ts");
    const evaluate = read("app/api/study/evaluate/route.ts");
    const luckyReview = read("src/lib/learning/retention/review.ts");
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");

    expect(six).toContain("recordLessonExposuresFromTeachingContext");
    expect(six).toContain("observeLessonExposure");
    expect(evaluate).toContain("recordEvaluateKnowledgeEvidence");

    // Lucky scheduling untouched — still uses its own retention path.
    expect(luckyReview).toContain("recordEvidence");
    expect(luckyReview).not.toContain("recordEvaluateKnowledgeEvidence");
    expect(luckyReview).not.toContain("KnowledgeConceptState");

    // Learn UI may consume orchestration destinations (Phase 5) but must not
    // write evidence or reproduce decision rules locally.
    expect(teach).not.toContain("recordLearningEvidence");
    expect(teach).not.toContain("decideKnowledgeLoop");
    expect(six).not.toMatch(/if\s*\(.*weak.*\)\s*reteach|invented.?mastery/i);
  });

  it("evaluate adapter maps modes to evidence types", () => {
    expect(
      evidenceTypeFromEvaluate({ mode: "teach-me" }),
    ).toBe("check_attempt");
    expect(
      evidenceTypeFromEvaluate({
        mode: "six",
        sixComponent: "hands-on-practice",
      }),
    ).toBe("application_attempt");
    expect(
      evidenceTypeFromEvaluate({
        mode: "six",
        sixComponent: "detailed-explanation",
      }),
    ).toBe("explanation_attempt");
    expect(
      evidenceTypeFromEvaluate({
        mode: "six",
        sixComponent: "feynman",
      }),
    ).toBe("explanation_attempt");
    expect(
      evidenceTypeFromEvaluate({
        mode: "six",
        sixComponent: "visualization",
      }),
    ).toBe("visualization_attempt");
    expect(
      evidenceTypeFromEvaluate({
        mode: "six",
        sixComponent: "active_recall",
      }),
    ).toBe("recall_result");
    expect(evidenceTypeFromEvaluate({ mode: "blurting" })).toBe("recall_result");
  });

  it("emptyLearnerConceptState starts at zeros", () => {
    expect(emptyLearnerConceptState("u", "java-arraylist")).toEqual({
      userId: "u",
      conceptId: "java-arraylist",
      exposureCount: 0,
      attemptCount: 0,
      correctCount: 0,
      incorrectCount: 0,
    });
  });

  it("service isolation across memory stores", async () => {
    const storeA = createMemoryLearnerStateStore();
    const storeB = createMemoryLearnerStateStore();
    const svcA = createLearnerStateService(storeA);
    const svcB = createLearnerStateService(storeB);
    await svcA.recordLearningEvidence({
      userId: "u",
      type: "lesson_exposure",
      conceptId: "java-arraylist",
      outcome: "completed",
    });
    expect(await svcB.getLearnerConceptState("u", "java-arraylist")).toBeNull();
  });

  it("Prisma schema adds KnowledgeConceptEvidence / KnowledgeConceptState", () => {
    const schema = read("prisma/schema.prisma");
    expect(schema).toContain("model KnowledgeConceptEvidence");
    expect(schema).toContain("model KnowledgeConceptState");
    expect(schema).toContain("knowledgeConceptEvidence");
    // Still separate from ULE ConceptMastery.
    expect(schema).toContain("model ConceptMastery");
    expect(schema).toContain("model LearningAttempt");
  });
});
