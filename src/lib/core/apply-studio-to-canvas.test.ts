import { describe, expect, it } from "vitest";

import {
  applyAiExtractToDocument,
  applyFilledFormatsToDocument,
  applyStudioStructuredToDocument,
} from "@/lib/core/apply-studio-to-canvas";
import { filledSectionDataFromExtract } from "@/lib/core/chapter-study-extract";
import { emptyDocument } from "@/lib/core/note-types";
import { ensureNotebookPages, extractPageData, getNotebookPages } from "@/lib/core/notebook-pages";
import type { ChapterStudyExtract } from "@/lib/core/chapter-study-extract";

const sample: ChapterStudyExtract = {
  title: "Chapter 1: Taking Risks and Making Profits",
  chapterOverview: "Introduces entrepreneurship and the business environment.",
  learningObjectives: [
    {
      code: "LO 1-2",
      statement: "Explain the factors of production.",
      keyPoints: ["Five factors: land, labor, capital, entrepreneurship, knowledge"],
    },
  ],
  definitions: [{ term: "Entrepreneurship", definition: "Accepting the risk of starting a business." }],
  frameworks: [{ name: "Five factors of production", items: ["Land", "Labor"] }],
  comparisons: [],
  mustKnow: ["Businesses serve many stakeholders."],
  studyToRemember: [],
  testYourself: [{ question: "List two factors of production.", answer: "Land and labor" }],
  processesOrSteps: [],
  workedExamples: [],
  recommendedFormats: ["OUTLINE", "CONCEPT_DEFINITION"],
};

describe("smart import study page", () => {
  it("lays extract onto the same page — no extra source sheet", () => {
    const sourceBody = "A".repeat(120) + " original chapter text about entrepreneurship.";
    const starting = ensureNotebookPages({
      ...emptyDocument(),
      typed: sourceBody,
    });
    const doc = applyAiExtractToDocument(starting, sample);
    expect(getNotebookPages(doc).pages.every((page) => !/source/i.test(page.label ?? ""))).toBe(
      true,
    );
    expect(extractPageData(doc).activeFormat).toBe("BLANK");
    expect(extractPageData(doc).studyTemplateId).toBe("cornell-key-terms");
    expect((extractPageData(doc).compositeSections ?? []).map((section) => section.title)).toEqual([
      "Topic",
      "Notes",
      "Cues / questions",
      "Summary",
      "Key terms",
    ]);
    expect(doc.cornell?.cues).toContain("LO 1-2");
    const qaOnCanvas = (extractPageData(doc).compositeSections ?? []).some(
      (section) => section.formatId === "QA",
    );
    expect(qaOnCanvas).toBe(false);
    expect(doc.metadata?.notebookDesk?.items.some((item) => item.title === "Entrepreneurship")).toBe(
      true,
    );
  });

  it("turns study-guide output into a filled Cornell template instead of a text dump", () => {
    const doc = applyStudioStructuredToDocument(
      ensureNotebookPages(emptyDocument()),
      "study-guide",
      sample as unknown as Record<string, unknown>,
    );
    expect(extractPageData(doc).activeFormat).toBe("BLANK");
    expect(extractPageData(doc).studyTemplateId).toBe("cornell-key-terms");
    expect(doc.typed).not.toContain("## Definitions");
    expect(doc.cornell?.summary).toContain("entrepreneurship");
  });

  it("places timeline output as an editable Core timeline block", () => {
    const doc = applyStudioStructuredToDocument(
      ensureNotebookPages(emptyDocument()),
      "timeline",
      {
        title: "Evolution of US business",
        events: [
          { date: "1800s", label: "Agriculture", detail: "Farming economy" },
          { date: "1900s", label: "Manufacturing" },
        ],
      },
    );
    const timeline = extractPageData(doc).compositeSections?.find((s) => s.formatId === "TIMELINE");
    const events = (timeline?.data as { timeline?: { events: Array<{ date: string; title: string }> } })
      .timeline?.events;
    expect(events?.[0]).toMatchObject({ date: "1800s", title: "Agriculture" });
  });

  it("does not place FAQ onto the Core canvas", () => {
    const doc = applyStudioStructuredToDocument(
      ensureNotebookPages(emptyDocument()),
      "faq",
      {
        title: "Chapter FAQ",
        pairs: [{ question: "What is a stakeholder?", answer: "Anyone affected by the business." }],
      },
    );
    expect(extractPageData(doc).compositeSections ?? []).toEqual([]);
  });
});

describe("applyFilledFormatsToDocument", () => {
  it("fills a newly added Cornell block from the extract", () => {
    const { doc } = applyFilledFormatsToDocument(
      ensureNotebookPages(emptyDocument()),
      ["CORNELL"],
      sample,
    );
    const cornell = extractPageData(doc).compositeSections?.find((s) => s.formatId === "CORNELL");
    const data = cornell?.data as { cornell?: { cues: string; summary: string } };
    expect(data.cornell?.cues).toContain("LO 1-2");
    expect(data.cornell?.summary).toContain("entrepreneurship");
  });

  it("adds extra formats as new pages when a study template already owns the layout", () => {
    const templated = applyAiExtractToDocument(ensureNotebookPages(emptyDocument()), sample);
    const before = getNotebookPages(templated).pages.length;
    const { doc } = applyFilledFormatsToDocument(templated, ["MIND_MAP"], sample, {
      skipExisting: true,
    });
    expect(extractPageData(doc).compositeSections ?? []).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ formatId: "MIND_MAP" })]),
    );
    expect(getNotebookPages(doc).pages.length).toBe(before + 1);
    expect(doc.metadata?.studyTemplateId).toBe(templated.metadata?.studyTemplateId);
  });
});

describe("QA fill from extract", () => {
  it("uses testYourself pairs", () => {
    const data = filledSectionDataFromExtract("QA", sample);
    const qa = data.qa as { pairs: Array<{ question: string; answer: string }> };
    expect(qa.pairs[0]?.question).toContain("factors of production");
  });
});

describe("readAllNotebookSheetsText", () => {
  it("joins text from every sheet", async () => {
    const { readAllNotebookSheetsText, ALL_SHEETS_TARGET } = await import(
      "@/lib/core/apply-studio-to-canvas"
    );
    expect(ALL_SHEETS_TARGET).toBe("__all_sheets__");
    let doc = ensureNotebookPages({
      ...emptyDocument(),
      typed: "Welcome class on page 1",
    });
    const pages = getNotebookPages(doc);
    const first = pages.pages[0]!;
    doc = {
      ...doc,
      metadata: {
        ...doc.metadata,
        notebookPages: {
          activePageId: first.id,
          pages: [
            {
              ...first,
              label: "Page 1",
              data: { ...extractPageData(doc), typed: "First sheet Java intro" },
            },
            {
              id: "pg_two",
              pageNumber: 2,
              label: "Page 2",
              data: { ...extractPageData(emptyDocument()), typed: "Second sheet methods" },
            },
          ],
        },
      },
    };
    const text = readAllNotebookSheetsText(doc);
    expect(text).toContain("First sheet Java intro");
    expect(text).toContain("Second sheet methods");
  });
});
