/**
 * Phase 4B — Learner State → Personalized Teaching Context integrity tests.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildSixLessonUserPrompt,
  buildSubjectAwareFallbackLesson,
  type SixWorkedLesson,
} from "@/lib/csl/six-worked-lesson";
import { validateAiLesson } from "@/lib/csl/validate-ai-lesson";
import {
  lessonFromTeachingKnowledgeContext,
  resolveTeachingKnowledgeContext,
} from "@/lib/learning/knowledge/teaching-knowledge-context";
import {
  recordLearningEvidence,
  resetLearnerStateForTests,
} from "@/lib/learning/learner-state";
import {
  REPEATED_INTERACTION_THRESHOLD,
  applyPersonalizationToLibraryLesson,
  buildPersonalizedTeachingContext,
  deriveFamiliarity,
  formatLearnerContextPromptBlock,
  lessonContainsUnsupportedLearnerJudgment,
  personalizationFromState,
  presentationHintsFor,
  resolvePersonalizedTeachingContext,
} from "@/lib/learning/personalized-teaching";
import "@/lib/learning/knowledge/packs";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

function state(
  partial: Partial<{
    exposureCount: number;
    attemptCount: number;
    correctCount: number;
    incorrectCount: number;
    lastOutcome: string;
  }>,
) {
  return {
    userId: "u",
    conceptId: "java-arraylist",
    exposureCount: 0,
    attemptCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    ...partial,
  };
}

describe("Phase 4B — Personalized Teaching Context", () => {
  beforeEach(() => {
    resetLearnerStateForTests();
  });

  it("A — new learner is unseen with foundational hints", () => {
    const p = personalizationFromState("java-arraylist", null);
    expect(p.familiarity).toBe("unseen");
    expect(p.presentationHints).toContain("foundational_definition");
    expect(p.presentationHints.join(" ")).not.toMatch(/mastered|weak/i);
  });

  it("B — exposure without practice is introduced (not mastered)", () => {
    const p = personalizationFromState(
      "java-arraylist",
      state({ exposureCount: 2 }),
    );
    expect(p.familiarity).toBe("introduced");
    expect(p.presentationHints).toContain("concise_recap");
    expect(JSON.stringify(p)).not.toMatch(/mastered|weak/i);
  });

  it("C — practice evidence is practiced", () => {
    const p = personalizationFromState(
      "java-arraylist",
      state({ exposureCount: 1, attemptCount: 1, correctCount: 1 }),
    );
    expect(p.familiarity).toBe("practiced");
    expect(p.presentationHints).toContain("application_emphasis");
  });

  it("D — incorrect history emphasizes misconception, never weak", () => {
    const p = personalizationFromState(
      "java-arraylist",
      state({
        exposureCount: 1,
        attemptCount: 2,
        incorrectCount: 2,
        lastOutcome: "incorrect",
      }),
    );
    expect(p.presentationHints).toContain("misconception_contrast");
    expect(p.presentationHints).toContain("contrasting_examples");
    expect(p.presentationHints.join(" ")).not.toMatch(/\bweak\b/i);
    const blob = formatLearnerContextPromptBlock(
      buildPersonalizedTeachingContext({
        knowledge: resolveTeachingKnowledgeContext("ArrayList in Java")!,
        statesByConceptId: new Map([
          [
            "java-arraylist",
            state({
              exposureCount: 1,
              attemptCount: 2,
              incorrectCount: 2,
              lastOutcome: "incorrect",
            }),
          ],
        ]),
      }),
    );
    expect(blob).not.toMatch(/Familiarity:\s*weak|\byou are weak\b|\bstudent is weak\b/i);
    expect(blob).toContain("Incorrect: 2");
  });

  it("E — correct history does not claim mastered", () => {
    const p = personalizationFromState(
      "java-arraylist",
      state({
        exposureCount: 1,
        attemptCount: 2,
        correctCount: 2,
      }),
    );
    expect(p.presentationHints).toContain("reduce_redundancy");
    expect(JSON.stringify(p)).not.toMatch(/mastered/i);
  });

  it("F — repeated history is deterministic at threshold", () => {
    expect(REPEATED_INTERACTION_THRESHOLD).toBe(4);
    expect(
      deriveFamiliarity({ exposureCount: 2, attemptCount: 2 }),
    ).toBe("repeated");
    expect(
      deriveFamiliarity({ exposureCount: 1, attemptCount: 2 }),
    ).toBe("practiced");
    const hints = presentationHintsFor({
      familiarity: "repeated",
      incorrectCount: 0,
      correctCount: 1,
    });
    expect(hints).toContain("reduce_redundancy");
  });

  it("G — unknown concept: no knowledge → no personalized context", async () => {
    const knowledge = resolveTeachingKnowledgeContext(
      "Quantum Underwater Basket Weaving",
    );
    expect(knowledge).toBeNull();
    expect(
      await resolvePersonalizedTeachingContext({
        userId: "u",
        knowledge,
      }),
    ).toBeNull();
  });

  it("H — ArrayList personalization scopes only java-arraylist", () => {
    const knowledge = resolveTeachingKnowledgeContext("ArrayList in Java")!;
    const ctx = buildPersonalizedTeachingContext({
      knowledge,
      statesByConceptId: new Map([
        ["java-arraylist", state({ exposureCount: 1, attemptCount: 1 })],
        [
          "java-exceptions",
          {
            userId: "u",
            conceptId: "java-exceptions",
            exposureCount: 9,
            attemptCount: 9,
            correctCount: 9,
            incorrectCount: 0,
          },
        ],
      ]),
    });
    expect(ctx.conceptBindings.map((b) => b.conceptId)).toEqual([
      "java-arraylist",
    ]);
    expect(ctx.primary.conceptId).toBe("java-arraylist");
    expect(ctx.primary.priorAttempts).toBe(1);
  });

  it("I — Python path keeps per-concept states (no fake path concept)", async () => {
    await recordLearningEvidence({
      userId: "u",
      type: "lesson_exposure",
      conceptId: "python-variables",
      outcome: "completed",
    });
    await recordLearningEvidence({
      userId: "u",
      type: "practice_attempt",
      conceptId: "python-conditionals",
      outcome: "incorrect",
    });
    const knowledge = resolveTeachingKnowledgeContext(
      "Python Programming Fundamentals",
    )!;
    const ctx = await resolvePersonalizedTeachingContext({
      userId: "u",
      knowledge,
    });
    expect(ctx).not.toBeNull();
    expect(ctx!.conceptBindings.map((b) => b.conceptId)).toEqual([
      "python-variables",
      "python-conditionals",
      "python-loops",
      "python-functions",
      "python-lists",
      "python-dictionaries",
      "python-exceptions",
    ]);
    expect(
      ctx!.conceptBindings.find((b) => b.conceptId === "python-variables")
        ?.personalization.familiarity,
    ).toBe("introduced");
    expect(
      ctx!.conceptBindings.find((b) => b.conceptId === "python-conditionals")
        ?.personalization.familiarity,
    ).toBe("practiced");
    expect(
      ctx!.conceptBindings.find((b) => b.conceptId === "python-functions")
        ?.personalization.familiarity,
    ).toBe("unseen");
    expect(
      ctx!.conceptBindings.find((b) => b.conceptId === "python-loops")
        ?.personalization.familiarity,
    ).toBe("unseen");
    expect(
      ctx!.conceptBindings.some((b) =>
        b.conceptId.includes("python-programming-fundamentals"),
      ),
    ).toBe(false);
  });

  it("J — Stocks evidence does not influence Java personalization", async () => {
    await recordLearningEvidence({
      userId: "u",
      type: "practice_attempt",
      conceptId: "stocks-market-cap",
      outcome: "correct",
    });
    const knowledge = resolveTeachingKnowledgeContext("ArrayList in Java")!;
    const ctx = await resolvePersonalizedTeachingContext({
      userId: "u",
      knowledge,
    });
    expect(ctx!.primary.familiarity).toBe("unseen");
    expect(ctx!.primary.priorAttempts).toBe(0);
  });

  it("K — AI prompt keeps LEARNER / KNOWLEDGE / source sections separate", () => {
    const knowledge = resolveTeachingKnowledgeContext("ArrayList in Java")!;
    const personalized = buildPersonalizedTeachingContext({
      knowledge,
      statesByConceptId: new Map([
        ["java-arraylist", state({ exposureCount: 2, attemptCount: 1 })],
      ]),
    });
    const prompt = buildSixLessonUserPrompt({
      component: "detailed-explanation",
      topic: "ArrayList in Java",
      sourceText: "Chapter 4: Collections in the course PDF.",
      knowledgeLibraryBlock:
        "## KNOWLEDGE LIBRARY CONTEXT\nDomain: programming\n",
      learnerContextBlock: formatLearnerContextPromptBlock(personalized),
    });
    expect(prompt).toContain("## CANONICAL LEARNING TARGET");
    expect(prompt).toContain("## KNOWLEDGE LIBRARY CONTEXT");
    expect(prompt).toContain("## LEARNER CONTEXT");
    expect(
      prompt.includes("## OPTIONAL INSTRUCTIONAL GROUNDING") ||
        prompt.includes("## COURSE / ORGANIZATIONAL CONTEXT"),
    ).toBe(true);
    const learnerIdx = prompt.indexOf("## LEARNER CONTEXT");
    const libraryIdx = prompt.indexOf("## KNOWLEDGE LIBRARY CONTEXT");
    expect(libraryIdx).toBeGreaterThan(-1);
    expect(learnerIdx).toBeGreaterThan(libraryIdx);
    expect(prompt).toContain("adapt instructional presentation");
    expect(prompt).toContain("Do not claim mastery");
  });

  it("L — AI validation still rejects bad lessons with learner context", () => {
    const bad: SixWorkedLesson = {
      component: "detailed-explanation",
      topic: "ArrayList in Java",
      learningFrame: "You are weak at this and have mastered nothing.",
      roadmap: ["a", "b", "c"],
      chunks: [
        {
          title: "Goal of studying",
          role: "context",
          explanation: "State the goal and list study tips for success.",
          example: "Mark weak spots.",
        },
        {
          title: "Step-by-step study plan",
          role: "explain",
          explanation: "List steps to study better without teaching ArrayList.",
          example: "Pomodoro.",
        },
        {
          title: "Why each step matters",
          role: "clarify",
          explanation: "Meta advice about learning habits.",
          example: "Review notes.",
        },
      ],
      cheatSheet: "Study tips",
      practicePrompts: [
        { title: "a", prompt: "tips", tip: "Keep tips grounded in the concept." },
        { title: "b", prompt: "tips", tip: "Avoid meta study advice without content." },
      ],
    };
    const result = validateAiLesson({
      lesson: bad,
      canonicalTarget: "ArrayList in Java",
      learnerContextSupplied: true,
    });
    expect(result.accepted).toBe(false);
    expect(lessonContainsUnsupportedLearnerJudgment(bad)).toBe(true);
  });

  it("M — deterministic Knowledge Library fallback still produces a valid lesson", () => {
    const knowledge = resolveTeachingKnowledgeContext("ArrayList in Java")!;
    const personalized = buildPersonalizedTeachingContext({
      knowledge,
      statesByConceptId: new Map([
        [
          "java-arraylist",
          state({
            exposureCount: 1,
            attemptCount: 2,
            incorrectCount: 1,
            lastOutcome: "incorrect",
          }),
        ],
      ]),
    });
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "ArrayList in Java",
      { personalizedTeaching: personalized },
    );
    expect(lesson).not.toBeNull();
    expect(lesson!.chunks.length).toBeGreaterThanOrEqual(1);
    expect(lesson!.learningFrame.toLowerCase()).toMatch(
      /misconception|contrast|application|recap|foundation|emphasize/,
    );
    const fromCtx = lessonFromTeachingKnowledgeContext(
      "detailed-explanation",
      "ArrayList in Java",
      knowledge,
      personalized,
    );
    expect(fromCtx.chunks.length).toBeGreaterThanOrEqual(1);
    expect(fromCtx.topic.toLowerCase()).toContain("arraylist");
  });

  it("N — specialized OOD path remains unchanged by personalization", () => {
    const knowledge = resolveTeachingKnowledgeContext("ArrayList in Java");
    const personalized = knowledge
      ? buildPersonalizedTeachingContext({
          knowledge,
          statesByConceptId: new Map([
            ["java-arraylist", state({ exposureCount: 5, attemptCount: 5 })],
          ]),
        })
      : null;
    const fallback = buildSubjectAwareFallbackLesson(
      "chunking",
      "Classes and Objects",
      { personalizedTeaching: personalized },
    );
    expect(fallback).not.toBeNull();
    // Specialized dealership sequence must not pick up ArrayList personalization frames.
    expect(fallback!.learningFrame).not.toMatch(/Brief recap|Emphasize application/);
    expect(JSON.stringify(fallback!.chunks).toLowerCase()).toMatch(
      /dealership|vehicle|car/,
    );
  });

  it("O — Lucky retention path is not rewritten by Phase 4B", () => {
    const review = read("src/lib/learning/retention/review.ts");
    expect(review).toContain("recordEvidence");
    expect(review).not.toContain("PersonalizedTeachingContext");
    expect(review).not.toContain("formatLearnerContextPromptBlock");
  });

  it("P — six-lesson wires learner context without exposing state in API payload", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("resolvePersonalizedTeachingContext");
    expect(route).toContain("formatLearnerContextPromptBlock");
    expect(route).toContain("learnerContextBlock");
    expect(route).toContain("personalizedTeaching");
    expect(route).toContain("learnerContextSupplied");
    // Response still returns lesson shape — not raw learner-state dump.
    expect(route).toContain("instructionalContext: instructional");
    expect(route).not.toMatch(
      /return NextResponse\.json\(\{[\s\S]*learnerState:|conceptBindings:/,
    );
  });

  it("applyPersonalization is a no-op without context", () => {
    const base = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "ArrayList in Java",
    )!;
    const same = applyPersonalizationToLibraryLesson(base, null);
    expect(same).toEqual(base);
  });
});
