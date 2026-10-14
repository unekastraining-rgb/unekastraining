/**
 * Phase 2G-52 — Flashcard Activity Adapter Design & Gap Inspection.
 *
 * Encodes architectural assumptions from FLASHCARD_ACTIVITY_ADAPTER_AUDIT.md.
 * No production Flashcard Assessment/Adaptive adapter is introduced.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createAssessmentAdapterRegistry } from "@/lib/learning/assessment/adapter-registry";
import { createAssessmentAdapterRegistryWithQuiz } from "@/lib/learning/assessment/quiz-assessment-adapter";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-52 Flashcard Activity Adapter (inspection/design)", () => {
  it("1. audit artifact exists with required verdict and next action", () => {
    const audit = read(
      "src/lib/learning/assessment/FLASHCARD_ACTIVITY_ADAPTER_AUDIT.md",
    );
    expect(audit).toContain("SMALL ADDITIVE BRIDGE REQUIRED");
    expect(audit).toContain("DESIGN A SMALL ADDITIVE FLASHCARD ADAPTER");
    expect(audit).toContain("No production adapter implementation");
    expect(audit).toContain("RETAIN");
    expect(audit).toContain("Option A");
    expect(audit).toContain("scheduleAuthority: \"flashcard_sm2\"");
    expect(audit).toContain("CORE→SIX→LUCKY");
  });

  it("2. flashcard-bridge remains RETAIN evidence producer; does not own SM-2", () => {
    const bridge = read("src/lib/learning/assessment/flashcard-bridge.ts");
    expect(bridge).toContain('skillFacet: "RETAIN"');
    expect(bridge).toContain("recordEvidence");
    expect(bridge).toContain("applyEvidenceToMastery");
    expect(bridge).toContain('kind: "flashcard_review"');
    expect(bridge).not.toMatch(/applySm2Review|nextReviewAt/);
    expect(bridge).not.toMatch(/AssessmentAdapter|AdaptiveSequence/);
  });

  it("3. PATCH review owns SM-2 then calls evidence + LUCKY mirror separately", () => {
    const route = read("app/api/flashcards/route.ts");
    expect(route).toContain("applySm2Review");
    expect(route).toContain("recordFlashcardReviewEvidence");
    expect(route).toContain("syncFlashcardRetentionItem");
    expect(route).toMatch(/where:\s*\{\s*id:\s*cardId,\s*userId:\s*user\.id/);
    // Order invariant: SM-2 applied before ULE bridge comment/call path exists
    expect(route.indexOf("applySm2Review")).toBeLessThan(
      route.indexOf("recordFlashcardReviewEvidence"),
    );
  });

  it("4. Flashcard AssessmentAdapter is opt-in; Adaptive flashcard bind exists (2G-54)", () => {
    expect(createAssessmentAdapterRegistry().list()).toHaveLength(0);
    expect(
      createAssessmentAdapterRegistryWithQuiz()
        .list()
        .map((a) => a.key),
    ).toEqual(["quiz"]);

    expect(
      read("src/lib/learning/assessment/flashcard-assessment-adapter.ts"),
    ).toContain("createFlashcardAssessmentAdapter");
    expect(read("src/lib/learning/sequence/index.ts")).toContain(
      "flashcard-adapter",
    );
    expect(read("src/lib/learning/sequence/index.ts")).toContain(
      "bindFlashcardReviewToAdaptiveSequence",
    );
    expect(
      read("src/lib/learning/assessment/quiz-assessment-adapter.ts"),
    ).not.toContain("flashcard");
  });

  it("5. LO identity is per flashcard; no Deck model in schema", () => {
    const ensure = read("src/lib/learning/learning-object/ensure.ts");
    expect(ensure).toContain("ensureFlashcardLearningObject");
    expect(ensure).toContain('kind: "flashcard"');
    expect(ensure).toContain('type: "FLASHCARD"');

    const schema = read("prisma/schema.prisma");
    expect(schema).toContain("model Flashcard");
    expect(schema).not.toMatch(/model FlashcardDeck|model FlashcardSession|model FlashcardAttempt/);
  });

  it("6. LUCKY mirrors SM-2; does not replace flashcard scheduling", () => {
    const bridges = read("src/lib/learning/retention/bridges.ts");
    expect(bridges).toContain("syncFlashcardRetentionItem");
    expect(bridges).toContain('sourceType: "FLASHCARD"');
    expect(bridges).toContain('scheduleAuthority: "flashcard_sm2"');
    expect(bridges).toMatch(/Flashcard SM-2 fields remain authoritative/);
  });

  it("7. primary UX is self-rate; CORE split is not the evidence path", () => {
    const view = read("app/flashcards/flashcards-view.tsx");
    expect(view).toContain("AGAIN");
    expect(view).toContain("GOOD");
    expect(view).toContain("EASY");
    expect(view).toContain('method: "PATCH"');

    const coreSplit = read("src/components/core/CoreFlashcardSplit.tsx");
    expect(coreSplit).not.toContain("recordFlashcardReviewEvidence");
    expect(coreSplit).not.toContain("/api/flashcards");
  });

  it("8. Orchestrator does not emit flashcard intervention; Assessment modes unchanged", () => {
    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    // Counts flashcard evidence sources — must not select flashcard as intervention kind
    expect(diagnose).toContain("flashcard");
    expect(diagnose).not.toMatch(/sixComponent:\s*"flashcard"|intervention:.*"flashcard"/);

    const policy = read(
      "src/lib/learning/assessment/assessment-mode-policy.ts",
    );
    expect(policy).toContain("PRACTICE_CHECK");
    expect(policy).toContain("DIAGNOSTIC");
    expect(policy).toContain("VERIFICATION");
    expect(policy).not.toContain("flashcard");
  });
});
