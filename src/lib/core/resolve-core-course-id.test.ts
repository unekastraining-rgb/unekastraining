import { describe, expect, it } from "vitest";

import {
  resolveCoreCourseId,
  resolveUrlCourseId,
} from "@/lib/core/resolve-core-course-id";

/**
 * 2P-35 — restore empty suite (pre-existing blank file blocked full Vitest).
 * Behavior lives in resolve-url-course-id; this file re-exports.
 */
describe("resolveCoreCourseId / resolveUrlCourseId", () => {
  it("returns empty string when no courses are loaded", () => {
    expect(resolveCoreCourseId(null, [])).toBe("");
    expect(resolveUrlCourseId(undefined, [])).toBe("");
  });

  it("prefers URL course when present in owned list", () => {
    const courseIds = ["c1", "c2"] as const;
    expect(resolveCoreCourseId("c2", courseIds)).toBe("c2");
    expect(resolveUrlCourseId("c1", courseIds)).toBe("c1");
  });

  it("falls back to first loaded course when URL id is unknown", () => {
    expect(resolveUrlCourseId("missing", ["c1", "c2"])).toBe("c1");
  });
});
