/**
 * Phase 1 — Learning target identity + knowledge resolution contract.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildSubjectAwareFallbackLesson,
  isMetaStudySkillOutlineLesson,
} from "@/lib/csl/six-worked-lesson";
import {
  isPlaceholderScaffoldLesson,
  resolveInstructionalKnowledge,
  synthesizeInstructionalLesson,
} from "@/lib/learning/knowledge/instructional-library";
import "@/lib/learning/knowledge/packs";
import { resolveInstructionalContext } from "@/lib/study/resolve-instructional-context";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 1 learning target identity", () => {
  it("StudyThisCard navigates with learner title, not topics[0]", () => {
    const card = read("src/components/study/StudyThisCard.tsx");
    expect(card).toContain("learningTarget");
    expect(card).toContain("topic: learningTarget");
    expect(card).not.toMatch(
      /const firstTopic\s*=\s*data\.course\.topics\?\.\[0\]/,
    );
  });

  it("study-topic API returns learningTarget and persists title as first topic", () => {
    const route = read("app/api/courses/study-topic/route.ts");
    expect(route).toContain("learningTarget: title");
    expect(route).toContain("name: title");
    expect(route).toContain("Canonical learner target");
  });

  it("Stocks / Python resolve as themselves — not Core concepts", () => {
    for (const topic of ["Stocks", "Python Programming fundamentals"]) {
      const ctx = resolveInstructionalContext({ topic, sourceText: null });
      expect(ctx.teachingTopic).toBe(topic);
      expect(ctx.teachingTopic).not.toBe("Core concepts");
      expect(ctx.titleSource).toBe("topic");
    }
  });

  it("How Economics Affects Business is not replaced by CHAPTER OCR heading", () => {
    const source = `
CHAPTER 1 TAKING RISKS AND MAKING PROFITS WITHIN THE DYNAMIC BUSINESS ENVIRONMENT 5
tion, and travel and tourism. CHAPTER 1 ...
How economics shapes markets and firm decisions.
`;
    const ctx = resolveInstructionalContext({
      topic: "How Economics Affects Business",
      sourceText: source,
      courseTitle: "Introduction to Business",
    });
    expect(ctx.teachingTopic).toBe("How Economics Affects Business");
    expect(ctx.teachingTopic).not.toMatch(/TAKING RISKS/i);
    expect(ctx.titleSource).toBe("topic");
    // Heading may appear as grounding concept, not as the target.
    expect(
      ctx.concepts.some((c) => /TAKING RISKS|economics/i.test(c)) ||
        ctx.concepts[0] === "How Economics Affects Business",
    ).toBe(true);
  });

  it("organizational week strips to instructional label without chapter hijack when strip works", () => {
    const ctx = resolveInstructionalContext({
      topic: "How Economics Affects Business Aug 31 – Sept 06",
      sourceText: `
CHAPTER 1 TAKING RISKS AND MAKING PROFITS WITHIN THE DYNAMIC BUSINESS ENVIRONMENT 5
Economics affects pricing and demand.
`,
    });
    expect(ctx.organizationalLabel).toMatch(/Aug 31/i);
    expect(ctx.teachingTopic).toBe("How Economics Affects Business");
    expect(ctx.teachingTopic).not.toMatch(/TAKING RISKS/i);
    expect(ctx.titleSource).toBe("stripped_label");
  });

  it("Classes & Objects specialized path unchanged", () => {
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Classes & Objects",
    );
    expect(lesson).not.toBeNull();
    expect(isMetaStudySkillOutlineLesson(lesson!)).toBe(false);
    expect(lesson!.chunks[0]?.explanation.toLowerCase()).toMatch(
      /dealership|imagine|hundreds of cars|why/,
    );
  });

  it("placeholder synthesizer scaffolding is detected and not served as Learn success", () => {
    const scaffold = synthesizeInstructionalLesson(
      "detailed-explanation",
      "Stocks",
    );
    expect(isPlaceholderScaffoldLesson(scaffold)).toBe(true);

    // Stocks now has real library knowledge (Phase 3B-1) — offline Learn can teach it.
    const stocksLesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Stocks",
    );
    expect(stocksLesson).not.toBeNull();
    expect(isPlaceholderScaffoldLesson(stocksLesson!)).toBe(false);
    expect(resolveInstructionalKnowledge("Stocks")?.pack.id).toBe(
      "stocks-fundamentals",
    );
    expect(resolveInstructionalKnowledge("Stocks")?.subject).toBe("stocks");
    expect(resolveInstructionalKnowledge("Stocks")?.pack.id).not.toBe(
      "business-mortgages",
    );

    // Broad phrase uses controlled learning path (Phase 3B-2) — not fuzzy Python.
    const pythonPath = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Python Programming fundamentals",
    );
    expect(pythonPath).not.toBeNull();
    expect(pythonPath!.cheatSheet.toLowerCase()).toMatch(
      /variable|conditional|function/,
    );
    expect(
      pythonPath!.chunks.every((c) => !/arraylist|java/i.test(c.title)),
    ).toBe(true);

    const unknownMiss = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "quantum gardening",
    );
    expect(unknownMiss).toBeNull();
  });

  it("six-lesson route rejects placeholder scaffolding", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("isPlaceholderScaffoldLesson");
    expect(route).not.toContain("fallback-knowledge");
  });
});
