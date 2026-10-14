/**
 * Phase 2G-48 — Assessment → evidence return boundary (inspection/regression).
 *
 * Documents that Assessment-launched Quiz reuses the existing Quiz evidence spine.
 * No new AssessmentAttempt / AssessmentEvidence / second bridge.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { launchAssessmentActivity } from "@/lib/learning/assessment/activity-launch";
import {
  QUIZ_ACTIVITY_REF_KIND,
  QUIZ_ASSESSMENT_ADAPTER_KEY,
} from "@/lib/learning/assessment/quiz-assessment-adapter";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-48 Assessment activity → evidence return (inspection)", () => {
  it("1–4. existing Quiz submit still owns evidence + mastery via quiz-bridge", () => {
    const submit = read("app/api/quizzes/[id]/submit/route.ts");
    expect(submit).toContain("recordQuizAttemptEvidence");
    expect(submit).toContain("updateMasteryFromQuiz");
    expect(submit).toContain("bindQuizSubmitToAdaptiveSequence");
    expect(submit).toContain("userId: user.id");
    expect(submit).not.toContain("runStandaloneAssessmentConsumer");
    expect(submit).not.toContain("AssessmentAttempt");
  });

  it("5–8. Assessment launch preserves Quiz route + adaptive query; does not create Attempt", async () => {
    const result = await launchAssessmentActivity({
      descriptor: {
        adapterKey: QUIZ_ASSESSMENT_ADAPTER_KEY,
        activityType: "QUIZ_ITEM",
        conceptId: "concept-1",
        learnerId: "user-1",
        activityRef: { kind: QUIZ_ACTIVITY_REF_KIND, id: "quiz-9" },
        adaptive: { runId: "run-48", stepIndex: 1 },
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.launch.href).toBe(
      "/quizzes/quiz-9?adaptiveRunId=run-48&adaptiveStep=1",
    );

    const launchSrc = read("src/lib/learning/assessment/activity-launch.ts");
    const consumerSrc = read(
      "src/lib/learning/assessment/standalone-assessment-consumer.ts",
    );
    for (const source of [launchSrc, consumerSrc]) {
      expect(source).not.toMatch(
        /recordQuizAttemptEvidence|recordEvidence|applyEvidenceToMastery|QuizAttempt\.create|LearningAttempt/,
      );
    }
  });

  it("9–12. QuizTaker forwards adaptive context; open/launch does not bind Adaptive", () => {
    const taker = read("app/quizzes/[id]/quiz-taker.tsx");
    expect(taker).toContain("adaptiveRunId");
    expect(taker).toContain("adaptiveStep");
    expect(taker).toContain("adaptiveRunId,");
    expect(taker).not.toContain("bindQuizSubmitToAdaptiveSequence");
    expect(taker).not.toContain("recordAdaptiveSequenceCompletion");

    const bind = read("src/lib/learning/sequence/quiz-submit-bind.ts");
    expect(bind).toContain("parseAdaptiveRunId");
    expect(bind).toContain("selectAuthoritativeQuizCompletionAttemptId");
    expect(bind).toContain("recordQuizAdaptiveSequenceCompletionAndPlanNext");
  });

  it("13–15. ownership: submit requires session-owned Quiz; Assessment voids client quizId", () => {
    const submit = read("app/api/quizzes/[id]/submit/route.ts");
    expect(submit).toMatch(/where:\s*\{\s*id,\s*userId:\s*user\.id/);

    const route = read("app/api/study/assessment/route.ts");
    expect(route).toContain("void body.quizId");
  });

  it("no duplicate AssessmentAttempt / AssessmentEvidence / second spine", () => {
    const design = read(
      "src/lib/learning/assessment/EVIDENCE_RETURN_BOUNDARY.md",
    );
    expect(design).toContain("no production bridge added");
    expect(design).toContain("LearningAttempt");
    expect(design).toContain("ASSESS ≠ QUIZ");

    const assessmentDir = [
      "src/lib/learning/assessment/standalone-assessment-consumer.ts",
      "src/lib/learning/assessment/activity-launch.ts",
      "src/lib/learning/assessment/quiz-assessment-adapter.ts",
      "src/lib/learning/assessment/workflow.ts",
    ];
    for (const file of assessmentDir) {
      const source = read(file);
      expect(source).not.toMatch(/AssessmentAttempt|AssessmentEvidence/);
      expect(source).not.toMatch(/model Assessment/);
    }

    expect(read("src/lib/learning/assessment/quiz-bridge.ts")).toContain(
      "recordEvidence",
    );
    expect(read("src/lib/learning/assessment/quiz-bridge.ts")).toContain(
      "applyEvidenceToMastery",
    );
  });
});
