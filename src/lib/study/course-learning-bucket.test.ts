import { describe, expect, it } from "vitest";

import { resolveCourseLearningBucket } from "@/lib/study/course-learning-bucket";

describe("course-learning-bucket", () => {
  it("classifies LMS / school signals as My Courses", () => {
    expect(resolveCourseLearningBucket({ moodleCourseId: 12 })).toBe("courses");
    expect(
      resolveCourseLearningBucket({
        courseInfoSyncedAt: new Date().toISOString(),
      }),
    ).toBe("courses");
    expect(resolveCourseLearningBucket({ semester: "Fall 2026" })).toBe("courses");
    expect(resolveCourseLearningBucket({ assignmentCount: 2 })).toBe("courses");
    expect(resolveCourseLearningBucket({ code: "CS201" })).toBe("courses");
  });

  it("classifies independent study topics as My Learning", () => {
    expect(resolveCourseLearningBucket({})).toBe("learning");
    expect(
      resolveCourseLearningBucket({
        code: "  ",
        semester: null,
        assignmentCount: 0,
      }),
    ).toBe("learning");
  });
});
