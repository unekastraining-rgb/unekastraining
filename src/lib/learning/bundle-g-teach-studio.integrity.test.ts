/**
 * Bundle G — Teach Me Engine + Learning Studio integrity tests.
 * Additive instructional depth + studio UX — no duplicate intelligence engines.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildConceptRelationshipMap,
  buildCurriculumSections,
  buildInstructionalMoments,
  buildRecognitionInteraction,
  buildTransferInteraction,
  deepenConceptToChunks,
  enrichLessonForStudio,
  evaluateSelectInteraction,
  isSelectInteraction,
  learningObjectFromChunk,
  resolveStageMode,
  studioStageFromChunk,
} from "@/lib/learning/studio";
import { lessonFromTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import { decomposeTeachConceptsDeterministic } from "@/lib/learning/teach";
import { understandLearningTarget } from "@/lib/learning/knowledge/retrieval";
import type { InstructionalConceptKnowledge } from "@/lib/learning/knowledge/instructional-library";
import type { SixWorkedLesson } from "@/lib/csl/six-worked-lesson";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

const marketingConcept: InstructionalConceptKnowledge = {
  id: "test-market-segmentation",
  title: "Market Segmentation",
  definition:
    "Market segmentation divides a broad market into groups that share meaningful needs.",
  explanation:
    "Segmentation groups customers so a business can choose where to focus. Groups must be measurable, accessible, and actionable — not random labels.",
  purpose: "Focus resources on customers the business can serve well.",
  example:
    "A bakery separates weekday lunch students from weekend celebration diners.",
  examples: [
    "A bakery separates weekday lunch students from weekend celebration diners.",
    "A software company separates freelancers from enterprise IT buyers.",
  ],
  misconception: "Thinking any demographic split is a useful segment.",
  misconceptions: ["Any age group is automatically a segment."],
  nonExamples: ["Splitting customers by random jersey numbers."],
  vocabulary: ["segment", "target market", "differentiated need"],
  prerequisites: ["Customer Needs"],
  relatedConcepts: ["business-marketing", "business-strategy"],
  breakdown: "1) Observe needs\n2) Group similar needs\n3) Name the segment\n4) Test actionability",
  representation: "Needs → Segments → Target → Offer",
  checkPrompt: "What makes a segment useful rather than arbitrary?",
  practiceForms: ["explain", "apply"],
  difficulty: 2,
};

describe("Bundle G — Teach Me instructional depth", () => {
  it("deepens a focused concept into foundation→…→check instructional units", () => {
    const chunks = deepenConceptToChunks({
      concept: marketingConcept,
      scope: "concept-family",
      pathTitles: [
        "Understanding Customers",
        "Customer Needs",
        "Market Segmentation",
        "Targeting",
      ],
      pathIndex: 2,
      domain: "business",
    });
    expect(chunks.length).toBeGreaterThanOrEqual(4);
    expect(chunks.some((c) => /Understand|foundation|core/i.test(c.title) || c.role === "concept")).toBe(
      true,
    );
    expect(chunks.some((c) => c.role === "worked" || /Example/i.test(c.title))).toBe(
      true,
    );
    expect(chunks.some((c) => c.role === "apply" || c.role === "check")).toBe(
      true,
    );
    expect(chunks.some((c) => Boolean(c.representation?.includes("→")))).toBe(
      true,
    );
  });

  it("represents concept relationships as a connected path (not mastery)", () => {
    const map = buildConceptRelationshipMap({
      conceptTitles: ["Need", "Value", "Segmentation", "Targeting"],
      currentIndex: 2,
      prerequisites: ["Customer"],
    });
    expect(map.visual).toContain("● Segmentation");
    expect(map.edges.some((e) => e.relation === "leads-to")).toBe(true);
    expect(JSON.stringify(map).toLowerCase()).not.toMatch(/mastered/);
  });

  it("builds recognition + transfer interactions without a second quiz engine", () => {
    const chunk = deepenConceptToChunks({
      concept: marketingConcept,
      scope: "focused-concept",
    })[0]!;
    const recognition = buildRecognitionInteraction({
      chunk,
      conceptTitle: "Market Segmentation",
      neighborTitles: ["Targeting", "Positioning", "Promotion"],
    });
    expect(recognition).toBeTruthy();
    expect(isSelectInteraction(recognition)).toBe(true);
    expect(recognition!.choices!.length).toBeGreaterThanOrEqual(2);

    const transfer = buildTransferInteraction({
      chunk: {
        title: "Apply Market Segmentation",
        role: "apply",
        explanation: "Apply the idea.",
        example:
          "A software company is deciding whether to offer a free version or charge $9.99/month.",
        checkPrompt: "Which concept applies?",
      },
      conceptTitle: "Market Segmentation",
      neighborTitles: ["Pricing", "Promotion", "Distribution"],
    });
    expect(transfer.kind).toBe("transfer");
    expect(transfer.prompt.toLowerCase()).not.toContain(
      "this is a pricing problem",
    );
  });

  it("select feedback teaches the distinction (not only Incorrect)", () => {
    const interaction = buildRecognitionInteraction({
      chunk: {
        title: "Product",
        explanation: "Product is what the business offers.",
        example: "A bakery adds a breakfast sandwich.",
        misconception: "Price is what the customer pays.",
        role: "check",
        checkPrompt: "Which mix decision is this?",
      },
      conceptTitle: "Product",
      neighborTitles: ["Price", "Place", "Promotion"],
    })!;
    const wrongIndex =
      interaction.correctIndex === 0 ? 1 : 0;
    const result = evaluateSelectInteraction(interaction, wrongIndex);
    expect(result.correct).toBe(false);
    expect(result.summary.toLowerCase()).not.toBe("incorrect.");
    expect(result.gaps[0]?.length ?? 0).toBeGreaterThan(10);
  });

  it("enriches thin lessons with transfer practice prompts", () => {
    const thin: SixWorkedLesson = {
      component: "detailed-explanation",
      topic: "Market Segmentation",
      learningFrame: "Learn segmentation.",
      roadmap: ["Market Segmentation"],
      chunks: [
        {
          title: "Market Segmentation",
          explanation: marketingConcept.explanation,
          example: marketingConcept.example!,
          role: "concept",
          checkPrompt: marketingConcept.checkPrompt,
        },
      ],
      cheatSheet: "Segment → Target → Position",
      practicePrompts: [
        {
          title: "Practice",
          prompt: "Explain segmentation.",
          tip: "Cover first.",
        },
      ],
    };
    const enriched = enrichLessonForStudio({
      lesson: thin,
      scope: "concept-family",
      focusConcept: marketingConcept,
      pathTitles: ["Needs", "Segmentation", "Targeting"],
      pathIndex: 1,
      domain: "business",
    });
    expect(enriched.chunks.length).toBeGreaterThan(1);
    expect(
      enriched.practicePrompts.some((p) => /transfer/i.test(p.title)),
    ).toBe(true);
  });

  it("library adapter deepens single-concept teach context", () => {
    const lesson = lessonFromTeachingKnowledgeContext(
      "detailed-explanation",
      "Market Segmentation",
      {
        target: "Market Segmentation",
        domain: "business",
        subject: "business",
        pack: null,
        concepts: [marketingConcept],
        primaryConcept: marketingConcept,
        resolution: "single-concept",
        source: "knowledge-library",
      },
      null,
      { teachScope: "focused-concept" },
    );
    expect(lesson.chunks.length).toBeGreaterThanOrEqual(3);
    expect(
      lesson.practicePrompts.some((p) => /transfer/i.test(`${p.title} ${p.prompt}`)),
    ).toBe(true);
  });
});

describe("Bundle G — Learning Studio UX contracts", () => {
  it("builds sectioned curriculum from path titles (not mastery %)", () => {
    const sections = buildCurriculumSections({
      pathTitle: "Effective Marketing",
      conceptTitles: [
        "Understanding Customers",
        "Customer Needs",
        "Market Segmentation",
        "Targeting",
        "Positioning",
        "Product",
        "Transfer Challenge",
      ],
      currentIndex: 2,
    });
    expect(sections.length).toBeGreaterThanOrEqual(2);
    const blob = JSON.stringify(sections).toLowerCase();
    expect(blob).not.toMatch(/50% mastered|mastery score/);
    expect(
      sections.some((s) => s.items.some((i) => i.status === "current")),
    ).toBe(true);
  });

  it("maps instructional moments and studio stages", () => {
    const lesson = enrichLessonForStudio({
      lesson: {
        component: "detailed-explanation",
        topic: "Inheritance",
        learningFrame: "Understand inheritance.",
        roadmap: ["Inheritance"],
        chunks: [
          {
            title: "Inheritance",
            explanation: "A subclass reuses and extends a superclass.",
            example: "class Dog extends Animal {}",
            role: "concept",
            checkPrompt: "What does extends mean?",
          },
        ],
        cheatSheet: "subclass extends superclass",
        practicePrompts: [],
      },
      scope: "focused-concept",
      focusConcept: {
        id: "java-inheritance",
        title: "Inheritance",
        explanation:
          "Inheritance lets a subclass reuse fields and methods from a superclass while adding specialized behavior.",
        example: "class Dog extends Animal { void bark() {} }",
        misconception: "Inheritance copies objects at runtime like cloning.",
        checkPrompt: "What does extends mean in Java?",
      },
      pathTitles: ["Classes", "Inheritance", "Polymorphism"],
      pathIndex: 1,
      domain: "programming",
    });
    const moments = buildInstructionalMoments({
      lesson,
      conceptTitle: "Inheritance",
      topic: "Java Inheritance",
      neighborTitles: ["Classes", "Polymorphism"],
    });
    expect(moments.length).toBe(lesson.chunks.length);
    expect(moments.some((m) => m.interaction != null)).toBe(true);
    expect(studioStageFromChunk(lesson.chunks[0]!)).toBe("understand");
  });

  it("TeachFirst Learning Studio wires in-stage objects + collapsible curriculum", () => {
    const ui = read("src/components/study/TeachFirstLearnActivity.tsx");
    expect(ui).toContain("data-learning-studio");
    expect(ui).toContain("LearningObjectStage");
    expect(ui).toContain("CurriculumRail");
    expect(ui).toContain("learningObjectFromChunk");
    expect(ui).toContain("buildInstructionalMoments");
    expect(ui).toContain("evaluateSelectInteraction");
    expect(ui).toContain("buildCurriculumSections");
    expect(ui).toContain("activeInteraction");
    expect(ui).not.toContain("data-action-deck-pane");
    // Rooms preserved
    expect(ui).toContain("LearningDock");
    expect(ui).toContain("practiceHref");
    expect(ui).toContain("SixTutorChat");
  });

  it("does not introduce a second orchestrator / six / mastery engine", () => {
    const studio = read("src/lib/learning/studio/enrich-lesson.ts");
    const interactions = read("src/lib/learning/studio/interactions.ts");
    const blob = `${studio}\n${interactions}`.toLowerCase();
    expect(blob).not.toMatch(/new\s+orchestrator|second\s+six|mastery\s+engine/);
    expect(read("app/api/study/six-lesson/route.ts")).toContain(
      "enrichLessonForStudio",
    );
  });

  it("subject smoke: decompose + deepen works across domains", () => {
    const subjects = [
      "Teach me effective marketing",
      "Teach me Java inheritance",
      "Teach me linear equations",
      "Teach me supply and demand",
      "Teach me psychology",
    ];
    for (const topic of subjects) {
      const understood = understandLearningTarget(topic)!;
      const seedTopic = topic.replace(/^Teach me\s+/i, "").trim();
      const base =
        resolveTeachingKnowledgeContext(seedTopic) ??
        resolveTeachingKnowledgeContext(topic);
      const focus =
        base?.primaryConcept ??
        base?.concepts[0] ??
        marketingConcept;
      const decomposed = base
        ? decomposeTeachConceptsDeterministic({
            context: base,
            understood,
          })
        : null;
      const pathTitles =
        decomposed?.context.concepts.map((c) => c.title) ?? [focus.title];
      const chunks = deepenConceptToChunks({
        concept: focus,
        scope: "concept-family",
        pathTitles,
        pathIndex: 0,
      });
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks.some((c) => c.explanation.length > 40)).toBe(true);
    }
  });
});

describe("Bundle G UX — Learning objects + stage modes", () => {
  it("maps chunks to dominant learning objects (not paragraph walls)", () => {
    const visual = learningObjectFromChunk({
      chunk: {
        title: "How Segmentation connects",
        role: "visualize",
        explanation: "Place the idea on the path.",
        example: "Needs lead to segments.",
        representation: "Needs → Segmentation → Targeting → Positioning",
      },
      studioStage: "explore",
    });
    expect(visual.kind).toBe("visual-model");
    expect(visual.treatment).toBe("diagram");
    expect(visual.lead?.split(/\s+/).length ?? 0).toBeLessThan(40);

    const assess = learningObjectFromChunk({
      chunk: {
        title: "Check",
        role: "check",
        explanation: "Retrieve the idea.",
        example: "A bakery case.",
        checkPrompt: "Which example shows customer value?",
      },
      studioStage: "check",
      interaction: {
        kind: "select",
        prompt: "Which example shows customer value?",
        choices: ["A", "B", "C"],
        correctIndex: 0,
      },
      stageMode: "assess",
    });
    expect(assess.kind).toBe("assessment");

    expect(
      resolveStageMode({
        studioStage: "check",
        hasInteraction: true,
        formativeRequired: true,
        hasResult: false,
      }),
    ).toBe("assess");
    expect(
      resolveStageMode({
        studioStage: "understand",
        hasInteraction: false,
        formativeRequired: false,
        hasResult: false,
      }),
    ).toBe("teach");
  });

  it("CurriculumRail supports hide/show without duplicating stage content", () => {
    const rail = read(
      "src/components/study/learning-workspace/CurriculumRail.tsx",
    );
    expect(rail).toContain("Hide curriculum");
    expect(rail).toContain("Show curriculum");
    expect(rail).toContain("data-curriculum-collapsed");
    expect(rail).not.toContain("mastered");
  });
});
