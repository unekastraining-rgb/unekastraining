import { describe, expect, it } from "vitest";

import { resolveSixActivityHref, SIX_GUIDES } from "@/lib/csl/six-guides";

describe("resolveSixActivityHref", () => {
  it("grounds Core activity links with course and material", () => {
    expect(
      resolveSixActivityHref(SIX_GUIDES.chunking, {
        courseId: "c1",
        materialId: "m9",
        topicName: "Osmosis",
      }),
    ).toBe("/core?courseId=c1&materialId=m9");
  });

  it("grounds flashcards and teach-me with loop context", () => {
    expect(
      resolveSixActivityHref(SIX_GUIDES["active-recall"], {
        courseId: "c1",
        materialId: "m2",
        topicName: "Mitosis",
      }),
    ).toBe("/flashcards?courseId=c1&materialId=m2&topic=Mitosis");

    expect(
      resolveSixActivityHref(SIX_GUIDES.feynman, {
        courseId: "c1",
        topicName: "Osmosis",
      }),
    ).toBe("/study/teach-me?courseId=c1&topic=Osmosis");
  });
});
