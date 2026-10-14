import { describe, expect, it } from "vitest";

import {
  buildMoodleColdStartSyllabusText,
  formatMoodleModuleOutline,
} from "@/lib/lms/moodle-cold-start";
import type { MoodleCourseContentSection } from "@/lib/lms/moodle-api";
import { chapterSubtopicsFromText } from "@/lib/syllabus/enrich-course-from-syllabus";

describe("Moodle module cold start", () => {
  const sections: MoodleCourseContentSection[] = [
    {
      id: 1,
      name: "Welcome to CSCI 2340",
      section: 0,
      modules: [{ id: 1, instance: 1, modname: "forum", name: "Announcements" }],
    },
    {
      id: 2,
      name: "Getting Started",
      section: 1,
      modules: [{ id: 2, instance: 2, modname: "book", name: "Course Syllabus" }],
    },
    {
      id: 3,
      name: "Module 1: Objects and Classes",
      section: 2,
      modules: [
        { id: 3, instance: 3, modname: "book", name: "Module 1 Resources" },
        { id: 4, instance: 4, modname: "quiz", name: "Module 1 Quiz" },
      ],
    },
    {
      id: 4,
      name: "Module 2: Thinking in Objects",
      section: 3,
      modules: [],
    },
    {
      id: 5,
      name: "Module 3: Inheritance and Polymorphism",
      section: 4,
      modules: [],
    },
  ];

  it("formats learning modules and skips Welcome/Getting Started", () => {
    const outline = formatMoodleModuleOutline(sections);
    expect(outline).toContain("Module outline");
    expect(outline).toContain("Module 1: Objects and Classes");
    expect(outline).toContain("Module 2: Thinking in Objects");
    expect(outline).not.toContain("Welcome");
    expect(outline).not.toContain("Getting Started");
  });

  it("seeds study topics from Moodle modules when syllabus is thin", () => {
    const outline = formatMoodleModuleOutline(sections);
    const cold = buildMoodleColdStartSyllabusText({
      courseName: "Object-Oriented Design",
      syllabusText: "",
      modulesOutline: outline,
    });
    expect(cold.seeded).toBe(true);
    expect(cold.usedModules).toBe(true);
    const topics = chapterSubtopicsFromText(cold.text);
    expect(topics.map((t) => t.name)).toEqual(
      expect.arrayContaining([
        "Objects and Classes",
        "Thinking in Objects",
        "Inheritance and Polymorphism",
      ]),
    );
  });

  it("keeps module outline even when syllabus text is already long", () => {
    const outline = formatMoodleModuleOutline(sections);
    const cold = buildMoodleColdStartSyllabusText({
      courseName: "Object-Oriented Design",
      syllabusText: "A".repeat(400),
      modulesOutline: outline,
    });
    expect(cold.usedModules).toBe(true);
    expect(cold.text).toContain("Module outline");
    expect(cold.text).toContain("Module 1: Objects and Classes");
  });
});
