/**
 * Phase 2G-3 / 2G-5 — AdaptiveSequenceCoordinator.
 * Coordinates AdaptiveSequenceRun state with Orchestrator recommendations.
 * Phase 2G-5 adds evidence → re-orchestrate → append-next-step (domain only).
 * Does not launch activities, create evidence, mutate mastery, or navigate UI.
 */
import { db } from "@/lib/db";
import { orchestrateForConcept } from "@/lib/learning/orchestrator";
import type {
  OrchestrateOptions,
  OrchestratorResult,
} from "@/lib/learning/orchestrator/diagnose";
import {
  extractRecentActivityAdapterKeys,
  resolveImmediateRepeatAlternate,
} from "@/lib/learning/orchestrator/cross-modal-variety";
import { isAdaptiveReadyActivityAdapterKey } from "@/lib/learning/sequence/activity-adaptive-completion";
import { AdaptiveSequenceCoordinatorError } from "@/lib/learning/sequence/coordinator-errors";
import {
  abandonAdaptiveSequenceRun,
  completeAdaptiveSequenceRun,
  createAdaptiveSequenceRun,
  getAdaptiveSequenceRun,
  listAdaptiveSequenceRuns,
  updateAdaptiveSequenceRunStateIfCursorMatches,
  type AdaptiveSequenceRunView,
} from "@/lib/learning/sequence/service";
import { isAwaitingNextStep } from "@/lib/learning/sequence/json";
import { syncLuckyRetentionAfterSequenceComplete } from "@/lib/learning/sequence/lucky-handoff";
import { MAX_SEQUENCE_STEPS } from "@/lib/learning/sequence/policy";
import type {
  AdaptiveSequenceHistoryEntry,
  AdaptiveSequenceStep,
} from "@/lib/learning/sequence/types";

export type StartAdaptiveSequenceResult =
  | {
      kind: "started";
      run: AdaptiveSequenceRunView;
      currentStep: AdaptiveSequenceStep;
      orchestrator: OrchestratorResult;
    }
  | {
      kind: "no_sequence_needed";
      reason: string;
      orchestrator: OrchestratorResult | null;
    };

export type CurrentAdaptiveSequenceStepResult =
  | {
      kind: "active";
      run: AdaptiveSequenceRunView;
      step: AdaptiveSequenceStep;
      stepIndex: number;
    }
  | {
      kind: "awaiting_next";
      run: AdaptiveSequenceRunView;
      reason: string;
    }
  | {
      kind: "terminal";
      run: AdaptiveSequenceRunView;
      status: "COMPLETED" | "ABANDONED";
    }
  | {
      kind: "max_steps";
      run: AdaptiveSequenceRunView;
      reason: string;
    };

export type RecordCompletionResult =
  | {
      kind: "recorded";
      run: AdaptiveSequenceRunView;
      historyEntry: AdaptiveSequenceHistoryEntry;
      duplicate: false;
    }
  | {
      kind: "idempotent";
      run: AdaptiveSequenceRunView;
      historyEntry: AdaptiveSequenceHistoryEntry;
      duplicate: true;
    }
  | {
      kind: "max_steps";
      run: AdaptiveSequenceRunView;
      historyEntry: AdaptiveSequenceHistoryEntry;
      reason: string;
    };

export type NextInterventionResult =
  | {
      kind: "recommendation";
      run: AdaptiveSequenceRunView;
      orchestrator: OrchestratorResult;
      immediateRepeat: boolean;
    }
  | {
      kind: "no_intervention";
      run: AdaptiveSequenceRunView;
      orchestrator: OrchestratorResult | null;
      reason: string;
    }
  | {
      kind: "max_steps";
      run: AdaptiveSequenceRunView;
      reason: string;
    };

/**
 * Phase 2G-5 — result of record-completion + re-orchestrate + optional next-step append.
 * Run stays ACTIVE on stop variants (explicit complete/abandon remain separate).
 */
export type PlanNextAdaptiveStepResult =
  | {
      kind: "NEXT_STEP";
      run: AdaptiveSequenceRunView;
      currentStep: AdaptiveSequenceStep;
      stepIndex: number;
      historyEntry: AdaptiveSequenceHistoryEntry;
      orchestrator: OrchestratorResult;
    }
  | {
      kind: "STOP_NO_INTERVENTION";
      run: AdaptiveSequenceRunView;
      historyEntry: AdaptiveSequenceHistoryEntry;
      orchestrator: OrchestratorResult | null;
      reason: string;
    }
  | {
      kind: "STOP_MAX_STEPS";
      run: AdaptiveSequenceRunView;
      historyEntry?: AdaptiveSequenceHistoryEntry;
      reason: string;
    }
  | {
      kind: "STOP_IMMEDIATE_REPEAT";
      run: AdaptiveSequenceRunView;
      historyEntry: AdaptiveSequenceHistoryEntry;
      orchestrator: OrchestratorResult;
      reason: string;
    }
  | {
      kind: "TERMINAL";
      run: AdaptiveSequenceRunView;
      status: "COMPLETED" | "ABANDONED";
    }
  | {
      kind: "ALREADY_PROCESSED";
      run: AdaptiveSequenceRunView;
      historyEntry: AdaptiveSequenceHistoryEntry;
      currentStep: AdaptiveSequenceStep | null;
      awaitingNext: boolean;
    };

export type ResumeAdaptiveSequenceResult =
  | {
      kind: "active";
      run: AdaptiveSequenceRunView;
      currentStep: AdaptiveSequenceStep | null;
      awaitingNext: boolean;
    }
  | {
      kind: "terminal";
      run: AdaptiveSequenceRunView;
      status: "COMPLETED" | "ABANDONED";
    }
  | {
      kind: "not_found";
    };

/**
 * Map Orchestrator recommendation → Adaptive step intervention string.
 * Prefer Adaptive-ready activityIntervention when present; else SIX.
 * Never invents interventions. Never writes evidence.
 */
function interventionFromOrchestrator(
  result: OrchestratorResult,
): string | null {
  if (result.diagnosis === "NO_INTERVENTION") return null;

  const activityKey = result.activityIntervention?.adapterKey?.trim();
  if (activityKey && isAdaptiveReadyActivityAdapterKey(activityKey)) {
    return activityKey;
  }

  if (!result.intervention) return null;
  return result.intervention.sixComponent;
}

async function requireOwnedRun(
  userId: string,
  runId: string,
): Promise<AdaptiveSequenceRunView> {
  const run = await getAdaptiveSequenceRun(userId, runId);
  if (!run) {
    throw new AdaptiveSequenceCoordinatorError(
      "RUN_NOT_FOUND",
      `AdaptiveSequenceRun not found or not owned: ${runId}`,
    );
  }
  return run;
}

function assertActive(run: AdaptiveSequenceRunView): void {
  if (run.status === "COMPLETED") {
    throw new AdaptiveSequenceCoordinatorError(
      "RUN_COMPLETED",
      "Run is COMPLETED and cannot be modified.",
    );
  }
  if (run.status === "ABANDONED") {
    throw new AdaptiveSequenceCoordinatorError(
      "RUN_ABANDONED",
      "Run is ABANDONED and cannot be modified.",
    );
  }
  if (run.status !== "ACTIVE") {
    throw new AdaptiveSequenceCoordinatorError(
      "INACTIVE_RUN",
      `Run is not ACTIVE (status=${run.status}).`,
    );
  }
}

function assertClientStepIndex(
  run: AdaptiveSequenceRunView,
  clientStepIndex: number | undefined,
): number {
  const authoritative = run.currentStepIndex;
  if (clientStepIndex === undefined) {
    return authoritative;
  }
  if (!Number.isInteger(clientStepIndex)) {
    throw new AdaptiveSequenceCoordinatorError(
      "INVALID_CURRENT_STEP",
      "stepIndex must be an integer.",
    );
  }
  if (clientStepIndex < authoritative) {
    throw new AdaptiveSequenceCoordinatorError(
      "STALE_STEP",
      `stepIndex ${clientStepIndex} is stale; persisted currentStepIndex is ${authoritative}.`,
    );
  }
  if (clientStepIndex > authoritative) {
    throw new AdaptiveSequenceCoordinatorError(
      "INVALID_CURRENT_STEP",
      `stepIndex ${clientStepIndex} is ahead of persisted currentStepIndex ${authoritative}.`,
    );
  }
  return authoritative;
}

function historyReachedMax(history: AdaptiveSequenceHistoryEntry[]): boolean {
  return history.length >= MAX_SEQUENCE_STEPS;
}

function stepsReachedMax(steps: AdaptiveSequenceStep[]): boolean {
  return steps.length >= MAX_SEQUENCE_STEPS;
}

/**
 * Start a concept-scoped adaptive sequence run from Orchestrator recommendation.
 * Does not launch activities or create LearningAttempts.
 */
export async function startAdaptiveSequenceRun(input: {
  userId: string;
  conceptId: string;
  options?: OrchestrateOptions;
}): Promise<StartAdaptiveSequenceResult> {
  const orchestrator = await orchestrateForConcept(
    input.userId,
    input.conceptId,
    input.options,
  );

  if (!orchestrator) {
    return {
      kind: "no_sequence_needed",
      reason: "No learner mastery state available for this concept.",
      orchestrator: null,
    };
  }

  const intervention = interventionFromOrchestrator(orchestrator);
  if (!intervention) {
    return {
      kind: "no_sequence_needed",
      reason:
        orchestrator.diagnosis === "NO_INTERVENTION"
          ? "Orchestrator reported NO_INTERVENTION — no sequence needed."
          : "Orchestrator returned no intervention to start a sequence.",
      orchestrator,
    };
  }

  const firstStep: AdaptiveSequenceStep = {
    intervention,
    learningObjectId: null,
  };

  const run = await createAdaptiveSequenceRun({
    userId: input.userId,
    conceptId: input.conceptId,
    steps: [firstStep],
    currentStepIndex: 0,
    interventionHistory: [],
    lastAttemptId: null,
  });

  return {
    kind: "started",
    run,
    currentStep: firstStep,
    orchestrator,
  };
}

/**
 * Read-only current step for an owned run. Does not mutate state.
 */
export async function getCurrentAdaptiveSequenceStep(
  userId: string,
  runId: string,
): Promise<CurrentAdaptiveSequenceStepResult> {
  const run = await requireOwnedRun(userId, runId);

  if (run.status === "COMPLETED" || run.status === "ABANDONED") {
    return { kind: "terminal", run, status: run.status };
  }

  if (historyReachedMax(run.interventionHistory)) {
    return {
      kind: "max_steps",
      run,
      reason: `Maximum sequence steps (${MAX_SEQUENCE_STEPS}) reached.`,
    };
  }

  if (isAwaitingNextStep(run.currentStepIndex, run.steps.length)) {
    return {
      kind: "awaiting_next",
      run,
      reason: "Current steps are complete; ask Orchestrator for next intervention.",
    };
  }

  if (
    run.currentStepIndex < 0 ||
    run.currentStepIndex >= run.steps.length
  ) {
    throw new AdaptiveSequenceCoordinatorError(
      "INVALID_CURRENT_STEP",
      `Invalid currentStepIndex ${run.currentStepIndex} for ${run.steps.length} step(s).`,
    );
  }

  return {
    kind: "active",
    run,
    step: run.steps[run.currentStepIndex]!,
    stepIndex: run.currentStepIndex,
  };
}

/**
 * Associate an existing LearningAttempt with the current step and advance the cursor.
 * Does not create the Attempt or call the Orchestrator.
 * Phase 2G-6: stale stepIndex rejected; optimistic cursor write; duplicate Attempt idempotent.
 */
export async function recordAdaptiveSequenceCompletion(input: {
  userId: string;
  runId: string;
  attemptId: string;
  stepIndex?: number;
}): Promise<RecordCompletionResult> {
  const run = await requireOwnedRun(input.userId, input.runId);
  assertActive(run);

  const existingEntry = run.interventionHistory.find(
    (entry) => entry.attemptId === input.attemptId,
  );
  if (existingEntry) {
    return {
      kind: "idempotent",
      run,
      historyEntry: existingEntry,
      duplicate: true,
    };
  }

  if (historyReachedMax(run.interventionHistory)) {
    throw new AdaptiveSequenceCoordinatorError(
      "MAX_STEPS_REACHED",
      `Cannot record completion: maximum sequence steps (${MAX_SEQUENCE_STEPS}) reached.`,
    );
  }

  if (isAwaitingNextStep(run.currentStepIndex, run.steps.length)) {
    throw new AdaptiveSequenceCoordinatorError(
      "STALE_STEP",
      "No active step to complete; run has already advanced past the last completed step.",
    );
  }

  const stepIndex = assertClientStepIndex(run, input.stepIndex);
  if (stepIndex < 0 || stepIndex >= run.steps.length) {
    throw new AdaptiveSequenceCoordinatorError(
      "INVALID_CURRENT_STEP",
      `Invalid stepIndex ${stepIndex}.`,
    );
  }

  // Different Attempt cannot attach to a step already recorded in history.
  const priorForStep = run.interventionHistory.find(
    (entry) => entry.stepIndex === stepIndex,
  );
  if (priorForStep) {
    throw new AdaptiveSequenceCoordinatorError(
      "STALE_STEP",
      "This step was already completed by a different Attempt.",
    );
  }

  const step = run.steps[stepIndex]!;

  const attempt = await db.learningAttempt.findFirst({
    where: { id: input.attemptId },
    select: {
      id: true,
      userId: true,
      conceptId: true,
      learningObjectId: true,
      outcome: true,
    },
  });

  if (!attempt) {
    throw new AdaptiveSequenceCoordinatorError(
      "ATTEMPT_NOT_FOUND",
      `LearningAttempt not found: ${input.attemptId}`,
    );
  }
  if (attempt.userId !== input.userId) {
    throw new AdaptiveSequenceCoordinatorError(
      "ATTEMPT_OWNERSHIP_MISMATCH",
      "LearningAttempt does not belong to this learner.",
    );
  }
  if (attempt.conceptId != null && attempt.conceptId !== run.conceptId) {
    throw new AdaptiveSequenceCoordinatorError(
      "ATTEMPT_CONCEPT_MISMATCH",
      "LearningAttempt concept does not match the sequence run concept.",
    );
  }
  if (
    step.learningObjectId &&
    attempt.learningObjectId !== step.learningObjectId
  ) {
    throw new AdaptiveSequenceCoordinatorError(
      "ATTEMPT_LEARNING_OBJECT_MISMATCH",
      "LearningAttempt LearningObject does not match the current step.",
    );
  }

  const historyEntry: AdaptiveSequenceHistoryEntry = {
    stepIndex,
    intervention: step.intervention,
    learningObjectId: step.learningObjectId ?? null,
    attemptId: attempt.id,
  };

  const nextHistory = [...run.interventionHistory, historyEntry];
  const nextIndex = stepIndex + 1;

  const updated = await updateAdaptiveSequenceRunStateIfCursorMatches(
    input.userId,
    run.id,
    stepIndex,
    {
      currentStepIndex: nextIndex,
      interventionHistory: nextHistory,
      lastAttemptId: attempt.id,
    },
  );

  if (!updated) {
    // Concurrent writer won — re-read persisted state.
    const latest = await requireOwnedRun(input.userId, input.runId);
    const raced = latest.interventionHistory.find(
      (entry) => entry.attemptId === input.attemptId,
    );
    if (raced) {
      return {
        kind: "idempotent",
        run: latest,
        historyEntry: raced,
        duplicate: true,
      };
    }
    throw new AdaptiveSequenceCoordinatorError(
      "CONCURRENT_MODIFICATION",
      "Sequence cursor changed before this completion could be applied.",
    );
  }

  if (historyReachedMax(nextHistory)) {
    return {
      kind: "max_steps",
      run: updated,
      historyEntry,
      reason: `Maximum sequence steps (${MAX_SEQUENCE_STEPS}) reached after this completion.`,
    };
  }

  return {
    kind: "recorded",
    run: updated,
    historyEntry,
    duplicate: false,
  };
}

/**
 * Ask Orchestrator for the next recommendation. Does not append a step or launch activities.
 */
export async function getNextAdaptiveIntervention(
  userId: string,
  runId: string,
  options?: OrchestrateOptions,
): Promise<NextInterventionResult> {
  const run = await requireOwnedRun(userId, runId);
  assertActive(run);

  if (historyReachedMax(run.interventionHistory)) {
    return {
      kind: "max_steps",
      run,
      reason: `Maximum sequence steps (${MAX_SEQUENCE_STEPS}) reached.`,
    };
  }

  const recentActivityAdapterKeys = extractRecentActivityAdapterKeys(
    run.interventionHistory,
  );

  const orchestrator = await orchestrateForConcept(userId, run.conceptId, {
    ...options,
    recentActivityAdapterKeys,
  });

  if (!orchestrator) {
    return {
      kind: "no_intervention",
      run,
      orchestrator: null,
      reason: "Orchestrator returned no learner state for this concept.",
    };
  }

  let effective = orchestrator;
  const intervention = interventionFromOrchestrator(effective);
  if (!intervention) {
    return {
      kind: "no_intervention",
      run,
      orchestrator: effective,
      reason:
        effective.diagnosis === "NO_INTERVENTION"
          ? "Orchestrator reported NO_INTERVENTION."
          : "Orchestrator returned no intervention.",
    };
  }

  const lastIntervention =
    run.interventionHistory.length > 0
      ? run.interventionHistory[run.interventionHistory.length - 1]!
          .intervention
      : null;

  let immediateRepeat =
    lastIntervention != null && lastIntervention === intervention;

  if (immediateRepeat && lastIntervention) {
    const alternate = resolveImmediateRepeatAlternate(
      effective,
      lastIntervention,
      { subjectDomain: options?.subjectDomain ?? null },
    );
    if (alternate) {
      const altKey = interventionFromOrchestrator(alternate);
      if (altKey && altKey !== lastIntervention) {
        effective = alternate;
        immediateRepeat = false;
      }
    }
  }

  return {
    kind: "recommendation",
    run,
    orchestrator: effective,
    immediateRepeat,
  };
}

/**
 * Phase 2G-5 — Record an existing LearningAttempt completion, then ask the
 * existing Orchestrator whether to append a next step.
 *
 * Does not create Attempts, mutate mastery, launch activities, or auto-complete
 * the run on NO_INTERVENTION (run stays ACTIVE; caller may complete explicitly).
 */
export async function recordAdaptiveSequenceCompletionAndPlanNext(input: {
  userId: string;
  runId: string;
  attemptId: string;
  stepIndex?: number;
  options?: OrchestrateOptions;
}): Promise<PlanNextAdaptiveStepResult> {
  const existing = await getAdaptiveSequenceRun(input.userId, input.runId);
  if (!existing) {
    throw new AdaptiveSequenceCoordinatorError(
      "RUN_NOT_FOUND",
      `AdaptiveSequenceRun not found or not owned: ${input.runId}`,
    );
  }

  if (existing.status === "COMPLETED" || existing.status === "ABANDONED") {
    return {
      kind: "TERMINAL",
      run: existing,
      status: existing.status,
    };
  }

  // Idempotency: same Attempt already recorded → do not re-orchestrate or append again.
  const priorEntry = existing.interventionHistory.find(
    (entry) => entry.attemptId === input.attemptId,
  );
  if (priorEntry) {
    const awaitingNext = isAwaitingNextStep(
      existing.currentStepIndex,
      existing.steps.length,
    );
    const currentStep =
      !awaitingNext &&
      existing.currentStepIndex >= 0 &&
      existing.currentStepIndex < existing.steps.length
        ? existing.steps[existing.currentStepIndex]!
        : null;
    return {
      kind: "ALREADY_PROCESSED",
      run: existing,
      historyEntry: priorEntry,
      currentStep,
      awaitingNext,
    };
  }

  const recorded = await recordAdaptiveSequenceCompletion({
    userId: input.userId,
    runId: input.runId,
    attemptId: input.attemptId,
    stepIndex: input.stepIndex,
  });

  if (recorded.kind === "idempotent") {
    const awaitingNext = isAwaitingNextStep(
      recorded.run.currentStepIndex,
      recorded.run.steps.length,
    );
    const currentStep =
      !awaitingNext &&
      recorded.run.currentStepIndex >= 0 &&
      recorded.run.currentStepIndex < recorded.run.steps.length
        ? recorded.run.steps[recorded.run.currentStepIndex]!
        : null;
    return {
      kind: "ALREADY_PROCESSED",
      run: recorded.run,
      historyEntry: recorded.historyEntry,
      currentStep,
      awaitingNext,
    };
  }

  if (recorded.kind === "max_steps") {
    return {
      kind: "STOP_MAX_STEPS",
      run: recorded.run,
      historyEntry: recorded.historyEntry,
      reason: recorded.reason,
    };
  }

  if (stepsReachedMax(recorded.run.steps)) {
    return {
      kind: "STOP_MAX_STEPS",
      run: recorded.run,
      historyEntry: recorded.historyEntry,
      reason: `Maximum sequence steps (${MAX_SEQUENCE_STEPS}) reached — cannot append another step.`,
    };
  }

  // Re-orchestrate AFTER evidence exists (Attempt already recorded by producer).
  const next = await getNextAdaptiveIntervention(
    input.userId,
    input.runId,
    input.options,
  );

  if (next.kind === "max_steps") {
    return {
      kind: "STOP_MAX_STEPS",
      run: next.run,
      historyEntry: recorded.historyEntry,
      reason: next.reason,
    };
  }

  if (next.kind === "no_intervention") {
    return {
      kind: "STOP_NO_INTERVENTION",
      run: next.run,
      historyEntry: recorded.historyEntry,
      orchestrator: next.orchestrator,
      reason: next.reason,
    };
  }

  if (next.immediateRepeat) {
    return {
      kind: "STOP_IMMEDIATE_REPEAT",
      run: next.run,
      historyEntry: recorded.historyEntry,
      orchestrator: next.orchestrator,
      reason:
        "Orchestrator recommended the same intervention as the immediately previous step and no legal alternate was available; not appending.",
    };
  }

  const intervention = interventionFromOrchestrator(next.orchestrator);
  if (!intervention) {
    return {
      kind: "STOP_NO_INTERVENTION",
      run: next.run,
      historyEntry: recorded.historyEntry,
      orchestrator: next.orchestrator,
      reason: "Orchestrator returned no intervention to append.",
    };
  }

  const nextStep: AdaptiveSequenceStep = {
    intervention,
    learningObjectId: null,
  };

  const appendedSteps = [...next.run.steps, nextStep];
  if (appendedSteps.length > MAX_SEQUENCE_STEPS) {
    return {
      kind: "STOP_MAX_STEPS",
      run: next.run,
      historyEntry: recorded.historyEntry,
      reason: `Maximum sequence steps (${MAX_SEQUENCE_STEPS}) would be exceeded.`,
    };
  }

  const newStepIndex = appendedSteps.length - 1;
  // Optimistic: only append if cursor still matches post-record awaiting state.
  const updated = await updateAdaptiveSequenceRunStateIfCursorMatches(
    input.userId,
    input.runId,
    next.run.currentStepIndex,
    {
      steps: appendedSteps,
      currentStepIndex: newStepIndex,
    },
  );

  if (!updated) {
    const latest = await requireOwnedRun(input.userId, input.runId);
    // If another writer already appended the same intervention, surface current state.
    const already =
      latest.steps.length > next.run.steps.length &&
      latest.steps[latest.steps.length - 1]?.intervention === intervention;
    if (already) {
      return {
        kind: "NEXT_STEP",
        run: latest,
        currentStep: latest.steps[latest.steps.length - 1]!,
        stepIndex: latest.steps.length - 1,
        historyEntry: recorded.historyEntry,
        orchestrator: next.orchestrator,
      };
    }
    throw new AdaptiveSequenceCoordinatorError(
      "CONCURRENT_MODIFICATION",
      "Sequence changed before the next step could be appended.",
    );
  }

  return {
    kind: "NEXT_STEP",
    run: updated,
    currentStep: nextStep,
    stepIndex: newStepIndex,
    historyEntry: recorded.historyEntry,
    orchestrator: next.orchestrator,
  };
}

/**
 * Resume an existing ACTIVE run without creating evidence or re-orchestrating.
 * Phase 2G-6: read-oriented — never restarts, never mutates steps/history.
 */
export async function resumeAdaptiveSequenceRun(
  userId: string,
  runId: string,
): Promise<ResumeAdaptiveSequenceResult> {
  const run = await getAdaptiveSequenceRun(userId, runId);
  if (!run) return { kind: "not_found" };

  if (run.status === "COMPLETED" || run.status === "ABANDONED") {
    return { kind: "terminal", run, status: run.status };
  }

  const awaitingNext = isAwaitingNextStep(
    run.currentStepIndex,
    run.steps.length,
  );
  const currentStep =
    !awaitingNext &&
    run.currentStepIndex >= 0 &&
    run.currentStepIndex < run.steps.length
      ? run.steps[run.currentStepIndex]!
      : null;

  return {
    kind: "active",
    run,
    currentStep,
    awaitingNext,
  };
}

/**
 * Soft-resolve lastAttemptId (scalar pointer, not FK).
 * Missing Attempt does not throw — evidence remains independently authoritative.
 */
export async function getAdaptiveSequenceLastAttemptPointer(
  userId: string,
  runId: string,
): Promise<{
  run: AdaptiveSequenceRunView;
  lastAttemptId: string | null;
  attemptExists: boolean;
}> {
  const run = await requireOwnedRun(userId, runId);
  if (!run.lastAttemptId) {
    return { run, lastAttemptId: null, attemptExists: false };
  }

  const attempt = await db.learningAttempt.findFirst({
    where: { id: run.lastAttemptId, userId },
    select: { id: true },
  });

  return {
    run,
    lastAttemptId: run.lastAttemptId,
    attemptExists: attempt != null,
  };
}

/**
 * List ACTIVE runs for a concept (multiple ACTIVE runs per concept are allowed —
 * no uniqueness constraint in 2G-2/2G-3).
 */
export async function listActiveAdaptiveSequenceRuns(
  userId: string,
  conceptId?: string,
): Promise<AdaptiveSequenceRunView[]> {
  return listAdaptiveSequenceRuns(userId, {
    conceptId,
    status: "ACTIVE",
  });
}

export async function completeAdaptiveSequence(
  userId: string,
  runId: string,
): Promise<AdaptiveSequenceRunView> {
  const run = await requireOwnedRun(userId, runId);
  assertActive(run);
  const completed = await completeAdaptiveSequenceRun(userId, runId);
  // Downstream Lucky retention — never rolls back COMPLETED (2G-7).
  await syncLuckyRetentionAfterSequenceComplete({
    userId,
    conceptId: completed.conceptId,
    runId: completed.id,
  });
  return completed;
}

export async function abandonAdaptiveSequence(
  userId: string,
  runId: string,
): Promise<AdaptiveSequenceRunView> {
  const run = await requireOwnedRun(userId, runId);
  assertActive(run);
  return abandonAdaptiveSequenceRun(userId, runId);
}
