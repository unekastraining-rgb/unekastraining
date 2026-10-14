/**
 * Phase 5 — Adaptive Learning Loop integrity suite.
 * Proves decision → action → evidence → state → next decision.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { buildSubjectAwareFallbackLesson } from "@/lib/csl/six-worked-lesson";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import {
  getLearnerConceptState,
  listEvidence,
  recordLearningEvidence,
  recordEvaluateKnowledgeEvidence,
  resetLearnerStateForTests,
} from "@/lib/learning/learner-state";
import {
  decideKnowledgeLoop,
  executeKnowledgeLearningAction,
  resolveKnowledgeLoopDecision,
} from "@/lib/learning/orchestrator/knowledge-loop";
import { maybeRecordLuckyKnowledgeRecall } from "@/lib/learning/orchestrator/knowledge-loop/lucky-bridge";
import { applyPersonalizationToLibraryLesson } from "@/lib/learning/personalized-teaching";
import { buildPersonalizedTeachingContext } from "@/lib/learning/personalized-teaching";
import type {
  LearningEvidence,
  LearnerConceptState,
} from "@/lib/learning/learner-state/types";
import type { KnowledgeOrchestratorInput } from "@/lib/learning/orchestrator/knowledge-loop";
import "@/lib/learning/knowledge/packs";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

function emptyState(
  conceptId: string,
  partial?: Partial<LearnerConceptState>,
): LearnerConceptState {
  return {
    userId: "u",
    conceptId,
    exposureCount: 0,
    attemptCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    ...partial,
  };
}

function inputFor(
  target: string,
  states: Record<string, LearnerConceptState | null>,
  evidence: LearningEvidence[] = [],
): KnowledgeOrchestratorInput {
  return {
    target,
    knowledge: resolveTeachingKnowledgeContext(target),
    statesByConceptId: new Map(Object.entries(states)),
    evidence,
  };
}

function ev(
  partial: Partial<LearningEvidence> &
    Pick<LearningEvidence, "type" | "conceptId">,
): LearningEvidence {
  return {
    id: `e-${Math.random().toString(36).slice(2)}`,
    userId: "u",
    type: partial.type,
    conceptId: partial.conceptId,
    outcome: partial.outcome,
    occurredAt: new Date(),
    source: "test",
  };
}

describe("Phase 5 — Adaptive Learning Loop", () => {
  beforeEach(() => {
    resetLearnerStateForTests();
  });

  it("A — new learner → teach", () => {
    expect(
      decideKnowledgeLoop(inputFor("ArrayList in Java", {})).action,
    ).toBe("teach");
  });

  it("B — exposed → practice", () => {
    expect(
      decideKnowledgeLoop(
        inputFor("ArrayList in Java", {
          "java-arraylist": emptyState("java-arraylist", { exposureCount: 1 }),
        }),
      ).action,
    ).toBe("practice");
  });

  it("C — incorrect → reteach", () => {
    expect(
      decideKnowledgeLoop(
        inputFor("ArrayList in Java", {
          "java-arraylist": emptyState("java-arraylist", {
            exposureCount: 1,
            attemptCount: 1,
            incorrectCount: 1,
            lastOutcome: "incorrect",
          }),
        }),
      ).action,
    ).toBe("reteach");
  });

  it("D — reteach personalization reaches Phase 4B", () => {
    const knowledge = resolveTeachingKnowledgeContext("ArrayList in Java")!;
    const personalized = buildPersonalizedTeachingContext({
      knowledge,
      statesByConceptId: new Map([
        [
          "java-arraylist",
          emptyState("java-arraylist", {
            exposureCount: 1,
            attemptCount: 1,
            incorrectCount: 1,
            lastOutcome: "incorrect",
          }),
        ],
      ]),
    });
    const base = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "ArrayList in Java",
    )!;
    const reteach = applyPersonalizationToLibraryLesson(base, personalized, {
      reteachEmphasis: true,
    });
    expect(reteach.learningFrame.toLowerCase()).toMatch(
      /misconception|contrast/,
    );
    expect(JSON.stringify(reteach)).not.toMatch(/you are weak|mastery is/i);
  });

  it("E — practiced without recall → recall", () => {
    expect(
      decideKnowledgeLoop(
        inputFor(
          "ArrayList in Java",
          {
            "java-arraylist": emptyState("java-arraylist", {
              exposureCount: 1,
              attemptCount: 1,
              correctCount: 1,
              lastOutcome: "correct",
            }),
          },
          [ev({ type: "practice_attempt", conceptId: "java-arraylist" })],
        ),
      ).action,
    ).toBe("recall");
  });

  it("F — ready → advance (path) / complete (single)", () => {
    const ready = emptyState("java-arraylist", {
      exposureCount: 1,
      attemptCount: 1,
      correctCount: 1,
      lastOutcome: "correct",
    });
    const single = decideKnowledgeLoop(
      inputFor(
        "ArrayList in Java",
        { "java-arraylist": ready },
        [
          ev({ type: "practice_attempt", conceptId: "java-arraylist" }),
          ev({ type: "recall_result", conceptId: "java-arraylist" }),
        ],
      ),
    );
    expect(single.action).toBe("complete");

    const pathReady = decideKnowledgeLoop(
      inputFor(
        "Python Programming Fundamentals",
        {
          "python-variables": emptyState("python-variables", {
            exposureCount: 1,
            attemptCount: 1,
            correctCount: 1,
            lastOutcome: "correct",
          }),
        },
        [
          ev({ type: "practice_attempt", conceptId: "python-variables" }),
          ev({ type: "recall_result", conceptId: "python-variables" }),
        ],
      ),
    );
    expect(pathReady.action).toBe("advance");
    expect(pathReady.nextConceptId).toBe("python-conditionals");
  });

  it("G — final concept → complete", () => {
    const d = decideKnowledgeLoop(
      inputFor(
        "ArrayList in Java",
        {
          "java-arraylist": emptyState("java-arraylist", {
            exposureCount: 2,
            attemptCount: 2,
            correctCount: 2,
            lastOutcome: "correct",
          }),
        },
        [
          ev({ type: "practice_attempt", conceptId: "java-arraylist" }),
          ev({ type: "recall_result", conceptId: "java-arraylist" }),
        ],
      ),
    );
    expect(d.action).toBe("complete");
    expect(d.nextConceptId ?? null).toBeNull();
  });

  it("H — Python path uses registered concepts only", () => {
    const d = decideKnowledgeLoop(
      inputFor(
        "Python Programming Fundamentals",
        {
          "python-variables": emptyState("python-variables", {
            exposureCount: 1,
            attemptCount: 1,
            correctCount: 1,
            lastOutcome: "correct",
          }),
          "python-conditionals": emptyState("python-conditionals", {
            exposureCount: 1,
            attemptCount: 1,
            correctCount: 1,
            lastOutcome: "correct",
          }),
        },
        [
          ev({ type: "practice_attempt", conceptId: "python-variables" }),
          ev({ type: "recall_result", conceptId: "python-variables" }),
          ev({ type: "practice_attempt", conceptId: "python-conditionals" }),
          ev({ type: "recall_result", conceptId: "python-conditionals" }),
        ],
      ),
    );
    expect(d.action).toBe("advance");
    expect(d.nextConceptId).toBe("python-loops");
    expect(d.nextConceptId).not.toMatch(/python-advanced|python-next|step-2/);
  });

  it("I — Java isolation from Python", () => {
    const d = decideKnowledgeLoop(
      inputFor("ArrayList in Java", {
        "java-arraylist": emptyState("java-arraylist", { exposureCount: 1 }),
      }),
    );
    expect(d.conceptId).toBe("java-arraylist");
    expect(d.nextConceptId ?? null).toBeNull();
    expect(JSON.stringify(d)).not.toContain("python-");
  });

  it("J — Stocks isolation", () => {
    const d = decideKnowledgeLoop(
      inputFor("market capitalization", {
        "stocks-market-cap": null,
      }),
    );
    expect(d.conceptId === "stocks-market-cap" || d.action === "teach").toBe(
      true,
    );
    expect(JSON.stringify(d)).not.toMatch(/java-|python-|mortgage/);
  });

  it("K — unknown target honest", () => {
    const d = decideKnowledgeLoop(inputFor("quantum gardening", {}));
    expect(d.reasonCode).toBe("unknown-target");
    expect(d.conceptId).toBeNull();
  });

  it("L — OOD specialized unchanged", () => {
    const lesson = buildSubjectAwareFallbackLesson(
      "chunking",
      "Classes and Objects",
    );
    expect(JSON.stringify(lesson!.chunks).toLowerCase()).toMatch(/dealership/);
  });

  it("M — recall routes through Lucky destination", () => {
    const d = decideKnowledgeLoop(
      inputFor(
        "ArrayList in Java",
        {
          "java-arraylist": emptyState("java-arraylist", {
            exposureCount: 1,
            attemptCount: 1,
            correctCount: 1,
            lastOutcome: "correct",
          }),
        },
        [ev({ type: "practice_attempt", conceptId: "java-arraylist" })],
      ),
    );
    const exec = executeKnowledgeLearningAction(d, {
      topic: "ArrayList in Java",
    });
    expect(exec.destination.kind).toBe("remember");
    expect(exec.destination.href).toContain("/study/lucky");
    expect(read("src/lib/learning/retention/review.ts")).toContain(
      "maybeRecordLuckyKnowledgeRecall",
    );
    expect(read("src/lib/learning/retention/schedule.ts")).not.toContain(
      "decideKnowledgeLoop",
    );
  });

  it("N — practice evidence via evaluate adapter", async () => {
    await recordEvaluateKnowledgeEvidence({
      userId: "u",
      topic: "ArrayList in Java",
      mode: "six",
      sixComponent: "hands-on-practice",
      scoreRatio: 0.9,
      eventKey: "prac-1",
    });
    const s = await getLearnerConceptState("u", "java-arraylist");
    expect(s?.correctCount).toBe(1);
    expect(s?.attemptCount).toBe(1);
  });

  it("O — check evidence via teach-me evaluate", async () => {
    await recordEvaluateKnowledgeEvidence({
      userId: "u",
      topic: "ArrayList in Java",
      mode: "teach-me",
      scoreRatio: 0.2,
      eventKey: "check-1",
    });
    const s = await getLearnerConceptState("u", "java-arraylist");
    expect(s?.incorrectCount).toBe(1);
  });

  it("P — recall evidence via Lucky bridge when KL concept known", async () => {
    await maybeRecordLuckyKnowledgeRecall({
      userId: "u",
      retentionItemId: "ri-1",
      reviewCount: 0,
      metadataJson: JSON.stringify({ knowledgeConceptId: "java-arraylist" }),
      outcome: "SUCCESS",
    });
    const s = await getLearnerConceptState("u", "java-arraylist");
    expect(s?.correctCount).toBe(1);
    const list = await listEvidence("u");
    expect(list.some((e) => e.type === "recall_result")).toBe(true);
  });

  it("Q — duplicate eventKey does not double-count", async () => {
    await recordEvaluateKnowledgeEvidence({
      userId: "u",
      topic: "ArrayList in Java",
      mode: "teach-me",
      scoreRatio: 1,
      eventKey: "same-key",
    });
    await recordEvaluateKnowledgeEvidence({
      userId: "u",
      topic: "ArrayList in Java",
      mode: "teach-me",
      scoreRatio: 1,
      eventKey: "same-key",
    });
    expect(
      (await getLearnerConceptState("u", "java-arraylist"))?.attemptCount,
    ).toBe(1);
  });

  it("R — learner isolation", async () => {
    await recordLearningEvidence({
      userId: "a",
      type: "lesson_exposure",
      conceptId: "java-arraylist",
      outcome: "completed",
    });
    const da = await resolveKnowledgeLoopDecision({
      userId: "a",
      target: "ArrayList in Java",
      knowledge: resolveTeachingKnowledgeContext("ArrayList in Java"),
    });
    const db = await resolveKnowledgeLoopDecision({
      userId: "b",
      target: "ArrayList in Java",
      knowledge: resolveTeachingKnowledgeContext("ArrayList in Java"),
    });
    expect(da.action).toBe("practice");
    expect(db.action).toBe("teach");
  });

  it("S — API compatibility additive orchestration", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("orchestration: orchestrationView");
    expect(route).toContain("lesson,");
    expect(route).toContain("instructionalContext: instructional");
  });

  it("T/U — AI failure still uses deterministic fallback + reteach flag", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("buildSubjectAwareFallbackLesson");
    expect(route).toContain("reteachEmphasis");
    expect(route).toContain("validateAiLesson");
  });

  it("V — orchestrator does not mutate state", async () => {
    await recordLearningEvidence({
      userId: "u",
      type: "lesson_exposure",
      conceptId: "java-arraylist",
      outcome: "completed",
    });
    const before = await listEvidence("u");
    await resolveKnowledgeLoopDecision({
      userId: "u",
      target: "ArrayList in Java",
      knowledge: resolveTeachingKnowledgeContext("ArrayList in Java"),
    });
    expect(await listEvidence("u")).toHaveLength(before.length);
  });

  it("W — every action resolves through destination adapter", () => {
    const actions = [
      decideKnowledgeLoop(inputFor("ArrayList in Java", {})),
      decideKnowledgeLoop(
        inputFor("ArrayList in Java", {
          "java-arraylist": emptyState("java-arraylist", { exposureCount: 1 }),
        }),
      ),
      decideKnowledgeLoop(
        inputFor("ArrayList in Java", {
          "java-arraylist": emptyState("java-arraylist", {
            exposureCount: 1,
            attemptCount: 1,
            lastOutcome: "incorrect",
            incorrectCount: 1,
          }),
        }),
      ),
    ];
    for (const d of actions) {
      const exec = executeKnowledgeLearningAction(d, {
        topic: "ArrayList in Java",
      });
      expect(exec.learnerLabel.length).toBeGreaterThan(0);
      if (d.action !== "complete") {
        expect(exec.destination.href).toBeTruthy();
      }
    }
  });

  it("X — UI consumes orchestration; does not reproduce decision rules", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    const dock = read(
      "src/components/study/learning-workspace/LearningDock.tsx",
    );
    // Bundle F: orchestrated-next lives on LearningDock; TeachFirst still wires orchestration.
    expect(teach).toContain("LearningDock");
    expect(teach).toContain("orchestratedNext");
    expect(dock).toContain("data-learn-orchestrated-next");
    expect(teach).toContain("orchestration");
    expect(teach).toContain("learnerLabel");
    expect(teach).not.toMatch(/if\s*\(.*attemptCount\s*===?\s*0/);
    expect(teach).not.toContain("decideKnowledgeLoop");
    expect(teach).not.toContain("reasonCode");
  });

  it("Y — end-to-end closed loop", async () => {
    const target = "ArrayList in Java";
    const knowledge = resolveTeachingKnowledgeContext(target)!;

    // 1 teach
    let d = await resolveKnowledgeLoopDecision({
      userId: "loop",
      target,
      knowledge,
    });
    expect(d.action).toBe("teach");

    // exposure
    await recordLearningEvidence({
      userId: "loop",
      type: "lesson_exposure",
      conceptId: "java-arraylist",
      outcome: "completed",
    });
    d = await resolveKnowledgeLoopDecision({
      userId: "loop",
      target,
      knowledge,
    });
    expect(d.action).toBe("practice");

    // incorrect practice
    await recordLearningEvidence({
      userId: "loop",
      type: "practice_attempt",
      conceptId: "java-arraylist",
      outcome: "incorrect",
    });
    d = await resolveKnowledgeLoopDecision({
      userId: "loop",
      target,
      knowledge,
    });
    expect(d.action).toBe("reteach");

    // correct practice after reteach
    await recordLearningEvidence({
      userId: "loop",
      type: "practice_attempt",
      conceptId: "java-arraylist",
      outcome: "correct",
    });
    d = await resolveKnowledgeLoopDecision({
      userId: "loop",
      target,
      knowledge,
    });
    expect(d.action).toBe("recall");

    // recall
    await recordLearningEvidence({
      userId: "loop",
      type: "recall_result",
      conceptId: "java-arraylist",
      outcome: "correct",
    });
    d = await resolveKnowledgeLoopDecision({
      userId: "loop",
      target,
      knowledge,
    });
    expect(d.action).toBe("complete");
  });
});
