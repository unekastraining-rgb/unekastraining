/**
 * Phase 4C — Knowledge Library Loop Orchestrator integrity suite.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildSubjectAwareFallbackLesson,
  buildSixLessonUserPrompt,
} from "@/lib/csl/six-worked-lesson";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import {
  getLearnerConceptState,
  listEvidence,
  recordLearningEvidence,
  resetLearnerStateForTests,
} from "@/lib/learning/learner-state";
import {
  decideKnowledgeLoop,
  isConceptReadyToAdvance,
  resolveKnowledgeActionDestination,
  resolveKnowledgeLoopDecision,
  summarizeConceptEvidence,
  toOrchestrationApiView,
} from "@/lib/learning/orchestrator/knowledge-loop";
import type {
  KnowledgeOrchestratorDecision,
  KnowledgeOrchestratorInput,
} from "@/lib/learning/orchestrator/knowledge-loop";
import type {
  LearningEvidence,
  LearnerConceptState,
} from "@/lib/learning/learner-state/types";
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
  const knowledge = resolveTeachingKnowledgeContext(target);
  return {
    target,
    knowledge,
    statesByConceptId: new Map(Object.entries(states)),
    evidence,
  };
}

function evidence(
  partial: Partial<LearningEvidence> &
    Pick<LearningEvidence, "type" | "conceptId">,
): LearningEvidence {
  return {
    id: partial.id ?? `e-${Math.random().toString(36).slice(2)}`,
    userId: partial.userId ?? "u",
    type: partial.type,
    conceptId: partial.conceptId,
    outcome: partial.outcome,
    occurredAt: partial.occurredAt ?? new Date(),
    source: partial.source ?? "test",
  };
}

describe("Phase 4C — Knowledge Loop Orchestrator", () => {
  beforeEach(() => {
    resetLearnerStateForTests();
  });

  it("A — new concept → teach", () => {
    const d = decideKnowledgeLoop(
      inputFor("ArrayList in Java", { "java-arraylist": null }),
    );
    expect(d.action).toBe("teach");
    expect(d.reasonCode).toBe("new-concept");
    expect(d.conceptId).toBe("java-arraylist");
  });

  it("B — exposed concept → practice", () => {
    const d = decideKnowledgeLoop(
      inputFor("ArrayList in Java", {
        "java-arraylist": emptyState("java-arraylist", { exposureCount: 1 }),
      }),
    );
    expect(d.action).toBe("practice");
    expect(d.reasonCode).toBe("needs-practice");
  });

  it("C — no practice leads toward practice", () => {
    const d = decideKnowledgeLoop(
      inputFor("ArrayList in Java", {
        "java-arraylist": emptyState("java-arraylist", {
          exposureCount: 2,
          attemptCount: 0,
        }),
      }),
    );
    expect(d.action).toBe("practice");
  });

  it("D — incorrect attempt → reteach", () => {
    const d = decideKnowledgeLoop(
      inputFor("ArrayList in Java", {
        "java-arraylist": emptyState("java-arraylist", {
          exposureCount: 1,
          attemptCount: 1,
          incorrectCount: 1,
          lastOutcome: "incorrect",
        }),
      }),
    );
    expect(d.action).toBe("reteach");
    expect(d.reasonCode).toBe("recent-incorrect");
    expect(d.presentationHint).toBe("misconception_contrast");
  });

  it("E — correct attempt does not equal mastery / advance alone", () => {
    const d = decideKnowledgeLoop(
      inputFor("ArrayList in Java", {
        "java-arraylist": emptyState("java-arraylist", {
          exposureCount: 1,
          attemptCount: 1,
          correctCount: 1,
          lastOutcome: "correct",
        }),
      }),
    );
    expect(d.action).not.toBe("advance");
    expect(d.action).toBe("recall");
    expect(JSON.stringify(d)).not.toMatch(/masteryScore|0\.\d{2}/);
  });

  it("F — repeated interaction stays deterministic", () => {
    const state = emptyState("java-arraylist", {
      exposureCount: 3,
      attemptCount: 3,
      correctCount: 2,
      incorrectCount: 1,
      lastOutcome: "correct",
    });
    const ev = [
      evidence({ type: "practice_attempt", conceptId: "java-arraylist" }),
      evidence({ type: "check_attempt", conceptId: "java-arraylist" }),
    ];
    const a = decideKnowledgeLoop(
      inputFor("ArrayList in Java", { "java-arraylist": state }, ev),
    );
    const b = decideKnowledgeLoop(
      inputFor("ArrayList in Java", { "java-arraylist": state }, ev),
    );
    expect(a).toEqual(b);
    expect(a.action).toBe("recall");
  });

  it("G — recall selected when practice/check exists without recall", () => {
    const d = decideKnowledgeLoop(
      inputFor(
        "ArrayList in Java",
        {
          "java-arraylist": emptyState("java-arraylist", {
            exposureCount: 1,
            attemptCount: 2,
            correctCount: 2,
            lastOutcome: "correct",
          }),
        },
        [
          evidence({
            type: "practice_attempt",
            conceptId: "java-arraylist",
            outcome: "correct",
          }),
        ],
      ),
    );
    expect(d.action).toBe("recall");
    expect(d.reasonCode).toBe("needs-recall");
    const dest = resolveKnowledgeActionDestination(d, {
      topic: "ArrayList in Java",
    });
    expect(dest.room).toBe("remember");
    expect(dest.href).toContain("/study/lucky");
  });

  it("H — advance only with required evidence including recall", () => {
    const d = decideKnowledgeLoop(
      inputFor(
        "ArrayList in Java",
        {
          "java-arraylist": emptyState("java-arraylist", {
            exposureCount: 1,
            attemptCount: 2,
            correctCount: 2,
            lastOutcome: "correct",
          }),
        },
        [
          evidence({ type: "practice_attempt", conceptId: "java-arraylist" }),
          evidence({ type: "recall_result", conceptId: "java-arraylist" }),
        ],
      ),
    );
    expect(d.action).toBe("complete");
    expect(d.reasonCode).toBe("no-next-concept");
  });

  it("I — no next concept does not invent one", () => {
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
          evidence({ type: "practice_attempt", conceptId: "java-arraylist" }),
          evidence({ type: "recall_result", conceptId: "java-arraylist" }),
        ],
      ),
    );
    expect(d.nextConceptId ?? null).toBeNull();
    expect(d.reasonCode).toBe("no-next-concept");
  });

  it("J — Python path traverses registered fundamentals concepts", () => {
    const path = "Python Programming Fundamentals";
    const ready = (id: string) =>
      emptyState(id, {
        exposureCount: 1,
        attemptCount: 1,
        correctCount: 1,
        lastOutcome: "correct",
      });
    const recallEv = (id: string) => [
      evidence({ type: "practice_attempt", conceptId: id }),
      evidence({ type: "recall_result", conceptId: id }),
    ];
    const pathIds = [
      "python-variables",
      "python-conditionals",
      "python-loops",
      "python-functions",
      "python-lists",
      "python-dictionaries",
      "python-exceptions",
    ];

    expect(
      decideKnowledgeLoop(inputFor(path, {})).conceptId,
    ).toBe("python-variables");
    expect(decideKnowledgeLoop(inputFor(path, {})).action).toBe("teach");

    const advanceVars = decideKnowledgeLoop(
      inputFor(
        path,
        {
          "python-variables": ready("python-variables"),
        },
        recallEv("python-variables"),
      ),
    );
    expect(advanceVars.action).toBe("advance");
    expect(advanceVars.nextConceptId).toBe("python-conditionals");

    const advanceCond = decideKnowledgeLoop(
      inputFor(
        path,
        {
          "python-variables": ready("python-variables"),
          "python-conditionals": ready("python-conditionals"),
        },
        [
          ...recallEv("python-variables"),
          ...recallEv("python-conditionals"),
        ],
      ),
    );
    expect(advanceCond.action).toBe("advance");
    expect(advanceCond.nextConceptId).toBe("python-loops");

    const statesAll: Record<string, ReturnType<typeof ready>> = {};
    const evAll: LearningEvidence[] = [];
    for (const id of pathIds) {
      statesAll[id] = ready(id);
      evAll.push(...recallEv(id));
    }
    const done = decideKnowledgeLoop(inputFor(path, statesAll, evAll));
    expect(done.action).toBe("complete");
    expect(done.reasonCode).toBe("no-next-concept");
  });

  it("K — ArrayList stays isolated from other Java concepts", () => {
    const d = decideKnowledgeLoop(
      inputFor("ArrayList in Java", {
        "java-arraylist": null,
        "java-exceptions": emptyState("java-exceptions", {
          exposureCount: 9,
          attemptCount: 9,
          incorrectCount: 9,
          lastOutcome: "incorrect",
        }),
      }),
    );
    expect(d.conceptId).toBe("java-arraylist");
    expect(d.action).toBe("teach");
    expect(d.trace.focusConceptId).toBe("java-arraylist");
  });

  it("L — Stocks evidence does not affect Java decision", () => {
    const d = decideKnowledgeLoop(
      inputFor(
        "ArrayList in Java",
        {
          "java-arraylist": null,
          "stocks-market-cap": emptyState("stocks-market-cap", {
            exposureCount: 5,
            attemptCount: 5,
            correctCount: 5,
            lastOutcome: "correct",
          }),
        },
        [
          evidence({
            type: "recall_result",
            conceptId: "stocks-market-cap",
            outcome: "correct",
          }),
        ],
      ),
    );
    expect(d.action).toBe("teach");
    expect(d.conceptId).toBe("java-arraylist");
  });

  it("M — unknown topic remains honest", () => {
    const d = decideKnowledgeLoop(
      inputFor("quantum gardening", {}),
    );
    expect(d.reasonCode).toBe("unknown-target");
    expect(d.conceptId).toBeNull();
    expect(resolveTeachingKnowledgeContext("quantum gardening")).toBeNull();
  });

  it("N — OOD specialized dealership path unchanged", () => {
    const lesson = buildSubjectAwareFallbackLesson(
      "chunking",
      "Classes and Objects",
    );
    expect(lesson).not.toBeNull();
    expect(JSON.stringify(lesson!.chunks).toLowerCase()).toMatch(
      /dealership|vehicle|car/,
    );
    const decideSrc = read(
      "src/lib/learning/orchestrator/knowledge-loop/decide.ts",
    );
    expect(decideSrc).not.toContain("specializedChunkingLesson");
  });

  it("O/P — AI failure path still orchestrates; deterministic teaching works", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("resolveKnowledgeLoopOrchestration");
    expect(route).toContain("orchestration: orchestrationView");
    expect(route).toContain("personalizedTeaching");
    expect(route).toContain("buildSubjectAwareFallbackLesson");
    const knowledge = resolveTeachingKnowledgeContext("ArrayList in Java")!;
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "ArrayList in Java",
    );
    expect(lesson).not.toBeNull();
    expect(lesson!.chunks.length).toBeGreaterThan(0);
    // Prompt construction still separates contexts (no LLM decision).
    const prompt = buildSixLessonUserPrompt({
      component: "detailed-explanation",
      topic: "ArrayList in Java",
      knowledgeLibraryBlock: "## KNOWLEDGE LIBRARY CONTEXT\n",
    });
    expect(prompt).toContain("## CANONICAL LEARNING TARGET");
    expect(prompt).not.toContain("decideKnowledgeLoop");
  });

  it("Q — API compatibility: lesson fields preserved; orchestration additive", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("lesson,");
    expect(route).toContain("instructionalContext: instructional");
    expect(route).toContain("orchestration: orchestrationView");
    const view = toOrchestrationApiView(
      decideKnowledgeLoop(
        inputFor("ArrayList in Java", { "java-arraylist": null }),
      ),
    );
    expect(view).not.toHaveProperty("trace");
    expect(view.action).toBe("teach");
  });

  it("R — Lucky remains intact", () => {
    const review = read("src/lib/learning/retention/review.ts");
    expect(review).toContain("recordEvidence");
    expect(review).not.toContain("decideKnowledgeLoop");
    expect(review).not.toContain("KnowledgeLoop");
  });

  it("S — Phase 4A idempotency still works", async () => {
    await recordLearningEvidence({
      userId: "u",
      type: "check_attempt",
      conceptId: "java-arraylist",
      outcome: "correct",
      eventKey: "dup-1",
    });
    await recordLearningEvidence({
      userId: "u",
      type: "check_attempt",
      conceptId: "java-arraylist",
      outcome: "correct",
      eventKey: "dup-1",
    });
    const state = await getLearnerConceptState("u", "java-arraylist");
    expect(state?.attemptCount).toBe(1);
  });

  it("T — learner isolation", async () => {
    await recordLearningEvidence({
      userId: "user-a",
      type: "lesson_exposure",
      conceptId: "java-arraylist",
      outcome: "completed",
    });
    const a = await resolveKnowledgeLoopDecision({
      userId: "user-a",
      target: "ArrayList in Java",
      knowledge: resolveTeachingKnowledgeContext("ArrayList in Java"),
    });
    const b = await resolveKnowledgeLoopDecision({
      userId: "user-b",
      target: "ArrayList in Java",
      knowledge: resolveTeachingKnowledgeContext("ArrayList in Java"),
    });
    expect(a.action).toBe("practice");
    expect(b.action).toBe("teach");
  });

  it("U — decision determinism", () => {
    const inp = inputFor("ArrayList in Java", {
      "java-arraylist": emptyState("java-arraylist", {
        exposureCount: 1,
        attemptCount: 0,
      }),
    });
    expect(decideKnowledgeLoop(inp)).toEqual(decideKnowledgeLoop(inp));
  });

  it("V — orchestrator does not mutate learner state", async () => {
    await recordLearningEvidence({
      userId: "u",
      type: "lesson_exposure",
      conceptId: "java-arraylist",
      outcome: "completed",
    });
    const beforeState = await getLearnerConceptState("u", "java-arraylist");
    const beforeEvidence = await listEvidence("u");
    await resolveKnowledgeLoopDecision({
      userId: "u",
      target: "ArrayList in Java",
      knowledge: resolveTeachingKnowledgeContext("ArrayList in Java"),
    });
    const afterState = await getLearnerConceptState("u", "java-arraylist");
    const afterEvidence = await listEvidence("u");
    expect(afterState).toEqual(beforeState);
    expect(afterEvidence).toHaveLength(beforeEvidence.length);
  });

  it("W — decision table documentation matches implementation", () => {
    const src = read("src/lib/learning/orchestrator/knowledge-loop/decide.ts");
    expect(src).toContain("new-concept");
    expect(src).toContain("needs-practice");
    expect(src).toContain("recent-incorrect");
    expect(src).toContain("needs-recall");
    expect(src).toContain("ready-to-advance");
    expect(src).toContain("no-next-concept");
    expect(src).toContain("unknown-target");
    expect(isConceptReadyToAdvance(
      summarizeConceptEvidence("java-arraylist", emptyState("java-arraylist"), []),
    )).toBe(false);
  });

  it("ULE ConceptMastery orchestrator remains separate", () => {
    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("orchestrateFromLearnerState");
    expect(diagnose).not.toContain("decideKnowledgeLoop");
    const card = read("src/components/study/OrchestratorSuggestionCard.tsx");
    expect(card).toContain("orchestrator-suggestion");
    // Hub product intentionally may not mount the card — documented conflict, not deleted.
    expect(card).toContain("Hub does not write evidence");
  });
});
