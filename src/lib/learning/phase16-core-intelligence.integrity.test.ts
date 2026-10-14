/**
 * Bundle C Phase 16 — Core Intelligence integrity.
 */
import { describe, expect, it } from "vitest";
import { emptyDocument } from "@/lib/core/note-types";
import {
  associateConceptsFromText,
  buildCoreLearningContent,
  coreLearningActionHints,
  extractCoreText,
  extractTextFromNoteDocument,
  filterCoreContentForUser,
  isValidCoreConceptId,
  parseNoteDocumentJson,
} from "@/lib/learning/core";
import "@/lib/learning/knowledge/packs";

describe("Phase 16 — Core Intelligence", () => {
  it("typed note → concept association (KL)", () => {
    const doc = emptyDocument("type");
    doc.typed =
      "An ArrayList dynamically changes size. Use add() and get() instead of a fixed array.";
    const content = buildCoreLearningContent({
      sourceId: "note-1",
      userId: "u1",
      title: "Java collections",
      contentJson: JSON.stringify(doc),
    });
    expect(content.sourceMetadata?.contentUnchanged).toBe(true);
    expect(content.concepts?.some((c) => c.conceptId === "java-arraylist")).toBe(
      true,
    );
    expect(content.understanding).toBe("understood");
  });

  it("known KL concept resolution from title", () => {
    const associations = associateConceptsFromText("", {
      title: "ArrayList in Java",
    });
    // title-only may still resolve via instructional knowledge when long enough with text
    const withText = associateConceptsFromText(
      "Notes about growing lists in Java.",
      { title: "ArrayList in Java" },
    );
    expect(withText.some((c) => c.conceptId === "java-arraylist")).toBe(true);
    expect(associations.every((c) => isValidCoreConceptId(c.conceptId))).toBe(
      true,
    );
  });

  it("user-selected concept", () => {
    const associations = associateConceptsFromText("short", {
      userSelectedConceptIds: ["java-exceptions", "fabricated-fake-id"],
    });
    expect(associations.some((c) => c.conceptId === "java-exceptions")).toBe(
      true,
    );
    expect(associations.every((c) => c.conceptId !== "fabricated-fake-id")).toBe(
      true,
    );
    expect(associations[0].source).toBe("user-selected");
    expect(associations[0].confidence).toBe("high");
  });

  it("provenance / content remains unchanged", () => {
    const original = emptyDocument("type");
    original.typed = "Supply and demand notes for economics.";
    const json = JSON.stringify(original);
    const before = json;
    buildCoreLearningContent({
      sourceId: "n1",
      userId: "u1",
      contentJson: json,
    });
    expect(json).toBe(before);
    const parsed = parseNoteDocumentJson(json)!;
    expect(parsed.typed).toBe(original.typed);
  });

  it("PDF / material concept integration via materialConceptIds", () => {
    const content = buildCoreLearningContent({
      sourceId: "n2",
      userId: "u1",
      content: "Chapter reading",
      materialConceptIds: ["java-exceptions", "not-a-real-concept"],
    });
    expect(
      content.concepts?.some(
        (c) => c.conceptId === "java-exceptions" && c.source === "course-material",
      ),
    ).toBe(true);
    expect(
      content.concepts?.every((c) => c.conceptId !== "not-a-real-concept"),
    ).toBe(true);
  });

  it("handwriting fallback — ink without text is unavailable, not fabricated", () => {
    const doc = emptyDocument("sketch");
    doc.outlineNodes = [];
    doc.outline = [];
    doc.strokes = [
      {
        color: "#000",
        width: 2,
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
      },
    ];
    const extracted = extractTextFromNoteDocument(doc);
    expect(extracted.text).toBe("");
    expect(extracted.sourceType).toBe("handwriting");
    expect(extracted.understanding).toBe("unavailable");
    const content = buildCoreLearningContent({
      sourceId: "ink-1",
      userId: "u1",
      contentJson: JSON.stringify(doc),
    });
    expect(content.concepts ?? []).toEqual([]);
  });

  it("drawing fallback — shapes without text do not invent concepts", () => {
    const doc = emptyDocument("sketch");
    doc.outlineNodes = [];
    doc.outline = [];
    doc.canvas = {
      viewport: { x: 0, y: 0, scale: 1 },
      strokes: [],
      stickies: [],
      shapes: [
        {
          id: "s1",
          kind: "rect",
          x: 0,
          y: 0,
          w: 40,
          h: 20,
          color: "#000",
          strokeWidth: 1,
        },
      ],
    };
    const extracted = extractTextFromNoteDocument(doc);
    expect(extracted.understanding).toBe("unavailable");
    expect(associateConceptsFromText(extracted.text)).toEqual([]);
  });

  it("low-confidence / insufficient text does not force association", () => {
    const associations = associateConceptsFromText("hi");
    expect(associations).toEqual([]);
  });

  it("user ownership isolation", () => {
    const content = buildCoreLearningContent({
      sourceId: "n1",
      userId: "u1",
      content: "ArrayList grows dynamically in Java programs.",
      title: "ArrayList",
    });
    expect(filterCoreContentForUser("u1", content)).not.toBeNull();
    expect(filterCoreContentForUser("u2", content)).toBeNull();
  });

  it("AI unavailable fallback — deterministic association only", () => {
    // No AI calls in associateConceptsFromText / extractCoreText.
    const extracted = extractCoreText({
      content: "Java exceptions: try catch throw throws.",
    });
    expect(extracted.understanding).toBe("understood");
    const associations = associateConceptsFromText(extracted.text, {
      title: "Java exceptions",
    });
    expect(associations.every((c) => isValidCoreConceptId(c.conceptId))).toBe(
      true,
    );
    expect(associations.some((c) => c.source === "knowledge-library")).toBe(
      true,
    );
  });

  it("no fabricated concept IDs", () => {
    expect(isValidCoreConceptId("java-arraylist")).toBe(true);
    expect(isValidCoreConceptId("totally-made-up-pack")).toBe(false);
    const hints = coreLearningActionHints(
      buildCoreLearningContent({
        sourceId: "n",
        userId: "u1",
        content: "ArrayList notes in Java.",
        title: "ArrayList in Java",
      }),
    );
    expect(hints.some((h) => h.action === "learn")).toBe(true);
  });
});
