import { describe, expect, it } from "vitest";

import {
  buildDeterministicColdStartExtract,
  canBuildDeterministicColdStart,
} from "@/lib/core/build-cold-start-chapter-extract";
import {
  buildStudyNowPlan,
  enrichStudyNowBlocksForCourse,
  type StudyNowTopicPick,
} from "@/lib/csl/study-now";
import { recommendSixForMastery } from "@/lib/csl/six-recommendations";
import { SIX_ACTIVITIES } from "@/lib/csl/six";
import { sixGuideHref } from "@/lib/csl/six-guides";
import {
  blurtingHref,
  coreStudyPackHref,
  luckyQuizHref,
  sixChunkingHref,
} from "@/lib/study/loop-hrefs";
import { buildDemoCanvasSyllabus } from "@/lib/lms/demo-cold-start";
import {
  buildTopicsSourceBlock,
  quizQuestionsFromTopics,
} from "@/lib/quizzes/from-topics";
import { chapterSubtopicsFromText } from "@/lib/syllabus/enrich-course-from-syllabus";

function mockFocusTopicsFromColdStart(
  topicList: Array<{ name: string; description?: string }>,
  courseId: string,
  courseTitle: string,
): StudyNowTopicPick[] {
  return topicList.slice(0, 2).map((topic, index) => {
    const { component, reason } = recommendSixForMastery({
      proficiency: 0,
      understanding: 0,
      recall: 0,
      application: 0,
      reviewCount: 0,
    });
    const activity = SIX_ACTIVITIES.find((item) => item.id === component);
    return {
      topicId: `cold-${index}`,
      topicName: topic.name,
      courseId,
      courseTitle,
      component,
      componentTitle: activity?.title ?? component,
      href: sixGuideHref(component, { courseId, topicName: topic.name }),
      reason,
      proficiency: 0,
    };
  });
}

describe("demo cold-start pipeline (no uploads)", () => {
  const cs201Syllabus = buildDemoCanvasSyllabus("CS201");
  const topics = chapterSubtopicsFromText(cs201Syllabus);

  it("extracts syllabus chapters as study topics", () => {
    expect(topics.length).toBeGreaterThanOrEqual(3);
    expect(topics.map((item) => item.name)).toContain("Binary Search Trees");
  });

  it("builds instant Core study pack from demo outline", () => {
    expect(canBuildDeterministicColdStart(cs201Syllabus)).toBe(true);
    const extract = buildDeterministicColdStartExtract({
      sourceText: cs201Syllabus,
      courseTitle: "CS 201 — Data Structures",
    });
    expect(extract.definitions.length).toBeGreaterThanOrEqual(3);
    expect(extract.testYourself.length).toBeGreaterThanOrEqual(4);
  });

  it("packs topics for Lucky cold-start quiz source", () => {
    const source = buildTopicsSourceBlock("CS 201 — Data Structures", topics);
    expect(source).toMatch(/Binary Search Trees/);
    expect(source).toMatch(/Study focus: use these course topics/);

    const questions = quizQuestionsFromTopics("CS 201 — Data Structures", topics, 12);
    expect(questions.length).toBeGreaterThanOrEqual(6);
    expect(questions.some((item) => item.type === "MULTIPLE_CHOICE")).toBe(true);
  });

  it("feeds demo topics into Study Now Core→Six→Lucky plan", () => {
    const focusTopics = mockFocusTopicsFromColdStart(
      topics,
      "demo-cs201",
      "CS 201 — Data Structures",
    );
    const plan = buildStudyNowPlan(20, {}, focusTopics);
    const blocks = enrichStudyNowBlocksForCourse(plan.blocks, {
      courseId: "demo-cs201",
      courseTitle: "CS 201 — Data Structures",
      focusTopics,
    });

    expect(plan.summary).toMatch(/Six focus|Lucky/i);
    expect(blocks.find((item) => item.activity === "quiz")?.href).toBe(
      "/quizzes?courseId=demo-cs201&make=1&topic=Binary+Search+Trees",
    );
    expect(blocks.some((item) => item.href?.includes("courseId=demo-cs201"))).toBe(true);
    expect(blocks.some((item) => item.topicName === "Binary Search Trees")).toBe(true);
  });

  it("builds demo onboarding Core→Six→Lucky deep links from syllabus focus topic", () => {
    const courseId = "demo-cs201";
    const focusTopic = topics[0]!.name;
    expect(coreStudyPackHref(courseId, focusTopic)).toContain("pack=1");
    expect(sixChunkingHref(courseId, focusTopic)).toContain(
      encodeURIComponent(focusTopic).replace(/%20/g, "+"),
    );
    expect(luckyQuizHref(courseId, null, focusTopic)).toContain("make=1");
    expect(blurtingHref(courseId, null, focusTopic)).toContain("courseId=demo-cs201");
  });
});
