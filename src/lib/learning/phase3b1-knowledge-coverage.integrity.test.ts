/**
 * Phase 3B-1 — Initial real knowledge coverage (vertical slice).
 * Knowledge store/retrieval only — AI prompts and Learn pipeline unchanged.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { buildSubjectAwareFallbackLesson } from "@/lib/csl/six-worked-lesson";
import {
  isPlaceholderScaffoldLesson,
  resolveInstructionalKnowledge,
} from "@/lib/learning/knowledge/instructional-library";
import {
  getKnowledgePack,
  resolveKnowledge,
} from "@/lib/learning/knowledge/knowledge-library";
import "@/lib/learning/knowledge/packs";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

function expectGenuineConcept(
  target: string,
  opts: {
    packId: string;
    conceptId: string;
    domain: string;
    subject: string;
    contentHints: RegExp;
  },
) {
  const resolved = resolveKnowledge(target);
  expect(resolved).not.toBeNull();
  expect(resolved!.pack.id).toBe(opts.packId);
  expect(resolved!.domain).toBe(opts.domain);
  expect(resolved!.subject).toBe(opts.subject);
  const concept =
    resolved!.matchedConcept ??
    resolved!.pack.concepts.find((c) => c.id === opts.conceptId) ??
    null;
  expect(concept).not.toBeNull();
  expect(concept!.id).toBe(opts.conceptId);
  expect(concept!.definition?.trim().length ?? 0).toBeGreaterThan(20);
  expect(concept!.explanation.trim().length).toBeGreaterThan(80);
  const blob = [
    concept!.definition,
    concept!.explanation,
    concept!.example,
    ...(concept!.examples ?? []),
  ]
    .filter(Boolean)
    .join("\n");
  expect(blob).toMatch(opts.contentHints);
  expect(isPlaceholderScaffoldLesson({
    chunks: [
      {
        title: concept!.title,
        explanation: concept!.explanation,
        example: concept!.example ?? concept!.examples?.[0],
      },
    ],
  })).toBe(false);
  expect(blob.toLowerCase()).not.toMatch(
    /take notes|study regularly|active recall|vague impression/,
  );
}

describe("Phase 3B-1 initial real knowledge coverage", () => {
  it("Java — ArrayList / exceptions / inheritance resolve with java metadata", () => {
    expectGenuineConcept("ArrayList", {
      packId: "java-fundamentals",
      conceptId: "java-arraylist",
      domain: "programming",
      subject: "java",
      contentHints: /ArrayList|add\(|get\(/i,
    });
    expectGenuineConcept("Java ArrayList", {
      packId: "java-fundamentals",
      conceptId: "java-arraylist",
      domain: "programming",
      subject: "java",
      contentHints: /resizable|java\.util/i,
    });
    expectGenuineConcept("Java exceptions", {
      packId: "java-fundamentals",
      conceptId: "java-exceptions",
      domain: "programming",
      subject: "java",
      contentHints: /try|catch|exception/i,
    });
    expectGenuineConcept("inheritance in Java", {
      packId: "java-fundamentals",
      conceptId: "java-inheritance",
      domain: "programming",
      subject: "java",
      contentHints: /extends|subclass|override/i,
    });
    expect(getKnowledgePack("java-fundamentals")?.subject).toBe("java");
  });

  it("Python — variables / conditionals / functions resolve with python metadata", () => {
    expectGenuineConcept("Python variables", {
      packId: "python-fundamentals",
      conceptId: "python-variables",
      domain: "programming",
      subject: "python",
      contentHints: /=\s*|print\(|bool|assignment/i,
    });
    expectGenuineConcept("variables in Python", {
      packId: "python-fundamentals",
      conceptId: "python-variables",
      domain: "programming",
      subject: "python",
      contentHints: /name|value/i,
    });
    expectGenuineConcept("Python conditionals", {
      packId: "python-fundamentals",
      conceptId: "python-conditionals",
      domain: "programming",
      subject: "python",
      contentHints: /if |elif|else/i,
    });
    expectGenuineConcept("functions in Python", {
      packId: "python-fundamentals",
      conceptId: "python-functions",
      domain: "programming",
      subject: "python",
      contentHints: /def |return/i,
    });
    expect(getKnowledgePack("python-fundamentals")?.subject).toBe("python");
  });

  it("Economics — supply/demand and opportunity cost resolve", () => {
    expectGenuineConcept("supply and demand", {
      packId: "economics-fundamentals",
      conceptId: "economics-supply-demand",
      domain: "business",
      subject: "economics",
      contentHints: /equilibrium|demand|supply/i,
    });
    expectGenuineConcept("supply & demand", {
      packId: "economics-fundamentals",
      conceptId: "economics-supply-demand",
      domain: "business",
      subject: "economics",
      contentHints: /price/i,
    });
    expectGenuineConcept("opportunity cost", {
      packId: "economics-fundamentals",
      conceptId: "economics-opportunity-cost",
      domain: "business",
      subject: "economics",
      contentHints: /next-best|forgone|trade-?off/i,
    });
    expect(getKnowledgePack("economics-fundamentals")?.subject).toBe("economics");
  });

  it("Stocks — share / market cap / P/E resolve with finance+stocks metadata", () => {
    expectGenuineConcept("Stocks", {
      packId: "stocks-fundamentals",
      conceptId: "stocks-share",
      domain: "finance",
      subject: "stocks",
      contentHints: /ownership|share|shareholder/i,
    });
    expectGenuineConcept("stock market", {
      packId: "stocks-fundamentals",
      conceptId: "stocks-share",
      domain: "finance",
      subject: "stocks",
      contentHints: /share|company/i,
    });
    expectGenuineConcept("market capitalization", {
      packId: "stocks-fundamentals",
      conceptId: "stocks-market-cap",
      domain: "finance",
      subject: "stocks",
      contentHints: /shares outstanding|market cap|×|\*/i,
    });
    expectGenuineConcept("P/E ratio", {
      packId: "stocks-fundamentals",
      conceptId: "stocks-pe-ratio",
      domain: "finance",
      subject: "stocks",
      contentHints: /earnings|EPS|price/i,
    });
    expect(getKnowledgePack("stocks-fundamentals")?.domain).toBe("finance");
    expect(getKnowledgePack("stocks-fundamentals")?.subject).toBe("stocks");
  });

  it("cross-domain safety — no false matches", () => {
    expect(resolveKnowledge("Stocks")!.pack.id).not.toBe("business-mortgages");
    expect(resolveKnowledge("Stocks")!.pack.id).not.toBe(
      "economics-fundamentals",
    );
    expect(resolveKnowledge("opportunity cost")!.pack.id).not.toBe(
      "business-mortgages",
    );
    expect(resolveKnowledge("ArrayList")!.subject).toBe("java");
    expect(resolveKnowledge("ArrayList")!.pack.id).not.toBe(
      "python-fundamentals",
    );
    expect(resolveKnowledge("Python variables")!.subject).toBe("python");
    expect(resolveKnowledge("Python variables")!.pack.id).not.toBe(
      "java-fundamentals",
    );
    // Bare "variables" must not invent Python knowledge.
    expect(resolveKnowledge("variables")).toBeNull();
    // Broad curriculum phrase uses controlled learning path (Phase 3B-2).
    expect(
      resolveInstructionalKnowledge("Python Programming fundamentals")?.pack
        .concepts.map((c) => c.id),
    ).toEqual([
      "python-variables",
      "python-conditionals",
      "python-loops",
      "python-functions",
      "python-lists",
      "python-dictionaries",
      "python-exceptions",
    ]);
    expect(resolveKnowledge("quantum gardening")).toBeNull();
  });

  it("existing mortgage and exception packs still resolve", () => {
    expect(resolveKnowledge("How do mortgages work?")!.pack.id).toBe(
      "business-mortgages",
    );
    expect(
      resolveKnowledge("Exception Handling and File I/O")!.pack.id,
    ).toBe("java-exception-handling-file-io");
  });

  it("OOD specialized path untouched; library does not own Classes & Objects", () => {
    expect(resolveKnowledge("Classes & Objects")).toBeNull();
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Classes & Objects",
    );
    expect(lesson!.chunks[0]?.explanation.toLowerCase()).toMatch(/dealership|cars/);
  });

  it("AI prompts and fallback ladder remain unchanged in this phase", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("validateAiLesson");
    expect(route).toContain("buildSubjectAwareFallbackLesson");
    expect(route).not.toContain("resolveKnowledge(");
    expect(route).not.toContain("JAVA_FUNDAMENTALS");
    expect(route).not.toContain("STOCKS_FUNDAMENTALS");
    const worked = read("src/lib/csl/six-worked-lesson.ts");
    expect(worked).toContain("buildLessonFromKnowledgeLibrary");
    expect(worked).toContain("specializedChunkingLesson");
  });
});
