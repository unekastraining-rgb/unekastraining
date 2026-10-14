/**
 * 2G-78 — Study Haul learning entry-point classification.
 *
 * Makes Adaptive vs Direct vs Content/Management distinctions explicit.
 * Does not start runs, write evidence, or replace navigation.
 *
 * Preserve → Connect → Upgrade → Extend
 */

/** How a Study Haul surface relates to the Universal Learning Engine. */
export type StudyHaulEntryKind =
  | "ADAPTIVE_LEARNING"
  | "DIRECT_ACTIVITY"
  | "CONTENT_MANAGEMENT";

export type StudyHaulEntryPointId =
  | "hub_orchestrator_adaptive_cta"
  | "hub_orchestrator_direct_six"
  | "hub_orchestrator_activity_open"
  | "core_continue_learning"
  | "study_now_continue_learning"
  | "assignments_practice_activities"
  | "assignments_learner_model"
  | "assignments_list"
  | "quiz_open_known"
  | "assessment_workflow"
  | "flashcard_review"
  | "six_direct_technique"
  | "adaptive_run_shell"
  | "activity_workspace_standalone"
  | "lucky_retention"
  | "study_hub_nav"
  | "locker_study_tools";

export type StudyHaulEntryPointRecord = {
  id: StudyHaulEntryPointId;
  kind: StudyHaulEntryKind;
  surface: string;
  /** Canonical Adaptive start when kind is ADAPTIVE_LEARNING (if applicable). */
  adaptiveStart?: "POST /api/study/adaptive/start" | "resume_href";
  notes: string;
};

/**
 * Inventory of known Study Haul learning-related entry points.
 * Classification is product-behavior based — not every click is Adaptive.
 */
export const STUDY_HAUL_ENTRY_POINTS: readonly StudyHaulEntryPointRecord[] = [
  {
    id: "hub_orchestrator_adaptive_cta",
    kind: "ADAPTIVE_LEARNING",
    surface: "OrchestratorSuggestionCard primary CTA",
    adaptiveStart: "POST /api/study/adaptive/start",
    notes: "Start/Continue learning for owned conceptId (Adaptive).",
  },
  {
    id: "hub_orchestrator_direct_six",
    kind: "DIRECT_ACTIVITY",
    surface: "OrchestratorSuggestionCard secondary Try it",
    notes: "Direct SIX deep link — preserved; not a second Adaptive engine.",
  },
  {
    id: "hub_orchestrator_activity_open",
    kind: "DIRECT_ACTIVITY",
    surface: "Hub activityIntervention Open link",
    notes:
      "Optional direct practice without Adaptive run context. Primary Adaptive CTA remains separate.",
  },
  {
    id: "core_continue_learning",
    kind: "ADAPTIVE_LEARNING",
    surface: "CoreKnowledgeBridgePanel Continue learning",
    adaptiveStart: "POST /api/study/adaptive/start",
    notes: "CORE Knowledge → Adaptive when focus concept exists.",
  },
  {
    id: "study_now_continue_learning",
    kind: "ADAPTIVE_LEARNING",
    surface: "StudySessionRunner ContinueLearningButton",
    adaptiveStart: "POST /api/study/adaptive/start",
    notes: "Only when Topic.conceptId exists; planner otherwise unchanged.",
  },
  {
    id: "assignments_practice_activities",
    kind: "DIRECT_ACTIVITY",
    surface: "AssignmentsTab Practice activities",
    notes:
      "Catalog shortcut to /study/activities/coding — not concept Adaptive entry.",
  },
  {
    id: "assignments_learner_model",
    kind: "CONTENT_MANAGEMENT",
    surface: "AssignmentsTab View concept learning progress",
    notes: "Opens learner-model visibility — not Adaptive start.",
  },
  {
    id: "assignments_list",
    kind: "CONTENT_MANAGEMENT",
    surface: "HubAssignmentsPanel",
    notes: "Due work management — remains direct.",
  },
  {
    id: "quiz_open_known",
    kind: "DIRECT_ACTIVITY",
    surface: "Quiz open / QuizTaker",
    notes: "Known Quiz remains direct; Adaptive Quiz only via quiz adapter step.",
  },
  {
    id: "assessment_workflow",
    kind: "ADAPTIVE_LEARNING",
    surface: "Assessment workflow (ASSESS intent)",
    notes: "Explicit ASSESS → Assessment handoff — not generic activity open.",
  },
  {
    id: "flashcard_review",
    kind: "DIRECT_ACTIVITY",
    surface: "Flashcard review",
    notes: "Normal review remains direct; Adaptive Flashcard via adapter only.",
  },
  {
    id: "six_direct_technique",
    kind: "DIRECT_ACTIVITY",
    surface: "/study/six/[component]",
    notes: "Learner may open any SIX technique directly.",
  },
  {
    id: "adaptive_run_shell",
    kind: "ADAPTIVE_LEARNING",
    surface: "/study/adaptive/[runId]",
    adaptiveStart: "resume_href",
    notes: "Closed-loop run shell; launches activities with adaptive context.",
  },
  {
    id: "activity_workspace_standalone",
    kind: "DIRECT_ACTIVITY",
    surface: "/study/activities/[kind]",
    notes: "Standalone practice; Adaptive when query carries adaptiveRunId.",
  },
  {
    id: "lucky_retention",
    kind: "CONTENT_MANAGEMENT",
    surface: "LUCKY / retention",
    notes: "Retention engine — downstream of Adaptive complete, not an Adaptive start.",
  },
  {
    id: "study_hub_nav",
    kind: "CONTENT_MANAGEMENT",
    surface: "Hub Study nav / Study Now cards",
    notes: "Planning and navigation surfaces.",
  },
  {
    id: "locker_study_tools",
    kind: "DIRECT_ACTIVITY",
    surface: "LockerTab flashcards/tools",
    notes: "Opens known study tools directly.",
  },
] as const;

export function listStudyHaulEntryPoints(): readonly StudyHaulEntryPointRecord[] {
  return STUDY_HAUL_ENTRY_POINTS;
}

export function getStudyHaulEntryPoint(
  id: StudyHaulEntryPointId,
): StudyHaulEntryPointRecord | null {
  return STUDY_HAUL_ENTRY_POINTS.find((e) => e.id === id) ?? null;
}

export function listEntryPointsByKind(
  kind: StudyHaulEntryKind,
): StudyHaulEntryPointRecord[] {
  return STUDY_HAUL_ENTRY_POINTS.filter((e) => e.kind === kind);
}

/** Canonical Adaptive start HTTP path — all Adaptive Learning Entries converge here. */
export const CANONICAL_ADAPTIVE_START_PATH =
  "/api/study/adaptive/start" as const;

/**
 * Classify a Hub / CORE / Study Now Adaptive CTA shape.
 * Does not invent conceptId or start a run.
 */
export function classifyAdaptiveLearningEntry(input: {
  conceptId?: string | null;
  activeRunId?: string | null;
}): StudyHaulEntryKind | "none" {
  const runId =
    typeof input.activeRunId === "string" ? input.activeRunId.trim() : "";
  if (runId) return "ADAPTIVE_LEARNING";
  const conceptId =
    typeof input.conceptId === "string" ? input.conceptId.trim() : "";
  if (conceptId) return "ADAPTIVE_LEARNING";
  return "none";
}

export function entryPointIntegrityTruthSummary(): {
  everyClickIsAdaptive: false;
  preservesDirectQuiz: true;
  preservesDirectFlashcard: true;
  preservesDirectSix: true;
  preservesCoreIndependence: true;
  preservesStudyNowPlanner: true;
  preservesAssignmentsManagement: true;
  hubActivityOpenIsDirect: true;
  assignmentsPracticeActivitiesIsDirect: true;
  canonicalAdaptiveStartOnly: true;
  inventsConceptsFromTitles: false;
  clientLearnerIdTrusted: false;
} {
  return {
    everyClickIsAdaptive: false,
    preservesDirectQuiz: true,
    preservesDirectFlashcard: true,
    preservesDirectSix: true,
    preservesCoreIndependence: true,
    preservesStudyNowPlanner: true,
    preservesAssignmentsManagement: true,
    hubActivityOpenIsDirect: true,
    assignmentsPracticeActivitiesIsDirect: true,
    canonicalAdaptiveStartOnly: true,
    inventsConceptsFromTitles: false,
    clientLearnerIdTrusted: false,
  };
}
