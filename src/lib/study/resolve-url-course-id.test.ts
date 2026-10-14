import { describe, expect, it } from "vitest";

import { resolveUrlCourseId } from "@/lib/study/resolve-url-course-id";

describe("resolveUrlCourseId", () => {
  it("uses URL courseId when it exists in the loaded list", () => {
    expect(resolveUrlCourseId("demo-cs201", ["demo-cs201", "eng110"])).toBe("demo-cs201");
  });

  it("falls back to first course when URL id is missing from DB (pre-import demo links)", () => {
    expect(resolveUrlCourseId("demo-cs201", ["intro-cs", "eng110"])).toBe("intro-cs");
  });

  it("returns empty when no courses are loaded", () => {
    expect(resolveUrlCourseId("demo-cs201", [])).toBe("");
    expect(resolveUrlCourseId(null, [])).toBe("");
  });
});
