/**
 * Deterministic demo syllabus outlines for Canvas cold start without a live LMS.
 * Chapter/unit bullets become Blurt / Study-from-topics entries via enrichCourseFromSyllabus.
 */
import { chapterSubtopicsFromText } from "@/lib/syllabus/enrich-course-from-syllabus";

export function buildDemoCanvasSyllabus(code: "CS201" | "ENG110"): string {
  if (code === "CS201") {
    return `CS 201 — Data Structures
Course outline for cold-start study (Canvas demo).

## Learning outcomes
- Implement and analyze trees, heaps, graphs, and hash tables
- Choose the right structure for a problem

## Chapters
- Binary Search Trees
- Heaps and Priority Queues
- Graph Traversal (BFS/DFS)
- Hash Tables and Collision Handling
- Algorithm Complexity Review
`;
  }

  return `ENG 110 — Composition
Course outline for cold-start study (Canvas demo).

## Learning outcomes
- Draft clear thesis-driven essays
- Revise with peer and instructor feedback

## Units
- Thesis and Argument
- Evidence and Citation
- Revision Strategies
- Rhetorical Analysis
`;
}

/** Onboarding UI: Core→Six→Lucky deep links after demo LMS import. */
export function demoColdStartCourseEntry(
  courseId: string,
  title: string,
  code: "CS201" | "ENG110",
): { id: string; title: string; focusTopic: string | null } {
  const focusTopic = chapterSubtopicsFromText(buildDemoCanvasSyllabus(code))[0]?.name ?? null;
  return { id: courseId, title, focusTopic };
}
