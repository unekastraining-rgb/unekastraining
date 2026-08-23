import { describe, expect, it } from "vitest";

import { parseSyllabusHeuristic } from "@/lib/syllabus/parse-heuristic";

const SAMPLE_SYLLABUS = `
CS 101 — Introduction to Computer Science
Instructor: Dr. Jane Smith
Fall 2026

Class meets Mon/Wed 10:00 am - 11:15 am

Assignment 1 due 09/15/2026
Midterm Exam — October 5, 2026
Final Project due 12/10/2026
`;

describe("parseSyllabusHeuristic", () => {
  it("extracts course metadata and dated assignments without AI", () => {
    const result = parseSyllabusHeuristic(SAMPLE_SYLLABUS);

    expect(result.courseName).toContain("Introduction to Computer Science");
    expect(result.courseCode).toBe("CS 101");
    expect(result.instructor).toContain("Jane Smith");
    expect(result.semester?.toLowerCase()).toContain("fall");
    expect(result.assignments.length).toBeGreaterThanOrEqual(2);
    expect(result.meetings?.length).toBeGreaterThan(0);
  });

  it("falls back to the filename when text is empty", () => {
    const result = parseSyllabusHeuristic("", "MATH-220_syllabus.pdf");
    expect(result.courseName.toLowerCase()).toContain("math");
    expect(result.assignments).toEqual([]);
  });
});
