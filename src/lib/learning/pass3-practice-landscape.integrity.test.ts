/**
 * Pass 3 — Practice landscape + topic Study Haul integrity.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { ADAPTIVE_READY_ACTIVITY_KEYS } from "@/lib/learning/decision-loop";
import {
  UNSUPPORTED_PRACTICE_KINDS,
  buildPracticeItemHref,
  listSupportedPracticeLandscape,
  orderPracticeForContext,
  scorePracticeForContext,
} from "@/lib/study/practice-landscape";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Pass 3 practice landscape", () => {
  it("exposes only real Adaptive-ready activities + hands-on", () => {
    const items = listSupportedPracticeLandscape();
    expect(items.some((i) => i.id === "six-hands-on")).toBe(true);
    for (const key of ADAPTIVE_READY_ACTIVITY_KEYS) {
      expect(items.some((i) => i.activityKey === key)).toBe(true);
    }
    for (const fake of UNSUPPORTED_PRACTICE_KINDS) {
      expect(items.some((i) => i.id === fake)).toBe(false);
      expect(
        items.some((i) => i.activityKey != null && i.activityKey === (fake as string)),
      ).toBe(false);
    }
  });

  it("uses learner-facing titles and what-will-I-do descriptions", () => {
    const coding = listSupportedPracticeLandscape().find(
      (i) => i.activityKey === "coding",
    );
    expect(coding?.learnerTitle).toMatch(/Coding/i);
    expect(coding?.description).toMatch(/Write and test code/i);
    expect(coding?.description).not.toMatch(/adapter|ULE|AdaptiveSequence/i);
  });

  it("soft-suggests coding for Java topics without hiding other options", () => {
    const all = listSupportedPracticeLandscape();
    const { suggested, more } = orderPracticeForContext(all, "Java inheritance");
    expect(suggested.some((i) => i.activityKey === "coding")).toBe(true);
    expect(more.length + suggested.length).toBe(all.length);
    expect(scorePracticeForContext(
      all.find((i) => i.activityKey === "coding")!,
      "Java",
    )).toBeGreaterThan(0);
  });

  it("builds hrefs that preserve course/topic/material where supported", () => {
    const hands = listSupportedPracticeLandscape().find(
      (i) => i.id === "six-hands-on",
    )!;
    const href = buildPracticeItemHref(hands, {
      courseId: "c1",
      topic: "Loops",
      materialId: "m1",
    });
    expect(href).toContain("/study/six/hands-on-practice");
    expect(href).toContain("courseId=c1");
    expect(href).toContain("topic=Loops");
    expect(href).toContain("materialId=m1");
    expect(href).toContain("focus=practice");

    const coding = listSupportedPracticeLandscape().find(
      (i) => i.activityKey === "coding",
    )!;
    const codingHref = buildPracticeItemHref(coding, {
      courseId: "c1",
      materialId: "m1",
      topic: "Loops",
    });
    expect(codingHref).toContain("/study/activities/coding?");
    expect(codingHref).toContain("courseId=c1");
    expect(codingHref).toContain("materialId=m1");
    expect(codingHref).toContain("topic=Loops");
  });

  it("TopicStudyHaul renders progressive destinations and contextual practice", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(topic).toContain("data-study-destinations");
    expect(topic).toContain("Learn & Understand");
    expect(topic).toContain("Practice");
    expect(topic).toContain("Check My Understanding");
    expect(topic).toContain("Study & Remember");
    expect(topic).toContain("Tutor Me");
    expect(topic).toContain("Ask a Question");
    expect(topic).toContain("data-hub-practice-landscape");
    expect(topic).toContain("listSupportedPracticeLandscape");
    expect(topic).toContain("listContextualPracticeChoices");
    expect(topic).toContain("Suggested for this topic");
    expect(topic).toContain("practiceMore: []");
    expect(topic).not.toContain("LUCKY Engine");
    expect(topic).not.toContain("AdaptiveSequence");
    expect(read("src/lib/study/practice-landscape.ts")).toContain(
      'UNSUPPORTED_PRACTICE_KINDS = ["uml"]',
    );
  });

  it("front door and Start Studying roles remain distinct", () => {
    const hub = read("app/study/study-hub-view.tsx");
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    expect(center).toContain("What are you here to learn?");
    expect(center).toContain("What are you learning?");
    expect(center).toContain("My Courses");
    expect(center).toContain("My Learning");
    expect(center).toContain("Learn Something New");
    expect(hub).toContain("Start Studying");
    expect(hub).toContain("timed plan");
    expect(center).toContain("Start a Study Session");
    // Suggested is not a permanent landing section
    expect(center).not.toContain("Suggested for you");
  });
});
