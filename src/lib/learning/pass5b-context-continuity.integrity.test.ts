/**
 * Phase 5B — LMS material parity, material→practice, Study Guide context continuity.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildPracticeItemHref,
  listSupportedPracticeLandscape,
} from "@/lib/study/practice-landscape";
import { coreStudyGuideHref, studyHaulHref } from "@/lib/study/loop-hrefs";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 5B LMS CourseMaterial parity wiring", () => {
  it("Blackboard and Google Classroom sync use shared syllabus upsert", () => {
    const sync = read("src/lib/lms/sync.ts");
    expect(sync).toContain("upsertLmsSyllabusMaterial");
    expect(sync).toContain("buildGoogleClassroomColdStartText");
    expect(sync).toContain("buildBlackboardColdStartText");
    expect(sync).toContain("enrichTopicsFromLmsSyllabus");
  });

  it("Canvas also uses the shared CourseMaterial upsert", () => {
    const sync = read("src/lib/lms/sync.ts");
    expect(sync).toMatch(/syncCanvasConnection[\s\S]*upsertLmsSyllabusMaterial/);
  });

  it("shared upsert is courseId + SYLLABUS type idempotent", () => {
    const upsert = read("src/lib/lms/upsert-lms-syllabus-material.ts");
    expect(upsert).toContain("type: MaterialType.SYLLABUS");
    expect(upsert).toContain('return "created"');
    expect(upsert).toContain('return "updated"');
  });
});

describe("Phase 5B material → practice continuity", () => {
  it("Locker material practice preserves materialId, courseId, topic", () => {
    const coding = listSupportedPracticeLandscape().find(
      (i) => i.activityKey === "coding",
    )!;
    const href = buildPracticeItemHref(coding, {
      courseId: "c-bio",
      topic: "Cell Structure",
      materialId: "mat-cells",
    });
    expect(href).toContain("courseId=c-bio");
    expect(href).toContain("topic=Cell+Structure");
    expect(href).toContain("materialId=mat-cells");

    const actions = read("src/components/materials/MaterialOpenActions.tsx");
    expect(actions).toContain("buildPracticeItemHref");
    expect(actions).toContain("materialId");
    expect(actions).toContain("courseId");
  });

  it("Study Haul practice uses contextual resolver (not capability catalog dump)", () => {
    const haul = read("src/components/study/TopicStudyHaul.tsx");
    expect(haul).toContain("buildPracticeItemHref");
    expect(haul).toContain("listContextualPracticeChoices");
    expect(haul).toContain("listSupportedPracticeLandscape");
    expect(haul).toContain("materialId");
    expect(haul).toContain("courseId");
  });

  it("Study Haul → Practice destination stays on shared landscape route", () => {
    const haul = read("src/components/study/TopicStudyHaul.tsx");
    expect(haul).toContain('destination === "practice"');
    expect(haul).toContain("buildPracticeItemHref");
    expect(haul).toContain("listContextualPracticeChoices");
  });
});

describe("Phase 5B Study Guide context continuity", () => {
  it("Study Haul → Study Guide preserves course, topic, material", () => {
    const href = coreStudyGuideHref({
      courseId: "c-bio",
      topic: "Cell Structure",
      materialId: "mat-cells",
    });
    expect(href).toBe(
      "/core?courseId=c-bio&assist=1&studio=study-guide&topic=Cell+Structure&materialId=mat-cells",
    );

    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(topic).toContain("coreStudyGuideHref");
    expect(topic).toContain("materialId");
  });

  it("Remember destination includes Study Guide with haul context", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(topic).toContain('id: "study-guide"');
    expect(topic).toContain("Remember");
    expect(topic).toContain("coreStudyGuideHref");
  });

  it("Locker material actions open Study Guide with material context", () => {
    const actions = read("src/components/materials/MaterialOpenActions.tsx");
    expect(actions).toContain("coreStudyGuideHref");
    expect(actions).toContain("materialId");
    expect(actions).toContain("Study Guide");
  });

  it("CORE preserves study-guide studio when materialId is present", () => {
    const core = read("src/components/core/CoreNotesWorkspace.tsx");
    expect(core).toContain('pendingStudio !== "study-guide"');
    expect(core).toContain('pendingStudio === "study-guide"');
    expect(core).toContain("setSelectedMaterialId");
    expect(core).toContain("setStudioTopic");
  });

  it("Biology → Cell Structure → Study Haul → Study Guide stays oriented", () => {
    const haul = studyHaulHref("c-bio", "Cell Structure");
    const guide = coreStudyGuideHref({
      courseId: "c-bio",
      topic: "Cell Structure",
    });
    expect(haul).toContain("topic=Cell+Structure");
    expect(guide).toContain("topic=Cell+Structure");
    expect(guide).toContain("studio=study-guide");
  });
});
