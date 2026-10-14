/**
 * Phase 3A — Knowledge Library foundation.
 * Library stores/resolves knowledge; it does not invent unknowns or generate lessons.
 */
import { describe, expect, it } from "vitest";

import {
  buildSubjectAwareFallbackLesson,
} from "@/lib/csl/six-worked-lesson";
import {
  buildLessonFromKnowledgeLibrary,
  lessonFromInstructionalPack,
  resolveInstructionalKnowledge,
  type InstructionalConceptKnowledge,
} from "@/lib/learning/knowledge/instructional-library";
import {
  getKnowledgeConcept,
  getKnowledgePack,
  hasKnowledgeForTarget,
  listKnowledgePacks,
  resolveKnowledge,
} from "@/lib/learning/knowledge/knowledge-library";
import "@/lib/learning/knowledge/packs";

describe("Phase 3A Knowledge Library foundation", () => {
  it("Test A — existing mortgage pack resolves", () => {
    const resolved = resolveKnowledge("How do mortgages work?");
    expect(resolved).not.toBeNull();
    expect(resolved!.pack.id).toBe("business-mortgages");
    expect(resolved!.matchScore).toBeGreaterThanOrEqual(4);
    expect(hasKnowledgeForTarget("mortgages")).toBe(true);
  });

  it("Test B — existing exception/file-I/O pack resolves", () => {
    const resolved = resolveInstructionalKnowledge(
      "Exception Handling and File I/O",
    );
    expect(resolved).not.toBeNull();
    expect(resolved!.pack.id).toBe("java-exception-handling-file-io");
    expect(resolved!.source).toBe("pack");
  });

  it("Test C — Stocks resolves to stocks pack, never mortgages", () => {
    const resolved = resolveKnowledge("Stocks");
    expect(resolved).not.toBeNull();
    expect(resolved!.pack.id).toBe("stocks-fundamentals");
    expect(resolved!.domain).toBe("finance");
    expect(resolved!.subject).toBe("stocks");
    // Domain proximity must not invent mortgage knowledge.
    expect(resolved!.pack.id).not.toBe("business-mortgages");
  });

  it("Test D — Python Programming fundamentals uses controlled learning path", () => {
    const resolved = resolveKnowledge("Python Programming fundamentals");
    expect(resolved).not.toBeNull();
    expect(resolved!.pack.id).toBe("python-fundamentals");
    expect(resolved!.subject).toBe("python");
    const ids = resolved!.pack.concepts.map((c) => c.id);
    expect(ids).toEqual([
      "python-variables",
      "python-conditionals",
      "python-loops",
      "python-functions",
      "python-lists",
      "python-dictionaries",
      "python-exceptions",
    ]);
    // Not every programming concept / not Java.
    expect(ids.some((id) => id.startsWith("java-"))).toBe(false);
  });

  it("Test E — packs expose domain/subject metadata", () => {
    const mortgages = getKnowledgePack("business-mortgages");
    expect(mortgages).not.toBeNull();
    expect(mortgages!.domain).toBe("business");
    expect(mortgages!.subject).toBe("finance");

    const exceptions = getKnowledgePack("java-exception-handling-file-io");
    expect(exceptions).not.toBeNull();
    expect(exceptions!.domain).toBe("programming");
    expect(exceptions!.subject).toBe("java");

    const resolved = resolveKnowledge("mortgage");
    expect(resolved!.domain).toBe("business");
    expect(resolved!.subject).toBe("finance");
    expect(resolved!.confidence).toBeGreaterThan(0);
  });

  it("Test F — concept model supports rich instructional fields", () => {
    const concept: InstructionalConceptKnowledge = {
      id: "demo-arraylist",
      title: "ArrayList",
      definition: "A resizable array-backed list in Java.",
      explanation:
        "ArrayList stores elements in order and grows as you add items.",
      examples: ["list.add(1)", "list.get(0)"],
      nonExamples: ["A fixed-length array that cannot grow"],
      misconceptions: ["ArrayList is the same as an array"],
      prerequisites: ["arrays", "generics-basics"],
      relatedConcepts: ["LinkedList", "List interface"],
      vocabulary: ["element", "capacity", "index"],
      workedExamples: ["Create an ArrayList<String> and add two names"],
      practiceForms: ["code", "trace"],
      masteryCriteria: ["Can add, get, and remove by index"],
    };

    expect(concept.definition).toBeTruthy();
    expect(concept.explanation).toBeTruthy();
    expect(concept.examples?.length).toBeGreaterThan(0);
    expect(concept.misconceptions?.length).toBeGreaterThan(0);
    expect(concept.prerequisites?.length).toBeGreaterThan(0);
    expect(concept.relatedConcepts?.length).toBeGreaterThan(0);
    expect(concept.practiceForms?.length).toBeGreaterThan(0);

    // ArrayList is now a registered concept (Phase 3B-1).
    expect(resolveKnowledge("ArrayList")?.matchedConcept?.id).toBe(
      "java-arraylist",
    );
    // Still-unregistered demo id is not inventively resolved.
    expect(resolveKnowledge("unregistered-demo-concept-zz")).toBeNull();
    expect(getKnowledgeConcept("java-exception-handling-file-io", "why-exceptions"))
      .not.toBeNull();
  });

  it("Test G — existing pack still becomes a Learn lesson via teaching adapter", () => {
    const resolved = resolveKnowledge("Exception Handling and File I/O");
    expect(resolved).not.toBeNull();
    const lesson = lessonFromInstructionalPack(
      "detailed-explanation",
      "Exception Handling and File I/O",
      resolved!.pack,
    );
    expect(lesson.chunks.length).toBeGreaterThanOrEqual(3);
    expect(lesson.chunks[0]?.explanation.toLowerCase()).toMatch(
      /exception|fail|file/,
    );

    const viaBuilder = buildLessonFromKnowledgeLibrary(
      "detailed-explanation",
      "How do mortgages work?",
    );
    expect(viaBuilder).not.toBeNull();
    expect(viaBuilder!.topic.toLowerCase()).toMatch(/mortgage/);
  });

  it("Test H — OOD specialized path is not intercepted by the library", () => {
    expect(resolveKnowledge("Classes & Objects")).toBeNull();
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Classes & Objects",
    );
    expect(lesson).not.toBeNull();
    expect(lesson!.chunks[0]?.explanation.toLowerCase()).toMatch(
      /dealership|imagine|hundreds of cars|why/,
    );
  });

  it("Test I — unknown target produces no library lesson / no fake knowledge", () => {
    expect(
      buildLessonFromKnowledgeLibrary(
        "detailed-explanation",
        "quantum gardening",
      ),
    ).toBeNull();
    expect(
      buildSubjectAwareFallbackLesson(
        "detailed-explanation",
        "quantum gardening",
      ),
    ).toBeNull();
    // Stocks now has real knowledge (Phase 3B-1) — must not map to mortgages.
    const stocksLesson = buildLessonFromKnowledgeLibrary(
      "detailed-explanation",
      "Stocks",
    );
    expect(stocksLesson).not.toBeNull();
    expect(stocksLesson!.cheatSheet.toLowerCase()).toMatch(/share|market cap|p\/e/);
    expect(listKnowledgePacks().some((p) => p.id === "business-mortgages")).toBe(
      true,
    );
  });

  it("concept-level resolution finds registered concepts without domain guessing", () => {
    const amort = resolveKnowledge("amortization");
    expect(amort).not.toBeNull();
    expect(amort!.pack.id).toBe("business-mortgages");
    // May resolve via pack.match and/or concept title — both are registered knowledge.
    expect(["pack", "concept"]).toContain(amort!.source);

    // Distinctive concept title inside the pack (not a pack-level keyword alone)
    const principal = resolveKnowledge("Principal and interest");
    expect(principal).not.toBeNull();
    expect(principal!.pack.id).toBe("business-mortgages");
    expect(principal!.matchedConcept?.id).toBe("principal-interest");
    expect(principal!.source).toBe("concept");
  });
});
