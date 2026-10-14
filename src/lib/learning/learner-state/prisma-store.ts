/**
 * Phase 4A — Prisma persistence for Knowledge Library learner evidence/state.
 *
 * Separate from ULE LearningAttempt / ConceptMastery (those use Prisma Concept cuids).
 * conceptId here is a Knowledge Library string id (e.g. java-arraylist).
 */

import { db } from "@/lib/db";
import type { LearnerStateStore } from "@/lib/learning/learner-state/store";
import type {
  LearningEvidence,
  LearningEvidenceOutcome,
  LearningEvidenceType,
  LearnerConceptState,
} from "@/lib/learning/learner-state/types";

function parseMetadata(json: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function rowToEvidence(row: {
  id: string;
  userId: string;
  type: string;
  conceptId: string | null;
  domain: string | null;
  subject: string | null;
  outcome: string | null;
  occurredAt: Date;
  source: string | null;
  eventKey: string | null;
  metadataJson: string;
}): LearningEvidence {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as LearningEvidenceType,
    conceptId: row.conceptId ?? undefined,
    domain: row.domain ?? undefined,
    subject: row.subject ?? undefined,
    outcome: (row.outcome as LearningEvidenceOutcome | null) ?? undefined,
    occurredAt: row.occurredAt,
    source: row.source ?? undefined,
    eventKey: row.eventKey ?? undefined,
    metadata: parseMetadata(row.metadataJson),
  };
}

function rowToState(row: {
  userId: string;
  conceptId: string;
  exposureCount: number;
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  lastSeenAt: Date | null;
  lastOutcome: string | null;
}): LearnerConceptState {
  return {
    userId: row.userId,
    conceptId: row.conceptId,
    exposureCount: row.exposureCount,
    attemptCount: row.attemptCount,
    correctCount: row.correctCount,
    incorrectCount: row.incorrectCount,
    lastSeenAt: row.lastSeenAt ?? undefined,
    lastOutcome: row.lastOutcome ?? undefined,
  };
}

export function createPrismaLearnerStateStore(): LearnerStateStore {
  return {
    async findEvidenceByEventKey(userId, eventKey) {
      const row = await db.knowledgeConceptEvidence.findUnique({
        where: { userId_eventKey: { userId, eventKey } },
      });
      return row ? rowToEvidence(row) : null;
    },

    async appendEvidence(evidence) {
      await db.knowledgeConceptEvidence.create({
        data: {
          id: evidence.id,
          userId: evidence.userId,
          type: evidence.type,
          conceptId: evidence.conceptId ?? null,
          domain: evidence.domain ?? null,
          subject: evidence.subject ?? null,
          outcome: evidence.outcome ?? null,
          occurredAt: evidence.occurredAt,
          source: evidence.source ?? null,
          eventKey: evidence.eventKey ?? null,
          metadataJson: JSON.stringify(evidence.metadata ?? {}),
        },
      });
    },

    async listEvidenceForUser(userId) {
      const rows = await db.knowledgeConceptEvidence.findMany({
        where: { userId },
        orderBy: { occurredAt: "asc" },
      });
      return rows.map(rowToEvidence);
    },

    async listEvidenceForConcept(userId, conceptId) {
      const rows = await db.knowledgeConceptEvidence.findMany({
        where: { userId, conceptId },
        orderBy: { occurredAt: "asc" },
      });
      return rows.map(rowToEvidence);
    },

    async getConceptState(userId, conceptId) {
      const row = await db.knowledgeConceptState.findUnique({
        where: { userId_conceptId: { userId, conceptId } },
      });
      return row ? rowToState(row) : null;
    },

    async upsertConceptState(state) {
      await db.knowledgeConceptState.upsert({
        where: {
          userId_conceptId: {
            userId: state.userId,
            conceptId: state.conceptId,
          },
        },
        create: {
          userId: state.userId,
          conceptId: state.conceptId,
          exposureCount: state.exposureCount,
          attemptCount: state.attemptCount,
          correctCount: state.correctCount,
          incorrectCount: state.incorrectCount,
          lastSeenAt: state.lastSeenAt ?? null,
          lastOutcome: state.lastOutcome ?? null,
        },
        update: {
          exposureCount: state.exposureCount,
          attemptCount: state.attemptCount,
          correctCount: state.correctCount,
          incorrectCount: state.incorrectCount,
          lastSeenAt: state.lastSeenAt ?? null,
          lastOutcome: state.lastOutcome ?? null,
        },
      });
    },

    async listConceptStates(userId) {
      const rows = await db.knowledgeConceptState.findMany({
        where: { userId },
      });
      return rows.map(rowToState);
    },
  };
}
