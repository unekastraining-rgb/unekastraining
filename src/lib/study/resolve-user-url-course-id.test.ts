import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    course: {
      findMany: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import {
  loadUserCourseIds,
  resolveUserUrlCourseId,
} from "@/lib/study/resolve-user-url-course-id";

describe("resolveUserUrlCourseId", () => {
  it("falls back to first loaded class when URL id is not imported yet", async () => {
    vi.mocked(db.course.findMany).mockResolvedValue([
      { id: "intro-cs" },
      { id: "eng110" },
    ] as never);

    await expect(
      resolveUserUrlCourseId("user-1", "demo-cs201"),
    ).resolves.toBe("intro-cs");
  });

  it("returns exact match when URL course exists", async () => {
    vi.mocked(db.course.findMany).mockResolvedValue([
      { id: "demo-cs201" },
    ] as never);

    await expect(
      resolveUserUrlCourseId("user-1", "demo-cs201"),
    ).resolves.toBe("demo-cs201");
  });

  it("loadUserCourseIds returns ordered ids", async () => {
    vi.mocked(db.course.findMany).mockResolvedValue([
      { id: "a" },
      { id: "b" },
    ] as never);

    await expect(loadUserCourseIds("user-1")).resolves.toEqual(["a", "b"]);
  });
});
