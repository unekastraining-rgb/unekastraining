/**
 * Bundle B Phase 13 — Deeper Learner Model integrity.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  deriveCapabilityEvidence,
  deriveInstructionalResponseHistory,
  deriveKnowledgeLoopLearnerModel,
  deriveMisconceptionEvidence,
  getConceptLearningNeed,
  getLearnerModel,
  MISCONCEPTION_MIN_INCORRECT,
} from "@/lib/learning/learner-model/knowledge-loop";
import {
  recordLearningEvidence,
  resetLearnerStateForTests,
} from "@/lib/learning/learner-state";
import "@/lib/learning/knowledge/packs";

describe("Phase 13 — Deeper Learner Model", () => {
  beforeEach(() => {
    resetLearnerStateForTests();
  });

  it("derives learner model from existing evidence", async () => {
    await recordLearningEvidence({
      userId: "u1",
      type: "lesson_exposure",
      conceptId: "java-arraylist",
      outcome: "completed",
      source: "six-lesson",
    });
    await recordLearningEvidence({
      userId: "u1",
      type: "practice_attempt",
      conceptId: "java-arraylist",
      outcome: "correct",
      source: "practice",
    });

    const model = await getLearnerModel("u1");
    expect(model.userId).toBe("u1");
    expect(model.knowledge.concepts.some((c) => c.conceptId === "java-arraylist")).toBe(
      true,
    );
    expect(model.learningHistory.recentConcepts).toContain("java-arraylist");
    expect(model.capabilityEvidence.application.length).toBeGreaterThan(0);
  });

  it("knowledge state is preserved (no mastery % authority)", async () => {
    await recordLearningEvidence({
      userId: "u1",
      type: "lesson_exposure",
      conceptId: "java-exceptions",
      outcome: "completed",
    });
    const model = await getLearnerModel("u1");
    const concept = model.knowledge.concepts.find(
      (c) => c.conceptId === "java-exceptions",
    )!;
    expect(concept.exposureCount).toBe(1);
    expect(JSON.stringify(model)).not.toMatch(/masteryPercent|masteryScore|"mastery":\s*\d/);
  });

  it("capability evidence maps Six types correctly", () => {
    const now = new Date();
    const caps = deriveCapabilityEvidence("u1", [
      {
        id: "1",
        userId: "u1",
        type: "explanation_attempt",
        conceptId: "java-arraylist",
        outcome: "incorrect",
        occurredAt: now,
      },
      {
        id: "2",
        userId: "u1",
        type: "application_attempt",
        conceptId: "java-arraylist",
        outcome: "correct",
        occurredAt: now,
      },
      {
        id: "3",
        userId: "u1",
        type: "recall_result",
        conceptId: "java-arraylist",
        outcome: "correct",
        occurredAt: now,
      },
      {
        id: "4",
        userId: "u1",
        type: "visualization_attempt",
        conceptId: "java-arraylist",
        outcome: "attempted",
        occurredAt: now,
      },
    ]);
    expect(caps.explanation).toHaveLength(1);
    expect(caps.application).toHaveLength(1);
    expect(caps.recall).toHaveLength(1);
    expect(caps.visualization).toHaveLength(1);
  });

  it("misconception signals require sufficient evidence", () => {
    const now = new Date();
    const once = deriveMisconceptionEvidence("u1", [
      {
        id: "1",
        userId: "u1",
        type: "practice_attempt",
        conceptId: "java-arraylist",
        outcome: "incorrect",
        occurredAt: now,
      },
    ]);
    expect(once).toHaveLength(0);

    const twice = deriveMisconceptionEvidence("u1", [
      {
        id: "1",
        userId: "u1",
        type: "practice_attempt",
        conceptId: "java-arraylist",
        outcome: "incorrect",
        occurredAt: now,
      },
      {
        id: "2",
        userId: "u1",
        type: "practice_attempt",
        conceptId: "java-arraylist",
        outcome: "incorrect",
        occurredAt: new Date(now.getTime() + 1000),
      },
    ]);
    expect(MISCONCEPTION_MIN_INCORRECT).toBe(2);
    expect(twice).toHaveLength(1);
    expect(twice[0].signal).toBe("repeated_incorrect_on_concept");
    expect(twice[0].signal).not.toMatch(/weak|stupid|dumb|intelligence/i);
  });

  it("instructional response history is available", () => {
    const t0 = new Date("2026-01-01T10:00:00Z");
    const history = deriveInstructionalResponseHistory("u1", [
      {
        id: "a",
        userId: "u1",
        type: "explanation_attempt",
        conceptId: "java-arraylist",
        outcome: "incorrect",
        occurredAt: t0,
        source: "detailed-explanation",
      },
      {
        id: "b",
        userId: "u1",
        type: "explanation_attempt",
        conceptId: "java-arraylist",
        outcome: "incorrect",
        occurredAt: new Date(t0.getTime() + 1000),
        metadata: { technique: "feynman" },
      },
      {
        id: "c",
        userId: "u1",
        type: "application_attempt",
        conceptId: "java-arraylist",
        outcome: "correct",
        occurredAt: new Date(t0.getTime() + 2000),
      },
    ], "java-arraylist");
    expect(history.map((h) => h.technique)).toEqual([
      "detailed-explanation",
      "feynman",
      "hands-on-practice",
    ]);
  });

  it("no duplicate evidence system — derives from Phase 4A only", () => {
    const deriveSrc = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/learner-model/knowledge-loop/derive.ts",
      ),
      "utf8",
    );
    expect(deriveSrc).toContain("LearningEvidence");
    expect(deriveSrc).not.toContain("db.learningAttempt");
    expect(deriveSrc).not.toContain("prisma");
  });

  it("learner model is user-isolated", () => {
    const model = deriveKnowledgeLoopLearnerModel({
      userId: "u1",
      concepts: [
        {
          userId: "u1",
          conceptId: "java-arraylist",
          exposureCount: 1,
          attemptCount: 0,
          correctCount: 0,
          incorrectCount: 0,
        },
        {
          userId: "u2",
          conceptId: "java-exceptions",
          exposureCount: 9,
          attemptCount: 9,
          correctCount: 9,
          incorrectCount: 0,
        },
      ],
      evidence: [
        {
          id: "1",
          userId: "u2",
          type: "practice_attempt",
          conceptId: "java-exceptions",
          outcome: "correct",
          occurredAt: new Date(),
        },
      ],
    });
    expect(model.knowledge.concepts.every((c) => c.userId === "u1")).toBe(true);
    expect(model.capabilityEvidence.application).toHaveLength(0);
    expect(model.learningHistory.recentConcepts).not.toContain("java-exceptions");
  });

  it("getConceptLearningNeed uses Orchestrator for WHAT", async () => {
    const need = await getConceptLearningNeed("u1", "java-arraylist");
    expect(need).not.toBeNull();
    expect(need!.action).toBe("teach");
    expect(need!.recommendedSix?.technique).toBeTruthy();
  });
});
