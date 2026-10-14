/**
 * Phase 4A — Persistence abstraction for Knowledge Library learner state.
 */

import type {
  LearningEvidence,
  LearnerConceptState,
} from "@/lib/learning/learner-state/types";

export interface LearnerStateStore {
  findEvidenceByEventKey(
    userId: string,
    eventKey: string,
  ): Promise<LearningEvidence | null>;

  appendEvidence(evidence: LearningEvidence): Promise<void>;

  listEvidenceForUser(userId: string): Promise<LearningEvidence[]>;

  listEvidenceForConcept(
    userId: string,
    conceptId: string,
  ): Promise<LearningEvidence[]>;

  getConceptState(
    userId: string,
    conceptId: string,
  ): Promise<LearnerConceptState | null>;

  upsertConceptState(state: LearnerConceptState): Promise<void>;

  listConceptStates(userId: string): Promise<LearnerConceptState[]>;
}

function cloneEvidence(e: LearningEvidence): LearningEvidence {
  return {
    ...e,
    occurredAt: new Date(e.occurredAt),
    metadata: e.metadata ? { ...e.metadata } : undefined,
  };
}

function cloneState(s: LearnerConceptState): LearnerConceptState {
  return {
    ...s,
    lastSeenAt: s.lastSeenAt ? new Date(s.lastSeenAt) : undefined,
  };
}

/** Deterministic in-memory store — used by tests and as fallback. */
export function createMemoryLearnerStateStore(): LearnerStateStore {
  const evidence: LearningEvidence[] = [];
  const states = new Map<string, LearnerConceptState>();

  const stateKey = (userId: string, conceptId: string) =>
    `${userId}::${conceptId}`;

  return {
    async findEvidenceByEventKey(userId, eventKey) {
      const found = evidence.find(
        (e) => e.userId === userId && e.eventKey === eventKey,
      );
      return found ? cloneEvidence(found) : null;
    },

    async appendEvidence(row) {
      evidence.push(cloneEvidence(row));
    },

    async listEvidenceForUser(userId) {
      return evidence
        .filter((e) => e.userId === userId)
        .map(cloneEvidence)
        .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    },

    async listEvidenceForConcept(userId, conceptId) {
      return evidence
        .filter((e) => e.userId === userId && e.conceptId === conceptId)
        .map(cloneEvidence)
        .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    },

    async getConceptState(userId, conceptId) {
      const s = states.get(stateKey(userId, conceptId));
      return s ? cloneState(s) : null;
    },

    async upsertConceptState(state) {
      states.set(stateKey(state.userId, state.conceptId), cloneState(state));
    },

    async listConceptStates(userId) {
      return [...states.values()]
        .filter((s) => s.userId === userId)
        .map(cloneState);
    },
  };
}
