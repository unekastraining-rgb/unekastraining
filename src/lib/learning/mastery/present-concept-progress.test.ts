/**
 * 2G-70 WS1 — Concept Progress presentation tests.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertPresentConceptProgressUsesUleOnly,
  conceptProgressTruthSummary,
  presentConceptProgress,
  resolveUleForConceptProgress,
} from "./present-concept-progress";
import {
  CANONICAL_ULE_MASTERY_SOURCE,
  LEGACY_TOPIC_PROGRESS_SOURCE,
} from "./mastery-truth";
import {
  ORCHESTRATOR_FACET_STRONG,
  ORCHESTRATOR_FACET_WEAK,
} from "@/lib/learning/orchestrator/diagnose";

const SRC = join(
  process.cwd(),
  "src/lib/learning/mastery/present-concept-progress.ts",
);

describe("presentConceptProgress — ConceptMastery authority", () => {
  it("uses ConceptMastery as sole authority", () => {
    const view = presentConceptProgress({
      conceptId: "c1",
      conceptTitle: "Photosynthesis",
      conceptMastery: {
        recognize: ORCHESTRATOR_FACET_STRONG,
        explain: ORCHESTRATOR_FACET_WEAK - 0.1,
        apply: 0.5,
        solve: 0,
        perform: 0,
        retain: ORCHESTRATOR_FACET_STRONG,
        confidence: 0.5,
        reviewCount: 4,
      },
    });
    expect(view.source).toBe(CANONICAL_ULE_MASTERY_SOURCE);
    expect(view.status).toBe("available");
    assertPresentConceptProgressUsesUleOnly(view);
    if (view.status !== "available") throw new Error("expected available");
    expect(view.demonstrated).toContain("Recognition");
    expect(view.demonstrated).toContain("Retention");
    expect(view.mayNeedPractice.length).toBeGreaterThan(0);
    expect(view.unknownYet).toContain("Problem solving");
  });

  it("ignores TopicMastery entirely (no silent fallback)", () => {
    const view = presentConceptProgress({
      conceptId: "c1",
      conceptMastery: null,
      topicMastery: {
        proficiency: 0.99,
        understanding: 0.99,
        recall: 0.99,
        application: 0.99,
        confidence: 0.99,
        reviewCount: 100,
      },
    });
    expect(view.status).toBe("unavailable");
    expect(view.source).toBe(CANONICAL_ULE_MASTERY_SOURCE);
    expect(view.source).not.toBe(LEGACY_TOPIC_PROGRESS_SOURCE);
  });

  it("missing evidence is truthful — not a fake zero", () => {
    const view = presentConceptProgress({
      conceptId: "c1",
      conceptTitle: "Mitosis",
      conceptMastery: {
        recognize: 0,
        explain: 0,
        apply: 0,
        solve: 0,
        perform: 0,
        retain: 0,
        confidence: 0,
        reviewCount: 0,
      },
    });
    expect(view.status).toBe("insufficient_evidence");
    if (view.status !== "insufficient_evidence") throw new Error("expected");
    expect(view.supportingLine.toLowerCase()).toContain("not the same as a score of zero");
    expect(view.dimensions.every((d) => d.status === "not_yet_evidenced")).toBe(
      true,
    );
    // No numeric scores in learner lines
    for (const d of view.dimensions) {
      expect(d.learnerLine).not.toMatch(/\d+\.\d+/);
      expect(d.learnerLine).not.toMatch(/0\.45|0\.55/);
    }
  });

  it("does not expose raw internal thresholds, attempt IDs, or payloads", () => {
    const view = presentConceptProgress({
      conceptId: "c1",
      conceptMastery: {
        recognize: 0.7,
        explain: 0.3,
        apply: 0.5,
        solve: 0.2,
        perform: 0.1,
        retain: 0.6,
        confidence: 0.4,
        reviewCount: 3,
      },
    });
    const blob = JSON.stringify(view);
    expect(blob).not.toContain("ORCHESTRATOR_FACET");
    expect(blob).not.toContain("0.45");
    expect(blob).not.toContain("0.55");
    expect(blob).not.toMatch(/attemptId|learningAttemptId/i);
    expect(blob).not.toMatch(/evidencePayload/i);
    expect(conceptProgressTruthSummary().exposesRawThresholds).toBe(false);
  });

  it("viewing creates no evidence and no mastery (pure)", () => {
    const truth = conceptProgressTruthSummary();
    expect(truth.viewingWritesEvidence).toBe(false);
    expect(truth.viewingWritesMastery).toBe(false);
    const src = readFileSync(SRC, "utf8");
    expect(src).not.toMatch(/recordEvidence|applyEvidenceToMastery|prisma\./);
  });

  it("source file never imports TopicMastery store", () => {
    const src = readFileSync(SRC, "utf8");
    expect(src).not.toMatch(/from ["'].*topic-mastery/i);
    expect(src).not.toMatch(/topicMastery\.(find|create|update|upsert)/);
    expect(src).toContain("resolveLearnerFacingUleMastery");
    expect(src).toContain("ORCHESTRATOR_FACET_WEAK");
    expect(src).toContain("ORCHESTRATOR_FACET_STRONG");
  });

  it("resolveUleForConceptProgress matches mastery-truth", () => {
    const ule = resolveUleForConceptProgress(null);
    expect(ule.status).toBe("unavailable");
    expect(ule.source).toBe(CANONICAL_ULE_MASTERY_SOURCE);
  });
});
