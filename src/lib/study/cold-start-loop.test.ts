import { describe, expect, it } from "vitest";

import {
  buildDeterministicColdStartExtract,
  canBuildDeterministicColdStart,
} from "@/lib/core/build-cold-start-chapter-extract";
import { buildDemoCanvasSyllabus } from "@/lib/lms/demo-cold-start";
import { quizAiEligibility } from "@/lib/quizzes/generate";
import {
  buildTopicsSourceBlock,
  quizQuestionsFromTopics,
} from "@/lib/quizzes/from-topics";
import { chapterSubtopicsFromText } from "@/lib/syllabus/enrich-course-from-syllabus";
import {
  blurtingHref,
  coreStudyPackHref,
  luckyQuizHref,
  sixChunkingHref,
} from "@/lib/study/loop-hrefs";

/**
 * End-to-end cold start: LMS/syllabus topics only → Core pack → Six → Lucky → Blurt
 * (strategy #3, tied to Core→Six→Lucky loop #1).
 */
describe("cold-start study loop without uploads", () => {
  const courseId = "course-cs201";
  const syllabusText = buildDemoCanvasSyllabus("CS201");
  const topics = chapterSubtopicsFromText(syllabusText);
  const focusTopic = topics[0]!.name;
  const topicsBlock = buildTopicsSourceBlock("CS 201", topics, {
    focusTopic,
  });

  it("Core pack=1 deep link targets auto-build from syllabus topics", () => {
    expect(coreStudyPackHref(courseId, focusTopic)).toBe(
      `/core?courseId=${courseId}&pack=1&topic=${encodeURIComponent(focusTopic).replace(/%20/g, "+")}`,
    );
  });

  it("topic outline alone qualifies for free-tier AI pack and quiz", () => {
    expect(topicsBlock.length).toBeGreaterThanOrEqual(120);
    expect(
      quizAiEligibility({
        aiConfigured: true,
        combinedSourceLength: topicsBlock.length,
        topicsBlockLength: topicsBlock.length,
        hasTopicSeeds: true,
      }),
    ).toBe(true);
    expect(canBuildDeterministicColdStart(topicsBlock)).toBe(true);
  });

  it("chains Six, Lucky, and Blurt on the same cold-start topic", () => {
    expect(sixChunkingHref(courseId, focusTopic)).toContain(
      encodeURIComponent(focusTopic).replace(/%20/g, "+"),
    );
    expect(luckyQuizHref(courseId, null, focusTopic)).toContain("make=1");
    expect(blurtingHref(courseId, null, focusTopic)).toContain(
      encodeURIComponent(focusTopic).replace(/%20/g, "+"),
    );
  });

  it("Study this topic entry lands on Core pack=1 with first subtopic", () => {
    const courseId = "course-stocks";
    const firstTopic = "Market basics";
    const href = coreStudyPackHref(courseId, firstTopic);
    expect(href).toContain("pack=1");
    expect(href).toContain(encodeURIComponent(firstTopic).replace(/%20/g, "+"));
  });

  it("offline pack + quiz banks support Six/Lucky when AI is unavailable", () => {
    const extract = buildDeterministicColdStartExtract({
      sourceText: syllabusText,
      courseTitle: "CS 201",
      topicFocus: focusTopic,
      topics,
    });
    expect(extract.definitions.length + extract.mustKnow.length).toBeGreaterThan(0);

    const offlineQuiz = quizQuestionsFromTopics("CS 201", topics, 8, {
      focusTopic,
    });
    expect(offlineQuiz.length).toBeGreaterThanOrEqual(4);
    expect(offlineQuiz.some((item) => item.type === "MULTIPLE_CHOICE")).toBe(true);
  });
});
