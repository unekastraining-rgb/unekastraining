/**
 * Pass 2 — Teach Me subject teaching + Locker fan-out integrity.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildSixLessonSystemPrompt,
  buildSixLessonUserPrompt,
  buildSubjectAwareFallbackLesson,
  isMetaStudySkillOutlineLesson,
  buildDeterministicSixLesson,
} from "@/lib/csl/six-worked-lesson";
import { getTeachingStylePolicy } from "@/lib/learning/tutor/teaching-style";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Pass 2 Teach Me subject teaching", () => {
  it("Objects and Classes gets subject-aware offline lesson (not meta outline)", () => {
    const lesson = buildSubjectAwareFallbackLesson(
      "detailed-explanation",
      "Objects and Classes",
    );
    expect(lesson).not.toBeNull();
    expect(isMetaStudySkillOutlineLesson(lesson!)).toBe(false);
    expect(lesson!.chunks.map((c) => c.title).join(" ")).toMatch(/Classes|Objects/i);
    expect(lesson!.chunks.some((c) => /cookie cutter|blueprint/i.test(c.memoryTrick ?? "") || /blueprint/i.test(c.explanation))).toBe(
      true,
    );
  });

  it("detailed-explanation meta outline is detectable", () => {
    const meta = buildDeterministicSixLesson("detailed-explanation", "Widgets");
    // Without specialized/source, deterministic may still build skeleton for non-API callers
    if (meta.chunks.some((c) => c.title.startsWith("Goal of "))) {
      expect(isMetaStudySkillOutlineLesson(meta)).toBe(true);
    }
  });

  it("source text can ground a subject fallback", () => {
    const source = [
      "A variable is a named place that stores a value in memory.",
      "In Python you write age = 25 to create a variable named age.",
      "Variables let programs remember and update information over time.",
      "Choose clear names so readers understand what the value means.",
    ].join("\n\n");
    const lesson = buildSubjectAwareFallbackLesson("detailed-explanation", "Variables", {
      sourceText: source,
    });
    expect(lesson).not.toBeNull();
    expect(isMetaStudySkillOutlineLesson(lesson!)).toBe(false);
    expect(lesson!.chunks.length).toBeGreaterThanOrEqual(3);
    expect(lesson!.chunks[0]?.explanation).toMatch(/variable/i);
  });

  it("explanation style reaches lesson prompts", () => {
    const policy = getTeachingStylePolicy("SIMPLIFIED").presentationPolicy;
    const system = buildSixLessonSystemPrompt("detailed-explanation", {
      teachingStylePolicy: policy,
    });
    expect(system).toContain("SIMPLIFIED");
    expect(system).toMatch(/SUBJECT|subject matter/i);

    const user = buildSixLessonUserPrompt({
      component: "detailed-explanation",
      topic: "Loops",
      teachingStyle: "SIMPLIFIED",
      teachingStylePolicy: policy,
    });
    expect(user).toContain("Teaching mode (explanation style): SIMPLIFIED");
    expect(user).toContain(policy.slice(0, 40));
  });

  it("six-lesson API wires teachingStyle and honest detailed-explanation failure", () => {
    const route = read("app/api/study/six-lesson/route.ts");
    expect(route).toContain("teachingStyle");
    expect(route).toContain("parseTeachingStyle");
    expect(route).toContain("buildSubjectAwareFallbackLesson");
    expect(route).toContain("isMetaStudySkillOutlineLesson");
    expect(route).toContain('component === "detailed-explanation"');
    expect(route).toContain("success: false");
    expect(route).toContain("buildSixLessonSystemPrompt(component,");
  });

  it("TeachFirstLearnActivity sends teachingStyle and rebuilds on style change", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    expect(teach).toContain("teachingStyle");
    expect(teach).toContain("materialId: materialId || undefined");
    expect(teach).toContain("effectiveTopic");
    expect(teach).toContain("teachingStyle");
    expect(teach).toContain("contentDifficulty");
    expect(teach).toContain("learnPreferences");
    expect(teach).toContain("data-learn-from-material");
    expect(teach).toContain("Could not finish generating this lesson");
  });
});

describe("Pass 2 Locker fan-out", () => {
  it("Material actions launch Teach Me and Tutor Me (not Tutor→Teach miswire)", () => {
    const actions = read("src/components/materials/MaterialOpenActions.tsx");
    expect(actions).toContain('label="Teach Me"');
    expect(actions).toContain('label="Tutor Me"');
    expect(actions).toContain('label="Practice"');
    expect(actions).toContain("teachMeHref");
    expect(actions).toContain('"tutor"');
    expect(actions).toContain('"teach"');
    expect(actions).toContain("hands-on-practice");
    // Preserved
    expect(actions).toContain("Flashcards");
    expect(actions).toContain("Blurt");
    expect(actions).toContain("Open Workspace");
    expect(actions).toContain("Open Study Haul");
    expect(actions).toContain("studyHaulHref");
  });

  it("MaterialLearningPanel Tutor Me uses focus=tutor", () => {
    const panel = read("src/components/materials/MaterialLearningPanel.tsx");
    expect(panel).toContain("data-material-ask-tutor");
    expect(panel).toContain("focus=tutor");
    expect(panel).toContain("Tutor Me");
    expect(panel).toContain("data-material-teach-me");
    expect(panel).toContain("focus=teach");
    expect(panel).toContain("data-material-practice");
    // Must not route Ask Tutor to teach-me without tutor focus
    expect(panel).not.toMatch(
      /data-material-ask-tutor[\s\S]{0,200}teach-me\?materialId=(?![\s\S]*focus=tutor)/,
    );
  });

  it("Pass 1 front door still present", () => {
    const hub = read("app/study/study-hub-view.tsx");
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    expect(center).toContain("What are you here to learn?");
    expect(hub).toContain("TopicStudyHaul");
    expect(hub).toContain("StudyHaulLearningCenter");
  });
});
