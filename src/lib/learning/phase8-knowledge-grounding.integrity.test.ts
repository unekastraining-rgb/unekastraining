/**
 * Phase 8 — Knowledge Retrieval, Grounding & Source Intelligence integrity suite.
 * Deterministic mocks only — no live web/AI network calls.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { buildSubjectAwareFallbackLesson } from "@/lib/csl/six-worked-lesson";
import { validateAiLesson } from "@/lib/csl/validate-ai-lesson";
import {
  formatKnowledgeLibraryPromptBlock,
  resolveTeachingKnowledgeContext,
} from "@/lib/learning/knowledge/teaching-knowledge-context";
import {
  allowedSourceReferences,
  buildKnowledgeGroundingContext,
  createMockExternalKnowledgeProvider,
  createMockGeneralKnowledgeProvider,
  knowledgeSourceApiView,
  resetGeneralTeachingRegistryForTests,
  retrieveTeachingKnowledge,
  sanitizeExternalSnippets,
  toTeachingKnowledgeContext,
  validateLessonSourceIntegrity,
  type GeneralTeachingKnowledge,
} from "@/lib/learning/knowledge/retrieval";
import {
  getLearnerConceptState,
  recordLearningEvidence,
  resetLearnerStateForTests,
} from "@/lib/learning/learner-state";
import { decideKnowledgeLoop } from "@/lib/learning/orchestrator/knowledge-loop";
import "@/lib/learning/knowledge/packs";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

/** Psychology / photosynthesis are now Knowledge Library topics — use this for general-ai paths. */
const UNKNOWN_TOPIC = "obscure quantum gardening theory xyz";

function mockUnknownTopic(): GeneralTeachingKnowledge {
  return {
    targetTitle: "Quantum gardening",
    subject: "quantum-gardening",
    domain: "general",
    summary:
      "Quantum gardening is a fictional study topic used only to exercise Universal Retrieval when no canonical Knowledge Library pack exists, covering foundations and practice ideas for learners.",
    concepts: [
      {
        id: "foundations",
        title: "Foundations",
        explanation:
          "Introduces the fictional framing so retrieval can assemble a non-canonical teaching path without promoting content to the Knowledge Library or claiming web research.",
        examples: ["A classroom thought experiment about fictional plant sensors."],
        misconceptions: ["Quantum gardening is a real licensed curriculum."],
      },
      {
        id: "methods",
        title: "Methods",
        explanation:
          "Methods in this mock include careful measurement of fictional readings so claims can be tested in the exercise without inventing external citations.",
        examples: ["Record fictional sensor readings twice."],
        misconceptions: ["Any number proves the theory."],
      },
      {
        id: "practice",
        title: "Practice ideas",
        explanation:
          "Practice ideas give a second staged concept so sequence and orchestration still have something to teach after the first chunk without canonical promotion.",
        examples: ["Explain one limitation of the fictional model."],
        misconceptions: ["Practice equals mastery."],
      },
    ],
    suggestedSequence: ["foundations", "methods", "practice"],
    limitations: ["Fictional coverage only — not Knowledge Library content."],
  };
}

const UNKNOWN_PROVIDER = createMockGeneralKnowledgeProvider(() =>
  mockUnknownTopic(),
);

const COURSE_TEXT = `
Chapter — Cognitive Anthropology Survey
Cognitive anthropology studies how cultural groups organize knowledge and meaning.
Schemas, cultural models, and ethnoscience methods help explain how people classify
plants, kinship, and illness across communities. Worked classroom examples contrast
folk taxonomies with scientific categories without treating either as automatic truth.
Learners practice eliciting categories and comparing them carefully with evidence.
`.repeat(2);

describe("Phase 8 — Source model & honesty", () => {
  beforeEach(() => {
    resetGeneralTeachingRegistryForTests();
    resetLearnerStateForTests();
  });

  it("A — KL priority for ArrayList (not general AI)", async () => {
    const result = await retrieveTeachingKnowledge({
      target: "ArrayList in Java",
      generalProvider: UNKNOWN_PROVIDER,
      externalProvider: createMockExternalKnowledgeProvider(() => [
        {
          source: {
            kind: "retrieved-web",
            title: "Should not win",
            reference: "https://example.org/arraylist",
          },
          content: "x".repeat(80),
        },
      ]),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.knowledge.sourceKind).toMatch(/knowledge-library|combined/);
    expect(result.knowledge.concepts.some((c) => c.id === "java-arraylist")).toBe(
      true,
    );
    expect(result.knowledge.sources?.some((s) => s.kind === "knowledge-library")).toBe(
      true,
    );
  });

  it("B — unknown topic uses general-ai with honest metadata", async () => {
    const result = await retrieveTeachingKnowledge({
      target: `Teach me ${UNKNOWN_TOPIC}`,
      generalProvider: UNKNOWN_PROVIDER,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.knowledge.sourceKind).toBe("general-ai");
    expect(result.knowledge.sources?.some((s) => s.kind === "general-ai")).toBe(
      true,
    );
    expect(result.knowledge.sources?.some((s) => s.kind === "retrieved-web")).toBe(
      false,
    );
    expect(result.knowledge.limitations?.join(" ")).toMatch(/not web|not.*retrieval/i);
    const api = knowledgeSourceApiView(result.knowledge);
    expect(api.kind).toBe("general-ai");
    expect(api.sources?.every((s) => s.kind !== "retrieved-web")).toBe(true);
  });

  it("C — course grounding preserves course-material provenance", async () => {
    const result = await retrieveTeachingKnowledge({
      target: "Teach me cognitive anthropology using my course material",
      groundingText: `
Chapter — Cognitive Anthropology
Cognitive anthropology studies how cultural groups organize knowledge and meaning.
Schemas, cultural models, and ethnoscience methods help explain how people classify
plants, kinship, and illness across communities. Worked classroom examples contrast
folk taxonomies with scientific categories without treating either as automatic truth.
Learners practice eliciting categories and comparing them carefully with evidence.
`.repeat(2),
      materialTitle: "Anthro reading PDF",
      materialId: "mat-anthro-1",
      disableGeneralAi: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.knowledge.sourceKind).toBe("course-material");
    expect(
      result.knowledge.sources?.some((s) => s.kind === "course-material"),
    ).toBe(true);
    expect(result.knowledge.groundingContext?.courseMaterials.length).toBeGreaterThan(
      0,
    );
    expect(result.knowledge.concepts.every((c) => c.id.startsWith("general:"))).toBe(
      true,
    );
  });

  it("D — user-note grounding is not promoted to KL", async () => {
    const note = `
My notes on ${UNKNOWN_TOPIC}: fictional plant sensors convert imagined readings into study prompts.
Foundations and practice stages stay separate. Do not confuse this exercise with real botany.
Professor used the phrase "thought experiment only" in lecture examples and diagrams.
`.repeat(2);
    const result = await retrieveTeachingKnowledge({
      target: `Teach me ${UNKNOWN_TOPIC} using my notes`,
      noteText: note,
      noteTitle: "Quantum gardening notes",
      noteId: "note-1",
      disableGeneralAi: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.knowledge.sourceKind).toBe("user-note");
    expect(result.knowledge.sources?.[0]?.kind).toBe("user-note");
    expect(resolveTeachingKnowledgeContext(UNKNOWN_TOPIC)).toBeNull();
  });

  it("E — external mock provider preserves real references only", async () => {
    const result = await retrieveTeachingKnowledge({
      target: `Teach me ${UNKNOWN_TOPIC}`,
      generalProvider: UNKNOWN_PROVIDER,
      externalProvider: createMockExternalKnowledgeProvider(() => [
        {
          source: {
            kind: "retrieved-web",
            title: "Encyclopedia overview",
            reference: "https://plato.stanford.edu/entries/thought-experiment/",
            provider: "mock-external",
            confidence: "medium",
          },
          content:
            "Thought experiments are structured imaginary scenarios used to clarify concepts; they are not empirical field results and should not be treated as retrieved curriculum authority.",
          relevance: 0.9,
        },
      ]),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.knowledge.sourceKind).toBe("combined");
    expect(
      result.knowledge.groundingContext?.retrievedExternal.some(
        (s) =>
          s.reference === "https://plato.stanford.edu/entries/thought-experiment/",
      ),
    ).toBe(true);
    expect(result.knowledge.sources?.some((s) => s.kind === "general-ai")).toBe(
      true,
    );
    expect(allowedSourceReferences(result.knowledge)).toContain(
      "https://plato.stanford.edu/entries/thought-experiment/",
    );
  });

  it("F — combined sources keep individual provenance", async () => {
    const result = await retrieveTeachingKnowledge({
      target: `Teach me ${UNKNOWN_TOPIC}`,
      groundingText: COURSE_TEXT,
      noteText:
        "Quantum gardening notes: foundations then practice; keep stages distinct for exams. ".repeat(
          3,
        ),
      noteTitle: "QG notes",
      generalProvider: UNKNOWN_PROVIDER,
      externalProvider: createMockExternalKnowledgeProvider(() => [
        {
          source: {
            kind: "retrieved-web",
            title: "Encyclopedia entry",
            reference: "https://plato.stanford.edu/entries/thought-experiment/",
          },
          content:
            "Thought experiment research distinguishes imaginative scenarios from empirical observation and emphasizes careful limits on what the exercise can prove.",
        },
      ]),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.knowledge.sourceKind).toBe("combined");
    const kinds = new Set(result.knowledge.sources?.map((s) => s.kind));
    expect(kinds.has("course-material")).toBe(true);
    expect(kinds.has("user-note")).toBe(true);
    expect(kinds.has("retrieved-web")).toBe(true);
    expect(kinds.has("general-ai")).toBe(true);
    expect(result.knowledge.groundingContext?.allSources.length).toBeGreaterThanOrEqual(
      4,
    );
  });

  it("G — sanitize rejects fake external references", () => {
    const { accepted, rejected } = sanitizeExternalSnippets([
      {
        source: {
          kind: "retrieved-web",
          title: "Fake",
          reference: "https://example.com/fake",
        },
        content: "x".repeat(80),
      },
      {
        source: { kind: "general-ai", title: "Wrong kind" },
        content: "y".repeat(80),
      },
      {
        source: {
          kind: "retrieved-web",
          title: "OK",
          reference: "https://edu.example.org/article",
        },
        content:
          "Valid external instructional content about the topic for learners with enough substance to teach a concrete idea.",
      },
    ]);
    expect(rejected.length).toBeGreaterThan(0);
    expect(accepted.every((a) => a.source.kind === "retrieved-web")).toBe(true);
    expect(accepted.some((a) => a.source.reference?.includes("example.com"))).toBe(
      false,
    );
    expect(accepted.some((a) => a.source.reference?.includes("edu.example.org"))).toBe(
      true,
    );
  });

  it("H — general-ai is never labeled retrieved-web", async () => {
    const result = await retrieveTeachingKnowledge({
      target: UNKNOWN_TOPIC,
      generalProvider: UNKNOWN_PROVIDER,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.knowledge.sourceKind).not.toBe("retrieved-web");
    const ctx = toTeachingKnowledgeContext(result.knowledge);
    const block = formatKnowledgeLibraryPromptBlock(ctx);
    expect(block).toMatch(/None\. Do not claim web research/i);
    expect(block).not.toMatch(/Sources found online/i);
  });

  it("I — source-aware lesson prompt sections", async () => {
    const result = await retrieveTeachingKnowledge({
      target: UNKNOWN_TOPIC,
      groundingText: COURSE_TEXT,
      generalProvider: UNKNOWN_PROVIDER,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const block = formatKnowledgeLibraryPromptBlock(
      toTeachingKnowledgeContext(result.knowledge),
    );
    expect(block).toMatch(/COURSE \/ USER MATERIAL GROUNDING/i);
    expect(block).toMatch(/GENERAL AI EXPLANATION LAYER/i);
    expect(block).toMatch(/RETRIEVED EXTERNAL SOURCES/i);
  });

  it("J — source validation rejects fabricated attribution", () => {
    const bad = validateLessonSourceIntegrity({
      lessonText:
        "Based on web research at https://totally-fake-news.example/psych, psychology is only common sense.",
      isGeneralAiOnly: true,
      hasRetrievedWebSources: false,
      allowedReferences: [],
    });
    expect(bad.ok).toBe(false);
    expect(bad.reasons.length).toBeGreaterThan(0);

    const lesson = {
      component: "detailed-explanation" as const,
      topic: "psychology",
      learningFrame: "Learning psychology",
      roadmap: ["a", "b", "c"],
      cheatSheet: "memory → learning",
      chunks: [
        {
          title: "What psychology studies",
          explanation:
            "Psychology studies mind and behavior with methods. According to The New York Times https://nytimes.com/fake, everyone already knows this.",
          example: "Lab observation of behavior.",
        },
        {
          title: "Methods",
          explanation:
            "Experiments and careful measurement let claims be tested rather than assumed from everyday intuition alone.",
          example: "Random assignment.",
        },
        {
          title: "Apply",
          explanation:
            "Contrast a testable claim with a folk claim about memory and write one measurable prediction for a simple study.",
          example: "Recall accuracy after spacing.",
        },
      ],
      practicePrompts: [
        { title: "P1", prompt: "Explain psychology", tip: "Be concrete" },
        { title: "P2", prompt: "Give an example", tip: "Use a lab" },
      ],
    };
    const v = validateAiLesson({
      lesson,
      canonicalTarget: "psychology",
      sourceIntegrity: {
        isGeneralAiOnly: true,
        hasRetrievedWebSources: false,
        allowedReferences: [],
      },
    });
    expect(v.checks.sourceIntegrityOk).toBe(false);
    expect(v.accepted).toBe(false);
  });

  it("K — general topic continues through orchestrator loop", async () => {
    const result = await retrieveTeachingKnowledge({
      target: UNKNOWN_TOPIC,
      generalProvider: UNKNOWN_PROVIDER,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const knowledge = toTeachingKnowledgeContext(result.knowledge);
    const first = knowledge.concepts[0]!.id;
    expect(
      decideKnowledgeLoop({
        target: UNKNOWN_TOPIC,
        knowledge,
        statesByConceptId: new Map(),
        evidence: [],
      }).action,
    ).toBe("teach");
    await recordLearningEvidence({
      userId: "u",
      type: "lesson_exposure",
      conceptId: first,
      outcome: "completed",
      eventKey: "p8:exp",
    });
    const state = await getLearnerConceptState("u", first);
    expect(state?.exposureCount).toBe(1);
    expect(
      decideKnowledgeLoop({
        target: UNKNOWN_TOPIC,
        knowledge,
        statesByConceptId: new Map([[first, state]]),
        evidence: [],
      }).action,
    ).toBe("practice");
  });

  it("L/M — KL sync path still works; OOD untouched", () => {
    expect(resolveTeachingKnowledgeContext("java-arraylist")?.primaryConcept?.id).toBe(
      "java-arraylist",
    );
    expect(resolveTeachingKnowledgeContext("Classes & Objects")).toBeNull();
    const ood = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Classes & Objects",
    );
    expect(ood!.chunks[0]?.explanation.toLowerCase()).toMatch(/dealership|cars/);
  });

  it("N — buildKnowledgeGroundingContext keeps layers separate", () => {
    const gc = buildKnowledgeGroundingContext({
      canonical: { kind: "knowledge-library", title: "Supply and demand" },
      courseMaterials: [{ kind: "course-material", title: "Econ PDF" }],
      userNotes: [{ kind: "user-note", title: "My notes" }],
      retrievedExternal: [
        {
          kind: "retrieved-web",
          title: "Article",
          reference: "https://edu.example/econ",
        },
      ],
      generatedExplanation: { kind: "general-ai", title: "AI explanation" },
    });
    expect(gc.canonical?.kind).toBe("knowledge-library");
    expect(gc.courseMaterials[0]?.kind).toBe("course-material");
    expect(gc.userNotes[0]?.kind).toBe("user-note");
    expect(gc.retrievedExternal[0]?.kind).toBe("retrieved-web");
    expect(gc.generatedExplanation?.kind).toBe("general-ai");
    expect(gc.allSources).toHaveLength(5);
  });

  it("O — six-lesson route exposes additive knowledgeSource sources", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("knowledgeSourceApiView");
    expect(route).toContain("sourceIntegrity");
    expect(route).toContain("allowedSourceReferences");
  });
});
