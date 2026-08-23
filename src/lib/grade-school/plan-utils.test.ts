import { describe, expect, it } from "vitest";

import { phaseProgress, resolvePlanPhases, parseSubjectsInput, isComprehensiveProfile } from "@/lib/grade-school/plan-utils";

describe("plan-utils", () => {
  it("parses multiple subjects", () => {
    expect(parseSubjectsInput("Reading, Math, Science (Minerals)")).toEqual([
      "Reading",
      "Math",
      "Science (Minerals)",
    ]);
  });

  it("detects comprehensive profiles", () => {
    expect(
      isComprehensiveProfile({
        strugglingWith: "decoding, comprehension, pseudoword fluency, multiplication facts",
        subjects: ["Reading", "Math"],
      }),
    ).toBe(true);
  });

  it("groups steps by track", () => {
    const phases = resolvePlanPhases(
      [
        { title: "A", skillFocus: "Decoding", skillTrack: "Decoding", domain: "reading", activityType: "practice", durationMinutes: 10, goal: "g", steps: [] },
        { title: "B", skillFocus: "Facts", skillTrack: "Math facts", domain: "math", activityType: "practice", durationMinutes: 10, goal: "g", steps: [] },
        { title: "C", skillFocus: "More", skillTrack: "Decoding", domain: "reading", activityType: "practice", durationMinutes: 10, goal: "g", steps: [] },
      ],
    );
    expect(phases.length).toBeGreaterThan(0);
    expect(phases[0]?.stepIndices.length).toBeGreaterThan(0);
  });

  it("tracks phase progress", () => {
    const phases = resolvePlanPhases([
      { title: "A", skillFocus: "x", activityType: "practice", durationMinutes: 10, goal: "g", steps: [] },
      { title: "B", skillFocus: "y", activityType: "practice", durationMinutes: 10, goal: "g", steps: [] },
    ]);
    const progress = phaseProgress(phases[0]!, [0]);
    expect(progress.done).toBe(1);
  });
});
