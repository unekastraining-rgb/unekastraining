import { describe, expect, it } from "vitest";

import { personalizeSixGuide, SIX_GUIDES } from "@/lib/csl/six-guides";

describe("personalizeSixGuide", () => {
  it("fills topic into directives and keeps chunking examples", () => {
    const guide = personalizeSixGuide("chunking", {
      topicName: "Intro to Business",
      courseTitle: "BUSN 1001",
    });
    expect(guide.whatItMeans.toLowerCase()).toContain("chunk");
    expect(guide.howTo.some((item) => item.includes("Intro to Business"))).toBe(true);
    expect(guide.examples.some((item) => /Object-Oriented|Stakeholders|chunk/i.test(item))).toBe(
      true,
    );
    expect(guide.steps[0]?.prompt).toContain("Intro to Business");
  });

  it("exposes guides for every Six component", () => {
    expect(Object.keys(SIX_GUIDES).length).toBe(6);
  });
});
