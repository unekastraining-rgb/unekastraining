/**
 * Phase 2G-57 — PERFORM Activity/Evidence Bridge Contract Design (inspection).
 * Freezes architectural claims from PERFORM_ACTIVITY_BRIDGE_DESIGN.md.
 * No production behavior changes.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { MASTERY_FACETS, LEARNING_OBJECT_TYPES } from "@/lib/learning/types";
import {
  buildEvidenceEnvelope,
  outcomeFromScoreRatio,
} from "@/lib/learning/evidence/envelope";
import { facetKey, applyFacetDelta, emptyFacetScores } from "@/lib/learning/mastery/facets";
import { aggregateEvidenceSignals } from "@/lib/learning/evidence/aggregate";
import { ASSESSMENT_MODES } from "@/lib/learning/assessment/assessment-mode-policy";
import { mapStudyEvaluateToLearningSignals } from "@/lib/learning/assessment/evaluate-bridge";

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("Phase 2G-57 PERFORM Activity/Evidence Bridge Contract (inspection)", () => {
  it("1. design artifact recommends Option B; no production implementation", () => {
    const design = read(
      "src/lib/learning/assessment/PERFORM_ACTIVITY_BRIDGE_DESIGN.md",
    );
    expect(design).toContain("Option B — Small additive bridge");
    expect(design).toContain("No production implementation");
    expect(design).toContain("skillFacet: \"PERFORM\"");
    expect(design).toContain("Do not implement PERFORM_GAP");
    expect(design).toContain("evidencePayloadJson");
    expect(design).toContain("sourceRefJson");
    expect(design).toMatch(/are sufficient/);
    expect(design).not.toContain("PERFORM_GAP diagnosis implemented");
  });

  it("2. existing contracts already accept PERFORM envelopes without new fields", () => {
    expect(MASTERY_FACETS).toContain("PERFORM");
    expect(LEARNING_OBJECT_TYPES).toEqual(
      expect.arrayContaining([
        "LAB",
        "CODING_CHALLENGE",
        "SIMULATION",
        "PRESENTATION_PRACTICE",
        "OTHER",
      ]),
    );

    const envelope = buildEvidenceEnvelope({
      learnerId: "learner-1",
      learningObjectId: "lo-1",
      conceptId: "concept-1",
      skillFacet: "PERFORM",
      outcome: outcomeFromScoreRatio(0.9),
      score: 0.9,
      confidence: null,
      misconceptionSignals: [],
      sourceRef: {
        kind: "performance_attempt",
        activityId: "act-1",
      },
      evidencePayload: {
        criterionRef: "crit-1",
        evaluationMethod: "structured_check",
        observedResult: { passed: true },
      },
    });

    expect(envelope.skillFacet).toBe("PERFORM");
    expect(envelope.confidence).toBeNull();
    expect(envelope.sourceRef.kind).toBe("performance_attempt");
    expect(envelope.evidencePayload?.criterionRef).toBe("crit-1");

    const mastery = applyFacetDelta(emptyFacetScores(), "PERFORM", envelope.outcome);
    expect(facetKey("PERFORM")).toBe("perform");
    expect(mastery.perform).toBeGreaterThan(0);

    const record = read("src/lib/learning/evidence/record.ts");
    expect(record).toContain("evidencePayloadJson");
    expect(record).toContain("sourceRefJson");
    expect(record).not.toMatch(/PerformanceAttempt|performCriterion/);
  });

  it("3. Evidence Intelligence + Assessment modes remain unchanged; Hands-on stays APPLY", () => {
    const now = new Date("2026-09-20T17:00:00.000Z");
    const signals = aggregateEvidenceSignals(
      [
        {
          skillFacet: "PERFORM",
          outcome: "SUCCESS",
          misconceptionSignalsJson: "[]",
          sourceRefJson: JSON.stringify({ kind: "performance_attempt" }),
          createdAt: now,
        },
      ],
      now,
    );
    expect(signals.facetOutcomes.PERFORM.successCount).toBe(1);

    expect([...ASSESSMENT_MODES]).toEqual([
      "DIAGNOSTIC",
      "VERIFICATION",
      "PRACTICE_CHECK",
    ]);

    const handsOn = mapStudyEvaluateToLearningSignals({
      mode: "six",
      sixComponent: "hands-on-practice",
    });
    expect(handsOn.skillFacet).toBe("APPLY");

    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).not.toMatch(/PERFORM_GAP|PERFORMANCE_GAP/);
  });

  it("4. Adaptive completion remains attemptId-based; adapters do not write evidence", () => {
    const coordinator = read("src/lib/learning/sequence/coordinator.ts");
    expect(coordinator).toContain("recordAdaptiveSequenceCompletion");
    expect(coordinator).toContain("attemptId");
    expect(coordinator).toContain("idempotent");

    const adapterRegistry = read(
      "src/lib/learning/assessment/adapter-registry.ts",
    );
    expect(adapterRegistry).toContain("AssessmentAdapter");
    expect(adapterRegistry).not.toMatch(/recordEvidence|applyEvidenceToMastery/);

    const schema = read("prisma/schema.prisma");
    expect(schema).not.toMatch(/model Performance(Attempt|Profile|Score)/);
  });

  it("5. Intent contract unchanged; PERFORM is facet not purpose", () => {
    const intent = read("src/lib/learning/intent/types.ts");
    expect(intent).toContain("UNDERSTAND");
    expect(intent).toContain("PRACTICE");
    expect(intent).toContain("ASSESS");
    expect(intent).toContain("CREATE");
    expect(intent).not.toMatch(/PERFORM/);

    const design = read(
      "src/lib/learning/assessment/PERFORM_ACTIVITY_BRIDGE_DESIGN.md",
    );
    expect(design).toContain("PERFORM is a mastery facet, not an intent");
  });
});
