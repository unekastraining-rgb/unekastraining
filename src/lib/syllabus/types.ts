export interface SyllabusAssignment {
  title: string;
  dueDate: string | null;
  description?: string | null;
}

export interface SyllabusMeeting {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string | null;
  title?: string | null;
}

export interface SyllabusExtraction {
  courseName: string;
  courseCode?: string | null;
  instructor: string | null;
  semester: string | null;
  assignments: SyllabusAssignment[];
  meetings?: SyllabusMeeting[];
}

export interface GeneratedTopic {
  name: string;
  description: string;
}

export interface SkillTrack {
  name: string;
  domain: "reading" | "math" | "writing" | "science" | "foundational" | "other";
  description: string;
  priority: "foundation" | "focus" | "stretch";
}

export interface LearnerProfile {
  studentName?: string | null;
  gradeLevel: string;
  subjects: string[];
  strengths?: string | null;
  struggles: string;
  goals?: string | null;
  parentNotes?: string | null;
}

/** A multi-week slice of the growth plan — no syllabus required. */
export interface PlanPhase {
  title: string;
  focus: string;
  weekNumber: number;
  priorityTracks: string[];
  stepIndices: number[];
}

export interface GradeSchoolLearningStep {
  title: string;
  skillFocus: string;
  skillTrack?: string | null;
  domain?: string | null;
  activityType: "warm-up" | "teach" | "practice" | "check" | "celebrate";
  durationMinutes: number;
  goal: string;
  steps: string[];
  tryItPrompt?: string | null;
  parentTip?: string | null;
}

export interface ReplanSnapshot {
  replannedAt: string;
  summary: string;
  completedStepCount: number;
  completedTracks: string[];
  parentNotes?: string | null;
}

export interface GeneratedCurriculum {
  courseName: string;
  gradeLevel: string;
  subject: string;
  subjects?: string[];
  focusTopic: string | null;
  strugglingWith?: string | null;
  learnerSummary?: string | null;
  learnerProfile?: LearnerProfile | null;
  summary: string;
  topics: GeneratedTopic[];
  skillTracks?: SkillTrack[];
  planPhases?: PlanPhase[];
  planVersion?: number;
  replanHistory?: ReplanSnapshot[];
  /** @deprecated Use learningSteps for grade school */
  assignments: SyllabusAssignment[];
  learningSteps: GradeSchoolLearningStep[];
  studyTips: string[];
}

export interface GenerateCurriculumRequest {
  gradeLevel: string;
  subject: string;
  subjects?: string[];
  focusTopic?: string | null;
  strugglingWith?: string | null;
  studentName?: string | null;
  strengths?: string | null;
  goals?: string | null;
  parentNotes?: string | null;
}

export interface SyllabusIngestResult {
  uploadId: string;
  fileName: string;
  extractedText: string;
  extraction: SyllabusExtraction;
  parser: "heuristic" | "ai" | "hybrid";
  aiAvailable: boolean;
}

export interface SaveCoursePayload {
  uploadId: string;
  fileName: string;
  extractedText: string;
  extraction: SyllabusExtraction;
}

export interface SaveGeneratedCoursePayload {
  curriculum: GeneratedCurriculum;
}
