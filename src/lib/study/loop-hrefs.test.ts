import { describe, expect, it } from "vitest";

import {
  blurtingHref,
  coreStudyGuideHref,
  coreStudyPackHref,
  courseMaterialUploadHref,
  coursesScanLandingHref,
  luckyQuizHref,
  sixChunkingHref,
  sixFeynmanHref,
  studyHaulHref,
  teachMeHref,
  withColdStartTopic,
  withCourseContext,
} from "@/lib/study/loop-hrefs";
import { hubChatHref } from "@/lib/hub/tabs";

describe("loop-hrefs", () => {
  it("builds Study Haul and Study Guide workspace links with course and topic", () => {
    expect(studyHaulHref("course-1")).toBe("/study?courseId=course-1");
    expect(studyHaulHref("course-1", "Objects and Classes")).toBe(
      "/study?courseId=course-1&topic=Objects+and+Classes",
    );
    expect(studyHaulHref("course-1", "Loops", "practice")).toBe(
      "/study?courseId=course-1&topic=Loops#practice",
    );
    expect(
      coreStudyGuideHref({
        courseId: "course-1",
        topic: "Osmosis",
        materialId: "mat-1",
      }),
    ).toBe(
      "/core?courseId=course-1&assist=1&studio=study-guide&topic=Osmosis&materialId=mat-1",
    );
  });

  it("builds hub chat deep link with class and topic context", () => {
    expect(hubChatHref({ courseId: "course-1", topic: "Osmosis" })).toBe(
      "/dashboard?tab=chat&courseId=course-1&topic=Osmosis",
    );
    expect(hubChatHref({ courseId: "course-1", prompt: "Plan my week" })).toBe(
      "/dashboard?tab=chat&courseId=course-1&prompt=Plan+my+week",
    );
    expect(withCourseContext("/dashboard?tab=chat", "course-1")).toBe(
      "/dashboard?tab=chat&courseId=course-1",
    );
  });

  it("builds auto-quiz href with course context", () => {
    expect(luckyQuizHref("course-1")).toBe("/quizzes?courseId=course-1&make=1");
    expect(coreStudyPackHref("course-1", "Week 2")).toBe(
      "/core?courseId=course-1&pack=1&topic=Week+2",
    );
    expect(luckyQuizHref("course-1", "mat-3")).toBe(
      "/quizzes?courseId=course-1&make=1&materialId=mat-3",
    );
    expect(luckyQuizHref("course-1", null, "Osmosis")).toBe(
      "/quizzes?courseId=course-1&make=1&topic=Osmosis",
    );
  });

  it("builds blurting, teach-me, and six chunking links", () => {
    expect(blurtingHref("course-1")).toBe("/study/blurting?courseId=course-1");
    expect(blurtingHref("course-1", "mat-9", "Chapter 2")).toBe(
      "/study/blurting?courseId=course-1&materialId=mat-9&topic=Chapter+2",
    );
    expect(teachMeHref("course-1", "mat-9", "Osmosis")).toBe(
      "/study/teach-me?courseId=course-1&materialId=mat-9&topic=Osmosis",
    );
    expect(sixChunkingHref("course-1", "Chapter 2", "mat-9")).toBe(
      "/study/six/chunking?courseId=course-1&topic=Chapter+2&materialId=mat-9",
    );
  });

  it("builds Feynman teach-back link with material context", () => {
    expect(sixFeynmanHref("course-1", "Osmosis", "mat-2")).toBe(
      "/study/six/feynman?courseId=course-1&topic=Osmosis&materialId=mat-2",
    );
  });

  it("builds annotate → study hrefs for a PDF page topic", () => {
    const pageTopic = "PDF p.3";
    expect(sixChunkingHref("course-1", pageTopic, "mat-pdf")).toBe(
      "/study/six/chunking?courseId=course-1&topic=PDF+p.3&materialId=mat-pdf",
    );
    expect(sixFeynmanHref("course-1", pageTopic, "mat-pdf")).toBe(
      "/study/six/feynman?courseId=course-1&topic=PDF+p.3&materialId=mat-pdf",
    );
    expect(blurtingHref("course-1", "mat-pdf", pageTopic)).toBe(
      "/study/blurting?courseId=course-1&materialId=mat-pdf&topic=PDF+p.3",
    );
    expect(luckyQuizHref("course-1", "mat-pdf")).toContain("materialId=mat-pdf");
  });

  it("adds course context to lucky engine block hrefs", () => {
    expect(withCourseContext("/quizzes", "course-1")).toBe(
      "/quizzes?courseId=course-1&make=1",
    );
    expect(withCourseContext("/quizzes?make=1", "course-1")).toBe(
      "/quizzes?make=1&courseId=course-1",
    );
    expect(withCourseContext("/core", "course-1")).toBe("/core?courseId=course-1");
    expect(withCourseContext("/study/six/chunking", "course-1")).toBe(
      "/study/six/chunking?courseId=course-1",
    );
    expect(withCourseContext("/study/blurting", "course-1")).toBe(
      "/study/blurting?courseId=course-1",
    );
    expect(withCourseContext("/study/teach-me", "course-1")).toBe(
      "/study/teach-me?courseId=course-1",
    );
    expect(withCourseContext("/study/mixed", "course-1")).toBe(
      "/study/mixed?courseId=course-1",
    );
    expect(withCourseContext("/quizzes?filter=missed", "course-1")).toBe(
      "/quizzes?filter=missed&courseId=course-1",
    );
  });

  it("attaches cold-start topic to Six / Blurt / Teach Me lucky blocks", () => {
    expect(
      withColdStartTopic(
        withCourseContext("/study/six/chunking", "course-1"),
        "Osmosis",
      ),
    ).toBe("/study/six/chunking?courseId=course-1&topic=Osmosis");
    expect(
      withColdStartTopic("/study/blurting?courseId=course-1", "Chapter 2"),
    ).toBe("/study/blurting?courseId=course-1&topic=Chapter%202");
    expect(
      withColdStartTopic("/study/teach-me?courseId=course-1", "Mitosis"),
    ).toBe("/study/teach-me?courseId=course-1&topic=Mitosis");
    expect(
      withColdStartTopic("/study/six/chunking?courseId=c1&topic=Already", "Other"),
    ).toBe("/study/six/chunking?courseId=c1&topic=Already");
    expect(withColdStartTopic("/quizzes?courseId=c1", "Osmosis")).toBe(
      "/quizzes?courseId=c1",
    );
  });

  it("builds OCR / syllabus upload landing hrefs", () => {
    expect(courseMaterialUploadHref("course-1")).toBe("/courses/course-1?upload=1");
    expect(coursesScanLandingHref("course-1")).toBe("/courses/course-1?upload=1");
    expect(coursesScanLandingHref(null)).toBe("/courses?scan=1");
    expect(coursesScanLandingHref()).toBe("/courses?scan=1");
  });
});
