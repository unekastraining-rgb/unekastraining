import { beforeEach, describe, expect, it, vi } from "vitest";

const { backfillCourseTopicsIfEmpty, backfillUserCourseTopicsIfEmpty, findMany } =
  vi.hoisted(() => ({
    backfillCourseTopicsIfEmpty: vi.fn().mockResolvedValue(3),
    backfillUserCourseTopicsIfEmpty: vi.fn().mockResolvedValue(undefined),
    findMany: vi.fn().mockResolvedValue([]),
  }));

vi.mock("@/lib/syllabus/enrich-course-from-syllabus", () => ({
  backfillCourseTopicsIfEmpty,
  backfillUserCourseTopicsIfEmpty,
}));

vi.mock("@/lib/db", () => ({
  db: {
    topic: {
      findMany,
    },
  },
}));

describe("getSixRecommendations cold start", () => {
  beforeEach(() => {
    backfillCourseTopicsIfEmpty.mockClear();
    backfillUserCourseTopicsIfEmpty.mockClear();
    findMany.mockClear();
    findMany.mockResolvedValue([]);
  });

  it("backfills one course before recommending Six activities", async () => {
    const { getSixRecommendations } = await import("@/lib/csl/six-recommendations");
    await getSixRecommendations("user-1", 3, "course-cs201");

    expect(backfillCourseTopicsIfEmpty).toHaveBeenCalledWith("course-cs201");
    expect(backfillUserCourseTopicsIfEmpty).not.toHaveBeenCalled();
  });

  it("backfills all user courses when no course filter is passed", async () => {
    const { getSixRecommendations } = await import("@/lib/csl/six-recommendations");
    await getSixRecommendations("user-1", 3);

    expect(backfillUserCourseTopicsIfEmpty).toHaveBeenCalledWith("user-1");
    expect(backfillCourseTopicsIfEmpty).not.toHaveBeenCalled();
  });
});
