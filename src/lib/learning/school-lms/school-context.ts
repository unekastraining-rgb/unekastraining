/**
 * 2P-49 — School context contract (read-side).
 * Study Haul is school/workflow context around ULE — not a second learning engine.
 * School context ≠ mastery.
 */

import type { LearningIntentPurpose } from "@/lib/learning/intent/types";

/** Soft provenance for school → learning handoff (display / continuity). */
export type SchoolContext = {
  courseId: string | null;
  assignmentId: string | null;
  materialId: string | null;
  /** LMS / manual / demo — attribution only. */
  source: "lms" | "manual" | "demo" | "unknown" | null;
  term: string | null;
};

export type ConceptAlignmentState =
  | "confirmed"
  | "inferred"
  | "unaligned";

/**
 * Honest alignment label for assignment↔concept bridging.
 * exact → confirmed; contains → inferred; none → unaligned.
 * Never claims AI-invented mappings as confirmed.
 */
export function alignmentStateFromMatchKind(
  matchKind: "exact" | "contains" | "none",
): ConceptAlignmentState {
  if (matchKind === "exact") return "confirmed";
  if (matchKind === "contains") return "inferred";
  return "unaligned";
}

/**
 * Soft Learning Intent hint from assignment kind/title — does not invent a school intent system.
 * Maps into existing UNDERSTAND | PRACTICE | ASSESS | CREATE.
 */
export function inferSchoolLearningIntentHint(input: {
  kind?: string | null;
  title?: string | null;
}): LearningIntentPurpose | null {
  const kind = (input.kind ?? "").toString().trim().toUpperCase();
  const title = (input.title ?? "").toString().trim().toLowerCase();

  if (
    kind.includes("QUIZ") ||
    kind.includes("TEST") ||
    kind.includes("EXAM") ||
    /\b(quiz|exam|test|midterm|final)\b/.test(title)
  ) {
    return "ASSESS";
  }
  if (
    kind.includes("PROJECT") ||
    kind.includes("ESSAY") ||
    kind.includes("PAPER") ||
    /\b(write|essay|report|project|presentation|create)\b/.test(title)
  ) {
    return "CREATE";
  }
  if (
    kind.includes("READING") ||
    /\b(read|reading|chapter review|study guide)\b/.test(title)
  ) {
    return "UNDERSTAND";
  }
  if (kind || title) {
    return "PRACTICE";
  }
  return null;
}

export function emptySchoolContext(): SchoolContext {
  return {
    courseId: null,
    assignmentId: null,
    materialId: null,
    source: null,
    term: null,
  };
}

export function schoolContextTruthSummary(): {
  schoolContextIsNotMastery: true;
  inventsSecondLearningEngine: false;
  inventsLmsMastery: false;
  inventsSchoolCore: false;
  inventsCanvasAssignmentEngine: false;
  assignmentCompletionIsNotEvidence: true;
  lmsGradeIsNotConceptMastery: true;
  usesExistingIntentPurposes: true;
  usesExistingConceptBridge: true;
} {
  return {
    schoolContextIsNotMastery: true,
    inventsSecondLearningEngine: false,
    inventsLmsMastery: false,
    inventsSchoolCore: false,
    inventsCanvasAssignmentEngine: false,
    assignmentCompletionIsNotEvidence: true,
    lmsGradeIsNotConceptMastery: true,
    usesExistingIntentPurposes: true,
    usesExistingConceptBridge: true,
  };
}

/** Source-of-truth matrix for docs/tests. */
export function schoolSourceOfTruthMatrix(): {
  externalLmsAuthoritativeFor: readonly string[];
  studyHaulAuthoritativeFor: readonly string[];
  learnerAuthoritativeFor: readonly string[];
} {
  return {
    externalLmsAuthoritativeFor: [
      "externally_supplied_course_metadata",
      "externally_supplied_assignment_metadata",
      "external_due_dates_when_synced",
    ],
    studyHaulAuthoritativeFor: [
      "learner_evidence",
      "concept_mastery",
      "adaptive_state",
      "tutor_history",
      "learning_progress",
      "internal_learning_actions",
    ],
    learnerAuthoritativeFor: [
      "personal_notes",
      "learner_created_artifacts",
      "manual_planning_where_supported",
    ],
  };
}
