import { describe, expect, it } from "vitest";

import {
  buildDeterministicChunkingLesson,
  buildDeterministicSixLesson,
  buildSubjectAwareFallbackLesson,
  isMetaSyllabusTopic,
  parseSixWorkedLesson,
} from "@/lib/csl/six-worked-lesson";

describe("six-worked-lesson", () => {
  it("flags syllabus admin headings as meta topics", () => {
    expect(isMetaSyllabusTopic("Instructor & Course Information")).toBe(true);
    expect(isMetaSyllabusTopic("Grading Policy")).toBe(true);
    expect(isMetaSyllabusTopic("Important Dates")).toBe(true);
    expect(isMetaSyllabusTopic("Course Policies")).toBe(true);
    expect(isMetaSyllabusTopic("Object-Oriented Design")).toBe(false);
    expect(isMetaSyllabusTopic("Binary Search Trees")).toBe(false);
    expect(isMetaSyllabusTopic("Python Programming fundamentals")).toBe(false);
  });

  it("parses a taught chunking lesson with practice prompts", () => {
    const lesson = parseSixWorkedLesson(
      JSON.stringify({
        learningFrame: "Learn OOD via chunking.",
        roadmap: ["Classes", "Fields", "Methods"],
        chunks: [
          {
            title: "Classes & Objects",
            explanation: "A class is a blueprint; an object is an instance.",
            example: "class Car {}; Car c = new Car();",
            memoryTrick: "Cookie cutter vs cookie",
          },
          {
            title: "Fields",
            explanation: "Fields store what the object knows.",
            example: "String color;",
          },
          {
            title: "Methods",
            explanation: "Methods are what the object does.",
            example: "void drive() {}",
          },
        ],
        cheatSheet: "Class → Object → Field → Method",
        practicePrompts: [
          {
            title: "Recall",
            prompt: "List the three chunk titles from memory.",
            tip: "Cover the lesson first.",
          },
          {
            title: "Explain",
            prompt: "Explain Fields with an example.",
            tip: "No notes.",
          },
        ],
      }),
      { component: "chunking", topic: "Object-Oriented Design" },
    );

    expect(lesson.chunks).toHaveLength(3);
    expect(lesson.chunks[0]?.memoryTrick).toMatch(/Cookie/);
    expect(lesson.practicePrompts[0]?.prompt).toMatch(/chunk titles/);
    expect(lesson.cheatSheet).toMatch(/Class/);
  });

  it("builds a deterministic chunking fallback that stays on topic", () => {
    const lesson = buildDeterministicChunkingLesson("Polymorphism");
    expect(lesson.learningFrame).toMatch(/Object-Oriented|Polymorphism|chunking/i);
    expect(lesson.chunks.length).toBeGreaterThanOrEqual(4);
    expect(lesson.practicePrompts[0]?.prompt).not.toMatch(/Instructor/);
  });

  it("teaches OOD with concrete class/object chunks offline", () => {
    const lesson = buildDeterministicChunkingLesson("Object-Oriented Design");
    expect(lesson.chunks.map((chunk) => chunk.title).join(" ")).toMatch(/class/i);
    expect(lesson.chunks.some((chunk) => /cookie cutter/i.test(chunk.memoryTrick ?? ""))).toBe(
      true,
    );
    expect(lesson.cheatSheet).toMatch(/FIELD/i);
  });

  it("builds technique-specific fallbacks for Feynman and active recall", () => {
    const feynman = buildDeterministicSixLesson("feynman", "Stakeholders");
    expect(feynman.learningFrame).toMatch(/Feynman/i);
    expect(feynman.chunks.some((chunk) => /analogy/i.test(chunk.title))).toBe(true);

    const recall = buildDeterministicSixLesson("active-recall", "Binary Search Trees");
    expect(recall.learningFrame).toMatch(/active recall|Binary Search|BST/i);
    // BST specialized remaps into active-recall with subject chunks
    expect(recall.chunks.length).toBeGreaterThanOrEqual(3);
  });

  it("teaches Objects and Classes offline without meta Goal/Steps outline", () => {
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Objects and Classes",
    );
    expect(lesson).not.toBeNull();
    expect(lesson!.chunks.some((c) => /Goal of /i.test(c.title))).toBe(false);
    expect(lesson!.chunks.map((c) => c.title).join(" ")).toMatch(/Class|Object/i);
  });
});
