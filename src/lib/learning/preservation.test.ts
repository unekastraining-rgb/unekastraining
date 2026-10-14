import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("ULE quiz submit preservation", () => {
  it("keeps existing TopicMastery quiz update and isolates ULE bridge errors", () => {
    const submitPath = path.join(
      process.cwd(),
      "app/api/quizzes/[id]/submit/route.ts",
    );
    const source = readFileSync(submitPath, "utf8");

    expect(source).toContain("updateMasteryFromQuiz");
    expect(source).toContain("missedQuestion.create");
    expect(source).toContain("recordQuizAttemptEvidence");
    expect(source).toContain("ULE quiz evidence bridge failed");
    // Scoring response shape unchanged
    expect(source).toContain("correctAnswer: parseAnswer(item.correctAnswer)");
  });

  it("does not remove CORE Note.contentJson or TopicMastery from schema", () => {
    const schema = readFileSync(
      path.join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).toContain("model Note");
    expect(schema).toContain("contentJson");
    expect(schema).toContain("model TopicMastery");
    expect(schema).toContain("model MissedQuestion");
    expect(schema).toContain("model Topic");
    expect(schema).toContain("model Course");
    expect(schema).toContain("model LearnerProfile");
    expect(schema).toContain("model LearningSpace");
    expect(schema).toContain("model Concept");
    expect(schema).toContain("model LearningObject");
    expect(schema).toContain("model LearningAttempt");
    expect(schema).toContain("model ConceptMastery");
    expect(schema).toContain("model ConceptRelationship");
    expect(schema).toContain("enum ConceptRelationshipType");
  });

  it("Orchestrator is additive under src/lib/learning/orchestrator", () => {
    const orch = readFileSync(
      path.join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    expect(orch).toContain("orchestrateFromLearnerState");
    expect(orch).not.toMatch(/db\.(flashcard|quiz|topicMastery)\.(update|delete)/);
  });
});
