/**
 * Bundle A Phase 11 — Dynamic Learning Paths integrity.
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockGeneralKnowledgeProvider,
  isSafePathConceptId,
  learningPathFromTeachingContext,
  nextConceptOnPath,
  preferCanonicalPathTarget,
  resetDynamicPathsForTests,
  resetGeneralTeachingRegistryForTests,
  retrieveTeachingKnowledge,
  toTeachingKnowledgeContext,
} from "@/lib/learning/knowledge/retrieval";
import {
  matchKnowledgeLearningPath,
  resolveTeachingKnowledgeContext,
} from "@/lib/learning/knowledge/teaching-knowledge-context";
import { decideKnowledgeLoop } from "@/lib/learning/orchestrator/knowledge-loop";
import "@/lib/learning/knowledge/packs";

/** Psychology is now in the Knowledge Library — use this for dynamic/general paths. */
const UNKNOWN_TOPIC = "obscure quantum gardening theory xyz";

function mockUnknownTopic() {
  return {
    targetTitle: "Quantum gardening",
    subject: "quantum-gardening",
    domain: "general" as const,
    summary:
      "Quantum gardening is a fictional study topic used only to exercise Universal Retrieval when no canonical Knowledge Library pack exists, covering foundations, methods, and practice for learners.",
    concepts: [
      {
        id: "foundations",
        title: "Foundations",
        explanation:
          "Introduces the fictional framing so retrieval can assemble a non-canonical teaching path without promoting content to the Knowledge Library.",
      },
      {
        id: "methods",
        title: "Methods",
        explanation:
          "Methods include careful measurement of fictional readings so claims can be tested in the exercise without inventing external citations.",
      },
      {
        id: "practice",
        title: "Practice",
        explanation:
          "Practice gives a second staged concept so sequence and orchestration still have something to teach after the first chunk.",
      },
    ],
    suggestedSequence: ["foundations", "methods", "practice"],
  };
}

describe("Phase 11 — Dynamic Learning Paths", () => {
  beforeEach(() => {
    resetDynamicPathsForTests();
    resetGeneralTeachingRegistryForTests();
  });

  it("canonical KL path remains preferred", () => {
    expect(preferCanonicalPathTarget("Java Programming fundamentals")).toBe(
      true,
    );
    expect(preferCanonicalPathTarget("ArrayList in Java")).toBe(true);
    const ctx = resolveTeachingKnowledgeContext("Java Programming fundamentals")!;
    const path = learningPathFromTeachingContext(ctx)!;
    expect(path.canonical).toBe(true);
    expect(path.source).toBe("knowledge-library");
    expect(matchKnowledgeLearningPath("Java Programming fundamentals")?.id).toBe(
      path.id,
    );
  });

  it("general topic can produce validated dynamic concepts", async () => {
    const result = await retrieveTeachingKnowledge({
      target: `Teach me ${UNKNOWN_TOPIC}`,
      generalProvider: createMockGeneralKnowledgeProvider(() => mockUnknownTopic()),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ctx = toTeachingKnowledgeContext(result.knowledge);
    const path = learningPathFromTeachingContext(ctx)!;
    expect(path.canonical).toBe(false);
    expect(path.concepts.length).toBeGreaterThanOrEqual(2);
    expect(path.concepts.every((c) => c.conceptId.startsWith("general:"))).toBe(
      true,
    );
  });

  it("invalid/fabricated concept IDs rejected", () => {
    const allowed = new Set(["general:quantum-gardening:practice"]);
    expect(isSafePathConceptId("java-fabricated-pack", allowed)).toBe(false);
    expect(isSafePathConceptId("general:quantum-gardening:fake", allowed)).toBe(
      false,
    );
    expect(
      isSafePathConceptId("general:quantum-gardening:practice", allowed),
    ).toBe(true);
  });

  it("advancement uses existing Orchestrator", async () => {
    const result = await retrieveTeachingKnowledge({
      target: `Teach me ${UNKNOWN_TOPIC}`,
      generalProvider: createMockGeneralKnowledgeProvider(() => mockUnknownTopic()),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ctx = toTeachingKnowledgeContext(result.knowledge);
    const path = learningPathFromTeachingContext(ctx)!;
    const decision = decideKnowledgeLoop({
      target: UNKNOWN_TOPIC,
      knowledge: ctx,
      statesByConceptId: new Map(),
      evidence: [],
    });
    expect(["teach", "practice", "reteach", "recall", "advance", "complete"]).toContain(
      decision.action,
    );
    // Path next concept never fabricated outside path.
    const next = nextConceptOnPath(path);
    if (next) {
      expect(path.concepts.some((c) => c.conceptId === next)).toBe(true);
    }
  });

  it("no automatic KL promotion for dynamic paths", async () => {
    const result = await retrieveTeachingKnowledge({
      target: `Teach me ${UNKNOWN_TOPIC}`,
      generalProvider: createMockGeneralKnowledgeProvider(() => mockUnknownTopic()),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ctx = toTeachingKnowledgeContext(result.knowledge);
    const path = learningPathFromTeachingContext(ctx)!;
    expect(path.canonical).toBe(false);
    expect(resolveTeachingKnowledgeContext(UNKNOWN_TOPIC)).toBeNull();
    expect(
      path.id.startsWith("dynamic:") ||
        path.id.includes("quantum") ||
        path.id.includes("gardening"),
    ).toBe(true);
  });

  it("stable concept identity across path build", async () => {
    const result = await retrieveTeachingKnowledge({
      target: `Teach me ${UNKNOWN_TOPIC}`,
      generalProvider: createMockGeneralKnowledgeProvider(() => mockUnknownTopic()),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ctx = toTeachingKnowledgeContext(result.knowledge);
    const a = learningPathFromTeachingContext(ctx)!;
    const b = learningPathFromTeachingContext(ctx)!;
    expect(a.concepts.map((c) => c.conceptId)).toEqual(
      b.concepts.map((c) => c.conceptId),
    );
  });

  it("single-concept topics still work", () => {
    const ctx = resolveTeachingKnowledgeContext("ArrayList in Java")!;
    expect(ctx.resolution).toBe("single-concept");
    const path = learningPathFromTeachingContext(ctx)!;
    expect(path.concepts.length).toBe(1);
    expect(path.source).toBe("knowledge-library");
    expect(path.canonical).toBe(true);
  });
});
