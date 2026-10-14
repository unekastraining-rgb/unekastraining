/**
 * Phase 2G-47 — Standalone Assessment launch consumer.
 * Phase 2G-53 — Flashcard Assessment adapter opt-in (alongside Quiz).
 *
 * Chains explicit ASSESS planning → optional activity resolve/prepare/launch.
 * Returns a launch *instruction* only — does not navigate, execute activities,
 * write evidence, or mutate AdaptiveSequenceRun.
 */

import { resolveAssessmentActivity } from "@/lib/learning/assessment/activity-resolution";
import {
  prepareAssessmentActivity,
  type AssessmentActivityDescriptor,
} from "@/lib/learning/assessment/activity-preparation";
import {
  launchAssessmentActivity,
  type AssessmentActivityLaunch,
} from "@/lib/learning/assessment/activity-launch";
import {
  FLASHCARD_ASSESSMENT_ACTIVITY_TYPE,
  FLASHCARD_ASSESSMENT_ADAPTER_KEY,
  createAssessmentAdapterRegistryWithFlashcard,
  findOwnedDueFlashcardForConcept,
  type FindOwnedDueFlashcardForConceptFn,
} from "@/lib/learning/assessment/flashcard-assessment-adapter";
import {
  QUIZ_ASSESSMENT_ACTIVITY_TYPE,
  QUIZ_ASSESSMENT_ADAPTER_KEY,
  createAssessmentAdapterRegistryWithQuiz,
  type FindOwnedQuizForConceptFn,
} from "@/lib/learning/assessment/quiz-assessment-adapter";
import {
  runStandaloneAssessmentEntry,
  type StandaloneAssessmentEntryFailure,
  type StandaloneAssessmentEntryInput,
  type StandaloneAssessmentEntrySuccess,
} from "@/lib/learning/assessment/standalone-entry";
import type { AssessmentPlan } from "@/lib/learning/assessment/workflow";
import { findOwnedQuizForConcept } from "@/lib/learning/sequence/quiz-adapter";

export type StandaloneAssessmentActivityOutcome =
  | { status: "skipped" }
  | {
      status: "ready";
      activity: AssessmentActivityDescriptor;
      launch: AssessmentActivityLaunch;
    }
  | {
      status: "unavailable";
      reason: string;
    }
  | {
      status: "unresolved";
      reason: string;
    };

export type StandaloneAssessmentConsumerInput =
  StandaloneAssessmentEntryInput & {
    /**
     * Explicit activity mechanism request (e.g. "quiz" | "flashcard").
     * Absent → plan only (2G-40 behavior). Never inferred from ASSESS alone.
     */
    adapterKey?: string | null;
    /** Defaults to canonical findOwnedQuizForConcept when adapterKey is quiz. */
    verifyOwnedQuiz?: FindOwnedQuizForConceptFn;
    /** Defaults to canonical findOwnedDueFlashcardForConcept when flashcard. */
    verifyOwnedFlashcard?: FindOwnedDueFlashcardForConceptFn;
  };

export type StandaloneAssessmentConsumerSuccess =
  StandaloneAssessmentEntrySuccess & {
    activityOutcome: StandaloneAssessmentActivityOutcome;
  };

export type StandaloneAssessmentConsumerResult =
  | StandaloneAssessmentConsumerSuccess
  | StandaloneAssessmentEntryFailure;

function normalizeAdapterKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function withExplicitAdapter(
  plan: AssessmentPlan,
  adapterKey: string,
): AssessmentPlan {
  if (adapterKey === QUIZ_ASSESSMENT_ADAPTER_KEY) {
    return {
      ...plan,
      adapterKey: QUIZ_ASSESSMENT_ADAPTER_KEY,
      activityType: QUIZ_ASSESSMENT_ACTIVITY_TYPE,
    };
  }
  if (adapterKey === FLASHCARD_ASSESSMENT_ADAPTER_KEY) {
    return {
      ...plan,
      adapterKey: FLASHCARD_ASSESSMENT_ADAPTER_KEY,
      activityType: FLASHCARD_ASSESSMENT_ACTIVITY_TYPE,
    };
  }
  return { ...plan, adapterKey };
}

/**
 * Explicit ASSESS entry + optional activity launch path for an existing caller.
 */
export async function runStandaloneAssessmentConsumer(
  input: StandaloneAssessmentConsumerInput,
): Promise<StandaloneAssessmentConsumerResult> {
  const entry = runStandaloneAssessmentEntry(input);
  if (!entry.ok) return entry;

  const adapterKey = normalizeAdapterKey(input.adapterKey);
  if (!adapterKey) {
    return {
      ...entry,
      activityOutcome: { status: "skipped" },
    };
  }

  if (adapterKey === QUIZ_ASSESSMENT_ADAPTER_KEY) {
    const verifyOwnedQuiz =
      input.verifyOwnedQuiz ?? findOwnedQuizForConcept;
    const registry = createAssessmentAdapterRegistryWithQuiz({
      findOwnedQuiz: verifyOwnedQuiz,
    });

    return runActivityPipeline({
      entry,
      adapterKey,
      registry,
      learnerId: input.learnerId,
      launchOpts: { verifyOwnedQuiz },
    });
  }

  if (adapterKey === FLASHCARD_ASSESSMENT_ADAPTER_KEY) {
    const verifyOwnedFlashcard =
      input.verifyOwnedFlashcard ?? findOwnedDueFlashcardForConcept;
    const registry = createAssessmentAdapterRegistryWithFlashcard({
      findOwnedDueFlashcard: verifyOwnedFlashcard,
    });

    return runActivityPipeline({
      entry,
      adapterKey,
      registry,
      learnerId: input.learnerId,
      launchOpts: { verifyOwnedFlashcard },
    });
  }

  return {
    ...entry,
    activityOutcome: {
      status: "unresolved",
      reason: "activity_resolution_unavailable",
    },
  };
}

async function runActivityPipeline(input: {
  entry: StandaloneAssessmentEntrySuccess;
  adapterKey: string;
  registry: ReturnType<typeof createAssessmentAdapterRegistryWithQuiz>;
  learnerId: string;
  launchOpts: {
    verifyOwnedQuiz?: FindOwnedQuizForConceptFn;
    verifyOwnedFlashcard?: FindOwnedDueFlashcardForConceptFn;
  };
}): Promise<StandaloneAssessmentConsumerSuccess> {
  const plan = withExplicitAdapter(input.entry.plan, input.adapterKey);
  const resolved = resolveAssessmentActivity(
    plan,
    input.learnerId,
    input.registry,
  );

  if (!resolved.ok) {
    return {
      ...input.entry,
      plan,
      activityOutcome: {
        status: "unresolved",
        reason: resolved.reason,
      },
    };
  }

  const prepared = await prepareAssessmentActivity({
    plan,
    resolution: resolved.resolution,
    learnerId: resolved.learnerId,
    registry: input.registry,
  });

  if (!prepared.ok) {
    return {
      ...input.entry,
      plan,
      activityOutcome: {
        status: "unavailable",
        reason: prepared.reason,
      },
    };
  }

  const launched = await launchAssessmentActivity({
    descriptor: prepared.descriptor,
    ...input.launchOpts,
  });

  if (!launched.ok) {
    return {
      ...input.entry,
      plan,
      activityOutcome: {
        status: "unavailable",
        reason: launched.reason,
      },
    };
  }

  return {
    ...input.entry,
    plan,
    activityOutcome: {
      status: "ready",
      activity: prepared.descriptor,
      launch: launched.launch,
    },
  };
}
