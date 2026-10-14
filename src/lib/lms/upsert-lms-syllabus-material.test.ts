/**
 * Upsert LMS SYLLABUS CourseMaterial — idempotent create/update.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { MaterialType } from "@/generated/prisma";

const { mockFindFirst, mockCreate, mockUpdate } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    courseMaterial: {
      findFirst: mockFindFirst,
      create: mockCreate,
      update: mockUpdate,
    },
  },
}));

import { upsertLmsSyllabusMaterial } from "@/lib/lms/upsert-lms-syllabus-material";

describe("upsertLmsSyllabusMaterial", () => {
  beforeEach(() => {
    mockFindFirst.mockReset();
    mockCreate.mockReset();
    mockUpdate.mockReset();
  });

  it("creates a SYLLABUS material when none exists", async () => {
    mockFindFirst.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce({ id: "mat-new" });

    const result = await upsertLmsSyllabusMaterial({
      courseId: "course-1",
      title: "Bio Syllabus (Google Classroom)",
      url: "https://classroom.google.com/c/abc",
      extractedText: "Course: Biology\n1. Cell Structure",
    });

    expect(result).toBe("created");
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { courseId: "course-1", type: MaterialType.SYLLABUS },
      select: { id: true },
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        courseId: "course-1",
        title: "Bio Syllabus (Google Classroom)",
        type: MaterialType.SYLLABUS,
        url: "https://classroom.google.com/c/abc",
        extractedText: "Course: Biology\n1. Cell Structure",
        sortOrder: 0,
      },
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates the existing SYLLABUS on repeated sync (no duplicate)", async () => {
    mockFindFirst.mockResolvedValueOnce({ id: "mat-existing" });
    mockUpdate.mockResolvedValueOnce({ id: "mat-existing" });

    const result = await upsertLmsSyllabusMaterial({
      courseId: "course-1",
      title: "Bio Syllabus (Blackboard)",
      url: "https://bb.example/ultra/courses/BIO101",
      extractedText: "Course: Biology\n1. Mitosis",
    });

    expect(result).toBe("updated");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "mat-existing" },
      data: {
        title: "Bio Syllabus (Blackboard)",
        url: "https://bb.example/ultra/courses/BIO101",
        extractedText: "Course: Biology\n1. Mitosis",
      },
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
