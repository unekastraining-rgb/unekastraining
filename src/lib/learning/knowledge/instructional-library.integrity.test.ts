/**
 * Instructional Knowledge Library — syllabus ≠ lesson prose.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildSubjectAwareFallbackLesson,
  isMetaStudySkillOutlineLesson,
} from "@/lib/csl/six-worked-lesson";
import {
  looksLikeSyllabusProse,
  instructionalSourceForTeaching,
  resolveInstructionalKnowledge,
  buildLessonFromKnowledgeLibrary,
  synthesizeInstructionalLesson,
  isPlaceholderScaffoldLesson,
} from "@/lib/learning/knowledge/instructional-library";
import "@/lib/learning/knowledge/packs";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Instructional knowledge library", () => {
  it("rejects syllabus and malformed fragments as instructional prose", () => {
    expect(
      looksLikeSyllabusProse(
        "Course Syllabus Module 4: Exception Handling Learning Objectives CO 1-2",
      ),
    ).toBe(true);
    expect(
      looksLikeSyllabusProse(
        "nal modifier (CO 1-2, CO 4-5) Module 4 Exception Handling",
      ),
    ).toBe(true);
    expect(
      looksLikeSyllabusProse(
        "## COURSE SYLLABUS (ORGANIZATIONAL ONLY)\nWeek of Sept 28 Office hours",
      ),
    ).toBe(true);
    expect(
      looksLikeSyllabusProse(
        "An exception is an object that signals an abnormal condition during execution.",
      ),
    ).toBe(false);
  });

  it("strips syllabus-only packed source before teaching", () => {
    const packed = [
      "## COURSE SYLLABUS (ORGANIZATIONAL ONLY — learning objectives)",
      "Module 4 Exception Handling LO 1-3 Week of Oct 1",
      "## PRIMARY READING / MATERIAL: Course Syllabus",
      "nal modifier (CO 1-2) Module 4 schedule grading policy",
    ].join("\n");
    expect(instructionalSourceForTeaching(packed)).toBeNull();
  });

  it("Exception Handling and File I/O teaches from knowledge — not syllabus", () => {
    const syllabus = [
      "Course Syllabus",
      "Module 4: Exception Handling and File I/O",
      "Learning Objectives (CO 1-2, CO 4-5)",
      "Week of October 6 — Office hours Tuesday",
      "nal modifier (CO 1-2, CO 4-5) Module 4…",
    ].join("\n\n");

    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Exception Handling and File I/O",
      { sourceText: syllabus },
    );
    expect(lesson).not.toBeNull();
    expect(isMetaStudySkillOutlineLesson(lesson!)).toBe(false);
    const blob = lesson!.chunks.map((c) => `${c.title} ${c.explanation}`).join("\n");
    expect(blob).not.toMatch(/Course Syllabus/i);
    expect(blob).not.toMatch(/nal modifier/i);
    expect(blob).not.toMatch(/Office hours/i);
    expect(blob).toMatch(/exception|try|catch|file/i);
    expect(lesson!.chunks.some((c) => /try|catch|exception|file/i.test(c.title))).toBe(
      true,
    );
    expect(resolveInstructionalKnowledge("Exception Handling and File I/O")).not.toBeNull();
  });

  it("OOD Classes & Objects specialized path is preserved", () => {
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Classes & Objects",
    );
    expect(lesson!.chunks[0]?.explanation.toLowerCase()).toMatch(
      /dealership|imagine|hundreds of cars|why/,
    );
    expect(lesson!.chunks.some((c) => /cookie cutter/i.test(c.memoryTrick ?? ""))).toBe(
      true,
    );
  });

  it("Learn Something New (mortgages) teaches without material", () => {
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "How do mortgages work?",
    );
    expect(lesson).not.toBeNull();
    expect(lesson!.chunks.length).toBeGreaterThanOrEqual(4);
    const blob = lesson!.chunks.map((c) => c.explanation).join(" ");
    expect(blob).toMatch(/principal|interest|amortization|loan/i);
    expect(blob).not.toMatch(/syllabus|module\s+\d+/i);
  });

  it("knowledge library does not serve generic scaffolding as a successful lesson", () => {
    // Canonical biology knowledge is a successful lesson — not scaffolding.
    const biology = buildLessonFromKnowledgeLibrary(
      "detailed-explanation",
      "Photosynthesis",
    );
    expect(biology).not.toBeNull();
    expect(isPlaceholderScaffoldLesson(biology!)).toBe(false);
    expect(biology!.chunks.some((c) => /chloroplast|light|sugar|oxygen/i.test(
      `${c.explanation} ${c.example ?? ""}`,
    ))).toBe(true);

    // Synthetic scaffold for unknown topics must remain detectable as placeholder.
    const scaffold = synthesizeInstructionalLesson(
      "detailed-explanation",
      "Quantum gardening",
    );
    expect(isPlaceholderScaffoldLesson(scaffold)).toBe(true);
    expect(
      buildSubjectAwareFallbackLesson(
        "detailed-explanation",
        "Quantum gardening",
      ),
    ).toBeNull();
  });

  it("six-lesson route prefers knowledge fallback language", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("isPlaceholderScaffoldLesson");
    expect(route).toContain("instructional knowledge");
    expect(route).toContain("courseTitle");
    const lib = read("src/lib/learning/knowledge/instructional-library.ts");
    expect(lib).toContain("looksLikeSyllabusProse");
    expect(lib).toContain("buildLessonFromKnowledgeLibrary");
    expect(lib).toContain("isPlaceholderScaffoldLesson");
  });
});
