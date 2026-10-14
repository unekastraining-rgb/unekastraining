import { beforeEach, describe, expect, it, vi } from "vitest";

import { MaterialType } from "@/generated/prisma";

const backfillCourseTopicsIfEmpty = vi.fn().mockResolvedValue(3);
const findFirst = vi.fn();

vi.mock("@/lib/syllabus/enrich-course-from-syllabus", () => ({
  backfillCourseTopicsIfEmpty,
}));

vi.mock("@/lib/db", () => ({
  db: {
    course: {
      findFirst,
    },
  },
}));

describe("loadCourseSourceText cold start", () => {
  beforeEach(() => {
    backfillCourseTopicsIfEmpty.mockClear();
    findFirst.mockReset();
  });

  it("backfills syllabus topics before loading course source (Blurt/Six/chat path)", async () => {
    findFirst.mockResolvedValue({
      title: "CS 201",
      code: "CS201",
      description: null,
      materials: [
        {
          extractedText: "Short",
          type: MaterialType.SYLLABUS,
        },
      ],
      topics: [
        { name: "Binary Search Trees", description: null },
        { name: "Graph Traversal", description: null },
        { name: "Dynamic Programming", description: null },
      ],
    });

    const { loadCourseSourceText } = await import("@/lib/ai/course-source");
    const result = await loadCourseSourceText("user-1", "course-cs201", 9000);

    expect(backfillCourseTopicsIfEmpty).toHaveBeenCalledWith("course-cs201");
    expect(result?.coldStart).toBe(true);
    expect(result?.text).toContain("Binary Search Trees");
  });
});
