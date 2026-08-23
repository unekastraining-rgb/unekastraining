import type { GradeSchoolLearningStep, GeneratedCurriculum } from "@/lib/syllabus/types";

export function parseCurriculumFromMaterial(
  extractedText: string | null | undefined,
): GeneratedCurriculum | null {
  if (!extractedText?.trim()) return null;
  try {
    const parsed = JSON.parse(extractedText) as GeneratedCurriculum;
    if (!parsed.courseName || !Array.isArray(parsed.topics)) return null;
    return {
      ...parsed,
      subjects: parsed.subjects ?? [],
      skillTracks: parsed.skillTracks ?? [],
      planPhases: parsed.planPhases ?? [],
      learnerProfile: parsed.learnerProfile ?? null,
      planVersion: parsed.planVersion ?? 1,
      replanHistory: parsed.replanHistory ?? [],
      learningSteps: parsed.learningSteps ?? [],
      assignments: parsed.assignments ?? [],
      studyTips: parsed.studyTips ?? [],
    };
  } catch {
    return null;
  }
}

export function learningStepHref(courseId: string, stepIndex: number) {
  return `/study/grade-school?courseId=${encodeURIComponent(courseId)}&step=${stepIndex}`;
}

export const ACTIVITY_LABELS: Record<GradeSchoolLearningStep["activityType"], string> = {
  "warm-up": "Warm-up",
  teach: "Learn together",
  practice: "Practice",
  check: "Quick check",
  celebrate: "Celebrate",
};

export const ACTIVITY_EMOJI: Record<GradeSchoolLearningStep["activityType"], string> = {
  "warm-up": "🌟",
  teach: "📚",
  practice: "✏️",
  check: "✅",
  celebrate: "🎉",
};
