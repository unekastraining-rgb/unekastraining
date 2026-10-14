/**
 * Phase 4A — Ensure learner-state writes use Prisma when tables are ready.
 * Falls back to in-memory if generate/migrate has not been applied yet.
 */

import {
  createLearnerStateService,
  setLearnerStateStoreForTests,
  type LearnerStateService,
} from "@/lib/learning/learner-state/service";
import { createMemoryLearnerStateStore } from "@/lib/learning/learner-state/store";

let ready: Promise<LearnerStateService> | null = null;

export function ensureLearnerStatePersistence(): Promise<LearnerStateService> {
  if (!ready) {
    ready = (async () => {
      try {
        const { db } = await import("@/lib/db");
        const evidenceDelegate = (
          db as {
            knowledgeConceptEvidence?: {
              findFirst: (args?: unknown) => Promise<unknown>;
            };
          }
        ).knowledgeConceptEvidence;
        if (!evidenceDelegate?.findFirst) {
          return setLearnerStateStoreForTests(createMemoryLearnerStateStore());
        }
        // Probe that the Phase 4A tables exist (migrate/push may not have run).
        await evidenceDelegate.findFirst({ take: 1 });
        const { createPrismaLearnerStateStore } = await import(
          "@/lib/learning/learner-state/prisma-store"
        );
        return setLearnerStateStoreForTests(createPrismaLearnerStateStore());
      } catch {
        // Reset so a later request can retry after migrate.
        ready = null;
        return setLearnerStateStoreForTests(createMemoryLearnerStateStore());
      }
    })();
  }
  return ready;
}

/** Test helper — clear the cached persistence promise. */
export function resetLearnerStatePersistenceCache(): void {
  ready = null;
}
