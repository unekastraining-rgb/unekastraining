/**
 * Phase 2G-61 — Mastery Truth / TopicMastery Reconciliation (inspection).
 * Freezes claims from MASTERY_TRUTH_TOPIC_CONCEPT_RECONCILIATION.md.
 * No production behavior changes.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-61 Mastery Truth Topic/Concept Reconciliation (inspection)", () => {
  it("1. audit recommends Option B; ConceptMastery authoritative; no production migration", () => {
    const audit = read(
      "src/lib/learning/MASTERY_TRUTH_TOPIC_CONCEPT_RECONCILIATION.md",
    );
    expect(audit).toContain("Option B");
    expect(audit).toContain("legacy compatibility");
    expect(audit).toContain("ConceptMastery");
    expect(audit).toContain("TopicMastery");
    expect(audit).toContain("Divergent learner truth currently exists");
    expect(audit).toContain("**Yes**");
    expect(audit).toContain("No production changes");
    expect(audit).toContain("**PASS**");
    expect(audit).not.toMatch(/average TopicMastery and ConceptMastery/);
  });

  it("2. sole TopicMastery writer vs sole ConceptMastery writer", () => {
    const topicWriter = read("src/lib/quizzes/mastery.ts");
    expect(topicWriter).toContain("updateTopicMastery");
    expect(topicWriter).toContain("db.topicMastery.upsert");
    expect(topicWriter).toContain("understanding");
    expect(topicWriter).toContain("application");

    const conceptWriter = read("src/lib/learning/mastery/apply.ts");
    expect(conceptWriter).toContain("applyEvidenceToMastery");
    expect(conceptWriter).toContain("db.conceptMastery.upsert");
    expect(conceptWriter).toContain("Does not replace TopicMastery");

    const schema = read("prisma/schema.prisma");
    expect(schema).toMatch(/model TopicMastery[\s\S]*understanding/);
    expect(schema).toMatch(/model ConceptMastery[\s\S]*recognize[\s\S]*perform/);
    expect(schema).toMatch(/model Topic[\s\S]*conceptId\s+String\?/);
  });

  it("3. dual-write and single-write production paths exist", () => {
    const quizSubmit = read("app/api/quizzes/[id]/submit/route.ts");
    expect(quizSubmit).toMatch(/updateMasteryFromQuiz|updateTopicMastery/);
    expect(quizSubmit).toContain("recordQuizAttemptEvidence");

    const flash = read("app/api/flashcards/route.ts");
    expect(flash).toContain("updateTopicMasteryFromReview");
    expect(flash).toContain("recordFlashcardReviewEvidence");

    const evaluate = read("app/api/study/evaluate/route.ts");
    expect(evaluate).toContain("updateTopicMastery");
    expect(evaluate).toContain("recordStudyEvaluateEvidence");

    const tutorEv = read("src/lib/learning/tutor/evidence.ts");
    expect(tutorEv).toContain("applyEvidenceToMastery");
    expect(tutorEv).not.toMatch(/updateTopicMastery/);

    const retention = read("src/lib/learning/retention/review.ts");
    expect(retention).toContain("applyEvidenceToMastery");
    expect(retention).not.toMatch(/updateTopicMastery/);

    const codeEval = read("app/api/study/code-evaluate/route.ts");
    expect(codeEval).toContain("updateTopicMastery");
    expect(codeEval).not.toMatch(/recordEvidence|applyEvidenceToMastery/);
  });

  it("4. Orchestrator/Tutor prefer ConceptMastery; MasteryTree is TopicMastery", () => {
    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("effectiveFacetsForOrchestration");
    expect(diagnose).toContain("usedTopicMasteryFallback");
    expect(diagnose).toContain("Prefer ULE ConceptMastery");

    const readModel = read("src/lib/learning/learner-model/read.ts");
    expect(readModel).toContain("conceptMastery.findUnique");
    expect(readModel).toContain("masteries");
    expect(readModel).toContain("topicMasteryRow");

    const masteryApi = read("app/api/mastery/route.ts");
    expect(masteryApi).toContain("masteries");
    expect(masteryApi).not.toMatch(/conceptMastery|getLearnerConceptMastery/);

    const tutorCtx = read("src/lib/learning/tutor/context.ts");
    expect(tutorCtx).toContain("getLearnerConceptMastery");
  });

  it("5. ensureConceptForTopic is additive optional mapping", () => {
    const concept = read("src/lib/learning/knowledge/concept.ts");
    expect(concept).toContain("ensureConceptForTopic");
    expect(concept).toContain("Map Topic → Concept (additive)");
    expect(concept).toContain("conceptId");
  });
});
