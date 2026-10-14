/**
 * Phase 2G-51 — Universal Activity Adapter Convergence Audit (inspection).
 *
 * Freezes inventory + contract facts from ACTIVITY_ADAPTER_CONVERGENCE_AUDIT.md.
 * No production bridge/adapters added in this phase.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { LEARNING_OBJECT_TYPES } from "@/lib/learning/types";
import { createAssessmentAdapterRegistry } from "@/lib/learning/assessment/adapter-registry";
import {
  QUIZ_ASSESSMENT_ADAPTER_KEY,
  createAssessmentAdapterRegistryWithQuiz,
} from "@/lib/learning/assessment/quiz-assessment-adapter";
import { SIX_ACTIVITIES } from "@/lib/csl/six";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-51 Universal Activity Adapter Convergence (inspection)", () => {
  it("1. audit artifact exists and prefers no production change", () => {
    const audit = read(
      "src/lib/learning/assessment/ACTIVITY_ADAPTER_CONVERGENCE_AUDIT.md",
    );
    expect(audit).toContain("NO PRODUCTION CHANGES REQUIRED");
    expect(audit).toContain("Universal architecture ≠ identical implementation");
    expect(audit).toContain("CORE → SIX → LUCKY");
    expect(audit).toContain("ASSESS ≠ QUIZ");
  });

  it("2. LO type inventory matches types.ts — reserved future types are identifiers only", () => {
    expect(LEARNING_OBJECT_TYPES).toContain("QUIZ_ITEM");
    expect(LEARNING_OBJECT_TYPES).toContain("FLASHCARD");
    expect(LEARNING_OBJECT_TYPES).toContain("TUTOR_TURN");
    expect(LEARNING_OBJECT_TYPES).toContain("RETENTION_ITEM");
    for (const reserved of [
      "CODING_CHALLENGE",
      "SQL_CHALLENGE",
      "SIMULATION",
      "GAME",
      "WRITING_EXERCISE",
      "PROJECT_TASK",
      "PRESENTATION_PRACTICE",
      "LAB",
    ] as const) {
      expect(LEARNING_OBJECT_TYPES).toContain(reserved);
    }
  });

  it("3. Quiz and Flashcard are opt-in AssessmentAdapters; empty registry stays empty", () => {
    expect(createAssessmentAdapterRegistry().list()).toHaveLength(0);
    const withQuiz = createAssessmentAdapterRegistryWithQuiz();
    expect(withQuiz.list().map((a) => a.key)).toEqual([
      QUIZ_ASSESSMENT_ADAPTER_KEY,
    ]);

    const quizAdapter = read(
      "src/lib/learning/assessment/quiz-assessment-adapter.ts",
    );
    expect(quizAdapter).not.toMatch(
      /registerSixAssessmentAdapter|CODING_CHALLENGE.*AssessmentAdapter/,
    );
    expect(
      read("src/lib/learning/assessment/adapter-registry.ts"),
    ).not.toMatch(/registerSixAssessmentAdapter/);
    // Flashcard AssessmentAdapter is a later opt-in (2G-53) — not in empty registry.
    expect(
      read("src/lib/learning/assessment/flashcard-assessment-adapter.ts"),
    ).toContain("createFlashcardAssessmentAdapter");
  });

  it("4. Adaptive adapters exist for Quiz + SIX + Flashcard (not coding)", () => {
    expect(read("src/lib/learning/sequence/quiz-adapter.ts")).toContain(
      "findOwnedQuizForConcept",
    );
    expect(read("src/lib/learning/sequence/six-adapter.ts")).toContain(
      "resolveSixSequenceStep",
    );
    expect(read("src/lib/learning/sequence/flashcard-adapter.ts")).toContain(
      "resolveOwnedFlashcardSequenceStep",
    );
    expect(SIX_ACTIVITIES.map((a) => a.id)).toEqual([
      "chunking",
      "detailed-explanation",
      "feynman",
      "visualization",
      "hands-on-practice",
      "active-recall",
    ]);

    const sequenceIndex = read("src/lib/learning/sequence/index.ts");
    expect(sequenceIndex).toContain("quiz-adapter");
    expect(sequenceIndex).toContain("six-adapter");
    expect(sequenceIndex).toContain("flashcard-adapter");
    expect(sequenceIndex).not.toMatch(/coding-adapter/);
  });

  it("5. evidence producers remain activity-owned on one LearningAttempt spine", () => {
    expect(read("src/lib/learning/assessment/quiz-bridge.ts")).toContain(
      "recordEvidence",
    );
    expect(read("src/lib/learning/assessment/flashcard-bridge.ts")).toContain(
      "skillFacet: \"RETAIN\"",
    );
    expect(read("src/lib/learning/assessment/evaluate-bridge.ts")).toContain(
      "recordStudyEvaluateEvidence",
    );
    expect(read("src/lib/learning/tutor/evidence.ts")).toContain(
      "maybeRecordTutorEvidence",
    );
    expect(read("src/lib/learning/evidence/record.ts")).toContain(
      "db.learningAttempt.create",
    );

    const quizAssessment = read(
      "src/lib/learning/assessment/quiz-assessment-adapter.ts",
    );
    expect(quizAssessment).not.toMatch(
      /recordEvidence|applyEvidenceToMastery|recordQuizAttemptEvidence/,
    );
  });

  it("6. CORE is knowledge/assist host — not an AssessmentAdapter; Tutor is not launchable adapter", () => {
    const coreBridge = read("src/lib/learning/knowledge/core-bridge.ts");
    expect(coreBridge).toContain("extractKnowledgeCandidatesFromStudyExtract");
    expect(coreBridge).not.toMatch(/AssessmentAdapter|activityRef/);

    const coreAssist = read("src/lib/learning/tutor/core-adapter.ts");
    expect(coreAssist).toContain("buildCoreAssistUserPayload");
    expect(coreAssist).not.toMatch(/canHandle\(|prepareAssessmentActivity/);

    const tutorEvidence = read("src/lib/learning/tutor/evidence.ts");
    expect(tutorEvidence).toContain("TUTOR_TURN");
    expect(tutorEvidence).toContain("shouldRecordTutorEvidence");
  });

  it("7. Quiz reference identity pattern (2G-45) remains opaque activityRef", () => {
    const adapter = read(
      "src/lib/learning/assessment/quiz-assessment-adapter.ts",
    );
    expect(adapter).toContain('kind: QUIZ_ACTIVITY_REF_KIND');
    expect(adapter).toContain("findOwnedQuizForConcept");
    expect(adapter).not.toMatch(/\bQuiz\.create\b/);
    expect(adapter).not.toContain("db.quiz.create");
  });

  it("8. no duplicate ActivityAdapter interface / second evidence or mastery system introduced", () => {
    const audit = read(
      "src/lib/learning/assessment/ACTIVITY_ADAPTER_CONVERGENCE_AUDIT.md",
    );
    expect(audit).toContain(
      "Do **not** auto-create a duplicate `ActivityAdapter` interface",
    );

    const learningIndex = read("src/lib/learning/index.ts");
    expect(learningIndex).toContain("recordEvidence");
    expect(learningIndex).toContain("applyEvidenceToMastery");
    expect(learningIndex).not.toMatch(
      /recordAssessmentEvidence|AssessmentAttempt|SecondMastery/,
    );
  });
});
