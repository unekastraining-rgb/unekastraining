/**
 * Bundle A Phase 12 — Six Intelligence integrity.
 * Orchestrator decides WHAT; Six Intelligence recommends HOW.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  decideKnowledgeLoop,
  mapKnowledgeActionToSixComponent,
  recommendSixTechnique,
  type KnowledgeOrchestratorDecision,
} from "@/lib/learning/orchestrator/knowledge-loop";
import type { ConceptEvidenceSummary } from "@/lib/learning/orchestrator/knowledge-loop/decide";
import { resolveTeachingKnowledgeContext } from "@/lib/learning/knowledge/teaching-knowledge-context";
import "@/lib/learning/knowledge/packs";

function emptyTrace(conceptId: string | null): KnowledgeOrchestratorDecision["trace"] {
  return {
    target: "test",
    focusConceptId: conceptId,
    exposureCount: 0,
    attemptCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    hasPracticeEvidence: false,
    hasCheckEvidence: false,
    hasRecallEvidence: false,
  };
}

function decision(
  partial: Partial<KnowledgeOrchestratorDecision> &
    Pick<KnowledgeOrchestratorDecision, "action" | "reasonCode">,
): KnowledgeOrchestratorDecision {
  return {
    conceptId: "java-arraylist",
    reason: "test",
    confidence: "high",
    trace: emptyTrace(partial.conceptId ?? "java-arraylist"),
    ...partial,
  };
}

function summary(
  partial: Partial<ConceptEvidenceSummary>,
): ConceptEvidenceSummary {
  return {
    conceptId: "java-arraylist",
    exposureCount: 0,
    attemptCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    hasPracticeEvidence: false,
    hasCheckEvidence: false,
    hasRecallEvidence: false,
    ...partial,
  };
}

describe("Phase 12 — Six Intelligence", () => {
  it("new concept → chunking", () => {
    const rec = recommendSixTechnique({
      decision: decision({ action: "teach", reasonCode: "new-concept" }),
    });
    expect(rec.technique).toBe("chunking");
    expect(rec.reasonCode).toBe("new-concept-chunking");
  });

  it("incorrect concept → explanation or feynman", () => {
    const mild = recommendSixTechnique({
      decision: decision({ action: "reteach", reasonCode: "recent-incorrect" }),
      summary: summary({ lastOutcome: "incorrect", incorrectCount: 1 }),
    });
    expect(["detailed-explanation", "feynman"]).toContain(mild.technique);

    const repeated = recommendSixTechnique({
      decision: decision({ action: "reteach", reasonCode: "recent-incorrect" }),
      summary: summary({
        lastOutcome: "incorrect",
        incorrectCount: 2,
        attemptCount: 2,
      }),
    });
    expect(repeated.technique).toBe("feynman");
  });

  it("application difficulty → hands-on practice", () => {
    const rec = recommendSixTechnique({
      decision: decision({ action: "practice", reasonCode: "needs-practice" }),
      summary: summary({
        hasCheckEvidence: true,
        hasPracticeEvidence: false,
        attemptCount: 1,
      }),
    });
    expect(rec.technique).toBe("hands-on-practice");
    expect(rec.reasonCode).toBe("explain-without-apply");
  });

  it("recall need → active recall", () => {
    const rec = recommendSixTechnique({
      decision: decision({ action: "recall", reasonCode: "needs-recall" }),
    });
    expect(rec.technique).toBe("active-recall");
  });

  it("visualization case for spatial topics", () => {
    const rec = recommendSixTechnique({
      decision: decision({ action: "practice", reasonCode: "needs-practice" }),
      summary: summary({ hasPracticeEvidence: true }),
      topic: "geometry triangle diagram visualization",
    });
    expect(rec.technique).toBe("visualization");
  });

  it("repeated exposure without demonstration → feynman", () => {
    const rec = recommendSixTechnique({
      decision: decision({ action: "complete", reasonCode: "no-next-concept" }),
      summary: summary({ exposureCount: 3, correctCount: 0 }),
    });
    expect(rec.technique).toBe("feynman");
    expect(rec.reasonCode).toBe("repeated-without-demonstration");
  });

  it("deterministic results", () => {
    const input = {
      decision: decision({ action: "teach", reasonCode: "new-concept" }),
    };
    expect(recommendSixTechnique(input)).toEqual(recommendSixTechnique(input));
  });

  it("recommendation failure falls back safely", () => {
    const bad = {
      action: "teach",
      reasonCode: "new-concept",
      conceptId: null,
      reason: "x",
      confidence: "high",
      trace: null as unknown as KnowledgeOrchestratorDecision["trace"],
    } as KnowledgeOrchestratorDecision;
    // Accessing decision fields still works; ensure no throw for odd inputs.
    const rec = recommendSixTechnique({ decision: bad });
    expect(rec.technique).toBeTruthy();
    expect(rec.confidence).toBeTruthy();
  });

  it("Orchestrator and Six remain separate", () => {
    const ctx = resolveTeachingKnowledgeContext("ArrayList in Java")!;
    const orch = decideKnowledgeLoop({
      target: "ArrayList in Java",
      knowledge: ctx,
      statesByConceptId: new Map(),
      evidence: [],
    });
    expect(orch.action).toBe("teach");
    const six = recommendSixTechnique({ decision: orch });
    expect(six.technique).toBe("chunking");
    expect(six.orchestratorAction).toBe(orch.action);
    // Mapping helper does not replace decideKnowledgeLoop.
    expect(mapKnowledgeActionToSixComponent("practice")).toBe(
      "hands-on-practice",
    );
    expect(mapKnowledgeActionToSixComponent("recall")).toBe("active-recall");
  });

  it("Six intelligence module is separate from decideKnowledgeLoop", () => {
    const decideSrc = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/orchestrator/knowledge-loop/decide.ts",
      ),
      "utf8",
    );
    const sixSrc = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/learning/orchestrator/knowledge-loop/six-intelligence.ts",
      ),
      "utf8",
    );
    expect(decideSrc).not.toContain("recommendSixTechnique");
    expect(sixSrc).toContain("recommendSixTechnique");
    expect(sixSrc).toMatch(/[Dd]oes not replace/);
  });
});
