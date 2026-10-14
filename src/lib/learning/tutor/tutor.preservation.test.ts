import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../../../..");

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

/**
 * Phase 2D-1/2D-2 preservation: existing AI surfaces must not be rewritten
 * except the flag-gated SIX Tutor route.
 */
describe("Phase 2D-1 preservation — existing AI / learning surfaces", () => {
  it("does not migrate Evaluate / Lucky through runTutor for non–Teach Me paths", () => {
    // Lucky remains unwired; evaluate is Teach Me–flagged only (blurting/six stay legacy).
    expect(read("app/api/study/lucky/route.ts")).not.toMatch(
      /runTutor|from \"@\/lib\/learning\/tutor\"/,
    );
  });

  it("keeps Orchestrator separate (Tutor does not replace diagnosis)", () => {
    const tutorService = read("src/lib/learning/tutor/service.ts");
    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(tutorService).not.toMatch(/orchestrateForConcept|orchestrateFromLearnerState/);
    expect(diagnose).not.toMatch(/runTutor|TutorMode/);
  });

  it("Tutor uses aiService, not a hard-coded vendor", () => {
    const service = read("src/lib/learning/tutor/service.ts");
    expect(service).toMatch(/aiService\.complete/);
    expect(service).not.toMatch(/new GeminiProvider|new GroqProvider|OPENAI_API_KEY/);
  });

  it("quiz / flashcard / retention bridges remain independent modules", () => {
    expect(read("src/lib/learning/assessment/quiz-bridge.ts")).toMatch(
      /recordQuizAttemptEvidence/,
    );
    expect(read("src/lib/learning/assessment/flashcard-bridge.ts")).toMatch(
      /recordFlashcardReviewEvidence/,
    );
    expect(read("src/lib/learning/retention/review.ts")).toMatch(
      /submitRetentionReview/,
    );
    const tutorIndex = read("src/lib/learning/tutor/index.ts");
    expect(tutorIndex).not.toMatch(/RetentionItem|SM-2|recordQuizAttemptEvidence/);
  });

  it("exposes facade adapters; CORE and SIX UIs are not rewritten", () => {
    const facade = read("src/lib/learning/tutor/facade.ts");
    expect(facade).toMatch(/toTutorRequestFromLegacyChat/);
    const sixUi = read("src/components/study/SixTutorChat.tsx");
    expect(sixUi).toMatch(/fetch\("\/api\/study\/six-tutor"/);
    expect(sixUi).not.toMatch(/runTutor/);
    const coreUi = read("src/components/core/CoreSourceChat.tsx");
    expect(coreUi).toMatch(/fetch\("\/api\/core\/chat"/);
    expect(coreUi).not.toMatch(/runTutor/);
  });
});
