import { describe, expect, it } from "vitest";

import {
  filledSectionDataFromExtract,
  leftoverStudySlices,
  normalizeChapterStudyExtract,
  type ChapterStudyExtract,
} from "@/lib/core/chapter-study-extract";
import { applyAiExtractToDocument } from "@/lib/materials/apply-material-import";
import { emptyDocument } from "@/lib/core/note-types";
import { ensureNotebookPages, extractPageData, getNotebookPages } from "@/lib/core/notebook-pages";

const sample: ChapterStudyExtract = {
  title: "Chapter 1: Taking Risks and Making Profits",
  chapterOverview: "Introduces entrepreneurship, factors of production, and the business environment.",
  learningObjectives: [
    {
      code: "LO 1-2",
      statement:
        "Explain how entrepreneurship and the other factors of production contribute to the creation of wealth.",
      keyPoints: [
        "Five factors: land, labor, capital, entrepreneurship, knowledge",
        "Entrepreneurs combine resources to create wealth",
      ],
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
    {
      name: "Five factors of production",
      items: ["Land", "Labor", "Capital", "Entrepreneurship", "Knowledge"],
    },
    {
      name: "Five elements of the business environment",
      items: [
        "Economic / legal",
        "Technological",
        "Competitive",
        "Social",
        "Global",
      ],
    },
  ],
  comparisons: [
    {
      topic: "Being an entrepreneur",
      positives: ["Independence", "Possible wealth"],
      negatives: ["Risk of loss", "Long hours"],
    },
  ],
  mustKnow: ["A typical US business serves many stakeholders, not only owners."],
  studyToRemember: ["Women's workforce participation rose sharply over decades"],
  testYourself: [
    {
      question: "LO 1-2: List the five factors of production.",
      answer: "Land, labor, capital, entrepreneurship, knowledge",
    },
  ],
  processesOrSteps: [
    {
      name: "Evolution of US business",
      steps: ["Agriculture", "Manufacturing", "Service", "Information"],
    },
  ],
  workedExamples: [],
  recommendedFormats: ["OUTLINE", "CONCEPT_DEFINITION", "CHARTING", "TWO_COLUMN"],
};

describe("filledSectionDataFromExtract", () => {
  it("fills a Cornell sheet with cues, notes, and summary", () => {
    const data = filledSectionDataFromExtract("CORNELL", sample);
    const cornell = data.cornell as { cues: string; notes: string; summary: string };
    expect(cornell.cues).toContain("LO 1-2");
    expect(cornell.cues).toContain("Entrepreneurship");
    expect(cornell.notes).toContain("Accepting the risk of starting a business");
    expect(cornell.summary).toContain("entrepreneurship");
  });

  it("fills concept definitions from extract", () => {
    const data = filledSectionDataFromExtract("CONCEPT_DEFINITION", sample);
    const concepts = data.concepts as { items: Array<{ term: string; definition: string }> };
    expect(concepts.items).toHaveLength(2);
    expect(concepts.items[0]).toMatchObject({
      term: "Entrepreneurship",
      definition: "Accepting the risk of starting a business.",
    });
  });

  it("fills outline from learning objectives, not fluff tips", () => {
    const data = filledSectionDataFromExtract("OUTLINE", sample);
    const nodes = data.outlineNodes as Array<{ text: string; level: number }>;
    expect(nodes.some((n) => n.text.includes("LO 1-2"))).toBe(true);
    expect(nodes.some((n) => n.text.includes("Five factors"))).toBe(true);
    expect(nodes.some((n) => n.text.includes("Women's workforce"))).toBe(false);
  });

  it("fills two-column from pros/cons comparisons", () => {
    const data = filledSectionDataFromExtract("TWO_COLUMN", sample);
    const twoColumn = data.twoColumn as {
      leftHeader: string;
      rows: Array<{ left: string; right: string }>;
    };
    expect(twoColumn.leftHeader).toContain("entrepreneur");
    expect(twoColumn.rows[0]?.left).toBe("Independence");
    expect(twoColumn.rows[0]?.right).toBe("Risk of loss");
  });

  it("fills charting from frameworks", () => {
    const data = filledSectionDataFromExtract("CHARTING", sample);
    const charting = data.charting as { columns: string[]; rows: string[][] };
    expect(charting.columns[0]).toContain("factors of production");
    expect(charting.rows[0]?.[0]).toBe("Land");
  });

  it("fills process flow steps", () => {
    const data = filledSectionDataFromExtract("PROCESS_FLOW", sample);
    const flow = data.flow as { nodes: Array<{ label: string }>; edges: unknown[] };
    expect(flow.nodes.map((n) => n.label)).toEqual([
      "Agriculture",
      "Manufacturing",
      "Service",
      "Information",
    ]);
    expect(flow.edges).toHaveLength(3);
  });
});

describe("applyAiExtractToDocument", () => {
  it("applies a study workspace, not packed format widgets or paper", () => {
    const doc = applyAiExtractToDocument(ensureNotebookPages(emptyDocument()), sample);
    expect(extractPageData(doc).studyTemplateId).toBe("hybrid-study");
    expect(extractPageData(doc).activeFormat).toBe("BLANK");
    expect(doc.notebook?.pageTemplateId).toBe("blank");
    expect(doc.typed).not.toContain("## Definitions");
    expect((extractPageData(doc).compositeSections ?? []).map((section) => section.title)).toEqual([
      "Topic",
      "Key terms",
      "Compare",
      "Timeline",
    ]);
    expect(doc.concepts?.items?.some((item) => item.term === "Entrepreneurship")).toBe(true);
    expect(doc.twoColumn?.rows?.[0]?.left).toBe("Independence");
    expect(doc.cornell?.cues).toContain("LO 1-2");
    expect(getNotebookPages(doc).pages.length).toBeGreaterThanOrEqual(2);
    expect(
      getNotebookPages(doc).pages.some(
        (page) => (page.data as { studyTemplateId?: string }).studyTemplateId === "outline",
      ),
    ).toBe(true);
  });

  it("normalizes and strips QA from recommended formats", () => {
    const extract = normalizeChapterStudyExtract({
      ...sample,
      recommendedFormats: ["QA", "CONCEPT_DEFINITION"],
    });
    expect(extract.recommendedFormats).not.toContain("QA");
    expect(extract.recommendedFormats).toContain("CONCEPT_DEFINITION");
    expect(extract.learningObjectives).toHaveLength(2);
    expect(extract.frameworks).toHaveLength(2);
  });

  it("keeps typed testYourself items and merges leftover extract slices", () => {
    const extract = normalizeChapterStudyExtract({
      title: "Ch 1",
      comparisons: [
        { topic: "RAM vs storage", positives: ["Fast"], negatives: ["Volatile"] },
        { topic: "Compiler vs interpreter", positives: ["Once"], negatives: ["Compile step"] },
      ],
      testYourself: [
        {
          type: "FILL_IN_BLANK",
          question: "A bit is a ____ digit.",
          answer: "binary",
        },
      ],
    });
    expect(extract.testYourself[0]?.type).toBe("FILL_IN_BLANK");
    expect(extract.testYourself[0]?.answer).toBe("binary");
  });

  it("persists full chapterStudyExtract on the note for Ask/quizzes", () => {
    const doc = applyAiExtractToDocument(ensureNotebookPages(emptyDocument()), sample);
    expect(doc.metadata?.chapterStudyExtract?.learningObjectives?.[0]?.code).toBe(
      "LO 1-2",
    );
    expect(doc.metadata?.chapterStudyExtract?.testYourself?.length).toBe(1);
  });

  it("puts leftover comparisons, processes, and walkthroughs on extra pages", () => {
    const extract: ChapterStudyExtract = {
      ...sample,
      comparisons: [
        sample.comparisons[0]!,
        {
          topic: "Compiler vs interpreter",
          positives: ["Translated once"],
          negatives: ["Needs a compile step"],
        },
      ],
      processesOrSteps: [
        sample.processesOrSteps[0]!,
        { name: "Fetch-decode-execute", steps: ["Fetch", "Decode", "Execute"] },
      ],
      workedExamples: [
        {
          title: "Binary to decimal",
          purpose: "Place values",
          setup: "1101",
          steps: ["8+4+1"],
          result: "13",
        },
      ],
    };
    const slices = leftoverStudySlices(extract);
    expect(slices.map((slice) => slice.label)).toEqual([
      "Compiler vs interpreter",
      "Fetch-decode-execute",
      "Binary to decimal",
    ]);

    const doc = applyAiExtractToDocument(ensureNotebookPages(emptyDocument()), extract);
    const pages = getNotebookPages(doc).pages;
    expect(pages.some((page) => /compiler vs interpreter/i.test(page.label ?? ""))).toBe(true);
    expect(pages.some((page) => /fetch-decode-execute/i.test(page.label ?? ""))).toBe(true);
    expect(pages.some((page) => /binary to decimal/i.test(page.label ?? ""))).toBe(true);

    const comparePage = pages.find((page) => /compiler vs interpreter/i.test(page.label ?? ""));
    const twoColumn = (comparePage?.data as { twoColumn?: { leftHeader?: string; rows?: Array<{ left: string }> } })
      ?.twoColumn;
    expect(twoColumn?.leftHeader).toMatch(/compiler/i);
    expect(twoColumn?.rows?.[0]?.left).toBe("Translated once");

    const processPage = pages.find((page) => /fetch-decode-execute/i.test(page.label ?? ""));
    const flow = (processPage?.data as { flow?: { nodes?: Array<{ label: string }> } })?.flow;
    expect(flow?.nodes?.map((node) => node.label)).toEqual(["Fetch", "Decode", "Execute"]);
  });
});
