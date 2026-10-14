import { describe, expect, it } from "vitest";

import {
  buildDeterministicColdStartExtract,
  canBuildDeterministicColdStart,
} from "@/lib/core/build-cold-start-chapter-extract";
import { sixGuideHref } from "@/lib/csl/six-guides";
import {
  buildCanvasColdStartSyllabusText,
  formatCanvasModuleOutline,
} from "@/lib/lms/canvas-cold-start";
import {
  buildTopicsSourceBlock,
  quizQuestionsFromTopics,
} from "@/lib/quizzes/from-topics";
import { chapterSubtopicsFromText } from "@/lib/syllabus/enrich-course-from-syllabus";
import { blurtingHref, luckyQuizHref } from "@/lib/study/loop-hrefs";

/**
 * Mirrors syncCanvasConnection cold-start when Canvas has modules but no syllabus body.
 * Proves live Canvas sync can seed Study Now / Blurt / Lucky without student uploads.
 */
describe("Canvas sync cold-start pipeline (module outline path)", () => {
  const courseId = "canvas-course-cs201";
  const courseName = "CS 201 — Data Structures";

  const modulesOutline = formatCanvasModuleOutline([
    { name: "Week 1: Intro" },
    { name: "Week 2: Binary Search Trees" },
    { name: "Week 3: Heaps and Priority Queues" },
    { name: "Week 4: Graph Traversal (BFS/DFS)" },
  ]);

  const coldStart = buildCanvasColdStartSyllabusText({
    courseName,
    syllabusHtml: null,
    modulesOutline,
  });

  const topics = chapterSubtopicsFromText(coldStart.text);

  it("seeds syllabus text from module outline alone", () => {
    expect(coldStart.seeded).toBe(true);
    expect(coldStart.usedModules).toBe(true);
    expect(coldStart.text).toMatch(/Binary Search Trees/);
  });

  it("extracts study topics for Blurt and Six", () => {
    expect(topics.length).toBeGreaterThanOrEqual(3);
    expect(topics.some((topic) => /Binary Search Trees/i.test(topic.name))).toBe(true);
  });

  it("parses Moodle-style module outline blocks", () => {
    const moodleOutline = `Course: CS 1250\nModule outline\n1. Week 1: OOP basics\n2. Week 2: Inheritance\n3. Week 3: Polymorphism`;
    const moodleTopics = chapterSubtopicsFromText(moodleOutline);
    expect(moodleTopics.length).toBeGreaterThanOrEqual(2);
    expect(moodleTopics.some((topic) => /Inheritance/i.test(topic.name))).toBe(true);
  });

  it("links cold-start topics into Lucky and Blurt without uploads", () => {
    const topicName = topics[0]!.name;
    expect(luckyQuizHref(courseId)).toBe(`/quizzes?courseId=${courseId}&make=1`);
    expect(blurtingHref(courseId)).toBe(`/study/blurting?courseId=${courseId}`);
    expect(blurtingHref(courseId, null, topicName)).toContain(
      encodeURIComponent(topicName).replace(/%20/g, "+"),
    );
    expect(sixGuideHref("chunking", { courseId, topicName })).toContain(
      `courseId=${courseId}`,
    );
  });

  it("packs module topics for free-tier quiz generation", () => {
    const source = buildTopicsSourceBlock(courseName, topics);
    expect(source).toMatch(/Study focus/);

    const questions = quizQuestionsFromTopics(courseName, topics, 10);
    expect(questions.length).toBeGreaterThanOrEqual(4);
    expect(questions.some((item) => item.type === "MULTIPLE_CHOICE")).toBe(true);
  });

  it("builds instant chapter study pack from seeded Canvas text", () => {
    expect(canBuildDeterministicColdStart(coldStart.text)).toBe(true);
    const extract = buildDeterministicColdStartExtract({
      sourceText: coldStart.text,
      courseTitle: courseName,
    });
    expect(extract.definitions.length + extract.mustKnow.length).toBeGreaterThan(0);
  });
});
