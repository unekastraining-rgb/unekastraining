-- Phase 2G-2: Adaptive Sequence Run (additive only)
-- Creates AdaptiveSequenceRun table + indexes. Does not alter LearningAttempt,
-- ConceptMastery, RetentionItem, LearningObject, StudySession, or Orchestrator tables.
-- lastAttemptId is a nullable scalar (no FK) so run delete cannot cascade to evidence.

CREATE TABLE "AdaptiveSequenceRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentStepIndex" INTEGER NOT NULL DEFAULT 0,
    "stepsJson" TEXT NOT NULL DEFAULT '[]',
    "interventionHistoryJson" TEXT NOT NULL DEFAULT '[]',
    "lastAttemptId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdaptiveSequenceRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AdaptiveSequenceRun_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AdaptiveSequenceRun_userId_idx" ON "AdaptiveSequenceRun"("userId");
CREATE INDEX "AdaptiveSequenceRun_conceptId_idx" ON "AdaptiveSequenceRun"("conceptId");
CREATE INDEX "AdaptiveSequenceRun_userId_status_idx" ON "AdaptiveSequenceRun"("userId", "status");
CREATE INDEX "AdaptiveSequenceRun_userId_conceptId_idx" ON "AdaptiveSequenceRun"("userId", "conceptId");
