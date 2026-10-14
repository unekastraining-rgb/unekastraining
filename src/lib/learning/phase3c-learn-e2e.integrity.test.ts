/**
 * Phase 3C — End-to-end Learn verification & hardening.
 *
 * Proves: target → grounding separation → Knowledge Library → Teaching Context
 * → AI/deterministic teaching → validateAiLesson → lesson → room consumers.
 *
 * Minimal hardening only when a concrete defect is found.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildSixLessonUserPrompt,
  buildSubjectAwareFallbackLesson,
  type SixWorkedLesson,
} from "@/lib/csl/six-worked-lesson";
import { validateAiLesson } from "@/lib/csl/validate-ai-lesson";
import {
  buildLessonFromKnowledgeLibrary,
  instructionalSourceForTeaching,
  isPlaceholderScaffoldLesson,
  looksLikeStudyTopicProfileSource,
  resolveInstructionalKnowledge,
  synthesizeInstructionalLesson,
} from "@/lib/learning/knowledge/instructional-library";
import {
  formatKnowledgeLibraryPromptBlock,
  resolveTeachingKnowledgeContext,
} from "@/lib/learning/knowledge/teaching-knowledge-context";
import { resolveInstructionalContext } from "@/lib/study/resolve-instructional-context";
import { resolveStudyRoomHref } from "@/lib/study/resolve-study-room";
import "@/lib/learning/knowledge/packs";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

function assertLessonConsumerShape(lesson: SixWorkedLesson) {
  expect(lesson.component).toBeTruthy();
  expect(lesson.topic.trim().length).toBeGreaterThan(0);
  expect(lesson.learningFrame.trim().length).toBeGreaterThan(0);
  expect(lesson.cheatSheet.trim().length).toBeGreaterThan(0);
  expect(lesson.chunks.length).toBeGreaterThanOrEqual(1);
  for (const chunk of lesson.chunks) {
    expect(chunk.title.trim().length).toBeGreaterThan(0);
    expect(chunk.explanation.trim().length).toBeGreaterThan(20);
    expect(typeof chunk.example).toBe("string");
  }
  expect(lesson.practicePrompts.length).toBeGreaterThanOrEqual(2);
  for (const p of lesson.practicePrompts) {
    expect(p.title.trim().length).toBeGreaterThan(0);
    expect(p.prompt.trim().length).toBeGreaterThan(0);
  }
  // Serialization / deserialization for UI + Tutor consumers
  const round = JSON.parse(JSON.stringify(lesson)) as SixWorkedLesson;
  expect(round.chunks.length).toBe(lesson.chunks.length);
  expect(round.topic).toBe(lesson.topic);
  expect(round.practicePrompts.length).toBe(lesson.practicePrompts.length);
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

/** Simulate Learn request assembly (route-equivalent, no network). */
function assembleLearnTeachingInputs(topic: string, rawSource?: string) {
  const instructional = resolveInstructionalContext({
    topic,
    sourceText: instructionalSourceForTeaching(rawSource) ?? undefined,
  });
  const teachingTopic = instructional.teachingTopic;
  const teachingKnowledge = resolveTeachingKnowledgeContext(teachingTopic);
  const knowledgeLibraryBlock = teachingKnowledge
    ? formatKnowledgeLibraryPromptBlock(teachingKnowledge)
    : null;
  const groundingSource =
    instructionalSourceForTeaching(rawSource) ?? undefined;
  const sourceTextForPrompt =
    groundingSource ??
    (rawSource && !looksLikeStudyTopicProfileSource(rawSource)
      ? rawSource
      : undefined);
  const prompt = buildSixLessonUserPrompt({
    component: "detailed-explanation",
    topic: teachingTopic,
    sourceText: sourceTextForPrompt,
    concepts: instructional.concepts,
    knowledgeLibraryBlock,
  });
  return {
    instructional,
    teachingTopic,
    teachingKnowledge,
    knowledgeLibraryBlock,
    groundingSource,
    prompt,
  };
}

describe("Phase 3C end-to-end Learn verification", () => {
  it("documents the Learn runtime path in code", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    const route = read("app/api/study/six-lesson/route.ts");
    const worked = read("src/lib/csl/six-worked-lesson.ts");
    expect(teach).toContain('/api/study/six-lesson');
    expect(route).toContain("resolveTeachingKnowledgeContext");
    expect(route).toContain("validateAiLesson");
    expect(route).toContain("buildSubjectAwareFallbackLesson");
    expect(route).toContain("instructionalSourceForTeaching");
    expect(worked).toContain("specializedChunkingLesson");
    expect(worked).toContain("buildLessonFromKnowledgeLibrary");
    expect(worked).toContain("knowledgeLibraryBlock");
  });

  it("Scenario A — ArrayList in Java single-concept path", () => {
    const assembled = assembleLearnTeachingInputs("ArrayList in Java");
    expect(assembled.teachingTopic).toBe("ArrayList in Java");
    expect(assembled.teachingKnowledge).not.toBeNull();
    expect(assembled.teachingKnowledge!.domain).toBe("programming");
    expect(assembled.teachingKnowledge!.subject).toBe("java");
    expect(assembled.teachingKnowledge!.resolution).toBe("single-concept");
    expect(assembled.teachingKnowledge!.concepts.map((c) => c.id)).toEqual([
      "java-arraylist",
    ]);
    expect(assembled.prompt).toContain("## KNOWLEDGE LIBRARY CONTEXT");
    expect(assembled.prompt).toMatch(/ArrayList/i);
    expect(assembled.prompt).not.toMatch(/\bdef\s+|python variables/i);

    const lesson = buildLessonFromKnowledgeLibrary(
      "detailed-explanation",
      "ArrayList in Java",
    );
    expect(lesson).not.toBeNull();
    expect(lesson!.chunks.length).toBe(1);
    expect(lesson!.chunks[0]?.title).toMatch(/ArrayList/i);
    assertLessonConsumerShape(lesson!);
  });

  it("Scenario B — Python variables single-concept path", () => {
    const assembled = assembleLearnTeachingInputs("Python variables");
    expect(assembled.teachingKnowledge!.subject).toBe("python");
    expect(assembled.teachingKnowledge!.resolution).toBe("single-concept");
    expect(assembled.teachingKnowledge!.primaryConcept?.id).toBe(
      "python-variables",
    );
    expect(
      assembled.teachingKnowledge!.concepts.some((c) =>
        c.id.startsWith("java-"),
      ),
    ).toBe(false);
    expect(assembled.prompt).toContain("## KNOWLEDGE LIBRARY CONTEXT");

    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Python variables",
    );
    expect(lesson).not.toBeNull();
    expect(lesson!.chunks[0]?.explanation).toMatch(/python|=/i);
    expect(lesson!.chunks[0]?.explanation).not.toMatch(/ArrayList|extends/i);
    assertLessonConsumerShape(lesson!);
  });

  it("Scenario C — Python Programming fundamentals explicit path", () => {
    const assembled = assembleLearnTeachingInputs(
      "Python Programming fundamentals",
    );
    expect(assembled.teachingKnowledge!.resolution).toBe("learning-path");
    expect(assembled.teachingKnowledge!.learningPathId).toBe(
      "python-programming-fundamentals",
    );
    expect(assembled.teachingKnowledge!.concepts.map((c) => c.id)).toEqual([
      "python-variables",
      "python-conditionals",
      "python-loops",
      "python-functions",
      "python-lists",
      "python-dictionaries",
      "python-exceptions",
    ]);
    expect(
      assembled.teachingKnowledge!.concepts.some((c) =>
        c.id.startsWith("java-"),
      ),
    ).toBe(false);

    const lesson = buildLessonFromKnowledgeLibrary(
      "detailed-explanation",
      "Python Programming fundamentals",
    );
    expect(lesson).not.toBeNull();
    expect(lesson!.chunks.length).toBe(7);
    expect(lesson!.chunks.map((c) => c.title).join(" → ")).toMatch(
      /variable/i,
    );
    expect(lesson!.chunks.map((c) => c.title).join(" → ")).toMatch(
      /conditional|if/i,
    );
    expect(lesson!.chunks.map((c) => c.title).join(" → ")).toMatch(/loop/i);
    expect(lesson!.chunks.map((c) => c.title).join(" → ")).toMatch(/function/i);
    // Coherent path framing, not three unrelated pasted lessons without linkage.
    expect(lesson!.learningFrame.toLowerCase()).toMatch(/python/);
    expect(lesson!.cheatSheet).toContain("→");
    assertLessonConsumerShape(lesson!);
  });

  it("Scenario D — Supply and demand economics", () => {
    const assembled = assembleLearnTeachingInputs("Supply and demand");
    expect(assembled.teachingKnowledge!.domain).toBe("business");
    expect(assembled.teachingKnowledge!.subject).toBe("economics");
    expect(assembled.teachingKnowledge!.primaryConcept?.id).toBe(
      "economics-supply-demand",
    );
    const lesson = buildLessonFromKnowledgeLibrary(
      "detailed-explanation",
      "Supply and demand",
    );
    expect(lesson!.chunks[0]?.explanation.toLowerCase()).toMatch(
      /demand|supply|equilibrium/,
    );
    expect(lesson!.chunks[0]?.explanation.toLowerCase()).not.toMatch(
      /dividend|p\/e ratio|mortgage principal/,
    );
    assertLessonConsumerShape(lesson!);
  });

  it("Scenario E — P/E ratio and Stocks (finance, not mortgages)", () => {
    const pe = assembleLearnTeachingInputs("P/E ratio");
    expect(pe.teachingKnowledge!.domain).toBe("finance");
    expect(pe.teachingKnowledge!.subject).toBe("stocks");
    expect(pe.teachingKnowledge!.primaryConcept?.id).toBe("stocks-pe-ratio");
    const peLesson = buildLessonFromKnowledgeLibrary(
      "detailed-explanation",
      "P/E ratio",
    );
    expect(peLesson!.chunks[0]?.explanation.toLowerCase()).toMatch(
      /earnings|price|eps|p\/e/,
    );
    expect(peLesson!.chunks[0]?.explanation.toLowerCase()).not.toMatch(
      /amortization|foreclosure|buy this stock now/,
    );
    assertLessonConsumerShape(peLesson!);

    const stocks = assembleLearnTeachingInputs("Stocks");
    expect(stocks.teachingKnowledge!.pack?.id).toBe("stocks-fundamentals");
    expect(stocks.teachingKnowledge!.pack?.id).not.toBe("business-mortgages");
    expect(stocks.teachingKnowledge!.pack?.id).not.toBe(
      "economics-fundamentals",
    );
    expect(stocks.teachingKnowledge!.subject).toBe("stocks");
  });

  it("Scenario F — OOD specialized dealership path unchanged", () => {
    expect(resolveTeachingKnowledgeContext("Classes & Objects")).toBeNull();
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Classes & Objects",
    );
    expect(lesson).not.toBeNull();
    expect(lesson!.chunks[0]?.explanation.toLowerCase()).toMatch(
      /dealership|hundreds of cars|imagine/,
    );
    // Specialized runs before library in the fallback ladder body.
    const worked = read("src/lib/csl/six-worked-lesson.ts");
    const fallbackFn = worked.slice(
      worked.indexOf("export function buildSubjectAwareFallbackLesson"),
      worked.indexOf("export function buildDeterministicSixLesson"),
    );
    expect(fallbackFn.indexOf("specializedChunkingLesson")).toBeGreaterThan(-1);
    expect(fallbackFn.indexOf("buildLessonFromKnowledgeLibrary")).toBeGreaterThan(
      fallbackFn.indexOf("specializedChunkingLesson"),
    );
    assertLessonConsumerShape(lesson!);
  });

  it("Scenario G — existing mortgage + exception packs still work", () => {
    expect(resolveInstructionalKnowledge("How do mortgages work?")?.pack.id).toBe(
      "business-mortgages",
    );
    const mortgageLesson = buildLessonFromKnowledgeLibrary(
      "detailed-explanation",
      "How do mortgages work?",
    );
    expect(mortgageLesson).not.toBeNull();
    expect(mortgageLesson!.chunks[0]?.explanation.toLowerCase()).toMatch(
      /mortgage|principal|loan/,
    );
    assertLessonConsumerShape(mortgageLesson!);

    expect(
      resolveInstructionalKnowledge("Exception Handling and File I/O")?.pack
        .id,
    ).toBe("java-exception-handling-file-io");
    const exLesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Exception Handling and File I/O",
    );
    expect(exLesson!.chunks[0]?.explanation.toLowerCase()).toMatch(
      /exception|fail|file/,
    );
    assertLessonConsumerShape(exLesson!);
  });

  it("Scenario H — unknown target stays unknown (honest miss)", () => {
    const assembled = assembleLearnTeachingInputs("quantum gardening");
    expect(assembled.teachingKnowledge).toBeNull();
    expect(assembled.knowledgeLibraryBlock).toBeNull();
    expect(assembled.prompt).not.toContain("## KNOWLEDGE LIBRARY CONTEXT");
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
  });

  it("Scenario I — Python fundamentals path vs bare Python", () => {
    expect(
      resolveTeachingKnowledgeContext("Python Programming fundamentals")
        ?.learningPathId,
    ).toBe("python-programming-fundamentals");
    expect(resolveTeachingKnowledgeContext("Python")).toBeNull();
    expect(resolveTeachingKnowledgeContext("python")).toBeNull();
  });

  it("AI success path: Library grounding reaches prompt; validation still mandatory", () => {
    const assembled = assembleLearnTeachingInputs("ArrayList in Java");
    expect(assembled.prompt).toContain("## CANONICAL LEARNING TARGET");
    expect(assembled.prompt).toContain("## KNOWLEDGE LIBRARY CONTEXT");
    expect(assembled.prompt).toContain("java-arraylist");
    // Not the entire registry
    expect(assembled.prompt).not.toContain("stocks-pe-ratio");
    expect(assembled.prompt).not.toContain("business-mortgages");
    expect(assembled.prompt).not.toContain("python-functions");

    const valid = baseLesson("ArrayList in Java", [
      {
        title: "Why ArrayList exists",
        role: "context",
        explanation:
          "Fixed Java arrays cannot grow. ArrayList in java.util stores objects and grows with add().",
        example: "ArrayList<String> names = new ArrayList<>(); names.add(\"Ada\");",
        checkPrompt: "What problem does ArrayList solve?",
      },
      {
        title: "Core operations",
        role: "concept",
        explanation:
          "Use get, set, remove, and size. Indexing is zero-based like arrays.",
        example: "String first = names.get(0);",
        representation: "names → [Ada]",
      },
      {
        title: "Worked example",
        role: "worked",
        explanation:
          "Create an ArrayList, add two names, set one, remove an index, check size.",
        example: "names.set(1, \"Alan\"); names.remove(0);",
        breakdown: "add → set → remove → size",
      },
      {
        title: "Apply",
        role: "apply",
        explanation:
          "Invent a short task needing a growable list of Integers and name the methods.",
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

    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("validateAiLesson");
    expect(route).toContain("knowledgeLibraryBlock");
  });

  it("AI rejection path: wrong subject / placeholder / meta / thin structure", () => {
    const wrong = validateAiLesson({
      lesson: baseLesson("ArrayList in Java", [
        {
          title: "Python variables",
          role: "concept",
          explanation:
            "In Python a variable stores a value with name = value for later reuse.",
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
            "Define a Python function with def so you can call reusable logic.",
          example: "def add(a, b): return a + b",
        },
      ]),
      canonicalTarget: "ArrayList in Java",
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

    const meta = baseLesson("ArrayList in Java", [
      {
        title: "Take notes",
        role: "context",
        explanation:
          "Take notes while you study so you remember what you read later.",
        example: "Write key points in a notebook.",
      },
      {
        title: "Review your notes",
        role: "explain",
        explanation:
          "Review your notes regularly using active recall instead of rereading.",
        example: "Cover the page and recite ideas.",
      },
      {
        title: "Study regularly",
        role: "apply",
        explanation:
          "Study regularly with spaced repetition and flashcards over time.",
        example: "Use a pomodoro timer every other day.",
      },
    ]);
    expect(
      validateAiLesson({
        lesson: meta,
        canonicalTarget: "ArrayList in Java",
      }).accepted,
    ).toBe(false);

    const thin = baseLesson("ArrayList in Java", [
      { title: "A", role: "concept", explanation: "Too short.", example: "x" },
      { title: "B", role: "explain", explanation: "Also short.", example: "y" },
      { title: "C", role: "apply", explanation: "Still short.", example: "z" },
    ]);
    expect(
      validateAiLesson({
        lesson: thin,
        canonicalTarget: "ArrayList in Java",
      }).accepted,
    ).toBe(false);
  });

  it("AI failure → deterministic Library lesson for known target", () => {
    // Mimic six-lesson catch: subject-aware fallback uses Library.
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "ArrayList in Java",
    );
    expect(lesson).not.toBeNull();
    expect(isPlaceholderScaffoldLesson(lesson!)).toBe(false);
    expect(lesson!.chunks[0]?.title).toMatch(/ArrayList/i);
    assertLessonConsumerShape(lesson!);
  });

  it("Unknown + AI failure → honest null (no fake lesson)", () => {
    expect(
      buildSubjectAwareFallbackLesson(
        "detailed-explanation",
        "quantum gardening",
      ),
    ).toBeNull();
  });

  it("Phase 2A StudyTopicProfile excluded; Library remains separate", () => {
    const profile = JSON.stringify(
      {
        kind: "study_topic",
        title: "ArrayList in Java",
        summary: "Build understanding of ArrayList.",
        subtopics: [
          { name: "Core concepts", description: "What ArrayList is" },
        ],
        suggestedTechniques: ["Flashcards"],
        createdAt: "2026-09-27T00:00:00.000Z",
      },
      null,
      2,
    );
    expect(looksLikeStudyTopicProfileSource(profile)).toBe(true);
    expect(instructionalSourceForTeaching(profile)).toBeNull();

    const assembled = assembleLearnTeachingInputs("ArrayList in Java", profile);
    expect(assembled.groundingSource).toBeUndefined();
    expect(assembled.knowledgeLibraryBlock).toContain(
      "KNOWLEDGE LIBRARY CONTEXT",
    );
    expect(assembled.prompt).toContain("## KNOWLEDGE LIBRARY CONTEXT");
    expect(assembled.prompt).not.toContain('"kind": "study_topic"');
    expect(assembled.prompt).toMatch(/organizational only|None attached/i);
  });

  it("Library + legitimate source + AI prompt keep distinctions", () => {
    const textbook = `
CHAPTER 3 COLLECTIONS IN JAVA
An ArrayList stores a resizable sequence of object references.
Use add and get when teaching introductory collection types.
`.trim();
    expect(instructionalSourceForTeaching(textbook)).not.toBeNull();

    const assembled = assembleLearnTeachingInputs(
      "ArrayList in Java",
      textbook,
    );
    expect(assembled.teachingTopic).toBe("ArrayList in Java");
    expect(assembled.prompt).toContain("## CANONICAL LEARNING TARGET");
    expect(assembled.prompt).toContain("## KNOWLEDGE LIBRARY CONTEXT");
    expect(assembled.prompt).toContain("## OPTIONAL INSTRUCTIONAL GROUNDING");
    expect(assembled.prompt).toMatch(/resizable sequence|ArrayList/i);
    // Not undifferentiated mush: sections remain labeled.
    expect(assembled.prompt.indexOf("KNOWLEDGE LIBRARY CONTEXT")).toBeLessThan(
      assembled.prompt.indexOf("OPTIONAL INSTRUCTIONAL GROUNDING"),
    );
  });

  it("Practice / Check / Remember / Tutor room hrefs accept Library lesson topic", () => {
    const lesson = buildLessonFromKnowledgeLibrary(
      "detailed-explanation",
      "Python variables",
    );
    expect(lesson).not.toBeNull();
    const ctx = {
      courseId: "course-py",
      topic: lesson!.topic,
      materialId: null,
      courseTitle: "Python",
    };
    for (const room of ["practice", "check", "remember", "tutor"] as const) {
      const href = resolveStudyRoomHref(room, ctx);
      expect(href).toContain("topic=");
      expect(decodeURIComponent(href)).toMatch(/Python|variable/i);
    }
    // Tutor consumers need serializable chunk summaries
    const summary = lesson!.chunks
      .map((c, i) => `${i + 1}. ${c.title}: ${c.explanation.slice(0, 120)}`)
      .join("\n");
    expect(summary.length).toBeGreaterThan(40);
  });

  it("resolver determinism: repeated ArrayList resolution is stable", () => {
    const a = resolveTeachingKnowledgeContext("ArrayList in Java");
    const b = resolveTeachingKnowledgeContext("ArrayList in Java");
    const c = resolveTeachingKnowledgeContext("ArrayList in Java");
    expect(a).toEqual(b);
    expect(b).toEqual(c);
    expect(a!.primaryConcept?.id).toBe("java-arraylist");
    expect(a!.resolution).toBe("single-concept");
  });

  it("cross-domain protection across vertical slice", () => {
    expect(
      resolveTeachingKnowledgeContext("ArrayList in Java")!.subject,
    ).toBe("java");
    expect(
      resolveTeachingKnowledgeContext("Python variables")!.subject,
    ).toBe("python");
    expect(resolveTeachingKnowledgeContext("P/E ratio")!.subject).toBe(
      "stocks",
    );
    expect(
      resolveTeachingKnowledgeContext("Supply and demand")!.subject,
    ).toBe("economics");
    expect(resolveTeachingKnowledgeContext("Stocks")!.pack?.id).not.toBe(
      "economics-fundamentals",
    );
    expect(resolveTeachingKnowledgeContext("Stocks")!.pack?.id).not.toBe(
      "business-mortgages",
    );
  });

  it("payload sanity: Library block is scoped, not the whole registry", () => {
    const block = formatKnowledgeLibraryPromptBlock(
      resolveTeachingKnowledgeContext("P/E ratio")!,
    );
    expect(block.length).toBeLessThan(8000);
    expect(block).toContain("stocks-pe-ratio");
    expect(block).not.toContain("java-arraylist");
    expect(block).not.toContain("python-variables");
    expect(block).not.toContain("why-mortgage");
    expect(block).not.toContain("economics-opportunity-cost");
  });
});
