/**
 * Study Haul core study experience — place feel + destination rooms.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  listSupportedPracticeLandscape,
  UNSUPPORTED_PRACTICE_KINDS,
} from "@/lib/study/practice-landscape";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Study Haul place experience", () => {
  it("landing hierarchy: identity, How do you want to learn?", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(topic).toContain("data-study-topic-identity");
    expect(topic).toContain("data-study-need-prompt");
    expect(topic).toContain("How do you want to learn?");
    expect(topic).toContain("data-study-what-context");
  });

  it("entering a destination replaces landing with a focused room", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(topic).toContain("data-study-room={destination}");
    expect(topic).toContain("data-study-room-back");
    expect(topic).toContain("exitDestination");
    expect(topic).toContain("enterDestination");
    // Landing and room are mutually exclusive branches
    expect(topic).toMatch(
      /destination && gallery && roomVisual[\s\S]*data-study-landing/,
    );
  });

  it("each destination has a distinct visual identity", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(topic).toContain("PLACE_VISUAL");
    for (const id of ["learn", "practice", "check", "remember", "tutor"] as const) {
      expect(topic).toContain(`${id}:`);
      expect(topic).toContain(`data-study-place-card`);
    }
    expect(topic).toContain("wellAdult");
    expect(topic).toContain("wellGs");
    expect(topic).toContain("roomAdult");
    expect(topic).toContain("roomGs");
  });

  it("Practice room discovers contextual practice — not the full capability catalog", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(topic).toContain("listContextualPracticeChoices");
    expect(topic).toContain("listSupportedPracticeLandscape");
    expect(topic).toContain("PRACTICE_MARKS");
    expect(topic).toContain("</>");
    expect(topic).toContain("∑");
    expect(topic).toContain("practiceMore: []");
    for (const item of listSupportedPracticeLandscape()) {
      // Icon/mark registry still covers engine kinds; learner UI does not dump them.
      expect(topic).toContain(item.id === "six-hands-on" ? "six-hands-on" : item.id);
    }
    for (const fake of UNSUPPORTED_PRACTICE_KINDS) {
      expect(topic).not.toMatch(new RegExp(`/study/activities/${fake}`));
    }
  });

  it("Tutor room offers Start Talking with existing tutor route", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    const rooms = read("src/lib/study/resolve-study-room.ts");
    expect(topic).toContain("Start Talking");
    expect(topic).toContain("data-study-activity=\"tutor-me-primary\"");
    expect(rooms).toContain('withLearningFocus("/study/teach-me", "tutor")');
  });

  it("adult mode uses mature marks; Grade School uses warmer audience styling", () => {
    const topic = read("src/components/study/TopicStudyHaul.tsx");
    expect(topic).toContain("elementaryMode");
    expect(topic).toContain('data-audience-is-not-difficulty="true"');
    expect(topic).toContain("from-stone-50 via-white to-teal-50");
    expect(topic).toContain("from-teal-50 via-amber-50");
    expect(topic).not.toMatch(/crayon|cartoon child|mascot|remedial/i);
  });

  it("Continue strip remains a resume surface without inventing state", () => {
    const cont = read("src/components/study/LearnerGrowthContinuityStrip.tsx");
    expect(cont).toContain("Continue");
    expect(cont).toContain("return null");
    expect(cont).toContain("Continue where you left off");
  });
});
