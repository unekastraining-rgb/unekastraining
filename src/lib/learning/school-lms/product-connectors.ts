/**
 * Bundle J — School/LMS product connector truth summary.
 * Reuses existing academic + school-lms modules — not a new LMS stack.
 */

export type SchoolLmsProductTruth = {
  normalizedAcademicModel: true;
  providersSupported: string[];
  plannerDistinctFromOrchestrator: true;
  ownershipRequired: true;
  fabricatesLmsData: false;
  notes: string[];
};

export function schoolLmsProductTruthSummary(): SchoolLmsProductTruth {
  return {
    normalizedAcademicModel: true,
    providersSupported: [
      "canvas",
      "blackboard",
      "moodle",
      "google-classroom",
    ],
    plannerDistinctFromOrchestrator: true,
    ownershipRequired: true,
    fabricatesLmsData: false,
    notes: [
      "LMS data normalizes into AcademicItem — no provider-specific learning models.",
      "Sync failures preserve local academic items.",
      "Assignment completion ≠ concept mastery.",
    ],
  };
}
