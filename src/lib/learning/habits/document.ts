/**
 * Learning & Habits document stored on LearnerProfile.settingsJson.
 * Preferences, observations, hypotheses, and recommendations stay distinct.
 * Not a second Learner Model.
 */

export const LEARNING_HABITS_KEY = "learningHabits";
export const LEARNING_HABITS_VERSION = 1 as const;

export type GuidanceLevel = "simple" | "personalized" | "detailed";

export type HabitsSettings = {
  trackingEnabled: boolean;
  tutorPersonalization: boolean;
  habitCheckIns: boolean;
  reviewReminders: boolean;
};

export type OnboardingState = {
  skipped: boolean;
  completedAt: string | null;
  improve: string[];
  guidance: GuidanceLevel | null;
  approaches: string[];
  trackHabitsBeyond: boolean | null;
  tutorUsesOutcomes: boolean | null;
  wantsReviewReminders: boolean | null;
  notes: string;
};

export type QuestionnaireState = {
  answers: Record<string, string>;
  skippedIds: string[];
  updatedAt: string | null;
};

/** Self-reported learning experiences. Not observed performance. */
export type DiscoveryState = {
  selectedIds: string[];
  note: string;
  analyzedAt: string | null;
};

export type AssessmentStatus =
  | "not_started"
  | "in_progress"
  | "paused"
  | "completed";

/** Separate from whether the choice was correct. Missing text stays unknown. */
export type ReasoningQuality =
  | "unknown"
  | "sound"
  | "insufficient"
  | "contradictory"
  | "partial"
  | "misconception";

/** none = independent attempt. A hint is support, not a failure and not mastery. */
export type SupportLevel = "none" | "hint" | "worked-example";

/** What an attempt was built to observe. Absent when the task does not isolate a cause. */
export type DifficultyFocus =
  | "concept"
  | "sequence"
  | "structure"
  | "differentiation"
  | "coordination"
  | "precision"
  | "independence"
  | "transfer"
  | "retention";

/** Set only when recorded evidence supports a non-learner cause. */
export type InstructionalIssue =
  | "none"
  | "ambiguous-task"
  | "contradictory-explanation"
  | "tool-error"
  | "unresolved";

export type ExperimentAttempt = {
  id: string;
  templateId: string;
  factor: string;
  difficulty: number;
  presentation: string;
  response: string;
  correct: boolean | null;
  assisted: boolean;
  supportLevel: SupportLevel;
  explanation: string;
  reasoningQuality: ReasoningQuality;
  difficultyFocus: DifficultyFocus | null;
  instructionalIssue: InstructionalIssue;
  confidence: "low" | "medium" | "high" | null;
  at: string;
  /** Recognition vs independent recall vs application — unknown if skipped. */
  /** recognition is not independent production. */
  performanceKind: "recognition" | "recall" | "application" | "explanation" | "production" | "unknown";
};

export type AssessmentState = {
  status: AssessmentStatus;
  difficulty: number;
  results: ExperimentAttempt[];
};

export type ManagedExperimentStatus =
  | "suggested"
  | "active"
  | "paused"
  | "completed"
  | "canceled";

export type ManagedExperiment = {
  id: string;
  templateId: string;
  title: string;
  question: string;
  conceptLabel: string;
  approach: string;
  comparison: string | null;
  status: ManagedExperimentStatus;
  observations: number;
  userNote: string;
  limitation: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type HabitGoal = {
  id: string;
  title: string;
  frequencyPerWeek: number;
  paused: boolean;
  createdAt: string;
  completions: string[];
};

export type HabitCheckIn = {
  id: string;
  at: string;
  focusMinutes: number | null;
  environment: string;
  note: string;
};

export type ScheduledReview = {
  id: string;
  conceptLabel: string;
  dueAt: string;
  status: "scheduled" | "completed" | "skipped" | "unknown";
  outcome: "SUCCESS" | "PARTIAL" | "FAIL" | null;
  performanceKind: ExperimentAttempt["performanceKind"];
  completedAt: string | null;
  /** Session that scheduled the review. A later session is required before it counts. */
  originSessionId: string;
  /** True only after a qualifying later-session attempt. */
  countsAsDelayed: boolean;
};

export type LearningHabitsDocument = {
  version: typeof LEARNING_HABITS_VERSION;
  settings: HabitsSettings;
  onboarding: OnboardingState;
  questionnaire: QuestionnaireState;
  discovery: DiscoveryState;
  assessment: AssessmentState;
  experiments: ManagedExperiment[];
  habits: HabitGoal[];
  checkIns: HabitCheckIn[];
  reviews: ScheduledReview[];
  dismissedInsightIds: string[];
  dismissedRecommendationIds: string[];
  profileChallengeNote: string;
  /** ISO timestamps of recorded study touches from this feature (not fabricated history). */
  activityTouches: string[];
  /** Browser session boundary. Reload keeps it; a new visit can differ. */
  activeSessionId: string;
};

export function emptyLearningHabitsDocument(): LearningHabitsDocument {
  return {
    version: LEARNING_HABITS_VERSION,
    settings: {
      trackingEnabled: false,
      tutorPersonalization: false,
      habitCheckIns: false,
      reviewReminders: false,
    },
    onboarding: {
      skipped: false,
      completedAt: null,
      improve: [],
      guidance: null,
      approaches: [],
      trackHabitsBeyond: null,
      tutorUsesOutcomes: null,
      wantsReviewReminders: null,
      notes: "",
    },
    questionnaire: { answers: {}, skippedIds: [], updatedAt: null },
    discovery: { selectedIds: [], note: "", analyzedAt: null },
    assessment: { status: "not_started", difficulty: 1, results: [] },
    experiments: [],
    habits: [],
    checkIns: [],
    reviews: [],
    dismissedInsightIds: [],
    dismissedRecommendationIds: [],
    profileChallengeNote: "",
    activityTouches: [],
    activeSessionId: "",
  };
}

function normalizeAttempt(row: ExperimentAttempt): ExperimentAttempt {
  const supportLevel: SupportLevel =
    row.supportLevel === "hint" || row.supportLevel === "worked-example" || row.supportLevel === "none"
      ? row.supportLevel
      : row.assisted
        ? "hint"
        : "none";
  const reasoningQuality: ReasoningQuality =
    row.reasoningQuality === "sound" ||
    row.reasoningQuality === "insufficient" ||
    row.reasoningQuality === "contradictory" ||
    row.reasoningQuality === "partial" ||
    row.reasoningQuality === "misconception" ||
    row.reasoningQuality === "unknown"
      ? row.reasoningQuality
      : "unknown";
  const focuses: DifficultyFocus[] = [
    "concept",
    "sequence",
    "structure",
    "differentiation",
    "coordination",
    "precision",
    "independence",
    "transfer",
    "retention",
  ];
  const issues: InstructionalIssue[] = [
    "none",
    "ambiguous-task",
    "contradictory-explanation",
    "tool-error",
    "unresolved",
  ];
  return {
    ...row,
    explanation: row.explanation ?? "",
    assisted: supportLevel !== "none",
    supportLevel,
    reasoningQuality,
    difficultyFocus: focuses.includes(row.difficultyFocus as DifficultyFocus)
      ? row.difficultyFocus
      : null,
    instructionalIssue: issues.includes(row.instructionalIssue as InstructionalIssue)
      ? row.instructionalIssue
      : "none",
  };
}

function normalizeReview(row: ScheduledReview): ScheduledReview {
  const due = Date.parse(row.dueAt);
  const done = row.completedAt ? Date.parse(row.completedAt) : Number.NaN;
  const countsAsDelayed =
    typeof row.countsAsDelayed === "boolean"
      ? row.countsAsDelayed
      : row.status === "completed" && Number.isFinite(done) && done >= due;
  return {
    ...row,
    originSessionId: row.originSessionId ?? "",
    countsAsDelayed,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseLearningHabitsDocument(
  settingsJson: string | null | undefined,
): LearningHabitsDocument {
  const base = emptyLearningHabitsDocument();
  if (!settingsJson?.trim()) return base;
  try {
    const blob = JSON.parse(settingsJson) as unknown;
    if (!isRecord(blob)) return base;
    const raw = blob[LEARNING_HABITS_KEY];
    if (!isRecord(raw)) return base;
    return {
      ...base,
      ...raw,
      settings: { ...base.settings, ...(isRecord(raw.settings) ? raw.settings : {}) },
      onboarding: {
        ...base.onboarding,
        ...(isRecord(raw.onboarding) ? raw.onboarding : {}),
      },
      questionnaire: {
        ...base.questionnaire,
        ...(isRecord(raw.questionnaire) ? raw.questionnaire : {}),
        answers: isRecord(raw.questionnaire) && isRecord(raw.questionnaire.answers)
          ? (raw.questionnaire.answers as Record<string, string>)
          : {},
      },
      discovery: {
        selectedIds: Array.isArray(
          isRecord(raw.discovery) ? raw.discovery.selectedIds : null,
        )
          ? ((isRecord(raw.discovery) ? raw.discovery.selectedIds : []) as string[])
          : [],
        note:
          isRecord(raw.discovery) && typeof raw.discovery.note === "string"
            ? raw.discovery.note
            : "",
        analyzedAt:
          isRecord(raw.discovery) && typeof raw.discovery.analyzedAt === "string"
            ? raw.discovery.analyzedAt
            : null,
      },
      assessment: (() => {
        const assessment = isRecord(raw.assessment) ? raw.assessment : {};
        return {
          ...base.assessment,
          ...assessment,
          results: Array.isArray(assessment.results)
            ? (assessment.results as ExperimentAttempt[]).map(normalizeAttempt)
            : [],
        };
      })(),
      experiments: Array.isArray(raw.experiments)
        ? (raw.experiments as ManagedExperiment[])
        : [],
      habits: Array.isArray(raw.habits) ? (raw.habits as HabitGoal[]) : [],
      checkIns: Array.isArray(raw.checkIns) ? (raw.checkIns as HabitCheckIn[]) : [],
      reviews: Array.isArray(raw.reviews)
        ? (raw.reviews as ScheduledReview[]).map(normalizeReview)
        : [],
      dismissedInsightIds: Array.isArray(raw.dismissedInsightIds)
        ? (raw.dismissedInsightIds as string[])
        : [],
      dismissedRecommendationIds: Array.isArray(raw.dismissedRecommendationIds)
        ? (raw.dismissedRecommendationIds as string[])
        : [],
      activityTouches: Array.isArray(raw.activityTouches)
        ? (raw.activityTouches as string[])
        : [],
      profileChallengeNote:
        typeof raw.profileChallengeNote === "string"
          ? raw.profileChallengeNote
          : "",
      activeSessionId: typeof raw.activeSessionId === "string" ? raw.activeSessionId : "",
      version: LEARNING_HABITS_VERSION,
    } as LearningHabitsDocument;
  } catch {
    return base;
  }
}

export function writeLearningHabitsDocument(
  settingsJson: string | null | undefined,
  doc: LearningHabitsDocument,
): string {
  let blob: Record<string, unknown> = {};
  if (settingsJson?.trim()) {
    try {
      const parsed = JSON.parse(settingsJson) as unknown;
      if (isRecord(parsed)) blob = { ...parsed };
    } catch {
      blob = {};
    }
  }
  blob[LEARNING_HABITS_KEY] = doc;
  return JSON.stringify(blob);
}

export function stripLearningHabitsDocument(
  settingsJson: string | null | undefined,
): string {
  let blob: Record<string, unknown> = {};
  if (settingsJson?.trim()) {
    try {
      const parsed = JSON.parse(settingsJson) as unknown;
      if (isRecord(parsed)) blob = { ...parsed };
    } catch {
      blob = {};
    }
  }
  delete blob[LEARNING_HABITS_KEY];
  return JSON.stringify(blob);
}
