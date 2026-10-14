/**
 * Phase 2G-49 — Assessment completion / outcome contract (inspection).
 *
 * Documents Quiz completion semantics and that Assessment does not own
 * execution, evidence, or Adaptive progression. No AssessmentAttempt table.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { isQuizAdaptiveCompletionEligible } from "@/lib/learning/sequence/quiz-submit-bind";
import { selectAuthoritativeQuizCompletionAttemptId } from "@/lib/learning/assessment/quiz-bridge";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-49 Assessment outcome contract (inspection)", () => {
  it("1–4. launch path does not create Attempt / evidence / mastery", () => {
    for (const file of [
      "src/lib/learning/assessment/activity-launch.ts",
      "src/lib/learning/assessment/standalone-assessment-consumer.ts",
    ]) {
      const source = read(file);
      expect(source).not.toMatch(
        /quizAttempt\.create|recordQuizAttemptEvidence|recordEvidence|applyEvidenceToMastery/,
      );
    }
  });

  it("5–8. Quiz submit = completion; score does not gate eligibility", () => {
    const submit = read("app/api/quizzes/[id]/submit/route.ts");
    expect(submit).toContain("quizAttempt.create");
    expect(submit).toContain("recordQuizAttemptEvidence");
    expect(submit).toContain("completedAt");

    // 0% / partial / full: eligibility ignores score (existing Adaptive gate).
    expect(
      isQuizAdaptiveCompletionEligible({
        questionCount: 2,
        gradedCount: 2,
        evidenceAttempts: [
          { attemptId: "a1", conceptId: "c", questionId: "q1" },
          { attemptId: "a2", conceptId: "c", questionId: "q2" },
        ],
      }).eligible,
    ).toBe(true);

    expect(
      isQuizAdaptiveCompletionEligible({
        questionCount: 2,
        gradedCount: 1,
        evidenceAttempts: [
          { attemptId: "a1", conceptId: "c", questionId: "q1" },
        ],
      }).eligible,
    ).toBe(false);
  });

  it("9–10. authoritative LearningAttempt selection uses concept + order (not score)", () => {
    expect(
      selectAuthoritativeQuizCompletionAttemptId({
        runConceptId: "concept-a",
        attempts: [
          { attemptId: "old", conceptId: "concept-a", questionId: "q1" },
          { attemptId: "new", conceptId: "concept-a", questionId: "q2" },
          { attemptId: "other", conceptId: "concept-b", questionId: "q3" },
        ],
      }),
    ).toBe("new");
  });

  it("11–15. Adaptive bind remains sole progression path; Assessment does not advance", () => {
    const bind = read("src/lib/learning/sequence/quiz-submit-bind.ts");
    expect(bind).toContain("bindQuizSubmitToAdaptiveSequence");
    expect(bind).toContain("recordQuizAdaptiveSequenceCompletionAndPlanNext");
    expect(bind).toContain("isQuizAdaptiveCompletionEligible");

    for (const file of [
      "src/lib/learning/assessment/activity-launch.ts",
      "src/lib/learning/assessment/standalone-assessment-consumer.ts",
      "src/lib/learning/assessment/workflow.ts",
    ]) {
      const source = read(file);
      expect(source).not.toMatch(
        /bindQuizSubmitToAdaptiveSequence|recordAdaptiveSequenceCompletion|lucky/i,
      );
    }
  });

  it("16–18. ownership: submit scopes Quiz to session user; Assessment voids client quizId", () => {
    const submit = read("app/api/quizzes/[id]/submit/route.ts");
    expect(submit).toMatch(/where:\s*\{\s*id,\s*userId:\s*user\.id/);

    const route = read("app/api/study/assessment/route.ts");
    expect(route).toContain("void body.quizId");
    expect(route).toContain("void body.learnerId");
  });

  it("no AssessmentAttempt / AssessmentResult persistence; design documents derivation", () => {
    const design = read(
      "src/lib/learning/assessment/ASSESSMENT_OUTCOME_CONTRACT.md",
    );
    expect(design).toContain("no production outcome persistence");
    expect(design).toContain("Launch ≠ Completion");
    expect(design).toContain("LearningAttempt");
    expect(design).toContain("quizAttemptId");
    expect(design).toContain("Do not add");

    for (const file of [
      "src/lib/learning/assessment/standalone-assessment-consumer.ts",
      "src/lib/learning/assessment/activity-launch.ts",
      "src/lib/learning/assessment/quiz-assessment-adapter.ts",
      "src/lib/learning/assessment/workflow.ts",
    ]) {
      expect(read(file)).not.toMatch(
        /AssessmentAttempt|AssessmentResult|AssessmentEvidence|AssessmentSession/,
      );
    }
  });
});
