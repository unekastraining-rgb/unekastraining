/**
 * Deterministic Learning & Habits engine.
 * AI does not calculate evidence, review status, or recommendations.
 */

import { nextReviewAtForOutcome } from "@/lib/learning/retention/schedule";

import { nextProbe, probeById, PROBES, QUESTIONNAIRE } from "./catalog";
import { buildDiagnosticReport } from "./diagnosis";
import { sanitizeExperienceIds } from "./discovery";
import {
  emptyLearningHabitsDocument,
  type ExperimentAttempt,
  type LearningHabitsDocument,
  type ManagedExperiment,
  type SupportLevel,
} from "./document";
import { classifyReasoning, recommendProgression } from "./progression";

export type HabitsAction =
  | { type: "save-settings"; settings: Partial<LearningHabitsDocument["settings"]> }
  | {
      type: "save-onboarding";
      onboarding: Partial<LearningHabitsDocument["onboarding"]>;
      complete?: boolean;
      skip?: boolean;
    }
  | { type: "answer-question"; id: string; value: string; skip?: boolean }
  | { type: "save-discovery"; selectedIds: string[]; note: string }
  | { type: "note-session"; sessionId: string }
  | { type: "start-assessment" }
  | { type: "pause-assessment" }
  | { type: "resume-assessment" }
  | {
      type: "submit-probe";
      probeId: string;
      choiceId: string;
      assisted?: boolean;
      supportLevel?: SupportLevel;
      explanation?: string;
      confidence?: ExperimentAttempt["confidence"];
      difficultyFocus?: ExperimentAttempt["difficultyFocus"];
      instructionalIssue?: ExperimentAttempt["instructionalIssue"];
    }
  | { type: "skip-probe"; probeId: string }
  | { type: "start-experiment"; templateId: string }
  | { type: "set-experiment-status"; id: string; status: ManagedExperiment["status"] }
  | { type: "note-experiment"; id: string; note: string }
  | {
      type: "create-habit";
      title: string;
      frequencyPerWeek: number;
    }
  | { type: "toggle-habit-pause"; id: string }
  | { type: "complete-habit"; id: string; at?: string }
  | { type: "delete-habit"; id: string }
  | {
      type: "check-in";
      focusMinutes?: number | null;
      environment?: string;
      note?: string;
    }
  | { type: "dismiss-insight"; id: string }
  | { type: "challenge-profile"; note: string }
  | { type: "dismiss-recommendation"; id: string }
  | {
      type: "complete-review";
      id: string;
      outcome: "SUCCESS" | "PARTIAL" | "FAIL";
      performanceKind: ExperimentAttempt["performanceKind"];
      sessionId?: string;
    }
  | { type: "skip-review"; id: string }
  | { type: "reset-insights" }
  | { type: "delete-feature-data" };

function id(prefix: string, now: Date): string {
  return `${prefix}-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const SUGGESTED: Array<Omit<ManagedExperiment, "id" | "status" | "observations" | "userNote" | "startedAt" | "completedAt">> = [
  {
    templateId: "chunk-vs-dense",
    title: "Chunked vs dense explanations",
    question: "Do smaller steps change accuracy on comparable questions?",
    conceptLabel: "Ordered lists",
    approach: "chunked",
    comparison: "dense",
    limitation: "A few items cannot prove a general learning style.",
  },
  {
    templateId: "worked-vs-independent",
    title: "Worked example vs independent try",
    question: "Does a worked example help the next new problem?",
    conceptLabel: "Applying a known rule",
    approach: "worked-example",
    comparison: "independent",
    limitation: "Experience and accuracy are recorded separately.",
  },
  {
    templateId: "delayed-review",
    title: "Immediate practice vs delayed recall",
    question: "Can you recall the rule after a delay?",
    conceptLabel: "Recent concept",
    approach: "delayed-recall",
    comparison: "immediate",
    limitation: "A skipped review stays unknown, not failed.",
  },
];

function touch(doc: LearningHabitsDocument, now: Date): LearningHabitsDocument {
  if (!doc.settings.trackingEnabled) return doc;
  return { ...doc, activityTouches: [...doc.activityTouches, now.toISOString()].slice(-200) };
}

function scheduleAfterProbe(
  doc: LearningHabitsDocument,
  conceptLabel: string,
  now: Date,
): LearningHabitsDocument {
  if (!doc.settings.reviewReminders || !conceptLabel.trim()) return doc;
  if (doc.reviews.some((row) => row.conceptLabel === conceptLabel && row.status === "scheduled")) {
    return doc;
  }
  const due = nextReviewAtForOutcome("SUCCESS", now, { priorSuccessStreak: 0 });
  // First success in the retention helper is 3 days; assessment also wants a ~1 day check.
  const oneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dueAt = oneDay.getTime() < due.getTime() ? oneDay : due;
  return {
    ...doc,
    reviews: [
      ...doc.reviews,
      {
        id: id("review", now),
        conceptLabel,
        dueAt: dueAt.toISOString(),
        status: "scheduled",
        outcome: null,
        performanceKind: "unknown",
        completedAt: null,
        originSessionId: doc.activeSessionId || "session-unspecified",
        countsAsDelayed: false,
      },
    ],
  };
}

function reviewIsLaterSession(doc: LearningHabitsDocument, originSessionId: string, now: Date, dueAt: string, sessionId?: string): boolean {
  const session = sessionId || doc.activeSessionId;
  const later = Boolean(originSessionId) && session !== originSessionId;
  return later && Date.parse(dueAt) <= now.getTime();
}

export function reduceLearningHabits(
  doc: LearningHabitsDocument,
  action: HabitsAction,
  now: Date = new Date(),
): LearningHabitsDocument {
  switch (action.type) {
    case "note-session": {
      const sessionId = action.sessionId.trim().slice(0, 80);
      if (!sessionId) return doc;
      return { ...doc, activeSessionId: sessionId };
    }
    case "save-settings":
      return { ...doc, settings: { ...doc.settings, ...action.settings } };
    case "save-onboarding": {
      const onboarding = { ...doc.onboarding, ...action.onboarding };
      if (action.skip) {
        onboarding.skipped = true;
        onboarding.completedAt = now.toISOString();
      }
      if (action.complete) onboarding.completedAt = now.toISOString();
      let settings = doc.settings;
      if (action.onboarding.tutorUsesOutcomes === true) {
        settings = { ...settings, tutorPersonalization: true };
      }
      if (action.onboarding.wantsReviewReminders === true) {
        settings = { ...settings, reviewReminders: true };
      }
      if (action.onboarding.trackHabitsBeyond === true) {
        settings = { ...settings, habitCheckIns: true, trackingEnabled: true };
      }
      if (action.complete || action.skip) {
        settings = { ...settings, trackingEnabled: settings.trackingEnabled || !action.skip };
      }
      return touch({ ...doc, onboarding, settings }, now);
    }
    case "save-discovery": {
      const selectedIds = sanitizeExperienceIds(action.selectedIds);
      const note = action.note.trim().slice(0, 500);
      return touch(
        {
          ...doc,
          settings: { ...doc.settings, trackingEnabled: true },
          onboarding: {
            ...doc.onboarding,
            notes: note || doc.onboarding.notes,
            completedAt: doc.onboarding.completedAt ?? now.toISOString(),
          },
          discovery: {
            selectedIds,
            note,
            analyzedAt: now.toISOString(),
          },
        },
        now,
      );
    }
    case "answer-question": {
      const questionnaire = { ...doc.questionnaire, updatedAt: now.toISOString() };
      if (action.skip) {
        questionnaire.skippedIds = [...new Set([...questionnaire.skippedIds, action.id])];
      } else {
        questionnaire.answers = { ...questionnaire.answers, [action.id]: action.value };
        questionnaire.skippedIds = questionnaire.skippedIds.filter((id) => id !== action.id);
      }
      return touch({ ...doc, questionnaire }, now);
    }
    case "start-assessment":
      return touch(
        {
          ...doc,
          settings: { ...doc.settings, trackingEnabled: true },
          assessment: { ...doc.assessment, status: "in_progress" },
        },
        now,
      );
    case "pause-assessment":
      return {
        ...doc,
        assessment: {
          ...doc.assessment,
          status: doc.assessment.status === "not_started" ? "not_started" : "paused",
        },
      };
    case "resume-assessment":
      return {
        ...doc,
        assessment: { ...doc.assessment, status: "in_progress" },
      };
    case "skip-probe": {
      if (doc.assessment.results.some((row) => row.templateId === action.probeId)) return doc;
      const attempt: ExperimentAttempt = {
        id: id("attempt", now),
        templateId: action.probeId,
        factor: probeById(action.probeId)?.factor ?? "unknown",
        difficulty: probeById(action.probeId)?.difficulty ?? doc.assessment.difficulty,
        presentation: probeById(action.probeId)?.presentation ?? "skipped",
        response: "",
        correct: null,
        assisted: false,
        supportLevel: "none",
        explanation: "",
        reasoningQuality: "unknown",
        difficultyFocus: probeById(action.probeId)?.difficultyFocus ?? null,
        instructionalIssue: "none",
        confidence: null,
        at: now.toISOString(),
        performanceKind: "unknown",
      };
      return touch(
        {
          ...doc,
          assessment: {
            ...doc.assessment,
            status: "in_progress",
            results: [...doc.assessment.results, attempt],
          },
        },
        now,
      );
    }
    case "submit-probe": {
      const probe = probeById(action.probeId);
      if (!probe) return doc;
      if (doc.assessment.results.some((row) => row.templateId === probe.id)) return doc;
      const correct =
        action.choiceId === "unknown" ? null : action.choiceId === probe.correctChoiceId;
      const requestedSupport: SupportLevel =
        action.supportLevel === "hint" || action.supportLevel === "worked-example"
          ? action.supportLevel
          : action.assisted
            ? "hint"
            : "none";
      const supportLevel: SupportLevel = probe.hint || probe.workedExample ? requestedSupport : "none";
      const explanation = (action.explanation ?? "").slice(0, 500);
      const attempt: ExperimentAttempt = {
        id: id("attempt", now),
        templateId: probe.id,
        factor: probe.factor,
        difficulty: probe.difficulty,
        presentation: probe.presentation,
        response: action.choiceId,
        correct,
        assisted: supportLevel !== "none",
        supportLevel,
        explanation,
        reasoningQuality: classifyReasoning({
          explanation,
          correct,
          soundPhrases: probe.soundPhrases,
          unsoundPhrases: probe.unsoundPhrases,
        }),
        difficultyFocus: action.difficultyFocus ?? probe.difficultyFocus,
        instructionalIssue: action.instructionalIssue ?? "none",
        confidence: action.confidence ?? null,
        at: now.toISOString(),
        performanceKind: correct === null ? "unknown" : probe.performanceKind,
      };
      const results = [...doc.assessment.results, attempt];
      const submittedLab = PROBES.some((p) => p.id === probe.id);
      const recent = results
        .filter((r) => r.correct !== null && PROBES.some((p) => p.id === r.templateId))
        .slice(-2);
      let difficulty = doc.assessment.difficulty;
      if (submittedLab && recent.length === 2 && recent.every((r) => r.correct)) {
        difficulty = Math.min(3, difficulty + 1);
      }
      const done = PROBES.every((p) => results.some((r) => r.templateId === p.id));
      let next: LearningHabitsDocument = {
        ...doc,
        assessment: {
          status: done ? "completed" : submittedLab ? "in_progress" : doc.assessment.status,
          difficulty,
          results,
        },
      };
      if (correct === true) {
        next = scheduleAfterProbe(next, probe.conceptLabel, now);
      }
      return touch(next, now);
    }
    case "start-experiment": {
      const template = SUGGESTED.find((s) => s.templateId === action.templateId);
      if (!template) return doc;
      if (doc.experiments.some((e) => e.templateId === template.templateId && e.status === "active")) {
        return doc;
      }
      const experiment: ManagedExperiment = {
        ...template,
        id: id("exp", now),
        status: "active",
        observations: 0,
        userNote: "",
        startedAt: now.toISOString(),
        completedAt: null,
      };
      return touch({ ...doc, experiments: [...doc.experiments, experiment] }, now);
    }
    case "set-experiment-status":
      return {
        ...doc,
        experiments: doc.experiments.map((e) =>
          e.id === action.id
            ? {
                ...e,
                status: action.status,
                completedAt:
                  action.status === "completed" ? now.toISOString() : e.completedAt,
              }
            : e,
        ),
      };
    case "note-experiment":
      return {
        ...doc,
        experiments: doc.experiments.map((e) =>
          e.id === action.id ? { ...e, userNote: action.note.slice(0, 500), observations: e.observations + 1 } : e,
        ),
      };
    case "create-habit": {
      const title = action.title.trim().slice(0, 120);
      if (!title) return doc;
      return touch(
        {
          ...doc,
          settings: { ...doc.settings, trackingEnabled: true },
          habits: [
            ...doc.habits,
            {
              id: id("habit", now),
              title,
              frequencyPerWeek: Math.min(7, Math.max(1, action.frequencyPerWeek || 3)),
              paused: false,
              createdAt: now.toISOString(),
              completions: [],
            },
          ],
        },
        now,
      );
    }
    case "toggle-habit-pause":
      return {
        ...doc,
        habits: doc.habits.map((h) =>
          h.id === action.id ? { ...h, paused: !h.paused } : h,
        ),
      };
    case "complete-habit":
      return {
        ...doc,
        habits: doc.habits.map((h) =>
          h.id === action.id
            ? { ...h, completions: [...h.completions, action.at ?? now.toISOString()].slice(-60) }
            : h,
        ),
      };
    case "delete-habit":
      return { ...doc, habits: doc.habits.filter((h) => h.id !== action.id) };
    case "check-in":
      if (!doc.settings.habitCheckIns) return doc;
      return {
        ...doc,
        checkIns: [
          ...doc.checkIns,
          {
            id: id("check", now),
            at: now.toISOString(),
            focusMinutes:
              typeof action.focusMinutes === "number" ? action.focusMinutes : null,
            environment: (action.environment ?? "").slice(0, 80),
            note: (action.note ?? "").slice(0, 240),
          },
        ].slice(-40),
      };
    case "dismiss-insight":
      return {
        ...doc,
        dismissedInsightIds: [...new Set([...doc.dismissedInsightIds, action.id])],
      };
    case "challenge-profile":
      return { ...doc, profileChallengeNote: action.note.slice(0, 500) };
    case "dismiss-recommendation":
      return {
        ...doc,
        dismissedRecommendationIds: [
          ...new Set([...doc.dismissedRecommendationIds, action.id]),
        ],
      };
    case "complete-review": {
      const current = doc.reviews.find((r) => r.id === action.id);
      if (!current || current.status !== "scheduled") return doc;
      if (!reviewIsLaterSession(doc, current.originSessionId, now, current.dueAt, action.sessionId)) {
        return doc;
      }
      const priorSuccess = doc.reviews.filter(
        (r) => r.conceptLabel === current.conceptLabel && r.outcome === "SUCCESS",
      ).length;
      const nextDue = nextReviewAtForOutcome(action.outcome, now, {
        priorSuccessStreak: action.outcome === "SUCCESS" ? priorSuccess : 0,
      });
      return {
        ...doc,
        reviews: doc.reviews.map((r) =>
          r.id === action.id
            ? {
                ...r,
                status: "completed" as const,
                outcome: action.outcome,
                performanceKind: action.performanceKind,
                completedAt: now.toISOString(),
                countsAsDelayed: true,
              }
            : r,
        ).concat({
          id: id("review", now),
          conceptLabel: current.conceptLabel,
          dueAt: nextDue.toISOString(),
          status: "scheduled" as const,
          outcome: null,
          performanceKind: "unknown" as const,
          completedAt: null,
          originSessionId: action.sessionId || doc.activeSessionId || current.originSessionId,
          countsAsDelayed: false,
        }),
      };
    }
    case "skip-review": {
      const current = doc.reviews.find((r) => r.id === action.id);
      if (!current || current.status !== "scheduled") return doc;
      if (!reviewIsLaterSession(doc, current.originSessionId, now, current.dueAt)) return doc;
      return {
        ...doc,
        reviews: doc.reviews.map((r) =>
          r.id === action.id
            ? {
                ...r,
                status: "skipped",
                outcome: null,
                performanceKind: "unknown",
                completedAt: now.toISOString(),
                countsAsDelayed: false,
              }
            : r,
        ),
      };
    }
    case "reset-insights":
      return {
        ...doc,
        dismissedInsightIds: [],
        dismissedRecommendationIds: [],
        profileChallengeNote: "",
      };
    case "delete-feature-data":
      return emptyLearningHabitsDocument();
    default:
      return doc;
  }
}

export type Insight = {
  id: string;
  text: string;
  evidenceCount: number;
  confidence: "preliminary" | "mixed" | "consistent";
  unknown: string;
  nextHref: string;
  nextLabel: string;
};

export function deriveInsights(doc: LearningHabitsDocument): Insight[] {
  const scored = doc.assessment.results.filter((r) => r.correct !== null);
  const insights: Insight[] = [];

  const reportedChunks = doc.questionnaire.answers["load-chunks"];
  if (reportedChunks) {
    insights.push({
      id: "reported-chunks",
      text: `You reported that smaller steps are ${reportedChunks === "yes" ? "easier" : reportedChunks === "no" ? "not especially easier" : "sometimes easier"}. This is a preference, not a measured result.`,
      evidenceCount: 1,
      confidence: "preliminary",
      unknown: "Practical probes may or may not match this report.",
      nextHref: "/study/learning-habits?section=lab",
      nextLabel: "Compare with a probe",
    });
  }

  const chunked = scored.filter((r) => r.factor === "chunking" && r.presentation === "chunked");
  const dense = scored.filter((r) => r.factor === "chunking" && r.presentation === "dense");
  if (chunked.length && dense.length) {
    const cOk = chunked.filter((r) => r.correct).length;
    const dOk = dense.filter((r) => r.correct).length;
    const mixed = cOk === dOk;
    insights.push({
      id: "observed-chunking",
      text: mixed
        ? "We observed similar accuracy on the dense and chunked versions of the same list rule. The evidence is mixed, so chunking is not assumed to be better."
        : `Your results suggest the ${cOk > dOk ? "chunked" : "dense"} presentation matched a higher score on this pair. That is one comparison, not a permanent style.`,
      evidenceCount: chunked.length + dense.length,
      confidence: mixed ? "mixed" : "preliminary",
      unknown: "We have not shown this pattern across subjects.",
      nextHref: "/study/six/chunking",
      nextLabel: "Open chunking practice",
    });
  }

  const novel = scored.filter((r) => r.presentation === "novel");
  const familiar = scored.filter((r) => r.presentation === "familiar");
  if (familiar.some((r) => r.correct) && novel.some((r) => r.correct === false)) {
    insights.push({
      id: "transfer-gap",
      text: "We observed a correct familiar application and a miss on a new scenario. Your results suggest transfer is not yet secure. This is not a claim that you cannot transfer in other subjects.",
      evidenceCount: familiar.length + novel.length,
      confidence: "preliminary",
      unknown: "A single transfer miss is not a stable pattern.",
      nextHref: "/study/practice-hub",
      nextLabel: "Practice a new problem",
    });
  }

  const skippedReviews = doc.reviews.filter((r) => r.status === "skipped").length;
  if (skippedReviews > 0) {
    insights.push({
      id: "retention-unknown",
      text: "A skipped review means retention is unknown, not failed.",
      evidenceCount: skippedReviews,
      confidence: "preliminary",
      unknown: "Delayed recall has not been measured for those items.",
      nextHref: "/study/lucky",
      nextLabel: "Open Lucky",
    });
  }

  return insights.filter((i) => !doc.dismissedInsightIds.includes(i.id));
}

export type Recommendation = {
  id: string;
  title: string;
  reason: string;
  href: string;
  label: string;
  confidence: string;
};

export function deriveRecommendations(doc: LearningHabitsDocument): Recommendation[] {
  const recs: Recommendation[] = [];
  const progression = recommendProgression(doc);
  recs.push({
    id: "progression",
    title: progression.title,
    reason: progression.reason,
    href: progression.href,
    label: progression.label,
    confidence: progression.confidence,
  });
  if (!doc.onboarding.completedAt && !doc.onboarding.skipped) {
    recs.push({
      id: "start-onboarding",
      title: "Explore how you learn",
      reason: "Onboarding is optional and only asks for information we do not already have.",
      href: "/study/learning-habits?section=discover",
      label: "Start",
      confidence: "No observations yet.",
    });
  }
  if (doc.assessment.status !== "completed" && doc.settings.trackingEnabled) {
    recs.push({
      id: "continue-assessment",
      title: "Continue a short learning probe",
      reason: "Self-report and a practical check stay separate until both exist.",
      href: "/study/learning-habits?section=lab",
      label: "Open assessment",
      confidence:
        doc.assessment.results.length < 2
          ? "Not enough observations for a conclusion."
          : "Preliminary.",
    });
  }
  const due = doc.reviews.find((r) => r.status === "scheduled");
  if (due) {
    const open = reviewIsLaterSession(doc, due.originSessionId, new Date(), due.dueAt);
    recs.push({
      id: `review-${due.id}`,
      title: open ? "A later review is ready" : "Delayed retention is not measured yet",
      reason: open
        ? `Recall “${due.conceptLabel}” before revealing the answer. A skip stays unknown.`
        : "A review is waiting for a later session. Waiting is not a miss.",
      href: "/study/learning-habits?section=results",
      label: open ? "Review" : "Pending",
      confidence: "Not proven retention.",
    });
  }
  if (doc.habits.some((h) => !h.paused)) {
    recs.push({
      id: "habit-session",
      title: "Keep a study goal you already set",
      reason: "Progress uses completions you record or study this feature already logged. Missing a day does not reset other work.",
      href: "/planner",
      label: "Open Planner",
      confidence: "A goal is not evidence of learning.",
    });
  }
  recs.push({
    id: "six-match",
    title: "Try one teaching approach",
    reason: "Six can chunk, explain, visualize, practice, or recall. It does not assign a permanent style.",
    href: "/study/six",
    label: "Open Six",
    confidence: "Suggestion, not a measured winner.",
  });
  return recs.filter((r) => !doc.dismissedRecommendationIds.includes(r.id)).slice(0, 4);
}

export function analyticsSummary(doc: LearningHabitsDocument) {
  const scored = doc.assessment.results.filter((r) => r.correct !== null);
  const correct = scored.filter((r) => r.correct).length;
  const assisted = doc.assessment.results.filter((r) => r.assisted).length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return {
    recordedProbes: doc.assessment.results.length,
    scoredProbes: scored.length,
    correct,
    accuracy: scored.length ? correct / scored.length : null,
    assisted,
    independent: scored.filter((r) => !r.assisted).length,
    habitGoals: doc.habits.filter((h) => !h.paused).length,
    completionsThisWeek: doc.habits.reduce(
      (n, h) => n + h.completions.filter((c) => Date.parse(c) >= weekAgo).length,
      0,
    ),
    reviewsCompleted: doc.reviews.filter((r) => r.status === "completed").length,
    reviewsUnknown: doc.reviews.filter((r) => r.status === "skipped" || r.status === "unknown").length,
    activeExperiments: doc.experiments.filter((e) => e.status === "active").length,
    questionnaireAnswered: Object.keys(doc.questionnaire.answers).length,
    questionnaireTotal: QUESTIONNAIRE.length,
  };
}

export function tutorPersonalizationBlock(doc: LearningHabitsDocument): string {
  if (!doc.settings.tutorPersonalization) return "";
  const lines = [
    "LEARNING & HABITS CONTEXT (optional personalization — not mastery, not a learning style label):",
  ];
  if (doc.onboarding.improve.length) {
    lines.push(`Learner-reported goals: ${doc.onboarding.improve.join(", ")}.`);
  }
  if (doc.onboarding.approaches.length) {
    lines.push(
      `Approaches the learner asked to try: ${doc.onboarding.approaches.join(", ")}. Honor an explicit request in this conversation over these defaults.`,
    );
  }
  const insights = deriveInsights(doc).slice(0, 2);
  for (const insight of insights) {
    lines.push(`Preliminary observation: ${insight.text}`);
  }
  const progression = recommendProgression(doc);
  lines.push(
    `Next activity suggestion (not mastery): ${progression.title}. ${progression.reason}`,
  );
  if (doc.settings.trackingEnabled) {
    const report = buildDiagnosticReport(doc);
    if (report?.suggests) {
      lines.push(`Working diagnosis, provisional: ${report.suggests}`);
    }
  }
  if (doc.discovery.selectedIds.length) {
    lines.push(
      `Learner-reported experiences (not measured performance): ${doc.discovery.selectedIds.join(", ")}.`,
    );
  }
  if (doc.discovery.note.trim()) {
    lines.push(`Learner note: ${doc.discovery.note.trim()}`);
  }
  if (doc.profileChallengeNote.trim()) {
    lines.push(`Learner challenge: ${doc.profileChallengeNote.trim()}`);
  }
  lines.push(
    "If evidence is thin, say so. Do not claim a method definitely works. Do not invent history.",
  );
  return lines.join("\n");
}

export function suggestedExperiments(): typeof SUGGESTED {
  return SUGGESTED;
}

export function currentProbe(doc: LearningHabitsDocument) {
  return nextProbe({
    completedIds: doc.assessment.results.map((r) => r.templateId),
    difficulty: doc.assessment.difficulty,
  });
}
