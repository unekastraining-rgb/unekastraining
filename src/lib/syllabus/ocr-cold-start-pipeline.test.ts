import { describe, expect, it } from "vitest";

import {
  buildDeterministicColdStartExtract,
  canBuildDeterministicColdStart,
} from "@/lib/core/build-cold-start-chapter-extract";
import { sixGuideHref } from "@/lib/csl/six-guides";
import {
  buildTopicsSourceBlock,
  quizQuestionsFromTopics,
} from "@/lib/quizzes/from-topics";
import { chapterSubtopicsFromText } from "@/lib/syllabus/enrich-course-from-syllabus";
import {
  MIN_VISION_OCR_CHARS,
  visionOcrUnusableReason,
} from "@/lib/syllabus/ocr-gate";
import { blurtingHref, luckyQuizHref } from "@/lib/study/loop-hrefs";

/** Typical OCR output from a syllabus photo upload (no LMS). */
const OCR_SYLLABUS_TEXT = `
ENG 110 — Composition
Course outline (from syllabus photo)

## Chapters
- Narrative and personal essay
- Research and citation
- Rhetorical analysis
- Revision and editing
`.trim();

describe("OCR photo cold-start pipeline (no LMS)", () => {
  const courseId = "eng110-ocr";
  const courseTitle = "ENG 110 — Composition";

  it("passes vision OCR gate when photo text is long enough", () => {
    expect(OCR_SYLLABUS_TEXT.length).toBeGreaterThanOrEqual(MIN_VISION_OCR_CHARS);
    expect(visionOcrUnusableReason("image/jpeg", "syllabus.jpg", OCR_SYLLABUS_TEXT)).toBeNull();
  });

  it("extracts chapter bullets as study topics for Blurt and Six", () => {
    const topics = chapterSubtopicsFromText(OCR_SYLLABUS_TEXT);
    expect(topics.length).toBeGreaterThanOrEqual(3);
    expect(topics.some((topic) => /Rhetorical analysis/i.test(topic.name))).toBe(true);
  });

  it("links OCR-seeded topics into Lucky and Blurt without uploads", () => {
    const topics = chapterSubtopicsFromText(OCR_SYLLABUS_TEXT);
    const topicName = topics[0]!.name;

    expect(luckyQuizHref(courseId)).toBe(`/quizzes?courseId=${courseId}&make=1`);
    expect(blurtingHref(courseId, null, topicName)).toContain(
      encodeURIComponent(topicName).replace(/%20/g, "+"),
    );
    expect(sixGuideHref("feynman", { courseId, topicName })).toContain(`courseId=${courseId}`);
  });

  it("packs OCR outline for free-tier quiz generation", () => {
    const topics = chapterSubtopicsFromText(OCR_SYLLABUS_TEXT);
    const source = buildTopicsSourceBlock(courseTitle, topics);
    expect(source).toMatch(/Study focus/);
    expect(source).toMatch(/Rhetorical analysis/);

    const questions = quizQuestionsFromTopics(courseTitle, topics, 10);
    expect(questions.length).toBeGreaterThanOrEqual(4);
  });

  it("builds instant chapter study pack from OCR syllabus outline", () => {
    expect(canBuildDeterministicColdStart(OCR_SYLLABUS_TEXT)).toBe(true);
    const extract = buildDeterministicColdStartExtract({
      sourceText: OCR_SYLLABUS_TEXT,
      courseTitle,
    });
    expect(extract.definitions.length).toBeGreaterThanOrEqual(3);
    expect(extract.testYourself.length).toBeGreaterThanOrEqual(4);
    expect(extract.processesOrSteps[0]?.name).toMatch(/Core → Six → Lucky/);
  });
});
