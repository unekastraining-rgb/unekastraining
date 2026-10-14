/**
 * Phase 5B — practice → concept resolution against DB mocks (ownership-safe).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockConceptFindFirst,
  mockTopicFindFirst,
  mockCourseFindFirst,
  mockMaterialFindFirst,
  mockEnsureConceptForTopic,
} = vi.hoisted(() => ({
  mockConceptFindFirst: vi.fn(),
  mockTopicFindFirst: vi.fn(),
  mockCourseFindFirst: vi.fn(),
  mockMaterialFindFirst: vi.fn(),
  mockEnsureConceptForTopic: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    concept: { findFirst: mockConceptFindFirst },
    topic: { findFirst: mockTopicFindFirst },
    course: { findFirst: mockCourseFindFirst },
    courseMaterial: { findFirst: mockMaterialFindFirst },
  },
}));

vi.mock("@/lib/learning/knowledge/concept", () => ({
  ensureConceptForTopic: mockEnsureConceptForTopic,
}));

import { resolveActivityLaunchConceptId } from "@/lib/learning/activities/resolve-activity-concept";

describe("resolveActivityLaunchConceptId", () => {
  beforeEach(() => {
    mockConceptFindFirst.mockReset();
    mockTopicFindFirst.mockReset();
    mockCourseFindFirst.mockReset();
    mockMaterialFindFirst.mockReset();
    mockEnsureConceptForTopic.mockReset();
  });

  it("uses explicit owned conceptId", async () => {
    mockConceptFindFirst.mockResolvedValueOnce({ id: "concept-owned" });

    const result = await resolveActivityLaunchConceptId({
      userId: "user-1",
      conceptId: "concept-owned",
      courseId: "course-1",
      topic: "Cell Structure",
      materialId: "mat-1",
    });

    expect(result).toEqual({
      conceptId: "concept-owned",
      resolvedVia: "explicit_concept",
    });
    expect(mockConceptFindFirst).toHaveBeenCalledWith({
      where: { id: "concept-owned", userId: "user-1" },
      select: { id: true },
    });
  });

  it("ignores explicit concept owned by another user", async () => {
    mockConceptFindFirst
      .mockResolvedValueOnce(null) // explicit ownership miss
      .mockResolvedValueOnce(null); // latest_owned miss
    mockCourseFindFirst.mockResolvedValueOnce({ id: "course-1" });
    mockTopicFindFirst.mockResolvedValueOnce(null);

    const result = await resolveActivityLaunchConceptId({
      userId: "user-1",
      conceptId: "foreign-concept",
      courseId: "course-1",
      topic: "Missing Topic",
    });

    expect(result.resolvedVia).toBe("none");
    expect(result.conceptId).toBe("");
  });

  it("resolves course + topic to owned topic concept", async () => {
    mockConceptFindFirst.mockResolvedValueOnce(null);
    mockCourseFindFirst.mockResolvedValueOnce({ id: "course-1" });
    mockTopicFindFirst.mockResolvedValueOnce({
      id: "topic-1",
      conceptId: "concept-from-topic",
    });

    const result = await resolveActivityLaunchConceptId({
      userId: "user-1",
      courseId: "course-1",
      topic: "Cell Structure",
    });

    expect(result).toEqual({
      conceptId: "concept-from-topic",
      resolvedVia: "course_topic",
    });
    expect(mockTopicFindFirst).toHaveBeenCalledWith({
      where: { courseId: "course-1", name: "Cell Structure" },
      select: { id: true, conceptId: true },
    });
  });

  it("resolves materialId through owned material → course → topic", async () => {
    mockConceptFindFirst.mockResolvedValueOnce(null);
    mockMaterialFindFirst.mockResolvedValueOnce({
      courseId: "course-bio",
      title: "Cell Structure notes",
    });
    mockCourseFindFirst.mockResolvedValueOnce({ id: "course-bio" });
    mockTopicFindFirst.mockResolvedValueOnce({
      id: "topic-cells",
      conceptId: "concept-cells",
    });

    const result = await resolveActivityLaunchConceptId({
      userId: "user-1",
      materialId: "mat-cells",
    });

    expect(result).toEqual({
      conceptId: "concept-cells",
      resolvedVia: "material_course_topic",
    });
    expect(mockMaterialFindFirst).toHaveBeenCalledWith({
      where: { id: "mat-cells", course: { userId: "user-1" } },
      select: { courseId: true, title: true },
    });
  });

  it("topic across courses picks latest owned topic deterministically", async () => {
    mockConceptFindFirst.mockResolvedValueOnce(null);
    mockTopicFindFirst.mockResolvedValueOnce({
      id: "topic-newer",
      conceptId: "concept-newer",
    });

    const result = await resolveActivityLaunchConceptId({
      userId: "user-1",
      topic: "Mitosis",
    });

    expect(result).toEqual({
      conceptId: "concept-newer",
      resolvedVia: "topic_name",
    });
    expect(mockTopicFindFirst).toHaveBeenCalledWith({
      where: { name: "Mitosis", course: { userId: "user-1" } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, conceptId: true },
    });
  });

  it("no context returns safe empty fallback without inventing a concept", async () => {
    mockConceptFindFirst.mockResolvedValueOnce(null);

    const result = await resolveActivityLaunchConceptId({
      userId: "user-1",
    });

    expect(result).toEqual({ conceptId: "", resolvedVia: "none" });
    expect(mockEnsureConceptForTopic).not.toHaveBeenCalled();
    expect(mockTopicFindFirst).not.toHaveBeenCalled();
  });

  it("ensures concept only when an owned topic exists without conceptId", async () => {
    mockConceptFindFirst.mockResolvedValueOnce(null);
    mockCourseFindFirst.mockResolvedValueOnce({ id: "course-1" });
    mockTopicFindFirst.mockResolvedValueOnce({
      id: "topic-bare",
      conceptId: null,
    });
    mockEnsureConceptForTopic.mockResolvedValueOnce({ id: "concept-ensured" });

    const result = await resolveActivityLaunchConceptId({
      userId: "user-1",
      courseId: "course-1",
      topic: "Photosynthesis",
    });

    expect(result).toEqual({
      conceptId: "concept-ensured",
      resolvedVia: "course_topic",
    });
    expect(mockEnsureConceptForTopic).toHaveBeenCalledWith("user-1", "topic-bare");
  });
});
