-- Phase 2E-2: Concept Relationship Foundation (additive only)
-- Creates ConceptRelationship table + indexes. Does not alter Concept,
-- LearningObject, Topic, Note, mastery, or retention tables.

CREATE TABLE "ConceptRelationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fromConceptId" TEXT NOT NULL,
    "toConceptId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "confidence" REAL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConceptRelationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConceptRelationship_fromConceptId_fkey" FOREIGN KEY ("fromConceptId") REFERENCES "Concept" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConceptRelationship_toConceptId_fkey" FOREIGN KEY ("toConceptId") REFERENCES "Concept" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ConceptRelationship_userId_fromConceptId_toConceptId_type_key" ON "ConceptRelationship"("userId", "fromConceptId", "toConceptId", "type");
CREATE INDEX "ConceptRelationship_userId_idx" ON "ConceptRelationship"("userId");
CREATE INDEX "ConceptRelationship_fromConceptId_idx" ON "ConceptRelationship"("fromConceptId");
CREATE INDEX "ConceptRelationship_toConceptId_idx" ON "ConceptRelationship"("toConceptId");
CREATE INDEX "ConceptRelationship_userId_type_idx" ON "ConceptRelationship"("userId", "type");
CREATE INDEX "ConceptRelationship_userId_fromConceptId_type_idx" ON "ConceptRelationship"("userId", "fromConceptId", "type");
CREATE INDEX "ConceptRelationship_userId_toConceptId_type_idx" ON "ConceptRelationship"("userId", "toConceptId", "type");
