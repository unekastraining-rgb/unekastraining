/**
 * Bundle D — Actual Teaching Experience integrity tests.
 * Covers D1 Teach Intelligence, D2 Adaptive loop, D3 Source/Core/Product.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import "@/lib/learning/knowledge/packs";
import {
  createMockGeneralKnowledgeProvider,
  detectLearningActivity,
  learningPathFromTeachingContext,
  resetDynamicPathsForTests,
  resetGeneralTeachingRegistryForTests,
  resolveTeachingKnowledgeForLearn,
  understandLearningTarget,
} from "@/lib/learning/knowledge/retrieval";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import { decideKnowledgeLoop } from "@/lib/learning/orchestrator/knowledge-loop";
import type { LearningEvidence } from "@/lib/learning/learner-state/types";
import { associateConceptsFromText } from "@/lib/learning/core/associate";
import {
  detectTeachScope,
  decomposeTeachConceptsDeterministic,
  decomposeTeachConcepts,
  expandRelatedKnowledgeConcepts,
  expandVocabularyTeachingUnits,
  focusTeachingContextForLesson,
  buildTeachingProgressionView,
  teachingDepthSectionsForScope,
  validateTeachPathConcepts,
  resolveTeachFocusConceptId,
} from "@/lib/learning/teach";

function mockFamily(title: string, concepts: Array<{ id: string; title: string }>) {
  return {
    targetTitle: title,
    subject: title.toLowerCase(),
    domain: "general" as const,
    summary:
      `${title} is taught as an introductory multi-concept sequence covering foundations, core mechanisms, examples, and application for new learners with clear classroom framing.`.slice(
        0,
        200,
      ),
    concepts: concepts.map((c) => ({
      id: c.id,
      title: c.title,
      explanation:
        `${c.title} is a teachable unit inside ${title}. Learners define it, connect it to neighboring ideas, and apply it with one concrete example so understanding can be checked before advancing along the path.`.slice(
          0,
          220,
        ),
    })),
    suggestedSequence: concepts.map((c) => c.id),
  };
}

describe("Bundle D — Teach Intelligence (D1)", () => {
  beforeEach(() => {
    resetDynamicPathsForTests();
    resetGeneralTeachingRegistryForTests();
  });

  it("topic vs concept-family: marketing expands beyond a single lesson card", () => {
    const understood = understandLearningTarget(
      "Teach me Intro to Business marketing",
    )!;
    expect(understood.activity).toBe("teach");
    expect(detectTeachScope(understood)).toMatch(
      /concept-family|broad-subject/,
    );
    const base = resolveTeachingKnowledgeContext("marketing")!;
    expect(base.concepts.length).toBe(1);
    const decomposed = decomposeTeachConceptsDeterministic({
      context: base,
      understood,
    });
    expect(decomposed.expanded).toBe(true);
    expect(decomposed.context.concepts.length).toBeGreaterThanOrEqual(3);
    const path = learningPathFromTeachingContext(decomposed.context)!;
    expect(path.concepts.length).toBeGreaterThanOrEqual(3);
  });

  it("focused vs broad scope", () => {
    expect(
      detectTeachScope(understandLearningTarget("Explain mitochondria")!),
    ).toBe("focused-concept");
    expect(
      detectTeachScope(understandLearningTarget("Teach me psychology")!),
    ).toBe("broad-subject");
    expect(
      detectTeachScope(understandLearningTarget("Teach me Java inheritance")!),
    ).toBe("concept-family");
    expect(
      detectTeachScope(
        understandLearningTarget("Teach me Chapter 5 Marketing")!,
      ),
    ).toBe("course-section");
  });

  it("concept decomposition: Java inheritance uses related KL concepts", () => {
    const base = resolveTeachingKnowledgeContext("Java inheritance")!;
    const related = expandRelatedKnowledgeConcepts(base.primaryConcept!);
    expect(related.map((c) => c.id)).toContain("java-inheritance");
    expect(related.length).toBeGreaterThanOrEqual(3);
    expect(related.some((c) => c.id === "java-polymorphism")).toBe(true);
  });

  it("dynamic path creation + validation", () => {
    const understood = understandLearningTarget("Teach me marketing")!;
    const base = resolveTeachingKnowledgeContext("marketing")!;
    const decomposed = decomposeTeachConceptsDeterministic({
      context: base,
      understood,
    });
    const path = learningPathFromTeachingContext(decomposed.context)!;
    expect(path.concepts.length).toBeGreaterThanOrEqual(3);
    const validated = validateTeachPathConcepts(decomposed.context.concepts, {
      scope: "concept-family",
    });
    expect(validated.accepted).toBe(true);
    expect(
      validateTeachPathConcepts(
        [
          {
            id: "fabricated-marketing-pack",
            title: "Fake",
            explanation: "x".repeat(80),
          },
        ],
        { scope: "concept-family" },
      ).accepted,
    ).toBe(false);
  });

  it("canonical psychology pack is preferred over general AI; unknown topics still use general", async () => {
    const psych = await resolveTeachingKnowledgeForLearn({
      target: "Teach me psychology",
      generalProvider: createMockGeneralKnowledgeProvider(() =>
        mockFamily("Psychology", [
          { id: "foundations", title: "Foundations" },
          { id: "methods", title: "Research Methods" },
          { id: "learning", title: "Learning" },
          { id: "memory", title: "Memory" },
        ]),
      ),
    });
    expect(psych?.source).toBe("knowledge-library");
    expect(psych!.concepts.length).toBeGreaterThanOrEqual(1);
    expect(psych!.concepts.every((c) => !c.id.startsWith("general:"))).toBe(
      true,
    );

    const provider = createMockGeneralKnowledgeProvider(() =>
      mockFamily("Folklore", [
        { id: "foundations", title: "Foundations" },
        { id: "methods", title: "Methods" },
        { id: "forms", title: "Narrative forms" },
        { id: "context", title: "Cultural context" },
      ]),
    );
    const ctx = await resolveTeachingKnowledgeForLearn({
      target: "Teach me cognitive anthropology of folklore",
      generalProvider: provider,
    });
    expect(ctx).toBeTruthy();
    expect(ctx!.concepts.length).toBeGreaterThanOrEqual(3);
    expect(ctx!.concepts.every((c) => c.id.startsWith("general:"))).toBe(true);
  });

  it("no course material still yields multi-concept teach path", () => {
    const understood = understandLearningTarget("Teach me marketing")!;
    const base = resolveTeachingKnowledgeContext("marketing")!;
    expect(base.grounding?.length ?? 0).toBe(0);
    const decomposed = decomposeTeachConceptsDeterministic({
      context: base,
      understood,
    });
    expect(decomposed.context.concepts.length).toBeGreaterThanOrEqual(3);
  });

  it("canonical topic preference preserved for ArrayList", async () => {
    const ctx = await resolveTeachingKnowledgeForLearn({
      target: "ArrayList in Java",
    });
    expect(ctx?.source).toBe("knowledge-library");
    expect(ctx?.primaryConcept?.id).toBe("java-arraylist");
  });

  it("does not hard-code only marketing — algebra / economics / SQL scopes generalize", () => {
    for (const q of [
      "Teach me algebra",
      "Teach me supply and demand",
      "Teach me SQL joins",
      "Teach me cell structure",
      "Teach me the causes of World War I",
    ]) {
      const u = understandLearningTarget(q)!;
      expect(u.activity).toBe("teach");
      const scope = detectTeachScope(u);
      expect(["concept-family", "broad-subject", "course-section"]).toContain(
        scope,
      );
    }
  });
});

describe("Bundle D — Adaptive Teaching Loop (D2)", () => {
  beforeEach(() => {
    resetDynamicPathsForTests();
    resetGeneralTeachingRegistryForTests();
  });

  it("teaching depth is scope-aware", () => {
    expect(teachingDepthSectionsForScope("focused-concept").length).toBeLessThan(
      teachingDepthSectionsForScope("concept-family").length,
    );
    expect(teachingDepthSectionsForScope("concept-family")).toContain(
      "application",
    );
    expect(teachingDepthSectionsForScope("focused-concept")).not.toContain(
      "connections",
    );
  });

  it("progression metadata: not 1 of 1 for marketing family", () => {
    const understood = understandLearningTarget("Teach me marketing")!;
    const base = resolveTeachingKnowledgeContext("marketing")!;
    const decomposed = decomposeTeachConceptsDeterministic({
      context: base,
      understood,
    });
    const path = learningPathFromTeachingContext(decomposed.context)!;
    const progression = buildTeachingProgressionView({
      path,
      pathContext: decomposed.context,
      scope: "concept-family",
      focusConceptId: path.concepts[0]!.conceptId,
    });
    expect(progression.total).toBeGreaterThan(1);
    expect(progression.currentIndex).toBe(0);
    expect(progression.nextConceptTitle).toBeTruthy();
  });

  it("lesson focuses one concept while path stays multi-concept", () => {
    const understood = understandLearningTarget("Teach me Java inheritance")!;
    const base = resolveTeachingKnowledgeContext("Java inheritance")!;
    const decomposed = decomposeTeachConceptsDeterministic({
      context: base,
      understood,
    });
    const focusId = decomposed.context.concepts[0]!.id;
    const focused = focusTeachingContextForLesson(
      decomposed.context,
      focusId,
    );
    expect(focused.concepts.length).toBe(1);
    expect(decomposed.context.concepts.length).toBeGreaterThan(1);
  });

  it("Orchestrator: incorrect → reteach; correct+recall → advance", () => {
    const understood = understandLearningTarget("Teach me Java inheritance")!;
    const base = resolveTeachingKnowledgeContext("Java inheritance")!;
    const decomposed = decomposeTeachConceptsDeterministic({
      context: base,
      understood,
    });
    const ids = decomposed.context.concepts.map((c) => c.id);
    const first = ids[0]!;
    const second = ids[1]!;

    const incorrect = decideKnowledgeLoop({
      target: "Java inheritance",
      knowledge: decomposed.context,
      statesByConceptId: new Map([
        [
          first,
          {
            userId: "u",
            conceptId: first,
            exposureCount: 1,
            attemptCount: 1,
            correctCount: 0,
            incorrectCount: 1,
            lastOutcome: "incorrect",
            updatedAt: new Date().toISOString(),
          },
        ],
      ]),
      evidence: [],
    });
    expect(incorrect.action).toBe("reteach");

    const evidence: LearningEvidence[] = [
      {
        id: "e1",
        userId: "u",
        type: "recall_result",
        conceptId: first,
        outcome: "correct",
        occurredAt: new Date(),
      },
    ];
    const ready = decideKnowledgeLoop({
      target: "Java inheritance",
      knowledge: decomposed.context,
      statesByConceptId: new Map([
        [
          first,
          {
            userId: "u",
            conceptId: first,
            exposureCount: 1,
            attemptCount: 1,
            correctCount: 1,
            incorrectCount: 0,
            lastOutcome: "correct",
            updatedAt: new Date().toISOString(),
          },
        ],
        [
          second,
          {
            userId: "u",
            conceptId: second,
            exposureCount: 0,
            attemptCount: 0,
            correctCount: 0,
            incorrectCount: 0,
            updatedAt: new Date().toISOString(),
          },
        ],
      ]),
      evidence,
    });
    expect(ready.action).toBe("advance");
    expect(ready.nextConceptId).toBe(second);
  });

  it("needs-recall when understood but recall missing", () => {
    const understood = understandLearningTarget("Teach me Java inheritance")!;
    const base = resolveTeachingKnowledgeContext("Java inheritance")!;
    const decomposed = decomposeTeachConceptsDeterministic({
      context: base,
      understood,
    });
    const first = decomposed.context.concepts[0]!.id;
    const d = decideKnowledgeLoop({
      target: "Java inheritance",
      knowledge: decomposed.context,
      statesByConceptId: new Map([
        [
          first,
          {
            userId: "u",
            conceptId: first,
            exposureCount: 1,
            attemptCount: 1,
            correctCount: 1,
            incorrectCount: 0,
            lastOutcome: "correct",
            updatedAt: new Date().toISOString(),
          },
        ],
      ]),
      evidence: [
        {
          id: "p1",
          userId: "u",
          type: "practice_attempt",
          conceptId: first,
          outcome: "correct",
          occurredAt: new Date(),
        },
      ],
    });
    expect(d.action).toBe("recall");
  });

  it("returning learner resumes via focus concept (not forced restart)", () => {
    const understood = understandLearningTarget("Teach me marketing")!;
    const base = resolveTeachingKnowledgeContext("marketing")!;
    const decomposed = decomposeTeachConceptsDeterministic({
      context: base,
      understood,
    });
    const second = decomposed.context.concepts[1]!.id;
    const focus = resolveTeachFocusConceptId({
      pathContext: decomposed.context,
      action: "teach",
      conceptId: second,
    });
    expect(focus).toBe(second);
    const progression = buildTeachingProgressionView({
      path: learningPathFromTeachingContext(decomposed.context, {
        currentConceptId: second,
      }),
      pathContext: decomposed.context,
      scope: "concept-family",
      focusConceptId: second,
    });
    expect(progression.currentIndex).toBeGreaterThan(0);
  });

  it("vocabulary expansion is general — not marketing-only", () => {
    const inheritance = resolveTeachingKnowledgeContext("Java inheritance")!;
    const units = expandVocabularyTeachingUnits(
      inheritance.primaryConcept!,
      "java-inheritance",
    );
    expect(units.length).toBeGreaterThanOrEqual(2);
    expect(units.every((u) => u.id.startsWith("general:"))).toBe(true);
  });
});

describe("Bundle D — Source + Core + Product (D3)", () => {
  it("activity distinctions preserved", () => {
    expect(detectLearningActivity("Teach me marketing")).toBe("teach");
    expect(detectLearningActivity("Explain segmentation")).toBe("explain");
    expect(detectLearningActivity("Quiz me on segmentation")).toBe("practice");
    expect(detectLearningActivity("Help me remember segmentation")).toBe(
      "recall",
    );
    expect(detectLearningActivity("Give me practice on segmentation")).toBe(
      "practice",
    );
  });

  it("Core → association → Teach path for ArrayList note", () => {
    const associations = associateConceptsFromText(
      "ArrayList stores multiple objects in a resizable array in Java.",
      { title: "ArrayList notes" },
    );
    expect(associations.some((a) => a.conceptId === "java-arraylist")).toBe(
      true,
    );
    const ctx = resolveTeachingKnowledgeContext("java-arraylist")!;
    const understood = understandLearningTarget("Teach me ArrayList in Java")!;
    const decomposed = decomposeTeachConceptsDeterministic({
      context: ctx,
      understood,
    });
    expect(decomposed.context.concepts.length).toBeGreaterThanOrEqual(1);
  });

  it("low-information note does not force association", () => {
    expect(associateConceptsFromText("ok").length).toBe(0);
  });

  it("AI failure falls back to deterministic decomposition for KL topics", async () => {
    const understood = understandLearningTarget("Teach me marketing")!;
    const base = resolveTeachingKnowledgeContext("marketing")!;
    const result = await decomposeTeachConcepts({
      context: base,
      understood,
      generalProvider: createMockGeneralKnowledgeProvider(() => null),
    });
    expect(result.context.concepts.length).toBeGreaterThanOrEqual(3);
  });

  it("six-lesson route wires Bundle D teach progression (additive API)", () => {
    const route = readFileSync(
      path.join(process.cwd(), "app/api/study/six-lesson/route.ts"),
      "utf8",
    );
    expect(route).toContain("decomposeTeachConcepts");
    expect(route).toContain("teachingProgression");
    expect(route).toContain("focusTeachingContextForLesson");
    expect(route).toContain("teachingDepthBlockFromProgression");
  });

  it("Teach UI shows progression without redesign", () => {
    const ui = readFileSync(
      path.join(
        process.cwd(),
        "src/components/study/TeachFirstLearnActivity.tsx",
      ),
      "utf8",
    );
    const header = readFileSync(
      path.join(
        process.cwd(),
        "src/components/study/learning-workspace/LearningWorkspaceHeader.tsx",
      ),
      "utf8",
    );
    expect(ui).toContain("teachingProgression");
    expect(ui).toContain("LearningWorkspaceHeader");
    expect(header).toContain("data-teach-progression");
  });

  it("no prisma migration / schema changes in Bundle D teach module", () => {
    const teachDir = path.join(process.cwd(), "src/lib/learning/teach");
    const files = [
      "scope.ts",
      "decompose.ts",
      "depth.ts",
      "focus.ts",
      "validate-path.ts",
      "resolve-teach.ts",
      "index.ts",
    ];
    for (const f of files) {
      const src = readFileSync(path.join(teachDir, f), "utf8");
      expect(src).not.toMatch(/prisma\.(db push|migrate)/i);
      expect(src).not.toMatch(/schema\.prisma/);
    }
  });
});

describe("Bundle D — multi-subject coverage", () => {
  beforeEach(() => {
    resetDynamicPathsForTests();
    resetGeneralTeachingRegistryForTests();
  });

  it.each([
    ["Teach me Intro to Business marketing", "marketing"],
    ["Teach me Java inheritance", "inheritance"],
    ["Teach me supply and demand", "supply"],
  ])("%s expands to multi-concept path when KL resolves", (request) => {
    const understood = understandLearningTarget(request)!;
    const topic = understood.topic;
    const base =
      resolveTeachingKnowledgeContext(topic) ??
      resolveTeachingKnowledgeContext(request);
    if (!base) {
      // Unknown KL — still has teach scope for later general retrieval.
      expect(detectTeachScope(understood)).not.toBe("focused-concept");
      return;
    }
    const decomposed = decomposeTeachConceptsDeterministic({
      context: base,
      understood,
    });
    if (shouldExpand(understood)) {
      expect(decomposed.context.concepts.length).toBeGreaterThanOrEqual(2);
    }
  });
});

function shouldExpand(
  understood: NonNullable<ReturnType<typeof understandLearningTarget>>,
) {
  const scope = detectTeachScope(understood);
  return (
    understood.activity === "teach" &&
    (scope === "concept-family" ||
      scope === "broad-subject" ||
      scope === "course-section")
  );
}
