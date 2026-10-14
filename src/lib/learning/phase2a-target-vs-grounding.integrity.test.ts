/**
 * Phase 2A — Canonical learning target ≠ instructional grounding.
 * StudyTopicProfile JSON must not become COURSE MATERIAL.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildSixLessonUserPrompt,
  buildSubjectAwareFallbackLesson,
} from "@/lib/csl/six-worked-lesson";
import {
  instructionalSourceForTeaching,
  looksLikeStudyTopicProfileSource,
  stripStudyTopicProfileFromSource,
} from "@/lib/learning/knowledge/instructional-library";
import "@/lib/learning/knowledge/packs";
import { resolveInstructionalContext } from "@/lib/study/resolve-instructional-context";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

function stocksStudyTopicProfileJson(): string {
  return JSON.stringify(
    {
      kind: "study_topic",
      title: "Stocks",
      subject: null,
      focus: null,
      summary: "Build understanding of Stocks.",
      subtopics: [
        { name: "Core concepts", description: "What Stocks is and why it matters" },
        { name: "Key vocabulary", description: "Terms and ideas you need to recognize" },
        {
          name: "Practice & application",
          description: "Apply Stocks with examples",
        },
      ],
      suggestedTechniques: ["Teach it back", "Flashcards"],
      createdAt: "2026-09-24T00:00:00.000Z",
    },
    null,
    2,
  );
}

describe("Phase 2A target vs grounding", () => {
  it("Test A — Stocks canonical teaching target survives", () => {
    const ctx = resolveInstructionalContext({
      topic: "Stocks",
      sourceText: null,
    });
    expect(ctx.teachingTopic).toBe("Stocks");
    expect(ctx.titleSource).toBe("topic");
  });

  it("Test B — StudyTopicProfile JSON is not instructional grounding", () => {
    const profile = stocksStudyTopicProfileJson();
    expect(looksLikeStudyTopicProfileSource(profile)).toBe(true);
    expect(instructionalSourceForTeaching(profile)).toBeNull();
    expect(stripStudyTopicProfileFromSource(profile)).toBe("");

    const packed = [
      "## SOURCE COVERAGE",
      "chars=400 coverage=full",
      "## PRIMARY READING / MATERIAL: Study topic: Stocks",
      profile,
    ].join("\n\n");
    expect(looksLikeStudyTopicProfileSource(packed)).toBe(true);
    expect(instructionalSourceForTeaching(packed)).toBeNull();

    const ctx = resolveInstructionalContext({
      topic: "Stocks",
      // Mimic six-lesson: only pass filtered grounding into context.
      sourceText: instructionalSourceForTeaching(packed) ?? undefined,
    });
    expect(ctx.teachingTopic).toBe("Stocks");
    expect(ctx.concepts).toEqual(["Stocks"]);
    expect(ctx.concepts).not.toContain("Core concepts");

    const prompt = buildSixLessonUserPrompt({
      component: "detailed-explanation",
      topic: "Stocks",
      courseTitle: "Stocks",
      sourceText: profile,
    });
    expect(prompt).toContain("## CANONICAL LEARNING TARGET");
    expect(prompt).toContain("Stocks");
    expect(prompt).not.toContain('"kind": "study_topic"');
    expect(prompt).not.toContain("What Stocks is and why it matters");
    expect(prompt).not.toContain("Key vocabulary");
    expect(prompt).toMatch(/organizational only|None attached/i);
  });

  it("Test C — Python Programming fundamentals target survives", () => {
    const profile = JSON.stringify({
      kind: "study_topic",
      title: "Python Programming fundamentals",
      summary: "Build understanding of Python Programming fundamentals.",
      subtopics: [{ name: "Core concepts", description: "Basics" }],
      suggestedTechniques: [],
      createdAt: "2026-09-24T00:00:00.000Z",
    });
    const grounding = instructionalSourceForTeaching(profile);
    expect(grounding).toBeNull();
    const ctx = resolveInstructionalContext({
      topic: "Python Programming fundamentals",
      sourceText: grounding ?? undefined,
    });
    expect(ctx.teachingTopic).toBe("Python Programming fundamentals");
  });

  it("Test D — Business target stays; real textbook still available as grounding", () => {
    const textbook = `
CHAPTER 1 TAKING RISKS AND MAKING PROFITS WITHIN THE DYNAMIC BUSINESS ENVIRONMENT 5
Economics shapes pricing, demand, and firm decisions in competitive markets.
Supply and demand interact to set market prices. Firms respond to incentives.
How economics affects business strategy and resource allocation under scarcity.
`.trim();

    expect(looksLikeStudyTopicProfileSource(textbook)).toBe(false);
    const grounding = instructionalSourceForTeaching(textbook);
    expect(grounding).not.toBeNull();
    expect(grounding!).toMatch(/Economics shapes pricing/i);

    const ctx = resolveInstructionalContext({
      topic: "How Economics Affects Business",
      sourceText: grounding,
      courseTitle: "Introduction to Business",
    });
    expect(ctx.teachingTopic).toBe("How Economics Affects Business");
    expect(ctx.teachingTopic).not.toMatch(/TAKING RISKS/i);

    const prompt = buildSixLessonUserPrompt({
      component: "detailed-explanation",
      topic: ctx.teachingTopic,
      courseTitle: "Introduction to Business",
      sourceText: grounding ?? undefined,
      concepts: ctx.concepts,
    });
    expect(prompt).toContain("## CANONICAL LEARNING TARGET");
    expect(prompt).toContain("How Economics Affects Business");
    expect(prompt).toContain("## OPTIONAL INSTRUCTIONAL GROUNDING");
    expect(prompt).toMatch(/Economics shapes pricing/i);
    expect(prompt).toMatch(/Do NOT replace the canonical learning target/i);
  });

  it("Test E — Classes & Objects specialized dealership path unchanged", () => {
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Classes & Objects",
    );
    expect(lesson).not.toBeNull();
    expect(lesson!.chunks[0]?.explanation.toLowerCase()).toMatch(
      /dealership|imagine|hundreds of cars|why/,
    );
  });

  it("six-lesson route filters StudyTopicProfile before context and fallback", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("instructionalSourceForTeaching");
    expect(route).toContain("looksLikeStudyTopicProfileSource");
    expect(route).toContain("groundingSource");
    expect(route).toContain("sourceText: groundingSource");
  });
});
