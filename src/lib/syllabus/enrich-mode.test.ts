import { describe, expect, it } from "vitest";

import { resolveSyllabusEnrichMode } from "@/lib/syllabus/enrich-course-from-syllabus";

describe("resolveSyllabusEnrichMode", () => {
  it("runs full enrich when forced or when no plan exists", () => {
    expect(
      resolveSyllabusEnrichMode({
        force: true,
        hasUsablePlan: true,
        nonGeneralTopicCount: 5,
      }),
    ).toBe("full");
    expect(
      resolveSyllabusEnrichMode({
        hasUsablePlan: false,
        nonGeneralTopicCount: 0,
      }),
    ).toBe("full");
  });

  it("skips when plan and topics already exist (Canvas re-sync)", () => {
    expect(
      resolveSyllabusEnrichMode({
        hasUsablePlan: true,
        nonGeneralTopicCount: 3,
      }),
    ).toBe("skip");
  });

  it("seeds topics from the existing plan when cold-start topics are missing", () => {
    expect(
      resolveSyllabusEnrichMode({
        hasUsablePlan: true,
        nonGeneralTopicCount: 0,
      }),
    ).toBe("topics_from_plan");
  });
});
