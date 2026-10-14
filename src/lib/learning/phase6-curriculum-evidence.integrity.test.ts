/**
 * Phase 6 — Curriculum Expansion + Six Evidence Hardening integrity suite.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildLessonFromKnowledgeLibrary,
  findInstructionalConceptById,
  listInstructionalPacks,
  resolveInstructionalKnowledge,
} from "@/lib/learning/knowledge/instructional-library";
import {
  JAVA_FUNDAMENTALS_PATH_IDS,
  KNOWLEDGE_LEARNING_PATHS,
  PYTHON_FUNDAMENTALS_PATH_IDS,
  matchKnowledgeLearningPath,
} from "@/lib/learning/knowledge/learning-paths";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import {
  evidenceTypeFromEvaluate,
  getLearnerConceptState,
  getLearnerState,
  listEvidence,
  recordLearningEvidence,
  resetLearnerStateForTests,
} from "@/lib/learning/learner-state";
import {
  decideKnowledgeLoop,
  executeKnowledgeLearningAction,
  isConceptReadyToAdvance,
  summarizeConceptEvidence,
} from "@/lib/learning/orchestrator/knowledge-loop";
import type {
  LearningEvidence,
  LearnerConceptState,
} from "@/lib/learning/learner-state/types";
import { applyPersonalizationToLibraryLesson } from "@/lib/learning/personalized-teaching/apply-deterministic";
import { buildPersonalizedTeachingContext } from "@/lib/learning/personalized-teaching";
import { buildSubjectAwareFallbackLesson } from "@/lib/csl/six-worked-lesson";
import type { StudyRoomContext } from "@/lib/study/resolve-study-room";
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

function ev(
  partial: Partial<LearningEvidence> &
    Pick<LearningEvidence, "type" | "conceptId">,
): LearningEvidence {
  return {
    id: partial.id ?? `e-${Math.random().toString(36).slice(2)}`,
    userId: partial.userId ?? "u",
    type: partial.type,
    conceptId: partial.conceptId,
    outcome: partial.outcome ?? "correct",
    occurredAt: partial.occurredAt ?? new Date(),
    eventKey: partial.eventKey,
    source: partial.source ?? "test",
  };
}

function decide(
  target: string,
  states: Record<string, LearnerConceptState | null> = {},
  evidence: LearningEvidence[] = [],
) {
  return decideKnowledgeLoop({
    target,
    knowledge: resolveTeachingKnowledgeContext(target),
    statesByConceptId: new Map(Object.entries(states)),
    evidence,
  });
}

describe("Phase 6 — Curriculum integrity", () => {
  it("every path concept exists; no dangling refs; no duplicate concept ids", () => {
    const seen = new Set<string>();
    for (const pack of listInstructionalPacks()) {
      for (const c of pack.concepts) {
        expect(seen.has(c.id), `duplicate concept id ${c.id}`).toBe(false);
        seen.add(c.id);
      }
    }
    for (const p of KNOWLEDGE_LEARNING_PATHS) {
      const pack = listInstructionalPacks().find((x) => x.id === p.packId);
      expect(pack, `missing pack ${p.packId}`).toBeTruthy();
      for (const id of p.conceptIds) {
        expect(
          pack!.concepts.some((c) => c.id === id),
          `path ${p.id} dangling ${id}`,
        ).toBe(true);
        expect(findInstructionalConceptById(id)?.concept.id).toBe(id);
      }
    }
  });

  it("Java pack covers foundations through OOP/exceptions; ArrayList preserved", () => {
    const java = listInstructionalPacks().find((p) => p.id === "java-fundamentals");
    expect(java).toBeTruthy();
    const ids = new Set(java!.concepts.map((c) => c.id));
    for (const id of [
      "java-variables",
      "java-primitives",
      "java-operators",
      "java-if-else",
      "java-for",
      "java-methods",
      "java-strings",
      "java-arrays",
      "java-arraylist",
      "java-classes-basics",
      "java-inheritance",
      "java-polymorphism",
      "java-exceptions",
    ]) {
      expect(ids.has(id)).toBe(true);
    }
    expect(
      listInstructionalPacks().some((p) => p.id === "java-exception-handling-file-io"),
    ).toBe(true);
    const path = matchKnowledgeLearningPath("Java Programming Fundamentals");
    expect(path?.conceptIds).toEqual([...JAVA_FUNDAMENTALS_PATH_IDS]);
  });

  it("Python preserves core concepts and expands path", () => {
    const py = listInstructionalPacks().find((p) => p.id === "python-fundamentals");
    const ids = new Set(py!.concepts.map((c) => c.id));
    expect(ids.has("python-variables")).toBe(true);
    expect(ids.has("python-conditionals")).toBe(true);
    expect(ids.has("python-functions")).toBe(true);
    expect(ids.has("python-loops")).toBe(true);
    expect(ids.has("python-lists")).toBe(true);
    expect(ids.has("python-exceptions")).toBe(true);
    expect(
      matchKnowledgeLearningPath("Python Programming Fundamentals")?.conceptIds,
    ).toEqual([...PYTHON_FUNDAMENTALS_PATH_IDS]);
  });

  it("Economics, Business, Math, Stocks packs and paths resolve", () => {
    expect(resolveInstructionalKnowledge("Economics Fundamentals")?.pack.id).toBe(
      "economics-fundamentals",
    );
    expect(resolveInstructionalKnowledge("Business Fundamentals")?.pack.id).toBe(
      "business-fundamentals",
    );
    expect(resolveInstructionalKnowledge("Algebra Foundations")?.pack.id).toBe(
      "math-fundamentals",
    );
    expect(resolveInstructionalKnowledge("Stocks Fundamentals")?.pack.id).toBe(
      "stocks-fundamentals",
    );
    for (const phrase of [
      "economics fundamentals",
      "business fundamentals",
      "algebra foundations",
      "stocks fundamentals",
    ]) {
      const path = matchKnowledgeLearningPath(phrase);
      expect(path, phrase).toBeTruthy();
      expect(path!.conceptIds.length).toBeGreaterThan(2);
    }
  });

  it("existing mortgage / exception / OOD surfaces preserved", () => {
    expect(resolveInstructionalKnowledge("mortgage")?.pack.id).toBe(
      "business-mortgages",
    );
    expect(
      resolveInstructionalKnowledge("Exception Handling and File I/O")?.pack.id,
    ).toBe("java-exception-handling-file-io");
    expect(resolveInstructionalKnowledge("Classes & Objects")).toBeNull();
    const ood = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Classes & Objects",
    );
    expect(ood!.chunks[0]?.explanation.toLowerCase()).toMatch(/dealership|cars/);
  });
});

describe("Phase 6 — Resolution hardening", () => {
  it("exact id and title resolve; aliases resolve", () => {
    expect(resolveInstructionalKnowledge("java-arraylist")?.matchedConcept?.id).toBe(
      "java-arraylist",
    );
    expect(resolveInstructionalKnowledge("java-variables")?.matchedConcept?.id).toBe(
      "java-variables",
    );
    expect(
      resolveInstructionalKnowledge("ArrayList in Java")?.matchedConcept?.id,
    ).toBe("java-arraylist");
    expect(
      resolveInstructionalKnowledge("Python variables")?.matchedConcept?.id,
    ).toBe("python-variables");
  });

  it("ambiguous bare terms stay unresolved; unknown stays unresolved", () => {
    for (const term of [
      "variables",
      "functions",
      "loops",
      "arrays",
      "methods",
      "exceptions",
      "lists",
    ]) {
      expect(resolveInstructionalKnowledge(term), term).toBeNull();
    }
    expect(resolveInstructionalKnowledge("quantum gardening xyz")).toBeNull();
  });

  it("cross-subject isolation", () => {
    expect(resolveInstructionalKnowledge("Java variables")?.subject).toBe("java");
    expect(resolveInstructionalKnowledge("Python variables")?.subject).toBe(
      "python",
    );
    expect(
      resolveInstructionalKnowledge("Java variables")?.matchedConcept?.id,
    ).not.toBe(
      resolveInstructionalKnowledge("Python variables")?.matchedConcept?.id,
    );
    expect(resolveInstructionalKnowledge("Stocks")?.pack.id).not.toBe(
      "business-mortgages",
    );
  });

  it("path resolution returns registered concept order", () => {
    const r = resolveInstructionalKnowledge("Python Programming Fundamentals");
    expect(r?.pack.concepts.map((c) => c.id)).toEqual([
      ...PYTHON_FUNDAMENTALS_PATH_IDS,
    ]);
  });
});

describe("Phase 6 — Six evidence mapping", () => {
  it("maps Six techniques to observable evidence types", () => {
    expect(
      evidenceTypeFromEvaluate({
        mode: "six",
        sixComponent: "chunking",
      }),
    ).toBe("check_attempt");
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
        sixComponent: "hands-on-practice",
      }),
    ).toBe("application_attempt");
    expect(
      evidenceTypeFromEvaluate({
        mode: "six",
        sixComponent: "active-recall",
      }),
    ).toBe("recall_result");
    expect(evidenceTypeFromEvaluate({ mode: "teach-me" })).toBe("check_attempt");
  });

  it("application/explanation evidence counts toward attempt state", async () => {
    resetLearnerStateForTests();
    await recordLearningEvidence({
      userId: "u",
      type: "application_attempt",
      conceptId: "java-arraylist",
      outcome: "correct",
    });
    await recordLearningEvidence({
      userId: "u",
      type: "explanation_attempt",
      conceptId: "java-arraylist",
      outcome: "incorrect",
    });
    const s = await getLearnerConceptState("u", "java-arraylist");
    expect(s?.attemptCount).toBe(2);
    expect(s?.correctCount).toBe(1);
    expect(s?.incorrectCount).toBe(1);
  });

  it("orchestrator treats application as practice evidence", () => {
    const summary = summarizeConceptEvidence(
      "java-arraylist",
      emptyState("java-arraylist", { exposureCount: 1, attemptCount: 1 }),
      [ev({ type: "application_attempt", conceptId: "java-arraylist" })],
    );
    expect(summary.hasPracticeEvidence).toBe(true);
    expect(
      summarizeConceptEvidence(
        "java-arraylist",
        emptyState("java-arraylist"),
        [ev({ type: "explanation_attempt", conceptId: "java-arraylist" })],
      ).hasCheckEvidence,
    ).toBe(true);
  });
});

describe("Phase 6 — Orchestrator six-loop decisions", () => {
  it("new → teach; exposed → practice; incorrect → reteach; correct+recall → advance/complete", () => {
    const target = "java-variables";
    expect(decide(target).action).toBe("teach");

    expect(
      decide(target, {
        "java-variables": emptyState("java-variables", { exposureCount: 1 }),
      }).action,
    ).toBe("practice");

    expect(
      decide(target, {
        "java-variables": emptyState("java-variables", {
          exposureCount: 1,
          attemptCount: 1,
          incorrectCount: 1,
          lastOutcome: "incorrect",
        }),
      }).action,
    ).toBe("reteach");

    const practiced = decide(
      target,
      {
        "java-variables": emptyState("java-variables", {
          exposureCount: 1,
          attemptCount: 1,
          correctCount: 1,
          lastOutcome: "correct",
        }),
      },
      [ev({ type: "practice_attempt", conceptId: "java-variables" })],
    );
    expect(practiced.action).toBe("recall");

    const ready = emptyState("java-variables", {
      exposureCount: 1,
      attemptCount: 1,
      correctCount: 1,
      lastOutcome: "correct",
    });
    const complete = decide(
      target,
      { "java-variables": ready },
      [
        ev({ type: "practice_attempt", conceptId: "java-variables" }),
        ev({ type: "recall_result", conceptId: "java-variables" }),
      ],
    );
    expect(complete.action).toBe("complete");
    expect(
      isConceptReadyToAdvance(
        summarizeConceptEvidence("java-variables", ready, [
          ev({ type: "practice_attempt", conceptId: "java-variables" }),
          ev({ type: "recall_result", conceptId: "java-variables" }),
        ]),
      ),
    ).toBe(true);
  });

  it("Java path advances along registered concepts", () => {
    const target = "Java Programming Fundamentals";
    expect(decide(target).conceptId).toBe("java-variables");
    const afterVars = decide(
      target,
      {
        "java-variables": emptyState("java-variables", {
          exposureCount: 1,
          attemptCount: 1,
          correctCount: 1,
          lastOutcome: "correct",
        }),
      },
      [
        ev({ type: "practice_attempt", conceptId: "java-variables" }),
        ev({ type: "recall_result", conceptId: "java-variables" }),
      ],
    );
    expect(afterVars.action).toBe("advance");
    expect(afterVars.nextConceptId).toBe("java-if-else");
  });

  it("Economics / Math / Stocks paths advance on readiness", () => {
    for (const [target, first, second] of [
      ["Economics Fundamentals", "economics-scarcity", "economics-opportunity-cost"],
      ["Algebra Foundations", "math-algebra-variables", "math-expressions"],
      ["Stocks Fundamentals", "stocks-share", "stocks-market-cap"],
    ] as const) {
      expect(decide(target).conceptId).toBe(first);
      const d = decide(
        target,
        {
          [first]: emptyState(first, {
            exposureCount: 1,
            attemptCount: 1,
            correctCount: 1,
            lastOutcome: "correct",
          }),
        },
        [
          ev({ type: "practice_attempt", conceptId: first }),
          ev({ type: "recall_result", conceptId: first }),
        ],
      );
      expect(d.action).toBe("advance");
      expect(d.nextConceptId).toBe(second);
    }
  });
});

describe("Phase 6 — Closed loop evidence + personalization", () => {
  beforeEach(() => {
    resetLearnerStateForTests();
  });

  it("complete subject flow: teach → exposure → practice → incorrect → reteach → correct → recall → advance", async () => {
    const userId = "phase6-flow";
    const conceptId = "java-variables";
    const target = "java-variables";

    // New → teach
    expect(decide(target).action).toBe("teach");

    await recordLearningEvidence({
      userId,
      type: "lesson_exposure",
      conceptId,
      outcome: "completed",
      eventKey: "p6:exp1",
    });
    let state = (await getLearnerConceptState(userId, conceptId))!;
    expect(
      decide(target, { [conceptId]: state }, await listEvidence(userId)).action,
    ).toBe("practice");

    await recordLearningEvidence({
      userId,
      type: "application_attempt",
      conceptId,
      outcome: "incorrect",
      eventKey: "p6:app1",
    });
    state = (await getLearnerConceptState(userId, conceptId))!;
    expect(
      decide(target, { [conceptId]: state }, await listEvidence(userId)).action,
    ).toBe("reteach");

    const knowledge = resolveTeachingKnowledgeContext(target)!;
    const personalized = buildPersonalizedTeachingContext({
      knowledge,
      statesByConceptId: new Map([[conceptId, state]]),
    });
    const base = buildLessonFromKnowledgeLibrary("detailed-explanation", target)!;
    const reteach = applyPersonalizationToLibraryLesson(base, personalized, {
      reteachEmphasis: true,
    });
    expect(reteach.learningFrame).toMatch(/misconception|contrast/i);

    await recordLearningEvidence({
      userId,
      type: "application_attempt",
      conceptId,
      outcome: "correct",
      eventKey: "p6:app2",
    });
    state = (await getLearnerConceptState(userId, conceptId))!;
    expect(
      decide(target, { [conceptId]: state }, await listEvidence(userId)).action,
    ).toBe("recall");

    await recordLearningEvidence({
      userId,
      type: "recall_result",
      conceptId,
      outcome: "correct",
      eventKey: "p6:rec1",
    });
    state = (await getLearnerConceptState(userId, conceptId))!;
    const evidence = await listEvidence(userId);
    expect(decide(target, { [conceptId]: state }, evidence).action).toBe(
      "complete",
    );

    // Path advance after variables ready
    const pathDecision = decide(
      "Java Programming Fundamentals",
      { [conceptId]: state },
      evidence,
    );
    expect(pathDecision.action).toBe("advance");
    expect(pathDecision.nextConceptId).toBe("java-if-else");

    const room: StudyRoomContext = {
      topic: target,
    };
    const exec = executeKnowledgeLearningAction(pathDecision, room);
    expect(exec.destination.kind).toBe("learn");
    expect(exec.learnerLabel).toMatch(/next concept/i);
  });

  it("dedupe same eventKey; learner isolation", async () => {
    await recordLearningEvidence({
      userId: "a",
      type: "practice_attempt",
      conceptId: "python-variables",
      outcome: "correct",
      eventKey: "same",
    });
    await recordLearningEvidence({
      userId: "a",
      type: "practice_attempt",
      conceptId: "python-variables",
      outcome: "correct",
      eventKey: "same",
    });
    expect(
      (await getLearnerConceptState("a", "python-variables"))?.attemptCount,
    ).toBe(1);
    expect(await getLearnerConceptState("b", "python-variables")).toBeNull();
    expect((await getLearnerState("b")).concepts).toEqual([]);
  });

  it("offline lesson exists for new curriculum concepts without AI", () => {
    for (const topic of [
      "java-inheritance",
      "python-loops",
      "economics-scarcity",
      "math-equations",
      "stocks-eps",
      "business-marketing",
    ]) {
      const lesson = buildLessonFromKnowledgeLibrary(
        "detailed-explanation",
        topic,
      );
      expect(lesson, topic).not.toBeNull();
      expect(lesson!.chunks.length).toBeGreaterThan(0);
      expect(lesson!.chunks[0]!.explanation.length).toBeGreaterThan(20);
    }
  });
});

describe("Phase 6 — Non-goals / preservation", () => {
  it("does not rewrite Lucky SM-2 or expose raw orchestrator in Learn UI", () => {
    const review = read("src/lib/learning/retention/review.ts");
    const schedule = read("src/lib/learning/retention/schedule.ts");
    expect(schedule).toMatch(/SM-2|flashcard_sm2/i);
    expect(review).toContain("maybeRecordLuckyKnowledgeRecall");
    expect(review).not.toContain("decideKnowledgeLoop");

    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    expect(teach).not.toContain("decideKnowledgeLoop");
    expect(teach).not.toContain("KnowledgeConceptState");
  });

  it("StudyTopicProfile stays excluded from instructional resolution", () => {
    const lib = read("src/lib/learning/knowledge/instructional-library.ts");
    expect(lib).toContain("looksLikeStudyTopicProfileSource");
    expect(resolveInstructionalKnowledge("Classes & Objects")).toBeNull();
  });
});
