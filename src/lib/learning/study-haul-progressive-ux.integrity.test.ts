/**
 * Visual UX — Study Haul as a learning place (progressive destination rooms).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { UNSUPPORTED_PRACTICE_KINDS } from "@/lib/study/practice-landscape";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Study Haul progressive disclosure UX", () => {
  it("landing is a place with destinations; rooms replace the landing", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(topic).toContain("data-study-progressive");
    expect(topic).toContain("data-study-place");
    expect(topic).toContain("data-study-landing");
    expect(topic).toContain("data-study-room=");
    expect(topic).toContain("data-study-room-back");
    expect(topic).toContain("data-study-destinations");
    expect(topic).toContain("data-study-destination={id}");
    expect(topic).toContain('id: "learn"');
    expect(topic).toContain('id: "practice"');
    expect(topic).toContain('id: "check"');
    expect(topic).toContain('id: "remember"');
    expect(topic).toContain('id: "tutor"');
    expect(topic).toContain("data-study-gallery");
    expect(topic).toContain("enterDestination");
    expect(topic).toContain("exitDestination");
    // Not an always-open wall of activities on the landing
    expect(topic).not.toMatch(/data-study-landing[\s\S]*data-study-gallery/);
  });

  it("preserves Learn / Practice / Check / Remember / Tutor capabilities", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(topic).toContain("Teach Me");
    expect(topic).toContain("Ask a Question");
    expect(topic).toContain("listContextualPracticeChoices");
    expect(topic).toContain("listSupportedPracticeLandscape");
    expect(topic).toContain("Quiz");
    expect(topic).toContain("Flashcards");
    expect(topic).toContain("Tutor Me");
    expect(topic).toContain("resolveStudyRoomHref");
    expect(topic).toContain("How do you want to learn?");
    const rooms = read("src/lib/study/resolve-study-room.ts");
    expect(rooms).toContain("/study/lucky");
    expect(topic).not.toContain("Break It Down");
    expect(topic).not.toContain("Active Recall");
    for (const fake of UNSUPPORTED_PRACTICE_KINDS) {
      expect(topic).not.toMatch(new RegExp(`/study/activities/${fake}`));
    }
  });

  it("visual place cards + distinct destination identities + activity discovery", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    const rail = read("src/components/study/StudyHaulCardRail.tsx");
    expect(topic).toContain("StudyHaulCardRail");
    expect(topic).toContain("PlaceCard");
    expect(topic).toContain("ActivityCard");
    expect(topic).toContain("PLACE_VISUAL");
    expect(topic).toContain("PRACTICE_MARKS");
    expect(topic).toContain("data-study-place-card");
    expect(rail).toContain("overflow-x-auto");
    expect(rail).toContain("snap-x");
    expect(rail).toContain("Scroll activities left");
    expect(rail).toContain("touch-manipulation");
  });

  it("internal Study Haul menu reaches Progress and change controls", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(topic).toContain("data-study-haul-internal-menu");
    expect(topic).toContain("/study/learner-model");
    expect(topic).toContain("Progress");
    expect(topic).toContain("Change material");
    expect(topic).toContain("Change how I learn");
    // Start Study Session stays on welcome — not in-environment nav
    expect(topic).not.toContain("Start Study Session");
  });

  it("hub prioritizes Continue and learning-center journey before session builder", () => {
    const hub = read("app/study/study-hub-view.tsx");
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    expect(hub).toContain("StudyHaulLearningCenter");
    expect(center).toContain("data-study-primary-actions");
    expect(center).toContain("LearnerGrowthContinuityStrip");
    expect(hub).toContain("Start Studying");
    expect(center).toContain("Start a Study Session");
  });

  it("Grade School is audience presentation, not difficulty", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(topic).toContain("elementaryMode");
    expect(topic).toContain('data-audience={gradeSchool ? "grade-school" : "adult"}');
    expect(topic).toContain('data-audience-is-not-difficulty="true"');
    expect(topic).not.toMatch(/difficulty.*elementary|elementary.*difficulty/i);
    const hub = read("app/study/study-hub-view.tsx");
    expect(hub).toContain("GradeSchoolLearningPlan");
    expect(hub).toMatch(
      /elementaryMode \?[\s\S]*TopicStudyHaul[\s\S]*GradeSchoolLearningPlan|GradeSchoolLearningPlan[\s\S]*TopicStudyHaul/,
    );
    // Grade School also surfaces Continue for resume continuity
    expect(hub).toMatch(
      /elementaryMode \?[\s\S]*LearnerGrowthContinuityStrip[\s\S]*TopicStudyHaul/,
    );
  });

  it("does not expose SIX/LUCKY/Orchestrator as learner destinations", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(topic).not.toContain("LUCKY Engine");
    expect(topic).not.toContain("Orchestrator");
    expect(topic).not.toMatch(/data-study-destination="six"/i);
    expect(topic).not.toMatch(/title:\s*"SIX"/);
  });
});
