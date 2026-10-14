/**
 * Phase 2G-9 — Read-only Adaptive Sequence run page model.
 * Loads persisted run state + optional SIX/Quiz/Flashcard/Activity link. No mutations.
 * Phase 2G-69 — optional learner-state / why-this-step from Orchestrator
 * (ConceptMastery presentation only; display creates no evidence).
 * Phase 2G-73 — Universal Activity Adaptive steps.
 */
import { db } from "@/lib/db";
import { orchestrateForConcept } from "@/lib/learning/orchestrator";
import {
  buildAdaptiveLearnerStateVisibility,
  type AdaptiveLearnerStateVisibility,
} from "@/lib/learning/sequence/adaptive-learner-state";
import {
  resumeAdaptiveSequenceRun,
  type ResumeAdaptiveSequenceResult,
} from "@/lib/learning/sequence/coordinator";
import {
  resolveSixSequenceStep,
  SixAdapterError,
  type ResolvedSixSequenceActivity,
} from "@/lib/learning/sequence/six-adapter";
import {
  isSupportedQuizIntervention,
  resolveOwnedQuizSequenceStep,
  QuizAdapterError,
} from "@/lib/learning/sequence/quiz-adapter";
import {
  isSupportedFlashcardIntervention,
  resolveOwnedFlashcardSequenceStep,
  FlashcardAdapterError,
} from "@/lib/learning/sequence/flashcard-adapter";
import {
  isSupportedUniversalActivityIntervention,
  resolveOwnedUniversalActivitySequenceStep,
  ActivityAdapterError,
} from "@/lib/learning/sequence/activity-adapter";
import {
  presentMaterialSourceCitation,
  resolveLearningMaterialContext,
  withMaterialIdQuery,
  type LearningMaterialContext,
  type MaterialSourceCitationView,
} from "@/lib/learning/material-context";

export type { AdaptiveLearnerStateVisibility };

export type AdaptiveRunPageView =
  | {
      kind: "active";
      runId: string;
      conceptTitle: string;
      stepNumber: number;
      totalSteps: number;
      intervention: string;
      activityTitle: string | null;
      activityDescription: string | null;
      sixHref: string | null;
      awaitingNext: boolean;
      sixUnavailableReason: string | null;
      stopNotice: string | null;
      /** Phase 2G-69 — display-only; never client-supplied. */
      learnerState?: AdaptiveLearnerStateVisibility | null;
      /** 2P-28 — optional material source context (display only). */
      materialContext?: LearningMaterialContext | null;
      materialCitation?: MaterialSourceCitationView | null;
    }
  | {
      kind: "completed";
      runId: string;
      conceptTitle: string;
      materialCitation?: MaterialSourceCitationView | null;
    }
  | {
      kind: "abandoned";
      runId: string;
      conceptTitle: string;
      materialCitation?: MaterialSourceCitationView | null;
    }
  | { kind: "not_found" }
  | {
      kind: "unavailable";
      runId: string;
      conceptTitle: string;
      reason: string;
    };

/**
 * Read-only Orchestrator snapshot for Adaptive display.
 * Soft-fails to null — never invents mastery or invents a why claim.
 */
async function loadLearnerStateForConcept(
  userId: string,
  conceptId: string,
): Promise<AdaptiveLearnerStateVisibility | null> {
  try {
    const result = await orchestrateForConcept(userId, conceptId);
    if (!result) return null;
    return buildAdaptiveLearnerStateVisibility(result);
  } catch (error) {
    console.error(
      "Adaptive learner-state visibility load failed (page still usable):",
      error,
    );
    return null;
  }
}

function stopNoticeFromQuery(notice: string | null | undefined): string | null {
  if (!notice) return null;
  switch (notice) {
    case "STOP_NO_INTERVENTION":
      return "No further adaptive step is recommended right now. You can complete this run or return to Study Hub.";
    case "STOP_IMMEDIATE_REPEAT":
      return "Adaptive study stopped instead of repeating the same activity. You can complete this run or return to Study Hub.";
    case "STOP_MAX_STEPS":
      return "This adaptive run reached its step limit. You can complete this run or return to Study Hub.";
    case "ALREADY_PROCESSED":
      return "This activity was already counted for adaptive study.";
    case "NEXT_STEP":
      return null;
    default:
      return null;
  }
}

async function ownedConceptTitle(
  userId: string,
  conceptId: string,
): Promise<string> {
  const concept = await db.concept.findFirst({
    where: { id: conceptId, userId },
    select: { title: true },
  });
  return concept?.title ?? "This concept";
}

async function hrefParamsForConcept(
  userId: string,
  conceptId: string,
): Promise<{
  courseId?: string;
  topicId?: string;
  topicName?: string;
}> {
  const topic = await db.topic.findFirst({
    where: { conceptId, course: { userId } },
    select: { id: true, name: true, courseId: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!topic) return {};
  return {
    courseId: topic.courseId,
    topicId: topic.id,
    topicName: topic.name,
  };
}

function resolveSixActivitySafe(
  stepIntervention: string,
  learningObjectId: string | null,
  hrefParams: {
    courseId?: string;
    topicId?: string;
    topicName?: string;
    adaptiveRunId?: string;
    adaptiveStep?: number;
    materialId?: string;
  },
):
  | { ok: true; activity: ResolvedSixSequenceActivity }
  | { ok: false; reason: string } {
  try {
    const activity = resolveSixSequenceStep(
      { intervention: stepIntervention, learningObjectId },
      hrefParams,
    );
    return { ok: true, activity };
  } catch (error) {
    if (error instanceof SixAdapterError) {
      return {
        ok: false,
        reason: "This study activity is not available for the current step.",
      };
    }
    return {
      ok: false,
      reason: "This study activity could not be opened right now.",
    };
  }
}

/**
 * Read-only page load for /study/adaptive/[runId].
 * Never creates evidence, advances cursor, completes, abandons, or re-orchestrates.
 */
export async function loadAdaptiveRunPageView(
  userId: string,
  runId: string,
  options?: { notice?: string | null; materialId?: string | null },
): Promise<AdaptiveRunPageView> {
  const resumed: ResumeAdaptiveSequenceResult =
    await resumeAdaptiveSequenceRun(userId, runId);

  if (resumed.kind === "not_found") {
    return { kind: "not_found" };
  }

  const conceptTitle = await ownedConceptTitle(userId, resumed.run.conceptId);
  const stopNotice = stopNoticeFromQuery(options?.notice);

  let materialContext = null as Awaited<
    ReturnType<typeof resolveLearningMaterialContext>
  >["context"];
  let materialCitation = null as ReturnType<typeof presentMaterialSourceCitation>;
  try {
    const materialResolution = await resolveLearningMaterialContext({
      userId,
      conceptId: resumed.run.conceptId,
      explicitMaterialId: options?.materialId ?? null,
    });
    materialContext = materialResolution.context;
    materialCitation = presentMaterialSourceCitation(materialContext);
  } catch (error) {
    console.error(
      "Adaptive material context resolve failed (page still usable):",
      error,
    );
  }
  const materialIdForHref = materialContext?.materialId ?? null;

  const enrichActive = (
    view: Extract<AdaptiveRunPageView, { kind: "active" }>,
  ): Extract<AdaptiveRunPageView, { kind: "active" }> => ({
    ...view,
    sixHref: view.sixHref
      ? withMaterialIdQuery(view.sixHref, materialIdForHref)
      : view.sixHref,
    materialContext,
    materialCitation,
  });

  if (resumed.kind === "terminal") {
    if (resumed.status === "COMPLETED") {
      return {
        kind: "completed",
        runId: resumed.run.id,
        conceptTitle,
        materialCitation,
      };
    }
    return {
      kind: "abandoned",
      runId: resumed.run.id,
      conceptTitle,
      materialCitation,
    };
  }

  // ACTIVE
  const run = resumed.run;
  const totalSteps = Math.max(run.steps.length, 1);
  const stepNumber = Math.min(run.currentStepIndex + 1, totalSteps);
  const learnerState = await loadLearnerStateForConcept(
    userId,
    run.conceptId,
  );

  if (resumed.awaitingNext || !resumed.currentStep) {
    return enrichActive({
      kind: "active",
      runId: run.id,
      conceptTitle,
      stepNumber,
      totalSteps,
      intervention: resumed.currentStep?.intervention ?? "—",
      activityTitle: null,
      activityDescription: null,
      sixHref: null,
      awaitingNext: true,
      sixUnavailableReason:
        stopNotice ??
        "This adaptive run is waiting for the next study step, or progression has stopped. You can complete or abandon the run.",
      stopNotice,
      learnerState,
    });
  }

  const hrefParams = await hrefParamsForConcept(userId, run.conceptId);
  const adaptiveHrefParams = {
    ...hrefParams,
    adaptiveRunId: run.id,
    adaptiveStep: run.currentStepIndex,
    ...(materialIdForHref ? { materialId: materialIdForHref } : {}),
  };

  // Phase 2G-14 — quiz; Phase 2G-54 — flashcard; Phase 2G-73 — universal activity; otherwise SIX.
  if (isSupportedQuizIntervention(resumed.currentStep.intervention)) {
    try {
      const quizActivity = await resolveOwnedQuizSequenceStep({
        userId,
        conceptId: run.conceptId,
        step: resumed.currentStep,
        hrefParams: {
          adaptiveRunId: run.id,
          adaptiveStep: run.currentStepIndex,
        },
      });
      return enrichActive({
        kind: "active",
        runId: run.id,
        conceptTitle,
        stepNumber,
        totalSteps,
        intervention: quizActivity.intervention,
        activityTitle: quizActivity.title,
        activityDescription: "Complete this quiz to continue adaptive study.",
        sixHref: quizActivity.href,
        awaitingNext: false,
        sixUnavailableReason: null,
        stopNotice,
        learnerState,
      });
    } catch (error) {
      const reason =
        error instanceof QuizAdapterError
          ? error.message
          : "This quiz activity could not be opened right now.";
      return enrichActive({
        kind: "active",
        runId: run.id,
        conceptTitle,
        stepNumber,
        totalSteps,
        intervention: resumed.currentStep.intervention,
        activityTitle: null,
        activityDescription: null,
        sixHref: null,
        awaitingNext: false,
        sixUnavailableReason: reason,
        stopNotice,
        learnerState,
      });
    }
  }

  if (isSupportedFlashcardIntervention(resumed.currentStep.intervention)) {
    try {
      const flashcardActivity = await resolveOwnedFlashcardSequenceStep({
        userId,
        conceptId: run.conceptId,
        step: resumed.currentStep,
        hrefParams: {
          adaptiveRunId: run.id,
          adaptiveStep: run.currentStepIndex,
        },
      });
      return enrichActive({
        kind: "active",
        runId: run.id,
        conceptTitle,
        stepNumber,
        totalSteps,
        intervention: flashcardActivity.intervention,
        activityTitle: "Flashcard review",
        activityDescription:
          "Rate a due flashcard to continue adaptive study.",
        sixHref: flashcardActivity.href,
        awaitingNext: false,
        sixUnavailableReason: null,
        stopNotice,
        learnerState,
      });
    } catch (error) {
      const reason =
        error instanceof FlashcardAdapterError
          ? error.message
          : "This flashcard activity could not be opened right now.";
      return enrichActive({
        kind: "active",
        runId: run.id,
        conceptTitle,
        stepNumber,
        totalSteps,
        intervention: resumed.currentStep.intervention,
        activityTitle: null,
        activityDescription: null,
        sixHref: null,
        awaitingNext: false,
        sixUnavailableReason: reason,
        stopNotice,
        learnerState,
      });
    }
  }

  // Phase 2G-73 — Universal Activity Adaptive steps (coding/sql/lab/…).
  if (isSupportedUniversalActivityIntervention(resumed.currentStep.intervention)) {
    try {
      const activity = resolveOwnedUniversalActivitySequenceStep({
        userId,
        conceptId: run.conceptId,
        step: resumed.currentStep,
        hrefParams: {
          adaptiveRunId: run.id,
          adaptiveStep: run.currentStepIndex,
          ...(materialIdForHref ? { materialId: materialIdForHref } : {}),
        },
      });
      return enrichActive({
        kind: "active",
        runId: run.id,
        conceptTitle,
        stepNumber,
        totalSteps,
        intervention: activity.intervention,
        activityTitle: activity.title,
        activityDescription: activity.description,
        sixHref: activity.href,
        awaitingNext: false,
        sixUnavailableReason: null,
        stopNotice,
        learnerState,
      });
    } catch (error) {
      const reason =
        error instanceof ActivityAdapterError
          ? error.message
          : "This practice activity could not be opened right now.";
      return enrichActive({
        kind: "active",
        runId: run.id,
        conceptTitle,
        stepNumber,
        totalSteps,
        intervention: resumed.currentStep.intervention,
        activityTitle: null,
        activityDescription: null,
        sixHref: null,
        awaitingNext: false,
        sixUnavailableReason: reason,
        stopNotice,
        learnerState,
      });
    }
  }

  const resolved = resolveSixActivitySafe(
    resumed.currentStep.intervention,
    resumed.currentStep.learningObjectId ?? null,
    adaptiveHrefParams,
  );

  if (!resolved.ok) {
    return enrichActive({
      kind: "active",
      runId: run.id,
      conceptTitle,
      stepNumber,
      totalSteps,
      intervention: resumed.currentStep.intervention,
      activityTitle: null,
      activityDescription: null,
      sixHref: null,
      awaitingNext: false,
      sixUnavailableReason: resolved.reason,
      stopNotice,
      learnerState,
    });
  }

  return enrichActive({
    kind: "active",
    runId: run.id,
    conceptTitle,
    stepNumber,
    totalSteps,
    intervention: resolved.activity.sixComponent,
    activityTitle: resolved.activity.guide.title,
    activityDescription: resolved.activity.guide.intro,
    sixHref: resolved.activity.href,
    awaitingNext: false,
    sixUnavailableReason: null,
    stopNotice,
    learnerState,
  });
}
