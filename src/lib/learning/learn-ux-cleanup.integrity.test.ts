/**
 * Final Learn UX cleanup — compact Continue, preserved Difficulty, entry rules.
 * Universal Learn workspace composition (canvas hierarchy).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Learn UX cleanup", () => {
  it("Learn bottom actions are compact Continue links, not a large card stack", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    const dock = read(
      "src/components/study/learning-workspace/LearningDock.tsx",
    );
    expect(dock).toContain("data-learn-next-actions");
    expect(dock).toContain("data-learn-continue-compact");
    expect(teach).toContain("Continue");
    expect(teach).not.toContain("What would you like to do next?");
    expect(dock).not.toMatch(
      /data-learn-next-actions[\s\S]*min-h-14[\s\S]*Tutor Me/,
    );
    // Capabilities remain accessible via dock + contextual strip
    expect(dock).toMatch(/Tutor/);
    expect(dock).toContain("Practice");
    expect(dock).toMatch(/>\s*Check\s*</);
    expect(teach).toContain("ContextualCapabilityStrip");
    expect(teach).toContain("SixTutorChat");
    expect(teach).toContain("practiceHref");
    expect(teach).toContain("setShowExplain");
    expect(teach).toContain("makeQuiz");
    expect(teach).toContain("resolveStudyRoomHref");
  });

  it("Learn workspace hierarchy: canvas + compact chrome + sticky nav + in-lesson Tutor", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    const dock = read(
      "src/components/study/learning-workspace/LearningDock.tsx",
    );
    const chat = read("src/components/study/SixTutorChat.tsx");
    const prefs = read("src/components/study/LearnPreferencesControls.tsx");
    const page = read("app/study/teach-me/page.tsx");

    expect(teach).toContain("data-learn-workspace");
    expect(teach).toContain("data-learn-workspace-chrome");
    expect(teach).toContain("data-learn-canvas");
    expect(teach).toContain("data-learn-change-course");
    expect(teach).toContain("data-learn-change-topic");
    expect(teach).toContain("data-learn-how-i-learn-trigger");
    expect(teach).toContain("data-learn-how-i-learn-panel");
    expect(teach).toContain('layout="workspace"');
    expect(teach).toContain("hideTrigger");
    expect(dock).toContain("data-learn-bottom-nav");
    expect(dock).toContain("fixed inset-x-0 bottom-0");
    expect(teach).not.toContain("How Study Haul helps you learn");
    expect(teach).not.toContain("StudyLoopStrip");
    expect(teach).not.toContain("Start Studying");
    expect(teach).not.toContain("What would you like to do next?");

    expect(chat).toContain('layout?: "floating" | "workspace"');
    expect(chat).toContain("data-learn-tutor-workspace");
    expect(prefs).toContain("embedded");
    expect(page).toContain('title="Learn"');
    expect(page).toContain("compact");
  });

  it("Difficulty / explanation-style control remains in Learn (not on front door)", () => {
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    expect(teach).toContain("TeachingStyleSelector");
    expect(teach).toContain("useSessionTeachingStyle");
    expect(teach).toContain("setTeachingStyle");
    // Not part of Welcome → What → How front door
    expect(center).not.toContain("TeachingStyleSelector");
    expect(center).not.toContain("Difficulty");
    expect(center).not.toMatch(
      /data-study-haul-journey="welcome"[\s\S]*teachingStyle/,
    );
  });

  it("Locker is not a standalone welcome destination; Import reaches Locker", () => {
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    const welcomeStart = center.indexOf('data-study-haul-journey="welcome"');
    const welcomeEnd = center.indexOf("function WelcomeDoor");
    expect(welcomeStart).toBeGreaterThan(-1);
    expect(welcomeEnd).toBeGreaterThan(welcomeStart);
    const welcomeSlice = center.slice(welcomeStart, welcomeEnd);
    expect(welcomeSlice).not.toMatch(/>\s*Locker\s*</);
    expect(welcomeSlice).not.toContain('hubTabPath("locker")');
    // My Learning still imports + links Locker
    expect(center).toContain("AddCourseMaterialButton");
    expect(center).toContain("Bring something");
    expect(center).toContain("Open Locker");
  });

  it("Start Study Session exists only on the initial Study Haul welcome", () => {
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(center).toContain("data-study-start-session");
    expect(center).toContain("Start a Study Session");
    expect(topic).not.toContain("Start Study Session");
    expect(topic).not.toContain("data-study-start-session");
    expect(topic).not.toContain("#start-studying");
  });
});
