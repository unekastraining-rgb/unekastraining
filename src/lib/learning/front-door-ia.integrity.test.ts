/**
 * Pass 1 — Front door + Topic Study Haul IA integrity (learning-center journey).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Pass 1 front door + Study Haul IA", () => {
  it("Study Hub leads with Welcome / What are you here to learn?", () => {
    const hub = read("app/study/study-hub-view.tsx");
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    expect(center).toContain("Welcome to Study Haul");
    expect(center).toContain("What are you here to learn?");
    expect(center).toContain("My Courses");
    expect(center).toContain("My Learning");
    expect(center).toContain("Learn Something New");
    expect(center).toContain("data-hub-learning-front-door");
    expect(center).toContain("data-hub-learn-something-new");
    expect(hub).toContain("Start Studying");
    expect(hub).toContain("TopicStudyHaul");
    expect(hub).toContain("StudyHaulLearningCenter");
  });

  it("intent actions live in Topic Study Haul, not as primary front door", () => {
    const hub = read("app/study/study-hub-view.tsx");
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    const rooms = read("src/lib/study/resolve-study-room.ts");
    expect(topic).toContain("data-hub-topic-study-haul");
    expect(topic).toContain("data-hub-learning-intents");
    expect(topic).toContain("data-study-destinations");
    expect(topic).toContain("Learn");
    expect(topic).toContain("Practice");
    expect(topic).toContain("Check");
    expect(topic).toContain("Remember");
    expect(topic).toContain("Tutor Me");
    expect(topic).toContain("Teach Me");
    expect(topic).toContain("listSupportedPracticeLandscape");
    expect(topic).toContain("data-hub-practice-landscape");
    expect(rooms).toContain("/study/lucky");
    expect(center).not.toMatch(
      /data-hub-learning-front-door[\s\S]*What do you want to do\?/,
    );
    expect(hub).not.toMatch(
      /data-hub-learning-front-door[\s\S]*What do you want to do\?/,
    );
  });

  it("demotes Suggested / feature inventory off the learning-center door", () => {
    const hub = read("app/study/study-hub-view.tsx");
    expect(hub).not.toContain("Suggested for you");
    expect(hub).not.toContain("OrchestratorSuggestionCard");
    expect(hub).not.toContain("data-school-upcoming-strip");
  });

  it("Learn Something New can land on Haul HOW (landOnHaul) or teach-first", () => {
    const card = read("src/components/study/StudyThisCard.tsx");
    expect(card).toContain("/study/teach-me");
    expect(card).toContain("withLearningFocus");
    expect(card).toContain('"teach"');
    expect(card).toContain("landOnHaul");
    expect(card).toMatch(
      /handleTopicSubmit[\s\S]*landOnHaul[\s\S]*\/study\?[\s\S]*teach-me|handleTopicSubmit[\s\S]*\/study\/teach-me/,
    );
  });

  it("does not invent UML or rename backend routes", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    const rooms = read("src/lib/study/resolve-study-room.ts");
    const landscape = read("src/lib/study/practice-landscape.ts");
    expect(topic).not.toMatch(/\/study\/activities\/uml/);
    expect(landscape).toContain("/study/six/hands-on-practice");
    expect(rooms).toContain('withLearningFocus("/study/teach-me", "tutor")');
  });
});
