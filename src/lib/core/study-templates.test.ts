import { describe, expect, it } from "vitest";

import { extraStudyFormats } from "@/lib/core/adaptive-study-choice";
import { applyAiExtractToDocument } from "@/lib/core/apply-studio-to-canvas";
import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";
import { emptyDocument } from "@/lib/core/note-types";
import {
  addNotebookPage,
  ensureNotebookPages,
  extractPageData,
  getNotebookPages,
} from "@/lib/core/notebook-pages";
import {
  applyStudyTemplate,
  getStudyTemplate,
  hasLockedStudyTemplateLayout,
  selectStudyTemplate,
} from "@/lib/core/study-templates";

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
  testYourself: [
    { question: "List the five factors of production.", answer: "Land, labor, capital, entrepreneurship, knowledge" },
  ],
  processesOrSteps: [
    {
      name: "Evolution of US business",
      steps: ["Agriculture", "Manufacturing", "Service", "Information"],
    },
  ],
  workedExamples: [],
  recommendedFormats: ["OUTLINE", "CONCEPT_DEFINITION", "CHARTING", "TWO_COLUMN", "PROCESS_FLOW", "TIMELINE", "QA"],
};

const definitionsOnly: ChapterStudyExtract = {
  ...mixed,
  frameworks: [],
  comparisons: [],
  processesOrSteps: [],
  recommendedFormats: ["OUTLINE", "CONCEPT_DEFINITION", "QA"],
};

const procedural: ChapterStudyExtract = {
  ...mixed,
  definitions: [],
  comparisons: [],
  frameworks: [],
  processesOrSteps: [{ name: "How to form a partnership", steps: ["Agree", "File", "Operate"] }],
  recommendedFormats: ["PROCESS_FLOW", "QA"],
};

describe("selectStudyTemplate", () => {
  it("picks a Cornell workspace for definition-heavy chapters", () => {
    expect(selectStudyTemplate(definitionsOnly)).toEqual({ primary: "cornell-key-terms" });
  });

  it("picks a process workspace for a process chapter", () => {
    expect(selectStudyTemplate(procedural)).toEqual({ primary: "process-flow" });
  });

  it("picks a hybrid study workspace for mixed chapters", () => {
    expect(selectStudyTemplate(mixed)).toEqual({ primary: "hybrid-study" });
  });

  it("does not choose Q&A as a template even if Adaptive names it", () => {
    const selection = selectStudyTemplate(definitionsOnly, ["QA", "CONCEPT_DEFINITION"]);
    expect(selection.primary).toBe("cornell-key-terms");
    expect(selection.page2).toBeUndefined();
  });
});

describe("applyStudyTemplate", () => {
  it("fills Cornell workspace areas and never places Q&A on the canvas", () => {
    const doc = applyStudyTemplate(
      ensureNotebookPages(emptyDocument()),
      getStudyTemplate("cornell-key-terms"),
      definitionsOnly,
    );
    expect(doc.metadata?.studyTemplateId).toBe("cornell-key-terms");
    expect(doc.metadata?.activeFormat).toBe("BLANK");
    expect(doc.notebook?.pageTemplateId).toBe("blank");
    expect(doc.cornell?.cues).toContain("LO 1-2");
    expect(doc.cornell?.summary).toContain("entrepreneurship");
    expect(doc.concepts?.items.some((item) => item.term === "Entrepreneurship")).toBe(true);
    const sections = extractPageData(doc).compositeSections ?? [];
    expect(sections.map((section) => section.title)).toEqual([
      "Topic",
      "Notes",
      "Cues / questions",
      "Summary",
      "Key terms",
    ]);
    expect(sections.every((section) => section.x != null && section.width != null)).toBe(true);
    expect(sections.some((section) => section.formatId === "QA")).toBe(false);
    expect(doc.qa?.pairs?.some((pair) => pair.question.includes("factors of production"))).not.toBe(
      true,
    );
  });

  it("fills hybrid workspace fields instead of packing format widgets", () => {
    const doc = applyStudyTemplate(
      ensureNotebookPages(emptyDocument()),
      getStudyTemplate("hybrid-study"),
      mixed,
    );
    expect(doc.metadata?.studyTemplateId).toBe("hybrid-study");
    expect(doc.metadata?.activeFormat).toBe("BLANK");
    expect(doc.notebook?.pageTemplateId).toBe("blank");
    expect(doc.typed).toBe(mixed.title);
    expect(doc.concepts?.items.some((item) => item.term === "Entrepreneurship")).toBe(true);
    expect(doc.twoColumn?.rows[0]?.left).toBe("Independence");
    expect(doc.timeline?.events.map((event) => event.title)).toEqual([
      "Agriculture",
      "Manufacturing",
      "Service",
      "Information",
    ]);
    expect((extractPageData(doc).compositeSections ?? []).map((section) => section.title)).toEqual([
      "Topic",
      "Key terms",
      "Compare",
      "Timeline",
    ]);
  });
});

describe("applyAiExtractToDocument templates", () => {
  it("applies a Cornell workspace for a definition chapter", () => {
    const doc = applyAiExtractToDocument(ensureNotebookPages(emptyDocument()), definitionsOnly);
    expect(doc.metadata?.studyTemplateId).toBe("cornell-key-terms");
    expect(extractPageData(doc).studyTemplateId).toBe("cornell-key-terms");
    expect(extractPageData(doc).activeFormat).toBe("BLANK");
    expect((extractPageData(doc).compositeSections ?? []).map((section) => section.title)).toEqual([
      "Topic",
      "Notes",
      "Cues / questions",
      "Summary",
      "Key terms",
    ]);
  });

  it("applies a process-flow workspace for procedural material", () => {
    const doc = applyAiExtractToDocument(ensureNotebookPages(emptyDocument()), procedural);
    expect(doc.metadata?.studyTemplateId).toBe("process-flow");
    expect(extractPageData(doc).activeFormat).toBe("BLANK");
    expect(doc.flow?.nodes.map((node) => node.label)).toEqual(["Agree", "File", "Operate"]);
  });

  it("applies a hybrid workspace for mixed chapters, with leftover techniques on later pages", () => {
    const doc = applyAiExtractToDocument(ensureNotebookPages(emptyDocument()), mixed);
    expect(doc.metadata?.studyTemplateId).toBe("hybrid-study");
    expect(extractPageData(doc).activeFormat).toBe("BLANK");
    expect(doc.notebook?.pageTemplateId).toBe("blank");
    expect(doc.concepts?.items.some((item) => item.term === "Entrepreneurship")).toBe(true);
    expect(doc.twoColumn?.rows[0]?.left).toBe("Independence");
    expect(doc.cornell?.cues).toContain("LO 1-2");
    expect((extractPageData(doc).compositeSections ?? []).map((section) => section.title)).toEqual([
      "Topic",
      "Key terms",
      "Compare",
      "Timeline",
    ]);

    const pages = getNotebookPages(doc);
    expect(pages.pages.length).toBeGreaterThanOrEqual(2);
    expect(
      pages.pages.some((page) => (page.data as { studyTemplateId?: string }).studyTemplateId === "outline"),
    ).toBe(true);
    expect(hasLockedStudyTemplateLayout(doc)).toBe(true);
    expect(doc.metadata?.recommendedFormats?.some((item) => item.formatId === "QA")).toBe(false);
    expect(
      pages.pages.flatMap((page) => {
        const data = page.data as { compositeSections?: Array<{ formatId: string }> };
        return data.compositeSections ?? [];
      }).some((section) => section.formatId === "QA"),
    ).toBe(false);
  });

  it("puts leftover Adaptive formats on extra workspace pages instead of packing them onto page 1", () => {
    const doc = applyAiExtractToDocument(ensureNotebookPages(emptyDocument()), mixed, {
      chosenFormats: [
        "CONCEPT_DEFINITION",
        "TWO_COLUMN",
        "TIMELINE",
        "CHARTING",
        "OUTLINE",
        "MIND_MAP",
      ],
    });
    expect(extractPageData(doc).studyTemplateId).toBe("hybrid-study");
    expect((extractPageData(doc).compositeSections ?? []).some((section) => section.formatId === "QA")).toBe(
      false,
    );
    expect(getNotebookPages(doc).pages.length).toBeGreaterThanOrEqual(4);
    expect(getNotebookPages(doc).pages.some((page) => /mind map/i.test(page.label ?? ""))).toBe(
      true,
    );
  });

  it("keeps a manually added Core page as a blank canvas", () => {
    const imported = applyAiExtractToDocument(ensureNotebookPages(emptyDocument()), mixed);
    const withBlank = addNotebookPage(imported, { label: "Page 2" });
    expect(extractPageData(withBlank).studyTemplateId).toBeUndefined();
    expect(extractPageData(withBlank).typed).toBe("");
    expect(extractPageData(withBlank).compositeSections ?? []).toEqual([]);
  });
});

describe("extraStudyFormats", () => {
  it("keeps leftover techniques after the Cornell page is chosen", () => {
    expect(extraStudyFormats(mixed, ["CORNELL", "TWO_COLUMN"])).toEqual(
      expect.arrayContaining(["OUTLINE", "CHARTING", "TIMELINE"]),
    );
    expect(extraStudyFormats(mixed, ["CORNELL", "TWO_COLUMN"])).not.toContain("QA");
    expect(extraStudyFormats(mixed, ["CORNELL", "TWO_COLUMN"])).not.toContain("CONCEPT_DEFINITION");
  });
});
