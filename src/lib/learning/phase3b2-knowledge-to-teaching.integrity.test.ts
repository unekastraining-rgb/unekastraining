/**
 * Phase 3B-2 — Knowledge Library → Teaching Engine.
 * Library supplies structured knowledge; Teaching Engine builds lessons;
 * Phase 2B validation remains mandatory.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildSixLessonUserPrompt,
  buildSubjectAwareFallbackLesson,
} from "@/lib/csl/six-worked-lesson";
import { validateAiLesson } from "@/lib/csl/validate-ai-lesson";
import type { SixWorkedLesson } from "@/lib/csl/six-worked-lesson";
import {
  buildLessonFromKnowledgeLibrary,
  instructionalSourceForTeaching,
  isPlaceholderScaffoldLesson,
  synthesizeInstructionalLesson,
} from "@/lib/learning/knowledge/instructional-library";
import {
  formatKnowledgeLibraryPromptBlock,
  lessonFromTeachingKnowledgeContext,
  resolveTeachingKnowledgeContext,
} from "@/lib/learning/knowledge/teaching-knowledge-context";
import "@/lib/learning/knowledge/packs";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

function baseLesson(
  topic: string,
  chunks: SixWorkedLesson["chunks"],
): SixWorkedLesson {
  return {
    component: "detailed-explanation",
    topic,
    learningFrame: `You're learning ${topic}.`,
    roadmap: chunks.map((c) => c.title),
    chunks,
    cheatSheet: chunks.map((c) => c.title).join(" → "),
    practicePrompts: [
      { title: "Explain", prompt: `Explain ${topic}.`, tip: "Cover first." },
      { title: "Apply", prompt: `Apply ${topic}.`, tip: "Use an example." },
    ],
  };
}

describe("Phase 3B-2 Knowledge → Teaching Engine", () => {
  it("ArrayList in Java → teaching context + Java-aligned lesson", () => {
    const ctx = resolveTeachingKnowledgeContext("ArrayList in Java");
    expect(ctx).not.toBeNull();
    expect(ctx!.domain).toBe("programming");
    expect(ctx!.subject).toBe("java");
    expect(ctx!.resolution).toBe("single-concept");
    expect(ctx!.primaryConcept?.id).toBe("java-arraylist");
    expect(ctx!.concepts.map((c) => c.id)).toEqual(["java-arraylist"]);

    const block = formatKnowledgeLibraryPromptBlock(ctx!);
    expect(block).toContain("## KNOWLEDGE LIBRARY CONTEXT");
    expect(block).toMatch(/ArrayList|java\.util/i);
    expect(block).not.toMatch(/python|def |mortgage/i);

    const lesson = lessonFromTeachingKnowledgeContext(
      "detailed-explanation",
      "ArrayList in Java",
      ctx!,
    );
    expect(lesson.chunks.length).toBeGreaterThanOrEqual(1);
    expect(lesson.chunks[0]?.title).toMatch(/ArrayList/i);
    expect(lesson.chunks.some((c) => /python|def /i.test(c.explanation))).toBe(
      false,
    );

    const prompt = buildSixLessonUserPrompt({
      component: "detailed-explanation",
      topic: "ArrayList in Java",
      knowledgeLibraryBlock: block,
    });
    expect(prompt).toContain("## KNOWLEDGE LIBRARY CONTEXT");
    expect(prompt).toContain("## CANONICAL LEARNING TARGET");
  });

  it("Python variables → python teaching context", () => {
    const ctx = resolveTeachingKnowledgeContext("Python variables");
    expect(ctx!.subject).toBe("python");
    expect(ctx!.primaryConcept?.id).toBe("python-variables");
    expect(ctx!.concepts.every((c) => c.id.startsWith("python-"))).toBe(true);
    expect(ctx!.concepts.some((c) => c.id.startsWith("java-"))).toBe(false);
  });

  it("Supply and demand → economics teaching context", () => {
    const ctx = resolveTeachingKnowledgeContext("Supply and demand");
    expect(ctx!.domain).toBe("business");
    expect(ctx!.subject).toBe("economics");
    expect(ctx!.primaryConcept?.id).toBe("economics-supply-demand");
    const lesson = buildLessonFromKnowledgeLibrary(
      "detailed-explanation",
      "Supply and demand",
    );
    expect(lesson).not.toBeNull();
    expect(lesson!.chunks[0]?.explanation.toLowerCase()).toMatch(
      /demand|supply|equilibrium/,
    );
    expect(lesson!.chunks[0]?.explanation.toLowerCase()).not.toMatch(
      /dividend|p\/e|mortgage/,
    );
  });

  it("P/E ratio → stocks teaching context", () => {
    const ctx = resolveTeachingKnowledgeContext("P/E ratio");
    expect(ctx!.domain).toBe("finance");
    expect(ctx!.subject).toBe("stocks");
    expect(ctx!.primaryConcept?.id).toBe("stocks-pe-ratio");
    const lesson = buildLessonFromKnowledgeLibrary(
      "detailed-explanation",
      "P/E ratio",
    );
    expect(lesson!.chunks.some((c) => /mortgage|amortization/i.test(c.title))).toBe(
      false,
    );
  });

  it("Python Programming fundamentals → controlled multi-concept path", () => {
    const ctx = resolveTeachingKnowledgeContext(
      "Python Programming fundamentals",
    );
    expect(ctx).not.toBeNull();
    expect(ctx!.resolution).toBe("learning-path");
    expect(ctx!.learningPathId).toBe("python-programming-fundamentals");
    expect(ctx!.concepts.map((c) => c.id)).toEqual([
      "python-variables",
      "python-conditionals",
      "python-loops",
      "python-functions",
      "python-lists",
      "python-dictionaries",
      "python-exceptions",
    ]);
    expect(ctx!.concepts.some((c) => c.id.startsWith("java-"))).toBe(false);

    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Python Programming fundamentals",
    );
    expect(lesson).not.toBeNull();
    expect(lesson!.chunks.map((c) => c.title).join(" ")).toMatch(/variable/i);
    expect(lesson!.chunks.map((c) => c.title).join(" ")).toMatch(
      /conditional|if/i,
    );
    expect(lesson!.chunks.map((c) => c.title).join(" ")).toMatch(/function/i);
  });

  it("cross-domain: bare python / programming / stocks do not over-expand", () => {
    expect(resolveTeachingKnowledgeContext("python")).toBeNull();
    expect(resolveTeachingKnowledgeContext("programming")).toBeNull();
    expect(resolveTeachingKnowledgeContext("business")).toBeNull();
    // Stocks resolves to share concept — not every finance concept and not mortgages.
    const stocks = resolveTeachingKnowledgeContext("Stocks");
    expect(stocks!.pack?.id).toBe("stocks-fundamentals");
    expect(stocks!.pack?.id).not.toBe("business-mortgages");
  });

  it("Phase 2B validation still required — library grounding is not a bypass", () => {
    const ctx = resolveTeachingKnowledgeContext("ArrayList in Java");
    const block = formatKnowledgeLibraryPromptBlock(ctx!);

    const valid = baseLesson("ArrayList in Java", [
      {
        title: "Why ArrayList exists",
        role: "context",
        explanation:
          "Fixed Java arrays cannot grow. ArrayList in java.util stores objects in order and grows as you add elements with add().",
        example: "ArrayList<String> names = new ArrayList<>(); names.add(\"Ada\");",
        checkPrompt: "What problem does ArrayList solve?",
      },
      {
        title: "Core operations",
        role: "concept",
        explanation:
          "Use get, set, remove, and size to read and update the list. Indexing is zero-based like arrays.",
        example: "String first = names.get(0); int n = names.size();",
        representation: "names → [Ada, Grace]",
      },
      {
        title: "Worked example",
        role: "worked",
        explanation:
          "Create an ArrayList, add two names, replace one with set, then remove an index and check size.",
        example:
          "names.add(\"Grace\"); names.set(1, \"Alan\"); names.remove(0);",
        breakdown: "add → set → remove → size",
        checkPrompt: "Which method grows the list?",
      },
      {
        title: "Apply",
        role: "apply",
        explanation:
          "Invent a short task that needs a growable list of Integers and name the methods you would call.",
        example: "ArrayList<Integer> scores = new ArrayList<>();",
      },
    ]);
    expect(
      validateAiLesson({
        lesson: valid,
        canonicalTarget: "ArrayList in Java",
        courseTitle: "Java",
      }).accepted,
    ).toBe(true);

    const wrongDomain = baseLesson("ArrayList in Java", [
      {
        title: "Python variables",
        role: "concept",
        explanation:
          "In Python a variable stores a value with name = value so you can reuse it later in the program.",
        example: "x = 5",
      },
      {
        title: "Python loops",
        role: "explain",
        explanation:
          "A for-loop in Python repeats a block for each item in a list or range.",
        example: "for i in range(3): print(i)",
      },
      {
        title: "Python functions",
        role: "worked",
        explanation:
          "Define a Python function with def so you can call reusable logic with parameters and return values.",
        example: "def add(a, b): return a + b",
      },
    ]);
    const wrong = validateAiLesson({
      lesson: wrongDomain,
      canonicalTarget: "ArrayList in Java",
      courseTitle: "Java",
    });
    expect(wrong.accepted).toBe(false);

    const scaffold = synthesizeInstructionalLesson(
      "detailed-explanation",
      "ArrayList in Java",
    );
    expect(isPlaceholderScaffoldLesson(scaffold)).toBe(true);
    expect(
      validateAiLesson({
        lesson: scaffold,
        canonicalTarget: "ArrayList in Java",
      }).accepted,
    ).toBe(false);

    // Prompt still carries library block without bypassing validation wiring.
    expect(block).toContain("KNOWLEDGE LIBRARY CONTEXT");
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("validateAiLesson");
    expect(route).toContain("resolveTeachingKnowledgeContext");
    expect(route).toContain("knowledgeLibraryBlock");
  });

  it("Phase 2A StudyTopicProfile still excluded; library is separate grounding", () => {
    const profile = JSON.stringify({
      kind: "study_topic",
      title: "ArrayList in Java",
      summary: "Build understanding.",
      subtopics: [{ name: "Core concepts", description: "Basics" }],
      suggestedTechniques: [],
      createdAt: "2026-09-27T00:00:00.000Z",
    });
    expect(instructionalSourceForTeaching(profile)).toBeNull();

    const ctx = resolveTeachingKnowledgeContext("ArrayList in Java");
    const prompt = buildSixLessonUserPrompt({
      component: "detailed-explanation",
      topic: "ArrayList in Java",
      sourceText: profile,
      knowledgeLibraryBlock: formatKnowledgeLibraryPromptBlock(ctx!),
    });
    expect(prompt).toContain("## KNOWLEDGE LIBRARY CONTEXT");
    expect(prompt).not.toContain('"kind": "study_topic"');
    expect(prompt).toMatch(/organizational only|None attached/i);
  });

  it("OOD specialized path unchanged", () => {
    expect(resolveTeachingKnowledgeContext("Classes & Objects")).toBeNull();
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Classes & Objects",
    );
    expect(lesson!.chunks[0]?.explanation.toLowerCase()).toMatch(
      /dealership|cars/,
    );
  });
});
