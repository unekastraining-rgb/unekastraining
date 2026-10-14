/**
 * Phase 2G-56 — PERFORM Mastery & Evidence Gap Audit (inspection).
 * Freezes architectural claims from PERFORM_MASTERY_EVIDENCE_AUDIT.md.
 * No production behavior changes.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { MASTERY_FACETS } from "@/lib/learning/types";
import { facetKey, applyFacetDelta, emptyFacetScores } from "@/lib/learning/mastery/facets";
import { mapStudyEvaluateToLearningSignals } from "@/lib/learning/assessment/evaluate-bridge";
import { facetForTutorEvidence } from "@/lib/learning/tutor/evidence";
import { aggregateEvidenceSignals } from "@/lib/learning/evidence/aggregate";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-56 PERFORM Mastery & Evidence Gap (inspection)", () => {
  it("1. audit artifact exists with readiness + classifications", () => {
    const audit = read(
      "src/lib/learning/assessment/PERFORM_MASTERY_EVIDENCE_AUDIT.md",
    );
    expect(audit).toContain(
      "YES, with a small additive activity/evidence bridge",
    );
    expect(audit).toContain("NO CHANGE REQUIRED");
    expect(audit).toContain("SMALL ADDITIVE BRIDGE REQUIRED");
    expect(audit).toContain("LARGER FUTURE FEATURE");
    expect(audit).toContain("INTENTIONALLY DIFFERENT");
    expect(audit).toContain("APPLY ≠ PERFORM");
    expect(audit).toContain("PERFORM ≠ confidence");
    expect(audit).toContain("No production code changes");
  });

  it("2. PERFORM is a first-class mastery facet with persistence mapping", () => {
    expect(MASTERY_FACETS).toEqual([
      "RECOGNIZE",
      "EXPLAIN",
      "APPLY",
      "SOLVE",
      "PERFORM",
      "RETAIN",
    ]);
    expect(facetKey("PERFORM")).toBe("perform");

    const schema = read("prisma/schema.prisma");
    expect(schema).toMatch(/enum MasteryFacet[\s\S]*PERFORM/);
    expect(schema).toMatch(/model ConceptMastery[\s\S]*perform\s+Float/);
    expect(schema).toMatch(/model LearningAttempt[\s\S]*skillFacet\s+MasteryFacet/);

    const after = applyFacetDelta(emptyFacetScores(), "PERFORM", "SUCCESS");
    expect(after.perform).toBeGreaterThan(0);
    expect(after.confidence).toBeGreaterThan(0);
  });

  it("3. Evidence Intelligence aggregates PERFORM; no production writer uses it", () => {
    const now = new Date("2026-09-20T12:00:00.000Z");
    const signals = aggregateEvidenceSignals(
      [
        {
          skillFacet: "PERFORM",
          outcome: "SUCCESS",
          misconceptionSignalsJson: "[]",
          sourceRefJson: JSON.stringify({ kind: "test_perform" }),
          createdAt: now,
        },
      ],
      now,
    );
    expect(signals.facetOutcomes.PERFORM.successCount).toBe(1);
    expect(signals.facetOutcomes.PERFORM.attemptCount).toBe(1);

    // Production bridges must not claim PERFORM.
    const evaluate = read("src/lib/learning/assessment/evaluate-bridge.ts");
    expect(evaluate).toContain('skillFacet: "APPLY"');
    expect(evaluate).toMatch(/not PERFORM without a live lab/);
    expect(evaluate).not.toMatch(/skillFacet:\s*["']PERFORM["']/);

    const quiz = read("src/lib/learning/assessment/quiz-bridge.ts");
    expect(quiz).toContain('skillFacet: "RECOGNIZE"');
    expect(quiz).not.toMatch(/skillFacet:\s*["']PERFORM["']/);

    const flash = read("src/lib/learning/assessment/flashcard-bridge.ts");
    expect(flash).toContain('skillFacet: "RETAIN"');
    expect(flash).not.toMatch(/skillFacet:\s*["']PERFORM["']/);

    const tutor = read("src/lib/learning/tutor/evidence.ts");
    expect(tutor).not.toMatch(/["']PERFORM["']/);
  });

  it("4. Hands-on Practice → APPLY; Tutor never maps to PERFORM", () => {
    const handsOn = mapStudyEvaluateToLearningSignals({
      mode: "six",
      sixComponent: "hands-on-practice",
    });
    expect(handsOn.skillFacet).toBe("APPLY");
    expect(handsOn.type).toBe("HANDS_ON_PRACTICE");

    const viz = mapStudyEvaluateToLearningSignals({
      mode: "six",
      sixComponent: "visualization",
    });
    expect(viz.skillFacet).toBe("EXPLAIN");

    expect(facetForTutorEvidence("explain")).toBe("EXPLAIN");
    expect(facetForTutorEvidence("apply")).toBe("APPLY");
    expect(facetForTutorEvidence("solve")).toBe("SOLVE");
    expect(facetForTutorEvidence("practice_answer")).toBe("APPLY");
    expect(facetForTutorEvidence("guided_task")).toBe("APPLY");
  });

  it("5. Orchestrator under-consumes PERFORM (no PERFORM_GAP; APPLICATION uses apply)", () => {
    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).toContain("facets.perform");
    expect(diagnose).toContain("APPLICATION_GAP");
    expect(diagnose).not.toMatch(/PERFORM_GAP|PERFORMANCE_GAP/);
    expect(diagnose).toMatch(/facets\.apply\s*<\s*WEAK/);

    const prereq = read("src/lib/learning/orchestrator/prerequisites.ts");
    expect(prereq).toMatch(/recognize.*explain.*apply.*retain/);
    expect(prereq).not.toMatch(/facets\.perform/);
  });

  it("6. No Performance* models; Adaptive/Assessment remain facet-ready without PERFORM mode", () => {
    const schema = read("prisma/schema.prisma");
    expect(schema).not.toMatch(/model Performance(Profile|Attempt|Score)/);
    expect(schema).not.toMatch(/model SkillPerformance/);

    const modes = read(
      "src/lib/learning/assessment/assessment-mode-policy.ts",
    );
    expect(modes).toContain("DIAGNOSTIC");
    expect(modes).toContain("VERIFICATION");
    expect(modes).toContain("PRACTICE_CHECK");
    expect(modes).not.toMatch(/PERFORM/);

    const coordinator = read("src/lib/learning/sequence/coordinator.ts");
    expect(coordinator).toContain("attemptId");
  });
});
