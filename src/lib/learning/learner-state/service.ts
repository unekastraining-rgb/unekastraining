/**
 * Phase 4A — Learner State service.
 *
 * Accepts learning evidence → validates Knowledge Library concept identity →
 * persists evidence → derives/updates LearnerConceptState.
 *
 * Does NOT orchestrate next steps, invent mastery, or rewrite Lucky/ULE.
 */

import { randomUUID } from "node:crypto";

import { isRegisteredKnowledgeConceptId } from "@/lib/learning/learner-state/concept-identity";
import {
  applyEvidenceToState,
  emptyLearnerConceptState,
} from "@/lib/learning/learner-state/derive";
import {
  createMemoryLearnerStateStore,
  type LearnerStateStore,
} from "@/lib/learning/learner-state/store";
import type {
  LearningEvidence,
  LearningEvidenceInput,
  LearnerConceptState,
  LearnerState,
  RecordLearningEvidenceResult,
} from "@/lib/learning/learner-state/types";

export type LearnerStateService = {
  recordLearningEvidence(
    input: LearningEvidenceInput,
  ): Promise<RecordLearningEvidenceResult>;
  getLearnerConceptState(
    userId: string,
    conceptId: string,
  ): Promise<LearnerConceptState | null>;
  getLearnerState(userId: string): Promise<LearnerState>;
  /** Test/helper: list raw evidence for a user. */
  listEvidence(userId: string): Promise<LearningEvidence[]>;
};

export function createLearnerStateService(
  store: LearnerStateStore,
): LearnerStateService {
  return {
    async recordLearningEvidence(input) {
      if (!input.userId?.trim()) {
        return { recorded: false, reason: "userId_required" };
      }
      if (!input.type) {
        return { recorded: false, reason: "type_required" };
      }

      // Concept identity: supplied IDs must be Knowledge Library concepts
      // or Phase 7 general-topic identities (general:…). Unknown IDs rejected.
      const conceptId = input.conceptId?.trim() || undefined;
      if (conceptId && !isRegisteredKnowledgeConceptId(conceptId)) {
        return {
          recorded: false,
          reason: "unknown_concept_id",
        };
      }

      if (input.eventKey) {
        const existing = await store.findEvidenceByEventKey(
          input.userId,
          input.eventKey,
        );
        if (existing) {
          const conceptState = existing.conceptId
            ? await store.getConceptState(input.userId, existing.conceptId)
            : null;
          return {
            recorded: true,
            evidence: existing,
            conceptState,
            duplicate: true,
          };
        }
      }

      const evidence: LearningEvidence = {
        id: input.id?.trim() || randomUUID(),
        userId: input.userId,
        type: input.type,
        conceptId,
        domain: input.domain,
        subject: input.subject,
        outcome: input.outcome,
        occurredAt: input.occurredAt ?? new Date(),
        source: input.source,
        eventKey: input.eventKey,
        metadata: input.metadata,
      };

      await store.appendEvidence(evidence);

      let conceptState: LearnerConceptState | null = null;
      if (conceptId) {
        const prior =
          (await store.getConceptState(input.userId, conceptId)) ??
          emptyLearnerConceptState(input.userId, conceptId);
        applyEvidenceToState(prior, evidence);
        await store.upsertConceptState(prior);
        conceptState = prior;
      }

      return {
        recorded: true,
        evidence,
        conceptState,
        duplicate: false,
      };
    },

    async getLearnerConceptState(userId, conceptId) {
      if (!userId?.trim() || !conceptId?.trim()) return null;
      // Do not invent state for unknown concepts.
      if (!isRegisteredKnowledgeConceptId(conceptId)) return null;
      return store.getConceptState(userId, conceptId);
    },

    async getLearnerState(userId) {
      const concepts = userId?.trim()
        ? await store.listConceptStates(userId)
        : [];
      return { userId, concepts };
    },

    async listEvidence(userId) {
      if (!userId?.trim()) return [];
      return store.listEvidenceForUser(userId);
    },
  };
}

/** Default process-local memory store (tests + safe fallback). */
let defaultStore: LearnerStateStore = createMemoryLearnerStateStore();
let defaultService = createLearnerStateService(defaultStore);

/**
 * Replace the default store (tests). Returns the new service.
 */
export function setLearnerStateStoreForTests(
  store: LearnerStateStore,
): LearnerStateService {
  defaultStore = store;
  defaultService = createLearnerStateService(store);
  return defaultService;
}

/** Reset to a fresh memory store (tests). */
export function resetLearnerStateForTests(): LearnerStateService {
  return setLearnerStateStoreForTests(createMemoryLearnerStateStore());
}

export async function recordLearningEvidence(
  input: LearningEvidenceInput,
): Promise<RecordLearningEvidenceResult> {
  return defaultService.recordLearningEvidence(input);
}

export async function getLearnerConceptState(
  userId: string,
  conceptId: string,
): Promise<LearnerConceptState | null> {
  return defaultService.getLearnerConceptState(userId, conceptId);
}

export async function getLearnerState(userId: string): Promise<LearnerState> {
  return defaultService.getLearnerState(userId);
}

export async function listEvidence(
  userId: string,
): Promise<LearningEvidence[]> {
  return defaultService.listEvidence(userId);
}

/**
 * Prefer Prisma when available; fall back to memory if the client lacks models
 * (e.g. generate not yet run). Call once at app boot / first write.
 */
export async function usePrismaLearnerStateStore(): Promise<LearnerStateService> {
  try {
    const { createPrismaLearnerStateStore } = await import(
      "@/lib/learning/learner-state/prisma-store"
    );
    return setLearnerStateStoreForTests(createPrismaLearnerStateStore());
  } catch {
    return defaultService;
  }
}
