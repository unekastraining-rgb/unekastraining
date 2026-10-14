import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ACTIVITY_COVERAGE_INVENTORY,
  getActivityCoverage,
} from "@/lib/learning/activity-coverage";
import {
  ADAPTIVE_READY_ACTIVITY_KEYS,
  PRODUCT_READY_NOT_ADAPTIVE_KEYS,
} from "@/lib/learning/decision-loop";
import {
  FACET_PRODUCER_COVERAGE,
  LEARNING_ATTEMPT_PRODUCERS,
  PERFORM_COVERAGE_LIMITATION,
  listClosedEvidenceProducers,
} from "@/lib/learning/learner-model/producers";
import { isAdaptiveReadyActivityAdapterKey } from "@/lib/learning/sequence/activity-adaptive-completion";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("2P-23 Universal Activity Coverage Audit integrity", () => {
  it("CLOSED producers remain on shared LearningAttempt spine", () => {
    const closed = listClosedEvidenceProducers();
    expect(closed.length).toBeGreaterThanOrEqual(13);
    for (const p of closed) {
      expect(p.closure).toBe("CLOSED");
    }
    const ids = closed.map((p) => p.id);
    for (const id of [
      "coding",
      "sql",
      "writing",
      "lab",
      "simulation",
      "presentation",
      "game",
      "project",
      "quiz",
      "flashcard",
      "tutor",
      "lucky_retention",
      "study_evaluate",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("Simulation facet inventory includes APPLY/SOLVE/EXPLAIN (live challenge truth)", () => {
    const sim = LEARNING_ATTEMPT_PRODUCERS.find((p) => p.id === "simulation")!;
    expect([...sim.facets].sort()).toEqual(["APPLY", "EXPLAIN", "SOLVE"]);
    expect([...FACET_PRODUCER_COVERAGE.SOLVE].sort()).toEqual([
      "simulation",
      "tutor",
    ]);
    expect(FACET_PRODUCER_COVERAGE.EXPLAIN).toContain("simulation");
    expect([...(getActivityCoverage("simulation")?.facets ?? [])].sort()).toEqual([
      "APPLY",
      "EXPLAIN",
      "SOLVE",
    ]);
  });

  it("Writing/Game/Project are Adaptive-ready (2P-18 / 2P-30)", () => {
    expect(ADAPTIVE_READY_ACTIVITY_KEYS).toContain("writing");
    expect(isAdaptiveReadyActivityAdapterKey("writing")).toBe(true);
    expect(getActivityCoverage("writing")?.adaptiveReady).toBe(true);
    expect(getActivityCoverage("writing")?.status).toBe("A_FULL_ULE_LOOP");
    expect(ADAPTIVE_READY_ACTIVITY_KEYS).toContain("game");
    expect(ADAPTIVE_READY_ACTIVITY_KEYS).toContain("project");
    expect([...PRODUCT_READY_NOT_ADAPTIVE_KEYS]).toEqual([]);
    expect(getActivityCoverage("game")?.adaptiveReady).toBe(true);
    expect(getActivityCoverage("project")?.adaptiveReady).toBe(true);
  });

  it("does not invent PERFORM_GAP; limitation remains documented", () => {
    expect(PERFORM_COVERAGE_LIMITATION.orchestratorPerformGap).toBe(false);
    expect(PERFORM_COVERAGE_LIMITATION.producersExist).toBe(true);
    const diagnose = read("src/lib/learning/orchestrator/diagnose.ts");
    expect(diagnose).not.toMatch(/PERFORM_GAP/);
  });

  it("no ActivityEvidence / second mastery engines introduced", () => {
    const producers = read("src/lib/learning/learner-model/producers.ts");
    expect(producers).not.toMatch(/CodingEvidence|WritingMastery|LabEvidence/);
    expect(producers).toContain("CANONICAL_EVIDENCE_WRITE");
    const coverage = read("src/lib/learning/activity-coverage.ts");
    expect(coverage).toContain("Not a second activity registry");
  });

  it("coverage inventory Adaptive-ready keys align with decision-loop", () => {
    const fromInventory = ACTIVITY_COVERAGE_INVENTORY.filter(
      (e) =>
        e.adaptiveReady &&
        [
          "coding",
          "sql",
          "math",
          "networking",
          "language",
          "lab",
          "simulation",
          "presentation",
          "writing",
          "game",
          "project",
        ].includes(e.id),
    ).map((e) => e.id);
    for (const key of ADAPTIVE_READY_ACTIVITY_KEYS) {
      expect(fromInventory).toContain(key);
    }
  });

  it("audit documentation exists and classifies PERFORM_GAP as deferred", () => {
    const audit = read("src/lib/learning/UNIVERSAL_ACTIVITY_COVERAGE_AUDIT.md");
    expect(audit).toContain("2P-23");
    expect(audit).toContain("PERFORM_GAP");
    expect(audit).toContain("Deferred");
    expect(audit).toContain("Simulation");
    expect(audit).toContain("Writing");
    const coverage = read("src/lib/learning/UNIVERSAL_ACTIVITY_COVERAGE.md");
    expect(coverage).toMatch(/Writing[\s\S]*Adaptive-ready \(2P-18\)/);
  });

  it("domain content stays in catalogs — continuity helper has no subject engines", () => {
    const structured = read("src/lib/learning/activities/structured/service.ts");
    expect(structured).toContain("domainTag");
    expect(structured).toContain("skillFacet");
    expect(structured).not.toMatch(/class JavaLearningEngine|NursingMasteryEngine/);
  });
});
