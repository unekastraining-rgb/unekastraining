/**
 * 2P-29 — resolveUniversalLearnerContext (read-only).
 * Reuses existing resolvers. Never writes. Never diagnoses. Never scores.
 */

import { db } from "@/lib/db";
import { parseLearningIntent } from "@/lib/learning/intent/parse";
import { projectLearnerConceptState } from "@/lib/learning/learner-model/project";
import { resolveLearningMaterialContext } from "@/lib/learning/material-context";
import {
  normalizeLearningDecisionContext,
  type LearningDecisionContext,
} from "@/lib/learning/orchestrator/context";
import {
  resolvePersonaPresentationHooks,
  type PersonaPresentationHooks,
} from "@/lib/learning/persona-accessibility-hooks";
import { listActiveAdaptiveSequenceRuns } from "@/lib/learning/sequence/coordinator";
import type { TeachingStyle } from "@/lib/learning/tutor/teaching-style/types";

import type {
  ResolveUniversalLearnerContextInput,
  UniversalLearnerContext,
} from "./types";

function recentActivityLabel(totalAttempts: number): string | null {
  if (totalAttempts <= 0) return null;
  if (totalAttempts === 1) return "Recently practiced once on this concept.";
  return `Recently practiced ${totalAttempts} times on this concept.`;
}

async function resolveOwnedLearningSpace(
  learnerId: string,
  learningSpaceId: string | null | undefined,
): Promise<UniversalLearnerContext["learningSpace"]> {
  const id = learningSpaceId?.trim();
  if (!id) return null;
  const space = await db.learningSpace.findFirst({
    where: { id, userId: learnerId },
    select: {
      id: true,
      title: true,
      subjectDomain: true,
      kind: true,
    },
  });
  if (!space) return null;
  return {
    id: space.id,
    title: space.title,
    subjectDomain: space.subjectDomain,
    kind: space.kind,
  };
}

async function resolvePersona(
  learnerId: string,
  include: boolean,
): Promise<PersonaPresentationHooks | null> {
  if (!include) return null;
  try {
    const profile = await db.learnerProfile.findUnique({
      where: { userId: learnerId },
      select: {
        modalityPreferencesJson: true,
        accessibilityPreferencesJson: true,
      },
    });
    if (!profile) return null;
    return resolvePersonaPresentationHooks({
      modalityPreferencesJson: profile.modalityPreferencesJson,
      accessibilityPreferencesJson: profile.accessibilityPreferencesJson,
    });
  } catch {
    return null;
  }
}

/**
 * Read-only Universal Learner Context.
 * Ownership: only resources owned by `learnerId` are included.
 * Client learnerId must never replace session identity at the API boundary.
 */
export async function resolveUniversalLearnerContext(
  input: ResolveUniversalLearnerContextInput,
): Promise<UniversalLearnerContext> {
  const learnerId = input.learnerId.trim();
  const conceptId = input.conceptId?.trim() || null;
  const includeMaterial = input.includeMaterial !== false;
  const includeActiveRun = input.includeActiveRun !== false;
  const includePersona = input.includePersonaHooks === true;

  const intentParsed =
    input.intent === undefined
      ? undefined
      : parseLearningIntent(input.intent);

  let concept = null as Awaited<ReturnType<typeof projectLearnerConceptState>>;
  if (conceptId) {
    concept = await projectLearnerConceptState(learnerId, conceptId);
  }

  // Concept ownership gate: foreign conceptId → treat as absent (no leak).
  const ownedConceptId = concept?.conceptId ?? null;

  let material = null as UniversalLearnerContext["material"];
  if (includeMaterial && (input.materialId || ownedConceptId)) {
    try {
      const resolved = await resolveLearningMaterialContext({
        userId: learnerId,
        conceptId: ownedConceptId,
        explicitMaterialId: input.materialId ?? null,
      });
      material = resolved.context;
    } catch {
      material = null;
    }
  }

  let learningSpaceIdHint = input.learningSpaceId ?? null;
  if (!learningSpaceIdHint && ownedConceptId) {
    const row = await db.concept.findFirst({
      where: { id: ownedConceptId, userId: learnerId },
      select: { learningSpaceId: true },
    });
    learningSpaceIdHint = row?.learningSpaceId ?? null;
  }

  const learningSpace = await resolveOwnedLearningSpace(
    learnerId,
    learningSpaceIdHint,
  );

  let activeLearning: UniversalLearnerContext["activeLearning"] = null;
  if (includeActiveRun) {
    if (concept?.activeAdaptiveRun) {
      activeLearning = {
        runId: concept.activeAdaptiveRun.runId,
        conceptId: ownedConceptId!,
        status: concept.activeAdaptiveRun.status,
        currentStepIndex: concept.activeAdaptiveRun.currentStepIndex,
      };
    } else if (ownedConceptId) {
      try {
        const runs = await listActiveAdaptiveSequenceRuns(
          learnerId,
          ownedConceptId,
        );
        const run = runs[0];
        if (run) {
          activeLearning = {
            runId: run.id,
            conceptId: ownedConceptId,
            status: run.status,
            currentStepIndex: run.currentStepIndex,
          };
        }
      } catch {
        activeLearning = null;
      }
    }
  }

  const persona = await resolvePersona(learnerId, includePersona);

  const teachingStyle: TeachingStyle | null =
    input.teachingStyle === undefined ? null : input.teachingStyle;

  const decisionContext: LearningDecisionContext =
    normalizeLearningDecisionContext({
      intent: intentParsed,
      conceptId: ownedConceptId,
      learningSpaceId: learningSpace?.id ?? null,
    });

  const totalAttempts = concept?.recentActivity.totalAttempts ?? 0;

  return {
    learnerId,
    resolvedAt: new Date().toISOString(),
    createsEvidence: false,
    createsMastery: false,
    concept,
    learningSpace,
    material,
    intent: intentParsed === undefined ? undefined : intentParsed,
    teachingStyle,
    preferences: includePersona ? { persona } : undefined,
    activeLearning,
    recentActivitySummary: concept
      ? {
          totalAttempts,
          label: recentActivityLabel(totalAttempts),
        }
      : null,
    decisionContext,
  };
}

/**
 * Map Universal Learner Context → Orchestrator options (contextual only).
 * Does not invent diagnosis — callers still invoke orchestrate separately.
 */
export function toOrchestrateDecisionContextOptions(
  ctx: UniversalLearnerContext,
): {
  decisionContext: LearningDecisionContext;
} {
  return {
    decisionContext: ctx.decisionContext ?? {},
  };
}
