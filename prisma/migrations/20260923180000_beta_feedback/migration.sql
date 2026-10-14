-- Controlled beta feedback (additive). Not LearningAttempt / ConceptMastery.
CREATE TABLE IF NOT EXISTS "BetaFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "surface" TEXT,
    "activityRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BetaFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BetaFeedback_userId_createdAt_idx" ON "BetaFeedback"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "BetaFeedback_category_createdAt_idx" ON "BetaFeedback"("category", "createdAt");
