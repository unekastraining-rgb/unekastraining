/**
 * Phase 2G-55 — Universal Activity Vertical Integration Audit (inspection).
 * Freezes architectural claims from UNIVERSAL_ACTIVITY_VERTICAL_AUDIT.md.
 * No production behavior changes.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createAssessmentAdapterRegistry } from "@/lib/learning/assessment/adapter-registry";
import { createAssessmentAdapterRegistryWithFlashcard } from "@/lib/learning/assessment/flashcard-assessment-adapter";
import { createAssessmentAdapterRegistryWithQuiz } from "@/lib/learning/assessment/quiz-assessment-adapter";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-55 Universal Activity Vertical Integration (inspection)", () => {
  it("1. audit artifact exists with NO CONTRADICTION verdict", () => {
    const audit = read(
      "src/lib/learning/assessment/UNIVERSAL_ACTIVITY_VERTICAL_AUDIT.md",
    );
    expect(audit).toContain("NO CONTRADICTION that blocks the Universal Learning Engine");
    expect(audit).toContain("No production code changes");
    expect(audit).toContain("shared contracts, not identical implementations");
    expect(audit).toContain("CORE→SIX→LUCKY");
    expect(audit).toContain("2G-54 soft-fail");
  });

  it("2. three Adaptive-capable activities share one coordinator; Assessment adapters are Quiz+Flashcard only", () => {
    expect(createAssessmentAdapterRegistry().list()).toHaveLength(0);
    expect(
      createAssessmentAdapterRegistryWithQuiz().list().map((a) => a.key),
    ).toEqual(["quiz"]);
    expect(
      createAssessmentAdapterRegistryWithFlashcard().list().map((a) => a.key),
    ).toEqual(["flashcard"]);

    const seq = read("src/lib/learning/sequence/index.ts");
    expect(seq).toContain("quiz-adapter");
    expect(seq).toContain("six-adapter");
    expect(seq).toContain("flashcard-adapter");
    expect(seq).toContain("recordAdaptiveSequenceCompletionAndPlanNext");

    expect(
      read("src/lib/learning/assessment/adapter-registry.ts"),
    ).not.toMatch(/six|SIX/);
  });

  it("3. evidence spine: producers write LearningAttempt; Assessment/Adaptive adapters do not", () => {
    for (const file of [
      "src/lib/learning/assessment/quiz-bridge.ts",
      "src/lib/learning/assessment/flashcard-bridge.ts",
      "src/lib/learning/assessment/evaluate-bridge.ts",
      "src/lib/learning/tutor/evidence.ts",
    ]) {
      const src = read(file);
      expect(src).toContain("recordEvidence");
      expect(src).toContain("applyEvidenceToMastery");
    }

    for (const file of [
      "src/lib/learning/assessment/quiz-assessment-adapter.ts",
      "src/lib/learning/assessment/flashcard-assessment-adapter.ts",
      "src/lib/learning/sequence/quiz-adapter.ts",
      "src/lib/learning/sequence/six-adapter.ts",
      "src/lib/learning/sequence/flashcard-adapter.ts",
      "src/lib/learning/sequence/coordinator.ts",
    ]) {
      const src = read(file);
      expect(src).not.toMatch(/recordEvidence\(|applyEvidenceToMastery\(/);
    }
  });

  it("4. completion ≠ evidence ≠ progression: binds sit after evidence writers", () => {
    const quizSubmit = read("app/api/quizzes/[id]/submit/route.ts");
    expect(quizSubmit.indexOf("recordQuizAttemptEvidence")).toBeLessThan(
      quizSubmit.indexOf("bindQuizSubmitToAdaptiveSequence"),
    );

    const flashPatch = read("app/api/flashcards/route.ts");
    expect(flashPatch.indexOf("recordFlashcardReviewEvidence")).toBeLessThan(
      flashPatch.indexOf("bindFlashcardReviewToAdaptiveSequence"),
    );
    expect(flashPatch).toContain("void body.complete");
    expect(flashPatch).toMatch(/review still saved/);

    const evaluate = read("app/api/study/evaluate/route.ts");
    expect(evaluate).toContain("recordStudyEvaluateEvidence");
    expect(evaluate).toContain("bindSixEvaluateAttemptToAdaptiveSequence");
  });

  it("5. facet mappings and intentional boundaries frozen", () => {
    expect(read("src/lib/learning/assessment/quiz-bridge.ts")).toContain(
      'skillFacet: "RECOGNIZE"',
    );
    expect(read("src/lib/learning/assessment/flashcard-bridge.ts")).toContain(
      'skillFacet: "RETAIN"',
    );
    expect(
      read("src/lib/learning/assessment/flashcard-assessment-adapter.ts"),
    ).toContain("PRACTICE_CHECK");

    const core = read("src/lib/learning/knowledge/core-bridge.ts");
    expect(core).not.toMatch(/AssessmentAdapter|activityRef/);
    expect(read("src/lib/learning/tutor/evidence.ts")).toContain(
      "shouldRecordTutorEvidence",
    );

    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("flashcard");
    expect(diagnose).not.toMatch(/sixComponent:\s*"flashcard"/);
  });

  it("6. Flashcard evidence visible to Learner Model source counts", () => {
    const readModel = read("src/lib/learning/learner-model/read.ts");
    expect(readModel).toContain("classifyEvidenceSourceKind");
    expect(readModel).toContain('kind === "flashcard"');
    const aggregate = read("src/lib/learning/evidence/aggregate.ts");
    expect(aggregate).toContain("flashcard_review");
    expect(aggregate).toContain('return "flashcard"');
  });

  it("7. LUCKY handoff remains coordinator-owned on sequence COMPLETE", () => {
    const coord = read("src/lib/learning/sequence/coordinator.ts");
    expect(coord).toContain("syncLuckyRetentionAfterSequenceComplete");
    const handoff = read("src/lib/learning/sequence/lucky-handoff.ts");
    expect(handoff).toContain("syncWeakMasteryRetentionItem");
    expect(handoff).not.toMatch(/Flashcard\.create|createFlashcard/);
  });

  it("8. recommended next action is not another adapter by default", () => {
    const audit = read(
      "src/lib/learning/assessment/UNIVERSAL_ACTIVITY_VERTICAL_AUDIT.md",
    );
    expect(audit).toContain(
      "Do not implement another activity adapter next by default",
    );
  });
});
