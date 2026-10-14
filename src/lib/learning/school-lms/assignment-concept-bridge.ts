/**
 * 2P-31 — Assignment → Topic → Concept learning bridge (read helpers).
 *
 * Does NOT invent Concepts from bare assignment titles.
 * Does NOT write LearningAttempt / ConceptMastery.
 * Adaptive entry only when an owned Concept id is already known (or ensured
 * via ensureConceptForTopic on an existing Topic — Concept only).
 */

import {
  resolvePlannerAdaptiveEntry,
} from "@/lib/learning/study-now-ule-bridge";
import type { HubAdaptivePrimaryCta } from "@/lib/learning/orchestrator/hub-adaptive-bridge";
import { alignmentStateFromMatchKind } from "./school-context";

export type AssignmentTopicCandidate = {
  id: string;
  name: string;
  courseId: string;
  conceptId: string | null;
};

export type AssignmentConceptLink = {
  assignmentId: string;
  courseId: string;
  topicId: string | null;
  conceptId: string | null;
  matchKind: "exact" | "contains" | "none";
  /** 2P-49 — honest alignment; never claims invented mappings as confirmed. */
  alignmentState: "confirmed" | "inferred" | "unaligned";
  adaptiveCta: HubAdaptivePrimaryCta;
};

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Find best Topic match for an assignment title within the same course.
 * Prefer exact normalized match; else topic name contained in assignment title
 * (or reverse) with longest topic name winning.
 */
export function matchTopicForAssignmentTitle(
  assignmentTitle: string,
  topics: readonly AssignmentTopicCandidate[],
  courseId: string,
): { topic: AssignmentTopicCandidate; matchKind: "exact" | "contains" } | null {
  const needle = normalizeTitle(assignmentTitle);
  if (!needle) return null;
  const inCourse = topics.filter((t) => t.courseId === courseId);
  if (inCourse.length === 0) return null;

  const exact = inCourse.find((t) => normalizeTitle(t.name) === needle);
  if (exact) return { topic: exact, matchKind: "exact" };

  let best: AssignmentTopicCandidate | null = null;
  for (const t of inCourse) {
    const name = normalizeTitle(t.name);
    if (!name || name.length < 3) continue;
    if (needle.includes(name) || name.includes(needle)) {
      if (!best || name.length > normalizeTitle(best.name).length) {
        best = t;
      }
    }
  }
  return best ? { topic: best, matchKind: "contains" } : null;
}

/**
 * Pure enrichment: attach conceptId only when Topic.conceptId already exists.
 * Never invents Concepts.
 */
export function resolveAssignmentConceptLink(input: {
  assignmentId: string;
  courseId: string;
  title: string;
  topics: readonly AssignmentTopicCandidate[];
  activeRunId?: string | null;
}): AssignmentConceptLink {
  const matched = matchTopicForAssignmentTitle(
    input.title,
    input.topics,
    input.courseId,
  );
  if (!matched) {
    return {
      assignmentId: input.assignmentId,
      courseId: input.courseId,
      topicId: null,
      conceptId: null,
      matchKind: "none",
      alignmentState: "unaligned",
      adaptiveCta: resolvePlannerAdaptiveEntry({ conceptId: null }),
    };
  }
  const conceptId =
    typeof matched.topic.conceptId === "string" &&
    matched.topic.conceptId.trim()
      ? matched.topic.conceptId.trim()
      : null;
  return {
    assignmentId: input.assignmentId,
    courseId: input.courseId,
    topicId: matched.topic.id,
    conceptId,
    matchKind: matched.matchKind,
    alignmentState: alignmentStateFromMatchKind(matched.matchKind),
    adaptiveCta: resolvePlannerAdaptiveEntry({
      conceptId,
      activeRunId: input.activeRunId,
    }),
  };
}

export function enrichAssignmentsWithConceptLinks<
  T extends { id: string; courseId: string; title: string },
>(
  assignments: readonly T[],
  topics: readonly AssignmentTopicCandidate[],
): Array<
  T & {
    conceptId: string | null;
    topicId: string | null;
    alignmentState: "confirmed" | "inferred" | "unaligned";
  }
> {
  return assignments.map((a) => {
    const link = resolveAssignmentConceptLink({
      assignmentId: a.id,
      courseId: a.courseId,
      title: a.title,
      topics,
    });
    return {
      ...a,
      conceptId: link.conceptId,
      topicId: link.topicId,
      alignmentState: link.alignmentState,
    };
  });
}

export function assignmentLearningBridgeTruthSummary(): {
  inventsConceptsFromAssignmentTitle: false;
  assignmentStatusCreatesEvidence: false;
  gradeCreatesMastery: false;
  usesExistingAdaptiveEntry: true;
  courseIsOptional: true;
} {
  return {
    inventsConceptsFromAssignmentTitle: false,
    assignmentStatusCreatesEvidence: false,
    gradeCreatesMastery: false,
    usesExistingAdaptiveEntry: true,
    courseIsOptional: true,
  };
}
