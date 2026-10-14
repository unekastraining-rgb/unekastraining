import type { AdaptiveSequenceRun } from "@/generated/prisma";

import { db } from "@/lib/db";
import { AdaptiveSequenceRunError } from "@/lib/learning/sequence/errors";
import {
  assertValidCurrentStepIndex,
  normalizeHistoryEntry,
  normalizeStep,
  parseInterventionHistoryJson,
  parseStepsJson,
  serializeInterventionHistory,
  serializeSteps,
} from "@/lib/learning/sequence/json";
import type {
  AdaptiveSequenceHistoryEntry,
  AdaptiveSequenceStep,
} from "@/lib/learning/sequence/types";

export { AdaptiveSequenceRunError } from "@/lib/learning/sequence/errors";

export type AdaptiveSequenceRunView = {
  id: string;
  userId: string;
  conceptId: string;
  status: AdaptiveSequenceRun["status"];
  currentStepIndex: number;
  steps: AdaptiveSequenceStep[];
  interventionHistory: AdaptiveSequenceHistoryEntry[];
  lastAttemptId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateAdaptiveSequenceRunInput = {
  userId: string;
  conceptId: string;
  steps: AdaptiveSequenceStep[];
  currentStepIndex?: number;
  interventionHistory?: AdaptiveSequenceHistoryEntry[];
  lastAttemptId?: string | null;
};

export type UpdateAdaptiveSequenceRunStateInput = {
  currentStepIndex?: number;
  steps?: AdaptiveSequenceStep[];
  interventionHistory?: AdaptiveSequenceHistoryEntry[];
  lastAttemptId?: string | null;
};

async function requireOwnedConcept(userId: string, conceptId: string) {
  const concept = await db.concept.findFirst({
    where: { id: conceptId, userId },
    select: { id: true, userId: true },
  });
  if (!concept) {
    throw new AdaptiveSequenceRunError(
      `Concept not found or not owned by user: ${conceptId}`,
    );
  }
  return concept;
}

async function requireOwnedLearningObject(
  userId: string,
  learningObjectId: string,
) {
  const learningObject = await db.learningObject.findFirst({
    where: { id: learningObjectId, userId },
    select: { id: true, userId: true },
  });
  if (!learningObject) {
    throw new AdaptiveSequenceRunError(
      `LearningObject not found or not owned by user: ${learningObjectId}`,
    );
  }
  return learningObject;
}

async function assertOwnedStepReferences(
  userId: string,
  steps: AdaptiveSequenceStep[],
) {
  for (const step of steps) {
    if (step.learningObjectId) {
      await requireOwnedLearningObject(userId, step.learningObjectId);
    }
  }
}

function toView(row: AdaptiveSequenceRun): AdaptiveSequenceRunView {
  return {
    id: row.id,
    userId: row.userId,
    conceptId: row.conceptId,
    status: row.status,
    currentStepIndex: row.currentStepIndex,
    steps: parseStepsJson(row.stepsJson),
    interventionHistory: parseInterventionHistoryJson(
      row.interventionHistoryJson,
    ),
    lastAttemptId: row.lastAttemptId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeIncomingSteps(steps: AdaptiveSequenceStep[]): AdaptiveSequenceStep[] {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new AdaptiveSequenceRunError(
      "steps must contain at least one step for an active run.",
    );
  }
  return steps.map((step, index) => normalizeStep(step, index));
}

function normalizeIncomingHistory(
  history: AdaptiveSequenceHistoryEntry[] | undefined,
): AdaptiveSequenceHistoryEntry[] {
  if (history == null) return [];
  if (!Array.isArray(history)) {
    throw new AdaptiveSequenceRunError(
      "interventionHistory must be an array.",
    );
  }
  return history.map((entry, index) => normalizeHistoryEntry(entry, index));
}

/**
 * Create an ACTIVE adaptive sequence run for an owned concept.
 * Does not create LearningAttempts, mutate mastery, or call the Orchestrator.
 */
export async function createAdaptiveSequenceRun(
  input: CreateAdaptiveSequenceRunInput,
): Promise<AdaptiveSequenceRunView> {
  await requireOwnedConcept(input.userId, input.conceptId);

  const steps = normalizeIncomingSteps(input.steps);
  await assertOwnedStepReferences(input.userId, steps);

  const currentStepIndex = input.currentStepIndex ?? 0;
  // On create, the cursor must address an existing step (not awaiting-next).
  if (currentStepIndex >= steps.length) {
    throw new AdaptiveSequenceRunError(
      `currentStepIndex ${currentStepIndex} is out of range for ${steps.length} step(s).`,
    );
  }
  assertValidCurrentStepIndex(currentStepIndex, steps.length);

  const interventionHistory = normalizeIncomingHistory(
    input.interventionHistory,
  );
  const lastAttemptId =
    input.lastAttemptId === undefined || input.lastAttemptId === ""
      ? null
      : input.lastAttemptId;

  const row = await db.adaptiveSequenceRun.create({
    data: {
      userId: input.userId,
      conceptId: input.conceptId,
      status: "ACTIVE",
      currentStepIndex,
      stepsJson: serializeSteps(steps),
      interventionHistoryJson: serializeInterventionHistory(interventionHistory),
      lastAttemptId,
    },
  });

  return toView(row);
}

/**
 * Ownership-scoped run fetch. Returns null when missing or not owned.
 */
export async function getAdaptiveSequenceRun(
  userId: string,
  runId: string,
): Promise<AdaptiveSequenceRunView | null> {
  const row = await db.adaptiveSequenceRun.findFirst({
    where: { id: runId, userId },
  });
  if (!row) return null;
  return toView(row);
}

/**
 * List runs for the authenticated user (optional concept/status filters).
 */
export async function listAdaptiveSequenceRuns(
  userId: string,
  options?: {
    conceptId?: string;
    status?: AdaptiveSequenceRun["status"];
    limit?: number;
  },
): Promise<AdaptiveSequenceRunView[]> {
  const rows = await db.adaptiveSequenceRun.findMany({
    where: {
      userId,
      conceptId: options?.conceptId,
      status: options?.status,
    },
    orderBy: { updatedAt: "desc" },
    take: options?.limit ?? 50,
  });
  return rows.map(toView);
}

/**
 * Update mutable fields on an ACTIVE run only.
 * Does not change status; use complete/abandon for transitions.
 */
export async function updateAdaptiveSequenceRunState(
  userId: string,
  runId: string,
  patch: UpdateAdaptiveSequenceRunStateInput,
): Promise<AdaptiveSequenceRunView> {
  const existing = await db.adaptiveSequenceRun.findFirst({
    where: { id: runId, userId },
  });
  if (!existing) {
    throw new AdaptiveSequenceRunError(
      `AdaptiveSequenceRun not found or not owned: ${runId}`,
    );
  }
  if (existing.status !== "ACTIVE") {
    throw new AdaptiveSequenceRunError(
      `Cannot update state of a ${existing.status} run.`,
    );
  }

  const steps =
    patch.steps !== undefined
      ? normalizeIncomingSteps(patch.steps)
      : parseStepsJson(existing.stepsJson);

  if (patch.steps !== undefined) {
    await assertOwnedStepReferences(userId, steps);
  }

  const currentStepIndex =
    patch.currentStepIndex !== undefined
      ? patch.currentStepIndex
      : existing.currentStepIndex;
  assertValidCurrentStepIndex(currentStepIndex, steps.length);

  const interventionHistory =
    patch.interventionHistory !== undefined
      ? normalizeIncomingHistory(patch.interventionHistory)
      : parseInterventionHistoryJson(existing.interventionHistoryJson);

  const lastAttemptId =
    patch.lastAttemptId !== undefined
      ? patch.lastAttemptId === ""
        ? null
        : patch.lastAttemptId
      : existing.lastAttemptId;

  const row = await db.adaptiveSequenceRun.update({
    where: { id: existing.id },
    data: {
      currentStepIndex,
      stepsJson: serializeSteps(steps),
      interventionHistoryJson: serializeInterventionHistory(interventionHistory),
      lastAttemptId,
    },
  });

  return toView(row);
}

/**
 * Phase 2G-6 — Optimistic cursor write.
 * Updates only when status is ACTIVE and currentStepIndex still matches the
 * expected value (stale concurrent writers get count 0).
 * Returns null when the expected cursor no longer matches.
 */
export async function updateAdaptiveSequenceRunStateIfCursorMatches(
  userId: string,
  runId: string,
  expectedCurrentStepIndex: number,
  patch: UpdateAdaptiveSequenceRunStateInput,
): Promise<AdaptiveSequenceRunView | null> {
  const existing = await db.adaptiveSequenceRun.findFirst({
    where: { id: runId, userId },
  });
  if (!existing) {
    throw new AdaptiveSequenceRunError(
      `AdaptiveSequenceRun not found or not owned: ${runId}`,
    );
  }
  if (existing.status !== "ACTIVE") {
    throw new AdaptiveSequenceRunError(
      `Cannot update state of a ${existing.status} run.`,
    );
  }
  if (existing.currentStepIndex !== expectedCurrentStepIndex) {
    return null;
  }

  const steps =
    patch.steps !== undefined
      ? normalizeIncomingSteps(patch.steps)
      : parseStepsJson(existing.stepsJson);

  if (patch.steps !== undefined) {
    await assertOwnedStepReferences(userId, steps);
  }

  const currentStepIndex =
    patch.currentStepIndex !== undefined
      ? patch.currentStepIndex
      : existing.currentStepIndex;
  assertValidCurrentStepIndex(currentStepIndex, steps.length);

  const interventionHistory =
    patch.interventionHistory !== undefined
      ? normalizeIncomingHistory(patch.interventionHistory)
      : parseInterventionHistoryJson(existing.interventionHistoryJson);

  const lastAttemptId =
    patch.lastAttemptId !== undefined
      ? patch.lastAttemptId === ""
        ? null
        : patch.lastAttemptId
      : existing.lastAttemptId;

  const result = await db.adaptiveSequenceRun.updateMany({
    where: {
      id: existing.id,
      userId,
      status: "ACTIVE",
      currentStepIndex: expectedCurrentStepIndex,
    },
    data: {
      currentStepIndex,
      stepsJson: serializeSteps(steps),
      interventionHistoryJson: serializeInterventionHistory(interventionHistory),
      lastAttemptId,
    },
  });

  if (result.count === 0) {
    return null;
  }

  const row = await db.adaptiveSequenceRun.findFirst({
    where: { id: existing.id, userId },
  });
  if (!row) return null;
  return toView(row);
}

export async function completeAdaptiveSequenceRun(
  userId: string,
  runId: string,
): Promise<AdaptiveSequenceRunView> {
  return transitionRunStatus(userId, runId, "COMPLETED");
}

export async function abandonAdaptiveSequenceRun(
  userId: string,
  runId: string,
): Promise<AdaptiveSequenceRunView> {
  return transitionRunStatus(userId, runId, "ABANDONED");
}

async function transitionRunStatus(
  userId: string,
  runId: string,
  next: "COMPLETED" | "ABANDONED",
): Promise<AdaptiveSequenceRunView> {
  // CAS: only ACTIVE runs transition. Concurrent completes → one winner.
  const result = await db.adaptiveSequenceRun.updateMany({
    where: { id: runId, userId, status: "ACTIVE" },
    data: { status: next },
  });

  const row = await db.adaptiveSequenceRun.findFirst({
    where: { id: runId, userId },
  });
  if (!row) {
    throw new AdaptiveSequenceRunError(
      `AdaptiveSequenceRun not found or not owned: ${runId}`,
    );
  }

  if (result.count === 0) {
    // Idempotent: already at target status (duplicate complete/abandon).
    if (row.status === next) {
      return toView(row);
    }
    throw new AdaptiveSequenceRunError(
      `Cannot transition ${row.status} → ${next}.`,
    );
  }

  return toView(row);
}

/**
 * Ownership-scoped delete of the run row only.
 * LearningAttempt rows are never cascaded (no FK on lastAttemptId).
 */
export async function deleteAdaptiveSequenceRun(
  userId: string,
  runId: string,
): Promise<boolean> {
  const existing = await db.adaptiveSequenceRun.findFirst({
    where: { id: runId, userId },
    select: { id: true },
  });
  if (!existing) return false;
  await db.adaptiveSequenceRun.delete({ where: { id: existing.id } });
  return true;
}
