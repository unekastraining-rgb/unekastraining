import { describe, expect, it } from "vitest";

import { chooseStudyFormats } from "@/lib/core/adaptive-study-choice";
import { rectsOverlap } from "@/lib/core/block-layout";
import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import {
  placePlannedBlocks,
  planStudyPages,
  profileExtract,
  reflowSectionsToRegions,
  STUDY_PAGE_INNER,
  STUDY_PAGE_LEFT,
} from "@/lib/core/study-page-plan";

const mixed: ChapterStudyExtract = {
  title: "Chapter 1: Taking Risks and Making Profits",
  chapterOverview: "Introduces entrepreneurship, factors of production, and the business environment.",
  learningObjectives: [
    {
      code: "LO 1-2",
      statement: "Explain how entrepreneurship and the other factors of production create wealth.",
      keyPoints: ["Five factors: land, labor, capital, entrepreneurship, knowledge"],
    },
    {
      code: "LO 1-3",
      statement: "Analyze the effects of the economic environment and taxes on businesses.",
      keyPoints: ["Taxes and regulation affect costs and growth"],
    },
  ],
  definitions: [
    { term: "Entrepreneurship", definition: "Accepting the risk of starting a business." },
    { term: "Stakeholders", definition: "All parties affected by a business's decisions." },
  ],
  frameworks: [
    { name: "Five factors of production", items: ["Land", "Labor", "Capital"] },
    { name: "Business environment", items: ["Economic", "Technological", "Competitive"] },
  ],
  comparisons: [
    {
      topic: "Being an entrepreneur",
      positives: ["Independence", "Possible wealth"],
      negatives: ["Risk of loss", "Long hours"],
    },
  ],
  mustKnow: ["A typical US business serves many stakeholders, not only owners."],
  studyToRemember: [],
  testYourself: [{ question: "List the five factors of production.", answer: "Land, labor, capital, entrepreneurship, knowledge" }],
  processesOrSteps: [
    {
      name: "Evolution of US business",
      steps: ["Agriculture", "Manufacturing", "Service", "Information"],
    },
  ],
  workedExamples: [],
  recommendedFormats: ["OUTLINE", "CONCEPT_DEFINITION", "CHARTING", "TWO_COLUMN", "PROCESS_FLOW", "TIMELINE"],
};

function asRect(section: { x?: number; y?: number; width?: number; height?: number }) {
  return {
    x: section.x ?? 0,
    y: section.y ?? 0,
    width: section.width ?? 0,
    height: section.height ?? 0,
  };
}

describe("planStudyPages", () => {
  it("lets Adaptive choose formats and places them in regions instead of dumping every match", () => {
    expect(profileExtract(mixed).dominant).toBe("mixed");
    const chosen = ["CONCEPT_DEFINITION", "TWO_COLUMN", "TIMELINE"] as const;
    const pages = planStudyPages(mixed, { chosenFormats: [...chosen] });

    const page1Ids = pages[0]!.blocks.map((block) => block.formatId);
    expect(page1Ids).toEqual(["CONCEPT_DEFINITION", "TWO_COLUMN", "TIMELINE"]);
    expect(pages[0]!.blocks.map((block) => block.region)).toEqual(["left", "right", "wide"]);
    expect(page1Ids).not.toContain("QA");
  });

  it("does not dump the inflated recommendedFormats list when Adaptive scores the extract", () => {
    const pages = planStudyPages(mixed);
    const ids = pages.flatMap((page) => page.blocks.map((block) => block.formatId));
    const chosen = chooseStudyFormats(mixed);
    expect(ids.length).toBeLessThanOrEqual(4);
    expect(ids).not.toContain("QA");
    expect(ids.sort()).toEqual([...chosen].sort());
    expect(ids).not.toEqual(mixed.recommendedFormats);
  });

  it("uses Cornell-style two-column terms+outline for definition chapters, not a process dump", () => {
    const definitionsOnly: ChapterStudyExtract = {
      ...mixed,
      frameworks: [],
      comparisons: [],
      processesOrSteps: [],
      recommendedFormats: ["OUTLINE", "CONCEPT_DEFINITION", "CHARTING", "PROCESS_FLOW"],
    };
    const pages = planStudyPages(definitionsOnly);
    const ids = pages.flatMap((page) => page.blocks.map((block) => block.formatId));
    expect(ids).toContain("CONCEPT_DEFINITION");
    expect(ids).not.toContain("PROCESS_FLOW");
    expect(ids).not.toContain("TIMELINE");
    expect(ids).not.toContain("QA");
    expect(ids.length).toBeLessThanOrEqual(4);
  });

  it("places a procedural process as flow, not a timeline", () => {
    const procedural: ChapterStudyExtract = {
      ...mixed,
      comparisons: [],
      frameworks: [],
      definitions: [],
      processesOrSteps: [{ name: "How to form a partnership", steps: ["Agree", "File", "Operate"] }],
      recommendedFormats: ["PROCESS_FLOW"],
    };
    expect(profileExtract(procedural).dominant).toBe("process");
    const ids = planStudyPages(procedural).flatMap((page) => page.blocks.map((block) => block.formatId));
    expect(ids).toContain("PROCESS_FLOW");
    expect(ids).not.toContain("TIMELINE");
  });

  it("strips Q&A even if Adaptive names it", () => {
    const ids = chooseStudyFormats(mixed, ["QA", "CONCEPT_DEFINITION", "TWO_COLUMN"]);
    expect(ids).toEqual(["CONCEPT_DEFINITION", "TWO_COLUMN"]);
  });
});

describe("placePlannedBlocks", () => {
  it("keeps left/right columns side by side and wide blocks under both", () => {
    const [page] = planStudyPages(mixed, {
      chosenFormats: ["CONCEPT_DEFINITION", "TWO_COLUMN", "TIMELINE"],
    });
    const placed = placePlannedBlocks(page!.blocks, { originY: 320 });
    const left = placed.find((section) => section.formatId === "CONCEPT_DEFINITION")!;
    const right = placed.find((section) => section.formatId === "TWO_COLUMN")!;
    const wide = placed.find((section) => section.formatId === "TIMELINE")!;

    expect(left.x).toBe(STUDY_PAGE_LEFT);
    expect(right.x).toBeGreaterThan(left.x! + left.width! / 2);
    expect(left.y).toBe(320);
    expect(right.y).toBe(320);
    expect(wide.y).toBeGreaterThanOrEqual((left.y ?? 0) + (left.height ?? 0));
    expect(wide.width).toBe(STUDY_PAGE_INNER);

    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        expect(rectsOverlap(asRect(placed[i]!), asRect(placed[j]!))).toBe(false);
      }
    }
  });
});

describe("reflowSectionsToRegions", () => {
  it("stacks mashed blocks so they no longer overlap", () => {
    const mashed = [
      {
        id: "a",
        formatId: "OUTLINE" as const,
        title: "Outline",
        x: 36,
        y: 48,
        width: 480,
        height: 200,
        data: { outlineNodes: [{}, {}, {}] },
      },
      {
        id: "b",
        formatId: "CONCEPT_DEFINITION" as const,
        title: "Terms",
        x: 40,
        y: 52,
        width: 480,
        height: 200,
        data: { concepts: { items: [{}, {}] } },
      },
      {
        id: "c",
        formatId: "TIMELINE" as const,
        title: "Timeline",
        x: 36,
        y: 48,
        width: 1100,
        height: 200,
        data: { timeline: { events: [{}, {}, {}] } },
      },
    ];
    const reflowed = reflowSectionsToRegions(mashed, 240);
    expect(reflowed[0]?.id).toBe("a");
    for (let i = 0; i < reflowed.length; i++) {
      for (let j = i + 1; j < reflowed.length; j++) {
        expect(rectsOverlap(asRect(reflowed[i]!), asRect(reflowed[j]!))).toBe(false);
      }
    }
    expect(Math.min(...reflowed.map((section) => section.y ?? 0))).toBe(240);
  });
});
