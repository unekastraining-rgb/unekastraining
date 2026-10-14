import { describe, expect, it } from "vitest";

import {
  buildTopicsSourceBlock,
  quizQuestionsFromTopics,
} from "@/lib/quizzes/from-topics";

describe("buildTopicsSourceBlock", () => {
  it("packs course topics for cold-start quiz source", () => {
    const block = buildTopicsSourceBlock("Intro to Business", [
      { name: "General" },
      { name: "Stakeholders", description: "People affected by the firm" },
      { name: "Profit and loss" },
    ]);
    expect(block).toContain("Intro to Business");
    expect(block).toContain("Stakeholders");
    expect(block).not.toMatch(/^- General$/m);
  });

  it("omits syllabus admin headings from the outline", () => {
    const block = buildTopicsSourceBlock("Programming I", [
      { name: "Important Dates" },
      { name: "Course Policies" },
      { name: "Variables", description: "Named storage for values" },
      { name: "Loops" },
    ]);
    expect(block).toContain("Variables");
    expect(block).toContain("Loops");
    expect(block).not.toMatch(/^- Important Dates/m);
    expect(block).not.toMatch(/^- Course Policies/m);
  });

  it("leads the outline with the cold-start focus topic", () => {
    const block = buildTopicsSourceBlock(
      "Biology",
      [
        { name: "Mitosis" },
        { name: "Osmosis", description: "Water across membranes" },
        { name: "Meiosis" },
      ],
      { focusTopic: "Osmosis" },
    );
    expect(block).toContain("Primary focus topic: Osmosis");
    const topicsIdx = block.indexOf("Course topics:");
    const osmosisIdx = block.indexOf("- Osmosis");
    const mitosisIdx = block.indexOf("- Mitosis");
    expect(topicsIdx).toBeGreaterThan(-1);
    expect(osmosisIdx).toBeGreaterThan(topicsIdx);
    expect(osmosisIdx).toBeLessThan(mitosisIdx);
  });
});

describe("quizQuestionsFromTopics", () => {
  it("builds MC and write-ins from topic seeds", () => {
    const questions = quizQuestionsFromTopics(
      "Intro to Business",
      [
        { name: "Profit", description: "Money left after expenses" },
        { name: "Stakeholders", description: "People affected by business decisions" },
        { name: "Outsourcing" },
        { name: "Risk" },
      ],
      20,
    );
    expect(questions.length).toBeGreaterThanOrEqual(8);
    expect(questions.some((item) => item.type === "MULTIPLE_CHOICE")).toBe(true);
    expect(
      questions.some(
        (item) => item.type === "SHORT_ANSWER" || item.type === "FILL_IN_BLANK",
      ),
    ).toBe(true);
    expect(questions.some((item) => /profit|stakeholder|outsourcing|risk/i.test(item.prompt))).toBe(
      true,
    );
    expect(questions.some((item) => /best describes|closest to|example tied|NOT primarily/i.test(item.prompt))).toBe(
      true,
    );
    expect(questions.every((item) => item.type !== "TRUE_FALSE")).toBe(true);
  });

  it("prioritizes focus topic in the offline bank", () => {
    const questions = quizQuestionsFromTopics(
      "Biology",
      [
        { name: "Mitosis", description: "Nuclear division for growth" },
        { name: "Osmosis", description: "Water movement across membranes" },
        { name: "Meiosis", description: "Division for gametes" },
      ],
      6,
      { focusTopic: "Osmosis" },
    );
    expect(questions[0]?.prompt.toLowerCase()).toMatch(/osmosis/);
  });

  it("never banks questions on syllabus admin topics", () => {
    const questions = quizQuestionsFromTopics(
      "Programming I",
      [
        { name: "Important Dates", description: "Midterm on Oct 12" },
        { name: "Course Policies", description: "Late work is deducted" },
        { name: "Variables", description: "Named storage for values" },
        { name: "Control Flow", description: "Branching and looping" },
        { name: "Functions", description: "Reusable blocks of code" },
      ],
      20,
    );
    expect(questions.every((item) => !/important dates|course policies/i.test(item.prompt))).toBe(
      true,
    );
    expect(questions.some((item) => /variables|control flow|functions/i.test(item.prompt))).toBe(
      true,
    );
  });
});
