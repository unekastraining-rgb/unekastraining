/**
 * Universal instructional-context resolver — LMS org labels ≠ lesson curriculum.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { buildSubjectAwareFallbackLesson } from "@/lib/csl/six-worked-lesson";
import {
  extractConceptCandidatesFromSource,
  extractInstructionalTitleFromSource,
  isOrganizationalLmsLabel,
  isPartNChunkTitle,
  resolveInstructionalContext,
  stripOrganizationalSuffix,
} from "@/lib/study/resolve-instructional-context";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

const BUSINESS_SOURCE = `
Chapter 17 — Financial Management

After you have read and studied this chapter, you should be able to:

LO 1–1 Describe the role of financial management in a business.
LO 1–2 Identify sources of short-term and long-term financing.
LO 1–3 Explain how financial institutions help businesses manage risk and return.
LO 1–4 Outline the steps in financial planning.

Financial management is the process of planning, organizing, and controlling
financial resources so the organization can meet its goals. Managers decide how
to raise capital, invest in assets, and return value to owners.

## Sources of Financing
Businesses raise money through debt and equity. Short-term financing covers
payroll and inventory; long-term financing funds plant and equipment.

## Risk and Return
Higher expected return usually means accepting more risk. Financial managers
balance these trade-offs when choosing investments.
`;

describe("resolve-instructional-context (universal)", () => {
  it("treats LMS week/date labels as organizational metadata", () => {
    expect(
      isOrganizationalLmsLabel("Business Finance Sept 28 - Oct 04"),
    ).toBe(true);
    expect(isOrganizationalLmsLabel("Week 3: Intro")).toBe(true);
    expect(isOrganizationalLmsLabel("Module 2")).toBe(true);
    expect(isOrganizationalLmsLabel("Financial Management")).toBe(false);
    expect(isOrganizationalLmsLabel("Classes & Objects")).toBe(false);
    expect(stripOrganizationalSuffix("Business Finance Sept 28 - Oct 04")).toBe(
      "Business Finance",
    );
  });

  it("resolves Business Finance week → stripped instructional label (not chapter OCR)", () => {
    const ctx = resolveInstructionalContext({
      topic: "Business Finance Sept 28 - Oct 04",
      sourceText: BUSINESS_SOURCE,
      courseTitle: "Introduction to Business",
    });

    expect(ctx.organizationalLabel).toBe("Business Finance Sept 28 - Oct 04");
    expect(ctx.teachingTopic).toBe("Business Finance");
    expect(ctx.titleSource).toBe("stripped_label");
    expect(ctx.teachingTopic).not.toMatch(/Chapter/i);
    // Chapter heading remains available as grounding, not the target.
    expect(ctx.concepts.join(" | ")).toMatch(/financial management|financing|risk/i);
    expect(ctx.concepts.every((c) => !isPartNChunkTitle(c))).toBe(true);
    expect(ctx.concepts.some((c) => /Sept 28/i.test(c))).toBe(false);
  });

  it("fallback lesson uses concepts — never topic — part N", () => {
    const ctx = resolveInstructionalContext({
      topic: "Business Finance Sept 28 - Oct 04",
      sourceText: BUSINESS_SOURCE,
    });
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      ctx.teachingTopic,
      { sourceText: BUSINESS_SOURCE, concepts: ctx.concepts },
    );
    expect(lesson).not.toBeNull();
    expect(lesson!.chunks.every((c) => !isPartNChunkTitle(c.title))).toBe(true);
    expect(lesson!.chunks.map((c) => c.title).join(" ")).not.toMatch(/part \d/i);
    expect(lesson!.topic).toMatch(/Business Finance/i);
  });

  it("extracts headings and LO-based concepts without inventing titles", () => {
    expect(extractInstructionalTitleFromSource(BUSINESS_SOURCE)).toMatch(
      /Financial Management/i,
    );
    const concepts = extractConceptCandidatesFromSource(BUSINESS_SOURCE);
    expect(concepts.length).toBeGreaterThanOrEqual(2);
    expect(concepts.some((c) => /financing|risk|financial/i.test(c))).toBe(true);
  });

  it("OOD / programming topics stay instructional (not forced through week stripping)", () => {
    const ctx = resolveInstructionalContext({
      topic: "Classes & Objects",
      sourceText: "class Car { String color; void drive() {} }",
    });
    expect(ctx.organizationalLabel).toBeNull();
    expect(ctx.teachingTopic).toMatch(/Classes/i);
  });

  it("Learn Something New style topic resolves without LMS week metadata", () => {
    const ctx = resolveInstructionalContext({
      topic: "How do mortgages work?",
      sourceText: null,
    });
    expect(ctx.organizationalLabel).toBeNull();
    expect(ctx.teachingTopic).toMatch(/mortgage/i);
  });

  it("six-lesson route wires resolver and returns instructionalContext", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("resolveInstructionalContext");
    expect(route).toContain("instructionalContext");
    expect(route).toContain("teachingTopic");
    expect(route).toContain("organizationalLabel");
    expect(route).toContain("concepts");
  });

  it("prompts forbid part-N titles and TeachFirst uses resolved teachingTopic", () => {
    const six = read("src/lib/csl/six-worked-lesson.ts");
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    const header = read(
      "src/components/study/learning-workspace/LearningWorkspaceHeader.tsx",
    );
    expect(six).toContain("NOT part N");
    expect(six).toContain("concepts");
    expect(six).not.toContain("${topic} — part");
    expect(teach).toContain("instructionalContext");
    expect(teach).toContain("teachingTopic");
    expect(header).toContain("data-learn-organizational-label");
  });
});
