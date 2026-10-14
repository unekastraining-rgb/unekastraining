/**
 * Learning-center IA — Welcome → What → How → Environment.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Study Haul learning-center IA", () => {
  it("Welcome front door asks what you are here to learn", () => {
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    const hub = read("app/study/study-hub-view.tsx");
    expect(center).toContain("Welcome to Study Haul");
    expect(center).toContain("What are you here to learn?");
    expect(center).toContain("data-study-haul-journey=\"welcome\"");
    expect(center).toContain("data-hub-learning-front-door");
    expect(center).toContain("My Courses");
    expect(center).toContain("My Learning");
    expect(center).toContain("Learn Something New");
    expect(center).toContain("data-hub-welcome-door");
    expect(center).toContain("Start a Study Session");
    expect(hub).toContain("StudyHaulLearningCenter");
    // No topic required to enter Study Haul
    expect(center).toContain('data-study-haul-journey="welcome"');
  });

  it("My Learning supports existing material import", () => {
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    expect(center).toContain('data-hub-portal="learning"');
    expect(center).toContain("AddCourseMaterialButton");
    expect(center).toContain("Bring something");
    expect(center).toContain("Open Locker");
  });

  it("Learn Something New establishes WHAT then lands on Haul HOW", () => {
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    const card = read("src/components/study/StudyThisCard.tsx");
    expect(center).toContain("landOnHaul");
    expect(center).toContain("data-hub-learn-something-new");
    expect(card).toContain("landOnHaul");
    expect(card).toContain('router.push(`/study?${params.toString()}`)');
    // Direct teach-first still available when not landOnHaul
    expect(card).toContain("/study/teach-me");
  });

  it("Continue only renders when resumable content exists", () => {
    const cont = read(
      "src/components/study/LearnerGrowthContinuityStrip.tsx",
    );
    expect(cont).toContain("return null");
    expect(cont).not.toContain("Nothing to resume yet");
    expect(cont).toContain("Continue where you left off");
  });

  it("WHAT → HOW separation: context then destinations", () => {
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(center).toContain('data-study-haul-journey="what"');
    expect(center).toContain('data-study-haul-journey="how"');
    expect(center).toContain("What are you learning?");
    expect(center).toContain("data-hub-what-topic-pick");
    expect(center).toContain("selectTopicForHow");
    expect(topic).toContain("How do you want to learn?");
    expect(topic).toContain("data-study-what-context");
    expect(topic).toContain("data-study-destinations");
  });

  it("quiet nav supports Change Material and Change How", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(topic).toContain("Change material");
    expect(topic).toContain("Change how I learn");
    expect(topic).toContain("data-study-change-material");
    expect(topic).toContain("onChangeMaterial");
    expect(topic).toContain("exitDestination");
  });

  it("front door does not show schoolwork or permanent Suggested", () => {
    const hub = read("app/study/study-hub-view.tsx");
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    expect(hub).not.toContain("data-school-upcoming-strip");
    expect(hub).not.toContain("Upcoming school work");
    expect(center).not.toContain("Suggested for you");
    expect(hub).not.toContain("OrchestratorSuggestionCard");
    expect(hub).toMatch(/void upcomingSchoolWork/);
  });

  it("activities stay off the welcome front door", () => {
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    expect(center).not.toContain("listSupportedPracticeLandscape");
    expect(center).not.toContain("data-study-gallery");
    expect(center).toContain("TopicStudyHaul");
  });
});
