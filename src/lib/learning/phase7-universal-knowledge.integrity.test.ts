/**
 * Phase 7 — Universal Knowledge & Teaching Retrieval integrity suite.
 * Uses deterministic mock general provider — no live network/AI.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { buildSubjectAwareFallbackLesson } from "@/lib/csl/six-worked-lesson";
import {
  formatKnowledgeLibraryPromptBlock,
  lessonFromTeachingKnowledgeContext,
  resolveTeachingKnowledgeContext,
} from "@/lib/learning/knowledge/teaching-knowledge-context";
import {
  createMockGeneralKnowledgeProvider,
  generalRootConceptId,
  isGeneralTopicConceptId,
  isProtectedSpecializedTopic,
  normalizeLearningTarget,
  resetGeneralTeachingRegistryForTests,
  retrieveTeachingKnowledge,
  resolveTeachingKnowledgeForLearn,
  toTeachingKnowledgeContext,
  validateGeneralTeachingKnowledge,
  type GeneralTeachingKnowledge,
} from "@/lib/learning/knowledge/retrieval";
import {
  getLearnerConceptState,
  isRegisteredKnowledgeConceptId,
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
import "@/lib/learning/knowledge/packs";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

function mockKnowledgeFor(
  title: string,
  conceptTitles: string[],
): GeneralTeachingKnowledge {
  const concepts = conceptTitles.map((t, i) => {
    const id = t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return {
      id,
      title: t,
      explanation: `${t} is a core idea within ${title}. Learners should understand how it fits the broader subject, why it matters, and one concrete example that makes the idea usable in practice rather than as a memorized label.`,
      examples: [`Example involving ${t} in ${title}.`],
      misconceptions: [`Confusing ${t} with an unrelated everyday meaning.`],
      vocabulary: [t.split(" ")[0]!.toLowerCase()],
      practiceIdeas: [`Explain ${t} in your own words.`],
      recallPrompts: [`What is ${t}?`],
      prerequisites: i > 0 ? [conceptTitles[0]!] : [],
    };
  });
  return {
    targetTitle: title,
    subject: title.toLowerCase(),
    domain: "science",
    summary: `${title} is taught here as an introductory sequence covering foundational ideas, methods, and applications so a learner can begin with real instructional substance rather than vague tips.`,
    concepts,
    suggestedSequence: concepts.map((c) => c.id),
    limitations: ["Introductory coverage only — not a complete discipline survey."],
  };
}

function providerForTopics(map: Record<string, string[]>) {
  return createMockGeneralKnowledgeProvider((target) => {
    const key = Object.keys(map).find((k) =>
      target.normalizedTitle.toLowerCase().includes(k.toLowerCase()),
    );
    if (!key) return null;
    return mockKnowledgeFor(target.normalizedTitle, map[key]!);
  });
}

const BROAD_PROVIDER = providerForTopics({
  psychology: [
    "What psychology studies",
    "Research methods",
    "Biological foundations",
    "Learning",
    "Memory",
    "Cognition",
  ],
  folklore: [
    "What folklore studies",
    "Narrative forms",
    "Cultural transmission",
    "Ritual and belief",
    "Comparative methods",
  ],
  anthropology: [
    "What anthropology studies",
    "Cultural systems",
    "Field methods",
    "Meaning and practice",
    "Comparative analysis",
  ],
  trigonometry: [
    "Right triangles",
    "Angles",
    "Sine cosine tangent",
    "Inverse trig",
    "Applications",
  ],
  "world war": [
    "Causes of World War II",
    "Major theaters",
    "Key turning points",
    "Home fronts",
    "Aftermath",
  ],
  anatomy: [
    "Body organization",
    "Skeletal system",
    "Muscular system",
    "Organ systems overview",
  ],
  accounting: [
    "Accounting purpose",
    "Assets and liabilities",
    "The accounting equation",
    "Financial statements intro",
  ],
  martian: [
    "Survey goals",
    "Remote sensing",
    "Surface processes",
    "Sample strategies",
    "Mission constraints",
  ],
  weaving: [
    "Historical crafts",
    "Materials",
    "Technique lineages",
    "Cultural context",
    "Documentation methods",
  ],
});

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
    source: partial.source ?? "test",
    eventKey: partial.eventKey,
  };
}

describe("Phase 7 — Target + identity", () => {
  beforeEach(() => {
    resetGeneralTeachingRegistryForTests();
    resetLearnerStateForTests();
  });

  it("normalizes teach-me framing without inventing levels", () => {
    const t = normalizeLearningTarget("Teach me psychology.")!;
    expect(t.normalizedTitle.toLowerCase()).toContain("psychology");
    expect(t.slug).toBe("psychology");
    expect(t.requestedLevel).toBeUndefined();
  });

  it("protects OOD specialized topics from general retrieval", () => {
    expect(isProtectedSpecializedTopic("Classes & Objects")).toBe(true);
    expect(isGeneralTopicConceptId("general:psychology")).toBe(true);
    expect(isGeneralTopicConceptId("java-arraylist")).toBe(false);
    expect(isRegisteredKnowledgeConceptId("java-arraylist")).toBe(true);
    expect(isRegisteredKnowledgeConceptId("general:psychology")).toBe(true);
    expect(isRegisteredKnowledgeConceptId("fake-made-up-concept")).toBe(false);
  });
});

describe("Phase 7 — Provider selection", () => {
  beforeEach(() => {
    resetGeneralTeachingRegistryForTests();
  });

  it("Case A — known KL concept prefers Knowledge Library over AI", async () => {
    const result = await retrieveTeachingKnowledge({
      target: "Java ArrayList",
      generalProvider: BROAD_PROVIDER,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.knowledge.sourceKind).toBe("knowledge-library");
    expect(result.knowledge.concepts.some((c) => c.id === "java-arraylist")).toBe(
      true,
    );
  });

  it("Case B — unknown topic with course material uses course grounding", async () => {
    const grounding = `
Chapter 1 — Introduction to Cognitive Science
Cognitive science studies mind and intelligence through interdisciplinary methods.
Researchers combine psychology, neuroscience, and computation to explain perception,
memory, and decision making with concrete experimental paradigms and models.
Students should contrast behavioral evidence with neural evidence and avoid treating
everyday folk psychology as scientific measurement. Worked examples include reaction-time
tasks and simple neural-network metaphors for pattern recognition in classroom labs.
`.repeat(2);
    const result = await retrieveTeachingKnowledge({
      target: "Teach me cognitive science",
      groundingText: grounding,
      disableGeneralAi: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.knowledge.sourceKind).toBe("course-material");
    expect(result.knowledge.grounding?.length).toBeGreaterThan(0);
    expect(result.knowledge.concepts.every((c) => c.id.startsWith("general:"))).toBe(
      true,
    );
  });

  it("Case C — unknown topic without material uses general provider", async () => {
    for (const topic of [
      "plane trigonometry",
      "World War II",
      "cognitive anthropology of folklore",
      "underwater basket weaving history",
      "martian geology survey methods",
    ]) {
      const result = await retrieveTeachingKnowledge({
        target: `Teach me ${topic}`,
        generalProvider: BROAD_PROVIDER,
      });
      expect(result.ok, topic).toBe(true);
      if (!result.ok) continue;
      expect(result.knowledge.sourceKind).toBe("general-ai");
      expect(result.knowledge.concepts.length).toBeGreaterThanOrEqual(2);
      expect(
        result.knowledge.concepts.every((c) => isGeneralTopicConceptId(c.id)),
      ).toBe(true);
    }
  });

  it("Case D — general provider failure fails honestly", async () => {
    const result = await retrieveTeachingKnowledge({
      target: "Teach me underwater basket weaving",
      generalProvider: createMockGeneralKnowledgeProvider(() => null),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/provider-failed|no-provider|invalid/);
  });

  it("Case E — invalid/thin general knowledge is rejected", async () => {
    const result = await retrieveTeachingKnowledge({
      target: "Teach me astronomy",
      generalProvider: createMockGeneralKnowledgeProvider(() => ({
        targetTitle: "Astronomy",
        summary: "Short.",
        concepts: [{ id: "a", title: "A", explanation: "Too short." }],
      })),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("invalid-knowledge");
  });

  it("OOD protected path is not routed through general retrieval", async () => {
    const result = await retrieveTeachingKnowledge({
      target: "Classes & Objects",
      generalProvider: BROAD_PROVIDER,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("protected-specialized-path");
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Classes & Objects",
    );
    expect(lesson!.chunks[0]?.explanation.toLowerCase()).toMatch(/dealership|cars/);
  });
});

describe("Phase 7 — Teaching context + lesson", () => {
  beforeEach(() => {
    resetGeneralTeachingRegistryForTests();
  });

  it("builds TeachingKnowledgeContext and deterministic lesson from general knowledge", async () => {
    const result = await retrieveTeachingKnowledge({
      target: "Teach me cognitive anthropology of folklore",
      generalProvider: BROAD_PROVIDER,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ctx = toTeachingKnowledgeContext(result.knowledge);
    expect(ctx.source).toBe("general-ai");
    expect(ctx.resolution).toBe("general-retrieval");
    expect(ctx.concepts[0]?.id.startsWith("general:")).toBe(true);
    expect(ctx.pack?.id.startsWith("retrieval:")).toBe(true);

    const block = formatKnowledgeLibraryPromptBlock(ctx);
    expect(block).toMatch(/GENERAL|RETRIEVED/i);
    expect(block).not.toMatch(/Authoritative instructional knowledge from Study Haul's Knowledge Library/);

    const lesson = lessonFromTeachingKnowledgeContext(
      "detailed-explanation",
      "cognitive anthropology of folklore",
      ctx,
    );
    expect(lesson.chunks.length).toBeGreaterThanOrEqual(2);
    expect(lesson.chunks[0]!.explanation.length).toBeGreaterThan(40);
  });

  it("psychology is real canonical Library knowledge; unknown topics stay unresolved in KL", async () => {
    expect(resolveTeachingKnowledgeContext("psychology")?.source).toBe(
      "knowledge-library",
    );
    expect(resolveTeachingKnowledgeContext("quantum gardening")).toBeNull();
    expect(resolveTeachingKnowledgeContext("java-arraylist")?.source).toBe(
      "knowledge-library",
    );
  });

  it("resolveTeachingKnowledgeForLearn prefers KL for ArrayList", async () => {
    const ctx = await resolveTeachingKnowledgeForLearn({
      target: "ArrayList in Java",
      generalProvider: BROAD_PROVIDER,
    });
    expect(ctx?.source).toBe("knowledge-library");
    expect(ctx?.primaryConcept?.id).toBe("java-arraylist");
  });
});

describe("Phase 7 — Learner loop for general topic", () => {
  beforeEach(() => {
    resetGeneralTeachingRegistryForTests();
    resetLearnerStateForTests();
  });

  it("teach → exposure → practice → incorrect → reteach → correct → recall → advance/complete", async () => {
    const retrieved = await retrieveTeachingKnowledge({
      target: "Teach me cognitive anthropology of folklore",
      generalProvider: BROAD_PROVIDER,
    });
    expect(retrieved.ok).toBe(true);
    if (!retrieved.ok) return;
    const knowledge = toTeachingKnowledgeContext(retrieved.knowledge);
    const firstId = knowledge.concepts[0]!.id;
    const secondId = knowledge.concepts[1]!.id;

    const decide = (
      states: Record<string, LearnerConceptState | null>,
      evidence: LearningEvidence[] = [],
    ) =>
      decideKnowledgeLoop({
        target: "cognitive anthropology of folklore",
        knowledge,
        statesByConceptId: new Map(Object.entries(states)),
        evidence,
      });

    expect(decide({}).action).toBe("teach");

    await recordLearningEvidence({
      userId: "u",
      type: "lesson_exposure",
      conceptId: firstId,
      outcome: "completed",
      eventKey: "p7:exp1",
    });
    let state = (await getLearnerConceptState("u", firstId))!;
    expect(decide({ [firstId]: state }).action).toBe("practice");

    await recordLearningEvidence({
      userId: "u",
      type: "application_attempt",
      conceptId: firstId,
      outcome: "incorrect",
      eventKey: "p7:app1",
    });
    state = (await getLearnerConceptState("u", firstId))!;
    expect(decide({ [firstId]: state }, await listEvidence("u")).action).toBe(
      "reteach",
    );

    const personalized = buildPersonalizedTeachingContext({
      knowledge,
      statesByConceptId: new Map([[firstId, state]]),
    });
    const base = lessonFromTeachingKnowledgeContext(
      "detailed-explanation",
      "cognitive anthropology of folklore",
      knowledge,
    );
    const reteach = applyPersonalizationToLibraryLesson(base, personalized, {
      reteachEmphasis: true,
    });
    expect(reteach.learningFrame).toMatch(/misconception|contrast/i);

    await recordLearningEvidence({
      userId: "u",
      type: "application_attempt",
      conceptId: firstId,
      outcome: "correct",
      eventKey: "p7:app2",
    });
    state = (await getLearnerConceptState("u", firstId))!;
    expect(decide({ [firstId]: state }, await listEvidence("u")).action).toBe(
      "recall",
    );

    await recordLearningEvidence({
      userId: "u",
      type: "recall_result",
      conceptId: firstId,
      outcome: "correct",
      eventKey: "p7:rec1",
    });
    state = (await getLearnerConceptState("u", firstId))!;
    const evidence = await listEvidence("u");
    const advanced = decide({ [firstId]: state }, evidence);
    expect(advanced.action).toBe("advance");
    expect(advanced.nextConceptId).toBe(secondId);
    expect(advanced.nextConceptId).toMatch(/^general:/);

    const exec = executeKnowledgeLearningAction(advanced, {
      topic: "cognitive anthropology of folklore",
    });
    expect(exec.destination.kind).toBe("learn");
    expect(exec.learnerLabel.length).toBeGreaterThan(0);
  });

  it("eventKey dedupe works for general topic identities", async () => {
    const id = generalRootConceptId("psychology");
    expect(isRegisteredKnowledgeConceptId(id)).toBe(true);
    await recordLearningEvidence({
      userId: "u",
      type: "practice_attempt",
      conceptId: id,
      outcome: "correct",
      eventKey: "dup-general",
    });
    await recordLearningEvidence({
      userId: "u",
      type: "practice_attempt",
      conceptId: id,
      outcome: "correct",
      eventKey: "dup-general",
    });
    expect((await getLearnerConceptState("u", id))?.attemptCount).toBe(1);
  });

  it("continuation reuses registered general context without inventing next ids", async () => {
    const first = await retrieveTeachingKnowledge({
      target: "cognitive anthropology of folklore",
      generalProvider: BROAD_PROVIDER,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const ctx1 = toTeachingKnowledgeContext(first.knowledge);
    const second = await retrieveTeachingKnowledge({
      target: "Teach me cognitive anthropology of folklore",
      generalProvider: createMockGeneralKnowledgeProvider(() => {
        throw new Error("should not call provider when cached");
      }),
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    const ctx2 = toTeachingKnowledgeContext(second.knowledge);
    expect(ctx2.concepts.map((c) => c.id)).toEqual(ctx1.concepts.map((c) => c.id));
  });

  it("does not advance to fabricated concept ids", () => {
    const knowledge = {
      target: "psychology",
      domain: "science" as const,
      subject: "psychology",
      pack: null,
      concepts: [
        {
          id: "general:psychology:intro",
          title: "Intro",
          explanation: "Intro explanation with enough substance for teaching about psychology foundations in practice.",
        },
      ],
      primaryConcept: {
        id: "general:psychology:intro",
        title: "Intro",
        explanation: "Intro explanation with enough substance for teaching about psychology foundations in practice.",
      },
      source: "general-ai" as const,
      resolution: "general-retrieval" as const,
      learningPathId: "general-path:psychology",
    };
    const ready = emptyState("general:psychology:intro", {
      exposureCount: 1,
      attemptCount: 1,
      correctCount: 1,
      lastOutcome: "correct",
    });
    const d = decideKnowledgeLoop({
      target: "psychology",
      knowledge,
      statesByConceptId: new Map([["general:psychology:intro", ready]]),
      evidence: [
        ev({ type: "practice_attempt", conceptId: "general:psychology:intro" }),
        ev({ type: "recall_result", conceptId: "general:psychology:intro" }),
      ],
    });
    expect(d.action).toBe("complete");
    expect(d.nextConceptId ?? null).toBeNull();
    expect(
      isConceptReadyToAdvance(
        summarizeConceptEvidence("general:psychology:intro", ready, [
          ev({ type: "practice_attempt", conceptId: "general:psychology:intro" }),
          ev({ type: "recall_result", conceptId: "general:psychology:intro" }),
        ]),
      ),
    ).toBe(true);
  });
});

describe("Phase 7 — Validation + preservation", () => {
  it("validateGeneralTeachingKnowledge rejects target mismatch", () => {
    const target = normalizeLearningTarget("psychology")!;
    const v = validateGeneralTeachingKnowledge(
      {
        targetTitle: "Basket Weaving",
        summary:
          "Basket weaving uses reeds and patterns across many cultures with detailed technique discussion for beginners who want craft skills.",
        concepts: [
          {
            id: "reeds",
            title: "Reeds",
            explanation:
              "Choosing reeds carefully matters for durable baskets and is unrelated to mental processes studied in laboratories.",
          },
          {
            id: "patterns",
            title: "Patterns",
            explanation:
              "Weave patterns create structure and aesthetics in finished baskets through repeated Motifs and tension control.",
          },
        ],
      },
      target,
    );
    expect(v.accepted).toBe(false);
    expect(v.reasons).toContain("target-mismatch");
  });

  it("six-lesson route wires retrieval additively", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("resolveTeachingKnowledgeForLearn");
    expect(route).toContain("knowledgeSource");
    expect(route).toContain("resolveTeachingKnowledgeContext");
  });

  it("Lucky / ULE / OOD surfaces remain intact", () => {
    expect(read("src/lib/learning/retention/schedule.ts")).toMatch(/SM-2|flashcard_sm2/i);
    expect(read("src/lib/csl/six-worked-lesson.ts")).toContain("specializedChunkingLesson");
    expect(resolveTeachingKnowledgeContext("Classes & Objects")).toBeNull();
  });
});
