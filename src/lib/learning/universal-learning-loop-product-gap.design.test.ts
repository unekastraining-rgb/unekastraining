/**
 * Phase 2G-58 — Universal Learning Loop Product Gap Audit (inspection).
 * Freezes claims from UNIVERSAL_LEARNING_LOOP_PRODUCT_GAP_AUDIT.md.
 * No production behavior changes.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-58 Universal Learning Loop Product Gap (inspection)", () => {
  it("1. audit artifact exists with PASS verdict and single recommended target", () => {
    const audit = read(
      "src/lib/learning/UNIVERSAL_LEARNING_LOOP_PRODUCT_GAP_AUDIT.md",
    );
    expect(audit).toContain("No production code changes");
    expect(audit).toContain("Study-hub recommendation → Adaptive closed-loop bridge");
    expect(audit).toContain("B — SMALL ADDITIVE PRODUCT BRIDGE");
    expect(audit).toContain("2G-58 status");
    expect(audit).toContain("**PASS**");
    expect(audit).toContain("No E — ARCHITECTURAL DEFECT");
    expect(audit).toContain("No PERFORM_GAP until producer exists");
    expect(read("src/lib/learning/orchestrator/diagnose.ts")).not.toMatch(
      /PERFORM_GAP|PERFORMANCE_GAP/,
    );
  });

  it("2. hub primary CTA enters Adaptive; direct SIX remains secondary", () => {
    const card = read("src/components/study/OrchestratorSuggestionCard.tsx");
    expect(card).toContain("data-orchestrator-try-it");
    expect(card).toContain("data-orchestrator-adaptive-study");
    expect(card).toContain("/api/study/adaptive/start");
    expect(card).toContain('data-hub-primary-cta="adaptive"');
    expect(card).toContain('data-hub-secondary-cta="direct-six"');
    // Primary Adaptive precedes secondary SIX.
    expect(card.indexOf("data-orchestrator-adaptive-study")).toBeLessThan(
      card.indexOf('data-hub-secondary-cta="direct-six"'),
    );
  });

  it("3. Orchestrator presents SIX href only; assessmentHandoff is metadata", () => {
    const present = read("src/lib/learning/orchestrator/present.ts");
    expect(present).toContain("assessmentHandoff");
    expect(present).toContain("Never drives diagnosis, intervention, copy, CTA, or href");
    expect(present).toMatch(/href:\s*result\.intervention\?\.href/);

    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain('kind: "six"');
    expect(diagnose).not.toMatch(/PERFORM_GAP|PERFORMANCE_GAP/);
  });

  it("4. SIX evaluate bind skips without adaptive context; Hands-on stays APPLY", () => {
    const bind = read("src/lib/learning/sequence/six-evaluate-bind.ts");
    expect(bind).toMatch(/no_adaptive_context|no adaptive/i);

    const evaluate = read("src/lib/learning/assessment/evaluate-bridge.ts");
    expect(evaluate).toMatch(/hands-on-practice[\s\S]*skillFacet:\s*"APPLY"/);
    expect(evaluate).toMatch(/not PERFORM without a live lab/);
  });

  it("5. CORE Assist remains non-evidence; LUCKY handoff exists on Adaptive complete", () => {
    const coreAdapter = read("src/lib/learning/tutor/core-adapter.ts");
    expect(coreAdapter).toMatch(/evidenceIntent[\s\S]*none|"none"/);

    const handoff = read("src/lib/learning/sequence/lucky-handoff.ts");
    expect(handoff).toContain("syncLuckyRetentionAfterSequenceComplete");
    expect(handoff).toContain("syncWeakMasteryRetentionItem");

    const masteryTree = read("src/components/csl/MasteryTree.tsx");
    expect(masteryTree).toContain("topic.understanding");
    expect(masteryTree).toContain("TOPIC_PROGRESS_LEARNER_COPY");
    expect(masteryTree).not.toMatch(/getLearnerConceptMastery|facets\.perform/);
  });
});
