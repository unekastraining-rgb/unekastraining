/**
 * Unified learning UX — teach-first + Hub intents integrity.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  parseLearningFocus,
  shouldTeachBeforePractice,
  withLearningFocus,
} from "@/lib/study/learning-focus";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("learning-focus helpers", () => {
  it("parses Hub intents", () => {
    expect(parseLearningFocus("teach")).toBe("teach");
    expect(parseLearningFocus("tutor")).toBe("tutor");
    expect(parseLearningFocus("bogus")).toBeNull();
  });

  it("cold / teach / tutor → teach before practice", () => {
    expect(shouldTeachBeforePractice({ focus: "teach" })).toBe(true);
    expect(shouldTeachBeforePractice({ focus: "tutor" })).toBe(true);
    expect(shouldTeachBeforePractice({ focus: null })).toBe(true);
    expect(shouldTeachBeforePractice({ focus: "practice" })).toBe(false);
    expect(shouldTeachBeforePractice({ focus: "explain" })).toBe(false);
    expect(
      shouldTeachBeforePractice({
        focus: null,
        techniquePrefersRecallFirst: true,
      }),
    ).toBe(false);
  });

  it("withLearningFocus is additive", () => {
    expect(withLearningFocus("/study/teach-me", "teach")).toBe(
      "/study/teach-me?focus=teach",
    );
    expect(withLearningFocus("/study/teach-me?focus=tutor", "teach")).toContain(
      "focus=tutor",
    );
  });
});

describe("unified learning UX integrity", () => {
  it("Study Hub exposes learning front door and topic intents", () => {
    const hub = read("app/study/study-hub-view.tsx");
    const center = read("src/components/study/StudyHaulLearningCenter.tsx");
    expect(center).toContain("What are you here to learn?");
    expect(center).toContain("My Courses");
    expect(center).toContain("My Learning");
    expect(center).toContain("Learn Something New");
    expect(center).toContain("data-hub-learning-front-door");
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(topic).toContain("Teach Me");
    expect(topic).toContain("Practice");
    expect(topic).toContain("Tutor Me");
    expect(topic).toContain("data-hub-learning-intents");
    expect(topic).toContain("data-study-destinations");
    expect(topic).toContain("resolveStudyRoomHref");
    const rooms = read("src/lib/study/resolve-study-room.ts");
    expect(rooms).toContain('withLearningFocus("/study/teach-me", "teach")');
    expect(hub).toContain("StudyHaulLearningCenter");
  });

  it("Teach Me defaults to teach-first surface", () => {
    const client = read("app/study/teach-me/teach-me-client.tsx");
    expect(client).toContain("TeachFirstLearnActivity");
    expect(client).toContain('focus === "explain"');
    const teach = read("src/components/study/TeachFirstLearnActivity.tsx");
    const stage = read(
      "src/components/study/learning-workspace/LearningObjectStage.tsx",
    );
    const dock = read(
      "src/components/study/learning-workspace/LearningDock.tsx",
    );
    expect(teach).toContain("data-learn-teach-first");
    expect(stage).toContain("data-learn-teaching-panel");
    expect(dock).toContain("data-learn-next-actions");
    // Explain is optional / gated — not the sole cold entry
    expect(stage).toContain("data-learn-explain-panel");
    expect(teach).toMatch(/showExplain/);
    expect(teach).toContain("Tutor Me");
    expect(teach).toContain("ContextualCapabilityStrip");
    expect(teach).not.toMatch(
      /placeholder=\{[^}]*Explain the concept in your own words/,
    );
  });

  it("SIX session gates practice for teach-first and fixes mobile order", () => {
    const six = read("src/components/study/SixGuidedSession.tsx");
    expect(six).toContain("data-six-teach-first-gate");
    expect(six).toContain("practiceUnlocked");
    expect(six).toContain("I&apos;m ready to practice");
    expect(six).toContain("data-six-session-layout");
    expect(six).toContain("shouldTeachBeforePractice");
    expect(six).toContain('openLabel="Tutor Me"');
    // Teach-first: teaching section order-1 on mobile
    expect(six).toMatch(/teachBeforePractice[\s\S]*order-1 xl:order-1/);
  });

  it("preserves all six technique ids and routes", () => {
    const six = read("src/lib/csl/six.ts");
    for (const id of [
      "chunking",
      "detailed-explanation",
      "feynman",
      "visualization",
      "hands-on-practice",
      "active-recall",
    ]) {
      expect(six).toContain(`"${id}"`);
    }
  });

  it("Tutor Me reuses SixTutorChat without evidence writes in chat", () => {
    const tutor = read("src/components/study/SixTutorChat.tsx");
    expect(tutor).toContain("openLabel");
    expect(tutor).toContain("defaultOpen");
    expect(tutor).toContain("/api/study/six-tutor");
    const route = read("app/api/study/six-tutor/route.ts");
    expect(route + tutor).not.toMatch(/recordEvidence|applyEvidenceToMastery/);
  });
});
