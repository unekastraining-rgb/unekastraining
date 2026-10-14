import { describe, expect, it } from "vitest";

import {
  buildDeterministicColdStartExtract,
  canBuildDeterministicColdStart,
} from "@/lib/core/build-cold-start-chapter-extract";
import { buildDemoCanvasSyllabus } from "@/lib/lms/demo-cold-start";

describe("buildDeterministicColdStartExtract", () => {
  it("detects demo CS201 outline as cold-start ready", () => {
    expect(canBuildDeterministicColdStart(buildDemoCanvasSyllabus("CS201"))).toBe(true);
  });

  it("builds definitions and quiz items from syllabus chapters", () => {
    const extract = buildDeterministicColdStartExtract({
      sourceText: buildDemoCanvasSyllabus("CS201"),
      courseTitle: "CS 201 — Data Structures",
    });

    expect(extract.definitions.some((item) => item.term === "Binary Search Trees")).toBe(true);
    expect(extract.learningObjectives.length).toBeGreaterThanOrEqual(3);
    expect(extract.testYourself.length).toBeGreaterThanOrEqual(4);
    expect(extract.coverageNotes).toMatch(/syllabus/i);
    expect(extract.processesOrSteps[0]?.name).toMatch(/Core → Six → Lucky/);
    expect(extract.workedExamples?.length).toBeGreaterThanOrEqual(1);
    expect(extract.workedExamples?.[0]?.steps?.length).toBeGreaterThanOrEqual(2);
  });

  it("honors topic focus in title", () => {
    const extract = buildDeterministicColdStartExtract({
      sourceText: buildDemoCanvasSyllabus("CS201"),
      courseTitle: "CS 201 — Data Structures",
      topicFocus: "Binary Search Trees",
    });
    expect(extract.title).toContain("Binary Search Trees");
  });

  it("leads cold-start pack quiz items with the focus topic", () => {
    const extract = buildDeterministicColdStartExtract({
      sourceText: "",
      courseTitle: "Biology",
      topicFocus: "Osmosis",
      topics: [
        { name: "Mitosis", description: "Nuclear division for growth" },
        { name: "Osmosis", description: "Water movement across membranes" },
        { name: "Meiosis", description: "Division for gametes" },
      ],
    });
    expect(extract.definitions[0]?.term).toBe("Osmosis");
    expect(extract.testYourself[0]?.question.toLowerCase()).toMatch(/osmosis/);
  });

  it("drops syllabus admin headings from LMS topic packs", () => {
    const extract = buildDeterministicColdStartExtract({
      sourceText: "",
      courseTitle: "Programming I",
      topics: [
        { name: "Important Dates" },
        { name: "Course Policies" },
        { name: "Variables and Types" },
        { name: "Control Flow" },
        { name: "Functions" },
      ],
    });
    expect(extract.definitions.map((d) => d.term)).toEqual([
      "Variables and Types",
      "Control Flow",
      "Functions",
    ]);
    expect(canBuildDeterministicColdStart("", [
      { name: "Important Dates" },
      { name: "Course Policies" },
      { name: "Variables and Types" },
      { name: "Control Flow" },
      { name: "Functions" },
    ])).toBe(true);
    expect(
      canBuildDeterministicColdStart("", [
        { name: "Important Dates" },
        { name: "Course Policies" },
        { name: "Grading Policy" },
      ]),
    ).toBe(false);
    expect(
      canBuildDeterministicColdStart("", [{ name: "Osmosis" }]),
    ).toBe(true);
  });
});
