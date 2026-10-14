/**
 * Bundle J — Assessment product surfaces over existing assessment adapters.
 * Not a second mastery system — evidence feeds Learner State.
 */

export type AssessmentProductSurface = {
  id: string;
  label: string;
  evidenceFeedsLearnerModel: true;
  notes: string;
};

export function assessmentProductSurfaces(): AssessmentProductSurface[] {
  return [
    {
      id: "quiz",
      label: "Concept / mixed quizzes",
      evidenceFeedsLearnerModel: true,
      notes: "Uses existing quiz adapters and LAF evidence bridge.",
    },
    {
      id: "flashcard",
      label: "Flashcard / recall checks",
      evidenceFeedsLearnerModel: true,
      notes: "Connects to Lucky retention where configured.",
    },
    {
      id: "interactive-runtime",
      label: "In-studio interactive checks",
      evidenceFeedsLearnerModel: true,
      notes: "Bundle I/J Activity Runtime → LAF → Learner State.",
    },
    {
      id: "coding-sql",
      label: "Code / SQL application checks",
      evidenceFeedsLearnerModel: true,
      notes: "Subject-aware forms when KL supports them.",
    },
    {
      id: "writing",
      label: "Writing assessments via Haul",
      evidenceFeedsLearnerModel: true,
      notes: "Proposal UX preserved; original text never silently overwritten.",
    },
  ];
}
