/**
 * 2P-31 — School / LMS evidence & mastery boundaries.
 * Sync, grades, assignment status, and calendar never create ULE evidence.
 */

export const SCHOOL_LMS_EVIDENCE_BOUNDARY = {
  lmsSyncCreatesLearningAttempt: false,
  lmsSyncCreatesConceptMastery: false,
  gradeImportCreatesConceptMastery: false,
  assignmentStatusChangeCreatesLearningAttempt: false,
  assignmentSubmissionCreatesLearningAttempt: false,
  calendarEventCreatesLearningAttempt: false,
  dueDateContextCreatesEvidence: false,
  courseViewCreatesEvidence: false,
  /** Only existing ULE activity paths may create evidence. */
  adaptiveActivityMayCreateEvidence: true,
} as const;

export function schoolLmsCreatesEvidence(
  action: keyof typeof SCHOOL_LMS_EVIDENCE_BOUNDARY,
): boolean {
  return SCHOOL_LMS_EVIDENCE_BOUNDARY[action] === true;
}

export function schoolLmsBoundaryTruthSummary(): {
  gradesAreNotMastery: true;
  assignmentCompletionIsNotEvidence: true;
  calendarIsNotEvidence: true;
  syncIsNotEvidence: true;
  courseIsNotUleRoot: true;
  conceptMasteryRemainsCanonical: true;
  noCourseMastery: true;
  noAssignmentMastery: true;
  noLmsMastery: true;
} {
  return {
    gradesAreNotMastery: true,
    assignmentCompletionIsNotEvidence: true,
    calendarIsNotEvidence: true,
    syncIsNotEvidence: true,
    courseIsNotUleRoot: true,
    conceptMasteryRemainsCanonical: true,
    noCourseMastery: true,
    noAssignmentMastery: true,
    noLmsMastery: true,
  };
}
