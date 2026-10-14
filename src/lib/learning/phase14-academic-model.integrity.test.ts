/**
 * Bundle B Phase 14 — School / LMS Academic Model integrity.
 */
import { describe, expect, it } from "vitest";

import {
  academicMaterialFromCourseMaterial,
  academicSourceKey,
  academicSyncFailure,
  attachLearningTargets,
  dedupeAcademicItems,
  filterAcademicItemsForUser,
  fromBlackboardColumn,
  fromBlackboardCourse,
  fromCanvasAssignment,
  fromCanvasCourse,
  fromGoogleClassroomCourse,
  fromGoogleClassroomCourseWork,
  fromLocalAssignment,
  fromMoodleCourse,
  fromMoodleEvent,
  mergeAcademicItemsAfterSyncFailure,
} from "@/lib/learning/academic";
import "@/lib/learning/knowledge/packs";

describe("Phase 14 — School / LMS Academic Model", () => {
  it("Canvas normalization preserves source identity", () => {
    const course = fromCanvasCourse("u1", {
      id: 42,
      name: "CS 101",
      course_code: "CS101",
    });
    expect(course.source).toBe("canvas");
    expect(course.externalId).toBe("42");
    expect(course.id).toBe(academicSourceKey("canvas", "42"));
    expect(course.userId).toBe("u1");

    const item = fromCanvasAssignment("u1", course.id, {
      id: 99,
      name: "Java Exceptions Quiz",
      due_at: "2026-10-01T23:59:00Z",
      html_url: "https://canvas.example/assignments/99",
    });
    expect(item.source).toBe("canvas");
    expect(item.externalId).toBe("99");
    expect(item.id).toBe("canvas:99");
    expect(item.itemType).toBe("quiz");
  });

  it("Blackboard normalization", () => {
    const course = fromBlackboardCourse("u1", {
      id: "bb-c1",
      name: "Economics",
      courseId: "ECON101",
    });
    expect(course.source).toBe("blackboard");
    const col = fromBlackboardColumn("u1", course.id, {
      id: "col-1",
      name: "Midterm Exam",
      dueDate: "2026-11-01T12:00:00Z",
    });
    expect(col.source).toBe("blackboard");
    expect(col.itemType).toBe("exam");
    expect(col.id).toBe("blackboard:col-1");
  });

  it("Moodle normalization", () => {
    const course = fromMoodleCourse("u1", {
      id: 7,
      fullname: "Intro Psych",
      shortname: "PSY101",
    });
    expect(course.source).toBe("moodle");
    const event = fromMoodleEvent("u1", course.id, {
      id: 55,
      name: "Chapter 5 Assignment",
      timestart: Math.floor(Date.parse("2026-10-15T17:00:00Z") / 1000),
      modulename: "assign",
    });
    expect(event.source).toBe("moodle");
    expect(event.externalId).toBe("55");
    expect(event.dueAt).toBeInstanceOf(Date);
  });

  it("Google Classroom normalization", () => {
    const course = fromGoogleClassroomCourse("u1", {
      id: "gc1",
      name: "Biology",
      section: "Fall 2026",
    });
    expect(course.source).toBe("google-classroom");
    const work = fromGoogleClassroomCourseWork("u1", course.id, {
      id: "cw1",
      title: "Reading — Photosynthesis",
      dueDate: { year: 2026, month: 10, day: 20 },
      workType: "ASSIGNMENT",
    });
    expect(work.source).toBe("google-classroom");
    expect(work.id).toBe("google-classroom:cw1");
    expect(work.itemType).toBe("reading");
  });

  it("local academic item normalization", () => {
    const local = fromLocalAssignment("u1", {
      id: "asg-local-1",
      courseId: "course-1",
      title: "ArrayList Practice",
      dueDate: new Date("2026-10-05"),
      kind: "ASSIGNMENT",
      status: "NOT_STARTED",
    });
    expect(local.source).toBe("local");
    expect(local.internalAssignmentId).toBe("asg-local-1");
    expect(local.id).toBe("local:asg-local-1");
  });

  it("stable source IDs — no duplicates", () => {
    const a = fromCanvasAssignment("u1", "canvas:1", {
      id: 10,
      name: "Quiz 1",
    });
    const b = fromCanvasAssignment("u1", "canvas:1", {
      id: 10,
      name: "Quiz 1 (renamed)",
    });
    expect(a.id).toBe(b.id);
    expect(dedupeAcademicItems([a, b])).toHaveLength(1);
  });

  it("learning target association uses KL when available", () => {
    const item = fromLocalAssignment("u1", {
      id: "a1",
      courseId: "c1",
      title: "ArrayList in Java",
    });
    const withTargets = attachLearningTargets(item);
    expect(withTargets.learningTargets?.some((t) => t.conceptId === "java-arraylist")).toBe(
      true,
    );
    expect(
      withTargets.learningTargets?.every(
        (t) => !t.conceptId.startsWith("fabricated-"),
      ),
    ).toBe(true);
  });

  it("course/material association", () => {
    const mat = academicMaterialFromCourseMaterial({
      userId: "u1",
      courseId: "c1",
      materialId: "mat-1",
      title: "Chapter 13 PDF",
      excerpt: "Exceptions…",
      source: "canvas",
    });
    expect(mat.materialId).toBe("mat-1");
    expect(mat.courseId).toBe("c1");
    expect(mat.userId).toBe("u1");
  });

  it("ownership isolation", () => {
    const items = [
      fromLocalAssignment("u1", {
        id: "a1",
        courseId: "c1",
        title: "A",
      }),
      fromLocalAssignment("u2", {
        id: "a2",
        courseId: "c2",
        title: "B",
      }),
    ];
    expect(filterAcademicItemsForUser("u1", items)).toHaveLength(1);
    expect(filterAcademicItemsForUser("u1", items)[0].userId).toBe("u1");
  });

  it("LMS failure preserves local data", () => {
    const local = [
      fromLocalAssignment("u1", {
        id: "a1",
        courseId: "c1",
        title: "Local task",
      }),
    ];
    const failure = academicSyncFailure("canvas", "Canvas API timeout");
    const merged = mergeAcademicItemsAfterSyncFailure({
      localItems: local,
      failure,
    });
    expect(merged.failure.localDataPreserved).toBe(true);
    expect(merged.failure.recoverable).toBe(true);
    expect(merged.items).toHaveLength(1);
  });
});
