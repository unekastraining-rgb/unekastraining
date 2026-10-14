/**
 * Pass 4 — Experience polish + learning-center journey integrity.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { HUB_ORCHESTRATOR_EMPTY_COPY } from "@/lib/learning/orchestrator/hub-empty-copy";
import { studyHaulHref } from "@/lib/study/loop-hrefs";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Pass 4 cohesion + connections", () => {
  it("front door remains primary; no duplicate competing front door", () => {
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    expect(center).toContain("What are you here to learn?");
    expect(center).toContain("My Courses");
    expect(center).toContain("My Learning");
    expect(center).toContain("Learn Something New");
    expect(center).toContain("data-hub-learning-front-door");
    expect(center).not.toMatch(
      /data-hub-learning-front-door[\s\S]*What do you want to do\?/,
    );
  });

  it("journey order: Welcome Continue → portals → HOW haul → session builder", () => {
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    const welcome = center.indexOf('data-study-haul-journey="welcome"');
    const primary = center.indexOf("data-study-primary-actions");
    const doors = center.indexOf("data-hub-welcome-door");
    const how = center.indexOf('data-study-haul-journey="how"');
    expect(welcome).toBeGreaterThan(-1);
    expect(primary).toBeGreaterThan(welcome);
    expect(doors).toBeGreaterThan(primary);
    expect(how).toBeGreaterThan(-1);
    expect(center).toContain("Start a Study Session");
    expect(center).not.toContain("Suggested for you");
  });

  it("Continue / Start Studying roles stay distinct", () => {
    const hub = read("app/study/study-hub-view.tsx");
    const cont = read("src/components/study/LearnerGrowthContinuityStrip.tsx");
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    expect(hub).toContain("Start Studying");
    expect(hub).toContain("session builder");
    expect(center).toContain("Start a Study Session");
    expect(cont).toContain("Continue");
    expect(cont).toMatch(/Resume something you already started|Continue where you left off/i);
    expect(cont).toContain("Optional next step");
    expect(HUB_ORCHESTRATOR_EMPTY_COPY.whatNowEyebrow).toBe("Suggested for you");
  });

  it("Topic Study Haul keeps destinations + struggling entry into Tutor", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    const rooms = read("src/lib/study/resolve-study-room.ts");
    expect(topic).toContain("data-study-destinations");
    expect(topic).toContain("Learn & Understand");
    expect(topic).toContain("Practice");
    expect(topic).toContain("Check My Understanding");
    expect(topic).toContain("Study & Remember");
    expect(topic).toContain("Teach Me");
    expect(topic).toContain("Tutor Me");
    expect(topic).toContain("data-hub-struggling-entry");
    expect(topic).toMatch(/struggling with this/);
    expect(rooms).toContain('withLearningFocus("/study/teach-me", "tutor")');
    expect(topic).toContain("data-study-room");
    expect(topic).toContain("Change material");
    expect(topic).not.toContain("LUCKY Engine");
    expect(topic).not.toContain("Orchestrator");
  });

  it("Locker connects materials to Study Haul without removing fan-out", () => {
    const actions = read("src/components/materials/MaterialOpenActions.tsx");
    const locker = read("src/components/hub/LockerTab.tsx");
    expect(actions).toContain("Open Study Haul");
    expect(actions).toContain("studyHaulHref");
    expect(actions).toContain('label="Teach Me"');
    expect(actions).toContain('label="Tutor Me"');
    expect(actions).toContain('label="Practice"');
    expect(locker).toContain("AddCourseMaterialButton");
    expect(studyHaulHref("c1", "Loops")).toContain("/study?");
  });

  it("learner-facing empty suggestion copy avoids internal architecture terms", () => {
    expect(HUB_ORCHESTRATOR_EMPTY_COPY.whatNowEyebrow).not.toMatch(
      /ULE|Evidence|AdaptiveSequence/i,
    );
    expect(HUB_ORCHESTRATOR_EMPTY_COPY.noSuggestionBody).not.toMatch(
      /AdaptiveSequence|ConceptMastery/i,
    );
  });

  it("mobile-friendly touch targets remain on primary surfaces", () => {
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(center).toContain("touch-manipulation");
    expect(center).toContain("min-h-11");
    expect(topic).toContain("touch-manipulation");
    expect(topic).toContain("min-h-11");
  });
});
